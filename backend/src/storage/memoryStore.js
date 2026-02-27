// Simple in-memory key-value store (no persistence)
const store = new Map();

module.exports = {
  get:    (key)        => store.get(key),
  set:    (key, value) => store.set(key, value),
  delete: (key)        => store.delete(key),
  clear:  ()           => store.clear(),
  size:   ()           => store.size,
};
