/**
 * The chain object's bookkeeping, without a browser: the hint a page takes at a refill is the one the page before it left last, read by index, and a row staged for a document is taken only by a transaction on that document.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { fragmentsPlugin, refilled } from 'prosemirror-fragview';
import { Chain } from '../src/chain.js';

const chain = () => new Chain({ originals: /** @type {any} */ ({ state: null }), table: { pageFor: () => ({}) }, document: /** @type {any} */ ({}) });

test('a page refilled in a ripple takes the hint the page before it left last, not the one it was built with', () => {
  const c = chain();
  const before = /** @type {any} */ ({ index: 2, key: 7, account: { next: { name: '', forced: true } } });
  const page = /** @type {any} */ ({ index: 3, key: 8, hint: { name: '' } });
  c.adopt(before);
  c.adopt(page);
  assert.deepEqual(c.hintFor(page), { name: '', forced: true });
  assert.deepEqual(c.hintFor(/** @type {any} */ ({ index: 0 })), {}, 'the first page has none');
  assert.equal(c.hintFor(/** @type {any} */ ({ index: 5 })), undefined, 'a page whose page before is not built keeps its own');
  c.released(before);
  assert.equal(c.hintFor(page), undefined);
  const last = /** @type {any} */ ({ index: 2, key: 9, account: { cls: null } });
  c.adopt(last);
  assert.deepEqual(c.hintFor(page), {}, 'a page that ran to the end left no hint');
});

test('rows staged for a document are taken once, and only by that document', () => {
  const c = chain();
  const a = /** @type {any} */ ({}), b = /** @type {any} */ ({});
  c.stage(a, 0, /** @type {any} */ ({ end: 3 }));
  c.stage(a, 1, /** @type {any} */ ({ end: 6 }));
  assert.deepEqual(c.takeRows(b), []);
  assert.deepEqual(c.takeRows(a).map(([k]) => k), [0, 1]);
  assert.deepEqual(c.takeRows(a), [], 'taken once');
  c.stage(a, 2, /** @type {any} */ ({ end: 9 }));
  c.stage(b, 0, /** @type {any} */ ({ end: 4 }));
  assert.deepEqual(c.takeRows(a), [], 'a newer document\'s rows replace an older one\'s');
  assert.deepEqual(c.takeRows(b).map(([k, r]) => [k, r.end]), [[0, 4]]);
});

test('a page whose fill threw leaves the chain incomplete for its document until the page fills', async () => {
  const schema = new Schema({ nodes: { doc: { content: 'text*' }, text: {} } });
  let state = EditorState.create({ schema, plugins: [fragmentsPlugin()] });
  state = state.apply(refilled(state.tr, 0, null));
  const c = chain();
  c.view = { state };
  const { doc } = state;
  const page = /** @type {any} */ ({ index: 2 });
  c.inflight = 1;
  c.failed(page, doc, new Error('no alt'));
  assert.deepEqual(await c.settled(doc), { complete: false, why: "page 3's fill threw: no alt" });
  c.inflight = 1;
  c.view = null;
  c.filled(page, doc, { to: null });
  c.view = { state };
  assert.deepEqual(await c.settled(doc), { complete: true, why: null });
});
