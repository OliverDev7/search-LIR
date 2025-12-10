import { DatosModel } from "../models/Firm.model";

export const DatosController = {
    async getAll(req, res) {
        const rows = await DatosModel.getAll();
        res.json({ results: rows });
    },

    async search(req, res) {
        const { q } = req.query;
        const rows = await DatosModel.searchByTerm(q);
        res.json({ results: rows });
    },

    async searchByTag(req, res) {
        const { tag } = req.query;
        const rows = await DatosModel.searchByTag(tag);
        res.json({ results: rows });
    },

    async filters(req, res) {
        const result = await DatosModel.getFilters();
        res.json(result);
    },

    async quickTags(req, res) {
        const { country, region } = req.query;
        const tags = await DatosModel.getQuickTags(country, region);
        res.json({ tags });
    },
};
