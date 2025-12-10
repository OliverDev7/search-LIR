// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./styles/Footer.css";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <h4>Search Engine by LIR</h4>
          <p>
            Buscador semántico para firmas legales, pensado para explorar
            conceptos complejos de forma simple e inteligente.
          </p>
        </div>

        <div className="footer-columns">
          <div className="footer-col">
            <h5>Plataforma</h5>
            <Link to="/how-it-works" className="footer-link">
              Cómo funciona
            </Link>
            <Link to="/about-tool" className="footer-link">
              Sobre la herramienta
            </Link>
            <Link to="/about-us" className="footer-link">
              Sobre nosotros
            </Link>
          </div>

          <div className="footer-col">
            <h5>Soporte</h5>
            <Link to="/contact" className="footer-link">
              Contacto
            </Link>
            <Link to="/terms" className="footer-link">
              Términos y condiciones
            </Link>
            <Link to="/privacy-policy" className="footer-link">
              Política de privacidad
            </Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} LIR. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
};

export default Footer;
