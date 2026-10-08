export const CASE_STUDY_PASSWORD = 'Cherry';
export const CASE_STUDY_UNLOCK_EVENT = 'casestudy-unlocked';

export function emitCaseStudyUnlock() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CASE_STUDY_UNLOCK_EVENT));
}
