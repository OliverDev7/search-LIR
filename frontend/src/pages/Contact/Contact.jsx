// src/pages/Contact/Contact.jsx
import React from "react";
import "./styles/Contact.css";

const Contact = () => {
  return (
    <div className="page-wrapper">
      <section className="page-hero">
        <h1>Contacto</h1>
        <p>
          ¿Quieres integrar el motor semántico a otra base de datos, ampliar
          países o explorar nuevas áreas? Escríbenos.
        </p>
      </section>

      <section className="contact-grid">
        <div className="contact-card">
          <h2>Envíanos un mensaje</h2>
          <form
            className="contact-form"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="form-row">
              <label>Nombre</label>
              <input type="text" placeholder="Tu nombre" />
            </div>

            <div className="form-row">
              <label>Email</label>
              <input type="email" placeholder="tu@correo.com" />
            </div>

            <div className="form-row">
              <label>Mensaje</label>
              <textarea
                rows="4"
                placeholder="Cuéntanos brevemente qué necesitas..."
              />
            </div>

            <button type="submit" className="contact-submit">
              Enviar mensaje
            </button>
          </form>
        </div>

        <div className="contact-side">
          <h2>Otras vías de contacto</h2>
          <p>
            También puedes escribirnos si quieres una demo guiada o explorar un
            caso de uso específico dentro de tu estudio.
          </p>
          <ul>
            <li>
              <strong>Email:</strong> contacto@legalsemanticengine.com
            </li>
            <li>
              <strong>Soporte:</strong> soporte@legalsemanticengine.com
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Contact;
