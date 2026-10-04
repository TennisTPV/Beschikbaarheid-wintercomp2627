// ======================================================
//  INSTELLINGEN — alleen dit bestand hoef je aan te passen
// ======================================================
const CONFIG = {
  // Plak hier de web-app-URL uit Apps Script (eindigt op /exec)
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzL-pgBKQk1-5cKi0XdX7Mo2YCeUWgARLNwjrcejcLUnXAsX-E8co8nvHTpf5yyUnKJZQ/exec",

  // Tot wanneer spelers mogen invullen en aanpassen (Nederlandse tijd)
  DEADLINE: "2026-11-01T23:59:00+01:00",

  // Minimaal aantal spelers per speeldag (voor de kleur in het overzicht)
  NEEDED: 4,

  // Speeldagen: KNLTB wintercompetitie tennis 2026-2027, vrijdag
  DATES: [
    { iso: "2026-11-13", week: 46 },
    { iso: "2026-11-27", week: 48 },
    { iso: "2026-12-11", week: 50 },
    { iso: "2027-01-15", week: 2 },
    { iso: "2027-01-22", week: 3 },
    { iso: "2027-01-29", week: 4 },
    { iso: "2027-02-12", week: 6 },
  ],

  CAPTAIN: "Ralph van Ballegooijen · +31653879559",
};

// ---- hulpfuncties voor beide pagina's ----
const $ = id => document.getElementById(id);
const fmtLong = iso => new Date(iso + "T12:00:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtShort = iso => new Date(iso + "T12:00:00").toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
const fmtDeadline = () => new Date(CONFIG.DEADLINE).toLocaleString("nl-NL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const isClosed = () => new Date() > new Date(CONFIG.DEADLINE);
function wishText(r) {
  if (r.wish === "inval") return "Alleen invallen";
  if (r.wish === "max") return "Zoveel mogelijk";
  if (r.wish === "anders") return `${r.wishN}×`;
  if (r.wish) return `${r.wish}×`;
  return "–";
}
async function api(payload) {
  // text/plain voorkomt een CORS-preflight bij Google Apps Script
  const res = await fetch(CONFIG.SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Onbekende fout");
  return data;
}
