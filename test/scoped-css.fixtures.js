/**
 * Content CSS scoped under the editor's element: the page side of `scoped-css.test.js`. The view's element is `#host.editor`; the page's sheet holds two rules scoped under it, inside `@layer` and `@media`, and rules that reach the measure or name the host alone. Then the sheet is replaced with twelve scoped rules and a second view is mounted with a factory of its own.
 *
 * @packageDocumentation
 */

import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { FragmentedView } from 'prosemirror-fragview';
import { ciceroContainers } from '../src/index.js';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    text: { group: 'inline' },
  },
});
const start = () => schema.node('doc', null, [schema.node('paragraph', null, [schema.text('Lorem ipsum dolor sit amet.')])]);

/** @type {string[]} */
const warnings = [];
const warn = console.warn;
console.warn = (...args) => { warnings.push(String(args[0])); warn(...args); };

/** Mount a view on `#host.editor`, wait for its first page, and return what this package warned. */
async function mounted() {
  warnings.length = 0;
  const view = new FragmentedView((/** @type {HTMLElement} */ dom) => {
    dom.id = 'host';
    dom.classList.add('editor');
    /** @type {HTMLElement} */ (document.getElementById('mount')).appendChild(dom);
  }, { state: EditorState.create({ doc: start() }), containers: ciceroContainers(document), words: { attribute: 'data-beltype' } });
  for (let i = 0; i < 500 && (view.filling.size || view.entries.some((/** @type {any} */ e) => e.dirty)); i++) await new Promise((r) => setTimeout(r, 10));
  view.destroy();
  view.dom.remove();
  return warnings.filter((w) => w.startsWith('prosemirror-beltype:'));
}

export async function run() {
  const first = await mounted();
  /** @type {HTMLElement} */ (document.getElementById('scoped')).textContent = Array.from({ length: 12 }, (_, i) => `#host .k${i} { color: red; }`).join('\n');
  const twelve = await mounted();
  return { first, twelve };
}
