'use client';

import { useEffect } from 'react';

/**
 * Tablet and phone widths get the pressed state only — no hover.
 *
 * `:hover` rules live in a dozen stylesheets (Framer's exports, the case-study
 * sheets, globals), so rather than edit hundreds of them this switches them off
 * where they shouldn't apply. Below the breakpoint every rule whose selector
 * contains `:hover` gets the pseudo-class swapped for `:not(*)`, which matches
 * nothing; above it the original selector is restored. `:active` and
 * `:focus-visible` are untouched, so a press still reads.
 *
 * Runs on the live CSSOM, so it also covers stylesheets that arrive later (a
 * case study's CSS loads on client navigation) via a MutationObserver on <head>.
 */

const MAX_WIDTH = 1199.98;
const NEVER = ':not(*)';

const originals = new WeakMap<CSSStyleRule, string>();

function walk(rules: CSSRuleList, off: boolean) {
  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    // Grouping rules (@media, @supports, @layer) nest style rules.
    if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) {
      walk((rule as CSSGroupingRule).cssRules, off);
    }
    if (!(rule instanceof CSSStyleRule)) continue;
    const orig = originals.get(rule) ?? rule.selectorText;
    if (!orig.includes(':hover')) continue;
    if (!originals.has(rule)) originals.set(rule, orig);
    const next = off ? orig.split(':hover').join(NEVER) : orig;
    if (rule.selectorText !== next) {
      try {
        rule.selectorText = next;
      } catch {
        /* a selector the engine won't re-parse stays as it was */
      }
    }
  }
}

function apply() {
  const off = window.innerWidth <= MAX_WIDTH;
  document.documentElement.classList.toggle('no-hover', off);
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin sheet (fonts) — nothing of ours in it
    }
    walk(rules, off);
  }
}

/** True when hover should be suppressed — for the JS-driven hovers to check. */
export function hoverDisabled(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MAX_WIDTH;
}

export default function NoHover() {
  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(apply, 60);
    };
    apply();
    window.addEventListener('resize', schedule);
    const obs = new MutationObserver(schedule);
    obs.observe(document.head, { childList: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', schedule);
      obs.disconnect();
    };
  }, []);

  return null;
}
