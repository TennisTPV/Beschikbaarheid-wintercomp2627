# Zaterdag gemengd dubbel: installatie

Dit werkt precies zoals de vrijdagversie, maar met een **eigen Google Sheet en eigen script**, zodat de antwoorden gescheiden blijven.

## 1. Nieuwe Google Sheet + script

1. Maak een **nieuwe** Google Sheet, bijvoorbeeld "Wintercompetitie zaterdag gemengd".
2. **Extensies > Apps Script**: plak de inhoud van `apps-script/Code.gs` (dus deze zaterdagversie) en sla op.
3. **Projectinstellingen > Scripteigenschappen**: voeg `ADMIN_KEY` toe met een beheercode (mag dezelfde zijn als bij vrijdag).
4. Voer de functie `setup` één keer uit (▶) en geef toestemming.
5. **Implementeren > Nieuwe implementatie > Web-app**:
   - Uitvoeren als: **Ik**
   - Wie heeft toegang: **Iedereen** (niet "Iedereen met een Google-account")
6. Kopieer de Web-app-URL (eindigt op `/exec`).

## 2. Instellingen

Plak de URL in `config.js` bij `SCRIPT_URL`.

## 3. Uploaden naar GitHub

1. Open je repository **Beschikbaarheid-wintercomp2627**.
2. Klik op **Add file > Upload files** en sleep de hele map **`zaterdag`** erin (met `index.html`, `beheer.html`, `style.css` en `config.js`; de map `apps-script` hoeft niet).
3. Klik op **Commit changes**.

Na een minuut staat de pagina op:

- Spelers: `https://tennistpv.github.io/Beschikbaarheid-wintercomp2627/zaterdag/`
- Beheer: `https://tennistpv.github.io/Beschikbaarheid-wintercomp2627/zaterdag/beheer.html`

## Verschillen met vrijdag

- Spelers kiezen **Heer** of **Dame**.
- Het overzicht telt per zaterdag heren en dames apart (bijv. `2 H · 3 D`). Groen = minstens 2 heren én 2 dames.
- In de sheet staat een extra kolom `heer/dame` (vul `H` of `D` in als je zelf iets aanpast).
