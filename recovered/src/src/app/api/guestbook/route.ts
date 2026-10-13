/**
 * Shared guestbook store — App Router port of the guestbook project's
 * `api/guestbook.js` (Vercel serverless + Upstash Redis).
 *
 * Setup:
 *   1. Create a free Upstash Redis DB — https://upstash.com
 *   2. Vercel → Project → Settings → Environment Variables:
 *        UPSTASH_REDIS_REST_URL
 *        UPSTASH_REDIS_REST_TOKEN
 *   3. Deploy. The book calls GET/POST/PUT /api/guestbook.
 *
 * Without those vars this returns 503 and the client falls back to localStorage,
 * so local development needs no configuration.
 */
import { NextResponse } from 'next/server';
import { checkProfanity } from '@/lib/profanity';

export const dynamic = 'force-dynamic';

const REDIS_KEY = 'guestbook:entries:v1';
const MAX_ENTRIES = 500;
const MAX_MESSAGE = 120;
const MAX_NAME = 40;

type Entry = {
  id: string;
  message: string;
  name: string;
  date: string;
  pageIndex: number;
  vibe: {
    font: string; color: string; rotation: number;
    weight: number; fontSize: number; top: string; left: string;
    /** `color` is a saved pen colour: the visitor's own pick, or the one
     *  given once to notes from before the pens. Locks the colour (see PUT). */
    pen?: true;
  };
  source: string;
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: CORS });

const redisConfigured = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

async function redisCommand(command: (string | number)[]) {
  const res = await fetch(process.env.UPSTASH_REDIS_REST_URL as string, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Redis error: ${res.status} ${await res.text()}`);
  return (await res.json()).result;
}

async function loadEntries(): Promise<Entry[]> {
  const raw = await redisCommand(['GET', REDIS_KEY]);
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const saveEntries = (entries: Entry[]) =>
  redisCommand(['SET', REDIS_KEY, JSON.stringify(entries)]);

/**
 * Trim to safe lengths. Note this keeps non-ASCII: the original stripped
 * everything outside \x20-\x7E *before* the profanity check, which quietly made
 * the Chinese blocklist unreachable. Profanity is now checked on the raw text
 * (see below) and only the stored value is normalised.
 */
function sanitizeEntry(input: unknown): Entry | null {
  if (!input || typeof input !== 'object') return null;
  const i = input as Record<string, unknown>;

  // Strip control characters only — printable ASCII and CJK both survive, so
  // the Chinese blocklist still has something to match on.
  const strip = (v: unknown) => String(v || '').replace(/[\u0000-\u001F\u007F]/g, '').trim();
  const message = strip(i.message).slice(0, MAX_MESSAGE);
  if (!message) return null;
  const name = strip(i.name).slice(0, MAX_NAME) || '—';

  const vibe = (i.vibe && typeof i.vibe === 'object' ? i.vibe : {}) as Record<string, unknown>;
  return {
    id: String(i.id || '').slice(0, 80) || Date.now().toString(36) + Math.random().toString(36).slice(2),
    message,
    name,
    date: String(i.date || '').slice(0, 32),
    pageIndex: Number.isFinite(Number(i.pageIndex)) ? Number(i.pageIndex) : 1,
    vibe: {
      font: 'Ugly Dave',
      color: String(vibe.color || '#31100C').slice(0, 32),
      rotation: typeof vibe.rotation === 'number' ? vibe.rotation : 0,
      weight: 400,
      fontSize: 14,
      top: String(vibe.top || '12%').slice(0, 16),
      left: String(vibe.left || '12%').slice(0, 16),
      ...(vibe.pen === true ? { pen: true as const } : {}),
    },
    source: 'book-cover',
  };
}

/** Gate on what the visitor actually typed, before any trimming. */
function rawGate(input: unknown) {
  const i = (input || {}) as Record<string, unknown>;
  return checkProfanity(String(i.message || ''), String(i.name || ''));
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  if (!redisConfigured()) {
    return json({ error: 'Cloud store not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.' }, 503);
  }
  try {
    return json({ entries: await loadEntries() });
  } catch (err) {
    return json({ error: (err as Error).message || 'Server error' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Gate before the store check: profanity must be rejected even when the
    // cloud is unconfigured, otherwise a 503 would read as "not blocked".
    const gate = rawGate(body?.entry);
    if (!gate.ok) return json({ code: 'PROFANITY', error: gate.reason }, 422);

    if (!redisConfigured()) return json({ error: 'Cloud store not configured.' }, 503);

    const entry = sanitizeEntry(body?.entry);
    if (!entry) return json({ error: 'Invalid entry' }, 400);
    // Re-check post-trim in case truncation revealed a match.
    const gate2 = checkProfanity(entry.message, entry.name);
    if (!gate2.ok) return json({ code: 'PROFANITY', error: gate2.reason }, 422);

    const entries = await loadEntries();
    const idx = entries.findIndex((e) => e.id === entry.id);
    if (idx >= 0) entries[idx] = entry;
    else entries.push(entry);
    while (entries.length > MAX_ENTRIES) entries.shift();
    await saveEntries(entries);

    return json({ entry }, 201);
  } catch (err) {
    return json({ error: (err as Error).message || 'Server error' }, 500);
  }
}

/** Used after client-side relayout to sync % positions. Upserts by id — never
 *  drops entries the client didn't send (a stale/partial local cache used to
 *  wipe the whole Redis list on PUT). An empty payload is a no-op so a bad
 *  client cannot clear the book. */
export async function PUT(req: Request) {
  if (!redisConfigured()) return json({ error: 'Cloud store not configured.' }, 503);
  try {
    const body = await req.json().catch(() => ({}));
    const list = Array.isArray(body?.entries) ? body.entries : [];
    const existing = await loadEntries();

    // Never let a blank/partial sync erase the shared book.
    if (list.length === 0) {
      return json({ entries: existing, skipped: 'empty' });
    }

    const byId = new Map<string, Entry>(existing.map((e) => [e.id, e]));

    for (const raw of list) {
      if (!rawGate(raw).ok) continue;
      const entry = sanitizeEntry(raw);
      if (!entry) continue;
      if (!checkProfanity(entry.message, entry.name).ok) continue;
      // Position sync may update vibe coords; keep existing message/name if the
      // incoming payload somehow lost them (sanitize already requires message).
      // Once a note has a pen colour it keeps it: a position sync from a
      // browser holding an older copy of the note cannot write its old colour
      // (or drop the flag) back over it.
      const prev = byId.get(entry.id);
      if (prev?.vibe?.pen) {
        entry.vibe.pen = true;
        entry.vibe.color = prev.vibe.color;
      }
      byId.set(entry.id, entry);
    }

    const merged = Array.from(byId.values()).slice(-MAX_ENTRIES);
    await saveEntries(merged);
    return json({ entries: merged });
  } catch (err) {
    return json({ error: (err as Error).message || 'Server error' }, 500);
  }
}
