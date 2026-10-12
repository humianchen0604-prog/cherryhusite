/**
 * Shared note placement (vanilla). Mirrors src/lib/notePlacement.ts
 * Attaches API to window.NotePlacement for book-cover.html / guestbook.html.
 */
(function (global) {
  'use strict';

  var NOTE_GAP_PX = 12;
  /* NOTE_GAP_PX is the gap on the 372px desktop page; smaller pages get a
     proportionally smaller gap, so spacing does not eat a small page. */
  var NOTE_GAP_REF_WIDTH = 372;
  function gapFor(cw) {
    return Math.max(4, Math.min(NOTE_GAP_PX, Math.round(cw * NOTE_GAP_PX / NOTE_GAP_REF_WIDTH)));
  }
  /* Edge padding as a fraction of the page. 6% left room for only one column
     of notes on a page; 4% fits two tilted notes side by side. */
  var NOTE_EDGE_PAD_FRAC = 0.04;
  var NOTE_PLACE_ATTEMPTS = 60;
  var NOTE_RESIZE_DEBOUNCE_MS = 150;

  function measureUnrotatedSize(el) {
    var prevTransform = el.style.transform;
    var prevTransition = el.style.transition;
    el.style.transition = 'none';
    el.style.transform = 'none';
    void el.offsetWidth;
    var rect = el.getBoundingClientRect();
    el.style.transform = prevTransform;
    el.style.transition = prevTransition;
    return {
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
  }

  function degToRad(deg) {
    return (deg * Math.PI) / 180;
  }

  function rotatedBoundingSize(width, height, thetaRad) {
    var c = Math.abs(Math.cos(thetaRad));
    var s = Math.abs(Math.sin(thetaRad));
    return {
      width: width * c + height * s,
      height: width * s + height * c,
    };
  }

  function aabbsOverlap(a, b, gap) {
    if (gap == null) gap = NOTE_GAP_PX;
    return !(
      a.right + gap <= b.left ||
      b.right + gap <= a.left ||
      a.bottom + gap <= b.top ||
      b.bottom + gap <= a.top
    );
  }

  function boxFromCenter(cx, cy, rotatedW, rotatedH) {
    var halfW = rotatedW / 2;
    var halfH = rotatedH / 2;
    return {
      left: cx - halfW,
      top: cy - halfH,
      right: cx + halfW,
      bottom: cy + halfH,
    };
  }

  function collidesAny(box, placed, gap) {
    for (var i = 0; i < placed.length; i++) {
      if (aabbsOverlap(box, placed[i], gap)) return true;
    }
    return false;
  }

  function randomIn(min, max, random) {
    if (max <= min) return min;
    return min + random() * (max - min);
  }

  /*
   * Densest free spot for one note: sample random centres plus a fine grid,
   * keep every one that clears its neighbours, and take the highest (then
   * leftmost). Pure random first-fit dropped notes wherever the first free
   * sample landed and fragmented the page, so it "filled up" with half of it
   * blank. The random samples keep the scatter slightly uneven; tilt does the rest.
   */
  function bestFreeSpot(minCx, maxCx, minCy, maxCy, rw, rh, occupied, gap, attempts, random) {
    if (maxCx < minCx || maxCy < minCy) return null;
    var best = null;
    var bestScore = Infinity;
    function consider(cx, cy) {
      if (collidesAny(boxFromCenter(cx, cy, rw, rh), occupied, gap)) return;
      var score = cy + 0.3 * cx;
      if (score < bestScore) {
        bestScore = score;
        best = { cx: cx, cy: cy };
      }
    }
    for (var t = 0; t < attempts; t++) {
      consider(randomIn(minCx, maxCx, random), randomIn(minCy, maxCy, random));
    }
    var cols = 14;
    var rows = 20;
    for (var row = 0; row <= rows; row++) {
      for (var col = 0; col <= cols; col++) {
        consider(
          minCx + ((maxCx - minCx) * col) / cols,
          minCy + ((maxCy - minCy) * row) / rows
        );
      }
    }
    return best;
  }

  function placeNotes(options) {
    var cw = options.containerWidth;
    var ch = options.containerHeight;
    var sizes = options.sizes || [];
    var gap = options.gap != null ? options.gap : gapFor(cw);
    var attempts = options.attempts != null ? options.attempts : NOTE_PLACE_ATTEMPTS;
    var edgePadFrac = options.edgePadFrac != null ? options.edgePadFrac : NOTE_EDGE_PAD_FRAC;
    var random = options.random || Math.random;
    var rotations = options.rotations;
    /*
     * strict: a note that cannot be placed WITHOUT overlapping is reported as
     * `fitted: false` and does not reserve any space, instead of being stamped
     * on top of its neighbours. The caller decides where it goes instead.
     * preferred[i] = { cx, cy } is tried first, so notes that already have a
     * valid spot stay put on a relayout rather than reshuffling every time.
     */
    var strict = !!options.strict;
    var preferred = options.preferred || null;
    var gridCols = strict ? 8 : 5;
    var gridRows = strict ? 10 : 6;

    if (cw <= 0 || ch <= 0 || sizes.length === 0) {
      return sizes.map(function (_, i) {
        return {
          xPercent: 10,
          yPercent: 10,
          rotation: rotations && rotations[i] != null ? rotations[i] : 0,
        };
      });
    }

    var padX = cw * edgePadFrac;
    var padY = ch * edgePadFrac;
    var placedBoxes = [];
    var results = [];

    for (var i = 0; i < sizes.length; i++) {
      var w = sizes[i].width;
      var h = sizes[i].height;
      var rotation =
        rotations && rotations[i] != null ? rotations[i] : random() * 14 - 7;
      var theta = degToRad(rotation);
      var rb = rotatedBoundingSize(w, h, theta);
      var rw = rb.width;
      var rh = rb.height;

      var minCx = padX + rw / 2;
      var maxCx = cw - padX - rw / 2;
      var minCy = padY + rh / 2;
      var maxCy = ch - padY - rh / 2;

      var chosenCx = Math.max(minCx, Math.min(maxCx, cw * 0.5));
      var chosenCy = Math.max(minCy, Math.min(maxCy, ch * 0.5));
      var found = false;
      var t, cx, cy, box, cols, rows, row, col, bestScore, score, p;

      if (preferred && preferred[i]) {
        cx = Math.max(minCx, Math.min(maxCx, preferred[i].cx));
        cy = Math.max(minCy, Math.min(maxCy, preferred[i].cy));
        box = boxFromCenter(cx, cy, rw, rh);
        if (!collidesAny(box, placedBoxes, gap)) {
          chosenCx = cx;
          chosenCy = cy;
          found = true;
        }
      }

      if (!found && strict) {
        p = bestFreeSpot(minCx, maxCx, minCy, maxCy, rw, rh, placedBoxes, gap, attempts, random);
        if (p) {
          chosenCx = p.cx;
          chosenCy = p.cy;
          found = true;
        }
      }

      for (t = 0; !found && !strict && t < attempts; t++) {
        cx = randomIn(minCx, maxCx, random);
        cy = randomIn(minCy, maxCy, random);
        box = boxFromCenter(cx, cy, rw, rh);
        if (!collidesAny(box, placedBoxes, gap)) {
          chosenCx = cx;
          chosenCy = cy;
          found = true;
          break;
        }
      }

      if (!found) {
        cols = gridCols;
        rows = gridRows;
        outer: for (row = 0; row < rows; row++) {
          for (col = 0; col < cols; col++) {
            cx = minCx + ((maxCx - minCx) * (col + 0.5)) / cols;
            cy = minCy + ((maxCy - minCy) * (row + 0.5)) / rows;
            box = boxFromCenter(cx, cy, rw, rh);
            if (!collidesAny(box, placedBoxes, gap)) {
              chosenCx = cx;
              chosenCy = cy;
              found = true;
              break outer;
            }
          }
        }
      }

      if (!found) {
        bestScore = Infinity;
        cols = gridCols;
        rows = gridRows;
        for (row = 0; row < rows; row++) {
          for (col = 0; col < cols; col++) {
            cx = minCx + ((maxCx - minCx) * (col + 0.5)) / cols;
            cy = minCy + ((maxCy - minCy) * (row + 0.5)) / rows;
            box = boxFromCenter(cx, cy, rw, rh);
            score = 0;
            for (p = 0; p < placedBoxes.length; p++) {
              if (aabbsOverlap(box, placedBoxes[p], gap)) score += 1;
            }
            if (score < bestScore) {
              bestScore = score;
              chosenCx = cx;
              chosenCy = cy;
            }
          }
        }
        found = bestScore === 0;
      }

      // In strict mode an unfitted note reserves nothing, so it cannot push the
      // notes after it out of space they would otherwise have had.
      if (!(strict && !found)) placedBoxes.push(boxFromCenter(chosenCx, chosenCy, rw, rh));
      results.push({
        xPercent: ((chosenCx - w / 2) / cw) * 100,
        yPercent: ((chosenCy - h / 2) / ch) * 100,
        rotation: rotation,
        fitted: found,
      });
    }

    return results;
  }

  function tryPlaceOneNote(options) {
    var cw = options.containerWidth;
    var ch = options.containerHeight;
    var size = options.size;
    var rotation = options.rotation;
    var occupied = options.occupied || [];
    var gap = options.gap != null ? options.gap : gapFor(cw);
    var attempts = options.attempts != null ? options.attempts : NOTE_PLACE_ATTEMPTS;
    var edgePadFrac = options.edgePadFrac != null ? options.edgePadFrac : NOTE_EDGE_PAD_FRAC;
    var random = options.random || Math.random;

    if (cw <= 0 || ch <= 0) return null;

    var w = size.width;
    var h = size.height;
    var theta = degToRad(rotation);
    var rb = rotatedBoundingSize(w, h, theta);
    var rw = rb.width;
    var rh = rb.height;
    var padX = cw * edgePadFrac;
    var padY = ch * edgePadFrac;
    var minCx = padX + rw / 2;
    var maxCx = cw - padX - rw / 2;
    var minCy = padY + rh / 2;
    var maxCy = ch - padY - rh / 2;

    if (maxCx < minCx || maxCy < minCy) return null;

    var spot = bestFreeSpot(minCx, maxCx, minCy, maxCy, rw, rh, occupied, gap, attempts, random);
    if (!spot) return null;
    return {
      placement: {
        xPercent: ((spot.cx - w / 2) / cw) * 100,
        yPercent: ((spot.cy - h / 2) / ch) * 100,
        rotation: rotation,
      },
      box: boxFromCenter(spot.cx, spot.cy, rw, rh),
    };
  }

  function boxesFromPlacements(sizes, placements, cw, ch) {
    var boxes = [];
    for (var i = 0; i < sizes.length; i++) {
      var s = sizes[i];
      var p = placements[i];
      if (!s || !p) continue;
      var left = (p.xPercent / 100) * cw;
      var top = (p.yPercent / 100) * ch;
      var cx = left + s.width / 2;
      var cy = top + s.height / 2;
      var rb = rotatedBoundingSize(s.width, s.height, degToRad(p.rotation));
      boxes.push(boxFromCenter(cx, cy, rb.width, rb.height));
    }
    return boxes;
  }

  /**
   * Observe a container; call onRelayout (debounced) when size changes meaningfully.
   * Returns a disconnect function.
   */
  function observeContainerResize(container, onRelayout, debounceMs) {
    if (!container || typeof ResizeObserver === 'undefined') {
      return function () {};
    }
    var ms = debounceMs != null ? debounceMs : NOTE_RESIZE_DEBOUNCE_MS;
    var timer = null;
    var lastW = container.clientWidth;
    var lastH = container.clientHeight;
    var ro = new ResizeObserver(function () {
      var w = container.clientWidth;
      var h = container.clientHeight;
      if (Math.abs(w - lastW) < 1 && Math.abs(h - lastH) < 1) return;
      lastW = w;
      lastH = h;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        onRelayout();
      }, ms);
    });
    ro.observe(container);
    return function () {
      if (timer) clearTimeout(timer);
      ro.disconnect();
    };
  }

  global.NotePlacement = {
    NOTE_GAP_PX: NOTE_GAP_PX,
    NOTE_PLACE_ATTEMPTS: NOTE_PLACE_ATTEMPTS,
    NOTE_RESIZE_DEBOUNCE_MS: NOTE_RESIZE_DEBOUNCE_MS,
    measureUnrotatedSize: measureUnrotatedSize,
    rotatedBoundingSize: rotatedBoundingSize,
    degToRad: degToRad,
    aabbsOverlap: aabbsOverlap,
    placeNotes: placeNotes,
    tryPlaceOneNote: tryPlaceOneNote,
    boxesFromPlacements: boxesFromPlacements,
    observeContainerResize: observeContainerResize,
  };
})(typeof window !== 'undefined' ? window : globalThis);
