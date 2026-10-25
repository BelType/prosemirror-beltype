/**
 * `Originals`, the chain's one rendering of the whole state: what the engine's intake reads off the source document, read off a hidden, connected rendering of the ProseMirror document by the view's own slice renderer, kept per top-level node across states.
 *
 * @remarks
 * Counters, named strings and running elements are CSS, so the state at a cut is a question about computed style: `counter-reset` on `body`, `string-set` on a heading, `position: running()` on a mark. The driver answers it at intake over the whole source with the source in its real ancestor chain (`driver.js`, `paginateOnce`, the document ops, string assignments and running assignments), and so does this object, over a rendering it keeps in a hidden holder that is a child of `body`, the holder's element children less fixed boxes and running elements the top-level blocks (`topLevelBlocks` and `runningBoxes`, asked of a stand-in document whose `body` is the holder), the engine's position index over them (`indexBlocks`), and `documentOpsOf` with the computed style, `html` and `body` as the ancestors (so a `body { counter-reset }` is in force on page one, the driver's own reading) and the running elements at the positions the driver logs them at (`runningPosition`, two lines written again here). From the log, `stringAssignmentsOf` and `runningAssignmentsOf`, once per state; a page asks `counterStateAt` at its first word and `namedStringsForPage` over its interval (`stateOfPage`).
 *
 * THE ORIGINALS KEEP THEIR PARTS (phase 2's third round, docs/results.md). The first state is rendered whole, `render(doc, 0, null)`. A later one is rendered per top-level node: ProseMirror's nodes are persistent, so a node a transaction did not touch is the same object in the new document, and the new document's children are matched to the last state's by identity (`matchNodes`: the common prefix and suffix, then a map for the middle). A kept node keeps its element and the slice it was rendered in; a changed or new node is rendered alone over its range, its own element put in the holder at its place; a removed node's element is taken out; every element put in or moved is reported to the engine's memo (`ForcingMemo.replaced`), and an element whose node is kept is never touched, so its object survives the edit. That is the one condition on which the engine's `keep` door works: the memo keeps each run-level walk's part per top-level box by the box's element (*a resumed run keeps its reads*). So the memo is settled once per state against the sheets' reach (`sheetReach`; at 2 it keeps nothing and the console says so once, as the engine's `settledMemo` does), and the walks over the state (`indexBlocks`, `documentOpsOf`, `findPageSites` here, and the reads loop's in `Chain.settle`) take its `keep`, which the state carries. Where the edit inserted, removed or moved a top-level box and a sheet holds a structural pseudo-class (`:nth-child`, `:first-child` and their kin), every part is forgotten: the engine's reach does not count them, since `patchBox` keeps a parent's child count, which an edit here does not. THE REBASE: a kept slice's position map holds the absolute positions of the document it was rendered from, in which its node started at `at`; the node starts at `base` now, so a model position is asked of the slice at `pos − base + at` (`rebased`), and a recorded start is answered at `start + base − at`. `forget` drops the rendering and the memo where the view's conditions moved (the chain hears the view's `invalidate()` as every page released), and the next state is rendered whole.
 *
 * The name is the engine's: `paginate`'s `originals` is every top-level box the intake took, and the reads loop asks them here (`Chain.settle`: the blocks, and the holder's children as the intake's boxes). Egildo names it finally; the working name says what it holds.
 *
 * THE POSITION MAPPING. A page knows its `from` and `to` as model positions; the engine's state is ordered by the flat word position of its index (`positions.js`). The renderer's map turns a model position into a DOM point of this rendering (`pointOf`: the node that holds the position, then `pointAt` over its element alone at the position rebased to its slice; between nodes, the holder before the next element), the point's top-level block is found by climbing to the holder, and the word position is the block's base plus the words of the block wholly before the point (`wordsBeforePoint`), tokenized as `indexBlock` tokenizes, fixed boxes and running elements skipped at any depth, a character inside a word counted as that word's (`wordsBeforeChar`'s rule). A point between blocks is the next block's base, and a point at or past the last block the index's total. So a Class A cut before a box is the words before the box, which is the driver's `posOfCut` of a bare path; a Class B cut mid-paragraph is the position of the first character the next line shows, the first word of that line, which is `wordsBefore(leaf) + word`; a cut whose line begins inside a word (a hyphen the browser drew) is that word, as the driver's `char` is consumed within its word. Measured against the CLI's `entry.pos` on every fixture (docs/results.md, "The page wears its chrome").
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
import { ForcingMemo } from '@egildo/beltype-engine-cicero/src/forcing-memo.js';
import { sheetReach } from '@egildo/beltype-engine-cicero/src/capture.js';
import { BREAKING_SPACE, isInlineBox, isFixedBox, isLineBreak } from '@egildo/beltype-engine-cicero/src/word-space.js';

/** @import { Node as PMNode } from 'prosemirror-model' */
/** @import { SliceRenderer, RenderedSlice } from 'prosemirror-fragview/src/fragmentainer.js' */
/** @import { Keep } from '@egildo/beltype-engine-cicero/src/forcing-memo.js' */

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
 * The running elements a page's chrome places: for each name and each of its four readings, in a fixed order, the element its value indexes in the state's list. An edit inside a running element keeps its index and replaces its element with one of other content, so two drawings of one interval compare by this (`sameElements`) as well as by `running`.
 * @param {Record<string, Record<string, number | null>> | null | undefined} running
 * @param {{ el: Element }[]} boxes
 * @returns {(Element | null)[]}
 */
export function runningPlaced(running, boxes) {
  return Object.keys(running ?? {}).sort().flatMap((name) => Object.keys(/** @type {any} */ (running)[name]).sort().map((which) => { const at = /** @type {any} */ (running)[name][which]; return at == null ? null : boxes[at]?.el ?? null; }));
}

/**
 * Whether two lists hold the same elements in the same order, or elements equal as nodes (`isEqualNode`): a running element whose top-level node was rendered again for an edit elsewhere in it is a new object with the same content, and its copy in a margin box still stands.
 * @param {readonly any[]} a
 * @param {readonly any[]} b
 */
export const sameElements = (a, b) => a.length === b.length && a.every((x, i) => x === b[i] || (!!x && !!b[i] && typeof x.isEqualNode === 'function' && x.isEqualNode(b[i])));

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
 * For each node of `after`, the index in `before` of the same node object, or −1 for a node `before` does not hold: the common prefix and suffix by identity, then the middle by a map from each old node to its indices, each taken once, in order.
 *
 * @remarks
 * ProseMirror's nodes are persistent, so a top-level node a transaction did not touch is the same object in the new document: a single edit leaves one changed node between a common prefix and a common suffix, and the middle's map is for a step that inserts, deletes or moves several.
 * @template T
 * @param {readonly T[]} before
 * @param {readonly T[]} after
 * @returns {number[]}
 */
export function matchNodes(before, after) {
  const from = new Array(after.length).fill(-1);
  let p = 0;
  while (p < before.length && p < after.length && before[p] === after[p]) { from[p] = p; p++; }
  let s = 0;
  while (s < before.length - p && s < after.length - p && before[before.length - 1 - s] === after[after.length - 1 - s]) { from[after.length - 1 - s] = before.length - 1 - s; s++; }
  /** @type {Map<T, number[]>} */
  const at = new Map();
  for (let i = p; i < before.length - s; i++) { const q = at.get(before[i]); if (q) q.push(i); else at.set(before[i], [i]); }
  for (let j = p; j < after.length - s; j++) { const q = at.get(after[j]); if (q?.length) from[j] = /** @type {number} */ (q.shift()); }
  return from;
}

/**
 * A model position of the current document as a position of the rendering it was drawn at: a kept node's slice holds the absolute positions it was rendered at (`at`, the node's start then), and the node now starts at `base`.
 * @param {number} pos
 * @param {{ base: number, at: number }} entry
 */
export const rebased = (pos, { base, at }) => pos - base + at;

/** Selectors whose answer for a box moves when a box is inserted, removed or moved beside it: the engine's `sheetReach` reads them as 0, since `patchBox` replaces a box and keeps its parent's child count, which an edit here does not. */
const STRUCTURAL = /:(nth-|first-child|last-child|only-child|first-of-type|last-of-type|only-of-type)/;

/**
 * Whether a sheet the document wears holds a structural pseudo-class (`STRUCTURAL`), or cannot be read.
 * @param {Document} d
 */
function structuralSheets(d) {
  const inRules = (/** @type {CSSRuleList} */ rules) => {
    for (const rule of /** @type {Iterable<any>} */ (rules)) if (STRUCTURAL.test(rule.selectorText ?? '') || (rule.cssRules && inRules(rule.cssRules)) || (rule.styleSheet && inSheet(rule.styleSheet))) return true;
    return false;
  };
  const inSheet = (/** @type {CSSStyleSheet} */ sheet) => { try { return inRules(sheet.cssRules); } catch { return true; } };
  return [...d.styleSheets, ...(d.adoptedStyleSheets ?? [])].some(inSheet);
}

/**
 * One top-level node of a state and its element in the rendering: `positions` is the slice it was rendered in, at the absolute positions of the document it was rendered from, in which it started at `at`; it starts at `base` in this one. `el` is null for a node the page does not draw (`unshown`); `rank` is its element's index among the holder's children.
 * @typedef {object} Entry
 * @property {PMNode} node
 * @property {Element | null} el
 * @property {RenderedSlice['positions']} positions
 * @property {number} at
 * @property {number} base
 * @property {number} rank
 */

/**
 * One rendering of a state, read.
 * @typedef {object} OriginalsState
 * @property {PMNode} doc
 * @property {Entry[]} entries One per top-level node, in order.
 * @property {Element[]} blocks
 * @property {Map<Element, number>} blockIndex
 * @property {ReturnType<typeof indexBlocks>} index
 * @property {any[]} ops
 * @property {{ name: string, value: string, pos: number }[]} strings
 * @property {{ name: string, value: number, pos: number }[]} running
 * @property {{ el: Element, name: string }[]} boxes The running elements, in the order `running`'s values index.
 * @property {number[]} sites The model positions of the flow sites that read a page fact (`findPageSites`), in document order.
 * @property {Keep | null} keep The memo's door for the walks over this state's blocks, null where the sheets' reach puts the memo out of use.
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
    /** The engine's memo of the walks' parts per top-level box, kept across states (*a resumed run keeps its reads*). */
    this.memo = new ForcingMemo();
    /** The sheets' reach the memo is settled under, the engine's reading (`sheetReach`); a measurement may put another in its place. @type {(d: Document) => 0 | 1 | 2} */
    this.reachOf = sheetReach;
    /** Each rendering's cost, for the measurement: the milliseconds, the elements, the nodes rendered and kept, the sheets' reach and what the memo kept per walk. @type {any[]} */
    this.timings = [];
  }

  /**
   * Forget the rendering and every kept part: the conditions every rendering was read under moved (the view's `invalidate()`, which the chain hears as every page released), so the next state is rendered whole.
   */
  forget() {
    this.state = null;
    this.memo.clear();
  }

  /**
   * The state's rendering, made once per document and kept until another document is asked for: the first rendered whole, a later one by top-level node, each node the edit did not touch keeping its element and its slice, and read through the engine's memo of the walks' parts.
   * @param {PMNode} doc
   * @param {SliceRenderer} render
   * @returns {OriginalsState}
   */
  of(doc, render) {
    if (this.state?.doc === doc) return this.state;
    const d = this.document;
    const win = /** @type {Window & typeof globalThis} */ (d.defaultView);
    const memo = this.memo;
    const t0 = performance.now();
    const { holder, entries, rendered, shaped } = this.place(doc, render);
    const t1 = performance.now();
    // An insertion, a removal or a move changes a structural pseudo-class's answer for the boxes beside it, which the engine's reach does not count: forget every part where the sheets hold one.
    if (shaped && structuralSheets(d)) memo.clear();
    const reach = this.reachOf(d);
    const keep = memo.settle(reach) ? memo.keep : null;
    if (!keep && !memo.said) {
      memo.said = true;
      console.info('prosemirror-beltype: a stylesheet uses :has(), an @container rule or a selector the engine cannot read, so the originals\' walks are read afresh on every state rather than kept per top-level node (the engine\'s `settledMemo` says the same of its runs). The pages are the same; an edit costs more.');
    }
    const tr = performance.now();
    // The driver's intake, asked of a stand-in whose body is the holder: the blocks are its element children less fixed boxes and running elements, the running elements are found at any depth with where the flow resumed after each.
    const stand = /** @type {any} */ ({ body: holder, defaultView: win });
    const blocks = topLevelBlocks(stand);
    const boxes = runningBoxes(stand);
    const t2 = performance.now();
    const index = indexBlocks(blocks, undefined, undefined, keep);
    const t3 = performance.now();
    const ops = documentOpsOf(blocks, index, {
      styleOf: (el) => win.getComputedStyle(el),
      ancestors: [d.documentElement, d.body],
      // `driver.js`' `runningPosition`: the first word after where the element was written.
      running: boxes.map((b) => ({ name: b.name, pos: index.bases[b.block] + (b.next ? index.wordsBefore(b.next) : 0) })),
      keep
    });
    const t4 = performance.now();
    /** @type {Map<Element, Entry>} */
    const byEl = new Map();
    for (const e of entries) if (e.el) byEl.set(e.el, e);
    const sites = (findPageSites(d, blocks, keep) ?? []).map((s) => this.positionOf(holder, byEl, s.el)).filter((p) => p != null).sort((a, b) => a - b);
    const t5 = performance.now();
    this.timings.push({ render: t1 - t0, read: t5 - t1, nodes: holder.getElementsByTagName('*').length, rendered, kept: entries.length - rendered, reach, parts: { reach: tr - t1, blocks: t2 - tr, index: t3 - t2, ops: t4 - t3, sites: t5 - t4 }, tally: memo.tally });
    this.state = { doc, entries, blocks, blockIndex: new Map(blocks.map((el, b) => [el, b])), index, ops, strings: stringAssignmentsOf(ops), running: runningAssignmentsOf(ops), boxes, sites, keep, ms: { render: t1 - t0, read: t5 - t1 } };
    return this.state;
  }

  /**
   * The state's top-level nodes put in the holder: on the first call, or the first after `forget`, the whole document rendered once and each element found by the start its node was rendered at; afterwards the nodes matched to the last state's by identity (`matchNodes`), a kept node keeping its element and its slice, a changed or new node rendered alone over its range, a removed node's element taken out, and every element new or moved reported to the memo (`ForcingMemo.replaced`). `shaped` says whether an element was inserted, removed or moved among the holder's children.
   * @param {PMNode} doc
   * @param {SliceRenderer} render
   * @returns {{ holder: Element, entries: Entry[], rendered: number, shaped: boolean }}
   */
  place(doc, render) {
    const d = this.document;
    let holder = d.getElementById(HOLDER);
    if (!holder) {
      holder = d.createElement('div');
      holder.id = HOLDER;
      holder.style.display = 'none';
    }
    // The first of body's children, so `getElementById` finds an original before any copy: the reads loop takes a target as the first element in tree order with its id (`reads.js`' header), and the pages' slices, the law copy and a root's light children keep the author's ids.
    if (d.body.firstChild !== holder) d.body.prepend(holder);
    /** @type {PMNode[]} */
    const nodes = [];
    /** @type {number[]} */
    const bases = [];
    doc.forEach((node, offset) => { nodes.push(node); bases.push(offset); });
    const prev = this.state?.entries ?? null;
    const memo = this.memo;
    let rendered = 0;
    let shaped = false;
    /** @type {Entry[]} */
    let entries;
    if (!prev) {
      const whole = render(doc, 0, null);
      /** @type {Map<number, Element>} */
      const byStart = new Map();
      for (const el of whole.fragment.children) { const span = whole.positions.get(el); if (span) byStart.set(span.start, el); }
      entries = nodes.map((node, i) => ({ node, el: byStart.get(bases[i]) ?? null, positions: whole.positions, at: bases[i], base: bases[i], rank: -1 }));
      holder.replaceChildren(whole.fragment);
      rendered = nodes.length;
      memo.clear();
    } else {
      const from = matchNodes(prev.map((e) => e.node), nodes);
      entries = nodes.map((node, j) => {
        const i = from[j];
        if (i >= 0) return { ...prev[i], base: bases[j] };
        rendered++;
        // The node's range alone: its own element, whole, after the shallow siblings the renderer writes for the nodes before it, which stand for no position.
        const slice = render(doc, bases[j], bases[j] + node.nodeSize);
        const el = [...slice.fragment.children].find((c) => slice.positions.has(c)) ?? null;
        return { node, el, positions: slice.positions, at: bases[j], base: bases[j], rank: -1 };
      });
      const kept = new Set(from);
      for (let i = 0; i < prev.length; i++) {
        const el = prev[i].el;
        if (kept.has(i) || !el) continue;
        el.remove();
        memo.replaced(el);
      }
      // Each new or moved element put before the element that follows it, from the last: a kept element whose successor is already the right one stays where it stands.
      /** @type {Element | null} */
      let next = null;
      for (let j = entries.length - 1; j >= 0; j--) {
        const el = entries[j].el;
        if (!el) continue;
        if (el.parentNode !== holder || el.nextSibling !== next) {
          holder.insertBefore(el, next);
          memo.replaced(el);
        }
        next = el;
      }
      const ranks = (/** @type {Entry[]} */ list) => { let r = 0; return list.map((e) => (e.el ? r++ : -1)); };
      const before = ranks(prev), after = ranks(entries);
      shaped = before.filter((r) => r >= 0).length !== after.filter((r) => r >= 0).length || from.some((i, j) => i >= 0 && before[i] !== after[j]);
    }
    let r = 0;
    for (const e of entries) e.rank = e.el ? r++ : -1;
    return { holder, entries, rendered, shaped };
  }

  /**
   * The model position, in the current document, of an element of the rendering: its slice's recorded start, rebased.
   * @param {Element} holder
   * @param {Map<Element, Entry>} byEl
   * @param {Element} el
   * @returns {number | null}
   */
  positionOf(holder, byEl, el) {
    /** @type {Node} */
    let top = el;
    while (top.parentNode && top.parentNode !== holder) top = top.parentNode;
    const e = byEl.get(/** @type {Element} */ (top));
    const span = e?.positions.get(el);
    return e && span ? span.start + e.base - e.at : null;
  }

  /**
   * The DOM point of the rendering that shows a model position of the state's document, or null before the first element or past the last (`pointAt` over the whole rendering, as it answered when the rendering was one slice): inside a node, `pointAt` over that node's element alone at the position rebased to its slice; between nodes, or in a node with no element, the holder before the next element.
   * @param {OriginalsState} state
   * @param {number} pos
   * @returns {{ node: Node, offset: number } | null}
   */
  pointOf(state, pos) {
    const holder = this.holder();
    const { entries } = state;
    const drawn = entries.filter((e) => e.el);
    if (!drawn.length) return null;
    const last = /** @type {Entry} */ (drawn.at(-1));
    if (pos < drawn[0].base || pos > last.base + last.node.nodeSize) return null;
    // The last node that starts at or before `pos`.
    let lo = 0, hi = entries.length - 1, k = -1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (entries[m].base <= pos) { k = m; lo = m + 1; } else hi = m - 1;
    }
    const e = k >= 0 ? entries[k] : null;
    if (e?.el && pos > e.base && pos < e.base + e.node.nodeSize) {
      // A root that holds the element alone, so `pointAt` steps into it as it stepped into it from the holder.
      const root = /** @type {any} */ ({ childNodes: [e.el], firstChild: e.el, lastChild: e.el });
      const point = pointAt(root, e.positions, rebased(pos, e));
      if (point && point.node !== root) return point;
      return { node: holder, offset: e.rank + (point?.offset ?? 0) };
    }
    let j = e && e.base === pos ? k : k + 1;
    while (j < entries.length && !entries[j].el) j++;
    return { node: holder, offset: j < entries.length ? entries[j].rank : holder.childNodes.length };
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
    const point = this.pointOf(state, pos);
    if (!point) return pos <= 0 ? { pos: 0, block: 0 } : { pos: state.index.total, block: state.blocks.length };
    return wordAddressOf(this.holder(), state.blockIndex, state.index, point);
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
