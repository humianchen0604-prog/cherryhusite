/** Joins class names, dropping falsy values. No Tailwind here, so no merge/dedupe step is needed. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
