/******************************************************
 * GUÍA DE INICIO TEAM ELITE · REGISTRO DE AVANCES
 * Este código recibe datos desde avance.html, los guarda
 * en Google Sheets y actualiza una pestaña Resumen.
 ******************************************************/

const REGISTROS_SHEET = "Registros";
const RESUMEN_SHEET = "Resumen";

const STEPS = [
  "Skool — Ya ingresé a la plataforma",
  "Videos iniciales — Ya vi los videos",
  "Paso 1 — Metas",
  "Paso 2 — Ventas",
  "Paso 3 — Equipo",
  "Paso 4 — Patrocinio",
  "Llamadas — Ya agendé / participé",
  "Comunidad — Ya revisé el acceso",
  "Cierre — Completé mi guía de inicio"
];

function doGet() {
  return ContentService
    .createTextOutput("Guía Team Elite: conexión activa")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  setupSheets_();

  const payload = parsePayload_(e);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(REGISTROS_SHEET);

  sheet.appendRow([
    new Date(),
    payload.nombre || "",
    payload.whatsapp || "",
    payload.pais || "",
    payload.mentora || "",
    payload.paso || "",
    payload.comentario || ""
  ]);

  updateResumen_();

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupSheets() {
  setupSheets_();
  updateResumen_();
}

function setupSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let registros = ss.getSheetByName(REGISTROS_SHEET);
  if (!registros) {
    registros = ss.insertSheet(REGISTROS_SHEET);
  }

  if (registros.getLastRow() === 0) {
    registros.appendRow([
      "Fecha",
      "Nombre",
      "WhatsApp",
      "País",
      "Mentora",
      "Paso completado",
      "Comentario"
    ]);
  }

  styleHeader_(registros, 1, 7);

  let resumen = ss.getSheetByName(RESUMEN_SHEET);
  if (!resumen) {
    resumen = ss.insertSheet(RESUMEN_SHEET);
  }
}

function updateResumen_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const registros = ss.getSheetByName(REGISTROS_SHEET);
  const resumen = ss.getSheetByName(RESUMEN_SHEET);

  const values = registros.getDataRange().getValues();
  const rows = values.slice(1).filter(row => row[1] || row[2]);

  const people = new Map();

  rows.forEach(row => {
    const fecha = row[0];
    const nombre = String(row[1] || "").trim();
    const whatsapp = String(row[2] || "").trim();
    const pais = String(row[3] || "").trim();
    const mentora = String(row[4] || "").trim();
    const paso = String(row[5] || "").trim();
    const comentario = String(row[6] || "").trim();

    const key = normalizeKey_(whatsapp || `${nombre}-${mentora}`);
    if (!people.has(key)) {
      people.set(key, {
        nombre,
        whatsapp,
        pais,
        mentora,
        steps: new Set(),
        lastDate: fecha,
        lastStep: paso,
        lastComment: comentario
      });
    }

    const person = people.get(key);
    person.nombre = person.nombre || nombre;
    person.whatsapp = person.whatsapp || whatsapp;
    person.pais = person.pais || pais;
    person.mentora = person.mentora || mentora;

    if (STEPS.includes(paso)) {
      person.steps.add(paso);
    }

    if (!person.lastDate || new Date(fecha) >= new Date(person.lastDate)) {
      person.lastDate = fecha;
      person.lastStep = paso;
      person.lastComment = comentario;
    }
  });

  const headers = [
    "Socia",
    "WhatsApp",
    "País",
    "Mentora",
    ...STEPS.map(step => shortStepName_(step)),
    "Avance",
    "%",
    "Último paso",
    "Última fecha",
    "Estado",
    "Último comentario"
  ];

  const output = Array.from(people.values())
    .sort((a, b) => String(a.mentora).localeCompare(String(b.mentora)) || String(a.nombre).localeCompare(String(b.nombre)))
    .map(person => {
      const completed = STEPS.filter(step => person.steps.has(step)).length;
      const percent = completed / STEPS.length;
      return [
        person.nombre,
        person.whatsapp,
        person.pais,
        person.mentora,
        ...STEPS.map(step => person.steps.has(step) ? "✅" : ""),
        `${completed}/${STEPS.length}`,
        percent,
        person.lastStep,
        person.lastDate,
        statusFromProgress_(completed),
        person.lastComment || ""
      ];
    });

  resumen.clearContents();
  resumen.clearFormats();
  resumen.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (output.length) {
    resumen.getRange(2, 1, output.length, headers.length).setValues(output);
    resumen.getRange(2, 4 + STEPS.length + 2, output.length, 1).setNumberFormat("0%");
    resumen.getRange(2, 4 + STEPS.length + 4, output.length, 1).setNumberFormat("dd/mm/yyyy hh:mm");
  }

  styleResumen_(resumen, headers.length, output.length);
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    return {};
  }
}

function normalizeKey_(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9+]/g, "");
}

function shortStepName_(step) {
  return step
    .replace("Skool — Ya ingresé a la plataforma", "Skool")
    .replace("Videos iniciales — Ya vi los videos", "Videos")
    .replace("Paso 1 — Metas", "Metas")
    .replace("Paso 2 — Ventas", "Ventas")
    .replace("Paso 3 — Equipo", "Equipo")
    .replace("Paso 4 — Patrocinio", "Patrocinio")
    .replace("Llamadas — Ya agendé / participé", "Llamadas")
    .replace("Comunidad — Ya revisé el acceso", "Comunidad")
    .replace("Cierre — Completé mi guía de inicio", "Cierre");
}

function statusFromProgress_(completed) {
  if (completed >= STEPS.length) return "⭐ Completó guía";
  if (completed >= 6) return "🔥 Muy avanzada";
  if (completed >= 3) return "🌱 En avance";
  if (completed >= 1) return "✨ Iniciada";
  return "Registrada";
}

function styleHeader_(sheet, row, columns) {
  sheet.getRange(row, 1, 1, columns)
    .setFontWeight("bold")
    .setBackground("#f7efe4")
    .setFontColor("#5a3b1f");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, columns);
}

function styleResumen_(sheet, columns, outputLength) {
  styleHeader_(sheet, 1, columns);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(4);
  sheet.getRange(1, 1, Math.max(outputLength + 1, 1), columns)
    .setVerticalAlignment("middle")
    .setWrap(true);
  sheet.autoResizeColumns(1, columns);

  if (outputLength) {
    const percentColumn = 4 + STEPS.length + 2;
    const statusColumn = 4 + STEPS.length + 5;
    const percentRange = sheet.getRange(2, percentColumn, outputLength, 1);
    percentRange.setNumberFormat("0%");

    const rules = [
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberGreaterThanOrEqualTo(1)
        .setBackground("#dff5e4")
        .setRanges([percentRange])
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberBetween(0.5, 0.99)
        .setBackground("#fff1d6")
        .setRanges([percentRange])
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberLessThan(0.5)
        .setBackground("#f8e7dc")
        .setRanges([percentRange])
        .build()
    ];
    sheet.setConditionalFormatRules(rules);
    sheet.getRange(2, statusColumn, outputLength, 1).setFontWeight("bold");
  }
}
