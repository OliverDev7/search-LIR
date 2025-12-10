// src/page/ResetPass/ResetPass.jsx
import React, { useState } from "react";
import "./styles/ResetPass.css";

const ResetPass = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí luego conectarás con tu backend para enviar el correo de reset
    console.log("Reset password for:", email);
    setSent(true);
  };

  return (
    <div className="auth-page reset-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Recuperar contraseña</h1>
          <p>
            Ingresa tu correo y te enviaremos un enlace para restablecer tu
            contraseña.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="reset-email">Correo electrónico</label>
            <input
              id="reset-email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <button type="submit" className="auth-button primary">
            Enviar instrucciones
          </button>
        </form>

        {sent && (
          <div className="reset-feedback">
            <p>
              Si el correo existe en nuestro sistema, recibirás un enlace para
              restablecer tu contraseña en unos minutos.
            </p>
          </div>
        )}

        <div className="auth-footer-text">
          <a href="/login" className="auth-link">
            Volver al inicio de sesión
          </a>
        </div>
      </div>

      <div className="auth-side-panel reset-side">
        <div className="auth-side-content">
          <h2 className="text-white">Tranquilo, lo solucionamos</h2>
          <p className="subtext-white">
            La seguridad de tu cuenta es prioridad.
            El proceso de recuperación es simple y seguro,
            para que puedas volver a trabajar cuanto antes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPass;
