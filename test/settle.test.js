/**
 * The chain's settle and its safety net on real `CiceroPage`s, in a browser: a restored Ledger's first fill starts cold and lands where a first fill lands, and a page whose rendering throws still answers, so `settled()` answers too.
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
  read = await page.evaluate(async () => (await import('/test/settle.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test('a first fill settles complete and leaves its tables in the Ledger', () => {
  assert.deepEqual(read.cold.answer, { complete: true, why: null });
  assert.notEqual(read.cold.delivered, '[]');
});

test('a restored Ledger\'s first fill passes no warm table, and lands where a first fill lands', () => {
  assert.deepEqual(read.restored.answer, { complete: true, why: null });
  assert.equal(read.restored.warmed, false, 'the restored page number was delivered before the first layout');
  assert.equal(read.restored.delivered, read.cold.delivered);
});

test('a page whose rendering throws still answers: the chain stands incomplete, the pages after it are reached, and the Ledger keeps its tables', () => {
  assert.notEqual(read.thrown.answer, 'no answer', 'settled() never answered');
  assert.equal(read.thrown.answer.complete, false);
  assert.match(read.thrown.answer.why, /page 2's fill threw: toDOM threw/);
  assert.equal(read.thrown.last, null);
  assert.equal(read.thrown.ledgerKept, true);
});
