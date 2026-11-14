/**
 * The page's name and its counters where it begins, on real `CiceroPage`s: the page side of `page-rules.test.js`. One document's page begins past a list whose last item holds a list, and another past a nested reset of an author's counter (the engine's `list-continuation` cases); a second document's pages resume inside a table cell named for another page.
 *
 * @packageDocumentation
 */

import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { FragmentedView } from 'prosemirror-fragview';
import { ciceroContainers, ledger } from '../src/index.js';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', attrs: { cls: { default: null } }, toDOM: (node) => ['p', node.attrs.cls ? { class: node.attrs.cls } : {}, 0] },
    list: { group: 'block', content: 'item+', toDOM: () => ['ol', 0] },
    item: { content: 'block+', toDOM: () => ['li', 0] },
    box: { group: 'block', content: 'block+', attrs: { cls: { default: null } }, toDOM: (node) => ['div', node.attrs.cls ? { class: node.attrs.cls } : {}, 0] },
    table: { group: 'block', content: 'row+', toDOM: () => ['table', ['tbody', 0]] },
    row: { content: 'cell+', toDOM: () => ['tr', 0] },
    cell: { content: 'inline*', toDOM: () => ['td', 0] },
    text: { group: 'inline' },
  },
});
const p = (/** @type {string} */ t, /** @type {string | null} */ cls = null) => schema.node('paragraph', { cls }, [schema.text(t)]);
const lines = (/** @type {number} */ n, /** @type {string} */ k) => Array.from({ length: n }, (_, i) => p(`line ${k}${i}`));
const item = (/** @type {any[]} */ ...kids) => schema.node('item', null, kids);
const list = (/** @type {any[]} */ ...items) => schema.node('list', null, items);
const box = (/** @type {string | null} */ cls, /** @type {any[]} */ ...kids) => schema.node('box', { cls }, kids);

// Thirteen lines a page. Page 2 begins at the last of seven lines past the list, page 4 at the last of eight past the nested reset.
const counters = schema.node('doc', null, [
  ...lines(2, 'a'), list(item(p('item a')), item(p('item o'), list(item(p('item a')), item(p('item b')), item(p('item c'))))),
  ...lines(7, 'b'), p('after', 'x'),
  p('line c0', 'second'), p('line c1'), box(null, p('one', 'i'), box('n', p('a', 'i'), p('b', 'i'), p('c', 'i'))),
  ...lines(8, 'd'), p('after', 'x'),
]);
const names = schema.node('doc', null, [
  ...lines(4, 'a'),
  schema.node('table', null, [schema.node('row', null, [schema.node('cell', null, [schema.text('quoin ink dash register lead '.repeat(120))])])]),
  p('after'),
]);

function mount(/** @type {any} */ doc) {
  const host = document.createElement('div');
  /** @type {HTMLElement} */ (document.getElementById('mount')).appendChild(host);
  const containers = /** @type {any} */ (ciceroContainers(document));
  const view = new FragmentedView(host, { state: EditorState.create({ doc, plugins: [ledger()] }), containers, words: { attribute: 'data-beltype' } });
  return { view, chain: containers.chain, host };
}
async function settled(/** @type {any} */ { view, chain }) {
  const late = (/** @type {Promise<any>} */ p) => Promise.race([p, new Promise((r) => setTimeout(() => r('no answer'), 10000))]);
  const answer = await late(chain.settled(view.state.doc));
  await late(chain.settling);
  for (let i = 0; i < 200 && (view.filling.size || view.entries.some((/** @type {any} */ e) => e.dirty)); i++) await new Promise((r) => setTimeout(r, 25));
  return answer;
}
/** Each page: its name, the name it left the page after, the counters its chrome is drawn from, and its text. */
const pages = (/** @type {any} */ view) => view.fragments.map((/** @type {any} */ f) => ({ name: f.container.conditions.name, next: f.container.account?.next?.name ?? null, counters: f.container.chrome?.counters ?? null, text: f.container.dom.textContent.replace(/\s+/g, ' ').trim() }));

export async function run() {
  document.head.insertAdjacentHTML('beforeend', '<style>@page narrow { margin: 20px 100px; } body { counter-reset: c; } p { margin: 0; } ol { margin: 0; padding-left: 40px; } .n { counter-reset: c; } .i { counter-increment: c; } .second { break-before: page; } table { border-spacing: 0; } td { page: narrow; padding: 0; }</style>');
  const out = /** @type {any} */ ({});
  const a = mount(counters);
  out.answer = await settled(a);
  out.counters = pages(a.view);
  // A character typed on page 1: the pages after it are clean and read their counters again off the new state (`Chain.rechrome`).
  const fills = a.view.fragments.map(() => 0);
  a.view.fragments.forEach((/** @type {any} */ f, /** @type {number} */ i) => { const fill = f.container.fill.bind(f.container); f.container.fill = (/** @type {any[]} */ ...args) => { fills[i]++; return fill(...args); }; });
  a.view.dispatch(a.view.state.tr.insertText('x', 3));
  await settled(a);
  out.edited = pages(a.view);
  out.refilled = fills;
  a.view.destroy();
  a.host.remove();
  const b = mount(names);
  out.namesAnswer = await settled(b);
  out.names = pages(b.view);
  b.view.destroy();
  b.host.remove();
  return out;
}
