// src/pages/FirmDetail/FirmDetail.test.jsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import axios from "axios";
import FirmDetail from "../FirmDetail.jsx";

// ---------------------------------------------------------
// MOCK axios
// ---------------------------------------------------------
vi.mock("axios");

// ---------------------------------------------------------
// MOCK react-router-dom
// ---------------------------------------------------------
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useParams: vi.fn(),
    };
});

import { useParams } from "react-router-dom";

// ---------------------------------------------------------
// Mock de datos
// ---------------------------------------------------------
const mockFirmData = {
    id: "123",
    firm: "Castillo Abogados",
    country: "Chile",
    region: "LatAm",
    area: "Corporate",
    ranked: 1,
    relevance: 88,
    tags: ["energy", "M&A", "banking"],
    description: "Descripción detallada de la firma.",
    workHighlights: "Caso destacado importante.",
    keyClients: "Cliente 1, Cliente 2",
    testimonials: "Excelente servicio.",
};

// ---------------------------------------------------------

describe("FirmDetails - Tests profesionales", () => {

    beforeEach(() => {
        vi.clearAllMocks();

        // 🔥 FIX IMPORTANTE → evita el error del primer test
        useParams.mockReturnValue({ id: undefined });
    });

    // ---------------------------------------------------------
    test("renderiza correctamente la información cuando viene por props", () => {

        render(<FirmDetail firm={mockFirmData} />);

        expect(screen.getByText("Castillo Abogados")).toBeInTheDocument();
        expect(screen.getByText("Chile")).toBeInTheDocument();
        expect(screen.getByText("LatAm")).toBeInTheDocument();
        expect(screen.getByText("Corporate")).toBeInTheDocument();
        expect(screen.getByText("Excelente")).toBeInTheDocument();
        expect(screen.getByText("Relevancia 88%")).toBeInTheDocument();
        expect(screen.getByText("energy")).toBeInTheDocument();
        expect(screen.getByText("Descripción detallada de la firma.")).toBeInTheDocument();
    });

    // ---------------------------------------------------------
    test("hace fetch a la API cuando no recibe props", async () => {

        useParams.mockReturnValue({ id: "123" });

        axios.get.mockResolvedValueOnce({ data: mockFirmData });

        render(<FirmDetail />);

        await waitFor(() => {
            expect(screen.getByText("Castillo Abogados")).toBeInTheDocument();
        });

        expect(axios.get).toHaveBeenCalledWith("/api/firm-details?id=123");
    });

    // ---------------------------------------------------------
    test("muestra mensaje alternativo si no hay descripción", async () => {

        useParams.mockReturnValue({ id: "1" });

        const mockWithoutDescription = { ...mockFirmData, description: "" };
        axios.get.mockResolvedValueOnce({ data: mockWithoutDescription });

        render(<FirmDetail />);

        await waitFor(() => {
            expect(
                screen.getByText(/no tiene una descripción detallada/i)
            ).toBeInTheDocument();
        });
    });

    // ---------------------------------------------------------
    test("muestra correctamente los chips de metadatos", () => {

        render(<FirmDetail firm={mockFirmData} />);

        expect(screen.getByText("Chile")).toBeInTheDocument();
        expect(screen.getByText("LatAm")).toBeInTheDocument();
        expect(screen.getByText("Corporate")).toBeInTheDocument();
    });

    // ---------------------------------------------------------
    test("muestra todos los tags", () => {

        render(<FirmDetail firm={mockFirmData} />);

        mockFirmData.tags.forEach(tag => {
            expect(screen.getByText(tag)).toBeInTheDocument();
        });
    });

    // ---------------------------------------------------------
    test("ejecuta onClose cuando se presiona el botón de cerrar", () => {

        const fn = vi.fn();

        render(<FirmDetail firm={mockFirmData} onClose={fn} />);

        fireEvent.click(screen.getByRole("button"));

        expect(fn).toHaveBeenCalledTimes(1);
    });

    // ---------------------------------------------------------
    test("no muestra el botón cerrar si no se pasa onClose", () => {

        render(<FirmDetail firm={mockFirmData} />);

        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    // ---------------------------------------------------------
    test("muestra todas las secciones de información estructurada", () => {

        render(<FirmDetail firm={mockFirmData} />);

        expect(screen.getByText("Descripción general")).toBeInTheDocument();
        expect(screen.getByText("Work Highlights")).toBeInTheDocument();
        expect(screen.getByText("Clientes clave")).toBeInTheDocument();
        expect(screen.getByText("Testimonios")).toBeInTheDocument();
    });
});
