// מטמון (Cache) — in-memory TTL cache
// Wraps memoryStore with expiry logic so stale entries are ignored.

const store = require('../storage/memoryStore');

function makeKey(namespace, params) {
  return `${namespace}:${JSON.stringify(params)}`;
}

/**
 * Returns cached value or null if missing / expired.
 */
function get(namespace, params) {
  const key   = makeKey(namespace, params);
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Stores value with a TTL in milliseconds.
 */
function set(namespace, params, data, ttlMs) {
  const key = makeKey(namespace, params);
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

module.exports = { get, set };
