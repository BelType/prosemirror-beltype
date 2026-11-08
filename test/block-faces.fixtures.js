/**
 * Block node views on Cicero's pages: the page side of `block-faces.test.js`. A document of paragraphs and a table of real `<table>` rows drawn from `toDOM`, and a node view for the table with no content hole that draws the same `<table>` from the node, as `prosemirror-spreads`' table view does: same cells, same sheet, so the same box. A plate, a leaf drawn as a figure taller than the page area, is the painted shell's case.
 *
 * @packageDocumentation
 */

import { EditorState, TextSelection } from 'prosemirror-state';
import { Schema, DOMSerializer } from 'prosemirror-model';
import { FragmentedView } from 'prosemirror-fragview';
import { ciceroContainers } from '../src/index.js';

const GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// One line at the page area's 360 px: a paragraph stands 30 px with its margin, a table row 21.
const LOREM = 'lorem ipsum dolor sit amet';
const LONG = 'm'.repeat(10);

export const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    text: { group: 'inline' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    table: { group: 'block', content: 'thead tbody', attrs: { avoid: { default: false } }, toDOM: (n) => ['table', n.attrs.avoid ? { class: 'avoid' } : {}, 0] },
    thead: { content: 'row', toDOM: () => ['thead', 0] },
    tbody: { content: 'row+', toDOM: () => ['tbody', 0] },
    row: { content: '(hcell | cell)+', toDOM: () => ['tr', 0] },
    hcell: { content: 'text*', toDOM: () => ['th', 0] },
    cell: { content: 'text*', toDOM: () => ['td', 0] },
    plate: { group: 'block', atom: true, toDOM: () => ['figure', { class: 'plate', style: 'margin: 0' }, ['img', { src: GIF, style: 'display: block; width: 200px; height: 700px' }]] },
  },
});
const serializer = DOMSerializer.fromSchema(schema);

const t = (/** @type {string} */ s) => schema.text(s);
export const para = (/** @type {number | string} */ i) => schema.node('paragraph', null, [t(`P${i} ${LOREM}`)]);
const row = (/** @type {string} */ type, /** @type {string[]} */ cells) => schema.node('row', null, cells.map((c) => schema.node(type, null, c ? [t(c)] : [])));
/**
 * A table of a header row and `rows` body rows of three cells; `long` names, by row, the column whose cell holds a long word.
 * @param {number} rows
 * @param {{ avoid?: boolean, long?: (i: number) => number | null }} [o]
 */
const table = (rows, o = {}) => schema.node('table', { avoid: !!o.avoid }, [
  schema.node('thead', null, [row('hcell', ['H1', 'H2', 'H3'])]),
  schema.node('tbody', null, Array.from({ length: rows }, (_, i) => row('cell', ['a', 'b', 'c'].map((c, k) => `R${String(i + 1).padStart(2, '0')}${c}` + (o.long?.(i + 1) === k ? ' ' + LONG : ''))))),
]);
/**
 * Paragraphs before, the table, paragraphs after.
 * @param {number} before
 * @param {number} rows
 * @param {number} after
 * @param {{ avoid?: boolean, long?: (i: number) => number | null }} [o]
 */
const docOf = (before, rows, after, o) => schema.node('doc', null, [
  ...Array.from({ length: before }, (_, i) => para(i + 1)),
  table(rows, o),
  ...Array.from({ length: after }, (_, i) => para('Z' + i)),
]);

export const log = { made: 0, destroyed: 0, positions: /** @type {any[]} */ ([]), selections: /** @type {number[][]} */ ([]), updated: 0, warnings: /** @type {string[]} */ ([]) };
const warn = console.warn;
console.warn = (...args) => { log.warnings.push(String(args[0])); warn(...args); };
const reset = () => Object.assign(log, { made: 0, destroyed: 0, positions: [], selections: [], updated: 0, warnings: [] });

/**
 * The table's face: the same `<table>` `toDOM` draws, drawn from the node, its position read in the constructor; with `input`, an input laid over the first body cell, which takes no room.
 * @param {{ input?: boolean }} o
 */
const tableView = (o) => (/** @type {any} */ node, /** @type {any} */ _view, /** @type {() => number | undefined} */ getPos) => {
  log.made++;
  log.positions.push(getPos());
  const dom = /** @type {HTMLElement} */ (serializer.serializeNode(node));
  dom.classList.add('face');
  if (o.input) {
    const cell = /** @type {HTMLElement} */ (dom.querySelector('tbody td'));
    cell.style.position = 'relative';
    const input = document.createElement('input');
    input.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; box-sizing: border-box; border: 0; padding: 0 4px; font: inherit';
    cell.appendChild(input);
  }
  return {
    dom,
    update(/** @type {any} */ next) {
      if (next.type !== node.type) return false;
      log.updated++;
      node = next;
      const cells = dom.querySelectorAll('th, td');
      let i = 0;
      node.descendants((/** @type {any} */ n) => { if (n.type.name === 'hcell' || n.type.name === 'cell') { const c = cells[i++]; if (c?.firstChild?.nodeType === 3) c.firstChild.nodeValue = n.textContent; return false; } return true; });
      return true;
    },
    setSelection: (/** @type {number} */ anchor, /** @type {number} */ head) => { log.selections.push([anchor, head]); },
    stopEvent: (/** @type {Event} */ e) => e.target instanceof HTMLInputElement,
    ignoreMutation: () => true,
    destroy: () => { log.destroyed++; },
  };
};

/** The plate's face: a box of the figure's size. */
const plateView = () => {
  log.made++;
  const dom = document.createElement('div');
  dom.className = 'face';
  dom.style.cssText = 'display: block; height: 700px; background: #ccc';
  return { dom, destroy: () => { log.destroyed++; }, stopEvent: () => true, ignoreMutation: () => true };
};

/**
 * @param {any} doc
 * @param {Record<string, Function> | null} nodeViews
 */
function mount(doc, nodeViews) {
  const containers = /** @type {any} */ (ciceroContainers(document));
  const view = /** @type {any} */ (new FragmentedView(/** @type {HTMLElement} */ (document.getElementById('mount')), {
    state: EditorState.create({ doc }), containers, words: { attribute: 'data-beltype' }, ...(nodeViews ? { nodeViews } : {}),
  }));
  view.containersOf = containers;
  return view;
}

/** Nothing filling and nothing dirty for 200 ms, and the reads loop's settle ended, then two frames. @param {any} view */
export async function settle(view) {
  const t0 = performance.now(), chain = view.containersOf.chain;
  for (;;) {
    let calm = 0;
    while (calm < 200) {
      if (performance.now() - t0 > 30000) throw new Error('the chain did not settle');
      await new Promise((r) => setTimeout(r, 20));
      calm = view.filling.size === 0 && !view.entries.some((/** @type {any} */ e) => e.dirty) ? calm + 20 : 0;
    }
    const s = chain.settling;
    await s;
    if (s === chain.settling && view.filling.size === 0 && !view.entries.some((/** @type {any} */ e) => e.dirty)) break;
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

const chainOf = (/** @type {any} */ view) => view.entries.map((/** @type {any} */ e) => e.to).join(',');
const pagesOf = (/** @type {any} */ view) => view.fragments.map((/** @type {any} */ f) => f.container?.dom).filter(Boolean);
/** Each page's wrappers: the attribute, and whether it holds the face or `toDOM`'s drawing. @param {any} view */
const wrappersOf = (view) => pagesOf(view).map((/** @type {Element} */ p) => [...p.querySelectorAll('[data-fragview-face]')].map((w) => [w.getAttribute('data-fragview-face'), !w.firstElementChild ? 'empty' : w.firstElementChild.classList.contains('face') ? 'face' : w.firstElementChild.localName]));
const pageOf = (/** @type {any} */ view, /** @type {Element} */ el) => pagesOf(view).findIndex((/** @type {Element} */ p) => p.contains(el));
const clippedOf = (/** @type {any} */ view) => view.fragments.map((/** @type {any} */ f) => f.container?.account?.clipped ?? null).filter(Boolean);
const posOf = (/** @type {any} */ doc, /** @type {string} */ name) => { let at = -1; doc.descendants((/** @type {any} */ n, /** @type {number} */ p) => { if (at < 0 && n.type.name === name) at = p; return at < 0; }); return at; };

/** The chain of a document with no node view. @param {any} doc */
async function plainChain(doc) {
  const view = mount(doc, null);
  await settle(view);
  const answer = chainOf(view);
  view.destroy();
  return answer;
}

/** A table that fits, faced with an input: mounted, a paragraph on its page edited, then paragraphs inserted above so it moves to the next page whole. */
export async function fits() {
  reset();
  const view = mount(docOf(1, 4, 6), { table: tableView({ input: true }) });
  await settle(view);
  const face = /** @type {HTMLElement} */ (view.dom.querySelector('table.face'));
  const input = /** @type {HTMLInputElement} */ (face.querySelector('input'));
  input.focus();
  input.value = 'held';
  const read = () => ({ same: view.dom.querySelector('table.face') === face, value: input.value, focused: document.activeElement === input, page: face ? pageOf(view, face) : -1, placed: face?.parentElement?.getAttribute('data-fragview-face') ?? null, wrappers: wrappersOf(view), made: log.made, destroyed: log.destroyed, chain: chainOf(view), doc: view.state.doc });
  const first = { ...read(), pos: posOf(view.state.doc, 'table'), positions: [...log.positions] };
  view.dispatch(view.state.tr.insertText('typed ', 1));
  await settle(view);
  const edited = read();
  view.dispatch(view.state.tr.insert(0, Array.from({ length: 12 }, (_, i) => para('N' + i))));
  await settle(view);
  const moved = read();
  const clipped = clippedOf(view);
  view.destroy();
  const out = {};
  for (const [k, r] of Object.entries({ first, edited, moved })) out[k] = { ...r, doc: undefined, plain: await plainChain(r.doc) };
  return { ...out, clipped, warnings: log.warnings };
}

/**
 * A table the page divides or moves: `before` paragraphs, `rows` body rows, `avoid` on the table or not.
 * @param {{ before: number, rows: number, avoid: boolean }} o
 */
export async function placed(o) {
  reset();
  const doc = docOf(o.before, o.rows, 2, { avoid: o.avoid });
  const view = mount(doc, { table: tableView({}) });
  await settle(view);
  const out = { wrappers: wrappersOf(view), made: log.made, chain: chainOf(view), clipped: clippedOf(view), pages: pagesOf(view).length };
  view.destroy();
  return { ...out, plain: await plainChain(doc), warnings: log.warnings.filter((w) => w.includes('"table"')), all: log.warnings };
}

/** A plate taller than the page area, faced: sliced as a painted shell across pages. */
export async function tallLeaf() {
  reset();
  const doc = schema.node('doc', null, [para(1), para(2), schema.node('plate'), para(3), para(4)]);
  const view = mount(doc, { plate: plateView });
  await settle(view);
  const faces = [...view.dom.querySelectorAll('.face')].map((f) => pageOf(view, f));
  const shells = view.fragments.map((/** @type {any} */ f) => f.container?.account?.kind);
  const out = { faces, made: log.made, wrappers: wrappersOf(view), shells, chain: chainOf(view) };
  view.destroy();
  return { ...out, plain: await plainChain(doc), warnings: log.warnings };
}

/** The table whole on page 2, then the paragraphs above deleted so it moves back to page 1. */
export async function handOver() {
  reset();
  const view = mount(docOf(12, 4, 4), { table: tableView({}) });
  await settle(view);
  const face = /** @type {HTMLElement} */ (view.dom.querySelector('table.face'));
  const before = { page: pageOf(view, face), wrappers: wrappersOf(view), made: log.made };
  const doc = view.state.doc;
  let end = 0;
  for (let i = 0; i < 9; i++) end += doc.child(i).nodeSize;
  view.dispatch(view.state.tr.delete(0, end));
  await settle(view);
  const now = /** @type {HTMLElement | null} */ (view.dom.querySelector('table.face'));
  const after = { page: now ? pageOf(view, now) : -1, same: now === face, placed: now?.parentElement?.getAttribute('data-fragview-face') ?? null, wrappers: wrappersOf(view), made: log.made, destroyed: log.destroyed, connected: face.isConnected, chain: chainOf(view) };
  const last = view.state.doc;
  view.destroy();
  return { before, after, plain: await plainChain(last), warnings: log.warnings };
}

/** The arrows' document, left mounted as `window.view`: a paragraph, a table that fits, a paragraph; the caret at the end of the first. */
export async function arrows() {
  reset();
  /** @type {any} */ (window).view?.destroy();
  const view = mount(docOf(1, 4, 1), { table: tableView({}) });
  /** @type {any} */ (window).view = view;
  await settle(view);
  const pos = posOf(view.state.doc, 'table');
  const size = view.state.doc.nodeAt(pos).nodeSize;
  view.focus();
  view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, pos - 1)));
  await settle(view);
  return { pos, end: pos + size, placed: wrappersOf(view), head: view.state.selection.head };
}

/** Where the arrows' selection stands now. */
export async function selection() {
  const view = /** @type {any} */ (window).view;
  await settle(view);
  const s = view.state.selection;
  return { head: s.head, anchor: s.anchor, node: s.node?.type.name ?? null, selections: [...log.selections] };
}

export function unmount() {
  /** @type {any} */ (window).view?.destroy();
  /** @type {any} */ (window).view = null;
}

/**
 * A tall table divided across pages whose pieces hold their long words in different columns: the second column on the first page's rows, the third on the second's; with the node view (a wrapper around the drawing) or with none (the bare table). Each piece's column widths, read off its first body row, and the style the page wrote on it.
 * @param {{ wrapper: boolean }} o
 */
export async function drift(o) {
  reset();
  const doc = docOf(1, 16, 1, { long: (i) => (i <= 4 ? 1 : i >= 12 ? 2 : null) });
  const view = mount(doc, o.wrapper ? { table: tableView({}) } : null);
  await settle(view);
  const pieces = pagesOf(view).flatMap((/** @type {Element} */ p, /** @type {number} */ i) => [...p.querySelectorAll('table')].filter((tb) => tb.getBoundingClientRect().height > 0).map((tb) => {
    const r = [...tb.querySelectorAll('tbody tr')].find((tr) => tr.getBoundingClientRect().height > 0);
    return { page: i + 1, rows: [...tb.querySelectorAll('tbody tr')].map((tr) => tr.cells[0]?.textContent ?? '-').join('/'), cols: r ? [...r.cells].map((c) => Math.round(c.getBoundingClientRect().width * 10) / 10) : [], style: tb.getAttribute('style') ?? '', wrapped: !!tb.parentElement?.hasAttribute('data-fragview-face') };
  }));
  const out = { pieces, chain: chainOf(view), wrappers: wrappersOf(view) };
  view.destroy();
  return out;
}
