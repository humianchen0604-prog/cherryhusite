/**
 * Client + server-shareable profanity gate.
 * Always re-check on the server — client checks are UX only.
 */
(function (global) {
  'use strict';

  /** English / leetspeak-prone insults */
  var EN_BLOCKLIST = [
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
    'prick'
  ];

  /** Common Chinese insults / 辱骂 */
  var ZH_BLOCKLIST = [
    '操', '草泥马', '操你妈', '你妈', '妈的', '他妈的',
    '傻逼', '傻b', '傻比', '傻吊', '傻叉',
    '白痴', '蠢货', '脑残', '智障',
    '去死', '滚蛋', '去死吧',
    '贱人', '贱货', '婊子',
    '狗日', '狗逼', '狗b',
    '屁眼', '鸡巴', '阴茎', '阴道',
    '弱智', '垃圾人', '人渣'
  ];

  function normalizeEn(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/\$/g, 's')
      .replace(/@/g, 'a')
      // strip separators so "f.u.c.k" / "f*ck" still match
      .replace(/[^a-z]+/g, '');
  }

  function containsBlockedWord(normalized, word) {
    if (!word) return false;
    // whole-word-ish: block if word appears as substring in collapsed text
    return normalized.indexOf(word) !== -1;
  }

  /**
   * @returns {{ ok: true } | { ok: false, reason: string }}
   */
  function checkProfanity(message, name) {
    var combined = String(message || '') + ' ' + String(name || '');
    var enNorm = normalizeEn(combined);
    var lower = combined.toLowerCase();

    var i;
    for (i = 0; i < EN_BLOCKLIST.length; i++) {
      if (containsBlockedWord(enNorm, EN_BLOCKLIST[i])) {
        return {
          ok: false,
          reason: 'Please keep it kind — that language isn’t allowed.'
        };
      }
    }

    for (i = 0; i < ZH_BLOCKLIST.length; i++) {
      if (lower.indexOf(ZH_BLOCKLIST[i]) !== -1) {
        return {
          ok: false,
          reason: '请文明留言，辱骂词汇无法发布。'
        };
      }
    }

    return { ok: true };
  }

  var api = {
    EN_BLOCKLIST: EN_BLOCKLIST,
    ZH_BLOCKLIST: ZH_BLOCKLIST,
    normalizeEn: normalizeEn,
    checkProfanity: checkProfanity
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.ProfanityFilter = api;
})(typeof window !== 'undefined' ? window : globalThis);
