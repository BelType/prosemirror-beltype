/**
 * A table's header group on the pages the table continues on (*the header repeats*), on real `CiceroPage`s in a browser: every page that resumes the table shows a copy of the group, an edit inside the group reaches those pages though it lies in none of their ranges, and a group taller than a quarter of the page area is not repeated.
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
  read = await page.evaluate(async () => (await import('/test/header.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

/** The pages that resume the table: they hold body rows and not the table's own header group. */
const continuations = (/** @type {any[]} */ pages) => pages.filter((p) => p.rows > 0 && !p.own);

test('the chain settles and the table runs over several pages', () => {
  assert.deepEqual(read.answer, { complete: true, why: null });
  assert.ok(continuations(read.pages).length >= 2, `the table continues on ${continuations(read.pages).length} pages`);
});

test('every page that resumes the table repeats its header group, as a copy shut to the caret', () => {
  for (const p of continuations(read.pages)) {
    assert.equal(p.copy, 'No.TermNote');
    assert.ok(p.shut, 'the copy is inert and not editable');
  }
  assert.equal(read.pages.find((/** @type {any} */ p) => p.own).copy, null, 'the page that holds the header group repeats none');
});

test('an edit in the header group dirties the pages that repeat it, as a fresh fill shows them', () => {
  const pages = continuations(read.edited);
  assert.ok(pages.length >= 2);
  for (const p of pages) assert.equal(p.copy, 'No.WordNote');
  read.edited.forEach((/** @type {any} */ p, /** @type {number} */ i) => { if (p.rows > 0 && !p.own) assert.ok(read.refilled[i], `page ${i + 1} was filled again`); });
  assert.deepEqual(read.edited, read.editedFresh);
});

test('a header group taller than a quarter of the page area is not repeated', () => {
  assert.ok(continuations(read.tall).length >= 2);
  for (const p of continuations(read.tall)) assert.equal(p.copy, null);
});
