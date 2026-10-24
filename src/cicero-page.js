/**
 * `CiceroPage`, the fragmentainer: Cicero's `<beltype-page>` implementing the fragmented view's `fill`, one turn of the engine's build loop over a slice of a ProseMirror document.
 *
 * @remarks
 * The page is the engine's own element, made with `document.createElement('beltype-page')` so whichever copy of the engine registered the element first is the one that answers (a second class would make `new` an illegal constructor, and an `instanceof` against either class lies across the two). It is given its geometry from the geometry table (`applyConditions`), dressed with its page context (`dress`), and takes its content through `setContent`, the door *the engine knows no view* opened for a host that is not the root.
 *
 * `fill(doc, from, render)` is the driver's page cycle (`driver.js`, `paginateOnce`), with the engine's functions called and the gaps filled the ProseMirror way:
 * 1. Conditions. The page's name is the effective page name at `from`, read off the trial's law copy (below) as the driver's `nameAt` reads it off the source; its geometry is the table's for that name, its side (`parityAt`), `:first` for the first page and `:blank` for a blank one.
 * 2. Trial. The slice from `from` is rendered twice: once into the engine's measure context (`createMeasureContext` at the page's content width, which neutralizes the native break properties and transforms inside it), and once into a hidden holder outside it, the LAW COPY. The two are the same tree, paired element by element, and the copy answers `sourceOf`: the Stonehand reads `break-*`, `orphans`, `widows` and the monolith grounds from the source because the measure context neutralizes them on what it lays out, so a slice cannot be its own source in the measure context. The trial is bounded as `OverflowBox` bounds its own (`firstSpan`) and doubled until it reaches below the page's edge (`reachesBelowTheEdge`, the Cast-off's check) or the document's end. A fixed box or a running element (`isFixedBox`) is put away (`away`) on both copies and on the page, which is the engine's zero footprint for both.
 * 3. The grab. The engine's `forcingIndexOf` is built over the law copy's top-level blocks with readers this package supplies, and asked for the first forcing event strictly after the page's start; where it finds one in the trial, the trial is rendered again up to the event, as the driver cuts its feed there.
 * 4. Judgement. The fonts and the trial's images are awaited (`awaitFonts`, `awaitCloneImages`), the report taken (`takeReport`), and the page's in-flow bottom compared with its content height as the driver compares it. A page that fits ends at the forced event or at the document's end; one that does not has the Stonehand rank the candidates (`adjudicate`).
 * 5. The verdict as a position, which is `to`: a Class A boundary before a box is that box's position entered down its first-child chain (`enter`), the fragmented view's convention for a cut; a Class B cut between lines is the position of the first character the line after the cut shows, a word and, where the line begins inside it, a character (`placeAt`, `wordPoint`), so the breaking space before it stays on this page. A start-edge Class C resumes before the child after the gap. An end-gap Class C, an edge cut through a monolith and a cut through a row continue a box as a shell of so many pixels, which a position cannot say: each is answered with the boundary after or before the box and a console warning, and named as not done.
 * 6. The page. The slice from `from` to `openedAt(doc, to)` is rendered into the page (`setContent`), the flow given the lead the report measured, the extent the verdict used and the extension a divided box takes (`setFlow`, `extensionPx`), and the answer is `{ to, next }` (`hintAfter`).
 *
 * Where this departs from the driver's loop, each is a finding recorded in docs/results.md: the Cast-off's word estimate is the view's span; the spent lead of a resumed grid (`spentLeadOf`) is not read; a parallel flow carried across a cut (a float, a row item) has no place in a position; the root's parity demand on the first page is not read; and the page takes no reads (no folio, no `counter(pages)`, no strings, no running elements in the margins, no author counters delivered at the page's start: `setCounters` is phase 2's).
 *
 * The page resets the text mechanics the fragmented view's editing host sets (`white-space: break-spaces`, `overflow-wrap`, the ligatures and, from the editing host's own UA style, `line-break`) to what the document's body computes, because the trial in the measure context inherits from the body and the page's content inherits from the host. Measured 2026-10-24 with the reset left out: the cuts were the same, since the trial decides them, but the specimen's third page set its text on more lines than the trial had and its clip hid 21 of its 113 words, and the flow fixture differed from its first page.
 *
 * The law copy is measured too (2026-10-24): with the trial read as its own source, the flow fixture's `break-inside: avoid` box was cut through on its fourth page and every page after it differed (22 pages against the CLI's 26).
 *
 * @packageDocumentation
 */

import { openedAt, pointAt, posAt } from 'prosemirror-fragview';
import { addWord, AWAY, ADJOIN, removeWord } from '@egildo/beltype-engine-cicero/src/data-beltype.js';
import { createMeasureContext, awaitFonts, awaitCloneImages } from '@egildo/beltype-engine-cicero/src/measure.js';
import { takeReport } from '@egildo/beltype-engine-cicero/src/gauge.js';
import { adjudicate, reachesBelowTheEdge, isOutOfFlow } from '@egildo/beltype-engine-cicero/src/stonehand.js';
import { forcingIndexOf } from '@egildo/beltype-engine-cicero/src/driver.js';
import { effectivePageName } from '@egildo/beltype-engine-cicero/src/capture.js';
import { pathOf, normalizePath, extensionPx } from '@egildo/beltype-engine-cicero/src/positions.js';
import { joinedWords } from '@egildo/beltype-engine-cicero/src/fragments.js';
import { blockChildrenOf, isFixedBox } from '@egildo/beltype-engine-cicero/src/word-space.js';
import '@egildo/beltype-engine-cicero/src/chase.js';
import { firstSpan, conditionOf, hintAfter, hintAfterBlank, enter, verdictPosition } from './turn.js';

/** @import { Node as PMNode } from 'prosemirror-model' */
/** @import { FillResult, RenderedSlice, SliceRenderer, ContainerHint } from 'prosemirror-fragview/src/fragmentainer.js' */

/** The comparison tolerance the driver and the Stonehand share, far below a line. */
const EPS = 0.25;

/** The inherited properties the fragmented view's root sets for editing, which the page takes back from the document's body. */
const TEXT_MECHANICS = ['whiteSpace', 'overflowWrap', 'fontVariantLigatures', 'fontFeatureSettings', 'lineBreak'];

/**
 * The geometry table's page, as `readGeometryTable(doc).pageFor` answers it.
 * @typedef {{ pageW: number, pageH: number, margins: { top: number, right: number, bottom: number, left: number }, contentW: number, contentH: number, pageStyle?: object | null }} Geometry
 */

/**
 * One rendering of the slice, with the law copy paired to it.
 * @typedef {object} Trial
 * @property {RenderedSlice} trial What the measure context lays out.
 * @property {RenderedSlice} law The same slice, outside the measure context, whose computed style is the author's law.
 * @property {Map<Element, Element>} lawOf Trial element to law element.
 * @property {Element} lawRoot The holder the law copy stands in.
 * @property {Element[]} blocks The law copy's top-level blocks, fixed boxes left out, as the driver's `topLevelBlocks`.
 * @property {Element | null} container The measure context's container once the trial is laid out in it.
 */

/** The hidden holder every page's law copy stands in: in the document, so its elements have a computed style, and outside the measure context, so the neutralizing sheet does not reach them. */
function lawHolder(/** @type {Document} */ doc) {
  let holder = doc.getElementById('__prosemirror-beltype-law');
  if (!holder) {
    holder = doc.createElement('div');
    holder.id = '__prosemirror-beltype-law';
    holder.style.display = 'none';
    doc.body.appendChild(holder);
  }
  return holder;
}

export class CiceroPage {
  /**
   * @param {object} a
   * @param {{ pageFor: (cond: { name?: string, first?: boolean, parity?: string, blank?: boolean }) => Geometry }} a.table The geometry table, `readGeometryTable(document)`.
   * @param {number} a.index The page's index in the chain, from 0.
   * @param {(ContainerHint & { forced?: boolean }) | undefined} [a.hint] What the fill before this page left for it.
   * @param {Document} [a.document]
   */
  constructor({ table, index, hint, document = globalThis.document }) {
    this.table = table;
    this.index = index;
    this.hint = hint ?? {};
    this.doc = document;
    this.blank = !!this.hint.blank;
    /** @type {HTMLElement & Record<string, any>} */
    this.dom = /** @type {any} */ (document.createElement('beltype-page'));
    const body = /** @type {Window} */ (document.defaultView).getComputedStyle(document.body);
    for (const prop of TEXT_MECHANICS) /** @type {any} */ (this.dom.style)[prop] = /** @type {any} */ (body)[prop];
    /** @type {Geometry & { name: string }} */
    this.conditions = this.conditionsFor(this.hint.name ?? '');
    /** @type {EventTarget} */
    this.moved = new EventTarget();
    /** What the page shows, as rendered. @type {RenderedSlice | null} */
    this.rendered = null;
    /** The position the page's content stops at, as the last fill answered it. @type {number | null} */
    this.to = null;
    /** The positions the last cut fill held, the seed of the next trial's span. */
    this.span = 0;
    /** The heights of the given nodes after the fill, against which `moved` is judged. @type {Map<Element, number>} */
    this.heights = new Map();
    /** The last fill's own account, for a reader that compares it with the engine's. @type {Record<string, any> | null} */
    this.account = null;
    this.observer = new ResizeObserver((entries) => {
      if (!this.rendered) return;
      if (entries.some((e) => Math.abs(e.contentRect.height - (this.heights.get(/** @type {Element} */ (e.target)) ?? e.contentRect.height)) > EPS)) {
        requestAnimationFrame(() => { if (this.rendered) this.moved.dispatchEvent(new Event('moved')); });
      }
    });
  }

  /**
   * The page's conditions for a page name, applied: the geometry the table gives the name, the side and `:first` and `:blank`, written on the element as literals and dressed with the page context.
   * @param {string} name
   */
  conditionsFor(name) {
    const geometry = this.table.pageFor(conditionOf(this.index, name, this.blank));
    this.dom.applyConditions(geometry);
    this.dom.dress(geometry.pageStyle ?? null);
    return { ...geometry, name };
  }

  /**
   * Render the slice of `doc` from `from` under the page's conditions, decide where the page ends, and answer it.
   * @param {PMNode} doc
   * @param {number} from
   * @param {SliceRenderer} render
   * @returns {Promise<FillResult>}
   */
  async fill(doc, from, render) {
    this.to = null;
    this.observer.disconnect();
    if (this.blank) {
      // A page nothing flows onto (§3.1's second break): the cursor does not move, and the demand is spent.
      this.show(render(doc, from, from));
      this.account = { blank: true };
      return { to: from, next: hintAfterBlank(this.hint) };
    }
    const forced = !!this.hint.forced;
    // §5.2: a page that begins after an unforced break truncates the margin adjoining it; the document's start and a forced break keep it (the driver's `truncateLead`).
    const truncateLead = this.index > 0 && !forced;
    const size = doc.content.size;
    let span = firstSpan(this.span);
    /** @type {Trial} */
    let t;
    let ctx = null;
    let report;
    let pageStart = 0;
    let end;
    for (let pours = 1; ; pours++) {
      end = from + span >= size ? null : from + span;
      t = this.trial(doc, from, end, render, forced);
      if (!ctx) {
        // Entry N determines page N+1's conditions (C8): the name is the content's own at the page's start.
        this.conditions = this.conditionsFor(this.nameAt(t, from));
        ctx = createMeasureContext(this.doc, this.conditions.contentW);
      }
      ({ report, pageStart } = await this.measure(ctx, t, truncateLead));
      if (end == null || reachesBelowTheEdge({ report, sourceOf: this.sourceOf(t), pageStart, contentHeight: this.conditions.contentH })) break;
      span *= 2;
    }

    // The grab: the first forcing event strictly after the page's start, in the trial.
    const event = this.grab(t, from);
    /** @type {number | null} */
    let eventTo = null;
    let eventName = '';
    if (event) {
      eventTo = enter(doc, /** @type {any} */ (t.law.positions.get(event.el)).start);
      eventName = this.nameAt(t, eventTo);
      // The feed is cut at the event, as the driver's grab cuts it, and measured again.
      end = openedAt(doc, eventTo);
      t = this.trial(doc, from, end, render, forced);
      ({ report, pageStart } = await this.measure(ctx, t, truncateLead));
    }

    const contentH = this.conditions.contentH;
    const sourceOf = this.sourceOf(t);
    let inFlowBottom = pageStart;
    for (const box of report.processionOf()) {
      const law = sourceOf(box.el);
      if (!(law && isOutOfFlow(getComputedStyle(law)))) inFlowBottom = Math.max(inFlowBottom, box.rect.bottom);
    }
    const fits = inFlowBottom - pageStart <= contentH + EPS;

    // A page that fits ends at the forced event, or at the document's end; the trial loop leaves no bounded trial that fits, as the driver's check leaves none.
    /** @type {number | null} */
    let to = eventTo;
    let nextName = eventName;
    let verdict = null;
    let usedPx = report.flowBottom - pageStart;
    let cost = 0;
    if (!fits) {
      verdict = adjudicate({ report, sourceOf, pageStart, contentHeight: contentH });
      // No verdict: one uncuttable run taller than the page overflows in place (C2), and the page ends where it would have.
      if (verdict) {
        to = this.positionOf(doc, t, verdict, report);
        nextName = to == null ? '' : this.nameAt(t, to);
        usedPx = verdict.y - pageStart;
        cost = verdict.cost ?? 0;
      }
    }
    if (to != null && to <= from) throw new Error(`prosemirror-beltype: page ${this.index + 1} did not advance from ${from} (the verdict mapped to ${to})`);

    const startCut = this.addressAt(t, from);
    const endCut = to == null ? null : this.addressAt(t, to);
    const extPx = endCut ? extensionPx({ blank: false, start: { b: startCut.b, cut: startCut.cut }, end: { b: endCut.b, cut: endCut.cut }, closes: { contentH } }, { usedPx, cost }) : 0;
    ctx.dispose();
    t.lawRoot.replaceChildren();

    this.show(render(doc, from, to == null ? null : openedAt(doc, to)), forced);
    this.dom.setFlow({ leadPx: pageStart, usedPx, extPx, costPx: extPx > 0 ? cost : 0 });
    this.to = to;
    if (to != null) this.span = to - from;
    for (const node of /** @type {Element[]} */ (this.given())) {
      this.heights.set(node, node.getBoundingClientRect().height);
      this.observer.observe(node);
    }
    const byEvent = event && to === eventTo;
    const next = to == null ? undefined : hintAfter({ index: this.index, name: nextName, forced: !!byEvent, parity: byEvent ? event.parity : null });
    this.account = { from, to, name: this.conditions.name, forced, cls: verdict?.cls ?? (byEvent ? 'A' : null), kind: verdict?.kind ?? (byEvent ? (event.namedSwitch ? 'name' : 'forced') : 'terminal'), y: verdict?.y ?? null, pageStart, usedPx, extPx, next };
    return next ? { to, next } : { to };
  }

  /**
   * Render the slice twice, seat the law copy and pair the two, and put away what takes no room in the flow.
   * @param {PMNode} doc
   * @param {number} from
   * @param {number | null} end
   * @param {SliceRenderer} render
   * @param {boolean} forced The page begins at a forced break, which keeps the margin adjoining it.
   * @returns {Trial}
   */
  trial(doc, from, end, render, forced) {
    const trial = render(doc, from, end);
    const law = render(doc, from, end);
    /** @type {Map<Element, Element>} */
    const lawOf = new Map();
    const a = this.doc.createTreeWalker(trial.fragment, NodeFilter.SHOW_ELEMENT);
    const b = this.doc.createTreeWalker(law.fragment, NodeFilter.SHOW_ELEMENT);
    for (let x = a.nextNode(), y = b.nextNode(); x && y; x = a.nextNode(), y = b.nextNode()) lawOf.set(/** @type {Element} */ (x), /** @type {Element} */ (y));
    const lawRoot = lawHolder(this.doc);
    lawRoot.replaceChildren(law.fragment);
    for (const [x, y] of lawOf) {
      if (forced) { removeWord(x, ADJOIN); removeWord(y, ADJOIN); }
      if (isFixedBox(y)) { addWord(x, AWAY); addWord(y, AWAY); }
    }
    const blocks = [...lawRoot.children].filter((el) => !isFixedBox(el));
    return { trial, law, lawOf, lawRoot, blocks, container: null };
  }

  /**
   * Lay the trial out in the measure context, await what the engine awaits, and take the report.
   * @param {ReturnType<typeof createMeasureContext>} ctx
   * @param {Trial} t
   * @param {boolean} truncateLead
   */
  async measure(ctx, t, truncateLead) {
    const container = ctx.measure([...t.trial.fragment.childNodes]);
    t.container = container;
    await awaitFonts(this.doc);
    await awaitCloneImages(container);
    const report = takeReport(container, { contentHeight: this.conditions.contentH });
    return { report, pageStart: truncateLead ? report.contentTop : 0 };
  }

  /** @param {Trial} t */
  sourceOf(t) {
    return (/** @type {Element} */ el) => t.lawOf.get(el) ?? null;
  }

  /**
   * The grab's question, asked of the engine's forcing index over the law copy: the first forcing event strictly after the page's start, for a page of this name.
   * @param {Trial} t
   * @param {number} from
   */
  grab(t, from) {
    const win = /** @type {Window} */ (this.doc.defaultView);
    const index = forcingIndexOf(t.blocks, {
      styleOf: (el) => win.getComputedStyle(el),
      pageNameOf: effectivePageName,
      cutOf: (el, b) => ({ path: normalizePath(pathOf(el, t.blocks[b], b)), word: null, px: null }),
      posOf: () => 0
    });
    const cursor = this.addressAt(t, from).cut;
    return index.find(cursor, this.conditions.name);
  }

  /**
   * The engine's address of a position, read off the law copy: the box the position stands at or in, a bare path where the position is that box's start and a path with a word past it. Only what this package asks of an address is meant: the grab's "strictly after", and whether a cut divides a top-level block (`extensionPx`).
   * @param {Trial} t
   * @param {number} pos
   * @returns {{ b: number, cut: { path: number[], word: number | null, px: null } }}
   */
  addressAt(t, pos) {
    const { el, inside } = this.boxAt(t, pos);
    const top = t.blocks.find((block) => block === el || block.contains(el));
    const b = top ? t.blocks.indexOf(top) : 0;
    const path = top ? pathOf(el, top, b) : [b];
    return { b, cut: inside ? { path, word: 1, px: null } : { path: normalizePath(path), word: null, px: null } };
  }

  /**
   * The law element a position stands at or in, and whether text of the box stands before it.
   * @param {Trial} t
   * @param {number} pos
   * @returns {{ el: Element, inside: boolean }}
   */
  boxAt(t, pos) {
    const point = pointAt(t.lawRoot, t.law.positions, pos);
    if (!point) return { el: t.lawRoot, inside: false };
    if (point.node.nodeType === 3) {
      const el = /** @type {Element} */ (point.node.parentElement);
      const block = this.blockOf(el);
      const range = this.doc.createRange();
      range.setStart(block, 0);
      range.setEnd(point.node, point.offset);
      return { el: block, inside: /\S/.test(range.toString()) };
    }
    const child = point.node.childNodes[point.offset];
    return { el: child?.nodeType === 1 ? /** @type {Element} */ (child) : /** @type {Element} */ (point.node), inside: false };
  }

  /** The nearest ancestor of a law element that lays out as a block, itself included. @param {Element} el */
  blockOf(el) {
    const win = /** @type {Window} */ (this.doc.defaultView);
    for (let e = el; e; e = /** @type {Element} */ (e.parentElement)) if (!/^inline/.test(win.getComputedStyle(e).display)) return e;
    return el;
  }

  /**
   * The effective page name at a position, as the driver's `nameAt` reads it: the box the page begins in, or, at a box's start, the deepest in-flow block that begins there.
   * @param {Trial} t
   * @param {number} pos
   */
  nameAt(t, pos) {
    let { el, inside } = this.boxAt(t, pos);
    const win = /** @type {Window} */ (this.doc.defaultView);
    if (!inside && el !== t.lawRoot) {
      for (;;) {
        const next = blockChildrenOf(el).find((c) => !isOutOfFlow(win.getComputedStyle(c)));
        if (!next || /\S/.test(textBefore(el, next))) break;
        el = next;
      }
    }
    return el === t.lawRoot ? '' : effectivePageName(el);
  }

  /**
   * A verdict of the Stonehand's as a position, which is `to` (`verdictPosition`), over the trial as the measure context laid it out.
   * @param {PMNode} doc
   * @param {Trial} t
   * @param {any} v The verdict.
   * @param {ReturnType<typeof takeReport>} report
   */
  positionOf(doc, t, v, report) {
    const container = /** @type {Element} */ (t.container);
    const { pos, shell } = verdictPosition(v, {
      pieces: (box) => report.wordsOf(box),
      words: (box) => joinedWords(box.el),
      posAt: (node, offset) => posAt(container, t.trial.positions, node, offset),
      enter: (p) => enter(doc, p)
    });
    if (shell) console.warn(`prosemirror-beltype: a ${v.kind}${v.edge ? ` (${v.edge} gap)` : ''} verdict continues a box as a shell, which no position says; page ${this.index + 1} ends at the box's ${v.kind === 'C' ? 'end' : 'start'} instead`);
    return pos;
  }

  /**
   * Show a rendered slice: given to the page through its content door, with what takes no room put away and, after a forced break, the adjoining margin kept.
   * @param {RenderedSlice} rendered
   * @param {boolean} [forced]
   */
  show(rendered, forced = false) {
    this.rendered = rendered;
    const nodes = [...rendered.fragment.childNodes];
    this.dom.setContent(...nodes);
    for (const node of nodes) {
      if (node.nodeType !== 1) continue;
      for (const el of [/** @type {Element} */ (node), ...(/** @type {Element} */ (node)).querySelectorAll('*')]) {
        if (forced) removeWord(el, ADJOIN);
        if (isFixedBox(el)) addWord(el, AWAY);
      }
    }
  }

  /** The nodes the page was given. */
  given() {
    return [...this.dom.childNodes].filter((n) => n.nodeType === 1);
  }

  /** @param {number} pos */
  pointAt(pos) {
    if (!this.rendered) return null;
    if (this.to != null && pos > this.rendered.to && pos <= this.to) pos = this.rendered.to;
    return pointAt(this.dom, this.rendered.positions, pos);
  }

  /**
   * @param {Node} node
   * @param {number} offset
   */
  posAt(node, offset) {
    if (!this.rendered || !this.dom.contains(node)) return null;
    return posAt(this.dom, this.rendered.positions, node, offset);
  }

  release() {
    this.observer.disconnect();
    this.rendered = null;
    this.dom.setContent();
  }
}

/**
 * The text standing in `el` before its descendant `child`.
 * @param {Element} el
 * @param {Element} child
 */
function textBefore(el, child) {
  const range = /** @type {Document} */ (el.ownerDocument).createRange();
  range.setStart(el, 0);
  range.setEndBefore(child);
  return range.toString();
}
