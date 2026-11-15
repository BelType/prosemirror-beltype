/**
 * A table's footer group at the foot of every piece of the table but the last (*the footer repeats*), on real `CiceroPage`s in a browser: every page the table is cut on shows a copy of the group after its rows, an edit inside the group reaches those pages though it lies past their ranges, an edit in a later row leaves them alone, and a group taller than a quarter of the page area is not repeated.
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
  read = await page.evaluate(async () => (await import('/test/footer.fixtures.js')).run());
});
after(async () => {
  await browser?.close();
  await server?.close();
});

/** The pieces of the table that are not its last: they hold body rows and not the table's own footer group. */
const cut = (/** @type {any[]} */ pages) => pages.filter((p) => p.rows > 0 && !p.own);

test('the chain settles and the table runs over several pages', () => {
  assert.deepEqual(read.answer, { complete: true, why: null });
  assert.ok(cut(read.pages).length >= 2, `the table is cut on ${cut(read.pages).length} pages`);
});

test('every piece but the last shows the footer group after its rows, as a copy shut to the caret', () => {
  for (const p of cut(read.pages)) {
    assert.equal(p.copy, 'Footcontinuesoverleaf');
    assert.ok(p.shut, 'the copy is inert and not editable');
    assert.ok(p.last, 'the copy stands last in its table');
  }
  assert.equal(read.pages.find((/** @type {any} */ p) => p.own).copy, null, 'the page that holds the footer group shows no copy');
});

test('an edit in the footer group dirties the pages that copy it, as a fresh fill shows them', () => {
  const pages = cut(read.edited);
  assert.ok(pages.length >= 2);
  for (const p of pages) assert.equal(p.copy, 'Footgoes onoverleaf');
  read.edited.forEach((/** @type {any} */ p, /** @type {number} */ i) => { if (p.rows > 0 && !p.own) assert.ok(read.refilled[i], `page ${i + 1} was filled again`); });
  assert.deepEqual(read.edited, read.editedFresh);
});

// Owed: an edit anywhere inside a table fills every page of the table again, since a page's reach runs to the table's end (docs/plan.md, the long table's last-page keystroke); the footer copies add nothing to it, measured 2026-11-15 with `headsMoved` blind to them.
test('an edit in a row on the last page leaves the pages before it as they were', { todo: 'a page reaches to the end of the table it cuts' }, () => {
  assert.ok(read.keptAfterRowEdit.slice(0, -1).every(Boolean), JSON.stringify(read.keptAfterRowEdit));
});

test('a footer group taller than a quarter of the page area is not repeated', () => {
  assert.ok(cut(read.tall).length >= 2);
  for (const p of cut(read.tall)) assert.equal(p.copy, null);
});
