// src/hooks/useSearchInput.js
import { useState, useEffect } from "react";

export const normalize = (str) =>
    String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

export default function useSearchInput(quickTagsAll, setQuickTagsFiltered) {
    const [query, setQuery] = useState("");

    const handleTyping = (value) => {
        setQuery(value);

        if (!value.trim()) {
            setQuickTagsFiltered(quickTagsAll);
            return;
        }

        const v = normalize(value);
        const filtered = quickTagsAll.filter((t) =>
            normalize(t.tag).startsWith(v)
        );

        setQuickTagsFiltered(filtered);
    };

    return { query, setQuery, handleTyping };
}
