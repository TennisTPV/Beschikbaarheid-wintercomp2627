/**
 * Wintercompetitie beschikbaarheid (zaterdag gemengd dubbel) — Google Apps Script
 * Plak dit in Extensies > Apps Script van je Google Sheet.
 * Stel de beheercode in via Projectinstellingen > Scripteigenschappen: ADMIN_KEY
 */

// Moet gelijk zijn aan config.js
const DEADLINE = new Date("2026-11-01T23:59:00+01:00");
const DATES = ["2026-11-14", "2026-11-28", "2026-12-12", "2027-01-16", "2027-01-23", "2027-01-30", "2027-02-13"];
const SHEET_NAME = "Antwoorden";
const CAPTAIN = "Ralph van Ballegooijen";

const BASE_COLS = ["token", "naam", "email", "wens", "aantal", "opmerking", "bijgewerkt", "heer/dame"];
const HEADERS = BASE_COLS.concat(DATES);

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: false, error: "Ongeldig verzoek" }); }
  try {
    switch (body.action) {
      case "get": return out(getRecord(body));
      case "save": return out(save(body));
      case "resend": return out(resend(body));
      case "admin": return out(admin(body));
      default: return out({ ok: false, error: "Onbekende actie" });
    }
  } catch (x) {
    return out({ ok: false, error: String(x.message || x) });
  }
}

function doGet() {
  return ContentService.createTextOutput("Wintercompetitie-script zaterdag draait.");
}

/* ---------- acties ---------- */

function getRecord(b) {
  const rows = readAll();
  const r = rows.find(x => x.token && x.token === String(b.token || ""));
  if (!r) return { ok: false, error: "not_found" };
  return { ok: true, record: r, closed: new Date() > DEADLINE };
}

function save(b) {
  if (new Date() > DEADLINE) return { ok: false, error: "De deadline is verstreken." };
  const name = clean(b.name, 40), email = clean(b.email, 80);
  if (!name) return { ok: false, error: "Naam ontbreekt." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Ongeldig e-mailadres." };
  const wish = ["inval", "1", "2", "3", "anders", "max"].indexOf(b.wish) >= 0 ? b.wish : "";
  if (!wish) return { ok: false, error: "Kies hoe vaak je wilt spelen." };
  const gender = b.gender === "H" || b.gender === "D" ? b.gender : "";
  if (!gender) return { ok: false, error: "Kies heer of dame." };
  const avail = {};
  DATES.forEach(d => { avail[d] = b.avail && b.avail[d] === true; });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet();
    const rows = readAll();
    let token = String(b.token || "");
    let idx = token ? rows.findIndex(x => x.token === token) : -1;

    if (idx < 0) {
      // nieuw antwoord: zelfde naam bestaat al? dan niet stilletjes overschrijven
      if (rows.some(x => norm(x.name) === norm(name))) return { ok: false, error: "name_taken" };
      token = Utilities.getUuid().replace(/-/g, "").slice(0, 20);
    }

    const row = [token, name, email, wish, wish === "anders" ? Number(b.wishN) || "" : "", clean(b.note, 300), new Date(), gender]
      .concat(DATES.map(d => (avail[d] ? "ja" : "nee")));

    if (idx < 0) sh.appendRow(row);
    else sh.getRange(idx + 2, 1, 1, row.length).setValues([row]);

    const mailed = sendLink(email, name, token, b.pageUrl, idx < 0, avail, wish, b.wishN);
    return { ok: true, token: token, mailed: mailed };
  } finally {
    lock.releaseLock();
  }
}

function resend(b) {
  const r = readAll().find(x => norm(x.name) === norm(b.name));
  if (r && r.email) sendLink(r.email, r.name, r.token, b.pageUrl, false, r.avail, r.wish, r.wishN, true);
  return { ok: true }; // geeft bewust niet prijs of de naam bestaat
}

function admin(b) {
  const key = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!key || String(b.key || "") !== key) return { ok: false, error: "forbidden" };
  return { ok: true, records: readAll() };
}

/* ---------- mail ---------- */

function sendLink(email, name, token, pageUrl, isNew, avail, wish, wishN, isResend) {
  if (!email || !pageUrl || !/^https:\/\//.test(pageUrl)) return false;
  const link = pageUrl + "?t=" + token;
  const deadline = Utilities.formatDate(DEADLINE, "Europe/Amsterdam", "d MMMM yyyy 'om' HH:mm");
  const lines = DATES.map(d => {
    const label = Utilities.formatDate(new Date(d + "T12:00:00Z"), "Europe/Amsterdam", "EEE d MMM");
    return label + ": " + (avail[d] ? "ja" : "nee");
  });
  const wishLabel = { inval: "Alleen invallen", max: "Zoveel mogelijk", anders: (wishN || "?") + "×" }[wish] || (wish + "×");
  const subject = isResend ? "Je persoonlijke link – Wintercompetitie zaterdag"
    : isNew ? "Bedankt voor het invullen – Wintercompetitie zaterdag"
    : "Je beschikbaarheid is bijgewerkt – Wintercompetitie zaterdag";
  const text =
    "Hoi " + name.split(" ")[0] + ",\n\n" +
    (isResend ? "Hier is je persoonlijke link opnieuw." : "Je beschikbaarheid voor de KNLTB Wintercompetitie (zaterdag gemengd dubbel) is opgeslagen.") + "\n\n" +
    lines.join("\n") + "\nWil spelen: " + wishLabel + "\n\n" +
    "Aanpassen kan tot " + deadline + " via je persoonlijke link:\n" + link + "\n\n" +
    "Deel deze link niet, want iedereen met de link kan je antwoord wijzigen.\n\n" +
    "Groet,\n" + CAPTAIN;
  try {
    MailApp.sendEmail({ to: email, subject: subject, body: text, name: CAPTAIN });
    return true;
  } catch (x) {
    return false;
  }
}

/* ---------- sheet ---------- */

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sh;
}

function readAll() {
  const sh = sheet();
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const vals = sh.getRange(2, 1, n, HEADERS.length).getValues();
  return vals.filter(v => v[0]).map(v => {
    const avail = {};
    DATES.forEach((d, i) => { avail[d] = String(v[BASE_COLS.length + i]).toLowerCase() === "ja"; });
    return {
      token: String(v[0]), name: String(v[1]), email: String(v[2]),
      wish: String(v[3]), wishN: v[4] === "" ? null : Number(v[4]),
      note: String(v[5]), updatedAt: v[6] instanceof Date ? v[6].toISOString() : String(v[6]),
      gender: String(v[7]).toUpperCase().charAt(0) === "D" ? "D" : String(v[7]).toUpperCase().charAt(0) === "H" ? "H" : "",
      avail: avail,
    };
  });
}

/* ---------- hulpjes ---------- */

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function clean(s, max) {
  const v = String(s || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v; // voorkomt formules in de sheet
}
function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, ""); }

/** Voer deze één keer handmatig uit (▶) om toestemming te geven voor Sheets en Mail. */
function setup() {
  sheet();
  MailApp.getRemainingDailyQuota();
}
