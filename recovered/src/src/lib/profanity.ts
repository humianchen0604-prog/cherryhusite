/**
 * Shared profanity gate. Ported from the guestbook project's
 * `js/profanityFilter.js` — kept as one module so the list only ever
 * has to be extended in a single place.
 *
 * The client copy (public/guestbook/js/profanityFilter.js) runs inside the book
 * for instant feedback; this one is what actually enforces, on the server.
 */

/** English / leetspeak-prone insults. */
export const EN_BLOCKLIST = [
  'fuck', 'fucker', 'fucking', 'motherfucker', 'mf',
  'shit', 'bullshit', 'shithead',
  'bitch', 'bitches',
  'asshole', 'arsehole',
  'bastard',
  'cunt',
  'dick', 'dickhead',
  'pussy',
  'whore', 'slut',
  'faggot', 'fag',
  'nigger', 'nigga',
  'retard', 'retarded',
  'cock', 'cocksucker',
  'blowjob',
  'jerkoff',
  'wanker',
  'twat',
  'prick',
];

/** Common Chinese insults / 辱骂. */
export const ZH_BLOCKLIST = [
  '操', '草泥马', '操你妈', '你妈', '妈的', '他妈的',
  '傻逼', '傻b', '傻比', '傻吊', '傻叉',
  '白痴', '蠢货', '脑残', '智障',
  '去死', '滚蛋', '去死吧',
  '贱人', '贱货', '婊子',
  '狗日', '狗逼', '狗b',
  '屁眼', '鸡巴', '阴茎', '阴道',
  '弱智', '垃圾人', '人渣',
];

/** Collapse leetspeak and separators so "f.u.c.k" and "f*ck" still match. */
export function normalizeEn(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a')
    .replace(/[^a-z]+/g, '');
}

export type ProfanityResult = { ok: true } | { ok: false; reason: string };

export function checkProfanity(message: string, name?: string): ProfanityResult {
  const combined = `${String(message || '')} ${String(name || '')}`;
  const enNorm = normalizeEn(combined);
  const lower = combined.toLowerCase();

  for (const w of EN_BLOCKLIST) {
    if (enNorm.includes(w)) {
      return { ok: false, reason: 'Please keep it kind — that language isn’t allowed.' };
    }
  }
  for (const w of ZH_BLOCKLIST) {
    if (lower.includes(w)) {
      return { ok: false, reason: '请文明留言，辱骂词汇无法发布。' };
    }
  }
  return { ok: true };
}
