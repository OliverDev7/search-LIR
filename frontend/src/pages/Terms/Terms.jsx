// src/pages/Terms/Terms.jsx
import React from "react";
import "./styles/Terms.css";

const Terms = () => {
  return (
    <div className="page-wrapper">
      <section className="page-hero">
        <h1>Términos y condiciones</h1>
        <p>
          Estos términos regulan el uso de la plataforma de búsqueda semántica
          para firmas legales.
        </p>
      </section>

      <section className="terms-content">
        <h2>Uso permitido</h2>
        <p>
          La plataforma se puede utilizar únicamente para fines internos del
          proyecto y según los acuerdos establecidos con cada estudio.
        </p>

        <h2>Responsabilidad</h2>
        <p>
          El contenido y los datos provienen de fuentes externas. La
          herramienta organiza y prioriza, pero no sustituye el análisis
          profesional de un abogado.
        </p>

        <h2>Modificaciones</h2>
        <p>
          La plataforma puede evolucionar, incorporar nuevos módulos o cambiar
          ciertas funcionalidades sin previo aviso, siempre manteniendo el foco
          en mejorar la experiencia de búsqueda.
        </p>
      </section>
    </div>
  );
};

export default Terms;
