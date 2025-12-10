// src/hooks/useDynamicFilters.js
import { useState, useEffect, useMemo } from "react";
import axios from "axios";

export default function useDynamicFilters() {
    const [filterCountries, setFilterCountries] = useState([]);
    const [filterRegions, setFilterRegions] = useState([]);
    const [countryRegionMap, setCountryRegionMap] = useState([]);

    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("");

    const loadFilters = async () => {
        try {
            const res = await axios.get("/api/filters");
            setFilterCountries(res.data.countries || []);
            setFilterRegions(res.data.regions || []);
            setCountryRegionMap(res.data.mapping || []);
        } catch (err) {
            console.error("Error cargando filtros:", err);
        }
    };

    useEffect(() => {
        loadFilters();
    }, []);

    const countriesForCurrentRegion = useMemo(() => {
        if (!selectedRegion) return filterCountries;

        const subset = countryRegionMap
            .filter((item) => item.region === selectedRegion)
            .map((item) => item.country);

        return Array.from(new Set(subset));
    }, [selectedRegion, filterCountries, countryRegionMap]);
    const applyFilters = (list = []) => {
        // ✅ Siempre trabajamos con un array
        let filtered = Array.isArray(list) ? list : [];

        if (selectedRegion) {
            filtered = filtered.filter(
                (item) =>
                    (item.region || "").toString().trim().toLowerCase() ===
                    selectedRegion.toString().trim().toLowerCase()
            );
        }

        if (selectedCountry) {
            filtered = filtered.filter(
                (item) =>
                    (item.country || "").toString().trim().toLowerCase() ===
                    selectedCountry.toString().trim().toLowerCase()
            );
        }

        return filtered;
    };


    return {
        filterCountries,
        filterRegions,
        countriesForCurrentRegion,
        selectedCountry,
        selectedRegion,
        setSelectedCountry,
        setSelectedRegion,
        applyFilters,
    };
}
