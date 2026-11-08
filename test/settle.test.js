/**
 * The chain's settle and its safety net on real `CiceroPage`s, in a browser: a restored Ledger's first fill starts cold and lands where a first fill lands, and a page whose rendering throws still answers, so `settled()` answers too; and a settle clears the engine's `cicero:` timing entries and no others.
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

test('a settle clears the engine\'s timing entries it has read, and leaves a measure of another name', () => {
  assert.deepEqual(read.cold.measures.filter((n) => n.startsWith('cicero:')), [], 'no cicero: measure is left after the settle');
  assert.deepEqual(read.cold.marks.filter((n) => n.startsWith('cicero:')), [], 'no cicero: mark is left after the settle');
  assert.ok(read.cold.measures.includes('host:before-mount'), 'a measure of another name survives');
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

test('a fill that rejects, its safety net included, stops the chain at its page unless the page answers it through handleFillRejected', () => {
  assert.ok(read.rejectedBare.raised.length > 0, 'unanswered, the rejection is raised');
  assert.ok(read.rejectedBare.dirty > 0, 'unanswered, the page stays dirty and the pages after it wait');
  assert.deepEqual(read.rejected.raised, [], 'answered, nothing is raised');
  assert.equal(read.rejected.dirty, 0, 'answered, every page is filled');
  assert.equal(read.rejected.kind, 'failed');
  assert.equal(read.rejected.last, null, 'the chain runs to the end');
  assert.equal(read.rejected.answer.complete, false);
  assert.match(read.rejected.answer.why, /page 2's fill threw: the engine fell over/);
});
