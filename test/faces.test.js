/**
 * A leaf node view on a real `CiceroPage`, in a browser: the page cuts where it cuts with no node view, and the host's element keeps its state across a refill and across a move to the next page. What the view does with a face is fragview's and tested there; this proves the chain through the engine.
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
  read = await page.evaluate(async () => (await import('/test/faces.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test('a faced leaf is cut where its drawing is cut', () => {
  assert.equal(read.first.chain, read.first.plain);
  assert.equal(read.first.made, read.first.leaves);
  assert.equal(read.first.shown, read.first.leaves);
});

test('an edit on the page keeps the element and what it holds', () => {
  assert.deepEqual(read.edited, { same: true, text: 'written', loads: 0, value: 'held', focused: true, page: read.first.page });
});

test('a cut that moves takes the element to the next page, with what it holds', () => {
  const { moved } = read;
  assert.ok(moved.page > moved.before, `from page ${moved.before} to page ${moved.page}`);
  assert.deepEqual({ same: moved.same, text: moved.text, loads: moved.loads, value: moved.value, focused: moved.focused }, { same: true, text: 'written', loads: 0, value: 'held', focused: true });
  assert.equal(moved.made, read.first.made, 'no face was made again');
  assert.equal(moved.destroyed, 0, 'no face was destroyed');
});

test('the settled chain equals a fresh chain of the same document', () => {
  assert.equal(read.settledChain, read.freshChain);
});

test('every face goes with the view, and nothing warned', () => {
  assert.equal(read.destroyed, read.first.leaves);
  assert.deepEqual(read.warnings, []);
});
