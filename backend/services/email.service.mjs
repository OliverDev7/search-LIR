import { transporter, canSendEmail } from "../config/mailConfig.mjs";
import { ENV } from "../config/env.mjs";
import { escapeHtml } from "../lib/utils/escapeHtml.mjs";
import { generatePDF } from "./pdf.service.mjs";
import fs from "fs";

function buildHTMLEmail(payload) {
    const safe = v =>
        !v ? "<em>No proporcionado</em>" : escapeHtml(String(v));

    const renderArray = arr =>
        Array.isArray(arr) && arr.length
            ? arr.map(x => `<li>${escapeHtml(x)}</li>`).join("")
            : "<li><em>No aplica</em></li>";

    return `
    <div style="font-family:Arial;color:#333">
      <h2 style="color:#0b59a6;">Formulario de Firmas</h2>
      <table style="width:100%;border-collapse:collapse">
        <tbody>
          <tr><td>Nombre</td><td>${safe(payload.name)}</td></tr>
          <tr><td>Correo</td><td>${safe(payload.email)}</td></tr>
          <tr><td>País</td><td>${safe(payload.country)}</td></tr>
          <tr><td>Área</td><td>${safe(payload.area)}</td></tr>
          <tr><td>Tipo de firma</td><td>${safe(payload.firmType)}</td></tr>
          <tr><td>Años en el mercado</td><td>${safe(payload.marketYears)}</td></tr>
          <tr><td>Experiencia abogado</td><td>${safe(payload.leadExperience)}</td></tr>
          <tr><td>Características</td><td><ul>${renderArray(payload.otherCharacteristics)}</ul></td></tr>
        </tbody>
      </table>
    </div>
  `;
}

export async function sendFormEmail(payload) {
    if (!canSendEmail()) {
        console.warn("⚠️ Email no enviado: SMTP incompleto.");
        return;
    }

    const pdfPath = await generatePDF(payload);

    try {
        await transporter.sendMail({
            from: `"${ENV.FROM_NAME || "Formulario"}" <${ENV.FROM_EMAIL || ENV.SMTP_USER}>`,
            to: ENV.TO_EMAIL,
            subject: `Nuevo envío formulario — ${payload.name || payload.email}`,
            html: buildHTMLEmail(payload),
            attachments: [
                { filename: "reporte_formulario.pdf", path: pdfPath }
            ]
        });
    } finally {
        setTimeout(() => {
            try { fs.unlinkSync(pdfPath); } catch { }
        }, 1500);
    }
}
