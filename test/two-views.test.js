/**
 * Two views of two documents in one page (`architecture-project-global-singletons`): each factory keeps its own hidden holder and its own reads, so each view's pages agree with its own cold fill.
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
  read = await page.evaluate(async () => (await import('/test/two-views.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test('the two documents differ alone, so the case can tell them apart', () => {
  assert.notEqual(read.cold.a.pages, read.cold.b.pages);
  assert.ok(read.cold.a.read && read.cold.b.read, 'each reads a page number alone');
  assert.notEqual(read.cold.a.read, read.cold.b.read);
});

test('each view of two in one page agrees with its own cold fill', () => {
  for (const which of ['a', 'b']) {
    assert.deepEqual(read.together[which].answer, { complete: true, why: null }, `${which} settled`);
    assert.equal(read.together[which].pages, read.cold[which].pages, `${which}'s page count`);
    assert.deepEqual(read.together[which].text, read.cold[which].text, `${which}'s pages' text`);
    assert.equal(read.together[which].read, read.cold[which].read, `${which}'s reference`);
  }
});

test('each factory has a hidden holder of its own', () => {
  assert.equal(read.holders.length, 2);
  assert.equal(new Set(read.holders).size, 2);
});
