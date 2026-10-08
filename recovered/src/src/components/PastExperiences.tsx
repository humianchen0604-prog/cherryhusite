'use client';

import { useEffect } from 'react';

/**
 * Drives the Experiences section.
 *
 * Default: #fafafa stage with the overview composite.
 * Hover a list row → detail (photos + card).
 * First flip after 600ms; then each face (front & back) holds 2400ms before flipping.
 * Switching hover to another row restarts the 600ms countdown from the front.
 * Leave the list/stage zone → soft return to overview. Hover only — no sticky click.
 */
const STAGE_BG = '#fafafa';
const STAGE_FG = 'rgba(0, 0, 0, 0.86)';
const NIGHT_STAGE_BG = 'rgb(255 255 255 / 0.07)';
const NIGHT_STAGE_FG = '#ffffff';
const FLIP_INITIAL_MS = 600;
const FLIP_HOLD_MS = 2_400;

const isDark = () => document.documentElement.dataset.theme === 'dark';
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function PastExperiences() {
  useEffect(() => {
    const section = document.querySelector<HTMLElement>('.past-experiences-framer');
    if (!section) return;
    const stage = section.querySelector<HTMLElement>('.portfolio-stage');
    if (!stage) return;

    const overview = stage.querySelector<HTMLElement>('.portfolio-stage__overview');
    const detail = stage.querySelector<HTMLElement>('.portfolio-stage__detail');
    const photoGroups = Array.from(
      stage.querySelectorAll<HTMLElement>('.portfolio-photo-group')
    );
    const frontFace = stage.querySelector<HTMLElement>('.portfolio-flip-card__face--front');
    const backFace = stage.querySelector<HTMLElement>('.portfolio-flip-card__face--back');
    const frontImgs = frontFace ? Array.from(frontFace.querySelectorAll('img')) : [];
    const backImgs = backFace ? Array.from(backFace.querySelectorAll('img')) : [];
    const flipper = stage.querySelector<HTMLElement>('.portfolio-flip-card__inner');
    const rows = Array.from(section.querySelectorAll<HTMLElement>('.experience-row'));
    const list = section.querySelector<HTMLElement>('.experience-split__list');
    const listWrap = section.querySelector<HTMLElement>('.experience-split__list-wrap');
    const experienceSplit = section.querySelector<HTMLElement>('.experience-split');
    const breakdownHint = section.querySelector<HTMLElement>('.experience-breakdown-hint');
    const hintHome = breakdownHint?.parentElement ?? null;

    let current = -1;
    let hovered = -1;
    let inDetail = false;
    let frame = 0;
    let flipTimer = 0;
    let showingBack = false;

    const paintStage = () => {
      if (isDark()) {
        stage.style.backgroundColor = NIGHT_STAGE_BG;
        stage.style.color = NIGHT_STAGE_FG;
      } else {
        stage.style.backgroundColor = STAGE_BG;
        stage.style.color = STAGE_FG;
      }
    };

    const setCardFace = (i: number) => {
      frontImgs.forEach((img, n) => {
        img.style.opacity = n === i ? '1' : '0';
      });
      backImgs.forEach((img, n) => {
        img.style.opacity = n === i ? '1' : '0';
      });
      photoGroups.forEach((g, n) => {
        g.style.opacity = n === i ? '1' : '0';
      });
    };

    const flip = (on: boolean) => {
      if (!flipper) return;
      showingBack = on;
      flipper.style.transform = on ? 'rotateY(180deg)' : 'rotateY(0deg)';
    };

    const stopAutoFlip = () => {
      if (flipTimer) {
        window.clearTimeout(flipTimer);
        flipTimer = 0;
      }
    };

    const startAutoFlip = () => {
      stopAutoFlip();
      if (!flipper || !inDetail) return;
      if (prefersReducedMotion()) {
        flip(false);
        return;
      }

      // Snap to front instantly so a new hover restarts the countdown cleanly.
      flipper.style.transition = 'none';
      flip(false);
      void flipper.offsetWidth;
      flipper.style.transition = 'transform 620ms cubic-bezier(0.23, 1, 0.32, 1)';

      const schedule = (delay: number) => {
        flipTimer = window.setTimeout(() => {
          flipTimer = 0;
          if (!inDetail) return;
          flip(!showingBack);
          // After the first flip, both faces hold for FLIP_HOLD_MS.
          schedule(FLIP_HOLD_MS);
        }, delay);
      };

      // First flip to back after the initial front delay.
      schedule(FLIP_INITIAL_MS);
    };

    const clearFocus = () => {
      list?.classList.remove('is-focusing');
      rows.forEach((r) => {
        r.classList.remove('is-active');
        r.removeAttribute('aria-current');
      });
      const active = document.activeElement;
      if (active instanceof HTMLElement && section.contains(active)) {
        active.blur();
      }
    };

    const showOverview = () => {
      stopAutoFlip();
      flip(false);
      inDetail = false;
      hovered = -1;
      current = -1;
      stage.classList.add('is-overview');
      stage.classList.remove('is-detail');
      overview?.setAttribute('aria-hidden', 'false');
      detail?.setAttribute('aria-hidden', 'true');
      clearFocus();
      paintStage();
    };

    const showDetail = (i: number) => {
      inDetail = true;
      stage.classList.remove('is-overview');
      stage.classList.add('is-detail');
      overview?.setAttribute('aria-hidden', 'true');
      detail?.setAttribute('aria-hidden', 'false');
      paintStage();
      current = i;
      setCardFace(i);
      // Always restart the first-flip countdown on every hover (including row switches).
      startAutoFlip();
      rows.forEach((r, n) => {
        const on = n === i;
        r.classList.toggle('is-active', on);
        if (on) r.setAttribute('aria-current', 'true');
        else r.removeAttribute('aria-current');
      });
      list?.classList.add('is-focusing');
    };

    const apply = (i: number) => {
      showDetail(i);
    };

    /** Full while `.experience-split` sits inside the center 80vh band;
     *  fade only as it exits that band (top 10vh–bottom 10vh margins). */
    const hintOpacityFromScroll = (splitEl: HTMLElement) => {
      const rect = splitEl.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.width <= 0 || rect.height <= 0) return 0;

      const bandTop = vh * 0.1;
      const bandBottom = vh * 0.9;

      // Fully inside the center 80vh — no fade.
      if (rect.top >= bandTop && rect.bottom <= bandBottom) return 1;

      // How much of the block still intersects the center band.
      const visible = Math.max(0, Math.min(bandBottom, rect.bottom) - Math.max(bandTop, rect.top));
      if (visible <= 0) return 0;

      const t = Math.min(1, visible / Math.max(1, rect.height));
      return t * t * (3 - 2 * t);
    };

    const placeBreakdownHint = () => {
      if (!breakdownHint || !list) return;

      /*
       * Tablet and phone have no hover, so the note is telling people to do
       * something they cannot. Hidden here rather than in CSS because the
       * placement below writes `display: flex` inline with `!important`, and
       * inline !important outranks any stylesheet rule — a `display: none` in
       * globals.css lost to it silently.
       */
      if (window.matchMedia('(max-width: 1199.98px)').matches) {
        breakdownHint.style.cssText = '';
        breakdownHint.classList.remove('is-placed');
        breakdownHint.style.setProperty('display', 'none', 'important');
        return;
      }

      if (window.matchMedia('(max-width: 809.98px)').matches) {
        if (hintHome && breakdownHint.parentElement !== hintHome) {
          hintHome.insertBefore(breakdownHint, listWrap?.querySelector('.experience-split__list') ?? null);
        }
        breakdownHint.classList.add('is-placed');
        breakdownHint.style.cssText = '';
        return;
      }

      if (breakdownHint.parentElement !== document.body) {
        document.body.appendChild(breakdownHint);
      }

      const listRect = list.getBoundingClientRect();
      const opacity = experienceSplit ? hintOpacityFromScroll(experienceSplit) : 0;
      const visible = opacity > 0.02;

      const gap = 40;
      const up = 36;
      /*
       * Absolute in document space, not fixed to the viewport. Fixed made the
       * note track the scroll — it stayed put on screen while the list moved
       * under it. Adding the scroll offset pins it to the list's place on the
       * page instead, so it scrolls with everything else. The fade below is
       * unchanged: it still dims in and out with the section.
       */
      breakdownHint.style.setProperty('position', 'absolute', 'important');
      breakdownHint.style.setProperty(
        'top',
        `${listRect.top + window.scrollY + listRect.height / 2 - up}px`,
        'important'
      );
      breakdownHint.style.setProperty('left', `${listRect.left + window.scrollX - gap}px`, 'important');
      breakdownHint.style.setProperty('right', 'auto', 'important');
      breakdownHint.style.setProperty('bottom', 'auto', 'important');
      breakdownHint.style.setProperty('transform', 'translate(-100%, -50%)', 'important');
      breakdownHint.style.setProperty('display', 'flex', 'important');
      breakdownHint.style.setProperty('flex-direction', 'column', 'important');
      breakdownHint.style.setProperty('align-items', 'flex-end', 'important');
      breakdownHint.style.setProperty('gap', '16px', 'important');
      breakdownHint.style.setProperty('margin', '0', 'important');
      breakdownHint.style.setProperty('padding', '0', 'important');
      breakdownHint.style.setProperty('z-index', '9999', 'important');
      breakdownHint.style.setProperty('pointer-events', 'none', 'important');
      breakdownHint.style.setProperty('white-space', 'nowrap', 'important');
      breakdownHint.style.setProperty(
        'color',
        isDark() ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.55)',
        'important'
      );
      breakdownHint.style.setProperty('opacity', String(opacity), 'important');
      breakdownHint.style.setProperty('visibility', visible ? 'visible' : 'hidden', 'important');
      // The arrow is inline SVG now, stroked with `currentColor` — it already
      // follows the `color` set just above, so no per-theme filter is needed.
      breakdownHint.classList.toggle('is-placed', visible);
    };

    const onScrollOrResize = () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          placeBreakdownHint();
        });
      }
    };

    // Warm side photos + flip cards before first hover so detail isn’t waiting
    // on decode of ~20 images. Fires once the section is near the viewport.
    const warmExperienceImages = () => {
      const urls = new Set<string>();
      stage.querySelectorAll<HTMLImageElement>('img[src]').forEach((img) => {
        if (img.src) urls.add(img.src);
      });
      urls.forEach((src) => {
        const tip = new Image();
        tip.decoding = 'async';
        tip.src = src;
      });
    };

    let warmed = false;
    const warmOnce = () => {
      if (warmed) return;
      warmed = true;
      warmExperienceImages();
    };

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) {
                warmOnce();
                io?.disconnect();
              }
            },
            { rootMargin: '240px 0px' }
          )
        : null;
    if (io) io.observe(section);
    else warmOnce();

    if (flipper) {
      flipper.style.transition = 'transform 620ms cubic-bezier(0.23, 1, 0.32, 1)';
    }

    const rowCleanups: Array<() => void> = [];
    rows.forEach((row, i) => {
      row.style.removeProperty('opacity');

      const onEnter = () => {
        hovered = i;
        apply(i);
      };
      const onLeave = () => {
        // Hover-only: leaving a row doesn't stick. Detail stays until
        // another row is hovered or the pointer leaves the list/stage zone.
        if (hovered === i) hovered = -1;
      };
      row.addEventListener('mouseenter', onEnter);
      row.addEventListener('mouseleave', onLeave);
      rowCleanups.push(() => {
        row.removeEventListener('mouseenter', onEnter);
        row.removeEventListener('mouseleave', onLeave);
      });
    });

    // Exit overview only when leaving the list+stage zone — not the title or section padding.
    const stageCol = section.querySelector<HTMLElement>('.experience-split__stage');
    const interactionZone = [listWrap, stageCol].filter(Boolean) as HTMLElement[];

    const isInInteractionZone = (node: EventTarget | null) => {
      if (!(node instanceof Node)) return false;
      return interactionZone.some((el) => el.contains(node));
    };

    let leaveTimer = 0;
    const scheduleOverview = () => {
      if (leaveTimer) window.clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(() => {
        leaveTimer = 0;
        showOverview();
      }, 60);
    };
    const cancelOverview = () => {
      if (leaveTimer) {
        window.clearTimeout(leaveTimer);
        leaveTimer = 0;
      }
    };

    const onZoneLeave = (e: MouseEvent) => {
      // Still moving within list ↔ stage — keep detail.
      if (isInInteractionZone(e.relatedTarget)) return;
      scheduleOverview();
    };
    const onZoneEnter = () => {
      cancelOverview();
    };

    interactionZone.forEach((el) => {
      el.addEventListener('pointerleave', onZoneLeave);
      el.addEventListener('mouseleave', onZoneLeave);
      el.addEventListener('pointerenter', onZoneEnter);
      el.addEventListener('mouseenter', onZoneEnter);
    });

    // Overview is a single composite image; hover rows open detail.

    showOverview();
    placeBreakdownHint();
    requestAnimationFrame(() => placeBreakdownHint());
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    const themeObs = new MutationObserver(() => {
      paintStage();
      placeBreakdownHint();
    });
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (flipTimer) window.clearTimeout(flipTimer);
      if (leaveTimer) window.clearTimeout(leaveTimer);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      themeObs.disconnect();
      io?.disconnect();
      interactionZone.forEach((el) => {
        el.removeEventListener('pointerleave', onZoneLeave);
        el.removeEventListener('mouseleave', onZoneLeave);
        el.removeEventListener('pointerenter', onZoneEnter);
        el.removeEventListener('mouseenter', onZoneEnter);
      });
      rowCleanups.forEach((fn) => fn());
      if (breakdownHint && hintHome && breakdownHint.parentElement === document.body) {
        hintHome.appendChild(breakdownHint);
      }
    };
  }, []);

  return null;
}
