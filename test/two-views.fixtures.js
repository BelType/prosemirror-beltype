/**
 * Two views of two documents in one page: the page side of `two-views.test.js`. Each document holds a reference to the page of its last paragraph, in the form the engine's head rewrites `target-counter(attr(href url), page)` into; the second is longer, so the two numbers differ. Each view is mounted alone first (its cold fill), then both together; what a view shows must be what it showed alone.
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
    paragraph: { group: 'block', content: 'inline*', attrs: { id: { default: null } }, toDOM: (n) => ['p', n.attrs.id ? { id: n.attrs.id } : {}, 0] },
    text: { group: 'inline' },
  },
  marks: { link: { attrs: { href: {} }, toDOM: (m) => ['a', { href: m.attrs.href }, 0] } },
});
/** @param {string} tag @param {number} n */
const document_ = (tag, n) => schema.node('doc', null, [
  schema.node('paragraph', null, [schema.text(`${tag}: see `), schema.text('the end', [schema.mark('link', { href: `#end-${tag}` })]), schema.text('.')]),
  ...Array.from({ length: n }, () => schema.node('paragraph', null, [schema.text(`${tag} ${TEXT}${TEXT}`)])),
  schema.node('paragraph', { id: `end-${tag}` }, [schema.text(`The end of ${tag}.`)]),
]);
const docs = { a: document_('a', 3), b: document_('b', 14) };

/** @param {HTMLElement} host @param {'a' | 'b'} which */
function mount(host, which) {
  const containers = /** @type {any} */ (ciceroContainers(document));
  const view = new FragmentedView(host, { state: EditorState.create({ doc: docs[which], plugins: [ledger()] }), containers, words: { attribute: 'data-beltype' }, highlightScope: which });
  return { view, chain: containers.chain };
}

/** @param {{ view: any, chain: any }} m */
async function settled({ view, chain }) {
  const late = (/** @type {Promise<any>} */ p) => Promise.race([p, new Promise((r) => setTimeout(() => r('no answer'), 8000))]);
  const answer = await late(chain.settled(view.state.doc));
  await late(chain.settling);
  return answer;
}

/** What a view shows: its pages' text, and what its reference reads on the page that shows it. @param {{ view: any }} m */
function shown({ view }) {
  const link = /** @type {HTMLElement | null} */ ([...view.dom.querySelectorAll('a[href^="#end"]')].find((a) => !a.closest('[data-beltype~="measure"]')));
  return {
    pages: view.fragments.length,
    text: view.fragments.map((/** @type {any} */ f) => f.container.dom?.textContent ?? ''),
    read: link ? getComputedStyle(link, '::after').content : null,
  };
}

export async function run() {
  document.head.insertAdjacentHTML('beforeend', '<style>a::after { content: " p. " var(--beltype-read-counter-attr-href-page-decimal, ""); }</style>');
  const mountPoint = /** @type {HTMLElement} */ (document.getElementById('mount'));
  const out = /** @type {any} */ ({ cold: {} });
  for (const which of /** @type {const} */ (['a', 'b'])) {
    const m = mount(mountPoint, which);
    out.cold[which] = { answer: await settled(m), ...shown(m) };
    m.view.destroy();
  }
  const hostA = mountPoint.appendChild(document.createElement('div'));
  const hostB = mountPoint.appendChild(document.createElement('div'));
  const before = new Set([...document.querySelectorAll('[id^="__prosemirror-beltype-originals"]')].map((el) => el.id));
  const a = mount(hostA, 'a');
  const b = mount(hostB, 'b');
  const answers = { a: await settled(a), b: await settled(b) };
  // Read after both have settled, so a delivery the second view made over the first's is in force.
  out.together = { a: { answer: answers.a, ...shown(a) }, b: { answer: answers.b, ...shown(b) } };
  out.holders = [...document.querySelectorAll('[id^="__prosemirror-beltype-originals"]')].map((el) => el.id).filter((id) => !before.has(id));
  out.names = [...CSS.highlights.keys()];
  a.view.destroy();
  b.view.destroy();
  return out;
}
