import { loadFirmsFromSheet } from "../src/googleSheets.mjs"; // Agregamos esta línea
import {
    buildFuseIndex,
    semanticSearch,
    getQuickTags as getQuickTagsFromEngine, // Cambiamos el nombre aquí
    searchByTag as searchByTagFromEngine, // Cambiamos el nombre aquí también
} from "../src/searchEngine.js";

let FIRMS = [];
let FUSE = null;

// Carga inicial del índice
async function init() {
    console.log("📄 Cargando datos desde Google Sheets...");

    // Cargar firmas
    FIRMS = await loadFirmsFromSheet(); // Ya está importada
    console.log(`   → ${FIRMS.length} filas cargadas.`);

    // Construir índice
    FUSE = buildFuseIndex(FIRMS);
    console.log("🔍 Índice Fuse.js construido.");

    const firmasConTags = FIRMS.filter((f) => (f.tags || []).length > 0);
    console.log(
        `   → Firmas con al menos 1 tag: ${firmasConTags.length}`
    );
}

// Obtener detalle de una firma por ID
const getFirmDetails = (req, res) => {
    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ error: "Missing id" });

    const firm = FIRMS.find((f) => String(f.id) === id);
    if (!firm) return res.status(404).json({ error: "Firm not found" });

    return res.json(firm);
};

// ✔ Filtros dinámicos
const getFilters = (req, res) => {
    const countriesSet = new Set();
    const regionsSet = new Set();
    const mappingSet = new Set();

    FIRMS.forEach((f) => {
        const country = (f.country || "").trim();
        const region = (f.region || "").trim();

        if (country) countriesSet.add(country);
        if (region) regionsSet.add(region);

        if (country && region) {
            mappingSet.add(`${country}:::${region}`);
        }
    });

    const countries = Array.from(countriesSet).sort();
    const regions = Array.from(regionsSet).sort();

    const mapping = Array.from(mappingSet).map((str) => {
        const [country, region] = str.split(":::");
        return { country, region };
    });

    res.json({
        countries,
        regions,
        mapping,
    });
};

// ✔ Todas las firmas
const getAllFirms = (req, res) => {
    try {
        res.json(FIRMS);
    } catch (err) {
        console.error("Error en /api/all-firms:", err);
        res.status(500).json({ error: "Error interno al obtener firmas" });
    }
};

// ✔ Health
const getHealth = (req, res) => {
    res.json({ status: "ok", totalFirms: FIRMS.length });
};

// ✔ Búsqueda semántica
const search = (req, res) => {
    const q = req.query.q || "";
    const limit = req.query.limit ? Number(req.query.limit) : 30;

    if (!q.trim()) {
        return res.json({ query: q, results: [] });
    }

    if (!FUSE) {
        return res
            .status(500)
            .json({ error: "Índice de búsqueda no inicializado" });
    }

    const results = semanticSearch(FUSE, q, limit);
    res.json({
        query: q,
        count: results.length,
        results,
    });
};

// ✔ Tags rápidos
const getQuickTags = (req, res) => {
    const { country, region } = req.query;

    let firmsToUse = FIRMS;

    if (region && region.trim()) {
        firmsToUse = firmsToUse.filter(
            (f) => (f.region || "").trim() === region.trim()
        );
    }

    if (country && country.trim()) {
        firmsToUse = firmsToUse.filter(
            (f) => (f.country || "").trim() === country.trim()
        );
    }

    const quickTags = getQuickTagsFromEngine(firmsToUse, 40); // Usamos el alias

    res.json({
        count: quickTags.length,
        tags: quickTags,
    });
};

// ✔ Buscar por tag
const searchByTag = (req, res) => {
    const tag = req.query.tag || "";
    if (!tag.trim()) return res.json({ tag, results: [] });

    const results = searchByTagFromEngine(FIRMS, tag); // Usamos el alias
    res.json({
        tag,
        count: results.length,
        results,
    });
};

export {
    init,
    FIRMS,
    FUSE,
    getFirmDetails,
    getFilters,
    getAllFirms,
    getHealth,
    search,
    getQuickTags,
    searchByTag,
};