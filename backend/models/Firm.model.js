import { db } from "../db/mysql.js";

export const DatosModel = {
    async getAll() {
        const [rows] = await db.query("SELECT * FROM datos");
        return rows;
    },

    async searchByTerm(term) {
        const [rows] = await db.query(
            `SELECT *
             FROM datos
             WHERE LOWER(tags) LIKE LOWER(?) 
             OR LOWER(description) LIKE LOWER(?) 
             OR LOWER(area) LIKE LOWER(?)`,
            [`%${term}%`, `%${term}%`, `%${term}%`]
        );
        return rows;
    },

    async searchByTag(tag) {
        const [rows] = await db.query(
            `SELECT *
             FROM datos
             WHERE FIND_IN_SET(?, tags) > 0`,
            [tag]
        );
        return rows;
    },

    async getFilters() {
        const [rows] = await db.query(
            `SELECT DISTINCT country, region FROM datos`
        );

        const countries = [...new Set(rows.map((r) => r.country).filter(Boolean))];
        const regions = [...new Set(rows.map((r) => r.region).filter(Boolean))];

        const mapping = rows.map((r) => ({
            country: r.country,
            region: r.region,
        }));

        return { countries, regions, mapping };
    },

    async getQuickTags(country, region) {
        let query = "SELECT tags FROM datos";
        let params = [];

        if (country || region) {
            query += " WHERE 1=1 ";
            if (country) {
                query += " AND country = ?";
                params.push(country);
            }
            if (region) {
                query += " AND region = ?";
                params.push(region);
            }
        }

        const [rows] = await db.query(query, params);

        const counter = {};

        rows.forEach((r) => {
            if (!r.tags) return;
            r.tags.split(",").map((t) => t.trim()).forEach((tag) => {
                counter[tag] = (counter[tag] || 0) + 1;
            });
        });

        return Object.entries(counter).map(([tag, count]) => ({
            tag,
            count,
        }));
    }
};
