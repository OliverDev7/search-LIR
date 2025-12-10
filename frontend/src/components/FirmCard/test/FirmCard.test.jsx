import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FirmCard from "../FirmCard.jsx";


const mockFirm = {
    id: "abc123",
    firm: "Test & Co",
    country: "Chile",
    area: "Banking",
    ranked: 1,
    tags: ["energy", "finance"],
    relevance: 92,
};

describe("FirmCard Component", () => {
    test("renderiza el nombre de la firma", () => {
        render(
            <MemoryRouter>
                <FirmCard firm={mockFirm} />
            </MemoryRouter>
        );

        expect(screen.getByText("Test & Co")).toBeInTheDocument();
    });

    test("muestra el país y el área", () => {
        render(
            <MemoryRouter>
                <FirmCard firm={mockFirm} />
            </MemoryRouter>
        );

        expect(screen.getByText("Chile")).toBeInTheDocument();
        expect(screen.getByText("Banking")).toBeInTheDocument();
    });

    test("muestra el ranking correcto", () => {
        render(
            <MemoryRouter>
                <FirmCard firm={mockFirm} />
            </MemoryRouter>
        );

        expect(screen.getByText("Excelente")).toBeInTheDocument();
    });

    test("muestra la relevancia", () => {
        render(
            <MemoryRouter>
                <FirmCard firm={mockFirm} />
            </MemoryRouter>
        );

        expect(screen.getByText("relevancia 92%")).toBeInTheDocument();
    });

    test("muestra los tags", () => {
        render(
            <MemoryRouter>
                <FirmCard firm={mockFirm} />
            </MemoryRouter>
        );

        expect(screen.getByText("energy")).toBeInTheDocument();
        expect(screen.getByText("finance")).toBeInTheDocument();
    });

    test("resalta el tag activo", () => {
        render(
            <MemoryRouter>
                <FirmCard firm={mockFirm} activeTags={["energy"]} />
            </MemoryRouter>
        );

        const tag = screen.getByText("energy");
        expect(tag.classList.contains("firm-tag-active")).toBe(true);
    });

    test("muestra el indicador highlightMatch", () => {
        render(
            <MemoryRouter>
                <FirmCard firm={mockFirm} highlightMatch="energy" />
            </MemoryRouter>
        );

        expect(
            screen.getByText("Esta firma habla de tu búsqueda")
        ).toBeInTheDocument();
    });

    test("el <Link> usa el id correcto", () => {
        render(
            <MemoryRouter>
                <FirmCard firm={mockFirm} />
            </MemoryRouter>
        );

        const link = screen.getByRole("link");
        expect(link.getAttribute("href")).toBe("/firm/abc123");
    });
});
