'use client';

import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';

const VAULT_HREF = 'https://cherry-vault.vercel.app/index.html';

/** Vault preview — same cursor-follow pill as the project cards. */
export default function VaultLink({ children }: { children: React.ReactNode }) {
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  return (
    <>
      <a
        className="framer-1q5icqq framer-1dt80g9"
        href={VAULT_HREF}
        target="_blank"
        rel="noopener noreferrer"
        {...pillHandlers}
      >
        {children}
      </a>
      {mounted ? (
        <CursorFollowPill pillRef={pillRef} on={on} label="Open vault" />
      ) : null}
    </>
  );
}
