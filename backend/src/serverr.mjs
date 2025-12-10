{/*import express from "express";
import cors from "cors";
import { DatosModel } from "../models/Firm.model.js";

const app = express();
app.use(cors());
app.use(express.json());


// ======================
//    RUTAS BACKEND
// ======================

// Healthcheck
app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", message: "MySQL conectado correctamente" });
});

// Obtener filtros dinámicos (países / regiones / mapping)
app.get("/api/filters", async (req, res) => {
    const data = await DatosModel.getFilters();
    res.json(data);
});

// Búsqueda general por término
app.get("/api/search", async (req, res) => {
    const q = req.query.q || "";
    if (!q.trim()) return res.json({ query: q, results: [] });

    const results = await DatosModel.searchByTerm(q.toLowerCase());
    res.json({ query: q, count: results.length, results });
});

// Búsqueda por tag exacto (para los “tags rápidos”)
app.get("/api/searchByTag", async (req, res) => {
    const tag = req.query.tag || "";
    if (!tag.trim()) return res.json({ tag, results: [] });

    const results = await DatosModel.searchByTag(tag);
    res.json({ tag, count: results.length, results });
});

// Tags rápidos desde MySQL
app.get("/api/tags", async (req, res) => {
    const { country, region } = req.query;
    const tags = await DatosModel.getQuickTags(country, region);
    res.json({ count: tags.length, tags });
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Backend MySQL escuchando en http://localhost:${PORT}`);
}); */}
