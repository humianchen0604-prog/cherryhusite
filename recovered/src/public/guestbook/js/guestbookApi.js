/**
 * Guestbook persistence:
 * - Prefer cloud API (/api/guestbook) when deployed (Vercel + Upstash Redis)
 * - Fall back to localStorage for local preview
 * - Always merge cloud + local by id so a redeploy / empty cloud response
 *   cannot erase notes that only lived in one place
 * - Never PUT a full replace: the server upserts by id and ignores empty lists
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'guestbook_v3';
  var API_URL = '/api/guestbook';

  function readLocal() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }

  function writeLocal(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (_e) {
      /* ignore */
    }
  }

  /** Union by id. Cloud wins on conflicts (shared source of truth). */
  function mergeById(cloud, local) {
    var byId = Object.create(null);
    (Array.isArray(local) ? local : []).forEach(function (e) {
      if (e && e.id) byId[e.id] = e;
    });
    (Array.isArray(cloud) ? cloud : []).forEach(function (e) {
      if (e && e.id) byId[e.id] = e;
    });
    return Object.keys(byId).map(function (id) {
      return byId[id];
    });
  }

  function cloudEnabled() {
    // Opt-in via meta tag or global flag when you wire portfolio deploy
    if (global.GUESTBOOK_USE_CLOUD === false) return false;
    if (global.GUESTBOOK_USE_CLOUD === true) return true;
    var meta = document.querySelector('meta[name="guestbook-cloud"]');
    if (meta && meta.content === 'off') return false;
    if (meta && meta.content === 'on') return true;
    // Default: try cloud in production hosts, localStorage on file:// or localhost
    var host = location.hostname;
    if (!host || host === 'localhost' || host === '127.0.0.1') return false;
    if (location.protocol === 'file:') return false;
    return true;
  }

  /** Push any local-only notes up so redeploys / other browsers keep them. */
  function backfillMissing(merged, cloud) {
    var cloudIds = Object.create(null);
    (cloud || []).forEach(function (e) {
      if (e && e.id) cloudIds[e.id] = true;
    });
    merged.forEach(function (entry) {
      if (!entry || !entry.id || cloudIds[entry.id]) return;
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ entry: entry })
      }).catch(function () {
        /* offline — stay in localStorage until next load */
      });
    });
  }

  async function fetchEntries() {
    if (!cloudEnabled()) return readLocal();
    var local = readLocal();
    try {
      var res = await fetch(API_URL, { method: 'GET', credentials: 'omit' });
      if (!res.ok) throw new Error('GET ' + res.status);
      var data = await res.json();
      var cloud = Array.isArray(data.entries) ? data.entries : [];
      var merged = mergeById(cloud, local);
      writeLocal(merged);
      // If this browser held notes the cloud never got (e.g. earlier 503s),
      // push them up so they survive the next deploy for everyone.
      if (merged.length > cloud.length) backfillMissing(merged, cloud);
      return merged;
    } catch (_e) {
      return local;
    }
  }

  /**
   * Persist a newly created entry. Returns the server entry (or local copy).
   * @throws Error with .code === 'PROFANITY' when blocked
   */
  async function createEntry(entry) {
    // Always keep a local cache so UI stays snappy
    var local = readLocal();
    var exists = local.some(function (e) { return e.id === entry.id; });
    if (!exists) {
      local.push(entry);
      writeLocal(local);
    } else {
      local = local.map(function (e) {
        return e.id === entry.id ? entry : e;
      });
      writeLocal(local);
    }

    if (!cloudEnabled()) return entry;

    try {
      var res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ entry: entry })
      });
      var data = await res.json().catch(function () { return {}; });
      if (res.status === 422 || (data && data.code === 'PROFANITY')) {
        // Roll back local write
        writeLocal(readLocal().filter(function (e) { return e.id !== entry.id; }));
        var err = new Error(data.error || 'Blocked');
        err.code = 'PROFANITY';
        throw err;
      }
      if (!res.ok) throw new Error(data.error || 'POST failed');
      if (data.entry) {
        var merged = readLocal().map(function (e) {
          return e.id === data.entry.id ? data.entry : e;
        });
        if (!merged.some(function (e) { return e.id === data.entry.id; })) {
          merged.push(data.entry);
        }
        writeLocal(merged);
        return data.entry;
      }
      return entry;
    } catch (e) {
      if (e && e.code === 'PROFANITY') throw e;
      // Offline / API down — keep local so the visitor still sees their note.
      // fetchEntries() will backfill to Redis on the next successful cloud load.
      return entry;
    }
  }

  /**
   * Replace full list locally (after relayout updates positions). Syncs
   * position updates to the cloud via merge-safe PUT — server upserts by id
   * and never drops entries absent from this payload.
   */
  async function saveAllLocal(entries) {
    // Merge with whatever we already cache so a page-local relayout cannot
    // shrink the local list (and then sync that shrink upward).
    var merged = mergeById(entries, readLocal());
    writeLocal(merged);
    if (!cloudEnabled()) return;
    if (!merged.length) return;
    try {
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ entries: merged })
      });
    } catch (_e) {
      /* ignore — positions can reconcile on next load */
    }
  }

  global.GuestbookApi = {
    STORAGE_KEY: STORAGE_KEY,
    cloudEnabled: cloudEnabled,
    fetchEntries: fetchEntries,
    createEntry: createEntry,
    saveAllLocal: saveAllLocal,
    readLocal: readLocal,
    writeLocal: writeLocal
  };
})(typeof window !== 'undefined' ? window : globalThis);
