/**
 * The page's waits raced against a timeout: the page side of `waits.test.js`. A document of paragraphs and one image, mounted under a wait the test shortens (`CiceroPage.waitMs`); the test's server holds back `/never/` requests until it releases them.
 *
 * @packageDocumentation
 */

import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { FragmentedView } from 'prosemirror-fragview';
import { ciceroContainers, CiceroPage, ledger } from '../src/index.js';

const TEXT = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    plate: { group: 'block', atom: true, attrs: { src: {} }, toDOM: (n) => ['figure', { style: 'margin: 0 0 10px' }, ['img', { src: n.attrs.src, style: 'display: block; width: 100px; height: 40px' }]] },
    text: { group: 'inline' },
  },
});

/** A document of `paras` paragraphs with a plate after the first. @param {number} paras @param {string} src */
const docOf = (paras, src) => schema.node('doc', null, [
  schema.node('paragraph', null, [schema.text(TEXT)]),
  schema.node('plate', { src }),
  ...Array.from({ length: paras - 1 }, () => schema.node('paragraph', null, [schema.text(TEXT + TEXT)])),
]);

/** Every warning this package gave. @type {string[]} */
const warnings = [];
const warn = console.warn;
console.warn = (...args) => { if (String(args[0]).startsWith('prosemirror-beltype:')) warnings.push(String(args[0])); else warn(...args); };

/** @type {any} */
let mounted = null;

const accounts = () => mounted.view.fragments.map((/** @type {any} */ f) => !!f.container.account?.provisional);
const chain = () => mounted.view.entries.map((/** @type {any} */ e) => e.to);

/**
 * Mount a document with the Ledger, whose plugin view seats the chain, and wait for its chain to settle.
 * @param {{ paras: number, src: string, css?: string, waitMs: number }} o
 */
export async function mount({ paras, src, css = '', waitMs }) {
  mounted?.view.destroy();
  if (css) document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
  CiceroPage.waitMs = waitMs;
  warnings.length = 0;
  const containers = /** @type {any} */ (ciceroContainers(document));
  const state = EditorState.create({ doc: docOf(paras, src), plugins: [ledger()] });
  const t0 = performance.now();
  const view = new FragmentedView(/** @type {HTMLElement} */ (document.getElementById('mount')), { state, containers, words: { attribute: 'data-beltype' } });
  mounted = { view, chain: containers.chain };
  await containers.chain.settled(view.state.doc);
  return { ms: performance.now() - t0, chain: chain(), provisional: accounts(), warnings: [...warnings] };
}

/** After the test's server released what it held: wait until no page is provisional, or two seconds. */
export async function redrawn() {
  const t0 = performance.now();
  while (accounts().some(Boolean) && performance.now() - t0 < 2000) await new Promise((r) => setTimeout(r, 50));
  await mounted.chain.settled(mounted.view.state.doc);
  return { provisional: accounts(), chain: chain(), warnings: [...warnings] };
}
