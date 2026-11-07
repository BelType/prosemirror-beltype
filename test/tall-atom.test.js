/**
 * An atom taller than the page area, in a browser: a plate drawn as a figure holding an image 700 px tall, between paragraphs on a page whose area is 260 px, is sliced at the page's edge as a painted shell, as the engine slices a monolith (@see a-tall-atom-is-a-painted-shell). The engine's cut falls on the image inside the atom, where no position is, which the page used to take whole and clip.
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
  read = await page.evaluate(async () => (await import('/test/tall-atom.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

const plated = () => read.filled.filter((/** @type {any} */ p) => p.shows);

test('the chain settles and no page takes the atom whole', () => {
  assert.deepEqual(read.answer, { complete: true, why: null });
  assert.deepEqual(read.filled.map((/** @type {any} */ p) => p.kind).filter((k) => k === 'whole'), []);
  assert.deepEqual(read.warnings.filter((w) => /taken whole/.test(w)), []);
});

test('the image is shown across three pages, its lower part on the pages after the first, nothing of it lost', () => {
  const pages = plated();
  assert.equal(pages.length, 3);
  assert.equal(pages[0].shows[0], 0);
  assert.equal(pages.at(-1).shows[1], 700);
  for (let i = 1; i < pages.length; i++) assert.ok(Math.abs(pages[i].shows[0] - pages[i - 1].shows[1]) <= 1, `page ${i + 1} resumes the image where the page before left it: ${JSON.stringify(pages.map((p) => p.shows))}`);
});

test('each page the edge cuts says so as a painted shell, and the page after begins in it', () => {
  const [first, second, last] = plated();
  assert.equal(first.kind, 'E');
  assert.equal(first.ends.paint, 260);
  assert.equal(second.kind, 'E');
  assert.deepEqual(second.begins, first.ends);
  assert.equal(second.ends.paint, 520);
  assert.deepEqual(last.begins, second.ends);
  assert.equal(last.ends, null);
});

test('the pages agree with a fresh fill after invalidate()', () => {
  assert.deepEqual(read.fresh.answer, read.answer);
  assert.deepEqual(read.fresh.pages, read.filled);
});
