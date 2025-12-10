// src/searchEngine.mjs
import Fuse from "fuse.js";
import { normalize } from "./googleSheets.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* -------------------------------------------------------------------------- */
/*  RUTA Y CARGA DEL DICCIONARIO FIRM_DICTIONARY                              */
/* -------------------------------------------------------------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let FIRM_DICTIONARY = {};
try {
    // 👉 Si tu JSON está en src/data, usa:
    // const dictPath = path.join(__dirname, "data", "firmDictionary.json");
    const dictPath = path.join(__dirname, "../data/firmDictionary.json");
    const raw = fs.readFileSync(dictPath, "utf8");
    FIRM_DICTIONARY = JSON.parse(raw);
    console.log(
        "📚 firmDictionary cargado. Entradas:",
        Object.keys(FIRM_DICTIONARY).length
    );
} catch (err) {
    console.warn(
        "⚠️ No se pudo cargar firmDictionary.json. Búsqueda seguirá funcionando pero sin diccionario IA.",
        err.message
    );
    FIRM_DICTIONARY = {};
}

/* -------------------------------------------------------------------------- */
/*  MAPA DE SINÓNIMOS CONSTRUIDO A PARTIR DEL DICCIONARIO                     */
/* -------------------------------------------------------------------------- */

/**
 * Toma un arreglo de strings y lo “explota” en términos individuales,
 * separando por "/", "," (por ejemplos: "compliance / cumplimiento").
 */
function explodeStrings(arr) {
    const out = [];
    (arr || []).forEach((str) => {
        String(str || "")
            .split(/[\/,]/)
            .forEach((piece) => {
                const trimmed = piece.trim();
                if (trimmed) out.push(trimmed);
            });
    });
    return out;
}

/**
 * Mapa: término normalizado -> conjunto de términos relacionados (mismo grupo).
 */
const termExpansionMap = new Map();

function addTermGroup(terms) {
    const normTerms = terms
        .map((t) => normalize(t))
        .filter(Boolean);

    normTerms.forEach((t) => {
        if (!termExpansionMap.has(t)) {
            termExpansionMap.set(t, new Set());
        }
        normTerms.forEach((other) => {
            termExpansionMap.get(t).add(other);
        });
    });
}

// Construimos el mapa a partir de FIRM_DICTIONARY
for (const key of Object.keys(FIRM_DICTIONARY)) {
    const entry = FIRM_DICTIONARY[key] || {};
    const groupTerms = [
        ...explodeStrings(entry.keywords || []),
        ...explodeStrings(entry.synonyms || []),
        ...explodeStrings(entry.categories || []),
    ];
    if (groupTerms.length) {
        addTermGroup(groupTerms);
    }
}

/* -------------------------------------------------------------------------- */
/*  DICCIONARIO MANUAL DE SINÓNIMOS (REGLAS ESPECÍFICAS)                      */
/* -------------------------------------------------------------------------- */

/**
 * Diccionario simple de sinónimos / expansiones de consulta (manual).
 */
const QUERY_SYNONYMS = [
    {
        match: ["ciclo integral de inversion de riesgo"],
        expand: [
            "venture capital",
            "private equity",
            "financiamiento",
            "early stage",
            "growth capital",
        ],
    },
    {
        match: ["tecnologia", "tecnología", "tech"],
        expand: [
            "technology",
            "it",
            "digital",
            "software",
            "data",
            "cybersecurity",
            "fintech",
        ],
    },
    {
        match: ["medio ambiente", "ambiental", "sostenible", "sustentable"],
        expand: ["environment", "environmental", "esg", "sustainability"],
    },
    {
        match: ["banca", "banco", "financiero"],
        expand: ["banking", "finance", "financial services"],
    },
    {
        match: ["extractivos", "mineria", "minería"],
        expand: ["mining", "natural resources", "project finance"],
    },
];

/* -------------------------------------------------------------------------- */
/*  EXPANSIÓN DE CONSULTA (MANUAL + DICCIONARIO IA)                          */
/* -------------------------------------------------------------------------- */

/**
 * Añade al array `expanded` todos los términos relacionados encontrados
 * en `termExpansionMap` para un término dado.
 */
function addDictionaryExpansions(expanded, term) {
    const key = normalize(term);
    const set = termExpansionMap.get(key);
    if (!set) return;
    set.forEach((val) => expanded.push(val));
}

/**
 * Expande una consulta con:
 *  - reglas manuales (QUERY_SYNONYMS)
 *  - diccionario IA (FIRM_DICTIONARY -> termExpansionMap)
 */
function expandQuery(query) {
    const qNorm = normalize(query);
    let expanded = [qNorm];

    // 1) Reglas manuales
    QUERY_SYNONYMS.forEach((rule) => {
        const matches = rule.match.map((m) => normalize(m));
        if (matches.some((m) => qNorm.includes(m))) {
            expanded = expanded.concat(rule.expand.map((e) => normalize(e)));
        }
    });

    // 2) Diccionario IA - coincidencia por frase completa
    addDictionaryExpansions(expanded, qNorm);

    // 3) Diccionario IA - coincidencia por palabras individuales
    qNorm.split(/\s+/)
        .filter((w) => w.length >= 3)
        .forEach((w) => addDictionaryExpansions(expanded, w));

    // Eliminamos duplicados
    return Array.from(new Set(expanded));
}

/* -------------------------------------------------------------------------- */
/*  ÍNDICE FUSE.JS (CON CAMPOS NORMALIZADOS)                                  */
/* -------------------------------------------------------------------------- */

/**
 * Construye el índice Fuse.js.
 */
export function buildFuseIndex(firms) {
    // Creamos campos normalizados para buscar de forma consistente
    const normalizedFirms = firms.map((f) => ({
        ...f,
        firmNorm: normalize(f.firm),
        areaNorm: normalize(f.area),
        descriptionNorm: normalize(f.description),
        tagsTextNorm: normalize(f.tagsText),
    }));

    const options = {
        includeScore: true,
        threshold: 0.4,
        distance: 200,
        minMatchCharLength: 2,
        useExtendedSearch: false,
        keys: [
            { name: "firmNorm", weight: 0.5 },
            { name: "areaNorm", weight: 0.2 },
            { name: "descriptionNorm", weight: 0.3 },
            { name: "tagsTextNorm", weight: 0.8 },
        ],
    };

    return new Fuse(normalizedFirms, options);
}

/* -------------------------------------------------------------------------- */
/*  ORDEN POR RANKING + BOOST                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 🔹 Orden numérico de ranking (para ordenar resultados).
 * 1 = Excelente, 2 = Bueno, 3 = Medio, 4 = Bajo, 5 = Sin ranking.
 */
function getRankOrder(ranked) {
    if (ranked === 1) return 1; // Excelente
    if (ranked === 2) return 2; // Bueno
    if (ranked === 3) return 3; // Medio
    if (ranked >= 4) return 4; // Bajo
    return 5; // Sin ranking / undefined
}

/**
 * Ajusta el score de Fuse según el RANKED.
 */
function applyRankBoost(results) {
    return results.map((r) => {
        const ranked = r.item.ranked;
        const baseScore = r.score ?? 0.5;

        let rankFactor = 1;
        if (ranked === 1) rankFactor = 0.7;
        else if (ranked === 2 || ranked === 3) rankFactor = 0.9;
        else if (ranked >= 4) rankFactor = 1.1;

        const adjustedScore = baseScore * rankFactor;

        return {
            ...r,
            adjustedScore,
        };
    });
}

/* -------------------------------------------------------------------------- */
/*  BÚSQUEDA SEMÁNTICA                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Búsqueda semántica (query + sinónimos) sobre Fuse, ajustada por ranking.
 */
export function semanticSearch(fuse, query, limit = 30) {
    if (!query || !query.trim()) return [];

    const expanded = expandQuery(query);
    const searchText = expanded.join(" ");

    const fuseResults = fuse.search(searchText);
    const boosted = applyRankBoost(fuseResults);

    // Ordenar por ranking (mejor a peor) y luego por score
    const sorted = boosted
        .map((r) => ({
            ...r,
            rankOrder: getRankOrder(r.item.ranked),
        }))
        .sort((a, b) => {
            if (a.rankOrder !== b.rankOrder) {
                return a.rankOrder - b.rankOrder;
            }
            return (a.adjustedScore ?? 1) - (b.adjustedScore ?? 1);
        })
        .slice(0, limit);

    return sorted.map((r) => {
        const score = r.adjustedScore ?? 0.7;
        const clamped = Math.max(0, Math.min(score, 1));
        const relevance = Math.round((1 - clamped) * 100);

        return {
            id: r.item.id,
            score,
            relevance,
            ...r.item,
        };
    });
}

/* -------------------------------------------------------------------------- */
/*  TAGS RÁPIDOS                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Tags rápidos: los más frecuentes en todas las firmas.
 */
export function getQuickTags(firms, maxTags = 30) {
    const freq = new Map();

    firms.forEach((f) => {
        (f.tags || []).forEach((t) => {
            const tag = t.trim();
            if (!tag) return;
            freq.set(tag, (freq.get(tag) || 0) + 1);
        });
    });

    const sorted = Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxTags)
        .map(([tag, count]) => ({ tag, count }));

    return sorted;
}

/* -------------------------------------------------------------------------- */
/*  BÚSQUEDA POR TAG EXACTO                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Búsqueda por tag exacto (case-insensitive, normalizado).
 */
export function searchByTag(firms, tag) {
    const target = normalize(tag);

    const results = firms
        .filter((f) => (f.tagsNormalized || []).includes(target))
        .map((f) => ({
            id: f.id,
            ...f,
            relevance: 100,
        }));

    // Ordenar también aquí por ranking (Excelente → Sin ranking)
    results.sort((a, b) => getRankOrder(a.ranked) - getRankOrder(b.ranked));

    return results;
}
