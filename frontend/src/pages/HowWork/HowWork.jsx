// src/pages/HowWork/HowWork.jsx
import React from "react";
import "./styles/HowWork.css";

const HowWork = () => {
  return (
    <div className="page-wrapper">
      <section className="page-hero">
        <h1>Cómo funciona</h1>
        <p>
          Entiende cómo el motor semántico interpreta conceptos complejos y los
          traduce en resultados relevantes para cada firma legal.
        </p>
      </section>

      <section className="page-content-grid">
        <article className="page-card">
          <h2>1. Ingesta de datos</h2>
          <p>
            Leemos las descripciones, highlights y testimonios desde tu base de
            datos (actualmente Google Sheets) para construir una capa semántica
            sobre cada firma.
          </p>
        </article>

        <article className="page-card">
          <h2>2. Tags conceptuales</h2>
          <p>
            A partir de los textos, generamos tags conceptuales que agrupan
            ideas como “energía renovable”, “proyectos extractivos” o
            “financiamiento estructurado”.
          </p>
        </article>

        <article className="page-card">
          <h2>3. Búsqueda semántica</h2>
          <p>
            Cuando escribes un concepto, el motor compara tu búsqueda con esos
            tags y prioriza las firmas más cercanas, incluso si no usas la
            palabra exacta.
          </p>
        </article>

        <article className="page-card">
          <h2>4. Filtros inteligentes</h2>
          <p>
            Puedes combinar conceptos con filtros por país y región, lo que te
            permite explorar el mapa completo de capacidades legales de forma
            muy precisa.
          </p>
        </article>
      </section>
    </div>
  );
};

export default HowWork;
