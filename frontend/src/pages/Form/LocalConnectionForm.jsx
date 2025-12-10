// src/pages/GlobalConnectionForm.jsx
import React, { useEffect, useState } from "react";
import "./styles/LocalConnectionForm.css";

const LOCAL_STORAGE_KEY = "lm_saved_firms";

const LocalConnectionForm = () => {
    const [savedFirms, setSavedFirms] = useState([]);
    const [tagOptions, setTagOptions] = useState({ paises: [], areas: [] });

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        area: "",
        country: "",
        firmType: [],
        marketYears: "",
        leadExperience: "",
        otherCharacteristics: [],
        comments: "",
        urgency: "",
        billingPreference: "",
        assignment: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);

    /* ------------------------- Cargar firmas guardadas ------------------------- */
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            setSavedFirms(Array.isArray(parsed) ? parsed : []);
        } catch {
            setSavedFirms([]);
        }
    }, []);

    /* ---------------------- Cargar países y áreas dinámicos -------------------- */
    useEffect(() => {
        async function loadTags() {
            try {
                const res = await fetch("/api/form-tags");
                const data = await res.json();
                setTagOptions(data);
            } catch (err) {
                console.error("Error cargando tags", err);
            }
        }
        loadTags();
    }, []);

    /* ---------------------------- Handlers ---------------------------- */
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Checkbox multilples → firmType
        if (name === "firmType" && type === "checkbox") {
            setFormData((prev) => {
                const updated = new Set(prev.firmType);
                if (checked) updated.add(value);
                else updated.delete(value);
                return { ...prev, firmType: Array.from(updated) };
            });
            return;
        }

        // Checkbox → otherCharacteristics
        if (name === "otherCharacteristics" && type === "checkbox") {
            setFormData((prev) => {
                const updated = new Set(prev.otherCharacteristics);
                if (checked) updated.add(value);
                else updated.delete(value);
                return { ...prev, otherCharacteristics: Array.from(updated) };
            });
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    /* ------------------------------- Submit ------------------------------ */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");
        setSubmitSuccess(false);

        if (!formData.email.trim()) {
            setSubmitError("Por favor ingresa un correo electrónico.");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                tipoForm: "globalForm",
                savedFirms
            };

            const res = await fetch("/api/form-submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Error al enviar el formulario.");

            setSubmitSuccess(true);

            // Reset
            setFormData({
                name: "",
                email: "",
                area: "",
                country: "",
                firmType: [],
                marketYears: "",
                leadExperience: "",
                otherCharacteristics: [],
                comments: "",
                urgency: "",
                billingPreference: "",
                assignment: ""
            });

        } catch (err) {
            console.error(err);
            setSubmitError("Hubo un problema al enviar tus respuestas.");
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ------------------------------ JSX ------------------------------ */
    return (
        <div className="gc-wrapper">
            <div className="gc-card">
                <header className="gc-header">
                    <h1>Formulario de Conexión Local</h1>
                    <p>Complete los datos para recibir asistencia personalizada.</p>
                    <p className="gc-saved-count">
                        Firmas guardadas: <strong>{savedFirms.length}</strong>
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="gc-form">

                    <div className="gc-field">
                        <label htmlFor="name">Nombre</label>
                        <input id="name" name="name" value={formData.name} onChange={handleChange} />
                    </div>

                    <div className="gc-field">
                        <label htmlFor="email">Correo electrónico *</label>
                        <input id="email" name="email" required value={formData.email} onChange={handleChange} />
                    </div>

                    <div className="gc-field">
                        <label htmlFor="country">País</label>
                        <select id="country" name="country" value={formData.country} onChange={handleChange}>
                            <option value="">Seleccione un país</option>
                            {tagOptions.paises.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="gc-field">
                        <label htmlFor="area">Área de práctica profesional</label>
                        <select id="area" name="area" value={formData.area} onChange={handleChange}>
                            <option value="">Seleccione un área</option>
                            {tagOptions.areas.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    <div className="gc-field">
                        <label>Tipo de firma</label>
                        <div className="gc-checkbox-group">
                            <label><input type="checkbox" name="firmType" value="internacional" onChange={handleChange} /> Internacional full service</label>
                            <label><input type="checkbox" name="firmType" value="local" onChange={handleChange} /> Local full service</label>
                            <label><input type="checkbox" name="firmType" value="boutique" onChange={handleChange} /> Boutique</label>
                            <label><input type="checkbox" name="firmType" value="cualquiera" onChange={handleChange} /> Cualquiera</label>
                        </div>
                    </div>

                    <div className="gc-field">
                        <label htmlFor="marketYears">Años en el mercado</label>
                        <select id="marketYears" name="marketYears" onChange={handleChange}>
                            <option value="">Seleccione</option>
                            <option value="menos-5">Menos de 5 años</option>
                            <option value="mas-5">Más de 5 años</option>
                            <option value="mas-10">Más de 10 años</option>
                            <option value="mas-20">Más de 20 años</option>
                        </select>
                    </div>

                    <div className="gc-field">
                        <label htmlFor="leadExperience">Años de experiencia del abogado a cargo</label>
                        <select id="leadExperience" name="leadExperience" onChange={handleChange}>
                            <option value="">Seleccione</option>
                            <option value="menos-5">Menos de 5 años</option>
                            <option value="mas-5">Más de 5 años</option>
                            <option value="mas-15">Más de 15 años</option>
                        </select>
                    </div>

                    <div className="gc-field">
                        <label>Otras características de la firma</label>
                        <div className="gc-checkbox-group">
                            <label><input type="checkbox" name="otherCharacteristics" value="rankings" onChange={handleChange} /> Reconocida en rankings </label>
                            <label><input type="checkbox" name="otherCharacteristics" value="area_experience" onChange={handleChange} /> Experiencia en el área requerida</label>
                            <label><input type="checkbox" name="otherCharacteristics" value="partner_masters" onChange={handleChange} /> Socio con posgrado</label>
                        </div>
                    </div>

                    <div className="gc-field">
                        <label htmlFor="comments">Comentarios</label>
                        <textarea id="comments" name="comments" value={formData.comments} onChange={handleChange}></textarea>
                    </div>

                    <div className="gc-field">
                        <label htmlFor="urgency">Nivel de urgencia</label>
                        <select id="urgency" name="urgency" onChange={handleChange}>
                            <option value="">Seleccione</option>
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baja">Baja</option>
                        </select>
                    </div>

                    <div className="gc-field">
                        <label htmlFor="billingPreference">Preferencia de cobro</label>
                        <select id="billingPreference" name="billingPreference" onChange={handleChange}>
                            <option value="">Seleccione</option>
                            <option value="por-hora">Por hora</option>
                            <option value="suma-alzada">Suma alzada</option>
                            <option value="ambas">Ambas</option>
                        </select>
                    </div>

                    <div className="gc-field">
                        <label htmlFor="assignment">Encargo</label>
                        <textarea id="assignment" name="assignment" rows={3} value={formData.assignment} onChange={handleChange}></textarea>
                    </div>

                    {submitError && <div className="gc-error">{submitError}</div>}
                    {submitSuccess && <div className="gc-success">¡Formulario enviado correctamente!</div>}

                    <button type="submit" disabled={isSubmitting} className="gc-submit">
                        {isSubmitting ? "Enviando..." : "Enviar"}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default LocalConnectionForm;
