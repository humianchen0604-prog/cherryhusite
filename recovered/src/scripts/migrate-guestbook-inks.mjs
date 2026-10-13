#!/usr/bin/env node
/**
 * One-time: give every guestbook note from before the pens a pen colour, saved
 * in the shared store, so the book never has to pick one at draw time.
 *
 * Notes written with a pen already carry `vibe.pen` and their visitor's colour;
 * they are left alone. The rest are dealt the seven pen inks from a shuffled
 * bag (each pen turns up about equally), in date order, from a fixed seed, and
 * saved with `vibe.pen: true`, which locks the colour on the server.
 *
 *   node scripts/migrate-guestbook-inks.mjs [baseUrl] [--apply] [--backup <file>]
 *
 * Without --apply it only prints what it would change. It always writes a
 * backup of the entries it read first.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Same values as PEN_INKS in public/guestbook/book-cover.html.
const INKS = ['#1C1C1C', '#E6095B', '#F34102', '#3C8F02', '#038A93', '#0142B8', '#53109C'];

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const backupAt = args.indexOf('--backup');
const base = (args.find((a) => /^https?:\/\//.test(a)) || 'https://www.cherryhu.com').replace(/\/$/, '');
const backupFile = resolve(
  backupAt >= 0 ? args[backupAt + 1] : `guestbook-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
);
const api = `${base}/api/guestbook`;

/** mulberry32: small seeded PRNG, so the deal is random but repeatable. */
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** MM/DD/YYYY -> YYYYMMDD, for sorting. */
function dayOf(e) {
  const m = String(e.date || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? m[3] + m[1].padStart(2, '0') + m[2].padStart(2, '0') : '99999999';
}

const res = await fetch(api, { cache: 'no-store' });
if (!res.ok) throw new Error(`GET ${api} -> ${res.status}`);
const { entries = [] } = await res.json();
writeFileSync(backupFile, JSON.stringify({ from: api, at: new Date().toISOString(), entries }, null, 2));
console.log(`Read ${entries.length} entries; backup -> ${backupFile}`);

const old = entries
  .filter((e) => e && e.id && !(e.vibe && e.vibe.pen))
  .sort((a, b) => dayOf(a).localeCompare(dayOf(b)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

const rand = rng(20261012);
let bag = [];
let prev = null;
const changed = old.map((e) => {
  if (!bag.length) {
    bag = INKS.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (bag[bag.length - 1] === prev) bag.unshift(bag.pop());
  }
  prev = bag.pop();
  return { ...e, vibe: { ...(e.vibe || {}), color: prev, pen: true } };
});

const tally = {};
for (const e of changed) {
  tally[e.vibe.color] = (tally[e.vibe.color] || 0) + 1;
  console.log(`${e.date.padEnd(10)} ${String(e.vibe.color)}  ${e.message.slice(0, 40)}`);
}
console.log(`${changed.length} to colour (already coloured: ${entries.length - changed.length})`, tally);

if (!apply) {
  console.log('Dry run. Re-run with --apply to save.');
  process.exit(0);
}
if (!changed.length) {
  console.log('Nothing to save.');
  process.exit(0);
}

const put = await fetch(api, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ entries: changed }),
});
const body = await put.json().catch(() => ({}));
if (!put.ok) throw new Error(`PUT ${api} -> ${put.status} ${JSON.stringify(body)}`);
const saved = (body.entries || []).filter((e) => changed.some((c) => c.id === e.id && e.vibe?.pen && e.vibe?.color === c.vibe.color));
console.log(`Saved. ${saved.length}/${changed.length} now carry their pen colour.`);
