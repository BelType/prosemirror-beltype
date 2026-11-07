/**
 * A page that shows positions outside its range, on real `CiceroPage`s: the page side of `shows.test.js`. A flex row of two columns, the first much longer than the second, is cut by the page's foot, so the page after shows the first column's rest, whose positions lie inside the page before's range.
 *
 * @packageDocumentation
 */

import { EditorState, TextSelection } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { FragmentedView } from 'prosemirror-fragview';
import { ciceroContainers, ledger } from '../src/index.js';

const TEXT = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    row: { group: 'block', content: 'column+', toDOM: () => ['div', { class: 'columns' }, 0] },
    column: { content: 'paragraph+', toDOM: () => ['div', 0] },
    text: { group: 'inline' },
  },
  marks: { strong: { toDOM: () => ['strong', 0] } },
});
const para = (/** @type {string} */ t) => schema.node('paragraph', null, [schema.text(t)]);
const doc = schema.node('doc', null, [
  para(TEXT),
  schema.node('row', null, [
    schema.node('column', null, Array.from({ length: 6 }, (_, i) => para(`${i + 1}. ${TEXT}${TEXT}`))),
    schema.node('column', null, [para('A short column.')]),
  ]),
  para(TEXT),
]);

function mount(/** @type {any} */ state) {
  const containers = /** @type {any} */ (ciceroContainers(document));
  const view = new FragmentedView(/** @type {HTMLElement} */ (document.getElementById('mount')), { state, containers, words: { attribute: 'data-beltype' } });
  return { view, chain: containers.chain };
}
async function settled(/** @type {any} */ { view, chain }) {
  const late = (/** @type {Promise<any>} */ p) => Promise.race([p, new Promise((r) => setTimeout(() => r('no answer'), 10000))]);
  const answer = await late(chain.settled(view.state.doc));
  await late(chain.settling);
  // The view's own ripple: nothing dirty and nothing in flight.
  for (let i = 0; i < 200 && (view.filling.size || view.entries.some((/** @type {any} */ e) => e.dirty)); i++) await new Promise((r) => setTimeout(r, 25));
  return answer;
}
/** Each page's text and the text of its strong elements. */
const pages = (/** @type {any} */ view) => view.fragments.map((/** @type {any} */ f) => ({ text: f.container.dom.textContent.replace(/\s+/g, ' ').trim(), strong: [...f.container.dom.querySelectorAll('strong')].map((s) => s.textContent) }));

/** A position in the first column's rest: past the place the first page's hint gives the item, which the page after resumes it at. @param {any} view */
function remainderPosition(view) {
  const [first] = view.fragments;
  const item = first.container.account?.next?.row?.items?.[0];
  if (item?.from == null) return null;
  return { pos: first.to + item.from + 4, owner: 0, shown: 1 };
}

export async function run() {
  document.head.insertAdjacentHTML('beforeend', '<style>.columns { display: flex; gap: 10px; } .columns > div { flex: 1; }</style>');
  const out = /** @type {any} */ ({});
  const m = mount(EditorState.create({ doc, plugins: [ledger()] }));
  await settled(m);
  const at = remainderPosition(m.view);
  out.found = at;
  out.pages = m.view.entries.length;
  if (!at) { m.view.destroy(); return out; }

  // The caret in the remainder belongs to the page that shows it.
  m.view.dispatch(m.view.state.tr.setSelection(TextSelection.create(m.view.state.doc, at.pos)));
  out.caretIndex = m.view.indexAt(at.pos);

  // A mark on the remainder: the page that shows it shows it marked, as a fresh fill does.
  m.view.dispatch(m.view.state.tr.addMark(at.pos, at.pos + 3, schema.marks.strong.create()));
  await settled(m);
  out.marked = pages(m.view);
  const f1 = mount(EditorState.create({ doc: m.view.state.doc, plugins: [ledger()] }));
  await settled(f1);
  out.markedFresh = pages(f1.view);
  f1.view.destroy();

  // A same-length replacement in the remainder: the same.
  m.view.dispatch(m.view.state.tr.insertText('XYZ', at.pos, at.pos + 3));
  await settled(m);
  out.replaced = pages(m.view);
  const f2 = mount(EditorState.create({ doc: m.view.state.doc, plugins: [ledger()] }));
  await settled(f2);
  out.replacedFresh = pages(f2.view);
  f2.view.destroy();
  m.view.destroy();
  return out;
}
