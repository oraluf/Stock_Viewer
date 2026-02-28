// Google integration via Google Apps Script webhooks.
//
// Supports two env vars (both optional; each is a no-op if not set):
//   GOOGLE_SHEETS_WEBHOOK_URL  → appends a summary row to a Google Sheet
//   GOOGLE_DOCS_WEBHOOK_URL    → appends a full narrative entry to a Google Doc
//
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO SET UP — ONE Apps Script for BOTH Sheets and Docs (recommended)
// ─────────────────────────────────────────────────────────────────────────────
// 1. Create a Google Sheet AND a Google Doc.
//    Note the ID from each URL:
//      Sheet: docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
//      Doc:   docs.google.com/document/d/DOCUMENT_ID/edit
//
// 2. Open the Sheet → Extensions → Apps Script.
//    Paste the following code (replaces any existing content):
//
// ─── PASTE THIS INTO APPS SCRIPT ─────────────────────────────────────────────
//
//  const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
//  const DOCUMENT_ID    = 'YOUR_DOCUMENT_ID';
//
//  function doPost(e) {
//    try {
//      const data    = JSON.parse(e.postData.contents);
//      const date    = data.date || '';
//      const savings = data.economicSavings;
//      const asOf    = data.asOf ? new Date(data.asOf).toLocaleString() : '';
//
//      // ── 1. Append summary row to Google Sheets ──────────────────────────
//      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
//      const sectorSummary = (data.sectors || [])
//        .map(s => s.label + ': ' + (s.avgDailyChangePercent >= 0 ? '+' : '') + s.avgDailyChangePercent + '%')
//        .join(' | ');
//      sheet.appendRow([date, savings != null ? savings : 'N/A', sectorSummary, asOf]);
//
//      // ── 2. Append narrative entry to Google Doc (Trading Journal) ───────
//      const doc  = DocumentApp.openById(DOCUMENT_ID);
//      const body = doc.getBody();
//
//      body.appendParagraph('═══ ' + date + ' — Daily Market Report ═══')
//          .setHeading(DocumentApp.ParagraphHeading.HEADING2);
//
//      if (savings != null) {
//        body.appendParagraph('AI−Energy Spread: ' + (savings >= 0 ? '+' : '') + savings + '%')
//            .setItalic(true);
//      }
//
//      (data.sectors || []).forEach(function(sector) {
//        var pct = (sector.avgDailyChangePercent >= 0 ? '+' : '') + sector.avgDailyChangePercent + '%';
//        body.appendParagraph(sector.label + ' (' + pct + ')')
//            .setHeading(DocumentApp.ParagraphHeading.HEADING3);
//
//        if (sector.analysis) {
//          body.appendParagraph(sector.analysis);
//        }
//
//        if (sector.stocks && sector.stocks.length > 0) {
//          var pills = sector.stocks
//            .filter(function(s) { return s.changePercent != null; })
//            .map(function(s) {
//              return s.ticker + ' ' + (s.changePercent >= 0 ? '+' : '') + s.changePercent + '%';
//            })
//            .join('  ·  ');
//          body.appendParagraph(pills)
//              .setFontSize(9)
//              .setForegroundColor('#888888');
//        }
//      });
//
//      body.appendParagraph('Generated: ' + asOf)
//          .setForegroundColor('#aaaaaa')
//          .setFontSize(9);
//
//      body.appendHorizontalRule();
//
//      return ContentService
//        .createTextOutput(JSON.stringify({ status: 'ok', date: date }))
//        .setMimeType(ContentService.MimeType.JSON);
//
//    } catch (err) {
//      return ContentService
//        .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
//        .setMimeType(ContentService.MimeType.JSON);
//    }
//  }
//
// ─── END OF APPS SCRIPT ──────────────────────────────────────────────────────
//
// 3. Click Deploy → New deployment → Web app
//    - Execute as: Me
//    - Who has access: Anyone
//    - Copy the deployment URL.
//
// 4. Add both vars pointing to the SAME URL in backend/.env (and Render):
//    GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_ID/exec
//    GOOGLE_DOCS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_ID/exec
//
//    (They can be the same URL — one Apps Script handles both targets.)
// ─────────────────────────────────────────────────────────────────────────────

async function post(url, body) {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) console.warn(`Webhook returned HTTP ${res.status}`);
}

/**
 * Sends a report to whichever Google webhooks are configured.
 * Both calls are fire-and-forget; failures are logged but never thrown.
 */
async function appendReport(report) {
  const sheetsUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const docsUrl   = process.env.GOOGLE_DOCS_WEBHOOK_URL;

  if (!sheetsUrl && !docsUrl) return;

  const targets = [...new Set([sheetsUrl, docsUrl].filter(Boolean))];

  await Promise.allSettled(
    targets.map((url) =>
      post(url, report).catch((err) =>
        console.warn('Webhook failed (non-fatal):', err.message)
      )
    )
  );
}

module.exports = { appendReport };
