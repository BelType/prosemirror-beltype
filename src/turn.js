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
