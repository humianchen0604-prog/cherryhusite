/**
 * The real guestbook notes, as signed on the live site. Local preview has no
 * cloud store (see guestbookApi.js), so these stand in for it: the first
 * seed replaces whatever test notes sit in this browser's localStorage, and
 * bumping VERSION later swaps only these notes. Notes written in between are
 * kept.
 *
 * Shape matches what the book writes: a pen ink, a saved tilt, and reading
 * order (left page first) via pageIndex + array order. Positions are left
 * out; the book packs them itself, and draws each note's lean from its id
 * (tiltFor in book-cover.html) rather than the saved tilt.
 *
 * Inks are picked at random from the pens (PEN_INKS in book-cover.html,
 * which only honours those exact values), from a fixed seed so every load
 * deals the same colours, and never the same ink twice in a row.
 */
(function (global) {
  'use strict';

  var INKS = ['#1C1C1C', '#E6095B', '#F34102', '#3C8F02', '#038A93', '#0142B8', '#53109C'];

  /** mulberry32: small seeded PRNG, so the deal is random but repeatable. */
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var NOTES = [
    // Left page
    ['Awesome work', 'Angela', '09/15/2026', -1],
    ['soooooooo coooool !!!!', 'Anonymous', '09/22/2026', -1.5],
    ['soo niceee!!', 'thea', '10/05/2026', 2],
    ['This is really cool!', 'Munchy', '10/03/2026', 1.5],
    ['Rad works!!', 'jason.y', '09/23/2026', -3],
    ["This is amazing, I'm soooo proud of you:)))", 'Loo :)', '09/21/2026', 3],
    ['niceee', 'Anonymous', '10/07/2026', -1],
    ['i love your work and how you are passionate about your design!', 'dakota', '09/17/2026', 1],
    ['love all the micro interactions', 'Anonymous', '09/22/2026', 0],
    ['Good job girly!', 'Anonymous', '10/07/2026', 1],
    ['Cute design, so proud of you!!!', 'Anonymous 9/24/2026', '09/24/2026', 3],
    ['had soooooo much fun scrolling it!!!', 'hxy :)', '09/22/2026', 2],
    ['So coolll', 'Anonymous', '09/29/2026', 2],
    ['Love it!!!', 'Anonymous', '09/21/2026', -2],
    ['so fun clicking around! cool stuff', 'charlsy', '09/25/2026', -2],
    ['This portfolio is so cute omggg', 'Amanda', '09/29/2026', -1],
    // Right page
    ['Rlly cool work with so many fun little ideas everywhere. Feels very youuu.', 'wyf', '09/27/2026', 3],
    ['too cool', 'Anonymous', '09/29/2026', -2],
    ['Cool website, Cherry!', 'Amit Merchant', '09/29/2026', -3],
    ['YEAG', 'Anonymous', '09/29/2026', -2],
    ['nahhh girl this site goes crazy', 'Rehan', '09/29/2026', 0],
    ['Very cool!!', 'Anonymous', '10/02/2026', 2],
    ['I like your case study pages!', 'Jayson', '10/03/2026', 4],
    ['hell yeahh', 'Anonymous', '10/05/2026', 2],
    ['This site is so creative', 'AK from India', '10/03/2026', -3],
    ['Very cool', 'vova (byvova.com)', '10/03/2026', 2],
    ['Fire', 'Anonymous', '10/06/2026', -2],
    ['wow', 'Anonymous', '10/06/2026', 3],
    ['Very cool', 'Anonymous', '10/06/2026', -2],
    ['Nice', 'Baaska 2026/09/30', '09/30/2026', 1],
    ['cooooooooooooool !', 'Anonymous', '10/08/2026', -2]
  ];

  /* Deal from a shuffled bag of all seven inks, refilled when empty, so every
     pen turns up about equally; a refill never opens with the ink just used. */
  var rand = rng(20261012);
  var bag = [];
  var prevInk = null;
  function nextInk() {
    if (!bag.length) {
      bag = INKS.slice();
      for (var i = bag.length - 1; i > 0; i--) {
        var j = Math.floor(rand() * (i + 1));
        var t = bag[i]; bag[i] = bag[j]; bag[j] = t;
      }
      if (bag[bag.length - 1] === prevInk) bag.unshift(bag.pop());
    }
    prevInk = bag.pop();
    return prevInk;
  }

  global.GuestbookSeed = {
    VERSION: 'live-2026-10-12-inks2',
    entries: NOTES.map(function (n, i) {
      return {
        id: 'seed-' + String(i + 1).padStart(2, '0'),
        message: n[0],
        name: n[1],
        date: n[2],
        pageIndex: 1,
        vibe: { rotation: n[3], color: nextInk() },
        source: 'book-cover'
      };
    })
  };
})(typeof window !== 'undefined' ? window : globalThis);
