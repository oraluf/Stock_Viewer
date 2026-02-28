// In-memory archive for daily reports.
// Stores up to MAX_REPORTS entries (newest first).
// Note: resets on server restart — upgrade to a DB for persistence.

const MAX_REPORTS = 30;
const archive = [];

function save(report) {
  // Avoid duplicate entries for the same date
  const exists = archive.some((r) => r.date === report.date);
  if (exists) return;
  archive.unshift(report);           // newest first
  if (archive.length > MAX_REPORTS) archive.pop();
}

function getAll() {
  return [...archive];
}

module.exports = { save, getAll };
