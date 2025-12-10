import PDFDocument from "pdfkit";
import fs from "fs";
import { TEMP_DIR, LOGO_PATH } from "../lib/utils/constants.mjs";

export function generatePDF(payload) {
    return new Promise(resolve => {
        const filePath = `${TEMP_DIR}/reporte_${Date.now()}.pdf`;

        const doc = new PDFDocument({
            size: "A4",
            margins: { top: 40, bottom: 40, left: 50, right: 50 }
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Encabezado
        doc.rect(0, 0, doc.page.width, 90).fill("#0f172a");
        try { doc.image(LOGO_PATH, 50, 22, { width: 50 }); } catch { }

        doc.fillColor("#fff").font("Helvetica-Bold").fontSize(22);
        doc.text("Reporte del Formulario", 120, 30);

        // Datos principales
        const rows = [
            ["Nombre", payload.name],
            ["Correo", payload.email],
            ["País", payload.country],
            ["Área", payload.area],
            ["Años mercado", payload.marketYears],
            ["Experiencia abogado", payload.leadExperience],
            ["Tipo de firma", Array.isArray(payload.firmType) ? payload.firmType.join(", ") : payload.firmType],
            ["Urgencia", payload.urgency],
            ["Comentarios", payload.comments]
        ];

        doc.moveDown(3).fillColor("#000").fontSize(12);

        rows.forEach(([label, value]) => {
            doc.font("Helvetica-Bold").text(label + ": ");
            doc.font("Helvetica").text(value || "—");
            doc.moveDown(0.5);
        });

        doc.end();
        stream.on("finish", () => resolve(filePath));
    });
}
