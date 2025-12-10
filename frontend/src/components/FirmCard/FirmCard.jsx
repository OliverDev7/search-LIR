// FirmCard.jsx
import React from "react";
import "./styles/FirmCard.css";
import { useNavigate } from "react-router-dom";

const normalizeRank = (r) => {
  const n = Number(r);
  if (!Number.isFinite(n) || n <= 0) return null; // 0, NaN, negativos => sin ranking
  return n;
};

const getRankInfo = (r) => {
  const n = normalizeRank(r);

  if (n === null) {
    return { label: "Sin ranking", className: "rank-unknown" };
  }
  if (n === 1) {
    return { label: "Excelente", className: "rank-excellent" };
  }
  if (n === 2) {
    return { label: "Bueno", className: "rank-good" };
  }
  if (n === 3) {
    return { label: "Medio", className: "rank-medium" };
  }
  if (n >= 4) {
    return { label: "Bajo", className: "rank-low" };
  }
  return { label: "Sin ranking", className: "rank-unknown" };
};

// Normalizador universal para comparar tags (minúsculas, sin tildes, sin espacios extra)
const normalizeText = (str) =>
  String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const FirmCard = ({ firm, activeTags = [], highlightMatch }) => {
  const { firm: name, country, area, ranked, tags, relevance } = firm;

  const { label: rankLabel, className: rankClass } = getRankInfo(ranked);

  const navigate = useNavigate();

  const [showAreasModal, setShowAreasModal] = React.useState(false);
  const [showTagsModal, setShowTagsModal] = React.useState(false);

  function cleanFirmName(name) {
    if (!name) return "";
    let clean = name;
    clean = clean.replace(/\(.*?\)/g, "").trim();
    clean = clean.replace(/\b(\w+)\b\s+\1\b$/i, "$1");
    clean = clean.replace(/\s{2,}/g, " ").trim();
    return clean;
  }

  const slugify = (str) =>
    cleanFirmName(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quitar acentos
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .trim();

  const handleRankingClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const countrySlug = slugify(country);
    const firmSlug = slugify(name);

    const url = `https://lm.thelegalindustry.com/market-firm/${countrySlug}/${firmSlug}`;

    window.open(url, "_blank");
  };

  const handleAgregar = () => {
    window.dispatchEvent(
      new CustomEvent("saved-firm:add", {
        detail: {
          id: firm.id,
          firm: firm.firm,
          area: firm.area,
          ranking: firm.ranked,
          country: firm.country,
        },
      })
    );
  };

  // 🔴 Conjunto de tags activos / buscados (para marcar en rojo)
  const activeNormalized = React.useMemo(() => {
    const base = [...(activeTags || [])];
    if (highlightMatch) base.push(highlightMatch);

    return new Set(base.map(normalizeText).filter(Boolean));
  }, [activeTags, highlightMatch]);

  // 👉 Ahora solo queremos 5 tags visibles
  const MAX_VISIBLE_TAGS = 5;

  // 👀 Ordenar tags: primero los que están siendo buscados, luego el resto
  const priorityTags = [];
  const otherTags = [];

  (tags || []).forEach((tag) => {
    const norm = normalizeText(tag);
    const isActive = activeNormalized.has(norm);
    if (isActive) {
      priorityTags.push({ tag, norm, isActive: true });
    } else {
      otherTags.push({ tag, norm, isActive: false });
    }
  });

  // Evitar duplicados manteniendo prioridad
  const seen = new Set();
  const orderedTags = [];

  [...priorityTags, ...otherTags].forEach(({ tag, norm, isActive }) => {
    if (seen.has(norm)) return;
    seen.add(norm);
    orderedTags.push({ tag, isActive });
  });

  // 🔹 Lógica para elegir VISIBLES:
  // 1) Incluir todos los activos posibles (hasta 5)
  // 2) Rellenar con tags NO activos más cortos
  const activeList = orderedTags.filter((t) => t.isActive);
  const inactiveList = orderedTags.filter((t) => !t.isActive);

  const visibleTags = [];

  // 1) Primero los activos (en el orden que ya venían)
  for (const t of activeList) {
    if (visibleTags.length >= MAX_VISIBLE_TAGS) break;
    visibleTags.push(t);
  }

  // 2) Luego, entre los no activos, los más cortos primero
  const remainingSlots = MAX_VISIBLE_TAGS - visibleTags.length;
  if (remainingSlots > 0) {
    const sortedInactive = [...inactiveList].sort(
      (a, b) => a.tag.length - b.tag.length
    );
    for (const t of sortedInactive) {
      if (visibleTags.length >= MAX_VISIBLE_TAGS) break;
      // evitar duplicado por seguridad (no debería ocurrir)
      if (!visibleTags.some((v) => normalizeText(v.tag) === normalizeText(t.tag))) {
        visibleTags.push(t);
      }
    }
  }

  const hiddenCount =
    orderedTags.length > visibleTags.length
      ? orderedTags.length - visibleTags.length
      : 0;

  // 🔹 Áreas: usamos firm.areas si existe; si no, parseamos area (string)
  const areasArray = React.useMemo(() => {
    if (Array.isArray(firm.areas) && firm.areas.length > 0) {
      return firm.areas;
    }
    if (area) {
      return String(area)
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [firm.areas, area]);

  const areasString = areasArray.join(" | ");
  const hasAreas = areasArray.length > 0;

  return (
    <>
      <article className="firm-card">
        {highlightMatch && (
          <div className="firm-match-indicator">
            Esta firma habla de tu búsqueda
          </div>
        )}
        <header className="firm-card-header">
          <div className="firm-header-left">
            <h3 className="firm-name">{name || "Firma sin nombre"}</h3>
            <div className="firm-header-badges">
              <span className={`firm-rank ${rankClass}`}>{rankLabel}</span>
              {typeof relevance === "number" && (
                <span className="firm-relevance">
                  relevancia {relevance}%
                </span>
              )}
            </div>
          </div>

          <div className="firm-header-right">
            <button
              type="button"
              className="firm-ranking-btn"
              onClick={handleRankingClick}
            >
              <span className="firm-ranking-star">⭐</span>
              Ver en LM
            </button>
          </div>
        </header>

        <div className="firm-meta">
          <span className="firm-country">
            {country || "País no especificado"}
          </span>
        </div>

        {hasAreas && (
          <div className="firm-areas-preview">
            <span
              className="firm-areas-text"
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {areasString}
            </span>

            <button
              type="button"
              className="firm-areas-more-btn"
              onClick={() => setShowAreasModal(true)}
            >
              ... Ver más
            </button>
          </div>
        )}

        {visibleTags.length > 0 && (
          <div className="firm-tags">
            {visibleTags.map(({ tag, isActive }) => (
              <span
                key={tag}
                className={`firm-tag ${isActive ? "firm-tag-active" : ""}`}
              >
                {tag}
              </span>
            ))}

            {hiddenCount > 0 && (
              <button
                type="button"
                className="firm-tag firm-tag-more"
                onClick={() => setShowTagsModal(true)}
              >
                +{hiddenCount} más
              </button>
            )}
          </div>
        )}

        <div className="firm-card-footer">
          <button
            onClick={handleAgregar}
            type="button"
            className="firm-add-btn"
          >
            Agregar +
          </button>
        </div>
      </article>

      {/* Modal de ÁREAS */}
      {showAreasModal && (
        <div
          className="areas-modal-overlay"
          onClick={() => setShowAreasModal(false)}
        >
          <div
            className="areas-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="areas-modal-close"
              onClick={() => setShowAreasModal(false)}
            >
              ✕
            </button>

            <h3 className="areas-modal-title">{name} — Áreas</h3>

            <div className="areas-modal-list">
              {areasArray.map((a, i) => (
                <div key={i} className="areas-modal-item">
                  {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de TAGS */}
      {showTagsModal && (
        <div
          className="tags-modal-overlay"
          onClick={() => setShowTagsModal(false)}
        >
          <div
            className="tags-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="tags-modal-close"
              onClick={() => setShowTagsModal(false)}
            >
              ✕
            </button>

            <h3 className="tags-modal-title">{name} — Tags</h3>

            <div className="tags-modal-list">
              {orderedTags.map(({ tag, isActive }) => (
                <span
                  key={tag}
                  className={`firm-tag ${isActive ? "firm-tag-active" : ""}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FirmCard;
