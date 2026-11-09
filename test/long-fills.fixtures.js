/**
 * The trial loop's doubling: the page side of `long-fills.test.js`. A paragraph, then a table of many positions and few pixels (130 rows of a 1 px line each), then paragraphs: the first page's span ends inside the table, the bound moves past it (`sealedEnd`), and the trial, the table whole, stops above the page's edge, so the span is doubled while its end stays inside the table.
 *
 * @packageDocumentation
 */

import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { FragmentedView } from 'prosemirror-fragview';
import { CiceroPage, ciceroContainers, ledger } from '../src/index.js';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    text: { group: 'inline' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    table: { group: 'block', content: 'row+', toDOM: () => ['table', { style: 'border-spacing: 0; font: 1px/1px sans-serif' }, ['tbody', 0]] },
    row: { content: 'cell+', toDOM: () => ['tr', 0] },
    cell: { content: 'text*', toDOM: () => ['td', { style: 'padding: 0' }, 0] },
  },
});
const t = (/** @type {string} */ s) => schema.text(s);
const para = (/** @type {number | string} */ i) => schema.node('paragraph', null, [t(`P${i} lorem ipsum dolor sit amet`)]);
const WORDS = 'aa bb cc dd ee ff gg hh ii jj kk ll mm nn oo pp qq rr ss tt';
const doc = () => schema.node('doc', null, [para(0), schema.node('table', null, Array.from({ length: 130 }, () => schema.node('row', null, [schema.node('cell', null, [t(WORDS)])]))), ...Array.from({ length: 30 }, (_, i) => para(i + 1))]);

/** The chain settled, and two frames after it. */
const settle = async (/** @type {any} */ containers, /** @type {any} */ view) => {
  const answer = await Promise.race([containers.chain.settled(view.state.doc), new Promise((r) => setTimeout(() => r('no answer'), 5000))]);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return answer;
};

/** Every cut's trials, in order: the `end` each was rendered to, by page. */
export async function run() {
  /** @type {{ page: number, ends: (number | null)[] }[]} */
  const cuts = [];
  const proto = /** @type {any} */ (CiceroPage.prototype);
  const { cutOnce, trial } = proto;
  proto.cutOnce = function (/** @type {any[]} */ ...args) { cuts.push({ page: this.index + 1, ends: [] }); return cutOnce.apply(this, args); };
  proto.trial = function (/** @type {any} */ d, /** @type {number} */ from, /** @type {number | null} */ end, /** @type {any[]} */ ...rest) { cuts.at(-1)?.ends.push(end); return trial.call(this, d, from, end, ...rest); };
  try {
    const containers = /** @type {any} */ (ciceroContainers(document));
    const view = new FragmentedView(/** @type {HTMLElement} */ (document.getElementById('mount')), { state: EditorState.create({ doc: doc(), plugins: [ledger()] }), containers, words: { attribute: 'data-beltype' } });
    const answer = await settle(containers, view);
    const pages = view.entries.map((/** @type {any} */ { from, to }) => ({ from, to }));
    view.destroy();
    return { answer, pages, cuts };
  } finally {
    Object.assign(proto, { cutOnce, trial });
  }
}
