// src/googleSheets.mjs
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "credentials.json"), "utf8")
);

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // "https://www.googleapis.com/auth/drive.file" // solo si en el futuro quieres crear hojas, no hace falta ahora
});

const sheets = google.sheets({ version: "v4", auth });

// ID del spreadsheet
const SPREADSHEET_ID = "1Slpn0UUmcr3pih1xuNdbKRhd7NYFY3UFR5qFzxsWQvE";

/* ------------------------------- UTILIDADES ------------------------------- */
export function normalize(str) {
    return String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function parseTags(tagsRaw) {
    const raw = String(tagsRaw || "").trim();
    if (!raw) return [];

    // Intento 1: JSON array
    if (raw.startsWith("[") && raw.endsWith("]")) {
        try {
            const jsonSafe = raw.replace(/'/g, '"');
            const parsed = JSON.parse(jsonSafe);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((t) => String(t))
                    .map((t) => t.replace(/^"+|"+$/g, "").trim())
                    .filter(Boolean);
            }
        } catch (e) { }
    }

    // Intento 2: texto separado por coma / ;
    return raw
        .replace(/[\[\]]/g, "")
        .split(/[;,]/)
        .map((t) => t.replace(/^"+|"+$/g, "").trim())
        .filter(Boolean);
}

function mergeTags(...lists) {
    const seen = new Set();
    const result = [];

    lists
        .flat()
        .map((t) => String(t || "").trim())
        .filter(Boolean)
        .forEach((t) => {
            const key = normalize(t);
            if (seen.has(key)) return;
            seen.add(key);
            result.push(t);
        });

    return result;
}

/* ------------------------- LECTURA DE RESULTS3 ---------------------------- */
export async function loadFirmsFromSheet() {
    const range = "Results3!A2:K";
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
    });

    const rows = res.data.values || [];

    // 1) Cargamos tags desde "Tags Conceptos"
    const tagsConceptosMap = await loadTagsConceptos();

    // 2) Agrupamos Results3 por firma + país
    const groups = new Map();

    rows.forEach((row, index) => {
        const [
            countryRaw = "",
            areaRaw = "",
            firmRaw = "",
            descriptionRaw = "",
            testimonialsRaw = "",
            keyClientsRaw = "",
            workHighlightsRaw = "",
            rankedRaw = "",
            tagsRaw = "",
            regionRaw = "",
            idRaw = "",
        ] = row;

        const country = String(countryRaw || "").trim();
        const firm = String(firmRaw || "").trim();
        if (!firm) return;

        const key = `${normalize(country)}::${normalize(firm)}`;

        if (!groups.has(key)) {
            groups.set(key, {
                id: idRaw ? String(idRaw).trim() : String(index),
                firm,
                country,
                region: String(regionRaw || "").trim(),
                rankedValues: [],
                tagsFromResults3: [],
                areasSet: new Set(),
                descriptions: [],
                testimonials: [],
                keyClients: [],
                workHighlights: [],
            });
        }

        const g = groups.get(key);

        const rankedNum = Number(rankedRaw);
        if (Number.isFinite(rankedNum)) {
            g.rankedValues.push(rankedNum);
        }

        const rowTags = parseTags(tagsRaw);
        if (rowTags.length) {
            g.tagsFromResults3.push(...rowTags);
        }

        if (areaRaw) {
            g.areasSet.add(String(areaRaw).trim());
        }
        if (descriptionRaw) g.descriptions.push(String(descriptionRaw));
        if (testimonialsRaw) g.testimonials.push(String(testimonialsRaw));
        if (keyClientsRaw) g.keyClients.push(String(keyClientsRaw));
        if (workHighlightsRaw) g.workHighlights.push(String(workHighlightsRaw));
    });

    // 3) Construimos el arreglo final
    const firms = [];

    for (const [key, g] of groups.entries()) {
        const validRanks = g.rankedValues.filter(
            (n) => Number.isFinite(n) && n > 0
        );
        const bestRank = validRanks.length > 0 ? Math.min(...validRanks) : 0;

        const extraTags = tagsConceptosMap.get(key) || [];
        const allTags = mergeTags(g.tagsFromResults3, extraTags);

        const areas = Array.from(g.areasSet);
        const areaCombined = areas.join(" | ");

        const firmObj = {
            id: g.id,
            country: g.country,
            region: g.region,
            firm: g.firm,
            ranked: bestRank,
            tags: allTags,
            tagsText: allTags.join(" "),
            tagsNormalized: allTags.map(t => normalize(t)),
            area: areaCombined,
            areas,
            description: g.descriptions.join("\n\n").trim(),
            testimonials: g.testimonials.join("\n\n").trim(),
            keyClients: g.keyClients.join("\n\n").trim(),
            workHighlights: g.workHighlights.join("\n\n").trim(),
        };

        firmObj.tagsNormalized = (firmObj.tags || []).map((t) => normalize(t));

        firms.push(firmObj);
    }

    console.log("✅ loadFirmsFromSheet (agrupado por firma):", firms.length);

    return firms;
}

/* --------------------------------------------------------------------------
   LEE LA HOJA "Tags Conceptos"
-------------------------------------------------------------------------- */
async function loadTagsConceptos() {
    const range = "'Tags conceptos'!A2:D";
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
    });

    const rows = res.data.values || [];
    console.log("📌 loadTagsConceptos: filas encontradas:", rows.length);

    const map = new Map();

    rows.forEach((row) => {
        const [countryRaw = "", areaRaw = "", firmRaw = "", tagsRaw = ""] = row;

        const country = String(countryRaw || "").trim();
        const firm = String(firmRaw || "").trim();
        if (!firm) return;

        const key = `${normalize(country)}::${normalize(firm)}`;
        const tagsArr = parseTags(tagsRaw);

        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key).push(...tagsArr);
    });

    return map;
}

/* ============================================================================ */
export async function loadTagsSimple() {
    const range = "'Tags conceptos'!A2:B";
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
    });

    const rows = res.data.values || [];

    const paisesSet = new Set();
    const areasSet = new Set();

    rows.forEach(([paisRaw = "", areaRaw = ""]) => {
        const pais = String(paisRaw).trim();
        const area = String(areaRaw).trim();

        if (pais) paisesSet.add(pais);
        if (area) areasSet.add(area);
    });

    return {
        paises: Array.from(paisesSet).sort(),
        areas: Array.from(areasSet).sort(),
    };
}

/* ============================================================================ */
export async function appendFormResponse(formPayload) {
    const sheetName = "formulariorespuestas";

    const HEADERS = [
        "Nombre",
        "Correo electrónico",
        "País",
        "Área de práctica profesional",
        "Tipo de firma",
        "Años en el mercado",
        "Años de experiencia del abogado a cargo",
        "Otras características de la firma",
        "Texto libre",
        "Nivel de urgencia",
        "Preferencia de cobro",
        "Encargo",
        "FirmasCount",
        "NombreFirma",
        "AreaFirma",
        "FirmaPais",
        "tipoForm",
        "timestamp"
    ];

    const savedFirms = Array.isArray(formPayload.savedFirms) ? formPayload.savedFirms : [];
    const firmCount = savedFirms.length;
    const firmNames = savedFirms.map(f => f.firm || "").filter(Boolean).join(" · ");

    let firmAreas = savedFirms.map(f => f.area || "").filter(Boolean).join(" · ");
    const firmCountries = Array.from(
        new Set(
            savedFirms
                .map(f => (f.country || "").trim())
                .filter(Boolean)
        )
    ).join(" · ");

    // Truncar area
    const MAX_AREA_CHARS = 100;
    if (firmAreas.length > MAX_AREA_CHARS) {
        firmAreas = firmAreas.slice(0, MAX_AREA_CHARS).trim() + "...";
    }

    const flat = {
        "Nombre": formPayload.name || "",
        "Correo electrónico": formPayload.email || "",
        "País": formPayload.country || "",
        "Área de práctica profesional": formPayload.area || "",
        "Tipo de firma": Array.isArray(formPayload.firmType) ? formPayload.firmType.join(" · ") : (formPayload.firmType || ""),
        "Años en el mercado": formPayload.marketYears || "",
        "Años de experiencia del abogado a cargo": formPayload.leadExperience || "",
        "Otras características de la firma": Array.isArray(formPayload.otherCharacteristics) ? formPayload.otherCharacteristics.join(" · ") : (formPayload.otherCharacteristics || ""),
        "Texto libre": formPayload.comments || "",
        "Nivel de urgencia": formPayload.urgency || "",
        "Preferencia de cobro": formPayload.billingPreference || "",
        "Encargo": formPayload.assignment || "",
        "FirmasCount": firmCount,
        "NombreFirma": firmNames,
        "AreaFirma": firmAreas,
        "FirmaPais": firmCountries,
        "tipoForm": formPayload.tipoForm || "",
        "timestamp": new Date().toISOString()
    };

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!1:1`,
        valueInputOption: "RAW",
        requestBody: { values: [HEADERS] }
    });

    const row = HEADERS.map(header => {
        const v = flat[header];
        return typeof v === "number" ? v : (v ?? "").toString();
    });

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A2:Z`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [row] }
    });

    console.log("📝 appendFormResponse: fila agregada correctamente (FirmasCount:", firmCount, ")");
}
