// src/server.mjs
import express from "express";
import cors from "cors";
import { loadFirmsFromSheet, appendFormResponse, loadTagsSimple } from "./googleSheets.mjs";
import {
    buildFuseIndex,
    semanticSearch,
    getQuickTags,
    searchByTag,
} from "./searchEngine.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Nuevos imports para PDF / FS
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

dotenv.config();

const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    TO_EMAIL,
    FROM_EMAIL,
    FROM_NAME
} = process.env || {};

// Configurar transporter de nodemailer
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? Number(SMTP_PORT) : 587,
    secure: SMTP_PORT && Number(SMTP_PORT) === 465, // true solo si puerto 465
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

// función rápida para evitar envío si no configurado
function canSendEmail() {
    return SMTP_HOST && SMTP_USER && SMTP_PASS && TO_EMAIL;
}
// ---------- END: Email (nodemailer) & dotenv ----------

const app = express();
app.use(cors());
app.use(express.json());

// Asegurar carpeta temp para PDFs
const TEMP_DIR = path.join(process.cwd(), "temp");
try {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
} catch (err) {
    console.warn("No se pudo crear carpeta temp:", err);
}

let FIRMS = [];
//let TAGS_CONCENTRADOS = [];   // ⬅️ NUEVO
let FUSE = null;

// Carga inicial del índice
async function init() {
    console.log("📄 Cargando datos desde Google Sheets...");

    // Cargar firmas
    FIRMS = await loadFirmsFromSheet();
    console.log(`   → ${FIRMS.length} filas cargadas.`);

    // Cargar tags concentrados
    // TAGS_CONCENTRADOS = await loadTagsConcentrados();   // ⬅️ NUEVO
    // console.log(`   → Tags concentrados cargados: ${TAGS_CONCENTRADOS.length}`);

    // Construir índice
    FUSE = buildFuseIndex(FIRMS);
    console.log("🔍 Índice Fuse.js construido.");

    const firmasConTags = FIRMS.filter((f) => (f.tags || []).length > 0);
    console.log(
        `   → Firmas con al menos 1 tag: ${firmasConTags.length}`
    );
}

// =============================== ENDPOINTS ===============================

// Obtener detalle de una firma por ID
app.get("/api/firm-details", (req, res) => {
    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ error: "Missing id" });

    const firm = FIRMS.find((f) => String(f.id) === id);
    if (!firm) return res.status(404).json({ error: "Firm not found" });

    return res.json(firm);
});

// =============================== NUEVO ENDPOINT ===============================
// ✔ Devuelve el contenido de la hoja “tags concentrados”
// app.get("/api/tags-concentrados", (req, res) => {
//     try {
//         res.json({
//             count: TAGS_CONCENTRADOS.length,
//             rows: TAGS_CONCENTRADOS,
//         });
//     } catch (error) {
//         console.error("❌ Error en /api/tags-concentrados", error);
//         res.status(500).json({ error: "Error interno" });
// }
// });

// ✔ Filtros dinámicos
app.get("/api/filters", (req, res) => {
    const countriesSet = new Set();
    const regionsSet = new Set();
    const mappingSet = new Set();

    FIRMS.forEach((f) => {
        const country = (f.country || "").trim();
        const region = (f.region || "").trim();

        if (country) countriesSet.add(country);
        if (region) regionsSet.add(region);

        if (country && region) {
            mappingSet.add(`${country}:::${region}`);
        }
    });

    const countries = Array.from(countriesSet).sort();
    const regions = Array.from(regionsSet).sort();

    const mapping = Array.from(mappingSet).map((str) => {
        const [country, region] = str.split(":::");
        return { country, region };
    });

    res.json({
        countries,
        regions,
        mapping,
    });
});

// ✔ Todas las firmas
app.get("/api/all-firms", (req, res) => {
    try {
        res.json(FIRMS);
    } catch (err) {
        console.error("Error en /api/all-firms:", err);
        res.status(500).json({ error: "Error interno al obtener firmas" });
    }
});

// ✔ Health
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", totalFirms: FIRMS.length });
});

// ✔ Búsqueda semántica
app.get("/api/search", (req, res) => {
    const q = req.query.q || "";
    const limit = req.query.limit ? Number(req.query.limit) : 30;

    if (!q.trim()) {
        return res.json({ query: q, results: [] });
    }

    if (!FUSE) {
        return res
            .status(500)
            .json({ error: "Índice de búsqueda no inicializado" });
    }

    const results = semanticSearch(FUSE, q, limit);
    res.json({
        query: q,
        count: results.length,
        results,
    });
});

// ✔ Tags rápidos
app.get("/api/tags", (req, res) => {
    const { country, region } = req.query;

    let firmsToUse = FIRMS;

    if (region && region.trim()) {
        firmsToUse = firmsToUse.filter(
            (f) => (f.region || "").trim() === region.trim()
        );
    }

    if (country && country.trim()) {
        firmsToUse = firmsToUse.filter(
            (f) => (f.country || "").trim() === country.trim()
        );
    }

    const quickTags = getQuickTags(firmsToUse, 40);

    res.json({
        count: quickTags.length,
        tags: quickTags,
    });
});

// ✔ Buscar por tag
app.get("/api/searchByTag", (req, res) => {
    const tag = req.query.tag || "";
    if (!tag.trim()) return res.json({ tag, results: [] });

    const results = searchByTag(FIRMS, tag);
    res.json({
        tag,
        count: results.length,
        results,
    });
});

app.get("/api/form-tags", async (req, res) => {
    try {
        const tags = await loadTagsSimple(); // devuelve { paises: [], areas: [] }
        res.json(tags);
    } catch (err) {
        console.error("❌ Error en /api/form-tags:", err);
        res.status(500).json({ error: "Error interno al leer Tags conceptos" });
    }
});


// ---------- START: helpers para emails ----------
function escapeHtml(text = "") {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Trunca un texto a N caracteres y agrega "..."
function truncateText(text = "", maxLength = 90) {
    const str = String(text || "").trim();
    if (!str) return "";
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + "...";
}


function buildHTMLEmail(payload = {}) {
    const safe = (v) =>
        (v === undefined || v === null || v === "")
            ? "<em>No proporcionado</em>"
            : escapeHtml(String(v));

    const renderArray = (a) =>
        Array.isArray(a) && a.length
            ? a.map(x => `<li>${escapeHtml(String(x))}</li>`).join("")
            : "<li><em>No aplica</em></li>";

    // --- Agrupar firmas por país ---
    const savedFirms = Array.isArray(payload.savedFirms) ? payload.savedFirms : [];
    const countryMap = new Map();

    savedFirms.forEach(f => {
        const country = (f.country || "Sin país").trim();
        if (!countryMap.has(country)) {
            countryMap.set(country, { country, firmNames: [], areas: [] });
        }
        const entry = countryMap.get(country);
        if (f.firm) entry.firmNames.push(f.firm);
        if (f.area) entry.areas.push(f.area);
    });

    const groupedRowsHTML = savedFirms.length
        ? Array.from(countryMap.values())
            .map(c => {
                const firmsText = c.firmNames.join(" · ");
                const areasJoined = c.areas.join(" | ");
                const areasTruncated = truncateText(areasJoined, 90); // 👈 truncamos aquí

                return `
            <tr>
              <td style="border:1px solid #ccc; padding:6px;">${escapeHtml(c.country)}</td>
              <td style="border:1px solid #ccc; padding:6px;">${escapeHtml(firmsText)}</td>
              <td style="border:1px solid #ccc; padding:6px;">
                ${escapeHtml(areasTruncated)}
              </td>
            </tr>
          `;
            })
            .join("")
        : "";

    return `
    <div style="font-family: Arial, Helvetica, sans-serif; color:#333;">
      <h2 style="color:#0b59a6; margin-bottom:6px;">Formulario de Firmas</h2>
      <p style="color:#555; margin-top:0;">Detalle recibido del usuario:</p>
      <table style="width:100%; border-collapse:collapse;">
        <tbody>
          <tr><td style="padding:8px; background:#f7f7f7; font-weight:600; width:200px;">Nombre</td><td style="padding:8px;">${safe(payload.name)}</td></tr>
          <tr><td style="padding:8px; background:#fafafa; font-weight:600;">Correo</td><td style="padding:8px;">${safe(payload.email)}</td></tr>
          <tr><td style="padding:8px; background:#f7f7f7; font-weight:600;">País</td><td style="padding:8px;">${safe(payload.country)}</td></tr>
          <tr><td style="padding:8px; background:#fafafa; font-weight:600;">Área</td><td style="padding:8px;">${safe(payload.area)}</td></tr>
          <tr><td style="padding:8px; background:#f7f7f7; font-weight:600;">Tipo de firma</td><td style="padding:8px;">${Array.isArray(payload.firmType) ? escapeHtml(payload.firmType.join(', ')) : safe(payload.firmType)}</td></tr>
          
          <!-- Nuevos campos -->
          <tr><td style="padding:8px; background:#fafafa; font-weight:600;">Años en el mercado</td><td style="padding:8px;">${safe(payload.marketYears)}</td></tr>
          <tr><td style="padding:8px; background:#f7f7f7; font-weight:600;">Años experiencia (abogado a cargo)</td><td style="padding:8px;">${safe(payload.leadExperience)}</td></tr>
          <!-- fin nuevos campos -->
          
          <tr><td style="padding:8px; background:#fafafa; font-weight:600;">Otras características</td><td style="padding:8px;"><ul style="margin:0; padding-left:18px;">${renderArray(payload.otherCharacteristics)}</ul></td></tr>
          <tr><td style="padding:8px; background:#f7f7f7; font-weight:600;">Urgencia</td><td style="padding:8px;">${safe(payload.urgency)}</td></tr>
          <tr><td style="padding:8px; background:#fafafa; font-weight:600;">Preferencia cobro</td><td style="padding:8px;">${safe(payload.billingPreference)}</td></tr>
          <tr><td style="padding:8px; background:#f7f7f7; font-weight:600;">Encargo</td><td style="padding:8px;">${safe(payload.assignment)}</td></tr>
          <tr><td style="padding:8px; background:#fafafa; font-weight:600;">Comentarios</td><td style="padding:8px;">${safe(payload.comments)}</td></tr>
          
          <!-- Tabla de firmas guardadas (agrupadas por país) -->
          <tr>
            <td style="padding:8px; background:#f7f7f7; font-weight:600; vertical-align:top;">
              Firmas recomendadas
            </td>
            <td style="padding:8px;">
              ${savedFirms.length
            ? `
                    <table style="border-collapse:collapse; width:100%;">
                      <thead>
                        <tr>
                          <th style="border:1px solid #ccc; padding:6px; background:#0f172a; color:#fff; text-align:left;">País</th>
                          <th style="border:1px solid #ccc; padding:6px; background:#0f172a; color:#fff; text-align:left;">Firma(s)</th>
                          <th style="border:1px solid #ccc; padding:6px; background:#0f172a; color:#fff; text-align:left;">Áreas</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${groupedRowsHTML}
                      </tbody>
                    </table>
                  `
            : "<em>No hay firmas recomendadas</em>"
        }
            </td>
          </tr>

        </tbody>
      </table>
      <p style="color:#777;font-size:12px;margin-top:10px;">Fecha (ISO): ${new Date().toISOString()}</p>
    </div>
  `;
}


// ---------- END: helpers para emails ----------


// ---------------- PDF generator ----------------
function generatePDF(payload) {
    return new Promise((resolve) => {
        const LOGO_PATH = path.join(process.cwd(), "logo.svg");
        const filePath = path.join(TEMP_DIR, `reporte_${Date.now()}.pdf`);

        const doc = new PDFDocument({
            size: "A4",
            margins: { top: 40, bottom: 40, left: 50, right: 50 }
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // ===========================================================
        // ENCABEZADO
        // ===========================================================
        const headerHeight = 90;

        doc.save();
        doc.rect(0, 0, doc.page.width, headerHeight).fill("#0f172a");
        doc.restore();

        try {
            doc.image(LOGO_PATH, 50, 22, { width: 50 });
        } catch (e) { }

        doc.fillColor("#ffffff")
            .font("Helvetica-Bold")
            .fontSize(22)
            .text("Reporte del Formulario", 120, 30);

        doc.moveDown(3);

        // ===========================================================
        // TÍTULO BLOQUE
        // ===========================================================
        const drawBlock = (title) => {
            doc.moveDown(1.2);
            doc.fillColor("#0f172a")
                .font("Helvetica-Bold")
                .fontSize(15)
                .text(title);

            doc.moveDown(0.4);

            doc.strokeColor("#d7d7d7")
                .lineWidth(1)
                .moveTo(50, doc.y)
                .lineTo(doc.page.width - 50, doc.y)
                .stroke();

            doc.moveDown(1);
        };

        // ===========================================================
        // TABLA — INFORMACIÓN DEL ENCARGO
        // ===========================================================
        drawBlock("Información del Encargo");

        const tableData = [
            ["Nombre", payload.name],
            ["Correo", payload.email],
            ["País", payload.country],
            ["Área", payload.area],
            ["Años en el mercado", payload.marketYears],
            ["Experiencia del abogado a cargo", payload.leadExperience],
            ["Tipo de firma", Array.isArray(payload.firmType) ? payload.firmType.join(", ") : payload.firmType],
            ["Otras características", Array.isArray(payload.otherCharacteristics) ? payload.otherCharacteristics.join(" · ") : payload.otherCharacteristics],
            ["Urgencia", payload.urgency],
            ["Preferencia de cobro", payload.billingPreference],
            ["Encargo", payload.assignment],
            ["Comentarios", payload.comments],
        ];

        const colLabelX = 50;
        const colLabelW = 170;

        const colValueX = colLabelX + colLabelW;
        const colValueW = doc.page.width - colValueX - 50;

        const rowHeight = 22;
        let yTable = doc.y;

        // Header
        doc.rect(colLabelX, yTable, colLabelW, rowHeight)
            .fill("#0f172a");
        doc.rect(colValueX, yTable, colValueW, rowHeight)
            .fill("#0f172a");

        doc.fillColor("#ffffff")
            .font("Helvetica-Bold")
            .fontSize(11)
            .text("DATOS", colLabelX + 6, yTable + 6);

        yTable += rowHeight;

        // Filas
        tableData.forEach((row, i) => {
            const bg = i % 2 === 0 ? "#f5f5f5" : "#ffffff";

            doc.rect(colLabelX, yTable, colLabelW, rowHeight).fill(bg);
            doc.fillColor("#0f172a")
                .font("Helvetica-Bold")
                .fontSize(10)
                .text(row[0], colLabelX + 6, yTable + 6);

            doc.rect(colValueX, yTable, colValueW, rowHeight).fill(bg);
            doc.fillColor("#333333")
                .font("Helvetica")
                .fontSize(10)
                .text(row[1] || "No proporcionado", colValueX + 6, yTable + 6, {
                    width: colValueW - 12
                });

            yTable += rowHeight;

            if (yTable > doc.page.height - 80) {
                doc.addPage();
                yTable = 70;
            }
        });

        doc.moveDown(2);

        // ===========================================================
        // BLOQUE — FIRMAS RECOMENDADAS (AGRUPADAS POR PAÍS)
        // ===========================================================
        drawBlock("Firmas Recomendadas");

        const savedFirms = Array.isArray(payload.savedFirms) ? payload.savedFirms : [];
        if (!savedFirms.length) {
            doc.font("Helvetica")
                .fontSize(12)
                .fillColor("#444")
                .text("No hay firmas recomendadas.");

            doc.end();
            return resolve(filePath);
        }

        // Agrupar por país
        const countryMap = new Map();
        savedFirms.forEach(f => {
            const country = (f.country || "Sin país").trim();
            if (!countryMap.has(country)) {
                countryMap.set(country, { country, firmNames: [], areas: [] });
            }
            const entry = countryMap.get(country);
            if (f.firm) entry.firmNames.push(f.firm);
            if (f.area) entry.areas.push(f.area);
        });

        const groupedCountries = Array.from(countryMap.values());

        const tableTop = doc.y;
        const colCountry = 50;
        const colCountryW = 80;
        const colFirm = colCountry + colCountryW + 10;
        const colFirmW = 180;
        const colAreas = colFirm + colFirmW + 10;
        const colAreasW = doc.page.width - colAreas - 50;

        const headerH = 22;

        // Encabezado tabla
        doc.rect(colCountry, tableTop, colCountryW, headerH).fill("#0f172a");
        doc.rect(colFirm, tableTop, colFirmW, headerH).fill("#0f172a");
        doc.rect(colAreas, tableTop, colAreasW, headerH).fill("#0f172a");

        doc.fillColor("#ffffff")
            .font("Helvetica-Bold")
            .fontSize(11);

        doc.text("País", colCountry + 6, tableTop + 5);
        doc.text("Firma(s)", colFirm + 6, tableTop + 5);
        doc.text("Áreas", colAreas + 6, tableTop + 5);

        let y = tableTop + headerH;

        groupedCountries.forEach((c, idx) => {
            const bg = idx % 2 === 0 ? "#f5f5f5" : "#ffffff";
            const firmsText = c.firmNames.join(" · ");
            const areasJoined = c.areas.join(" | ");
            const areasTruncated = truncateText(areasJoined, 90); // 👈 truncamos aquí

            const rowH = 40; // un poco más alto para permitir wrapping

            doc.rect(colCountry, y, colCountryW, rowH).fill(bg);
            doc.rect(colFirm, y, colFirmW, rowH).fill(bg);
            doc.rect(colAreas, y, colAreasW, rowH).fill(bg);

            doc.fillColor("#333")
                .font("Helvetica")
                .fontSize(10);

            doc.text(c.country, colCountry + 6, y + 6, { width: colCountryW - 12 });
            doc.text(firmsText, colFirm + 6, y + 6, { width: colFirmW - 12 });
            doc.text(areasTruncated, colAreas + 6, y + 6, { width: colAreasW - 12 });

            y += rowH;

            if (y > doc.page.height - 80) {
                doc.addPage();
                y = 70;
            }
        });

        doc.moveDown(2);

        doc.fontSize(10)
            .fillColor("#777")
            .text("Fecha de generación: " + new Date().toLocaleString());

        doc.end();

        stream.on("finish", () => resolve(filePath));
    });
}





// ---------------- end PDF generator ----------------


// 🔹 Endpoint para recibir el formulario y guardar en Google Sheets
app.post("/api/form-submit", async (req, res) => {
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
});


// ---------------- Endpoint para generar y devolver PDF (para ver/descargar desde frontend) ----------------
/**
 * POST /api/form-pdf
 * Body: payload (mismo formato que se envía en /api/form-submit)
 * Response: application/pdf (stream)
 */
app.post("/api/form-pdf", async (req, res) => {
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
});
// ---------------- end endpoint form-pdf ----------------


// =============================== SERVIDOR ===============================
const PORT = process.env.PORT || 4000;

init()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ Error al inicializar backend:", err);
        process.exit(1);
    });

