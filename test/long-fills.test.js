/**
 * The trial loop doubles its span without pouring while the bound stays where it was (critic2-long-paragraph-quadratic): a span whose end lands inside a box the bound never cuts inside is moved past it (`sealedEnd`), and a doubled span that still ends inside it named the same trial, which was rendered and measured again each time.
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
  read = await page.evaluate(async () => (await import('/test/long-fills.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test('the chain settles, the table on the first page', () => {
  assert.deepEqual(read.answer, { complete: true, why: null });
  assert.ok(read.pages.length > 1);
});

test('no cut renders the same trial twice', () => {
  for (const { page, ends } of read.cuts) assert.equal(new Set(ends).size, ends.length, `page ${page} rendered a trial to the same end twice: ${JSON.stringify(ends)}`);
});
