// src/searchEngine.mjs
import Fuse from "fuse.js";
import { normalize } from "./googleSheets.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ========================================================================== */
/*  CONFIGURACIÓN Y CARGA DEL DICCIONARIO                                     */
/* ========================================================================== */

let FIRM_DICTIONARY = {};
try {
    const dictPath = path.join(__dirname, "../data/firmDictionary2.json");
    const raw = fs.readFileSync(dictPath, "utf8");
    FIRM_DICTIONARY = JSON.parse(raw);
    console.log("📚 firmDictionary2 cargado. Entradas:", Object.keys(FIRM_DICTIONARY).length);
} catch (err) {
    console.warn("⚠️ No se pudo cargar firmDictionary.json. Búsqueda seguirá funcionando pero sin diccionario IA.", err.message);
    FIRM_DICTIONARY = {};
}

/* ========================================================================== */
/*  SISTEMA DE SINÓNIMOS Y EXPANSIÓN DE CONSULTAS                            */
/* ========================================================================== */

/**
 * Explota strings separados por "/" o "," en términos individuales
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
 * Mapa de expansión de términos: término normalizado -> conjunto de términos relacionados
 */
const termExpansionMap = new Map();

function addTermGroup(terms) {
    const normTerms = terms.map((t) => normalize(t)).filter(Boolean);

    normTerms.forEach((t) => {
        if (!termExpansionMap.has(t)) {
            termExpansionMap.set(t, new Set());
        }
        normTerms.forEach((other) => {
            termExpansionMap.get(t).add(other);
        });
    });
}

// Construir mapa desde el diccionario
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

/**
 * Diccionario manual de sinónimos para casos específicos
 *
 * Nota: deja esto como tu base; se puede expandir o cargar dinámicamente después.
 */
const QUERY_SYNONYMS = [
    {
        match: ["ciclo integral de inversion de riesgo", "venture capital", "capital de riesgo"],
        expand: ["venture capital", "private equity", "financiamiento", "early stage", "growth capital", "inversion", "capital emprendedor"],
    },
    {
        match: ["tecnologia", "tecnología", "tech", "software", "computador"],
        expand: ["technology", "it", "digital", "software", "data", "cybersecurity", "fintech", "informática", "computer", "sistemas"],
    },
    {
        match: ["medio ambiente", "ambiental", "sostenible", "sustentable", "ecologia"],
        expand: ["environment", "environmental", "esg", "sustainability", "ecology", "climate", "green", "renewable"],
    },
    {
        match: ["banca", "banco", "financiero", "finance"],
        expand: ["banking", "finance", "financial services", "bank", "credit", "loans", "credito"],
    },
    {
        match: ["extractivos", "mineria", "minería", "mining"],
        expand: ["mining", "natural resources", "project finance", "oil", "gas", "petroleum", "petroleo"],
    },
    {
        match: ["criminal", "penal", "delito"],
        expand: ["criminal law", "criminal defense", "penal", "delitos", "litigation", "white collar"],
    },
    {
        match: ["energia", "energía", "energy", "electricidad", "electric"],
        expand: ["energy", "power", "electricity", "renewable", "oil", "gas", "utilities", "grid", "solar", "wind"],
    },
    {
        match: ["laboral", "trabajo", "employment", "labor"],
        expand: ["labor", "employment", "workplace", "hr", "human resources", "trabajadores", "sindical"],
    },
    {
        match: ["propiedad intelectual", "ip", "intellectual property", "patentes"],
        expand: ["intellectual property", "ip", "patents", "trademark", "copyright", "marca", "patente"],
    },
    {
        match: ["impuestos", "tributario", "tax", "fiscal"],
        expand: ["tax", "taxation", "fiscal", "impuestos", "tributario", "iva", "vat"],
    },
];

/**
 * Añade expansiones del diccionario IA para un término dado
 */
function addDictionaryExpansions(expanded, term) {
    const key = normalize(term);
    const set = termExpansionMap.get(key);
    if (!set) return;
    set.forEach((val) => expanded.push(val));
}

/**
 * Expande una consulta con sinónimos manuales y del diccionario IA
 * @param {string} query - Consulta del usuario
 * @returns {Array<string>} - Array de términos expandidos (normalizados)
 */
export function expandQuery(query) {
    if (!query || !String(query).trim()) return [];

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

    // 3) Diccionario IA - coincidencia por palabras individuales (≥3 caracteres)
    qNorm.split(/\s+/)
        .filter((w) => w.length >= 3)
        .forEach((w) => addDictionaryExpansions(expanded, w));

    // 4) simple stemming / variantes (singular/plural simple)
    const stems = qNorm.split(/\s+/).map((tok) => {
        if (tok.endsWith("es") && tok.length > 3) return tok.slice(0, -2);
        if (tok.endsWith("s") && tok.length > 3) return tok.slice(0, -1);
        return tok;
    });
    expanded = expanded.concat(stems);

    // Eliminar duplicados y normalizar
    return Array.from(new Set(expanded.map((t) => normalize(t))));
}

/* ========================================================================== */
/*  CONSTRUCCIÓN DEL ÍNDICE FUSE.JS                                           */
/* ========================================================================== */

/**
 * Construye el índice Fuse.js con campos normalizados
 * @param {Array} firms - Array de firmas
 * @returns {Fuse} - Índice Fuse.js
 */
export function buildFuseIndex(firms) {
    const normalizedFirms = firms.map((f) => ({
        ...f,
        firmNorm: normalize(f.firm || f.name || ""),
        areaNorm: normalize(f.area || ""),
        descriptionNorm: normalize(String(f.description || "")).slice(0, 300), // TRUNCATE for perf
        tagsTextNorm: normalize(f.tagsText || (Array.isArray(f.tags) ? f.tags.join(" ") : "")),
        tagsNormalized: (f.tags || []).map((t) => normalize(String(t || ""))),
        countryNorm: normalize(f.country || ""),
        regionNorm: normalize(f.region || ""),
        nameNorm: normalize(f.name || f.firm || ""),
    }));

    const options = {
        includeScore: true,
        includeMatches: true, // Activar matches para explainability
        threshold: 0.38, // slightly stricter -> less noise
        distance: 120, // reduced for performance (was 300)
        minMatchCharLength: 2,
        ignoreLocation: true,
        useExtendedSearch: true, // allow advanced patterns if needed
        keys: [
            { name: "nameNorm", weight: 0.6 },
            { name: "firmNorm", weight: 0.5 },
            { name: "tagsNormalized", weight: 1.0 }, // high weight to tags
            { name: "areaNorm", weight: 0.35 },
            { name: "descriptionNorm", weight: 0.25 },
            { name: "countryNorm", weight: 0.15 },
            { name: "regionNorm", weight: 0.1 },
        ],
    };

    return new Fuse(normalizedFirms, options);
}

/* ========================================================================== */
/*  SISTEMA DE RANKING Y BOOST                                                */
/* ========================================================================== */

/**
 * Orden numérico de ranking (menor es mejor)
 * 1 = Excelente, 2 = Bueno, 3 = Medio, 4+ = Bajo, 0/undefined = Sin ranking
 */
function getRankOrder(ranked) {
    if (ranked === 1) return 1;
    if (ranked === 2) return 2;
    if (ranked === 3) return 3;
    if (ranked >= 4) return 4;
    return 5; // Sin ranking
}

/**
 * Aplica boost al score basado en el ranking de la firma
 * Nota: Fuse score es distancia; valores más pequeños -> mejor
 */
function applyRankBoostItem(baseScore, ranked) {
    let factor = 1;
    if (ranked === 1) factor = 0.7;
    else if (ranked === 2) factor = 0.9;
    else if (ranked === 3) factor = 0.95;
    else if (ranked >= 4) factor = 1.1;
    return baseScore * factor;
}

/* ========================================================================== */
/*  CACHE PARA CONSULTAS FRECUENTES                                            */
/* ========================================================================== */

// Simple cache in-memory. Optionally add TTL invalidation.
const CACHE = new Map();
// Example TTL mechanism (uncomment to enable TTL)
// const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
// function setCache(key, value) {
//   CACHE.set(key, { ts: Date.now(), value });
// }
// function getCache(key) {
//   const r = CACHE.get(key);
//   if (!r) return null;
//   if (Date.now() - r.ts > CACHE_TTL_MS) { CACHE.delete(key); return null; }
//   return r.value;
// }

/* ========================================================================== */
/*  GENERACIÓN DE EXPLICACIONES (EXPLAINABILITY)                              */
/* ========================================================================== */

/**
 * Genera explicación detallada de por qué un resultado es relevante
 * @param {Object} fuseResult - Resultado de Fuse.js con matches
 * @param {Array<string>} expandedTerms - Términos expandidos de la consulta
 * @returns {Object} - Objeto con matchedFields, matchedTerms, explanation
 */
function generateExplanation(fuseResult, expandedTerms) {
    const matches = fuseResult.matches || [];
    const matchedFields = new Set();
    const matchedTerms = new Set();

    // Mapeo de campos normalizados a nombres legibles
    const fieldNames = {
        firmNorm: "nombre de firma",
        areaNorm: "área de práctica",
        descriptionNorm: "descripción",
        tagsTextNorm: "tags/especialidades",
        tagsNormalized: "tags/especialidades",
        countryNorm: "país",
        regionNorm: "región",
        nameNorm: "nombre",
    };

    matches.forEach((match) => {
        const fieldName = fieldNames[match.key] || match.key;
        matchedFields.add(fieldName);

        // Intentar identificar qué términos específicos coincidieron
        // match.value suele ser el valor del campo; lo normalizamos y comprobamos tokens
        const val = normalize(String(match.value || ""));
        expandedTerms.forEach((term) => {
            if (!term) return;
            const tn = normalize(term);
            if (val.includes(tn)) {
                matchedTerms.add(term);
            }
        });
    });

    // Construir explicación legible
    const fieldList = Array.from(matchedFields);
    const termList = Array.from(matchedTerms).slice(0, 5); // Limitar a 5 términos

    let explanation = "Coincide en: " + (fieldList.length ? fieldList.join(", ") : "campo(s) indefinido(s)");

    if (termList.length > 0) {
        explanation += ` | Términos: ${termList.join(", ")}`;
    }

    if (fuseResult.item && fuseResult.item.ranked && fuseResult.item.ranked <= 3) {
        const rankLabels = { 1: "Excelente", 2: "Bueno", 3: "Medio" };
        explanation += ` | Ranking: ${rankLabels[fuseResult.item.ranked]}`;
    }

    return {
        matchedFields: Array.from(matchedFields),
        matchedTerms: Array.from(matchedTerms),
        explanation,
    };
}

/* ========================================================================== */
/*  UTIL: detectar matchedTerms por campos para mejorar matchedTerms           */
/* ========================================================================== */
function detectMatchedTerms(item, expandedTerms = []) {
    const matched = new Set();
    const fields = ["firm", "name", "country", "area", "description", "tagsText", "tags", "tagsNormalized"];
    expandedTerms.forEach((t) => {
        const tn = normalize(String(t));
        for (const f of fields) {
            const val = item[f];
            if (val === undefined || val === null) continue;
            if (Array.isArray(val)) {
                if (val.map(x => normalize(String(x || ""))).some(x => x.includes(tn))) matched.add(t);
            } else {
                if (normalize(String(val)).includes(tn)) matched.add(t);
            }
        }
    });
    return Array.from(matched);
}

/* ========================================================================== */
/*  BÚSQUEDA SEMÁNTICA PRINCIPAL                                              */
/* ========================================================================== */

/**
 * Búsqueda semántica con expansión de sinónimos y explainability
 * Compatibilidad:
 * - semanticSearch(fuse, query, limit)  <-- firma esperada por tu server
 *
 * Implementación optimizada:
 * - Expande la query en tokens/sinónimos
 * - Realiza búsquedas por token (OR) limitando resultados por token
 * - Combina resultados sin duplicados
 * - Cachea por query normalizada
 */
export function semanticSearch(fuse, query, limit = 30) {
    if (!query || !String(query).trim()) return [];

    const t0 = Date.now();
    const qNorm = normalize(String(query));
    // CACHE simple (sin TTL por defecto)
    if (CACHE.has(qNorm)) {
        // console.log("cache hit for", qNorm);
        return CACHE.get(qNorm);
    }

    // 1) expansion
    const expanded = expandQuery(query);
    // Si por alguna razón expandQuery devuelve vacío, caer de vuelta a qNorm
    if (!expanded || expanded.length === 0) expanded.push(qNorm);

    // 2) multi-term search (OR logic) para evitar explosión combinatoria
    const seen = new Set();
    const combined = [];
    // Limitar resultados por término para evitar latencia
    const perTermLimit = 50;

    for (const term of expanded) {
        if (!term || term.length < 2) continue;
        try {
            // Buscamos por cada término suelto
            const r = fuse.search(term, { limit: perTermLimit });
            for (const item of r) {
                const id = item.item && (item.item.id ?? item.item._id ?? null);
                if (!id) continue;
                if (!seen.has(id)) {
                    seen.add(id);
                    combined.push({
                        score: item.score,
                        item: item.item,
                        matches: item.matches || [],
                        matchedByTerm: term,
                    });
                } else {
                    // Si ya vimos este id, opcionalmente actualizar si esta instancia tiene mejor score
                    // (mejor score es menor en Fuse)
                    // buscaremos y actualizaríamos si es mejor
                    const idx = combined.findIndex(c => (c.item.id ?? c.item._id) === id);
                    if (idx >= 0) {
                        if ((item.score ?? 1) < (combined[idx].score ?? 1)) {
                            combined[idx].score = item.score;
                            combined[idx].matches = item.matches || combined[idx].matches;
                            combined[idx].matchedByTerm = term;
                        }
                    }
                }
            }
        } catch (err) {
            console.warn("Fuse search error for term:", term, err && err.message);
            continue;
        }
    }

    // 3) aplicar boost por ranking y armar explainability
    const withBoost = combined.map((r) => {
        const baseScore = typeof r.score === "number" ? r.score : 0.8;
        const adjusted = applyRankBoostItem(baseScore, r.item.ranked);
        const matchedTerms = detectMatchedTerms(r.item, expanded);
        const explanationObj = generateExplanation(r, expanded);
        return {
            id: r.item.id,
            item: r.item,
            score: adjusted,
            relevance: Math.round((1 - Math.max(0, Math.min(adjusted, 1))) * 100),
            matchedFields: explanationObj.matchedFields,
            matchedTerms: matchedTerms,
            explanation: explanationObj.explanation,
        };
    });

    // 4) ordenar por ranking (mejores ranked primero) luego por score asc (Fuse score = distancia)
    withBoost.sort((a, b) => {
        const ra = getRankOrder(a.item.ranked);
        const rb = getRankOrder(b.item.ranked);
        if (ra !== rb) return ra - rb;
        return (a.score ?? 1) - (b.score ?? 1);
    });

    const top = withBoost.slice(0, limit).map((r) => ({
        id: r.id,
        firm: r.item.firm || r.item.name || "",
        country: r.item.country || "",
        region: r.item.region || "",
        area: r.item.area || "",
        description: r.item.description || "",
        tags: r.item.tags || [],
        ranked: r.item.ranked,
        score: Number((r.score ?? 0).toFixed(6)),
        relevance: r.relevance,
        matchedFields: r.matchedFields,
        matchedTerms: r.matchedTerms,
        explanation: r.explanation,
    }));

    // 5) cache result
    CACHE.set(qNorm, top);
    const took = Date.now() - t0;
    // console.log(`semanticSearch "${query}" -> ${top.length} results (took ${took} ms, expanded ${expanded.length})`);
    return top;
}

/* ========================================================================== */
/*  TAGS RÁPIDOS                                                              */
/* ========================================================================== */

/**
 * Obtiene los tags más frecuentes
 */
export function getQuickTags(firms, maxTags = 30) {
    const freq = new Map();

    firms.forEach((f) => {
        (f.tags || []).forEach((t) => {
            const tag = String(t || "").trim();
            if (!tag) return;
            const norm = normalize(tag);
            freq.set(norm, (freq.get(norm) || 0) + 1);
        });
    });

    const sorted = Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxTags)
        .map(([tag, count]) => ({ tag, count }));

    return sorted;
}

/* ========================================================================== */
/*  BÚSQUEDA POR TAG EXACTO                                                   */
/* ========================================================================== */

/**
 * Búsqueda por tag exacto (normalizado)
 */
export function searchByTag(firms, tag) {
    if (!tag) return [];
    const target = normalize(tag);

    const results = (firms || [])
        .filter((f) => (f.tagsNormalized || []).includes(target))
        .map((f) => ({
            id: f.id,
            ...f,
            relevance: 100,
            matchedFields: ["tags"],
            matchedTerms: [tag],
            explanation: `Coincidencia exacta con tag: ${tag}`,
        }));

    // Ordenar por ranking
    results.sort((a, b) => getRankOrder(a.ranked) - getRankOrder(b.ranked));

    return results;
}

/* ========================================================================== */
/*  FUNCIONES DE UTILIDAD PARA TESTING                                        */
/* ========================================================================== */

/**
 * Obtiene estadísticas del índice
 */
export function getIndexStats(firms) {
    const stats = {
        totalFirms: Array.isArray(firms) ? firms.length : 0,
        firmsWithTags: Array.isArray(firms) ? firms.filter((f) => (f.tags || []).length > 0).length : 0,
        firmsWithRanking: Array.isArray(firms) ? firms.filter((f) => f.ranked && f.ranked > 0).length : 0,
        uniqueTags: Array.isArray(firms) ? new Set(firms.flatMap((f) => f.tags || [])).size : 0,
        uniqueCountries: Array.isArray(firms) ? new Set(firms.map((f) => f.country)).size : 0,
        uniqueAreas: Array.isArray(firms) ? new Set(firms.flatMap((f) => f.areas || [])).size : 0,
        rankingDistribution: {},
    };

    // Distribución de rankings
    for (let i = 1; i <= 5; i++) {
        stats.rankingDistribution[i] = Array.isArray(firms) ? firms.filter((f) => f.ranked === i).length : 0;
    }
    stats.rankingDistribution["sin_ranking"] = Array.isArray(firms) ? firms.filter((f) => !f.ranked || f.ranked === 0).length : 0;

    return stats;
}

/**
 * Exporta sinónimos cargados (para debugging)
 */
export function getSynonymStats() {
    return {
        manualSynonymGroups: QUERY_SYNONYMS.length,
        dictionaryTerms: termExpansionMap.size,
        sampleExpansion: expandQuery("energia"),
    };
}

/* ========================================================================== */
/*  FIN DEL ARCHIVO                                                            */
/* ========================================================================== */
