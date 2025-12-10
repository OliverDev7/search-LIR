// src/hooks/useCombinedSearch.js
import { useMemo } from "react";




export default function useCombinedSearch(searchGroups) {
    const MAX_COMBINED_CONCEPTS = 5;

    const combinedSearchGroups = useMemo(() => {
        if (searchGroups.length < 2) return [];
        return searchGroups.slice(-MAX_COMBINED_CONCEPTS);
    }, [searchGroups]);

    const combinedGroup = useMemo(() => {
        if (combinedSearchGroups.length < 2) return { tags: [], results: [] };

        const groupByFirm = {};
        combinedSearchGroups.forEach((group) => {
            (group.results || []).forEach((f) => {
                const key = `${f.country}::${f.firm}`;

                if (!groupByFirm[key]) {
                    groupByFirm[key] = {
                        firm: f.firm,
                        country: f.country,
                        region: f.region,
                        allTags: new Set(),
                        areas: new Set(),
                        relevances: [],
                    };
                }

                (f.tags || []).forEach((t) => groupByFirm[key].allTags.add(t.toLowerCase()));
                if (f.area) groupByFirm[key].areas.add(f.area);
                if (typeof f.relevance === "number") groupByFirm[key].relevances.push(f.relevance);
            });
        });

        const requiredTags = combinedSearchGroups.map((g) => g.tag);

        const finalResults = Object.values(groupByFirm).filter((firm) =>
            requiredTags.every((t) => firm.allTags.has(t.toLowerCase()))
        );

        finalResults.forEach((f) => {
            f.area = [...f.areas].join(", ");
            f.tags = [...f.allTags];
            f.relevance = Math.max(...f.relevances, 0);
        });

        finalResults.sort((a, b) => b.relevance - a.relevance);

        return { tags: requiredTags, results: finalResults };
    }, [combinedSearchGroups]);

    return combinedGroup;
}
