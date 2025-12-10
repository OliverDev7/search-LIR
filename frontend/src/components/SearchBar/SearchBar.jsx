// src/components/SearchBar.jsx
import React, { useState, useEffect } from "react";
import "./styles/SearchBar.css";

const SearchBar = ({ value, onSearch, onTyping }) => {
  const [localValue, setLocalValue] = useState(value || "");
  const [error, setError] = useState(""); // ⬅ NUEVO: estado de error

  // Sincronizar si desde App cambian value
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!localValue.trim()) {
      setError("* Por favor escribe una palabra antes de buscar *");

      // borrar error automático después de 3.5s
      setTimeout(() => setError(""), 3500);
      return;
    }

    onSearch(localValue);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    if (onTyping) onTyping(val);
  };

  const handleButtonClick = () => {
    // Simular submit del form
    const form = document.getElementById("search-form");
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <>
      {/* 🔁 Contenedor padre que alinea input y botón horizontalmente */}
      <div className="search-wrapper">
        {/* 🔁 Contenedor con animación exterior SOLO para el input */}
        <div className="search-container">
          <form id="search-form" className="search-bar" onSubmit={handleSubmit} noValidate>
            <input
              className="search-input"
              type="text"
              placeholder="Busca conceptos como 'energía', 'tecnología', 'ESG'..."
              value={localValue}
              onChange={handleChange}
            />
          </form>
        </div>

        {/* 🎯 Botón completamente independiente, alineado a la derecha */}
        <button
          className="search-button-standalone"
          onClick={handleButtonClick}
          type="button"

        >
          Buscar
        </button>
      </div>

      {/* ⬅ NUEVO: Mensaje de error elegante */}
      {error && <p className="search-error">{error}</p>}
    </>
  );
};

export default SearchBar;