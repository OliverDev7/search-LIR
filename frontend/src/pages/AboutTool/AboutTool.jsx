// src/pages/AboutTool/AboutTool.jsx
import React from "react";
import "./styles/AboutTool.css";

const AboutTool = () => {
  return (
    <div className="page-wrapper">
      <section className="page-hero">
        <h1>Sobre la herramienta</h1>
        <p>
          Esta plataforma fue creada para leer el lenguaje del mercado legal:
          rankings, testimonios, highlights y descripciones complejas, y
          transformarlo en un buscador semántico usable.
        </p>
      </section>

      <section className="about-grid">
        <article className="page-card">
          <h2>Diseñada para firmas legales</h2>
          <p>
            No es un buscador genérico. Está pensado para capturar matices
            propios del mundo legal: áreas de práctica, industrias, deal types
            y niveles de ranking.
          </p>
        </article>

        <article className="page-card">
          <h2>Basada en datos estructurados</h2>
          <p>
            Hoy se conecta a Google Sheets, pero la arquitectura está preparada
            para migrar a una base de datos sólida sin cambiar la experiencia de
            usuario.
          </p>
        </article>

        <article className="page-card">
          <h2>Relevancia visible</h2>
          <p>
            Cada resultado muestra un indicador de relevancia para que sepas qué
            tan bien responde a la búsqueda y cómo se priorizan las firmas.
          </p>
        </article>

        <article className="page-card">
          <h2>Evolución constante</h2>
          <p>
            El objetivo es ir sumando más capas: embeddings, sinónimos
            específicos del sector, contexto jurisdiccional y otros elementos
            que hagan la búsqueda cada vez más inteligente.
          </p>
        </article>
      </section>
    </div>
  );
};

export default AboutTool;
