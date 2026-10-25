/**
 * `Originals`, the chain's one rendering of the whole state: what the engine's intake reads off the source document, read off a hidden, connected rendering of the ProseMirror document by the view's own slice renderer, redone once per state.
 *
 * @remarks
 * Counters, named strings and running elements are CSS, so the state at a cut is a question about computed style: `counter-reset` on `body`, `string-set` on a heading, `position: running()` on a mark. The driver answers it at intake over the whole source with the source in its real ancestor chain (`driver.js`, `paginateOnce`, the document ops, string assignments and running assignments), and so does this object, over a rendering it keeps: `render(doc, 0, null)` into a hidden holder that is a child of `body`, the holder's element children less fixed boxes and running elements the top-level blocks (`topLevelBlocks` and `runningBoxes`, asked of a stand-in document whose `body` is the holder), the engine's position index over them (`indexBlocks`), and `documentOpsOf` with the computed style, `html` and `body` as the ancestors (so a `body { counter-reset }` is in force on page one, the driver's own reading) and the running elements at the positions the driver logs them at (`runningPosition`, two lines written again here). From the log, `stringAssignmentsOf` and `runningAssignmentsOf`, once per state; a page asks `counterStateAt` at its first word and `namedStringsForPage` over its interval (`stateOfPage`).
 *
 * The name is the engine's: `paginate`'s `originals` is every top-level box the intake took, and the reads loop asks them here (`Chain.settle`: the blocks, and the holder's children as the intake's boxes). Egildo names it finally; the working name says what it holds.
 *
 * THE POSITION MAPPING. A page knows its `from` and `to` as model positions; the engine's state is ordered by the flat word position of its index (`positions.js`). The renderer's map turns a model position into a DOM point of this rendering (`pointAt`), the point's top-level block is found by climbing to the holder, and the word position is the block's base plus the words of the block wholly before the point (`wordsBeforePoint`), tokenized as `indexBlock` tokenizes, fixed boxes and running elements skipped at any depth, a character inside a word counted as that word's (`wordsBeforeChar`'s rule). A point between blocks is the next block's base, and a point at or past the last block the index's total. So a Class A cut before a box is the words before the box, which is the driver's `posOfCut` of a bare path; a Class B cut mid-paragraph is the position of the first character the next line shows, the first word of that line, which is `wordsBefore(leaf) + word`; a cut whose line begins inside a word (a hyphen the browser drew) is that word, as the driver's `char` is consumed within its word. Measured against the CLI's `entry.pos` on every fixture (docs/results.md, "The page wears its chrome").
 *
 * THE PAGE TOTAL. `counter(pages)` is blank until the chain is complete, as the CLI's `run({ until })` leaves it blank until the document is: the view says the chain is complete when a fill answers `to: null` (an entry whose `to` is the document's end; the view drops every entry after it), and the view fills the first dirty entry first, so every page before it is filled. `totalAfter` is the arithmetic, and `settle` redraws every live page's chrome when the total moves, without refilling any.
 *
 * The holder is body's first child: the reads loop takes a target as the first element in tree order with its id (`reads.js`' header), and the pages' slices, the law copy and a root's light children keep the author's ids, so an original must precede every copy (measured 2026-10-25: with the holder after the view, the specimen's nine targets read as outside the flow and its 15 reads showed nothing). Not here: the reads loop and the chrome of a page an edit did not refill (`chain.js`), and a carried flow's remainders (`remaindersOf`; the view carries no parallel flow).
 *
 * @packageDocumentation
 */

import { pointAt } from 'prosemirror-fragview';
import { topLevelBlocks, runningBoxes } from '@egildo/beltype-engine-cicero/src/driver.js';
import { indexBlocks } from '@egildo/beltype-engine-cicero/src/positions.js';
import { documentOpsOf, counterStateAt, stringAssignmentsOf, runningAssignmentsOf, namedStringsForPage } from '@egildo/beltype-engine-cicero/src/document-state.js';
import { findPageSites } from '@egildo/beltype-engine-cicero/src/reads.js';
import { BREAKING_SPACE, isInlineBox, isFixedBox, isLineBreak } from '@egildo/beltype-engine-cicero/src/word-space.js';

/** @import { Node as PMNode } from 'prosemirror-model' */
/** @import { SliceRenderer, RenderedSlice } from 'prosemirror-fragview/src/fragmentainer.js' */

/** The holder's id: a body child, so its elements have a computed style, and hidden, so it lays nothing out. */
const HOLDER = '__prosemirror-beltype-originals';

/**
 * The words of `block` wholly before a DOM point inside it, tokenized as the engine's `indexBlock` tokenizes (a word is a maximal run of what a breaking space does not divide, continuing across inline seams; a fixed box or a running element is skipped whole; a non-inline boundary and an author's `<br>` end a word), and a point inside a word counted as that word's.
 * @param {any} block
 * @param {{ node: any, offset: number }} point
 * @param {{ isInline?: (el: any) => boolean, isFixed?: (el: any) => boolean, isBreak?: (el: any) => boolean }} [reads] The engine's predicates by default; plain functions in a node test.
 * @returns {number}
 */
export function wordsBeforePoint(block, point, { isInline = isInlineBox, isFixed = isFixedBox, isBreak = isLineBreak } = {}) {
  let count = 0;
  let inWord = false;
  let done = false;
  let inside = false;
  const walk = (/** @type {any} */ el) => {
    const kids = el.childNodes;
    for (let i = 0; i < kids.length; i++) {
      if (el === point.node && i === point.offset) { done = true; return; }
      const node = kids[i];
      if (node.nodeType === 3) {
        const s = node.data;
        const stop = node === point.node ? point.offset : s.length;
        for (let j = 0; j < stop; j++) {
          if (BREAKING_SPACE.test(s[j])) inWord = false;
          else if (!inWord) { count++; inWord = true; }
        }
        if (node === point.node) { inside = inWord && stop < s.length && !BREAKING_SPACE.test(s[stop]); done = true; return; }
      } else if (node.nodeType === 1) {
        if (isFixed(node)) continue;
        const joins = isInline(node) && !isBreak(node);
        if (!joins) inWord = false;
        walk(node);
        if (done) return;
        if (!joins) inWord = false;
      }
    }
    if (el === point.node) done = true;
  };
  walk(block);
  return inside ? count - 1 : count;
}

/**
 * The flat word position of a DOM point of the rendering, and the top-level block it stands in: the base of that block plus the words of it before the point; between blocks, or in a box that is no block (a running element, a fixed box at the top level), the base of the next block and that block; past the last, the total and the block count (the engine's address of a cut: `cut.path[0]` and `pos`).
 * @param {any} holder
 * @param {Map<any, number>} blockIndex Each top-level block's index.
 * @param {{ bases: number[], total: number }} index
 * @param {{ node: any, offset: number }} point
 * @param {Parameters<typeof wordsBeforePoint>[2]} [reads]
 * @returns {{ pos: number, block: number }}
 */
export function wordAddressOf(holder, blockIndex, index, point, reads) {
  const nextBlock = (/** @type {any} */ node) => {
    for (let n = node; n; n = n.nextSibling) if (blockIndex.has(n)) { const b = /** @type {number} */ (blockIndex.get(n)); return { pos: index.bases[b], block: b }; }
    return { pos: index.total, block: blockIndex.size };
  };
  if (point.node === holder) return nextBlock(holder.childNodes[point.offset] ?? null);
  let top = point.node;
  while (top.parentNode && top.parentNode !== holder) top = top.parentNode;
  const b = blockIndex.get(top);
  return b == null ? nextBlock(top.nextSibling) : { pos: index.bases[b] + wordsBeforePoint(top, point, reads), block: b };
}

/**
 * The flat word position of a DOM point of the rendering (`wordAddressOf`'s `pos`).
 * @param {any} holder
 * @param {Map<any, number>} blockIndex
 * @param {{ bases: number[], total: number }} index
 * @param {{ node: any, offset: number }} point
 * @param {Parameters<typeof wordsBeforePoint>[2]} [reads]
 */
export const wordPositionOf = (holder, blockIndex, index, point, reads) => wordAddressOf(holder, blockIndex, index, point, reads).pos;

/**
 * A page's state, as the driver writes it on the page's `closes`: the document's counters at its first word (`counterStateAt`), the four readings of every named string over its interval (`namedStringsForPage`), and of every running element, `null` the empty value. `end` is the next page's first word, null on the last page; a blank page's interval is empty.
 * @param {{ ops: any[], strings: { name: string, value: string, pos: number }[], running: { name: string, value: number, pos: number }[] }} log
 * @param {number} start
 * @param {number | null} end
 */
export function stateOfPage({ ops, strings, running }, start, end) {
  return {
    counters: counterStateAt(ops, start),
    strings: namedStringsForPage(strings, start, end),
    running: namedStringsForPage(running, start, end, {}, null)
  };
}

/**
 * The page total after page `index` answered `to`: the chain's length when the page ran to the document's end, blank (`null`) when the page that was last cut on, since the chain is not complete until a later page ends it, and unchanged otherwise.
 * @param {number | null} total
 * @param {number} index
 * @param {number | null} to
 * @returns {number | null}
 */
export function totalAfter(total, index, to) {
  if (to == null) return index + 1;
  return total != null && index >= total - 1 ? null : total;
}

/**
 * One rendering of a state, read.
 * @typedef {object} OriginalsState
 * @property {PMNode} doc
 * @property {RenderedSlice} rendered
 * @property {Element[]} blocks
 * @property {Map<Element, number>} blockIndex
 * @property {ReturnType<typeof indexBlocks>} index
 * @property {any[]} ops
 * @property {{ name: string, value: string, pos: number }[]} strings
 * @property {{ name: string, value: number, pos: number }[]} running
 * @property {{ el: Element, name: string }[]} boxes The running elements, in the order `running`'s values index.
 * @property {number[]} sites The model positions of the flow sites that read a page fact (`findPageSites`), in document order.
 * @property {{ render: number, read: number }} ms
 */

export class Originals {
  /** @param {Document} [document] */
  constructor(document = globalThis.document) {
    this.document = document;
    /** @type {OriginalsState | null} */
    this.state = null;
    /** The chain's length once a page ran to the document's end, else null. @type {number | null} */
    this.total = null;
    /** The live pages, each redrawn when the total moves. @type {Set<{ index: number, drawChrome: () => void }>} */
    this.pages = new Set();
    /** Each rendering's cost, for the measurement. @type {{ render: number, read: number, nodes: number }[]} */
    this.timings = [];
  }

  /**
   * The state's rendering, made once per document: rendered whole, read, and kept until another document is asked for.
   * @param {PMNode} doc
   * @param {SliceRenderer} render
   * @returns {OriginalsState}
   */
  of(doc, render) {
    if (this.state?.doc === doc) return this.state;
    const d = this.document;
    const win = /** @type {Window & typeof globalThis} */ (d.defaultView);
    const t0 = performance.now();
    let holder = d.getElementById(HOLDER);
    if (!holder) {
      holder = d.createElement('div');
      holder.id = HOLDER;
      holder.style.display = 'none';
    }
    // The first of body's children, so `getElementById` finds an original before any copy: the reads loop takes a target as the first element in tree order with its id (`reads.js`' header), and the pages' slices, the law copy and a root's light children keep the author's ids.
    if (d.body.firstChild !== holder) d.body.prepend(holder);
    const rendered = render(doc, 0, null);
    holder.replaceChildren(rendered.fragment);
    const t1 = performance.now();
    // The driver's intake, asked of a stand-in whose body is the holder: the blocks are its element children less fixed boxes and running elements, the running elements are found at any depth with where the flow resumed after each.
    const stand = /** @type {any} */ ({ body: holder, defaultView: win });
    const blocks = topLevelBlocks(stand);
    const boxes = runningBoxes(stand);
    const index = indexBlocks(blocks);
    const ops = documentOpsOf(blocks, index, {
      styleOf: (el) => win.getComputedStyle(el),
      ancestors: [d.documentElement, d.body],
      // `driver.js`' `runningPosition`: the first word after where the element was written.
      running: boxes.map((r) => ({ name: r.name, pos: index.bases[r.block] + (r.next ? index.wordsBefore(r.next) : 0) }))
    });
    const sites = (findPageSites(d, blocks) ?? []).map((s) => rendered.positions.get(s.el)?.start).filter((p) => p != null).sort((a, b) => a - b);
    const t2 = performance.now();
    this.timings.push({ render: t1 - t0, read: t2 - t1, nodes: holder.getElementsByTagName('*').length });
    this.state = { doc, rendered, blocks, blockIndex: new Map(blocks.map((el, b) => [el, b])), index, ops, strings: stringAssignmentsOf(ops), running: runningAssignmentsOf(ops), boxes, sites, ms: { render: t1 - t0, read: t2 - t1 } };
    return this.state;
  }

  /**
   * The engine's word position of a model position, over the state's rendering (the header's mapping).
   * @param {OriginalsState} state
   * @param {number} pos
   */
  wordAt(state, pos) {
    return this.addressAt(state, pos).pos;
  }

  /**
   * The engine's word position of a model position and the top-level block it stands in (`wordAddressOf`).
   * @param {OriginalsState} state
   * @param {number} pos
   * @returns {{ pos: number, block: number }}
   */
  addressAt(state, pos) {
    const holder = this.holder();
    const point = pointAt(holder, state.rendered.positions, pos);
    if (!point) return pos <= 0 ? { pos: 0, block: 0 } : { pos: state.index.total, block: state.blocks.length };
    return wordAddressOf(holder, state.blockIndex, state.index, point);
  }

  /** The hidden holder the rendering stands in. */
  holder() {
    return /** @type {Element} */ (this.document.getElementById(HOLDER));
  }

  /**
   * Whether a flow site that reads a page fact stands in `[from, to)`.
   * @param {OriginalsState} state
   * @param {number} from
   * @param {number | null} to
   */
  sitesIn(state, from, to) {
    return state.sites.some((p) => p >= from && (to == null || p < to));
  }

  /**
   * A page answered: the total moves by `totalAfter`, and every other live page redraws its chrome when it moved.
   * @param {{ index: number }} page
   * @param {number | null} to
   */
  settle(page, to) {
    const total = totalAfter(this.total, page.index, to);
    if (total === this.total) return;
    this.total = total;
    for (const p of this.pages) if (p !== page) p.drawChrome();
  }
}
