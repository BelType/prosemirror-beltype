/**
 * The chain's settle and its safety net on real `CiceroPage`s: the page side of `settle.test.js`. A document of paragraphs whose first holds a reference to the page of its last, in the form the engine's head rewrites `target-counter(attr(href url), page)` into.
 *
 * @packageDocumentation
 */

import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { FragmentedView } from 'prosemirror-fragview';
import { ciceroContainers, ledger, ledgerKey, handleFillRejected } from '../src/index.js';

const TEXT = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', attrs: { id: { default: null } }, toDOM: (n) => ['p', n.attrs.id ? { id: n.attrs.id } : {}, 0] },
    text: { group: 'inline' },
  },
  marks: { link: { attrs: { href: {} }, toDOM: (m) => ['a', { href: m.attrs.href }, 0] } },
});
const doc = schema.node('doc', null, [
  schema.node('paragraph', null, [schema.text('See '), schema.text('the end', [schema.mark('link', { href: '#end' })]), schema.text('.')]),
  ...Array.from({ length: 10 }, () => schema.node('paragraph', null, [schema.text(TEXT + TEXT)])),
  schema.node('paragraph', { id: 'end' }, [schema.text('The end.')]),
]);
const plugin = ledger();

/** Every text a style sheet was given, so a test can say what a settle delivered before its first layout. @type {string[]} */
const sheets = [];
const replaceSync = CSSStyleSheet.prototype.replaceSync;
CSSStyleSheet.prototype.replaceSync = function (text) { sheets.push(text); return replaceSync.call(this, text); };

/** @param {EditorState} state @param {Record<string, any>} [props] */
function mount(state, props = {}) {
  const containers = /** @type {any} */ (ciceroContainers(document));
  const view = new FragmentedView(/** @type {HTMLElement} */ (document.getElementById('mount')), { state, containers, words: { attribute: 'data-beltype' }, ...props });
  return { view, chain: containers.chain };
}

/** The chain settled for the view's document and the reads loop's Ledger write done, or `'no answer'` after five seconds. @param {{ view: any, chain: any }} m */
async function settled({ view, chain }) {
  const late = (/** @type {Promise<any>} */ p) => Promise.race([p, new Promise((r) => setTimeout(() => r('no answer'), 5000))]);
  const answer = await late(chain.settled(view.state.doc));
  await late(chain.settling);
  return answer;
}

const delivered = (/** @type {any} */ state) => JSON.stringify([...(ledgerKey.getState(state)?.delivered ?? [])].map(([k, m]) => [k, [...m]]));

export async function run() {
  document.head.insertAdjacentHTML('beforeend', '<style>a::after { content: " p. " var(--beltype-read-counter-attr-href-page-decimal, ""); }</style>');
  const out = /** @type {any} */ ({});

  // A first fill, cold, and its Ledger saved.
  let m = mount(EditorState.create({ doc, plugins: [plugin] }));
  out.cold = { answer: await settled(m), delivered: delivered(m.view.state) };
  const json = m.view.state.toJSON({ ledger: plugin });
  m.view.destroy();

  // The saved Ledger restored with a page number no layout produced: the first fill of the restored state must not start from it.
  json.ledger.delivered = json.ledger.delivered.map((/** @type {any} */ [k, props]) => [k, props.map((/** @type {any} */ [p]) => [p, '"99"'])]);
  sheets.length = 0;
  m = mount(EditorState.fromJSON({ schema, plugins: [plugin] }, json, { ledger: plugin }));
  const answer = await settled(m);
  out.restored = { answer, warmed: sheets.some((t) => t.includes('"99"')), delivered: delivered(m.view.state) };

  // A page whose rendering throws, as a node's `toDOM` that throws would: the safety net must still answer, the chain stand incomplete and the pages after it be reached.
  const page = m.view.fragments[1];
  const fill = page.container.fill.bind(page.container);
  page.container.fill = (/** @type {any} */ d, /** @type {number} */ from, /** @type {any} */ _render, /** @type {any} */ hint) => fill(d, from, () => { throw new Error('toDOM threw'); }, hint);
  let at = 0;
  m.view.state.doc.descendants((/** @type {any} */ n, /** @type {number} */ pos) => { if (!at && n.isTextblock && pos >= page.from) at = pos + 1; return !at; });
  const errors = console.error;
  console.error = () => {};
  m.view.dispatch(m.view.state.tr.insertText('x', at));
  out.thrown = { answer: await settled(m), last: m.view.entries.at(-1).to, ledgerKept: delivered(m.view.state) === out.restored.delivered };
  console.error = errors;
  m.view.destroy();

  // A page whose fill rejects, its safety net throwing too: unanswered, the chain stops at the page; answered by the page (`handleFillRejected`), it goes on past it.
  for (const name of ['rejectedBare', 'rejected']) {
    m = mount(EditorState.create({ doc, plugins: [plugin] }), name === 'rejected' ? { handleFillRejected } : {});
    await settled(m);
    const p = m.view.fragments[1];
    p.container.cutAndDraw = async () => { throw new Error('the engine fell over'); };
    p.container.failSafe = () => { throw new Error('the safety net fell over'); };
    let at = 0;
    m.view.state.doc.descendants((/** @type {any} */ n, /** @type {number} */ pos) => { if (!at && n.isTextblock && pos >= p.from) at = pos + 1; return !at; });
    const raised = [];
    const onError = (/** @type {ErrorEvent} */ e) => { raised.push(e.message); e.preventDefault(); };
    window.addEventListener('error', onError);
    console.error = () => {};
    m.view.dispatch(m.view.state.tr.insertText('x', at));
    const answer = await settled(m);
    await new Promise((r) => setTimeout(r, 300));
    console.error = errors;
    window.removeEventListener('error', onError);
    out[name] = { answer, raised, dirty: m.view.entries.filter((/** @type {any} */ e) => e.dirty).length, kind: p.container.account?.kind, last: m.view.entries.at(-1).to };
    m.view.destroy();
  }
  return out;
}
