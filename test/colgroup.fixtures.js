/**
 * A table whose drawing writes a `<colgroup>`: the page side of `colgroup.test.js`. The table node's `toDOM` writes the columns, as Tiptap's table does, so the `<col>`s are elements with no position. The table is moved down the page a line at a time, so some trial's page edge falls in each part of it.
 *
 * @packageDocumentation
 */

import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { FragmentedView } from 'prosemirror-fragview';
import { ciceroContainers, ledger } from '../src/index.js';

const COLUMNS = 3;
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    table: { group: 'block', content: 'row+', toDOM: () => ['table', { style: 'width: 100%; border-collapse: collapse' }, ['colgroup', ...Array.from({ length: COLUMNS }, () => ['col'])], ['tbody', 0]] },
    row: { content: 'cell+', toDOM: () => ['tr', 0] },
    cell: { content: 'inline*', toDOM: () => ['td', { style: 'border: 1px solid #888' }, 0] },
    text: { group: 'inline' },
  },
});
const p = (/** @type {string} */ t) => schema.node('paragraph', null, [schema.text(t)]);
const row = (/** @type {number} */ i) => schema.node('row', null, Array.from({ length: COLUMNS }, (_, c) => schema.node('cell', null, [schema.text(`r${i}c${c}`)])));
/** `lines` one-line paragraphs, then a table of twelve rows, then a paragraph. */
const docOf = (/** @type {number} */ lines) => schema.node('doc', null, [
  ...Array.from({ length: lines }, (_, i) => p(`Line ${i + 1}.`)),
  schema.node('table', null, Array.from({ length: 12 }, (_, i) => row(i + 1))),
  p('After the table.'),
]);

/** The chain settled, and two frames after it. */
const settle = async (/** @type {any} */ containers, /** @type {any} */ view) => {
  const answer = await Promise.race([containers.chain.settled(view.state.doc), new Promise((r) => setTimeout(() => r('no answer'), 5000))]);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return answer;
};

/** For each placement of the table, the chain's answer, each page's account and the warnings the pages raised. */
export async function run() {
  const out = [];
  const warn = console.warn;
  try {
    for (let lines = 0; lines <= 9; lines++) {
      const warnings = /** @type {string[]} */ ([]);
      console.warn = (...args) => { warnings.push(String(args[0])); };
      const mount = /** @type {HTMLElement} */ (document.getElementById('mount'));
      const host = mount.appendChild(document.createElement('div'));
      const containers = /** @type {any} */ (ciceroContainers(document));
      const view = new FragmentedView(host, { state: EditorState.create({ doc: docOf(lines), plugins: [ledger()] }), containers, words: { attribute: 'data-beltype' } });
      const answer = await settle(containers, view);
      const pages = view.fragments.map((/** @type {any} */ f) => ({ kind: f.container.account.kind, from: f.container.account.from, to: f.container.account.to }));
      view.destroy();
      host.remove();
      out.push({ lines, answer, pages, warnings });
    }
  } finally {
    console.warn = warn;
  }
  return out;
}
