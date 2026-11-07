/**
 * Leaf node views on Cicero's pages: the page side of `faces.test.js`. A document of paragraphs and block leaves, each leaf drawn from `toDOM` as an image and, with node views, shown as a box of the same size holding an iframe and an input.
 *
 * @packageDocumentation
 */

import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { FragmentedView } from 'prosemirror-fragview';
import { ciceroContainers } from '../src/index.js';

const GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const TEXT = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    text: { group: 'inline' },
    leaf: { group: 'block', atom: true, toDOM: () => ['img', { class: 'drawn', src: GIF, style: 'display: block; width: 200px; height: 60px' }] },
  },
});
const paragraph = () => schema.node('paragraph', null, [schema.text(TEXT + TEXT)]);
const start = () => schema.node('doc', null, Array.from({ length: 6 }, () => [paragraph(), schema.node('leaf')]).flat());

export const log = { made: 0, destroyed: 0, warnings: /** @type {string[]} */ ([]) };
const warn = console.warn;
console.warn = (...args) => { log.warnings.push(String(args[0])); warn(...args); };

const nodeViews = {
  leaf: () => {
    log.made++;
    const dom = document.createElement('div');
    dom.className = 'face';
    dom.style.cssText = 'display: block; width: 200px; height: 60px';
    dom.innerHTML = '<iframe srcdoc="<p>hello</p>" style="width: 150px; height: 40px; border: 0"></iframe><input style="display: block; height: 20px; box-sizing: border-box">';
    return { dom, destroy: () => { log.destroyed++; }, stopEvent: () => true };
  },
};

/** @param {any} doc @param {boolean} faced */
function mount(doc, faced) {
  return new FragmentedView(/** @type {HTMLElement} */ (document.getElementById('mount')), {
    state: EditorState.create({ doc }),
    containers: ciceroContainers(document),
    words: { attribute: 'data-beltype' },
    ...(faced ? { nodeViews } : {}),
  });
}

/** @param {any} view */
async function settled(view) {
  let calm = 0;
  for (let i = 0; i < 1000 && calm < 6; i++) {
    await new Promise((r) => setTimeout(r, 10));
    calm = view.filling.size === 0 && !view.entries.some((/** @type {any} */ e) => e.dirty) ? calm + 1 : 0;
  }
  if (calm < 6) throw new Error('the chain did not settle');
}

const chain = (/** @type {any} */ view) => view.entries.map((/** @type {any} */ e) => e.to).join(',');

/** The chain of a document with no node views, for comparison. @param {any} doc */
async function plainChain(doc) {
  const view = mount(doc, false);
  await settled(view);
  const answer = chain(view);
  view.destroy();
  return answer;
}

/** The whole story, read once: mounted, edited on the face's page, then moved to the next page. */
export async function run() {
  const plain = await plainChain(start());
  const view = mount(start(), true);
  await settled(view);
  const face = /** @type {HTMLElement} */ (view.dom.querySelector('.face'));
  const frame = /** @type {HTMLIFrameElement} */ (face.querySelector('iframe'));
  if (!frame.contentDocument?.body?.textContent) await new Promise((r) => frame.addEventListener('load', r, { once: true }));
  /** @type {Document} */ (frame.contentDocument).body.textContent = 'written';
  let loads = 0;
  frame.addEventListener('load', () => loads++);
  const input = /** @type {HTMLInputElement} */ (face.querySelector('input'));
  input.focus();
  input.value = 'held';
  const pageOf = () => view.entries.findIndex((e) => view.containers.get(e.key)?.dom.contains(face));
  const kept = () => ({ same: view.dom.querySelector('.face') === face, text: frame.contentDocument?.body?.textContent, loads, value: input.value, focused: document.activeElement === input });
  const first = { chain: chain(view), plain, made: log.made, shown: view.dom.querySelectorAll('beltype-page .face').length, leaves: start().childCount / 2, page: pageOf() };

  view.dispatch(view.state.tr.insertText('typed ', 1));
  await settled(view);
  const edited = { ...kept(), page: pageOf() };

  const before = pageOf();
  view.dispatch(view.state.tr.insert(0, [paragraph(), paragraph(), paragraph()]));
  await settled(view);
  const moved = { ...kept(), before, page: pageOf(), made: log.made, destroyed: log.destroyed };

  const doc = view.state.doc;
  const settledChain = chain(view);
  view.destroy();
  const destroyed = log.destroyed;
  return { first, edited, moved, settledChain, freshChain: await plainChain(doc), destroyed, warnings: log.warnings };
}
