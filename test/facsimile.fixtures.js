/**
 * A PDF embed with no fallback `alt` on Cicero's pages: the page side of `facsimile.test.js`. A document of paragraphs around one `<object type="application/pdf">` whose fallback `<img>` has no `alt`.
 *
 * @packageDocumentation
 */

import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { FragmentedView } from 'prosemirror-fragview';
import { ciceroContainers, ledger } from '../src/index.js';

const GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const TEXT = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
export const DATA = '/fixtures/facsimile/portrait.pdf#page=1';
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    embed: { group: 'block', atom: true, toDOM: () => ['figure', { style: 'margin: 0 0 10px' }, ['object', { type: 'application/pdf', data: DATA, style: 'display: block; width: 90px' }, ['img', { src: GIF }]]] },
    text: { group: 'inline' },
  },
});
const doc = schema.node('doc', null, [
  schema.node('paragraph', null, [schema.text(TEXT)]),
  schema.node('embed'),
  ...Array.from({ length: 6 }, () => schema.node('paragraph', null, [schema.text(TEXT + TEXT)])),
]);

export async function run() {
  /** @type {string[]} */
  const warnings = [];
  /** @type {string[]} */
  const errors = [];
  const warn = console.warn, error = console.error;
  console.warn = (...args) => { warnings.push(String(args[0])); };
  console.error = (...args) => { errors.push(String(args[0])); };
  const containers = /** @type {any} */ (ciceroContainers(document));
  const view = new FragmentedView(/** @type {HTMLElement} */ (document.getElementById('mount')), { state: EditorState.create({ doc, plugins: [ledger()] }), containers, words: { attribute: 'data-beltype' } });
  await containers.chain.settled(view.state.doc);
  await containers.chain.settling;
  console.warn = warn;
  console.error = error;
  const copies = [...document.querySelectorAll('beltype-page object[is]')].map((el) => ({ is: el.getAttribute('is'), label: el.getAttribute('aria-label'), role: el.getAttribute('role') }));
  const out = { chain: view.entries.map((/** @type {any} */ e) => e.to), kinds: view.fragments.map((/** @type {any} */ f) => f.container.account?.kind), warnings, errors, copies };
  view.destroy();
  return out;
}
