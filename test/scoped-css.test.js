/**
 * The dev check on content CSS scoped under the editor's element, in a browser: the engine measures every page outside the view's element, so a rule scoped under it warns once, naming its selector, and a document-level rule or one on the host itself does not.
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
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 1 })).newPage();
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/test/scoped-css.html`);
  read = await page.evaluate(async () => (await import('/test/scoped-css.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

const wording = (/** @type {string} */ selector) => `prosemirror-beltype: the rule "${selector}" is scoped under the editor's element and does not reach the engine's measure, which lays out every page outside it; make it document-level, or the page the reader sees differs from the one that was cut.`;

test('a rule scoped under the host warns once, naming its selector, inside @layer and @media too', () => {
  assert.deepEqual(read.first, [wording('#host p'), wording('.editor table td')]);
});

test('twelve scoped rules give ten warnings and one count', () => {
  assert.equal(read.twelve.length, 11);
  assert.deepEqual(read.twelve.slice(0, 10), Array.from({ length: 10 }, (_, i) => wording(`#host .k${i}`)));
  assert.equal(read.twelve[10], "prosemirror-beltype: 2 more rules are scoped under the editor's element; the first 10 were named.");
});
