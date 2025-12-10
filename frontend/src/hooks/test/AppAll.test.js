import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import axios from "axios";

import useDynamicFilters from "../useDynamicFilters";
import useQuickTags from "../useQuickTags";
import usePagination from "../usePagination";
import useSearchInput, { normalize } from "../useSearchInput";
import useSearchGroups from "../useSearchGroups";
import useCombinedSearch from "../useCombinedSearch";

// -------------------------------------------------------------
// Mock global de axios
// -------------------------------------------------------------
vi.mock("axios");

// -------------------------------------------------------------
// Datos Mock reutilizables
// -------------------------------------------------------------
const mockFilters = {
    countries: ["Chile", "Argentina"],
    regions: ["Sudamérica", "Europa"],
    mapping: [
        { region: "Sudamérica", country: "Chile" },
        { region: "Sudamérica", country: "Argentina" },
    ]
};

const mockTags = {
    tags: [
        { tag: "energía", count: 10 },
        { tag: "finanzas", count: 5 },
        { tag: "tecnología", count: 8 },
    ]
};

const mockResults = {
    results: [
        {
            firm: "Alpha",
            country: "Chile",
            region: "Sudamérica",
            area: "Energía",
            tags: ["energía", "solar"],
            relevance: 90
        }
    ]
};

// -------------------------------------------------------------
describe("AppAll Hook Tests", () => {

    beforeEach(() => {
        vi.clearAllMocks();

        axios.get.mockImplementation((url) => {
            if (url.startsWith("/api/filters"))
                return Promise.resolve({ data: mockFilters });

            if (url.startsWith("/api/tags"))
                return Promise.resolve({ data: mockTags });

            if (url.startsWith("/api/search"))
                return Promise.resolve({ data: mockResults });

            if (url.startsWith("/api/searchByTag"))
                return Promise.resolve({ data: mockResults });

            return Promise.resolve({ data: {} });
        });
    });

    // =============================================================
    // 1. Dynamic Filters
    // =============================================================
    it("carga regiones y países correctamente", async () => {
        const { result } = renderHook(() => useDynamicFilters());

        // Esperamos a que el hook cargue los filtros
        await act(async () => { });

        expect(result.current.filterRegions).toContain("Sudamérica");
        expect(result.current.filterCountries).toContain("Chile");

        // Seleccionar región → solo Chile y Argentina
        act(() => {
            result.current.setSelectedRegion("Sudamérica");
        });

        expect(result.current.countriesForCurrentRegion).toEqual(["Chile", "Argentina"]);
    });

    // =============================================================
    // 2. QuickTags
    // =============================================================
    it("filtra tags correctamente por texto", async () => {
        const { result } = renderHook(() =>
            useQuickTags("Chile", "Sudamérica")
        );

        await act(async () => { });

        // energía, finanzas, tecnología
        expect(result.current.quickTagsAll.length).toBe(3);
    });

    // =============================================================
    // 3. Pagination
    // =============================================================
    it("avanza y retrocede páginas", () => {
        const list = Array.from({ length: 20 }, (_, i) => i + 1);

        const { result } = renderHook(() => usePagination(list, 5));

        expect(result.current.visibleItems.length).toBe(5);
        expect(result.current.currentPage).toBe(0);

        act(() => result.current.next());
        expect(result.current.currentPage).toBe(1);

        act(() => result.current.prev());
        expect(result.current.currentPage).toBe(0);
    });

    // =============================================================
    // 4. Search Input
    // =============================================================
    it("actualiza el texto de entrada y emite callback", () => {
        const mockSetFiltered = vi.fn();

        const mockTagsArray = [
            { tag: "energía" },
            { tag: "tecnología" },
        ];

        const { result } = renderHook(() =>
            useSearchInput(mockTagsArray, mockSetFiltered)
        );

        act(() => {
            result.current.handleTyping("ener");
        });

        // Debe llamar al filtro
        expect(mockSetFiltered).toHaveBeenCalled();
        expect(result.current.query).toBe("ener");
    });

    // =============================================================
    // 5. Search Groups
    // =============================================================
    it("crea un grupo de búsqueda nuevo", async () => {
        const { result } = renderHook(() => useSearchGroups());

        await act(async () => {
            await result.current.handleSearchSubmit("energía");
        });

        expect(result.current.searchGroups.length).toBe(1);
        expect(result.current.searchGroups[0].tag).toBe("energía");
    });

    // =============================================================
    // 6. Combined Search
    // =============================================================
    it("combina resultados correctamente", () => {
        const fakeGroups = [
            {
                tag: "energía",
                results: [
                    {
                        firm: "Alpha",
                        country: "Chile",
                        region: "Sudamérica",
                        area: "Energía",
                        tags: ["energía"],
                        relevance: 80
                    }
                ]
            },
            {
                tag: "solar",
                results: [
                    {
                        firm: "Alpha",
                        country: "Chile",
                        region: "Sudamérica",
                        area: "Solar",
                        tags: ["solar", "energía"],
                        relevance: 95
                    }
                ]
            }
        ];

        const { result } = renderHook(() => useCombinedSearch(fakeGroups));

        expect(result.current.tags.length).toBe(2);
        expect(result.current.results.length).toBe(1);
        expect(result.current.results[0].firm).toBe("Alpha");
    });
});
