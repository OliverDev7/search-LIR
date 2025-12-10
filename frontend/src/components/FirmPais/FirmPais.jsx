// src/components/FirmPais/FirmPais.jsx
import React from "react";
import "../FirmCard/styles/FirmCard.css";

const normalizeRank = (r) => {
    const n = Number(r);
    if (!Number.isFinite(n) || n <= 0) return null; // 0 => sin ranking
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
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const FirmPais = ({ firm }) => {
    const { firm: name, country, area, ranked, tags, relevance } = firm;
    const { label: rankLabel, className: rankClass } = getRankInfo(ranked);

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
                },
            })
        );
    };

    return (
        <article className="firm-card">
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
                {area && <span className="firm-area">{area}</span>}
            </div>

            {tags && tags.length > 0 && (
                <div className="firm-tags">
                    {tags.slice(0, 8).map((t) => (
                        <span key={t} className="firm-tag">
                            {t}
                        </span>
                    ))}
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
    );
};

export default FirmPais;
