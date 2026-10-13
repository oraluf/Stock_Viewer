// Google Docs integration via Google Apps Script webhook.
//
// Env var (optional; no-op if not set):
//   GOOGLE_DOCS_WEBHOOK_URL  → appends a full narrative entry to the Trading Journal Doc
//
// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────────────
// 1. Open script.google.com → New project. Paste the script below (replace all).
// 2. Deploy → New deployment → Web app
//      Execute as: Me  |  Who has access: Anyone
//    Copy the deployment URL.
// 3. Add to backend/.env:
//      GOOGLE_DOCS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_ID/exec
//
// ─── PASTE THIS INTO APPS SCRIPT ─────────────────────────────────────────────
//
//  const DOCUMENT_ID = '18OyMr_imgI6pW-MZjzK08jdGEMf14Vff9W1zdUQywMs';
//
//  function doPost(e) {
//    try {
//      const data    = JSON.parse(e.postData.contents);
//      const date    = data.date || '';
//      const savings = data.economicSavings;
//      const asOf    = data.asOf ? new Date(data.asOf).toLocaleString() : '';
//      const body    = DocumentApp.openById(DOCUMENT_ID).getBody();
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
//          body.appendParagraph(pills).setFontSize(9).setForegroundColor('#888888');
//        }
//      });
//
//      body.appendParagraph('Generated: ' + asOf).setForegroundColor('#aaaaaa').setFontSize(9);
//      body.appendHorizontalRule();
//
//      return ContentService
//        .createTextOutput(JSON.stringify({ status: 'ok', date: date }))
//        .setMimeType(ContentService.MimeType.JSON);
//    } catch (err) {
//      return ContentService
//        .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
//        .setMimeType(ContentService.MimeType.JSON);
//    }
//  }
//
// ─── END OF APPS SCRIPT ──────────────────────────────────────────────────────

async function post(url, body) {
  console.log('[Webhook] POST →', url);
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const text = await res.text();
  if (res.ok) {
    console.log('[Webhook] OK', res.status, '|', text.slice(0, 120));
  } else {
    console.warn('[Webhook] HTTP', res.status, '|', text.slice(0, 200));
  }
  return res.ok;
}

/**
 * Sends a report to whichever Google webhooks are configured.
 * Failures are logged but never thrown.
 * @returns {Promise<boolean>} true if at least one webhook accepted the report
 */
async function appendReport(report) {
  const sheetsUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const docsUrl   = process.env.GOOGLE_DOCS_WEBHOOK_URL;

  if (!sheetsUrl && !docsUrl) {
    console.log('[Webhook] No webhook URLs set — skipping. Add GOOGLE_DOCS_WEBHOOK_URL to .env');
    return false;
  }

  console.log('[Webhook] GOOGLE_DOCS_WEBHOOK_URL:', docsUrl   ? '✓ set' : '✗ not set');
  console.log('[Webhook] GOOGLE_SHEETS_WEBHOOK_URL:', sheetsUrl ? '✓ set' : '✗ not set');

  const targets = [...new Set([sheetsUrl, docsUrl].filter(Boolean))];

  const results = await Promise.all(
    targets.map((url) =>
      post(url, report).catch((err) => {
        console.warn('[Webhook] Failed (non-fatal):', err.message);
        return false;
      })
    )
  );
  return results.some(Boolean);
}

module.exports = { appendReport };
