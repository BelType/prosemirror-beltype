/**
 * A zoom built on a CSS transform, in a browser: the pages under `scale(0.5)` and `scale(1.5)` dispatch no `moved` once the chain has settled, nor after a keystroke, since nothing in them changed size.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = new URL('..', import.meta.url).pathname;
let server, browser;
const read = {};

before(async () => {
  server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } });
  await server.listen();
  browser = await chromium.launch();
  for (const s of [0.5, 1.5]) {
    const page = await (await browser.newContext({ viewport: { width: 1000, height: 3000 }, deviceScaleFactor: 1 })).newPage();
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/test/faces.html`);
    read[s] = await page.evaluate(async (s) => (await import('/test/zoom.fixtures.js')).run(s), s);
  }
});
after(async () => {
  await browser?.close();
  await server?.close();
});

for (const s of [0.5, 1.5]) {
  test(`under scale(${s}) a settled chain's pages dispatch no moved, before and after a keystroke`, () => {
    assert.ok(read[s].pages > 1, `${read[s].pages} pages`);
    assert.deepEqual({ idle: read[s].idle, afterKey: read[s].afterKey }, { idle: 0, afterKey: 0 });
  });
}
