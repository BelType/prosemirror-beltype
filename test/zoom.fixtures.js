/**
 * Pages under a zoom built on a CSS transform: the page side of `zoom.test.js`. The view is mounted inside a box scaled by `transform`, as a zoom slider scales it, and every `moved` a page dispatches after the chain settles is counted.
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
    paragraph: { group: 'block', content: 'inline*', attrs: { cls: { default: null } }, toDOM: (n) => ['p', n.attrs.cls ? { class: n.attrs.cls } : {}, 0] },
    text: { group: 'inline' },
  },
});
const doc = schema.node('doc', null, Array.from({ length: 8 }, (_, i) => schema.node('paragraph', { cls: i % 2 ? 'padded' : null }, [schema.text(TEXT + TEXT)])));

let moved = 0;
const dispatch = EventTarget.prototype.dispatchEvent;
EventTarget.prototype.dispatchEvent = function (event) {
  if (event.type === 'moved') moved++;
  return dispatch.call(this, event);
};

const frames = (/** @type {number} */ n) => new Promise((resolve) => { const step = () => (n-- <= 0 ? resolve(null) : requestAnimationFrame(step)); step(); });

/**
 * The view mounted under `scale(s)`, settled, then `moved` counted over thirty frames, and once more after a keystroke.
 * @param {number} s
 */
export async function run(s) {
  document.head.insertAdjacentHTML('beforeend', '<style>p.padded { padding: 7px 0 5px; }</style>');
  const mount = /** @type {HTMLElement} */ (document.getElementById('mount'));
  mount.style.transform = `scale(${s})`;
  mount.style.transformOrigin = '0 0';
  const containers = /** @type {any} */ (ciceroContainers(document));
  const view = new FragmentedView(mount, { state: EditorState.create({ doc, plugins: [ledger()] }), containers, words: { attribute: 'data-beltype' } });
  const settle = async () => { await containers.chain.settled(view.state.doc); await containers.chain.settling; await frames(5); };
  await settle();
  moved = 0;
  await frames(30);
  const idle = moved;
  view.dispatch(view.state.tr.insertText('x', 3));
  await settle();
  moved = 0;
  await frames(30);
  const out = { pages: view.entries.length, idle, afterKey: moved };
  view.destroy();
  return out;
}
