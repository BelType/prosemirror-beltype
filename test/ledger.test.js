/**
 * The Ledger as plugin state, without a browser: rows kept by the chain entry's key survive the view's mapping, a row whose entry the view dropped is dropped, the state round-trips through JSON, `pageOf` is an index lookup over the entries and the rows, and the account `settleReads` reads is the rows in the driver's shape.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { fragmentsPlugin, fragmentsKey, refilled, appended } from 'prosemirror-fragview';
import { ledger, ledgerKey, pageOf, accountOf, keyOf } from '../src/ledger.js';

const schema = new Schema({ nodes: { doc: { content: 'paragraph+' }, paragraph: { content: 'text*', toDOM: () => ['p', 0] }, text: {} } });
const doc = schema.node('doc', null, ['One two three', 'Four five six', 'Seven eight nine'].map((t) => schema.node('paragraph', null, schema.text(t))));

/** A row with what a test reads; the rest as a page would have it. @param {number} end @param {Partial<import('../src/ledger.js').Row>} [over] */
const row = (end, over = {}) => ({ name: '', parity: 'right', blank: false, counters: {}, strings: { chapter: { first: 'A', start: 'A', last: 'A', 'first-except': '' } }, running: {}, end, block: 0, contentW: 400, contentH: 600, next: { name: '' }, key: keyOf({ index: 0, cls: 'B', next: { name: '' } }), ...over });

/** A chain of three entries, filled and recorded as the view records them, each fill's row written by meta. */
function filledState() {
  let state = EditorState.create({ doc, plugins: [ledger(), fragmentsPlugin()] });
  const apply = (/** @type {any} */ tr) => { state = state.apply(tr); };
  apply(appended(refilled(state.tr, 0, 16), 16));
  apply(state.tr.setMeta(ledgerKey, { set: [[0, row(3)]] }));
  apply(appended(refilled(state.tr, 1, 31), 31));
  apply(state.tr.setMeta(ledgerKey, { set: [[1, row(6, { parity: 'left' })]] }));
  apply(refilled(state.tr, 2, null));
  apply(state.tr.setMeta(ledgerKey, { set: [[2, row(null)]] }));
  return state;
}

test('rows are kept by the entry\'s key and survive the view\'s mapping', () => {
  let state = filledState();
  assert.deepEqual(fragmentsKey.getState(state)?.entries.map((e) => [e.key, e.from, e.to, e.dirty]), [[0, 0, 16, false], [1, 16, 31, false], [2, 31, null, false]]);
  // Text typed in the first paragraph: the entries map, the first is dirty, every row stays under its key.
  state = state.apply(state.tr.insertText('X', 2));
  assert.deepEqual(fragmentsKey.getState(state)?.entries.map((e) => [e.key, e.from, e.to, e.dirty]), [[0, 0, 17, true], [1, 17, 32, false], [2, 32, null, false]]);
  assert.deepEqual([...(ledgerKey.getState(state)?.rows.keys() ?? [])], [0, 1, 2]);
  assert.equal(ledgerKey.getState(state)?.rows.get(1)?.end, 6);
});

test('a row whose entry the view dropped is dropped by the transaction that drops it', () => {
  let state = filledState();
  // The first page now runs to the end: the view drops the entries after it, and the Ledger's appended transaction drops their rows.
  state = state.apply(refilled(state.tr, 0, null));
  assert.deepEqual(fragmentsKey.getState(state)?.entries.map((e) => e.key), [0]);
  assert.deepEqual([...(ledgerKey.getState(state)?.rows.keys() ?? [])], [0]);
});

test('the state round-trips through JSON, the warm tables with it', () => {
  let state = filledState();
  const delivered = new Map([['[href="#x"]', new Map([['--beltype-read-counter-attr-href-page-decimal', '"3"']])]]);
  const facts = [{ counterReset: 'page 1 pages 3', props: {} }];
  state = state.apply(state.tr.setMeta(ledgerKey, { settled: { delivered, facts, resumed: null, why: 'the chain\'s first fill', reads: { references: 1, pageSites: 0, runs: 1, unsettled: [] } } }));
  const plugins = { ledger: /** @type {any} */ (ledgerKey.get(state)) };
  const json = JSON.parse(JSON.stringify(state.toJSON(plugins)));
  const back = EditorState.fromJSON({ schema, plugins: state.plugins }, json, plugins);
  const a = /** @type {any} */ (ledgerKey.getState(state)), b = /** @type {any} */ (ledgerKey.getState(back));
  assert.deepEqual([...b.rows], [...a.rows]);
  assert.deepEqual(b.delivered, delivered);
  assert.deepEqual(b.facts, facts);
  assert.equal(b.why, 'the chain\'s first fill');
  assert.equal(b.reads.runs, 1);
});

test('pageOf is an index lookup over the entries and the rows, a cut belonging to the page after it', () => {
  let state = filledState();
  assert.equal(pageOf(state, 0), 1);
  assert.equal(pageOf(state, 15), 1);
  assert.equal(pageOf(state, 16), 2, 'a cut belongs to the page after it');
  assert.equal(pageOf(state, 17), 2, 'and so does the position that opens the node the cut stands before');
  assert.equal(pageOf(state, 40), 3);
  state = state.apply(state.tr.insertText('X', 2));
  assert.equal(pageOf(state, 2), null, 'a page a step dirtied is not known yet');
  assert.equal(pageOf(state, 20), 2);
});

test('the account is the rows in the driver\'s shape, numbered in the chain\'s order', () => {
  const rows = [row(3, { block: 0 }), row(6, { block: 1, next: { name: '', forced: true } }), row(null)];
  const account = accountOf(rows);
  assert.deepEqual(account.map((e) => [e.pos, e.cut.path[0], e.closes.pageNumber, e.trace.forced]), [[3, 0, 1, false], [6, 1, 2, true], [null, 0, 3, false]]);
  assert.equal(account[0].closes.contentW, 400);
  assert.deepEqual(account[0].closes.strings, rows[0].strings);
});

test('the key holds what a cut reads besides the address, and parity only where it can change a cut', () => {
  assert.deepEqual(keyOf({ index: 0, cls: 'B', next: { name: '' } }), { cls: 'B', forced: false, owes: null, parity: null, carried: null });
  assert.deepEqual(keyOf({ index: 2, cls: 'A', forced: true, next: { name: 'chapter', forced: true, blank: true } }), { cls: 'A', forced: true, owes: 'right', parity: 'right', carried: null }, 'an owed side keeps the parity');
  assert.equal(keyOf({ index: 1, cls: 'B', next: { name: '' }, sided: true }).parity, 'left', 'a geometry that differs by side keeps it');
  const shell = { pos: 40, remaining: 12, paint: 30 };
  assert.deepEqual(keyOf({ index: 1, cls: 'E', next: { name: '', at: 40, shell } }).carried, { shell, row: null });
});

test('the Ledger follows the chain when the view is given a new factory', () => {
  const chainOf = () => { const calls = []; return { calls, attach() { calls.push('attach'); }, detach() { calls.push('detach'); }, update() { calls.push('update'); }, takeRows: () => [] }; };
  const first = chainOf(), second = chainOf();
  let current = first;
  const plugin = ledger();
  const view = { someProp: (name) => (name === 'containers' ? { chain: current } : undefined) };
  const seat = plugin.spec.view(view);
  seat.update(view);
  current = second;
  seat.update(view);
  assert.deepEqual(first.calls, ['attach', 'update', 'detach']);
  assert.deepEqual(second.calls, ['attach', 'update']);
  seat.destroy();
  assert.deepEqual(second.calls, ['attach', 'update', 'detach']);
});
