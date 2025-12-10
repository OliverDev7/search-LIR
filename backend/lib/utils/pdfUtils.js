import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// Asegurar carpeta temp para PDFs
const TEMP_DIR = path.join(process.cwd(), "temp");
try {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
} catch (err) {
    console.warn("No se pudo crear carpeta temp:", err);
}

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
        // TABLA REAL — INFORMACIÓN DEL ENCARGO
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

        // Header (solo estilo visual, misma tabla)
        doc.rect(colLabelX, yTable, colLabelW, rowHeight)
            .fill("#0f172a");
        doc.rect(colValueX, yTable, colValueW, rowHeight)
            .fill("#0f172a");

        doc.fillColor("#ffffff")
            .font("Helvetica-Bold")
            .fontSize(11)
            .text("DATOS", colLabelX + 6, yTable + 6)
            .text("", colValueX + 6, yTable + 6);

        yTable += rowHeight;

        // Rows
        tableData.forEach((row, i) => {
            const bg = i % 2 === 0 ? "#f5f5f5" : "#ffffff";

            // Label cell
            doc.rect(colLabelX, yTable, colLabelW, rowHeight).fill(bg);
            doc.fillColor("#0f172a")
                .font("Helvetica-Bold")
                .fontSize(10)
                .text(row[0], colLabelX + 6, yTable + 6);

            // Value cell
            doc.rect(colValueX, yTable, colValueW, rowHeight).fill(bg);
            doc.fillColor("#333333")
                .font("Helvetica")
                .fontSize(10)
                .text(row[1] || "No proporcionado", colValueX + 6, yTable + 6, {
                    width: colValueW - 12
                });

            yTable += rowHeight;

            // Salto de página si es necesario
            if (yTable > doc.page.height - 80) {
                doc.addPage();
                yTable = 70;
            }
        });

        doc.moveDown(2);

        // ===========================================================
        // BLOQUE — FIRMAS RECOMENDADAS (NO SE EDITA)
        // ===========================================================
        drawBlock("Firmas Recomendadas");

        if (!Array.isArray(payload.savedFirms) || !payload.savedFirms.length) {
            doc.font("Helvetica")
                .fontSize(12)
                .fillColor("#444")
                .text("No hay firmas recomendadas.");

            doc.end();
            return resolve(filePath);
        }

        // Tabla original (sin cambios)
        const tableTop = doc.y;
        const col1 = 50;
        const col1w = 150;
        const col2 = col1 + col1w + 10;
        const col2w = 100;
        const col3 = col2 + col2w + 10;
        const col3w = doc.page.width - col3 - 50;

        const rowHeight2 = 22;


        doc.rect(col1, tableTop, col1w, rowHeight2).fill("#0f172a");
        doc.rect(col2, tableTop, col2w, rowHeight2).fill("#0f172a");
        doc.rect(col3, tableTop, col3w, rowHeight2).fill("#0f172a");

        doc.fillColor("#ffffff")
            .font("Helvetica-Bold")
            .fontSize(12);

        doc.text("Firma", col1 + 6, tableTop + 6);
        doc.text("País", col2 + 6, tableTop + 6);
        doc.text("Áreas", col3 + 6, tableTop + 6);

        let y2 = tableTop + rowHeight2;

        payload.savedFirms.forEach((f, idx) => {
            const bgColor = idx % 2 === 0 ? "#f5f5f5" : "#ffffff";

            doc.rect(col1, y2, col1w, rowHeight2).fill(bgColor);
            doc.rect(col2, y2, col2w, rowHeight2).fill(bgColor);
            doc.rect(col3, y2, col3w, rowHeight2).fill(bgColor);

            const area = f.area.length > 40 ? f.area.slice(0, 40) + "..." : f.area;

            doc.fillColor("#333")
                .font("Helvetica")
                .fontSize(10);

            doc.text(f.firm, col1 + 6, y2 + 5, { width: col1w - 12 });
            doc.text(f.country, col2 + 6, y2 + 5, { width: col2w - 12 });
            doc.text(area, col3 + 6, y2 + 5, { width: col3w - 12 });

            y2 += rowHeight2;

            if (y2 > doc.page.height - 80) {
                doc.addPage();
                y2 = 70;
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

export { generatePDF, TEMP_DIR };