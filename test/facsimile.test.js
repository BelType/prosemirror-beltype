/**
 * A PDF embed whose fallback image has no `alt` (Egildo's ruling of 2026-11-08), in a browser: under a Cicero whose facsimile `install` takes `missingAlt: 'warn'`, every page fills, the embed is warned of by name, and its copy carries no `aria-label`, so Caster refuses it at print. Skipped under a Cicero without the option, which refuses at intake.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = new URL('..', import.meta.url).pathname;
const facsimile = readFileSync(fileURLToPath(import.meta.resolve('@beltype/cicero/facsimile')), 'utf8');
const knows = facsimile.includes('missingAlt');
let server, browser, read;

before(async () => {
  if (!knows) return;
  server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } });
  await server.listen();
  browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 3000 }, deviceScaleFactor: 1 })).newPage();
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/test/faces.html`);
  read = await page.evaluate(async () => (await import('/test/facsimile.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test('an embed with no fallback alt: every page fills, one warning names it, and its copy carries no aria-label', { skip: !knows && 'the installed Cicero has no missingAlt option' }, () => {
  assert.ok(read.chain.length > 1, 'the document runs to several pages');
  assert.equal(read.chain.at(-1), null, 'every page fills');
  assert.ok(!read.kinds.includes('failed'), `no page failed: ${read.kinds}`);
  assert.deepEqual(read.errors, []);
  assert.ok(read.copies.length >= 1, 'the embed is presented');
  for (const copy of read.copies) assert.deepEqual([copy.label, copy.role], [null, null]);
  const named = read.warnings.filter((w) => w.includes('/fixtures/facsimile/portrait.pdf#page=1') && w.includes('no fallback'));
  assert.equal(named.length, 1, `one warning names the embed: ${JSON.stringify(read.warnings)}`);
});
