'use strict';

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');

/**
 * Minimal JSON-file collection store.
 *
 * - Data is kept in memory and mirrored to a JSON file on disk.
 * - Writes are serialized through a per-collection promise chain so concurrent
 *   requests can't interleave and corrupt the file.
 *
 * This is intentionally simple (good enough for development / small scale).
 * Swap for a real database (Postgres, Mongo, SQLite) when needed — the call
 * sites only use the small API exposed below.
 */
class Collection {
  constructor(name) {
    this.name = name;
    this.file = path.join(DATA_DIR, `${name}.json`);
    this.items = [];
    this._writeChain = Promise.resolve();
    this._load();
  }

  _load() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      if (fs.existsSync(this.file)) {
        const raw = fs.readFileSync(this.file, 'utf8').trim();
        this.items = raw ? JSON.parse(raw) : [];
      } else {
        this.items = [];
      }
    } catch (err) {
      // Corrupt/unreadable file: start empty rather than crashing the server.
      // eslint-disable-next-line no-console
      console.error(`[store] failed to load "${this.name}", starting empty:`, err.message);
      this.items = [];
    }
  }

  _persist() {
    const snapshot = JSON.stringify(this.items, null, 2);
    this._writeChain = this._writeChain.then(() =>
      fsp.writeFile(this.file, snapshot, 'utf8').catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`[store] failed to persist "${this.name}":`, err.message);
      }),
    );
    return this._writeChain;
  }

  /** Returns all items (shallow copies to protect the cache). */
  all() {
    return this.items.map((i) => ({ ...i }));
  }

  find(predicate) {
    const hit = this.items.find(predicate);
    return hit ? { ...hit } : null;
  }

  async insert(item) {
    this.items.push(item);
    await this._persist();
    return { ...item };
  }

  async update(id, patch) {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    this.items[idx] = { ...this.items[idx], ...patch };
    await this._persist();
    return { ...this.items[idx] };
  }
}

const collections = new Map();

/** Get (or lazily create) a named collection. */
function collection(name) {
  if (!collections.has(name)) {
    collections.set(name, new Collection(name));
  }
  return collections.get(name);
}

module.exports = { collection };
