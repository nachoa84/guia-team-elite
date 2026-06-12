/*******************************************************
 * GUÍA DE INICIO TEAM ELITE · REGISTRO FINAL PRIVADO
 *
 * Esta versión NO registra cada paso.
 * La socia ve su avance en avance.html y solo cuando completa
 * el 100% se guarda una fila en la Google Sheet privada.
 ******************************************************/

const FINALIZADOS_SHEET = "Finalizados";

function doGet() {
  return ContentService
    .createTextOutput("Guía Team Elite: conexión activa")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    setupSheets_();
    const payload = parsePayload_(e);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FINALIZADOS_SHEET);

    const row = buildRow_(payload);
    const existingRow = findExistingRow_(sheet, payload.whatsapp, payload.mentora);

    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    styleSheet_(sheet);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function setupSheets() {
  setupSheets_();
}

function setupSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(FINALIZADOS_SHEET);
  if (!sheet) sheet = ss.insertSheet(FINALIZADOS_SHEET);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(getHeaders_());
  }

  styleSheet_(sheet);
}

function getHeaders_() {
  return [
    "Fecha",
    "Nombre",
    "WhatsApp",
    "País",
    "Patrocinadora",
    "Estado",
    "Porcentaje",
    "Pasos completados",
    "Total pasos",
    "Detalle pasos",
    "Comentario",
    "Origen"
  ];
}

function buildRow_(payload) {
  const fecha = payload.fecha ? new Date(payload.fecha) : new Date();
  const pasos = Array.isArray(payload.pasos) ? payload.pasos.join(" | ") : String(payload.pasos || "");

  return [
    fecha,
    payload.nombre || "",
    payload.whatsapp || "",
    payload.pais || "",
    payload.mentora || "",
    payload.estado || "Guía completada",
    Number(payload.porcentaje || 100) / 100,
    Number(payload.pasosCompletados || 0),
    Number(payload.totalPasos || 0),
    pasos,
    payload.comentario || "",
    payload.origen || ""
  ];
}

function findExistingRow_(sheet, whatsapp, mentora) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const values = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
  const targetWhatsapp = normalize_(whatsapp);
  const targetMentora = normalize_(mentora);

  for (let i = 0; i < values.length; i++) {
    const rowWhatsapp = normalize_(values[i][2]);
    const rowMentora = normalize_(values[i][4]);
    if (rowWhatsapp && rowWhatsapp === targetWhatsapp && rowMentora === targetMentora) {
      return i + 2;
    }
  }

  return null;
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    return e.parameter || {};
  }
}

function normalize_(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9+]/g, "");
}

function styleSheet_(sheet) {
  const lastColumn = getHeaders_().length;
  const lastRow = Math.max(sheet.getLastRow(), 1);

  sheet.getRange(1, 1, 1, lastColumn)
    .setFontWeight("bold")
    .setBackground("#2c241d")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, lastRow, lastColumn).setVerticalAlignment("middle");
  sheet.getRange(2, 1, Math.max(lastRow - 1, 1), 1).setNumberFormat("dd/mm/yyyy hh:mm");
  sheet.getRange(2, 7, Math.max(lastRow - 1, 1), 1).setNumberFormat("0%");
  sheet.autoResizeColumns(1, lastColumn);
}
