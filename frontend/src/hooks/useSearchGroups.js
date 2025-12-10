// src/hooks/useSearchGroups.js
import { useState } from "react";
import axios from "axios";

// Normalizador de clave interno (coincide con el del backend)
const normalizeTagKey = (str) =>
    String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

export default function useSearchGroups() {
    const [searchGroups, setSearchGroups] = useState([]);

    const fetchSearchResults = async (term) => {
        try {
            const res = await axios.get("/api/search", { params: { q: term } });
            return res.data.results || [];
        } catch {
            return [];
        }
    };

    // Búsqueda exacta por TAG (para tags rápidos)
    const fetchResultsByTag = async (tagLabel) => {
        try {
            const res = await axios.get("/api/searchByTag", {
                params: { tag: tagLabel },
            });
            return res.data.results || [];
        } catch {
            return [];
        }
    };

    // ------- BÚSQUEDA NORMAL (input principal) -------
    const handleSearchSubmit = async (value) => {
        const rawLabel = String(value || "").trim();
        if (!rawLabel) return;

        const key = normalizeTagKey(rawLabel);
        const results = await fetchSearchResults(rawLabel);

        setSearchGroups((prev) => {
            const idx = prev.findIndex((g) => g.key === key);
            const groupData = {
                tag: rawLabel,    // lo que se muestra en chips y títulos
                key,              // clave normalizada interna
                results,
                isQuickTag: false,
            };

            if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = groupData;
                return copy;
            }
            return [...prev, groupData];
        });
    };

    // ------- CLICK EN TAG RÁPIDO -------
    const handleQuickTagClick = async (label) => {
        const rawLabel = String(label || "").trim();
        if (!rawLabel) return;

        const key = normalizeTagKey(rawLabel);
        const results = await fetchResultsByTag(rawLabel);

        setSearchGroups((prev) => {
            const idx = prev.findIndex((g) => g.key === key);
            const groupData = {
                tag: rawLabel,
                key,
                results,
                isQuickTag: true,
            };

            if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = groupData;
                return copy;
            }
            return [...prev, groupData];
        });
    };

    // ------- ELIMINAR UN TAG ACTIVO -------
    const handleRemoveTag = (tagLabel) => {
        const key = normalizeTagKey(tagLabel);
        setSearchGroups((prev) => prev.filter((g) => g.key !== key));
    };

    // ------- REFRESCAR RESULTADOS DE UN TAG ACTIVO (click en el chip) -------
    const handleActiveTagClick = async (tagLabel) => {
        const rawLabel = String(tagLabel || "").trim();
        if (!rawLabel) return;

        const key = normalizeTagKey(rawLabel);
        const results = await fetchSearchResults(rawLabel);

        setSearchGroups((prev) =>
            prev.map((g) =>
                g.key === key
                    ? {
                        ...g,
                        tag: rawLabel, // por si cambió alguna capitalización
                        results,
                    }
                    : g
            )
        );
    };

    return {
        searchGroups,
        handleSearchSubmit,
        handleQuickTagClick,
        handleRemoveTag,
        handleActiveTagClick,
    };
}
