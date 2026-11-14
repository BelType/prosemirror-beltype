/**
 * The rules a page is named and its counters closed by where it begins (Cicero 0.1.12's, on the engine's face since 0.1.13), on real `CiceroPage`s in a browser: a counter scope that ended before a page is closed on it (`depthOfCut`), on a fill and where a clean page's chrome is read again, and a place inside a box the `page` property does not apply to takes the box's parent's name (`usedPageName`).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = new URL('..', import.meta.url).pathname;
let server, browser, read;

before(async () => {
  server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } });
  await server.listen();
  browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 3000 }, deviceScaleFactor: 1 })).newPage();
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/test/faces.html`);
  read = await page.evaluate(async () => (await import('/test/page-rules.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test('the page past a list whose last item holds a list reads the outer list\'s count', () => {
  assert.deepEqual(read.answer, { complete: true, why: null });
  assert.equal(read.counters.length, 4);
  assert.match(read.counters[1].text, /^line b6after$/);
  assert.deepEqual(read.counters[1].counters['list-item'], [2]);
});

test('the page past a nested reset that ended with its parent reads the outer instance', () => {
  assert.match(read.counters[3].text, /^line d7after$/);
  assert.deepEqual(read.counters[3].counters.c, [1]);
});

test('a clean page reads its counters again at the depth its last fill kept', () => {
  assert.deepEqual(read.refilled.slice(1), [0, 0, 0], 'the pages after the edit were not filled again');
  assert.deepEqual(read.edited[1].counters['list-item'], [2]);
  assert.deepEqual(read.edited[3].counters.c, [1]);
});

test('a cut inside a table cell named for another page names the next page by the cell\'s parent', () => {
  assert.equal(read.namesAnswer.complete, true);
  assert.ok(read.names.length >= 3, `the cell runs over ${read.names.length} pages`);
  for (const p of read.names) assert.equal(p.name, '');
  assert.deepEqual(read.names.slice(0, -1).map((/** @type {any} */ p) => p.next), read.names.slice(0, -1).map(() => ''));
});
