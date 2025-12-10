// src/components/FirmDetails/FirmDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./styles/FirmDetail.css";


const getRankInfo = (r) => {
    if (r === 1) {
        return { label: "Excelente", className: "rank-excellent" };
    }
    if (r === 2) {
        return { label: "Bueno", className: "rank-good" };
    }
    if (r === 3) {
        return { label: "Medio", className: "rank-medium" };
    }
    if (r >= 4) {
        return { label: "Bajo", className: "rank-low" };
    }
    return { label: "Sin ranking", className: "rank-unknown" };
};

const FirmDetails = ({ firm: firmProp, onClose }) => {
    const { id } = useParams(); // <-- para leer /firm/:id
    const [firm, setFirm] = useState(firmProp || null);

    // 🔥 Si NO viene por props, cargamos desde API
    useEffect(() => {
        if (firmProp) return; // si viene por props, no hacemos fetch

        const loadFirm = async () => {
            try {
                const res = await axios.get(`/api/firm-details?id=${id}`);
                setFirm(res.data);
            } catch (err) {
                console.error("Error cargando detalles de firma:", err);
            }
        };

        loadFirm();
    }, [id, firmProp]);

    if (!firm) return null;

    const {
        firm: name,
        country,
        region,
        area,
        ranked,
        relevance,
        tags = [],
        description,
        workHighlights,
        keyClients,
        testimonials,
    } = firm;

    const { label: rankLabel, className: rankClass } = getRankInfo(ranked);

    return (
        <section className="firm-details">
            {/* Header */}
            <header className="firm-details-header">
                <div className="firm-details-title-block">
                    <h1 className="firm-details-name">
                        {name || "Firma sin nombre"}
                    </h1>

                    <div className="firm-details-meta-row">
                        {country && (
                            <span className="firm-details-chip firm-details-chip-outline">
                                {country}
                            </span>
                        )}
                        {region && (
                            <span className="firm-details-chip firm-details-chip-outline">
                                {region}
                            </span>
                        )}
                        {area && (
                            <span className="firm-details-chip firm-details-chip-soft">
                                {area}
                            </span>
                        )}
                    </div>
                </div>

                <div className="firm-details-right">
                    <div className="firm-details-badges">
                        <span className={`firm-details-rank ${rankClass}`}>
                            {rankLabel}
                        </span>
                        {typeof relevance === "number" && (
                            <span className="firm-details-relevance">
                                Relevancia {relevance}%
                            </span>
                        )}
                    </div>

                    {onClose && (
                        <button
                            type="button"
                            className="firm-details-close-btn"
                            onClick={onClose}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </header>

            {/* Tags principales */}
            {tags && tags.length > 0 && (
                <div className="firm-details-tags-block">
                    <h2 className="firm-details-section-title">Conceptos clave</h2>
                    <div className="firm-details-tags">
                        {tags.map((t) => (
                            <span key={t} className="firm-details-tag">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Contenido en columnas */}
            <div className="firm-details-grid">
                {/* Columna 1 */}
                <div className="firm-details-col">
                    <div className="firm-details-card">
                        <h3 className="firm-details-card-title">Descripción general</h3>
                        <p className="firm-details-card-text">
                            {description && description.trim()
                                ? description
                                : "Esta firma no tiene una descripción detallada disponible en este momento, pero forma parte del ecosistema de firmas monitoreadas por LIR."}
                        </p>
                    </div>

                    <div className="firm-details-card">
                        <h3 className="firm-details-card-title">Work Highlights</h3>
                        <p className="firm-details-card-text">
                            {workHighlights && workHighlights.trim()
                                ? workHighlights
                                : "Aún no se han registrado casos emblemáticos para esta firma en la base de datos."}
                        </p>
                    </div>
                </div>

                {/* Columna 2 */}
                <div className="firm-details-col">
                    <div className="firm-details-card">
                        <h3 className="firm-details-card-title">Clientes clave</h3>
                        <p className="firm-details-card-text">
                            {keyClients && keyClients.trim()
                                ? keyClients
                                : "No se han declarado clientes clave para esta firma en la hoja de resultados."}
                        </p>
                    </div>

                    <div className="firm-details-card">
                        <h3 className="firm-details-card-title">Testimonios</h3>
                        <p className="firm-details-card-text">
                            {testimonials && testimonials.trim()
                                ? testimonials
                                : "Todavía no hay testimonios asociados a esta firma en la base de datos."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Nota final / contexto */}
            <footer className="firm-details-footer">
                <p>
                    Esta vista forma parte del buscador semántico de LIR.
                    La información se nutre dinámicamente de los rankings y descripciones
                    contenidas en la hoja de datos de Legal Monitor.
                </p>
            </footer>
        </section>
    );
};

export default FirmDetails;
