import { loadFirmsFromSheet, appendFormResponse, loadTagsSimple } from "../src/googleSheets.mjs";
import { buildFuseIndex } from "../src/searchEngine.js";

let FIRMS = [];
let FUSE = null;

export async function initData() {
    console.log("📄 Cargando datos desde Google Sheets...");

    FIRMS = await loadFirmsFromSheet();
    console.log(`   → ${FIRMS.length} filas cargadas.`);

    FUSE = buildFuseIndex(FIRMS);
    console.log("🔍 Índice Fuse.js construido.");

    return true;
}

export function getData() {
    return { FIRMS, FUSE };
}

export { appendFormResponse, loadTagsSimple };
