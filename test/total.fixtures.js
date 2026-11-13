/**
 * The page total through a chain that grows, on real `CiceroPage`s: the page side of `total.test.js`. Five pages, the third a named page whose margin box reads `counter(page)` alone, the others reading `counter(pages)` too; paragraphs added at the end make a sixth.
 *
 * @packageDocumentation
 */

import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { FragmentedView } from 'prosemirror-fragview';
import { ciceroContainers, ledger } from '../src/index.js';

const TEXT = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', attrs: { plain: { default: false } }, toDOM: (node) => ['p', node.attrs.plain ? { class: 'plain' } : {}, 0] },
    text: { group: 'inline' },
  },
});
const para = (/** @type {string} */ t, plain = false) => schema.node('paragraph', { plain }, [schema.text(t)]);
const doc = schema.node('doc', null, [
  ...Array.from({ length: 4 }, (_, i) => para(`${i + 1}. ${TEXT}${TEXT}`)),
  para(`Plain. ${TEXT}`, true),
  ...Array.from({ length: 4 }, (_, i) => para(`${i + 5}. ${TEXT}${TEXT}`)),
]);

async function settled(/** @type {any} */ view, /** @type {any} */ chain) {
  const late = (/** @type {Promise<any>} */ p) => Promise.race([p, new Promise((r) => setTimeout(() => r('no answer'), 10000))]);
  const answer = await late(chain.settled(view.state.doc));
  await late(chain.settling);
  for (let i = 0; i < 200 && (view.filling.size || view.entries.some((/** @type {any} */ e) => e.dirty)); i++) await new Promise((r) => setTimeout(r, 25));
  return answer;
}

export async function run() {
  document.head.insertAdjacentHTML('beforeend', '<style>@page { @bottom-center { content: counter(page) " / " counter(pages); } } @page plain { @bottom-center { content: counter(page); } } p.plain { page: plain; }</style>');
  const containers = /** @type {any} */ (ciceroContainers(document));
  const view = new FragmentedView(/** @type {HTMLElement} */ (document.getElementById('mount')), { state: EditorState.create({ doc, plugins: [ledger()] }), containers, words: { attribute: 'data-beltype' } });
  const out = /** @type {any} */ ({});
  out.answer = await settled(view, containers.chain);
  const pages = view.fragments.map((/** @type {any} */ f) => f.container);
  out.names = pages.map((/** @type {any} */ p) => p.conditions.name);
  out.before = containers.originals.total;
  // From here on: each page's margins laid out again (`layoutBands`, the end of a chrome redraw), the totals its host was given, and its fills.
  const log = pages.map(() => ({ bands: 0, totals: /** @type {(number | null)[]} */ ([]), fills: 0 }));
  pages.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    const { layoutBands, setCounters } = p.dom;
    p.dom.layoutBands = (/** @type {any[]} */ ...a) => { log[i].bands++; return layoutBands.apply(p.dom, a); };
    p.dom.setCounters = (/** @type {any} */ c, /** @type {any} */ own) => { log[i].totals.push(own?.pages ?? null); return setCounters.call(p.dom, c, own); };
    const fill = p.fill.bind(p);
    p.fill = (/** @type {any[]} */ ...a) => { log[i].fills++; return fill(...a); };
  });
  view.dispatch(view.state.tr.insert(view.state.doc.content.size, Array.from({ length: 3 }, (_, i) => para(`Added ${i + 1}. ${TEXT}${TEXT}`))));
  await settled(view, containers.chain);
  out.after = containers.originals.total;
  out.log = log;
  view.destroy();
  return out;
}
