// src/hooks/useQuickTags.js
import { useState, useEffect } from "react";
import axios from "axios";

export default function useQuickTags(selectedCountry, selectedRegion) {
    const [quickTagsAll, setQuickTagsAll] = useState([]);
    const [quickTagsFiltered, setQuickTagsFiltered] = useState([]);

    const loadQuickTags = async () => {
        try {
            const params = {};
            if (selectedCountry) params.country = selectedCountry;
            if (selectedRegion) params.region = selectedRegion;

            const res = await axios.get("/api/tags", { params });
            const tags = res.data.tags || [];

            setQuickTagsAll(tags);
            setQuickTagsFiltered(tags);
        } catch (err) {
            console.error("Error cargando tags rápidos:", err);
        }
    };

    useEffect(() => {
        loadQuickTags();
    }, [selectedCountry, selectedRegion]);

    return {
        quickTagsAll,
        quickTagsFiltered,
        setQuickTagsFiltered,
    };
}
