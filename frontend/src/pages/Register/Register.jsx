// src/page/Register/Register.jsx
import React, { useState } from "react";
import "./styles/Register.css";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí luego conectarás con tu backend / registro real
    console.log("Register:", form);
  };

  return (
    <div className="auth-page register-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Crea tu cuenta</h1>
          <p>Configura tu acceso al buscador semántico de firmas.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="reg-name">Nombre completo</label>
            <input
              id="reg-name"
              name="name"
              type="text"
              placeholder="Tu nombre"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email">Correo electrónico</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password">Contraseña</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-confirm">Confirmar contraseña</label>
            <input
              id="reg-confirm"
              name="confirm"
              type="password"
              placeholder="Repite tu contraseña"
              value={form.confirm}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-button primary">
            Crear cuenta
          </button>
        </form>

        <div className="auth-footer-text">
          <span>¿Ya tienes cuenta?</span>
          <a href="/login" className="auth-link strong">
            Iniciar sesión
          </a>
        </div>
      </div>

      <div className="auth-side-panel register-side">
        <div className="auth-side-content">
          <h2 className="text-white">Diseñado para el sector legal</h2>
          <p className="subtext-white">
            Centraliza información de firmas, rankings y áreas de práctica.
            Todo en un solo lugar, con un buscador que entiende tus conceptos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
