// src/pages/AboutUs/AboutUs.jsx
import React from "react";
import "./styles/AboutUs.css";

const AboutUs = () => {
  return (
    <div className="page-wrapper">
      <section className="page-hero">
        <h1>Sobre nosotros</h1>
        <p>
          Detrás de esta herramienta hay un equipo que vive entre datos,
          rankings y el ecosistema legal, buscando hacer esa información mucho
          más utilizable.
        </p>
      </section>

      <section className="aboutus-grid">
        <article className="page-card">
          <h2>Nuestra visión</h2>
          <p>
            Que cualquier persona pueda entender rápidamente qué hace una firma,
            en qué es fuerte y con qué tipos de clientes trabaja, sin leer
            páginas y páginas de texto.
          </p>
        </article>

        <article className="page-card">
          <h2>Nuestro foco</h2>
          <p>
            Tecnología aplicada al contenido legal: ordenar, etiquetar y
            priorizar información para que los rankings, testimonios y
            highlights sean realmente navegables.
          </p>
        </article>

        <article className="page-card">
          <h2>Próximos pasos</h2>
          <p>
            Integraciones con más fuentes, evolución semántica y modelos
            específicos para distintas jurisdicciones y áreas de práctica.
          </p>
        </article>
      </section>
    </div>
  );
};

export default AboutUs;
