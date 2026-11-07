/**
 * Zoom, in a browser. A zoom built on a CSS transform: the pages under `scale(0.5)` and `scale(1.5)` dispatch no `moved` once the chain has settled, nor after a keystroke, since nothing in them changed size. A zoom that changes the device pixel ratio, as the browser's own does: the chain is cut again once, and every page says the ratio it was cut at, since print runs at 1.
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
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 3000 }, deviceScaleFactor: 1 })).newPage();
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/test/faces.html`);
  const cdp = await page.context().newCDPSession(page);
  // The viewport narrows with each ratio, as a browser zoom's does: measured 2026-11-07, Chromium's emulation fires no `resolution` change for a ratio alone.
  const ratio = (deviceScaleFactor) => cdp.send('Emulation.setDeviceMetricsOverride', { width: Math.round(1000 / deviceScaleFactor), height: 3000, deviceScaleFactor, mobile: false });
  read.at1 = await page.evaluate(async () => (await import('/test/zoom.fixtures.js')).mountForResolution());
  // Two changes inside the debounce, as a browser zoom steps through them: one recut.
  await ratio(1.5);
  await ratio(2);
  read.at2 = await page.evaluate(async () => (await import('/test/zoom.fixtures.js')).resolutionChanged());
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

test('at a device pixel ratio of 1 a page says nothing of it', () => {
  assert.equal(read.at1.dpr, 1);
  assert.ok(read.at1.accounts.length > 1);
  assert.deepEqual(read.at1.accounts.filter((d) => d != null), []);
});

test('a change of the device pixel ratio recuts the chain once, and every page says the ratio it was cut at, with one warning', () => {
  assert.equal(read.at2.dpr, 2);
  assert.equal(read.at2.invalidated, 1);
  assert.deepEqual([...new Set(read.at2.accounts)], [2]);
  assert.equal(read.at2.warnings, 1);
});

for (const s of [0.5, 1.5]) {
  test(`under scale(${s}) a settled chain's pages dispatch no moved, before and after a keystroke`, () => {
    assert.ok(read[s].pages > 1, `${read[s].pages} pages`);
    assert.deepEqual({ idle: read[s].idle, afterKey: read[s].afterKey }, { idle: 0, afterKey: 0 });
  });
}
