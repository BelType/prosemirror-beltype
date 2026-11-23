/**
 * A table whose drawing writes a `<colgroup>`, in a browser: wherever the page's edge falls in it, every page moves the chain on and none is taken whole.
 *
 * @remarks
 * Found in the ADM2 editor on 2026-11-23: a delibera whose table Tiptap draws with a `<colgroup>` of five `<col>`s filled six pages where the CLI round fills four, two of them empty, with `a C verdict mapped to no position` on the console. Chromium gives a `<col>` a box as tall as its table, and the engine's Stonehand offered a break between two of them at the page's edge, which moves nothing. The engine's own run refuses the same document (`the walk failed to advance` at the last `<col>`): `fixtures/colgroup`.
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
  read = await page.evaluate(async () => (await import('/test/colgroup.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test('wherever the page edge falls in a table with a colgroup, every page moves the chain on', () => {
  for (const { lines, answer, pages, warnings } of read) {
    const where = `${lines} lines before the table: ${JSON.stringify(pages)} ${JSON.stringify(warnings)}`;
    assert.deepEqual(answer, { complete: true, why: null }, where);
    assert.deepEqual(pages.filter((/** @type {any} */ p) => p.kind === 'whole'), [], where);
    assert.deepEqual(pages.filter((/** @type {any} */ p) => p.to != null && p.to <= p.from && p.kind !== 'blank'), [], where);
    assert.deepEqual(warnings.filter((w) => /cannot be cut|decided no cut/.test(w)), [], where);
  }
});
