/**
 * A page that shows positions outside its range, on real `CiceroPage`s in a browser: the page after a cut through a row shows the rest of the first column, whose positions lie inside the page before. A mark there and a same-length replacement there reach the page that shows them, and the caret there is that page's.
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
  read = await page.evaluate(async () => (await import('/test/shows.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test('the fixture cuts through the row so a later page shows the first column\'s rest', () => {
  assert.ok(read.found, `no row cut over ${read.pages} pages`);
});

test('a caret in a row item\'s rest maps to the page that shows it', () => {
  assert.equal(read.caretIndex, read.found.shown);
});

test('a mark on a row item\'s rest reaches the page that shows it, as a fresh fill shows it', () => {
  assert.ok(read.marked[read.found.shown].strong.length > 0, 'the page that shows the rest shows it marked');
  assert.deepEqual(read.marked, read.markedFresh);
});

test('a same-length replacement in a row item\'s rest reaches the page that shows it, as a fresh fill shows it', () => {
  assert.match(read.replacedFresh[read.found.shown].text, /XYZ/);
  assert.deepEqual(read.replaced, read.replacedFresh);
});
