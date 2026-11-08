/**
 * A block node view with no content hole on a real `CiceroPage`, in a browser: the face follows the cut, and the cut never follows the face (the record *a block with no content hole is a face where it stands whole*). A table that fits keeps one face through a refill and a move; a table the page divides keeps `toDOM`'s drawing on every page; `break-inside: avoid` moves a straddling table whole; a tall leaf sliced as a painted shell has one face. In every case the chain is the one the same document has with no node view.
 *
 * @remarks
 * Fragview gives a block a node view from 0.1.2, which the dev pin names. To run this file against another fragview, name its checkout with `FRAGVIEW`, which `vite.config.js` reads, after `rm -rf node_modules/.vite`; against a fragview before 0.1.2 every case is refused at the prop.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = new URL('..', import.meta.url).pathname;
let server, browser, page;
const run = (/** @type {string} */ name, /** @type {any} */ arg) => page.evaluate(async ([name, arg]) => (await import('/test/block-faces.fixtures.js'))[name](arg), [name, arg]);

before(async () => {
  server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } });
  await server.listen();
  browser = await chromium.launch();
  page = await (await browser.newContext({ viewport: { width: 1000, height: 3000 }, deviceScaleFactor: 1 })).newPage();
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/test/block-faces.html`);
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test('a table that fits has its face, placed, and keeps the same element through a refill and a move to the next page whole', async () => {
  const read = await run('fits');
  const { first, edited, moved } = read;
  assert.deepEqual(first.positions, [first.pos], 'getPos answered the table\'s position in the constructor');
  assert.equal(first.placed, 'placed');
  assert.deepEqual(first.wrappers[first.page], [['placed', 'face']]);
  for (const r of [first, edited, moved]) assert.equal(r.chain, r.plain, 'the chain is the one with no node view');
  assert.equal(edited.page, first.page);
  assert.ok(moved.page > first.page, `the table moved from page ${first.page + 1} to page ${moved.page + 1}`);
  for (const r of [edited, moved]) assert.deepEqual({ same: r.same, value: r.value, focused: r.focused, placed: r.placed, made: r.made, destroyed: r.destroyed }, { same: true, value: 'held', focused: true, placed: 'placed', made: 1, destroyed: 0 });
  assert.deepEqual(moved.wrappers.flat(), [['placed', 'face']], 'one wrapper, the face\'s');
  assert.deepEqual(read.clipped, []);
  assert.deepEqual(read.warnings.filter((w) => /cuts off|taken whole|draws/.test(w)), []);
});

test('a table the cut divides has no face: toDOM\'s drawing in a wrapper on each page, the constructor never run, one warning, the chain unchanged', async () => {
  const read = await run('placed', { before: 6, rows: 6, avoid: false });
  assert.deepEqual(read.wrappers.filter((w) => w.length), [[['', 'table']], [['', 'table']]]);
  assert.equal(read.made, 0);
  assert.equal(read.chain, read.plain);
  assert.equal(read.warnings.length, 1, read.all.join('\n'));
  assert.match(read.warnings[0], /stands in more than one fragment/);
});

test('break-inside: avoid moves a straddling faced table whole to the next page, placed, the chain unchanged', async () => {
  const read = await run('placed', { before: 6, rows: 6, avoid: true });
  assert.deepEqual(read.wrappers.map((w) => w.length), [0, 1, ...Array(read.wrappers.length - 2).fill(0)]);
  assert.deepEqual(read.wrappers[1], [['placed', 'face']]);
  assert.equal(read.made, 1);
  assert.equal(read.chain, read.plain);
  assert.deepEqual(read.warnings, []);
});

test('a tall table under avoid is divided all the same, with no face and the chain unchanged', async () => {
  const read = await run('placed', { before: 1, rows: 16, avoid: true });
  const shown = read.wrappers.filter((w) => w.length);
  assert.ok(shown.length >= 2, JSON.stringify(read.wrappers));
  for (const w of shown) assert.deepEqual(w, [['', 'table']]);
  assert.equal(read.made, 0);
  assert.equal(read.chain, read.plain);
  assert.equal(read.warnings.length, 1, read.all.join('\n'));
});

test('a tall leaf sliced as a painted shell has one face, on its first page, and the pages after show the drawing', async () => {
  const read = await run('tallLeaf');
  assert.equal(read.chain, read.plain);
  assert.equal(read.made, 1);
  const shown = read.wrappers.map((w, i) => [i, w]).filter(([, w]) => w.length);
  assert.ok(shown.length >= 2, JSON.stringify(read.wrappers));
  assert.deepEqual(read.faces, [shown[0][0]]);
  assert.deepEqual(shown[0][1], [['placed', 'face']]);
  for (const [, w] of shown.slice(1)) assert.deepEqual(w, [['', 'figure']]);
});

test('a table moved back to the page before by a deletion above keeps its face element there, and the page it left holds no face', async () => {
  const read = await run('handOver');
  assert.equal(read.before.page, 1, 'the table starts on page 2');
  assert.deepEqual(read.before.wrappers[1], [['placed', 'face']]);
  assert.equal(read.after.page, 0, 'the table moved to page 1');
  assert.deepEqual({ same: read.after.same, placed: read.after.placed, made: read.after.made, destroyed: read.after.destroyed }, { same: true, placed: 'placed', made: 1, destroyed: 0 });
  assert.deepEqual(read.after.wrappers.flat(), [['placed', 'face']], JSON.stringify(read.after.wrappers));
  assert.equal(read.after.chain, read.plain);
});

test('the arrows step over a placed face: from the paragraph before to the paragraph after, and back', async () => {
  const at = await run('arrows');
  assert.deepEqual(at.placed.flat(), [['placed', 'face']]);
  assert.equal(at.head, at.pos - 1);
  const outside = (/** @type {any} */ s, /** @type {string} */ what) => assert.ok(s.node == null && (s.head < at.pos || s.head > at.end), `${what}: ${JSON.stringify(s)}, the table spans ${at.pos} to ${at.end}`);
  await page.keyboard.press('ArrowRight');
  const right = await run('selection');
  outside(right, 'ArrowRight');
  assert.equal(right.head, at.end + 1, 'ArrowRight lands at the start of the paragraph after');
  await page.keyboard.press('ArrowLeft');
  const left = await run('selection');
  outside(left, 'ArrowLeft');
  assert.equal(left.head, at.pos - 1, 'ArrowLeft lands at the end of the paragraph before');
  await page.keyboard.press('ArrowDown');
  const down = await run('selection');
  outside(down, 'ArrowDown');
  assert.ok(down.head > at.end, `ArrowDown lands in the paragraph after: ${down.head}`);
  await page.keyboard.press('ArrowUp');
  const up = await run('selection');
  outside(up, 'ArrowUp');
  assert.ok(up.head < at.pos, `ArrowUp lands in the paragraph before: ${up.head}`);
  assert.deepEqual(up.selections, [], 'setSelection was never asked');
  await run('unmount');
});

test('a divided table under the wrapper is pinned and laid out as the bare one, piece by piece, whose long words stand in different columns', async () => {
  const bare = await run('drift', { wrapper: false });
  const wrapped = await run('drift', { wrapper: true });
  assert.equal(wrapped.chain, bare.chain);
  assert.ok(bare.pieces.length >= 2, JSON.stringify(bare.pieces));
  assert.deepEqual(wrapped.wrappers.filter((w) => w.length), bare.pieces.map(() => [['', 'table']]));
  const shape = (/** @type {any[]} */ pieces) => pieces.map((p) => ({ page: p.page, rows: p.rows, cols: p.cols, style: p.style }));
  assert.deepEqual(shape(wrapped.pieces), shape(bare.pieces), `bare ${JSON.stringify(bare.pieces)}\nwrapped ${JSON.stringify(wrapped.pieces)}`);
  for (const p of wrapped.pieces) assert.match(p.style, /table-layout: fixed/, 'the piece is pinned to its trial\'s tracks');
});
