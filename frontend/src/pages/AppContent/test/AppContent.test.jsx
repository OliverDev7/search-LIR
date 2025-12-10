// src/pages/AppContent/AppContent.test.jsx
import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AppContent from "../AppContent";
import axios from "axios";

// ------------------------------------------------------
// MOCK AXIOS
// ------------------------------------------------------
vi.mock("axios");

// ------------------------------------------------------
// MOCK SUBCOMPONENTES
// ------------------------------------------------------
vi.mock("../../components/SearchBar/SearchBar.jsx", () => ({
    default: ({ value, onTyping, onSearch }) => (
        <div data-testid="searchbar">
            <input
                data-testid="search-input"
                value={value}
                onChange={(e) => onTyping(e.target.value)}
            />
            <button
                data-testid="search-submit"
                onClick={() => onSearch(value)}
            >
                Buscar
            </button>
        </div>
    ),
}));

vi.mock("../../components/FirmCard/FirmCard.jsx", () => ({
    default: ({ firm }) => (
        <div data-testid="firm-card">{firm?.firm || "NO-FIRM"}</div>
    ),
}));

vi.mock("../../components/TagChip/TagChip.jsx", () => ({
    default: ({ label, count, onClick }) => (
        <div
            data-testid={`tagchip-${label}`}
            onClick={onClick}
        >
            {label} ({count})
        </div>
    ),
}));

// ------------------------------------------------------
// RESPUESTAS MOCK
// ------------------------------------------------------
const mockFilters = {
    countries: ["Chile", "Argentina"],
    regions: ["Sudamérica", "Centroamérica"],
    mapping: [
        { region: "Sudamérica", country: "Chile" },
        { region: "Sudamérica", country: "Argentina" }
    ],
};

const mockTags = {
    tags: [
        { tag: "energía", count: 10 },
        { tag: "tecnología", count: 8 },
        { tag: "finanzas", count: 5 },
    ],
};

const mockSearchResults = {
    results: [
        {
            id: 1,
            firm: "FIRMA UNO",
            country: "Chile",
            region: "Sudamérica",
            area: "Energía",
            tags: ["energía", "transmisión"],
            relevance: 80,
        },
    ],
};

// ------------------------------------------------------
// DESCRIBE PRINCIPAL
// ------------------------------------------------------
describe("AppContent - Tests Profesionales", () => {

    beforeEach(() => {
        vi.clearAllMocks();

        axios.get.mockImplementation((url) => {
            if (url.startsWith("/api/filters")) return Promise.resolve({ data: mockFilters });
            if (url.startsWith("/api/tags")) return Promise.resolve({ data: mockTags });
            if (url.startsWith("/api/search")) return Promise.resolve({ data: mockSearchResults });
            if (url.startsWith("/api/searchByTag")) return Promise.resolve({ data: mockSearchResults });
            return Promise.resolve({ data: {} });
        });
    });

    // ------------------------------------------------------
    // 1. Render inicial + selects
    // ------------------------------------------------------
    it("carga filtros dinámicos y renderiza selects de país y región", async () => {
        render(<AppContent />);

        expect(axios.get).toHaveBeenCalledWith("/api/filters");

        await screen.findByText("Sudamérica");
        await screen.findByText("Argentina");

        const regionSelect = screen.getByRole("combobox", { name: "select-region" });
        const countrySelect = screen.getByRole("combobox", { name: "select-country" });

        expect(regionSelect).toBeInTheDocument();
        expect(countrySelect).toBeInTheDocument();
    });

    // ------------------------------------------------------
    // 2. Tags rápidos
    // ------------------------------------------------------
    it("carga tags rápidos y los muestra en la sidebar", async () => {
        render(<AppContent />);

        await screen.findByText("energía (10)");
        await screen.findByText("tecnología (8)");
        await screen.findByText("finanzas (5)");
    });

    // ------------------------------------------------------
    // 3. Input filtra quickTags
    // ------------------------------------------------------
    it("filtra tags rápidos mientras se escribe en SearchBar", async () => {
        render(<AppContent />);

        await screen.findByText("energía (10)");

        const input = screen.getByTestId("search-input");

        fireEvent.change(input, { target: { value: "tec" } });

        await waitFor(() => {
            expect(screen.queryByText("energía (10)")).not.toBeInTheDocument();
            expect(screen.getByText("tecnología (8)")).toBeInTheDocument();
        });
    });

    // ------------------------------------------------------
    // 4. Submit genera grupo de búsqueda
    // ------------------------------------------------------
    it("agrega un grupo de búsqueda al enviar el formulario", async () => {
        render(<AppContent />);

        const input = screen.getByTestId("search-input");
        fireEvent.change(input, { target: { value: "energía" } });

        fireEvent.click(screen.getByTestId("search-submit"));

        await screen.findByText('Búsqueda para “energía”');
        expect(axios.get).toHaveBeenCalledWith("/api/search", { params: { q: "energía" } });
    });

    // ------------------------------------------------------
    // 5. Búsqueda desde tag rápido
    // ------------------------------------------------------
    it("realiza búsqueda rápida al hacer click en TagChip", async () => {
        render(<AppContent />);

        await screen.findByText("energía (10)");
        fireEvent.click(screen.getByTestId("tagchip-energía"));

        await screen.findByText('Búsqueda para “energía”');
    });

    // ------------------------------------------------------
    // 6. Mostrar más / menos tags activos
    // ------------------------------------------------------
    it("muestra botón 'Mostrar más' si hay más de 6 tags activos", async () => {
        render(<AppContent />);

        for (let i = 0; i < 7; i++) {
            fireEvent.change(screen.getByTestId("search-input"), {
                target: { value: `tag${i}` },
            });
            fireEvent.click(screen.getByTestId("search-submit"));
            await screen.findByText(`Búsqueda para “tag${i}”`);
        }

        await screen.findByText("Mostrar más");
    });

    // ------------------------------------------------------
    // 7. Filtro región → filtra países
    // ------------------------------------------------------
    it("al seleccionar región, filtra correctamente los países disponibles", async () => {
        render(<AppContent />);

        await screen.findByText("Sudamérica");

        const regionSelect = screen.getByRole("combobox", { name: "select-region" });

        fireEvent.change(regionSelect, { target: { value: "Sudamérica" } });

        await waitFor(() => {
            expect(screen.getByText("Chile")).toBeInTheDocument();
            expect(screen.getByText("Argentina")).toBeInTheDocument();
        });
    });

    // ------------------------------------------------------
    // 8. Resultados combinados
    // ------------------------------------------------------
    it("muestra resultados combinados cuando hay múltiples conceptos activos", async () => {
        render(<AppContent />);

        fireEvent.change(screen.getByTestId("search-input"), {
            target: { value: "energía" },
        });
        fireEvent.click(screen.getByTestId("search-submit"));
        await screen.findByText("Búsqueda para “energía”");

        fireEvent.change(screen.getByTestId("search-input"), {
            target: { value: "finanzas" },
        });
        fireEvent.click(screen.getByTestId("search-submit"));
        await screen.findByText("Búsqueda para “finanzas”");

        expect(
            screen.getByText(/Firmas que coinciden con todos los conceptos/i)
        ).toBeInTheDocument();
    });
});
