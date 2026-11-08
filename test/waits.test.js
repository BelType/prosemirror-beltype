/**
 * The page's image and font waits race a timeout (Egildo's ruling of 2026-11-08), in a browser: an image or a font that does not arrive leaves the page filled within the wait, warned once and accounted provisional, and its arrival draws the page again and clears it; a page whose waits finish in time is cut as without the race.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = new URL('..', import.meta.url).pathname;
const WAIT = 300;
const FONT = readFileSync(new URL('../fixtures/fonts/sourcesans3/SourceSans3-Variable.woff2', import.meta.url));
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const GIF_URL = `data:image/gif;base64,${GIF.toString('base64')}`;
let server, browser, base;

before(async () => {
  server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } });
  await server.listen();
  base = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await server?.close();
});

/** A fresh page on the harness, whose `/never/` requests are held until `release()`. */
async function open() {
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 3000 }, deviceScaleFactor: 1 })).newPage();
  /** @type {import('playwright').Route[]} */
  const held = [];
  await page.route('**/never/**', (route) => { held.push(route); });
  await page.goto(`${base}/test/faces.html`);
  const call = (/** @type {string} */ name, /** @type {any} */ arg) => page.evaluate(async ([name, arg]) => (await import('/test/waits.fixtures.js'))[name](arg), [name, arg]);
  const release = async () => {
    for (const route of held.splice(0)) await route.fulfill({ status: 200, contentType: route.request().url().endsWith('.woff2') ? 'font/woff2' : 'image/gif', body: route.request().url().endsWith('.woff2') ? FONT : GIF });
  };
  return { page, call, release };
}

test('an image that does not arrive: the page fills within the wait, warns once naming images, is provisional, and is drawn again when it arrives', async () => {
  const { page, call, release } = await open();
  const read = await call('mount', { paras: 8, src: '/never/plate.gif', waitMs: WAIT });
  assert.ok(read.chain.length > 1, 'the document runs to several pages');
  assert.equal(read.chain.at(-1), null, 'every page fills');
  assert.ok(read.ms < WAIT * 2 + 3000, `the chain settled in ${Math.round(read.ms)} ms`);
  assert.deepEqual(read.provisional, read.chain.map((_, i) => i === 0), 'the page that holds the image, and only it, is provisional');
  assert.deepEqual(read.warnings, [`prosemirror-beltype: page 1 was measured before its images arrived (${WAIT} ms); it is provisional and is drawn again when they arrive`]);
  await release();
  const late = await call('redrawn');
  assert.deepEqual(late.provisional, late.chain.map(() => false), 'the image arrived: no page is provisional');
  assert.equal(late.warnings.length, 1, 'no second warning');
  await page.context().close();
});

test('a font that does not arrive: the page fills, warns once naming fonts, is provisional, and is drawn again when it arrives', async () => {
  const { page, call, release } = await open();
  const css = '@font-face { font-family: Never; src: url(/never/never.woff2) format("woff2"); } p { font-family: Never, sans-serif; }';
  const read = await call('mount', { paras: 1, src: GIF_URL, css, waitMs: WAIT });
  assert.deepEqual(read.chain, [null], 'one page, filled');
  assert.ok(read.ms < WAIT * 2 + 3000, `the chain settled in ${Math.round(read.ms)} ms`);
  assert.deepEqual(read.provisional, [true]);
  assert.deepEqual(read.warnings, [`prosemirror-beltype: page 1 was measured before its fonts arrived (${WAIT} ms); it is provisional and is drawn again when they arrive`]);
  await release();
  const late = await call('redrawn');
  assert.deepEqual(late.provisional, [false], 'the font arrived: the page is not provisional');
  assert.equal(late.warnings.length, 1, 'no second warning');
  await page.context().close();
});

test('a page whose images and fonts arrive in time: no warning, nothing provisional, and the chain the race leaves is the chain with no race', async () => {
  const { page, call } = await open();
  const css = '@font-face { font-family: Sans; src: url(/fixtures/fonts/sourcesans3/SourceSans3-Variable.woff2) format("woff2"); } p { font-family: Sans, sans-serif; }';
  const raced = await call('mount', { paras: 8, src: GIF_URL, css, waitMs: 4000 });
  const bare = await call('mount', { paras: 8, src: GIF_URL, waitMs: Infinity });
  assert.deepEqual(raced.warnings, []);
  assert.deepEqual(raced.provisional, raced.chain.map(() => false));
  assert.deepEqual(raced.chain, bare.chain);
  assert.ok(raced.chain.length > 1);
  await page.context().close();
});
