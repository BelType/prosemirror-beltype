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

/** The view mounted at the page's device pixel ratio and settled, kept for `resolutionChanged`; every `invalidate()` and every warning counted. */
export async function mountForResolution() {
  const containers = /** @type {any} */ (ciceroContainers(document));
  const view = new FragmentedView(/** @type {HTMLElement} */ (document.getElementById('mount')), { state: EditorState.create({ doc, plugins: [ledger()] }), containers, words: { attribute: 'data-beltype' } });
  const log = { invalidated: 0, warnings: /** @type {string[]} */ ([]) };
  const invalidate = view.invalidate.bind(view);
  view.invalidate = () => { log.invalidated++; invalidate(); };
  const warn = console.warn;
  console.warn = (...a) => { log.warnings.push(a.join(' ')); warn(...a); };
  await containers.chain.settled(view.state.doc);
  Object.assign(window, { __resolution: { view, containers, log }, });
  return { dpr: devicePixelRatio, accounts: view.fragments.map((/** @type {any} */ f) => f.container.account?.dpr ?? null) };
}

/** After the host changed the ratio: wait past the debounce, settle, and read what the pages say. */
export async function resolutionChanged() {
  const { view, containers, log } = /** @type {any} */ (window).__resolution;
  await new Promise((r) => setTimeout(r, 600));
  await containers.chain.settled(view.state.doc);
  return { dpr: devicePixelRatio, invalidated: log.invalidated, warnings: log.warnings.filter((w) => w.includes('device pixel ratio')).length, accounts: view.fragments.map((/** @type {any} */ f) => f.container.account?.dpr ?? null) };
}
