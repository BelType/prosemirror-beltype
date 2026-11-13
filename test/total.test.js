/**
 * The page total through a chain that grows, on real `CiceroPage`s in a browser: while the last page is cut again and a new one is filled the total is not known, and the pages the edit left alone keep the total they show, then draw their margins once when the chain completes, and only those whose margin boxes read `counter(pages)`.
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
  read = await page.evaluate(async () => (await import('/test/total.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test('the chain grows by a page, and one page of it is the named one', () => {
  assert.deepEqual(read.answer, { complete: true, why: null });
  assert.equal(read.after, read.before + 1);
  assert.equal(read.names.filter((/** @type {string} */ n) => n === 'plain').length, 1);
});

test('a page the edit left alone is never given a blank total, and draws its margins once', () => {
  const clean = read.log.filter((/** @type {any} */ p, /** @type {number} */ i) => p.fills === 0 && read.names[i] !== 'plain');
  assert.ok(clean.length >= 2, `${clean.length} pages left alone`);
  for (const p of clean) {
    assert.deepEqual(p.totals, [read.after], 'its host is given the new total, once, and never a blank one');
    assert.equal(p.bands, 1, 'its margins are laid out once');
  }
});

test('a page whose margin boxes do not read the total keeps its margins as they are', () => {
  const plain = read.log[read.names.indexOf('plain')];
  assert.equal(plain.fills, 0);
  assert.equal(plain.bands, 0, 'its margins are not laid out again');
  assert.deepEqual(plain.totals, [read.after], 'its host still carries the total, for a flow site that reads it');
});
