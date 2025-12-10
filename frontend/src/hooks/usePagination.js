// src/hooks/usePagination.js
import { useState } from "react";

export default function usePagination(items = [], perPage = 6) {
    // Nos aseguramos de trabajar siempre con un array
    const safeItems = Array.isArray(items) ? items : [];

    const [page, setPage] = useState(0);

    const totalPages = Math.max(1, Math.ceil(safeItems.length / perPage));
    const currentPage = Math.min(page, totalPages - 1);

    const visibleItems = safeItems.slice(
        currentPage * perPage,
        currentPage * perPage + perPage
    );

    const next = () => setPage((p) => Math.min(totalPages - 1, p + 1));
    const prev = () => setPage((p) => Math.max(0, p - 1));
    const reset = () => setPage(0);

    return { visibleItems, totalPages, currentPage, next, prev, reset, setPage };
}
