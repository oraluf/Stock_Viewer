// Google Sheets integration via Google Apps Script webhook.
//
// HOW TO SET UP (one-time, ~5 minutes):
// ─────────────────────────────────────────────────────────────────────────────
// 1. Create a new Google Sheet and note its ID from the URL.
//
// 2. In the sheet, open Extensions → Apps Script and paste this code:
//
//    function doPost(e) {
//      try {
//        const data = JSON.parse(e.postData.contents);
//        const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//        const sectors = data.sectors
//          .map(s => s.label + ': ' + (s.avgDailyChangePercent >= 0 ? '+' : '') + s.avgDailyChangePercent + '%')
//          .join(' | ');
//        sheet.appendRow([data.date, data.economicSavings, sectors, data.asOf]);
//        return ContentService
//          .createTextOutput(JSON.stringify({ status: 'ok' }))
//          .setMimeType(ContentService.MimeType.JSON);
//      } catch (err) {
//        return ContentService
//          .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
//          .setMimeType(ContentService.MimeType.JSON);
//      }
//    }
//
// 3. Deploy → New deployment → Web app
//    - Execute as: Me
//    - Who has access: Anyone
//    - Copy the deployment URL.
//
// 4. Set the env variable in backend/.env (and in Render dashboard):
//    GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_ID/exec
// ─────────────────────────────────────────────────────────────────────────────

async function appendReport(report) {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return; // silently skip if not configured

  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(report),
    });
    if (!res.ok) {
      console.warn(`Sheets webhook returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn('Sheets webhook failed (non-fatal):', err.message);
  }
}

module.exports = { appendReport };
