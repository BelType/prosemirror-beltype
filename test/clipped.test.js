/**
 * What a page's foot cuts off, as the host reads it, in a browser: a float that runs below a cut is lost on screen (the page does not carry it), and `settled()` names the page that loses it, on a page that begins in the flow and on one that begins in a shell.
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
  read = await page.evaluate(async () => (await import('/test/clipped.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test('a float that crosses a cut on a page that begins in the flow: settled() names the page and the pixels it loses', () => {
  assert.equal(read.flow.answer.complete, true);
  assert.ok(read.flow.accounts[0].clipped?.parallel > 0, 'page 1 says what it cuts off');
  assert.deepEqual(read.flow.answer.clipped, [{ page: 1, ...read.flow.accounts[0].clipped }]);
});

test('a float that starts on a page that begins in a shell and stands below its cut is asked, its parallel flow only, and named by settled()', () => {
  const page2 = read.shell.accounts[1];
  assert.equal(page2.begins, true, 'page 2 resumes the box the page edge cut');
  assert.ok(page2.clipped?.parallel > 0, 'page 2 says what its float loses');
  assert.equal(page2.clipped.flow, 0, 'a shell page\'s flow is not asked');
  assert.equal(read.shell.accounts[0].clipped, null, 'page 1 ends in the shell and has no float');
  assert.deepEqual(read.shell.answer.clipped, [{ page: 2, ...page2.clipped }]);
});
