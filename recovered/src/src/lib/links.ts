/**
 * Where the résumé lives. One place, so the side rail, the footer sticker and
 * the mobile menu can never drift onto different files.
 */
export const RESUME_URL =
  'https://drive.google.com/file/d/1BzUZn1wwM83Yu4VaDUc61RlI0C4e0ILa/view?usp=sharing';

/** Opens the résumé in a new tab. `noopener` so Drive can't reach back into this page. */
export function openResume(): void {
  window.open(RESUME_URL, '_blank', 'noopener,noreferrer');
}
