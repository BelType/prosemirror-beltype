/**
 * What a page's foot cuts off, as the host reads it: the page side of `clipped.test.js`. A float that starts on a page and runs below its cut: across the cut on a page that begins in the flow, and wholly below it on a page that begins in a shell (the end gap of a box taller than the page).
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
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    tall: { group: 'block', atom: true, toDOM: () => ['div', { class: 'tall', style: 'height: 400px; background: #eee' }] },
    plate: { group: 'block', atom: true, toDOM: () => ['div', { class: 'plate', style: 'float: right; width: 80px; height: 400px; background: #ccc' }] },
    text: { group: 'inline' },
  },
});
const p = () => schema.node('paragraph', null, [schema.text(TEXT + TEXT)]);

const plugin = ledger();

/** The float on a page that begins in the flow. */
const flowDoc = () => schema.node('doc', null, [p(), schema.node('plate'), p(), p(), p(), p(), p()]);
/** The float on a page that begins in a shell: the box is taller than a page, so the page after the first resumes it painted. */
const shellDoc = () => schema.node('doc', null, [schema.node('tall'), p(), schema.node('plate'), p(), p(), p(), p(), p()]);

/** @param {any} doc */
async function mounted(doc) {
  const containers = /** @type {any} */ (ciceroContainers(document));
  const view = new FragmentedView(/** @type {HTMLElement} */ (document.getElementById('mount')), { state: EditorState.create({ doc, plugins: [plugin] }), containers, words: { attribute: 'data-beltype' } });
  const answer = await Promise.race([containers.chain.settled(view.state.doc), new Promise((r) => setTimeout(() => r('no answer'), 5000))]);
  const accounts = view.fragments.map((/** @type {any} */ f) => {
    const a = f.container.account;
    return a && { kind: a.kind, from: a.from, to: a.to, begins: !!f.container.hint?.shell, ends: !!a.next?.shell, clipped: a.clipped ?? null };
  });
  view.destroy();
  return { answer, accounts };
}

export async function run() {
  const warn = console.warn;
  console.warn = () => {};
  try {
    return { flow: await mounted(flowDoc()), shell: await mounted(shellDoc()) };
  } finally {
    console.warn = warn;
  }
}
