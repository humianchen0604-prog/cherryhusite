/**
 * Whether the footer guestbook is open over the page, for anything behind it
 * that should hold still meanwhile (e.g. the camera reel's looping photo wall).
 *
 * GuestbookBook is the only writer: it calls setGuestbookOpen() as the book
 * opens and as it starts home. Readers check isGuestbookOpen() and listen for
 * GUESTBOOK_OPEN_EVENT (detail: { open: boolean }).
 */
export const GUESTBOOK_OPEN_EVENT = 'guestbook:open-change';

export type GuestbookOpenDetail = { open: boolean };

let open = false;

export function isGuestbookOpen() {
  return open;
}

export function setGuestbookOpen(next: boolean) {
  if (next === open) return;
  open = next;
  window.dispatchEvent(
    new CustomEvent<GuestbookOpenDetail>(GUESTBOOK_OPEN_EVENT, { detail: { open: next } }),
  );
}
