/**
 * An atom taller than the page area: the page side of `tall-atom.test.js`. A flow of paragraphs with a plate between them, a node with no editable inside drawn as a figure holding an image taller than the page, so the engine's cut through it falls inside the atom, where no position is.
 *
 * @packageDocumentation
 */

import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { FragmentedView } from 'prosemirror-fragview';
import { ciceroContainers, ledger } from '../src/index.js';

const GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const TEXT = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    text: { group: 'inline' },
    plate: { group: 'block', atom: true, toDOM: () => ['figure', { class: 'plate', style: 'margin: 0' }, ['img', { src: GIF, style: 'display: block; width: 200px; height: 700px; background: linear-gradient(#eee, #555)' }]] },
  },
});
const p = () => schema.node('paragraph', null, [schema.text(TEXT)]);
const doc = () => schema.node('doc', null, [p(), p(), schema.node('plate'), p(), p()]);

/**
 * Each page's account and what it shows of the plate: the part of the image's box inside the page's content area, in the image's own pixels from its top, or null where the page holds none of it.
 * @param {any} view
 */
const pagesOf = (view) => view.fragments.map((/** @type {any} */ f) => {
  const a = f.container.account;
  const area = f.container.dom.getBoundingClientRect();
  const img = /** @type {HTMLElement | null} */ (f.container.dom.querySelector('figure.plate img'));
  let shows = null;
  if (img) {
    const r = img.getBoundingClientRect();
    // The page's content area: the page box less the 20 px margins `faces.html`'s `@page` sets.
    const top = Math.max(r.top, area.top + 20), bottom = Math.min(r.bottom, area.bottom - 20);
    if (bottom > top + 0.5) shows = [Math.round(top - r.top), Math.round(bottom - r.top)];
  }
  return { kind: a.kind, from: a.from, to: a.to, begins: f.container.hint?.shell ?? null, ends: a.next?.shell ?? null, clipped: a.clipped ?? null, shows, h: Math.round(area.height) };
});

/** The chain settled, and two frames after it, so the pages' boxes are laid out when they are read. */
const settle = async (/** @type {any} */ containers, /** @type {any} */ view) => {
  const answer = await Promise.race([containers.chain.settled(view.state.doc), new Promise((r) => setTimeout(() => r('no answer'), 5000))]);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return answer;
};

export async function run() {
  const warnings = /** @type {string[]} */ ([]);
  const warn = console.warn;
  console.warn = (...args) => { warnings.push(String(args[0])); };
  try {
    const containers = /** @type {any} */ (ciceroContainers(document));
    const view = new FragmentedView(/** @type {HTMLElement} */ (document.getElementById('mount')), { state: EditorState.create({ doc: doc(), plugins: [ledger()] }), containers, words: { attribute: 'data-beltype' } });
    const answer = await settle(containers, view);
    const filled = pagesOf(view);
    view.invalidate();
    const fresh = { answer: await settle(containers, view), pages: pagesOf(view) };
    view.destroy();
    return { answer, filled, fresh, warnings };
  } finally {
    console.warn = warn;
  }
}
