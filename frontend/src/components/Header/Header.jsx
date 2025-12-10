// src/components/Header.jsx
import React from "react";
import { NavLink, Link } from "react-router-dom";
import "./styles/Header.css";

const LOCAL_STORAGE_KEY = "lm_saved_firms";

const Header = () => {
  // ---------------------------
  // Estado de firmas guardadas
  // ---------------------------
  const [savedFirms, setSavedFirms] = React.useState(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Error leyendo saved firms desde localStorage", e);
      return [];
    }
  });

  const [isSavedOpen, setIsSavedOpen] = React.useState(false);
  const [justAddedId, setJustAddedId] = React.useState(null);

  // Nuevo: estado del menú mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Guardar en localStorage cada vez que cambia la lista
  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(savedFirms)
      );
    } catch (e) {
      console.error("Error guardando saved firms en localStorage", e);
    }
  }, [savedFirms]);

  // Escuchar eventos globales
  React.useEffect(() => {
    const handleAdd = (event) => {
      const firm = event.detail;
      if (!firm || !firm.id) return;

      setSavedFirms((prev) => {
        if (prev.some((f) => f.id === firm.id)) return prev;
        return [...prev, firm];
      });

      setIsSavedOpen(true);
      setJustAddedId(firm.id);

      setTimeout(() => setJustAddedId(null), 1200);
    };

    const handleRemove = (event) => {
      const id = event.detail?.id;
      if (!id) return;
      setSavedFirms((prev) => prev.filter((f) => f.id !== id));
    };

    window.addEventListener("saved-firm:add", handleAdd);
    window.addEventListener("saved-firm:remove", handleRemove);

    return () => {
      window.removeEventListener("saved-firm:add", handleAdd);
      window.removeEventListener("saved-firm:remove", handleRemove);
    };
  }, []);

  const handleRemoveFirm = (id) => {
    setSavedFirms((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setSavedFirms([]);
  };

  const savedCount = savedFirms.length;

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <>
      <header className="main-header">
        <div className="header-inner">

          {/* Logo / Marca */}
          <Link to="/" className="header-logo">
            <span className="logo-mark">LM</span>
            <span className="logo-text">
              <span>Search</span> by LIR
            </span>
          </Link>

          {/* Zona derecha: links + login + menú mobile */}
          <div className="header-right">

            {/* Navegación desktop */}
            <nav className="header-nav">
              <NavLink
                to="/about-tool"
                className={({ isActive }) =>
                  "header-link" + (isActive ? " header-link-active" : "")
                }
              >
                Sobre la herramienta
              </NavLink>
            </nav>

            {/* Firmas guardadas */}
            <button
              type="button"
              className="header-saved-btn"
              onClick={() => setIsSavedOpen(true)}
            >
              Mis Firmas
              {savedCount > 0 && (
                <span
                  className={
                    "saved-badge" +
                    (justAddedId ? " saved-badge-pulse" : "")
                  }
                >
                  {savedCount}
                </span>
              )}
            </button>

            {/* Botón Login */}
            <div className="header-actions">
              <Link to="/login" className="header-login-btn">
                Login
              </Link>
            </div>

            {/* ÍCONO HAMBURGUESA — DEBE IR AQUÍ */}
            <button
              className="mobile-menu-button"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              ☰
            </button>
          </div>

        </div>
      </header>


      {/* ------------------------------
          MENÚ LATERAL MOBILE
      -------------------------------- */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="mobile-menu-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="mobile-menu-close"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ✕
            </button>

            <nav className="mobile-menu-links">
              <NavLink
                to="/about-tool"
                className="mobile-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sobre la herramienta
              </NavLink>

              <Link
                to="/login"
                className="mobile-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* MODAL DE FIRMAS GUARDADAS */}
      {isSavedOpen && (
        <div
          className="saved-modal-backdrop"
          onClick={() => setIsSavedOpen(false)}
        >
          <div className="saved-modal" onClick={(e) => e.stopPropagation()}>
            <div className="saved-modal-header">
              <div className="saved-modal-title-wrap">
                <h3>Firmas guardadas</h3>
                {savedCount > 0 && (
                  <span className="saved-modal-counter">
                    {savedCount} guardada
                    {savedCount === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="saved-modal-close"
                onClick={() => setIsSavedOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="saved-modal-body">
              {savedCount === 0 ? (
                <p className="saved-modal-empty">
                  Aún no has agregado firmas. Usa el botón{" "}
                  <strong>Agregar</strong> en las tarjetas para guardarlas aquí.
                </p>
              ) : (
                <div className="saved-modal-list">
                  {savedFirms.map((firm) => (
                    <div
                      key={firm.id}
                      className={
                        "saved-firm-card" +
                        (firm.id === justAddedId
                          ? " saved-firm-card-new"
                          : "")
                      }
                    >
                      <div className="saved-firm-main">
                        <div className="saved-firm-header">
                          <p className="saved-firm-name">{firm.firm}</p>
                          {firm.ranking && (
                            <span className="saved-firm-ranking">
                              Ranking: <span>{firm.ranking}</span>
                            </span>
                          )}
                        </div>

                        {/* Áreas — solo una línea con “...” */}
                        {firm.area && (
                          <p className="saved-firm-area saved-firm-area-truncated">
                            {firm.area}
                          </p>
                        )}

                        {/* País debajo */}
                        {firm.country && (
                          <p className="saved-firm-country">
                            {firm.country}
                          </p>
                        )}

                      </div>
                      <button
                        type="button"
                        className="saved-firm-remove"
                        onClick={() => handleRemoveFirm(firm.id)}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="saved-modal-footer">
              <button
                type="button"
                className="saved-modal-clear"
                onClick={handleClearAll}
                disabled={savedCount === 0}
              >
                Vaciar lista
              </button>

              {savedCount === 0 ? (
                <button
                  type="button"
                  className="saved-modal-primary saved-modal-primary-disabled"
                  disabled
                >
                  Ir al formulario
                </button>
              ) : (
                <Link to="/forms" className="saved-modal-primary">
                  Ir al formulario
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
