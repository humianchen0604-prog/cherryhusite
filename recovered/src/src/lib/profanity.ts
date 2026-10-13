/**
 * Shared profanity gate. Ported from the guestbook project's
 * `js/profanityFilter.js` — kept as one module so the list only ever
 * has to be extended in a single place.
 *
 * The client copy (public/guestbook/js/profanityFilter.js) runs inside the book
 * for instant feedback; this one is what actually enforces, on the server.
 */

/**
 * English blocklist, in two kinds. Keep in step with the client copy
 * (public/guestbook/js/profanityFilter.js).
 *
 * ANYWHERE: blocked even inside other text, after leetspeak is folded and
 * every space / symbol is removed — so "f.u.c.k" and "b00bs" still match.
 * Only words long or odd enough not to turn up inside innocent ones.
 */
export const EN_ANYWHERE = [
  // insults
  'fuck', 'fucking', 'motherfucker', 'phuck',
  'shit', 'bullshit', 'shithead',
  'bitch', 'biatch', 'beyotch',
  'asshole', 'arsehole', 'bastard', 'cunt', 'dickhead', 'pussy',
  'whore', 'slut', 'skank', 'hooker',
  'cocksucker', 'blowjob', 'handjob', 'rimjob', 'jerkoff', 'wanker', 'twat', 'prick',
  'douche', 'jackass', 'dumbass', 'scumbag', 'bollocks', 'bugger', 'tosser',
  'stfu', 'gtfo', 'killyourself',
  // sexual / body
  'butthole', 'boobs', 'boobies', 'titty', 'titties', 'nipple',
  'penis', 'vagina', 'dildo', 'cumshot', 'jizz', 'porn', 'orgasm', 'milf',
  // slurs / hate
  'faggot', 'nigger', 'nigga', 'retard', 'kike', 'tranny', 'wetback', 'beaner', 'hitler', 'kkk',
  // spam / scams
  'onlyfans', 'casino', 'viagra', 'crypto', 'bitcoin', 'airdrop', 'giveaway', 'telegram', 'whatsapp',
];

/**
 * WHOLE WORD: blocked only as a word (or phrase) of its own, so "ass" stops
 * "ass" but not "class" or "passionate", and "cock" not "peacock". Also
 * blocked when the whole message spells it out with separators ("a.s.s").
 */
export const EN_WHOLE_WORD = [
  // insults
  'mf', 'dick', 'cock', 'fag',
  'piss', 'pissed', 'idiot', 'moron', 'stupid', 'loser', 'scum',
  'hoe', 'thot', 'slag', 'knob', 'wtf', 'shut up',
  // threats / self-harm
  'kys', 'kill yourself', 'die', 'go die', 'rape',
  // sexual / body
  'ass', 'asses', 'arse', 'butt', 'boob', 'tits', 'cum', 'semen', 'nudes', 'sex',
  'erection', 'anal', 'anus', 'horny',
  // slurs / hate
  'spic', 'chink', 'dyke', 'homo', 'paki', 'gook', 'coon', 'nazi',
  // misspellings
  'fck', 'fk', 'fuk', 'fuq', 'sht',
  // spam phrases
  'promo code', 'dm me', 'free money',
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

/** Fold leetspeak to letters and lowercase. */
function foldLeet(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a');
}

/** Collapse leetspeak and separators so "f.u.c.k" and "f*ck" still match. */
export function normalizeEn(text: string): string {
  return foldLeet(text).replace(/[^a-z]+/g, '');
}

/** " word word " — leet folded, one space between words, padded both ends. */
function wordsOf(text: string): string {
  return ` ${foldLeet(text).replace(/[^a-z]+/g, ' ').trim()} `;
}

/*
 * Links and contact details: web addresses, bare domains, emails, phone
 * numbers, @handles and chat invites. Checked on the raw text, before any
 * folding (the folding turns "@" into "a").
 */
const TLD = '(?:com|net|org|io|co|me|app|dev|xyz|ly|gg|tv|info|biz|us|uk|ca|cn|ru|shop|site|online|link|club|ai|de|jp|fr|au)';
const CONTACT_PATTERNS: RegExp[] = [
  /https?:\/\//i,
  /\bwww\s*\./i,
  new RegExp(`\\b[a-z0-9-]{2,}\\s*(?:\\.|\\(dot\\)|\\[dot\\])\\s*${TLD}\\b`, 'i'),
  /[a-z0-9._%+-]+\s*@\s*[a-z0-9-]+\s*\.\s*[a-z]{2,}/i,
  /(?:\d[\s\-.()]*){7,}/,
  /(?:^|[\s(])@[a-z0-9_.]{2,}/i,
  /\b(?:t\.me|discord\.gg|wa\.me)\b/i,
];

export function hasContactInfo(text: string): boolean {
  const raw = String(text || '');
  return CONTACT_PATTERNS.some((re) => re.test(raw));
}

const MSG_KIND = 'Please keep it kind — that language isn’t allowed.';
const MSG_CONTACT = 'Links and contact details can’t be posted here.';

export type ProfanityResult = { ok: true } | { ok: false; reason: string };

export function checkProfanity(message: string, name?: string): ProfanityResult {
  const parts = [String(message || ''), String(name || '')];
  const combined = parts.join(' ');

  if (parts.some(hasContactInfo)) return { ok: false, reason: MSG_CONTACT };

  const collapsed = normalizeEn(combined);
  for (const w of EN_ANYWHERE) {
    if (collapsed.includes(w)) return { ok: false, reason: MSG_KIND };
  }

  // Whole words per field, so a message ending "...so" and a name starting
  // "x..." are not read as one word.
  for (const part of parts) {
    const words = wordsOf(part);
    const spelled = normalizeEn(part);
    for (const w of EN_WHOLE_WORD) {
      if (words.includes(` ${w} `) || spelled === w.replace(/ /g, '')) {
        return { ok: false, reason: MSG_KIND };
      }
    }
  }

  const lower = combined.toLowerCase();
  for (const w of ZH_BLOCKLIST) {
    if (lower.includes(w)) {
      return { ok: false, reason: '请文明留言，辱骂词汇无法发布。' };
    }
  }
  return { ok: true };
}
