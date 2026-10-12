// Swaps the build-id comment Next.js puts after the doctype of every
// prerendered page for a note to whoever opens the inspector. The comment is
// only read back in `output: 'export'` mode, which this site doesn't use.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const NOTE = 'Wow you inspected my site! I love potato, potato corner I love you, potato potato potato';
const ROOT = '.next/server/app';
const BUILD_ID_COMMENT = /^<!DOCTYPE html><!--[^>]*?-->/i;

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

let count = 0;
for await (const file of htmlFiles(ROOT)) {
  const html = await readFile(file, 'utf8');
  if (!BUILD_ID_COMMENT.test(html)) continue;
  await writeFile(file, html.replace(BUILD_ID_COMMENT, `<!DOCTYPE html><!--${NOTE}-->`));
  count += 1;
}
console.log(`inspect-note: updated ${count} page(s)`);
