// src/pages/Politics/Politics.jsx
import React from "react";
import "./styles/Politics.css";

const Politics = () => {
  return (
    <div className="page-wrapper">
      <section className="page-hero">
        <h1>Política de privacidad</h1>
        <p>
          Respetamos la confidencialidad de la información y los datos que se
          cargan en la plataforma. Esta sección resume cómo los tratamos.
        </p>
      </section>

      <section className="policy-content">
        <h2>Datos que utilizamos</h2>
        <p>
          La plataforma trabaja principalmente con datos públicos o
          proporcionados directamente por los estudios: descripciones de áreas,
          clientes destacados, work highlights y testimonios.
        </p>

        <h2>Uso de la información</h2>
        <p>
          La información se usa exclusivamente para alimentar el motor de
          búsqueda semántica y mejorar la experiencia de exploración dentro de
          la herramienta.
        </p>

        <h2>Protección y acceso</h2>
        <p>
          No compartimos tus datos con terceros sin autorización previa. El
          acceso se limita a los usuarios indicados en el proyecto y se puede
          revocar en cualquier momento.
        </p>
      </section>
    </div>
  );
};

export default Politics;
