import { appendFormResponse, loadTagsSimple } from "../src/googleSheets.mjs";
import { canSendEmail, transporter, FROM_EMAIL, FROM_NAME, TO_EMAIL } from "../config/emailConfig.js";
import { buildHTMLEmail } from "../lib/utils/emailUtils.js";
import { generatePDF, TEMP_DIR } from "../lib/utils/pdfUtils.js";

// ✔ Endpoint para tags del formulario
const getFormTags = async (req, res) => {
    try {
        const tags = await loadTagsSimple(); // devuelve { paises: [], areas: [] }
        res.json(tags);
    } catch (err) {
        console.error("❌ Error en /api/form-tags:", err);
        res.status(500).json({ error: "Error interno al leer Tags conceptos" });
    }
};

// 🔹 Endpoint para recibir el formulario y guardar en Google Sheets
const submitForm = async (req, res) => {
    try {
        const payload = req.body || {};

        // Asegurarnos de que savedFirms sea siempre un arreglo
        const savedFirms = Array.isArray(payload.savedFirms) ? payload.savedFirms : [];

        const dataToSave = {
            ...payload,
            savedFirms,
            // asegurar los nuevos campos (si vienen vacíos que sean string vacío)
            marketYears: payload.marketYears || "",
            leadExperience: payload.leadExperience || ""
        };

        // 1) Guardar en Google Sheets (tu función existente)
        await appendFormResponse(dataToSave);

        // 2) Intentar enviar correo (si está configurado)
        if (canSendEmail()) {
            try {
                const mailOptions = {
                    from: `"${FROM_NAME || "Formulario"}" <${FROM_EMAIL || SMTP_USER}>`,
                    to: TO_EMAIL,
                    subject: `Nuevo envío formulario — ${payload.name || payload.email || 'Sin nombre'}`,
                    html: buildHTMLEmail(dataToSave),
                    text: `Nuevo envío de formulario. Nombre: ${payload.name || ''} - Email: ${payload.email || ''}`
                };

                // Generar PDF y adjuntar
                let pdfPath;
                try {
                    pdfPath = await generatePDF(dataToSave);
                    // adjuntar el pdf
                    mailOptions.attachments = [
                        {
                            filename: "reporte_formulario.pdf",
                            path: pdfPath
                        }
                    ];
                } catch (errPdf) {
                    console.error("❌ Error generando PDF:", errPdf);
                    // seguimos sin adjunto si falla
                }

                await transporter.sendMail(mailOptions);
                console.log("✔️ Email enviado a", TO_EMAIL);

                // limpiar pdf temporal (si fue generado)
                if (pdfPath) {
                    setTimeout(() => {
                        try { fs.unlinkSync(pdfPath); } catch (e) { /* ignore */ }
                    }, 2000);
                }
            } catch (errMail) {
                console.error("❌ Error enviando email:", errMail);
                // No interrumpimos la respuesta; devolvemos ok: true aunque falle el mail.
            }
        } else {
            console.warn("⚠️ Email no enviado: configuración SMTP/TO_EMAIL incompleta.");
        }

        return res.json({ ok: true });
    } catch (err) {
        console.error("❌ Error en /api/form-submit:", err);
        return res.status(500).json({ ok: false, error: "Error al guardar en Google Sheets" });
    }
};


// ---------------- Endpoint para generar y devolver PDF (para ver/descargar desde frontend) ----------------
const generateFormPDF = async (req, res) => {
    try {
        const payload = req.body || {};
        // asegurar arrays/strings
        payload.savedFirms = Array.isArray(payload.savedFirms) ? payload.savedFirms : [];
        payload.marketYears = payload.marketYears || "";
        payload.leadExperience = payload.leadExperience || "";

        const pdfPath = await generatePDF(payload);

        // Stream the file to response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="reporte_formulario.pdf"`);

        const readStream = fs.createReadStream(pdfPath);
        readStream.pipe(res);

        // delete file after streaming finishes
        readStream.on('close', () => {
            try { fs.unlinkSync(pdfPath); } catch (e) { /* ignore */ }
        });

    } catch (err) {
        console.error("❌ Error en /api/form-pdf:", err);
        res.status(500).json({ ok: false, error: "Error generando PDF" });
    }
};

export { getFormTags, submitForm, generateFormPDF };