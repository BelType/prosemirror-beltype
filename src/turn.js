/**
 * The arithmetic of one turn of the driver's loop as `fill` takes it, with no document and no browser: the trial's span, the page's parity, the hint a fill leaves for the page after it, a box boundary as a position, and a word of the Gauge's as a DOM point.
 *
 * @remarks
 * Every function here is a decision the fragmentainer makes between two calls into the engine, kept apart so `node --test` can pin it. None decides a cut: the cut is the Stonehand's, and these only carry its answer across the seam into ProseMirror's positions and back.
 *
 * The parity rule is the driver's (`driver.js`' `parityAt`): page one is a right page, css-page-3 §3.3's left-to-right progression, and the index is the entry's. The offset the driver adds where the root demands a left first page (`rootParityDemand`) is not read here: the specimen's first in-flow box forces nothing, and the root's demand is a read of the whole document's first-child chain, which no page holds.
 *
 * @packageDocumentation
 */

/** @import { Node as PMNode } from 'prosemirror-model' */
/** @import { ContainerHint } from 'prosemirror-fragview/src/fragmentainer.js' */
/** @import { Shell, Piece } from './shells.js' */

/** The span of positions a first fill renders past `from` for its trial, as `OverflowBox` renders. */
export const FIRST_SPAN = 2048;

/**
 * The span the first trial of a fill renders: twice the span the last cut fill held, or `FIRST_SPAN` on a first fill. The fill doubles it again while the trial does not reach below the page's edge.
 * @param {number} last The positions the page's last cut fill held, 0 when it has none.
 */
export const firstSpan = (last) => (last > 0 ? last * 2 : FIRST_SPAN);

/**
 * The side page `index` falls on, from 0: page one is a right page.
 * @param {number} index
 * @returns {'right' | 'left'}
 */
export const parityAt = (index) => (index % 2 === 0 ? 'right' : 'left');

/**
 * The condition the geometry table is asked for page `index` (`readGeometryTable(doc).pageFor`): its name, `:first` for the first page, its side, and `:blank` for a page nothing flows onto.
 * @param {number} index
 * @param {string} name
 * @param {boolean} [blank]
 */
export const conditionOf = (index, name, blank = false) => ({ name, first: index === 0, parity: parityAt(index), blank });

/**
 * The hint a page leaves for the one after it.
 *
 * @remarks
 * Its shape answers the plan's open question. `name` is the effective page name at the place the next page begins (css-page-3 §8.1, read by the engine's `effectivePageName`), which is how the driver names a page; the factory selects the geometry by it. `forced` says the next page begins at a forced break or a named-page switch, so its leading margin is kept (css-break-3 §5.2, the driver's `truncateLead`). `blank` says the next page is a page nothing flows onto, owed where a forced `left`, `right`, `recto` or `verso` demands a side the next page does not fall on (§3.1's second break, the driver's blank entry): the blank page carries the same `name`, since the driver names it from the same cursor, and answers `to === from` with a hint of its own that keeps `name` and `forced` and drops `blank`, which is how the demand is spent whether or not it was needed. When a forced break and a named page disagree, nothing is left to decide: the grab's event is one place, its name is the name of the box at that place, and its parity is the break's.
 *
 * @param {object} a
 * @param {number} a.index The index of the page that is leaving the hint.
 * @param {string} a.name The effective page name where the next page begins.
 * @param {boolean} [a.forced] The page ended at a forced break or a named-page switch.
 * @param {'left' | 'right' | null} [a.parity] The side the forced break demands, or null.
 * @returns {ContainerHint & { forced?: boolean }}
 */
export function hintAfter({ index, name, forced = false, parity = null }) {
  /** @type {ContainerHint & { forced?: boolean }} */
  const next = { name };
  if (forced) next.forced = true;
  if (forced && parity && parity !== parityAt(index + 1)) next.blank = true;
  return next;
}

/**
 * The hint a blank page leaves: the content it stood in front of begins on the page after it, at the forced break that owed the blank.
 * @param {ContainerHint & { forced?: boolean }} hint The blank page's own hint.
 * @returns {ContainerHint & { forced?: boolean }}
 */
export const hintAfterBlank = (hint) => ({ name: hint.name ?? '', forced: true });

/**
 * The position a cut before a box stands at: the position before the box's node, entered down its first-child chain as far as a node that holds content goes.
 *
 * @remarks
 * The fragmented view's convention, which this keeps: a cut is the position the next fragment begins at, and the nodes that open there (from `openedAt(doc, to)` to `to`) are wholly that fragment's, drawn with their top margin truncated (`adjoin`). So a Class A cut before a section is the first position inside the section's first-child chain, and the page before it shows up to `openedAt` of that position, which is the position before the section. The descent stops at a leaf, a whitespace leaf between blocks included, since stepping over it would leave the section opened on the page before.
 *
 * @param {PMNode} doc
 * @param {number} pos A position before a node.
 */
export function enter(doc, pos) {
  for (let $pos = doc.resolve(pos); $pos.nodeAfter && !$pos.nodeAfter.isLeaf; $pos = doc.resolve(pos)) pos += 1;
  return pos;
}

/**
 * The text point a word of the Gauge's begins at, a character into it: the Gauge numbers a box's words over its joined text (`fragments.js`' `joinedWords` is the same tokenization, clone side), and a Class B cut resumes at the first piece on the line after the cut, a word and, where the line begins inside it, a character.
 *
 * @param {{ parts: { node: { data: string }, start: number, end: number, engine?: boolean }[] }[]} words The box's words, `joinedWords(box.el)`.
 * @param {{ word: number, char: number }} at The place, `placeAt` over the Gauge's pieces.
 * @returns {{ node: any, offset: number } | null} Null when the place is past the box's last word.
 */
export function wordPoint(words, { word, char }) {
  const w = words[word];
  if (!w) return null;
  let rest = char;
  for (const part of w.parts) {
    if (part.engine) continue;
    const length = part.end - part.start;
    if (rest < length || part === w.parts[w.parts.length - 1]) return { node: part.node, offset: part.start + Math.min(rest, length) };
    rest -= length;
  }
  return null;
}

/**
 * Where a line stack resumes after line `line`: the first piece of the Gauge's on that line or below, a word and a character, or the place after the last word. The driver's own `placeAt`, a closure inside `paginateOnce` that no module exports; it is two lines, written again here, and named as a door in docs/results.md.
 * @param {{ line: number, index: number, char: number }[]} pieces `report.wordsOf(box)`.
 * @param {number} line
 */
export function placeAt(pieces, line) {
  const p = pieces.find((x) => x.line >= line);
  return p ? { word: p.index, char: p.char } : { word: pieces.length ? pieces[pieces.length - 1].index + 1 : 0, char: 0 };
}

/**
 * A verdict of the Stonehand's as a position, which is `to`, with the four questions it asks of the DOM and the document injected: a box boundary is the box's position entered down its first-child chain, a Class B cut the position of the first character the line after the cut shows, a start-edge Class C the boundary before the child after the gap. An end-gap Class C, an edge cut and a cut through a row continue a box as a shell of so many pixels, which no position says: the page builds those itself (`CiceroPage.cutOf`, `shells.js`) and never asks this; asked anyway, each answers the boundary after (an end gap) or before the box, with `shell` set.
 *
 * @remarks
 * A Class B cut falls between two lines, and its position is where the second begins: the first piece the Gauge homes to the line after the cut, a word and, where the line begins inside it (a hyphen the browser drew, a break inside a word), a character. The breaking space that ended the line before stays with it, on the page before; nothing of a line is ever split between two positions.
 *
 * @param {any} v The verdict, `{ kind, box, k, edge, child }` as `adjudicate` returns it.
 * @param {object} dom
 * @param {(box: any) => { line: number, index: number, char: number }[]} dom.pieces The Gauge's words of a box, `report.wordsOf(box)`.
 * @param {(box: any) => { parts: { node: any, start: number, end: number, engine?: boolean }[] }[]} dom.words The box's joined words, `joinedWords(box.el)`.
 * @param {(node: any, offset: number) => number | null} dom.posAt The position a DOM point of the trial stands for.
 * @param {(pos: number) => number} dom.enter `enter` over the document.
 * @returns {{ pos: number | null, shell: boolean }}
 */
export function verdictPosition(v, { pieces, words, posAt, enter: into }) {
  const index = (/** @type {any} */ el) => Array.prototype.indexOf.call(el.parentNode.childNodes, el);
  const before = (/** @type {any} */ el) => posAt(el.parentNode, index(el));
  const after = (/** @type {any} */ el) => posAt(el.parentNode, index(el) + 1);
  const entered = (/** @type {number | null} */ pos) => (pos == null ? null : into(pos));
  const inRun = (/** @type {any} */ box, /** @type {number} */ line) => {
    const point = wordPoint(words(box), placeAt(pieces(box), line));
    return point ? posAt(point.node, point.offset) : after(box.el);
  };
  if (v.kind === 'A') return { pos: v.box.anonymous ? inRun(v.box, 0) : entered(before(v.box.el)), shell: false };
  if (v.kind === 'B') return { pos: inRun(v.box, v.k + 1), shell: false };
  if (v.kind === 'C' && v.edge === 'start') return { pos: entered(before(v.child.el)), shell: false };
  return { pos: entered(v.kind === 'C' ? after(v.box.el) : before(v.box.el)), shell: true };
}

/**
 * The page's start as the driver sees it: the first in-flow box at or after `from`. Whitespace leaves the page does not draw (`unshown`) and the boxes `away` names (a running element or a fixed box, the engine's zero footprint) are passed over among `from`'s siblings; the descent into the box found is the name lookup's own (`nameAt`, down the first in-flow block children).
 *
 * @remarks
 * The driver never sees such a box at a page's start: its intake takes every running element and fixed box out before the first page (`topLevelBlocks`, `runningBoxes`, `fixedBoxes`), so its cursor stands at the first in-flow block, a forcing event there (a named page, a `break-before`) names the page or sets its side, and the grab's "strictly after" never ends a page on it. The view's slice keeps such a box where the author wrote it, invisible, so the page that begins with it holds its positions, and the page's name and the grab's cursor are read here, past it.
 *
 * @param {PMNode} doc
 * @param {number} from
 * @param {(pos: number) => boolean} away Whether the node at `pos` takes no room in the flow.
 */
export function inFlowStart(doc, from, away) {
  let pos = from;
  for (let $p = doc.resolve(pos); $p.nodeAfter && ($p.nodeAfter.type.spec.unshown || away(pos)); $p = doc.resolve(pos)) pos += /** @type {PMNode} */ ($p.nodeAfter).nodeSize;
  return pos;
}

/**
 * Where a page that cannot cut ends: after the node at `from`, taken whole (*the build cannot fail*, C2: the driver answers a page whose only box is taller than the page by letting it overflow in place). The node is the atom at `from` when there is one, else the textblock `from` stands in, to its end, else the node that begins at `from`; whitespace leaves the page does not draw are passed over first. `to` is the position the next page begins at, past every parent that closes there and entered as a cut is (`enter`), or null at the document's end.
 * @param {PMNode} doc
 * @param {number} from
 * @returns {{ node: PMNode | null, at: number, to: number | null }} `at` is the position before `node`.
 */
export function wholeAfter(doc, from) {
  let pos = from;
  for (let $p = doc.resolve(pos); $p.nodeAfter?.type.spec.unshown; $p = doc.resolve(pos)) pos += /** @type {PMNode} */ ($p.nodeAfter).nodeSize;
  const $p = doc.resolve(pos);
  const atom = $p.nodeAfter?.isAtom && !$p.nodeAfter.isText ? $p.nodeAfter : null;
  /** @type {PMNode | null} */
  let node = atom;
  let after;
  let at = pos;
  if (atom) after = pos + atom.nodeSize;
  else if ($p.parent.inlineContent && $p.depth > 0) { node = $p.parent; at = $p.before(); after = $p.after(); }
  else if ($p.nodeAfter) { node = $p.nodeAfter; after = pos + $p.nodeAfter.nodeSize; }
  else after = pos;
  for (let $a = doc.resolve(after); !$a.nodeAfter && $a.depth > 0; $a = doc.resolve(after)) after = $a.after();
  return { node, at, to: after >= doc.content.size ? null : enter(doc, after) };
}

/**
 * Whether a cut moves the chain on (*the build cannot fail*, C2, asked as the driver's `cutAfter` asks it of an address): a later position, the document's end, or, at the page's own start, a shell entered or one that shrank, or a row piece that moved on or shrank.
 * @param {number} from
 * @param {{ shell?: Shell, pieces?: Piece[] }} start What the page began with.
 * @param {{ to: number | null, next?: { shell?: Shell, pieces?: Piece[] } }} cut
 */
export function advances(from, start, cut) {
  if (cut.to == null || cut.to > from) return true;
  if (cut.to < from) return false;
  const shrank = (/** @type {Shell | undefined} */ a, /** @type {Shell | undefined} */ b) => !!a && (!b || b.pos !== a.pos || a.remaining < b.remaining - 0.5);
  if (shrank(cut.next?.shell, start.shell)) return true;
  const before = new Map((start.pieces ?? []).map((p) => [p.pos, p]));
  return (cut.next?.pieces ?? []).some((p) => {
    const q = before.get(p.pos);
    return !q || (p.from ?? -1) > (q.from ?? -1) || shrank(p.shell, q.shell);
  });
}
