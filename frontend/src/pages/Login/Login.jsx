// src/page/Login/Login.jsx
import React, { useState } from "react";
import "./styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí luego conectarás con tu backend / auth real
    console.log("Login:", { email, password });
  };

  return (
    <div className="auth-page login-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Bienvenido de vuelta</h1>
          <p>Accede a tu panel de búsqueda inteligente.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div className="auth-field-extra">
              <a href="/reset-password" className="auth-link">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>

          <button type="submit" className="auth-button primary">
            Iniciar sesión
          </button>
        </form>

        <div className="auth-footer-text">
          <span>¿No tienes cuenta?</span>
          <a href="/register" className="auth-link strong">
            Crear una cuenta
          </a>
        </div>
      </div>

      <div className="auth-side-panel">
        <div className="auth-side-content">
          <h2>Legal Intelligence</h2>
          <p>
            Busca firmas legales por conceptos, filtra por país y región,
            y descubre insights estratégicos para el sector legal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
