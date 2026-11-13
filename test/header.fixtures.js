/**
 * A table's header group on the pages the table continues on, on real `CiceroPage`s: the page side of `header.test.js`. A table of a header row and forty body rows runs over several small pages; a second document's header is taller than a quarter of the page area.
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
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    table: { group: 'block', content: 'thead tbody', toDOM: () => ['table', 0] },
    thead: { content: 'row+', toDOM: () => ['thead', 0] },
    tbody: { content: 'row+', toDOM: () => ['tbody', 0] },
    row: { content: 'cell+', toDOM: () => ['tr', 0] },
    cell: { content: 'inline*', toDOM: () => ['td', 0] },
    text: { group: 'inline' },
  },
});
const row = (/** @type {string[]} */ cells) => schema.node('row', null, cells.map((t) => schema.node('cell', null, [schema.text(t)])));
const docOf = (/** @type {string[][]} */ head) => schema.node('doc', null, [
  schema.node('paragraph', null, [schema.text('Before the table.')]),
  schema.node('table', null, [
    schema.node('thead', null, head.map(row)),
    schema.node('tbody', null, Array.from({ length: 40 }, (_, i) => row([`r${i + 1}`, 'quoin ink dash', 'register lead']))),
  ]),
  schema.node('paragraph', null, [schema.text('After the table.')]),
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
/** Each page: its text, the text of the header copy it repeats (null where it repeats none), whether the copy is shut to the caret, and whether it holds the table's own header group. */
const pages = (/** @type {any} */ view) => view.fragments.map((/** @type {any} */ f) => {
  const dom = f.container.dom;
  const copy = dom.querySelector('thead[data-beltype~="artifact"]');
  return { text: dom.textContent.replace(/\s+/g, ' ').trim(), copy: copy ? copy.textContent : null, shut: !!copy && copy.hasAttribute('inert') && copy.getAttribute('contenteditable') === 'false', own: !!dom.querySelector('thead:not([data-beltype~="artifact"]):not([data-beltype~="away"])'), rows: dom.querySelectorAll('tbody > tr:not([data-beltype~="away"])').length };
});
async function fresh(/** @type {any} */ doc) {
  const f = mount(doc);
  await settled(f);
  const read = pages(f.view);
  f.view.destroy();
  f.host.remove();
  return read;
}

export async function run() {
  document.head.insertAdjacentHTML('beforeend', '<style>table { border-collapse: collapse; width: 100%; } td { border: 1px solid #888; padding: 0 4px; }</style>');
  const out = /** @type {any} */ ({});
  const m = mount(docOf([['No.', 'Term', 'Note']]));
  out.answer = await settled(m);
  out.pages = pages(m.view);

  // The same length, in the header's second cell: the first page's cut does not move, so nothing ripples to the pages after it.
  let at = -1;
  m.view.state.doc.descendants((/** @type {any} */ node, /** @type {number} */ pos) => { if (node.isText && node.text === 'Term') at = pos; });
  const before = m.view.fragments.map((/** @type {any} */ f) => f.container.account);
  m.view.dispatch(m.view.state.tr.insertText('Word', at, at + 4));
  await settled(m);
  out.edited = pages(m.view);
  out.refilled = m.view.fragments.map((/** @type {any} */ f, /** @type {number} */ i) => f.container.account !== before[i]);
  out.editedFresh = await fresh(m.view.state.doc);
  m.view.destroy();
  m.host.remove();

  // A header group of five rows, 100 px on a page area of 260: taller than a quarter, so it does not repeat.
  out.tall = await fresh(docOf(Array.from({ length: 5 }, (_, i) => [`h${i + 1}`, 'Term', 'Note'])));
  return out;
}
