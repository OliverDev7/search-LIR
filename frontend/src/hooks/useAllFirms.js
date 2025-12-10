// src/hooks/useAllFirms.js
import { useEffect, useState } from "react";
import axios from "axios";

export default function useAllFirms() {
    const [allFirms, setAllFirms] = useState([]);   // ✅ array por defecto
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const res = await axios.get("/api/all-firms");
                const data = res.data;

                if (!cancelled) {
                    // ✅ Normalizamos lo que venga del backend
                    const firmsArray = Array.isArray(data)
                        ? data
                        : Array.isArray(data?.results)
                            ? data.results
                            : [];

                    setAllFirms(firmsArray);
                }
            } catch (err) {
                console.error("Error cargando firmas:", err);
                if (!cancelled) {
                    setAllFirms([]); // ✅ en error, dejamos array vacío
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    return { allFirms, loading };
}
