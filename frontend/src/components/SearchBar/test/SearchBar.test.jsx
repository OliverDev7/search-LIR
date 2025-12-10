import { render, screen, fireEvent } from "@testing-library/react";
import SearchBar from "../SearchBar.jsx";

describe("SearchBar Component", () => {

    test("renderiza el input y el botón", () => {
        render(<SearchBar />);

        expect(screen.getByPlaceholderText(/Busca conceptos/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Buscar/i })).toBeInTheDocument();
    });

    test("escribe texto en el input", () => {
        render(<SearchBar />);

        const input = screen.getByPlaceholderText(/Busca conceptos/i);
        fireEvent.change(input, { target: { value: "energy" } });

        expect(input.value).toBe("energy");
    });

    test("llama a onTyping cuando el usuario escribe", () => {
        const onTypingMock = vi.fn();

        render(<SearchBar onTyping={onTypingMock} />);

        const input = screen.getByPlaceholderText(/Busca conceptos/i);
        fireEvent.change(input, { target: { value: "esg" } });

        expect(onTypingMock).toHaveBeenCalledWith("esg");
    });

    test("ejecuta onSearch al hacer submit", () => {
        const onSearchMock = vi.fn();

        render(<SearchBar onSearch={onSearchMock} />);

        const input = screen.getByPlaceholderText(/Busca conceptos/i);
        const btn = screen.getByRole("button", { name: "Buscar" });

        fireEvent.change(input, { target: { value: "mining" } });
        fireEvent.click(btn);

        expect(onSearchMock).toHaveBeenCalledWith("mining");
    });

    test("no llama a onSearch si el campo está vacío", () => {
        const onSearchMock = vi.fn();

        render(<SearchBar onSearch={onSearchMock} />);

        const btn = screen.getByRole("button", { name: "Buscar" });
        fireEvent.click(btn);

        expect(onSearchMock).not.toHaveBeenCalled();
    });

    test("sincroniza el valor inicial desde props", () => {
        render(<SearchBar value="technology" />);

        const input = screen.getByPlaceholderText(/Busca conceptos/i);

        expect(input.value).toBe("technology");
    });

    test("actualiza el input cuando cambia la prop value", () => {
        const { rerender } = render(<SearchBar value="energy" />);

        const input = screen.getByPlaceholderText(/Busca conceptos/i);
        expect(input.value).toBe("energy");

        // cambia value desde arriba
        rerender(<SearchBar value="cybersecurity" />);
        expect(input.value).toBe("cybersecurity");
    });
});
