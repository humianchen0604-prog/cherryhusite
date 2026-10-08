'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'motion/react';
import { FileTextIcon, type FileTextIconHandle } from '@/components/icons/FileTextIcon';
import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';

type ExportDoc = 'bridge' | 'smart';

const DOCS: Record<ExportDoc, { src: string; title: string }> = {
  bridge: { src: '/assets/loom/pdfs/loom-context-bridge.pdf', title: 'Summarized Context Bridge' },
  smart: { src: '/assets/loom/pdfs/loom-smart-pdf.pdf', title: 'Smart PDF' },
};

/** One pill: the file-text icon animates on hover, and a cursor-following
 *  "Open Doc" label follows the pointer — same treatment as the Overview
 *  links, so the two rows read as one system. */
function ExportPill({ doc, onOpen }: { doc: ExportDoc; onOpen: (doc: ExportDoc) => void }) {
  const icon = useRef<FileTextIconHandle>(null);
  const reduced = useReducedMotion();
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  return (
    <>
      <button
        type="button"
        className="loom-pill loom-pill--plain-hover"
        onClick={() => onOpen(doc)}
        onMouseEnter={(e) => {
          pillHandlers.onMouseEnter(e);
          if (!reduced) icon.current?.startAnimation();
        }}
        onMouseMove={pillHandlers.onMouseMove}
        onMouseLeave={() => {
          pillHandlers.onMouseLeave();
          if (!reduced) icon.current?.stopAnimation();
        }}
      >
        <FileTextIcon ref={icon} size={14} className="loom-pill__icon" aria-hidden />
        {doc === 'bridge' ? 'View Summarized Context Bridge' : 'View Smart PDF'}
      </button>
      {mounted ? <CursorFollowPill pillRef={pillRef} on={on} label="Open Doc" /> : null}
    </>
  );
}

/**
 * The two export artifacts Solution 05 describes, made real: two pills that
 * open an in-page PDF preview instead of a new tab, so the reader stays on
 * the case study.
 */
export default function LoomExportViewer() {
  const [open, setOpen] = useState<ExportDoc | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  return (
    <>
      <div className="loom-links">
        <ExportPill doc="bridge" onOpen={setOpen} />
        <ExportPill doc="smart" onOpen={setOpen} />
      </div>

      {mounted && open
        ? createPortal(
            <div className="loom-pdf-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
              <div className="loom-pdf-panel" role="dialog" aria-modal="true" aria-label={DOCS[open].title}>
                <button
                  ref={closeRef}
                  type="button"
                  className="loom-pdf-panel__close"
                  onClick={close}
                  aria-label="Close preview"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                      d="M6 6L18 18M18 6L6 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <iframe
                  src={DOCS[open].src}
                  title={DOCS[open].title}
                  className="loom-pdf-panel__frame"
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
