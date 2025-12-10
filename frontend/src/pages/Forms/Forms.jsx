// src/pages/Forms.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Importamos Link para la navegación
import './styles/Forms.css';

const Forms = () => {
    return (
        <div className="forms-container">
            <h1>Selecciona un Servicio</h1>
            <div className="cards-grid">
                {/* Tarjeta 1: Local Connection */}
                <div className="card">
                    <h2 className="card-title">Local Connection</h2>
                    <p className="card-description">
                        Acceda a firmas legales calificadas en su misma zona de operación, a través de una red local validada y de alta confianza. Recibimos su requerimiento y verificamos los criterios definidos por su empresa: área de práctica, experiencia específica, formación, reconocimientos, tamaño del equipo, tiempos de respuesta, entre otros. A partir de ello, activamos nuestra red local de firmas jurídicas previamente evaluadas y las invitamos a participar en un proceso de licitación ciega de honorarios. Así garantizamos soluciones legales alineadas con sus necesidades, con eficiencia, transparencia y condiciones competitivas.
                    </p>
                    {/* Botón que redirige a /local-connection-form */}
                    <Link to="/form-local-connection" className="card-button">Formulario de envío</Link>
                </div>

                {/* Tarjeta 2: Global Connection */}
                <div className="card">
                    <h2 className="card-title">Global Connection</h2>
                    <p className="card-description">
                        Conecte con firmas legales en el extranjero a través de una red internacional de más de 1.000 estudios jurídicos en 45 países. Recibimos su requerimiento y verificamos los criterios definidos por su organización: jurisdicción, especialidad, experiencia en industrias específicas, acreditaciones internacionales, idiomas, estructura del equipo, zonas horarias compatibles, entre otros. Con esa información, activamos nuestra red global de firmas validadas y las invitamos a participar en una licitación ciega. Así garantizamos una selección transparente, eficiente y con condiciones altamente competitivas, para apoyar sus operaciones legales transfronterizas.
                    </p>
                    {/* Botón que redirige a /global-connection-form */}
                    <Link to="/form-global-connection" className="card-button">Formulario de envío</Link>
                </div>

                {/* Tarjeta 3: Fee Benchmarking */}
                <div className="card">
                    <h2 className="card-title">Fee Benchmarking</h2>
                    <p className="card-description">
                        Assess whether the legal fees you currently pay align with market standards —using real, comparable, and objective data. Through blind and comparative studies, we help companies and law firms review their current fee structures, both for ongoing counsel and specific matters. Leveraging our active network and deep knowledge of the leading jurisdictions across five continents, we deliver independent, transparent, and competitive analyses. A powerful tool to strengthen internal processes, improve legal procurement efficiency, and foster more balanced relationships with.
                    </p>
                    {/* Botón que redirige a /fee-benchmarking-form */}
                    <Link to="/form-fee-benchmarking" className="card-button">Formulario de envío</Link>
                </div>
            </div>
        </div>
    );
};

export default Forms;