'use client';

import { toast } from 'sonner';
import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';

export const EMAIL = 'bycherr1hu@gmail.com';
const TOAST_ID = 'email-copied';
const TOAST_MS = 1200;
const PILL_LABEL = 'Copy email';

function replayToastEnter() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.querySelector('[data-sonner-toast]:not([data-removed="true"])') as HTMLElement | null;
  if (!el) return;
  el.setAttribute('data-replay', 'true');
  void el.offsetWidth;
  el.removeAttribute('data-replay');
}

function CopyIcon() {
  return (
    <svg className="site-toast__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 5.75C7 4.23122 8.23122 3 9.75 3H18.25C19.7688 3 21 4.23122 21 5.75V14.26C21 15.7788 19.7688 17.01 18.25 17.01H17V18.25C17 19.7688 15.7688 21 14.25 21H5.75C4.23122 21 3 19.7688 3 18.25V9.75C3 8.23122 4.23122 7 5.75 7H7V5.75ZM17 15.51V9.75C17 8.23122 15.7688 7 14.25 7H8.5V5.75C8.5 5.05964 9.05964 4.5 9.75 4.5H18.25C18.9404 4.5 19.5 5.05964 19.5 5.75V14.26C19.5 14.9504 18.9404 15.51 18.25 15.51H17Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function CopyableEmail() {
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  function handleCopy() {
    navigator.clipboard.writeText(EMAIL).then(() => {
      const alreadyOpen = document.querySelector('[data-sonner-toast]:not([data-removed="true"])');
      toast('Email copied successfully!', {
        id: TOAST_ID,
        icon: <CopyIcon />,
        duration: TOAST_MS,
      });
      if (alreadyOpen) replayToastEnter();
    }).catch(() => {});
  }

  return (
    <>
      <button
        type="button"
        className="reach-out__email"
        onClick={handleCopy}
        {...pillHandlers}
      >
        {EMAIL}
      </button>
      {mounted ? <CursorFollowPill pillRef={pillRef} on={on} label={PILL_LABEL} /> : null}
    </>
  );
}

