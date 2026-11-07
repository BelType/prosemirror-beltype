/**
 * The shells and the pieces of a row: a box the engine continues across a cut in a form a single position cannot say, built on a rendered slice by the engine's own fragment functions.
 *
 * @remarks
 * Three verdicts of the Stonehand continue a box past a cut as something other than "the next page begins at a position" (`fragments.js`' header calls them the third move, a path plus `px`, and the row's places). Each is built here as the engine builds it, on the renderer's output instead of on a clone of a source, and each is described to the page after by the fill's `next` hint, since `to` is one position:
 *
 * - THE PAINTED SHELL, the page edge's own cut through a box (`E`, *the page edge is not a break point*, C10): the page before shows the box whole, cut at the end (`mutateToFirstFragment`, `split start`), the rest of its parent left out, and its flow clipped at the cut; `to` is the box's own position entered (`enter`), which is the engine's reading of a painted cut (`posOfCut`: the box's start); the page after renders from there, so the box opens its slice whole, and `mutateToContinuation` wraps it in the engine's slice wrapper (`shell`), as tall as what it has left, with the part already shown pulled above the clip. `next.shell` carries `{ pos, remaining, paint }`. A box taller than two pages is cut again at the same `to`: the entry after is one with `from === to`, as a blank page is, and the progress is the remainder that shrank, as the driver's `cutAfter` reads it.
 * - THE BLANK SHELL, an end-gap Class C: the page before shows the box whole and cut at the end, exactly as for the painted shell; `to` is the position after the box, entered, which is the engine's reading of a blank cut (`posOfCut`: the box's own end), so the box's positions stay with the page that shows its content; the page after finds the box among the shallow siblings the renderer writes before its start (`away`), takes the word off and lets `mutateToContinuation` make it the blank shell, no children and the height it has left. `next.shell` carries `{ pos, remaining, paint: null }`.
 * - THE ROW, a cut through boxes laid side by side (`R`, *a parallel flow is a fragmentainer*): each item has a place of its own (`rowPlaceOf`), and the last item's place is the page's own, which is `to`, as the driver makes the last item's place the main path. Each other item is a PIECE: on the page before it is rendered on its own from where it began on that page to its place and swapped in for the item's element; on the page after it is rendered from its place to its end and swapped in for the shallow sibling the renderer wrote. `next.row.items` carries the pieces, `{ pos, from?, shell? }`: an item with nothing left is a blank shell of no height that keeps its column, one the cut left whole resumes from its start, one the page never reached is emptied on the page before (`mutateToFirstFragment`'s rule for an item with no place inside it).
 *
 * A piece's positions are the separate render's, so a page's position map is a composite (`Positions`) that asks each render in turn: `pointAt` and `posAt` read a map through `get` alone.
 *
 * Where the chain and the pieces part, said once: the view's chain gives every position one entry, and an earlier item's remainder is drawn on the page after the one that owns it, so a caret in it is drawn where the item was cut. Recorded in docs/results.md.
 *
 * @packageDocumentation
 */

import { mutateToContinuation, mutateToFirstFragment, pinTrack } from '@beltype/cicero/fragmentation';
import { noteSource } from '@beltype/cicero/fragmentation';
import { ADJOIN, AWAY, END, SHELL, SPLIT, START, addWord, hasWord, removeWord } from '@beltype/cicero/fragmentation';
import { WRAPPED, clonesDecoration } from '@beltype/cicero/fragmentation';

/** @import { Node as PMNode } from 'prosemirror-model' */
/** @import { RenderedSlice, Span } from 'prosemirror-fragview/src/fragmentainer.js' */

/**
 * A box continued past a cut: painted where `paint` is the height already shown, blank where it is null.
 * @typedef {{ pos: number, remaining: number, paint: number | null }} Shell
 */

/**
 * A row item on a page: the node at `pos`, shown from `from` (to its end, or to `to` on the page that cuts the row), or as a shell, or emptied.
 * @typedef {{ pos: number, from?: number, to?: number, shell?: Shell, end?: Shell, empty?: boolean }} Piece
 */

/** A position map that asks several renders' maps in turn, the first one a page wrote into. */
export class Positions {
  /** @param {WeakMap<Node, Span>} first */
  constructor(first) {
    /** @type {WeakMap<Node, Span>[]} */
    this.maps = [first];
  }

  /** @param {Node} node */
  get(node) {
    for (const map of this.maps) {
      const span = map.get(node);
      if (span) return span;
    }
    return undefined;
  }

  /** @param {Node} node @param {Span} span */
  set(node, span) {
    this.maps[0].set(node, span);
    return this;
  }
}

const resumed = (/** @type {Element} */ el) => hasWord(el, SPLIT) && !hasWord(el, START);
const cutOff = (/** @type {Element} */ el) => hasWord(el, SPLIT) && !hasWord(el, END);

/**
 * The position before the node an element was rendered for, or null where the element stands for none (a mark, a shell's wrapper, a shallow sibling).
 *
 * @remarks
 * The renderer clamps a span to its slice, so the start of a node the slice resumes is not its own. Its end is, where the slice does not also cut it off, and the node is the one that ends there. A node the slice both resumes and cuts off is an ancestor of the slice's start: the resumed elements of a slice, outermost first, are the ancestors of its first position (`opened`, the slice's `from`), one per depth, so the one `el` is is the depth that counts them down to it.
 * @param {Element} el
 * @param {Positions | { get(node: Node): Span | undefined }} positions
 * @param {PMNode} doc
 * @param {number | null} [opened] The first position of the slice `el` was rendered in; without it a node divided at both ends answers null.
 * @returns {number | null}
 */
export function nodeStart(el, positions, doc, opened = null) {
  const span = positions.get(el);
  if (!span || span.mark) return null;
  if (!resumed(el)) return span.start === span.contentStart ? null : span.start; // a content element the renderer registered apart from its node's stands for none
  if (!cutOff(el)) {
    const before = doc.resolve(span.end).nodeBefore;
    return before ? span.end - before.nodeSize : null;
  }
  const own = positions instanceof Positions ? positions.maps[0] : positions;
  if (opened == null || !own.get(el)) return null;
  let depth = 0;
  for (let e = /** @type {Element | null} */ (el); e; e = e.parentElement) if (own.get(e) && !own.get(e)?.mark && resumed(e)) depth++;
  const $o = doc.resolve(opened);
  return depth >= 1 && depth <= $o.depth ? $o.before(depth) : null;
}

/**
 * The element of `holder` that holds a node's children: itself when its span says so, else the descendant the renderer wrote them into.
 * @param {Element} el
 * @param {{ get(node: Node): Span | undefined }} positions
 * @returns {Element}
 */
function holderOf(el, positions) {
  if (positions.get(el)?.contentStart != null) return el;
  const walk = (/** @type {Element} */ e) => {
    for (const c of e.children) {
      if (positions.get(c)?.contentStart != null) return c;
      const inner = walk(c);
      if (inner) return inner;
    }
    return null;
  };
  return walk(el) ?? el;
}

/**
 * The element a rendered slice shows the node at `pos` with: a node it shows whole or in part, one it resumes, or a shallow sibling it wrote before its start. Null where the slice does not reach the node.
 *
 * @remarks
 * The descent mirrors the renderer's: at every depth the element children of a node's holder stand for its shown children in order (a text node and an unshown leaf write none), the shallow siblings first; a node the slice resumes is the one child at its depth that is resumed.
 * @param {Element | DocumentFragment} root The slice's root: the fragment, or the element its nodes were moved into.
 * @param {{ get(node: Node): Span | undefined }} positions
 * @param {PMNode} doc
 * @param {number} pos
 * @returns {Element | null}
 */
export function nodeDom(root, positions, doc, pos) {
  const $pos = doc.resolve(pos);
  /** @type {Element | DocumentFragment} */
  let holder = root;
  for (let d = 0; d <= $pos.depth; d++) {
    const parent = $pos.node(d);
    const index = $pos.index(d);
    let k = 0;
    for (let i = 0; i < index; i++) {
      const child = parent.child(i);
      if (!child.isText && !child.type.spec.unshown) k++;
    }
    // A painted shell's wrapper stands for the box it wraps; a blank shell is a shallow sibling with its `away` taken off and its `split` on.
    const kids = [...holder.children].map((c) => (hasWord(c, SHELL) && c.firstElementChild ? c.firstElementChild : c));
    const el = kids.filter((c) => hasWord(c, AWAY) || hasWord(c, SPLIT) || (positions.get(c) && !positions.get(c)?.mark))[k] ?? null;
    if (!el) return null;
    if (d === $pos.depth) return el;
    holder = holderOf(el, positions);
  }
  return null;
}

/**
 * Make the node at `shell.pos` the shell it continues as, on a rendered slice: the engine's `mutateToContinuation` with the box as its own root (the renderer has already dressed the chain above it and put away what stands before it). A blank shell is made of the shallow sibling the renderer wrote, its `away` taken off; a painted one wraps the box, and the wrapper is given the box's span, marked as standing for no node, so `pointAt` reaches inside it.
 * @param {Element | DocumentFragment} root
 * @param {Positions | WeakMap<Node, Span>} positions
 * @param {PMNode} doc
 * @param {Shell} shell
 * @param {Element | null} [law] The law copy's element for the box, for the decoration the engine reads off a source.
 * @returns {Element | null} The box, or null where the slice does not hold it.
 */
export function continueAsShell(root, positions, doc, shell, law = null) {
  const el = nodeDom(root, positions, doc, shell.pos);
  if (!el) return null;
  if (shell.paint == null) removeWord(el, AWAY);
  // A painted box is the whole box pulled up by what it has shown: the renderer's `adjoin` on the chain that opens at the slice's start would truncate the very margin that pulls it.
  else for (const e of [el, ...el.querySelectorAll('*')]) removeWord(e, ADJOIN);
  if (law) noteSource(el, law);
  const source = law ?? el;
  const made = mutateToContinuation(el, { cut: { path: [0], word: null, px: { remaining: shell.remaining, paint: shell.paint } }, source, cloneOf: new Map([[source, el]]) });
  const span = positions.get(el);
  if (made !== el && span) positions.set(made, { start: span.start, end: span.end, mark: true });
  return el;
}

/**
 * Cut the node at `shell.pos` off at its end on the page before its shell (`mutateToFirstFragment` with the box as its own root): it holds its content whole and is dressed as a box that does not end here.
 * @param {Element | DocumentFragment} root
 * @param {{ get(node: Node): Span | undefined }} positions
 * @param {PMNode} doc
 * @param {Shell} shell
 * @param {Element | null} [law]
 */
export function endAsShell(root, positions, doc, shell, law = null) {
  const el = nodeDom(root, positions, doc, shell.pos);
  if (!el) return null;
  if (law) noteSource(el, law);
  const source = law ?? el;
  mutateToFirstFragment(el, { cut: { path: [0], word: null, px: { remaining: shell.remaining, paint: shell.paint } }, source, cloneOf: new Map([[source, el]]) });
  return el;
}

/**
 * The engine's first-fragment work on the boxes a slice cuts off at `at`, the ancestors of that position, each one its own root for `mutateToFirstFragment` with the law copy's element as its source: a box that clones its decoration keeps its block-end border and padding (`wrapped`), and on a page (`extPx` given) the innermost takes §5.3's extension as block-end padding and keeps its last line justified, as the root's constructed first fragment does.
 *
 * @remarks
 * The slice already ends at the cut, so no cut is passed and nothing is truncated. The engine applies the extension and the justified line to the innermost divided box alone; its ancestors are `truncateFrom`'s chain, which only marks them, so the `text-align-last` the door writes on a justified ancestor is put back, and on a trial (`extPx` null, the driver's feed cut at its bound) on every box.
 * @param {Element | DocumentFragment} root
 * @param {{ get(node: Node): Span | undefined }} positions
 * @param {PMNode} doc
 * @param {number} at
 * @param {(pos: number, el: Element) => Element | null} lawOf The law copy's element for the node at `pos`.
 * @param {number | null} extPx
 */
export function endFirstFragment(root, positions, doc, at, lawOf, extPx) {
  const $at = doc.resolve(at);
  for (let d = 1; d <= $at.depth; d++) {
    const el = nodeDom(root, positions, doc, $at.before(d));
    if (!el || !hasWord(el, SPLIT) || hasWord(el, END) || hasWord(el, SHELL)) continue;
    const law = lawOf($at.before(d), el);
    if (law) noteSource(el, law);
    const source = law ?? el;
    const inner = extPx != null && d === $at.depth;
    const kept = /** @type {HTMLElement} */ (el).style.textAlignLast;
    mutateToFirstFragment(el, { extPx: inner ? extPx : 0, source, cloneOf: new Map([[source, el]]) });
    if (!inner) /** @type {HTMLElement} */ (el).style.textAlignLast = kept;
  }
}

/**
 * The engine's continuation dressing on the boxes a slice resumes at `at`, the ancestors of that position: a box that clones its decoration (css-break-3 §5.4) is `wrapped`, so the words sheet leaves it its block-start border and padding, as the engine's `truncateLeadingDecoration` leaves them on the root's continuation and on the driver's feed.
 *
 * @remarks
 * `mutateToContinuation` would do it, but only by consuming a cut, and the slice already begins at its cut. The word and the reading of `box-decoration-break` are the engine's (`WRAPPED`, `clonesDecoration`), asked of the law copy's element, which is laid out where the slice may not be. `truncateLeadingDecoration` is not called: its continuation mark is already on every box this reaches, and it reads through `noteSource`'s registration, which this would have to make and which also copies the source's words.
 * @param {Element | DocumentFragment} root
 * @param {{ get(node: Node): Span | undefined }} positions
 * @param {PMNode} doc
 * @param {number} at
 * @param {(pos: number, el: Element) => Element | null} lawOf The law copy's element for the node at `pos`.
 */
export function wrapResumed(root, positions, doc, at, lawOf) {
  const $at = doc.resolve(at);
  for (let d = 1; d <= $at.depth; d++) {
    const el = nodeDom(root, positions, doc, $at.before(d));
    if (!el || !hasWord(el, SPLIT) || hasWord(el, START) || hasWord(el, SHELL)) continue;
    const law = lawOf($at.before(d), el);
    if (law && clonesDecoration(law)) addWord(el, WRAPPED);
  }
}

/**
 * Seat a row's pieces in a rendered slice: each item rendered on its own over its range and swapped in for the element the slice shows it with, or emptied, or made a shell. The structural half only: a painted or blank shell of a piece is the caller's (`shellsOf`), after the slice is paired with its law copy.
 * @param {Element | DocumentFragment} root
 * @param {Positions} positions The slice's positions; each piece's render is added to them.
 * @param {PMNode} doc
 * @param {(doc: PMNode, from: number, to: number | null) => RenderedSlice} render
 * @param {Piece[]} pieces
 * @returns {boolean} Whether every piece found its element.
 */
export function seatPieces(root, positions, doc, render, pieces) {
  let ok = true;
  for (const piece of pieces) {
    const at = nodeDom(root, positions, doc, piece.pos);
    if (!at) { ok = false; continue; }
    if (piece.empty) { at.replaceChildren(); continue; }
    if (piece.from == null) continue;
    const node = /** @type {PMNode} */ (doc.nodeAt(piece.pos));
    const to = piece.to ?? piece.pos + node.nodeSize;
    if (to <= piece.from) { at.replaceChildren(); continue; }
    const own = render(doc, piece.from, to);
    const el = nodeDom(own.fragment, own.positions, doc, piece.pos);
    if (!el) { ok = false; continue; }
    positions.maps.push(own.positions);
    at.replaceWith(el);
  }
  return ok;
}

/**
 * The shells a page's start and pieces make, in the order they are applied: the pieces' own (a blank shell of an item with nothing left, a shell inside an item), then the page's.
 * @param {{ shell?: Shell, pieces?: Piece[] }} start
 * @returns {Shell[]}
 */
export const shellsOf = (start) => [...(start.pieces ?? []).flatMap((p) => (p.shell ? [p.shell] : [])), ...(start.shell ? [start.shell] : [])];

/**
 * The shells a page's end makes: the page's own, and each piece's.
 * @param {{ shell?: Shell, pieces?: Piece[] }} end
 * @returns {Shell[]}
 */
export const endsOf = (end) => [...(end.pieces ?? []).flatMap((p) => (p.end ? [p.end] : [])), ...(end.shell ? [end.shell] : [])];

/** The display a table's elements have by their tags, which is what `pinTrack` is asked for a page's slice. */
const byTag = (/** @type {Element} */ el) => ({ TR: 'table-row', TD: 'table-cell', TH: 'table-cell', THEAD: 'table-header-group', TBODY: 'table-row-group', TFOOT: 'table-footer-group' })[el.tagName] ?? '';

/**
 * Write the tracks the trial laid each divided table and grid out at on the page's own pieces of them, with the engine's `pinTrack` (*the fragment lays out under the feed's conditions*): a page holds a table with the rows outside its interval left out, and a table that reads its rows for its column widths is not the table the trial measured. The boxes are found here, by the position of their node, since the engine finds them by an address in the account. A row and a cell are read by tag (`byTag`) rather than by computed display, the engine's default, since the page's slice is not in the document yet and its elements are registered with no source. Only a box the page divides (`split`): a whole one lays out as the trial laid it.
 * @param {Element | DocumentFragment} root
 * @param {{ get(node: Node): Span | undefined }} positions
 * @param {PMNode} doc
 * @param {Map<number, { kind: string, columns: number[] | string, width?: number }>} tracks The trial's tracks, by the position of the box's node.
 * @param {number} opened The slice's first position (`nodeStart`).
 */
export function pinTracks(root, positions, doc, tracks, opened) {
  if (!tracks.size) return;
  for (const el of root.querySelectorAll(`[data-beltype~="${SPLIT}"]`)) {
    const at = nodeStart(el, positions, doc, opened);
    const t = at == null ? null : tracks.get(at);
    if (!t) continue;
    pinTrack(/** @type {HTMLElement} */ (el), t, byTag);
  }
}
