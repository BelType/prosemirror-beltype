/**
 * `CiceroPage`, the fragmentainer: Cicero's `<beltype-page>` implementing the fragmented view's `fill`, one turn of the engine's build loop over a slice of a ProseMirror document.
 *
 * @remarks
 * The page is the engine's own element, made with `document.createElement('beltype-page')` so whichever copy of the engine registered the element first is the one that answers (a second class would make `new` an illegal constructor, and an `instanceof` against either class lies across the two). It is given its geometry from the geometry table (`applyConditions`), dressed with its page context (`dress`), and takes its content through `setContent`, the door *the engine knows no view* opened for a host that is not the root.
 *
 * `fill(doc, from, render)` is the driver's page cycle (`driver.js`, `paginateOnce`), with the engine's functions called and the gaps filled the ProseMirror way:
 * 1. Conditions. The page's name is the effective page name at its first in-flow box at or after `from` (`inFlowStart`: a running element, a fixed box or a whitespace leaf at `from` is passed over, since the driver's intake took them out before its cursor ever stood there), read off the trial's law copy (below) as the driver's `nameAt` reads it off the source; its geometry is the table's for that name, its side (`parityAt`), `:first` for the first page and `:blank` for a blank one.
 * 2. Trial. The slice from `from` is rendered twice: once into the engine's measure context (`createMeasureContext` at the page's content width, which neutralizes the native break properties and transforms inside it), and once into a hidden holder outside it, the LAW COPY. The two are the same tree, paired element by element, and the copy answers `sourceOf`: the Stonehand reads `break-*`, `orphans`, `widows` and the monolith grounds from the source because the measure context neutralizes them on what it lays out, so a slice cannot be its own source in the measure context. The trial is bounded as `OverflowBox` bounds its own (`firstSpan`), at a block boundary and never inside a box the driver's bound never cuts inside (`boundAt`, `sealedEnd`, the Cast-off's `neverCutInside`), and doubled until it reaches below the page's edge (`reachesBelowTheEdge`, the Cast-off's check) or the document's end. A fixed box or a running element (`isFixedBox`) is put away (`away`) on both copies and on the page, at any depth, which is the engine's zero footprint for both; the page that begins with one holds its positions, invisible. Placing a running element in its margin box (`setMarginBox`, the running assignments) is the reads' work, phase 2's, and not done here. What the page begins with besides its slice, a shell or a row's pieces (below), is built on both copies before they are measured, as the driver's feed is built with them.
 * 3. The grab. The engine's `forcingIndexOf` is built over the law copy's top-level blocks with readers this package supplies, and asked for the first forcing event strictly after the page's start, its first in-flow box, so an event there (a named page, a `break-before`) names the page or sets its side and does not end it; where it finds one in the trial, the trial is rendered again up to the event, as the driver cuts its feed there.
 * 4. Judgement. The fonts and the trial's images are awaited (`awaitFonts`, `awaitCloneImages`), the report taken (`takeReport`), the lead read (`report.contentTop` and the spent extent above a resumed box, `spentLead`), and the page's in-flow bottom compared with its content height as the driver compares it. A page that fits ends at the forced event or at the document's end; one that does not has the Stonehand rank the candidates (`adjudicate`).
 * 5. The verdict as the page's end (`cutOf`). A Class A boundary before a box is that box's position entered down its first-child chain (`enter`), the fragmented view's convention for a cut; a Class B cut between lines is the position of the first character the line after the cut shows, a word and, where the line begins inside it, a character (`placeAt`, `wordPoint`), so the breaking space before it stays on this page; a start-edge Class C resumes before the child after the gap. The three verdicts that continue a box in a form one position cannot say are built as the engine builds them (`shells.js` says what each side shows): the page edge's cut through a box (`E`) ends the page at the box's own position and the page after paints it, an end-gap Class C ends it after the box and the page after shows it as a blank shell, and a cut through a row ends it at the last item's place and gives every other item a piece of its own. Each is said to the page after in the hint (`next`: `at`, the position it was left for, `shell` and `row.items`).
 * 6. The page. The slice from `from` to the cut's own end (`openedAt(doc, to)`, or past `to` to the end of a box the page shows whole) is rendered into the page (`setContent`), the row pieces seated, the shells made, the tables and grids the page divides pinned to the tracks the trial laid them out at (`pinTracks`), the flow given the lead, the extent the verdict used and the extension a divided box takes (`setFlow`, `extensionPx`), and the answer is `{ to, next }` (`hintAfter`).
 *
 * The page never throws (*the build cannot fail*, C2). A verdict that maps to no position (a cut inside a leaf, which a schema's atom has none of) or to the page's own start with nothing entered or shrunk (`advances`) is an uncuttable run at the page's start: the node there is taken whole (`wholeAfter`), rendered as it is, its overflow clipped by the page as the engine's own page clips it, and the console says so once, with the page and the node's type.
 *
 * Where this departs from the driver's loop, each is a finding recorded in docs/results.md: the Cast-off's word estimate is the view's span; a parallel flow carried across a cut (a float, an absolutely positioned box) has no place in a position; a nested row cut inside a row item is taken whole; the root's parity demand on the first page is not read; and the page takes no reads (no folio, no `counter(pages)`, no strings, no running elements in the margins, no author counters delivered at the page's start: `setCounters` is phase 2's).
 *
 * The page resets the text mechanics the fragmented view's editing host sets (`white-space: break-spaces`, `overflow-wrap`, the ligatures and, from the editing host's own UA style, `line-break`) to what the document's body computes, because the trial in the measure context inherits from the body and the page's content inherits from the host. Measured 2026-10-24 with the reset left out: the cuts were the same, since the trial decides them, but the specimen's third page set its text on more lines than the trial had and its clip hid 21 of its 113 words, and the flow fixture differed from its first page.
 *
 * The page presents what it renders (*a copy may be presented*, the engine's `presenters.js`): the renderer writes the author's element, where the engine's `copyOf` makes every copy of a source a presenter matches the presenter's element instead, so before a trial is measured every such element of the trial and of the law copy is replaced by what the presenter makes from the law copy's element, which is connected and so has the computed style the presenter reads, and the shown page's after it is given (`presentTree`). The presented element stands for its node in the slice's positions, the walk does not descend into it, and the trial's is paired with the law's and registered against it (`noteSource`), as the law is the trial's source. The intake the presenter needs, a facsimile's page sizes, is the factory's (`intake`, `takeFacsimile` in `containers.js`), awaited before the presenting. Measured 2026-10-25 on the facsimile fixture and the studio's demo: unpresented, an `<object type="application/pdf">` stood 150 px tall in the studio, Chromium's default, and 0 in BelType's page, whose head hides one outside a root.
 *
 * The law copy is measured too (2026-10-24): with the trial read as its own source, the flow fixture's fourth page cut between the lines of its `break-inside: avoid` box, which the CLI moves whole, and every page after it differed (22 pages against the CLI's 26).
 *
 * @packageDocumentation
 */

import { openedAt, pointAt, posAt } from 'prosemirror-fragview';
import { addWord, AWAY, ADJOIN, END, SPLIT, hasWord, removeWord } from '@egildo/beltype-engine-cicero/src/data-beltype.js';
import { createMeasureContext, awaitFonts, awaitCloneImages } from '@egildo/beltype-engine-cicero/src/measure.js';
import { takeReport } from '@egildo/beltype-engine-cicero/src/gauge.js';
import { adjudicate, reachesBelowTheEdge, isOutOfFlow, neverCutInside } from '@egildo/beltype-engine-cicero/src/stonehand.js';
import { forcingIndexOf } from '@egildo/beltype-engine-cicero/src/driver.js';
import { effectivePageName } from '@egildo/beltype-engine-cicero/src/capture.js';
import { pathOf, normalizePath, extensionPx, divides } from '@egildo/beltype-engine-cicero/src/positions.js';
import { joinedWords } from '@egildo/beltype-engine-cicero/src/fragments.js';
import { blockChildrenOf, isFixedBox, noteSource } from '@egildo/beltype-engine-cicero/src/word-space.js';
import { presentation } from '@egildo/beltype-engine-cicero/src/presenters.js';
import '@egildo/beltype-engine-cicero/src/chase.js';
import { firstSpan, conditionOf, hintAfter, hintAfterBlank, enter, verdictPosition, wholeAfter, advances, inFlowStart } from './turn.js';
import { Positions, nodeDom, nodeStart, continueAsShell, endAsShell, seatPieces, shellsOf, endsOf, pinTracks } from './shells.js';

/** @import { Node as PMNode } from 'prosemirror-model' */
/** @import { FillResult, RenderedSlice, SliceRenderer, ContainerHint } from 'prosemirror-fragview/src/fragmentainer.js' */
/** @import { Shell, Piece } from './shells.js' */

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
 * @property {Map<Element, number>} shelled The trial's blank shells, each the shallow sibling it was made of, by the position of its node: an element the renderer wrote no span for.
 */

/**
 * What a page begins with besides its slice, as the fill before it left it in its hint: the box it continues as a shell, and the pieces of a row it resumes.
 * @typedef {{ shell?: Shell, pieces?: Piece[] }} Start
 */

/**
 * A verdict as the page's end (`cutOf`): `to`, where the next page begins; `end`, where the page's own slice is rendered to, past `to` for a box continued as a shell; `shell`, the box the page shows whole and cut at its end; `pieces`, this page's row items; `next`, what the page after begins with.
 * @typedef {{ to: number | null, end?: number, shell?: Shell, pieces?: Piece[], next?: Start }} Cut
 */

/** The hidden holder every page's law copy stands in: in the document, so its elements have a computed style, and outside the measure context, so the neutralizing sheet does not reach them. The shown page's slice is presented in another of the same kind (`show`). */
function lawHolder(/** @type {Document} */ doc, id = '__prosemirror-beltype-law') {
  let holder = doc.getElementById(id);
  if (!holder) {
    holder = doc.createElement('div');
    holder.id = id;
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
   * @param {() => Promise<void>} [a.intake] What the presenters need before a trial is presented, the factory's (`takeFacsimile`); nothing by default.
   */
  constructor({ table, index, hint, document = globalThis.document, intake = async () => {} }) {
    this.table = table;
    this.intake = intake;
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
      this.account = { from, to: from, name: this.conditions.name, kind: 'blank', cls: null, next: hintAfterBlank(this.hint) };
      return { to: from, next: hintAfterBlank(this.hint) };
    }
    const forced = !!this.hint.forced;
    // What the page begins with besides its slice: a shell, a row's pieces. The view hands a page its hint once, when it builds it, so the hint is read only for the position it was left for.
    /** @type {Start} */
    const start = this.hint.at === from ? { shell: this.hint.shell, pieces: this.hint.row?.items } : {};
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
    // The page's start as the driver's cursor stands: its first in-flow box, past a running element, a fixed box or a whitespace leaf at `from` (`inFlowStart`).
    let first = from;
    for (let pours = 1; ; pours++) {
      end = this.boundAt(doc, from + span);
      t = this.trial(doc, from, end, render, forced, start);
      // The bound never falls inside a box whose layout reads its whole interior (the Cast-off's rule, `neverCutInside`): a monolith, a parallel flow, a table, a flex or grid container.
      const sealed = end == null ? null : this.sealedEnd(t, doc, end);
      if (sealed !== end) t = this.trial(doc, from, (end = sealed), render, forced, start);
      if (!ctx) {
        first = inFlowStart(doc, from, (pos) => { const el = nodeDom(t.lawRoot, t.law.positions, doc, pos); return !!el && isFixedBox(el); });
        // Entry N determines page N+1's conditions (C8): the name is the content's own at the page's start.
        this.conditions = this.conditionsFor(this.nameAt(t, first));
        ctx = createMeasureContext(this.doc, this.conditions.contentW);
      }
      ({ report, pageStart } = await this.measure(ctx, t, truncateLead, doc, from, start));
      if (end == null || reachesBelowTheEdge({ report, sourceOf: this.sourceOf(t), pageStart, contentHeight: this.conditions.contentH })) break;
      span *= 2;
    }

    // The grab: the first forcing event strictly after the page's start, in the trial; an event at the first in-flow box named the page above, and does not end it.
    const event = this.grab(t, first);
    /** @type {number | null} */
    let eventTo = null;
    let eventName = '';
    if (event) {
      eventTo = enter(doc, /** @type {any} */ (t.law.positions.get(event.el)).start);
      eventName = this.nameAt(t, eventTo);
      // The feed is cut at the event, as the driver's grab cuts it, and measured again.
      end = openedAt(doc, eventTo);
      t = this.trial(doc, from, end, render, forced, start);
      ({ report, pageStart } = await this.measure(ctx, t, truncateLead, doc, from, start));
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
    let whole = null;
    /** @type {Cut | null} */
    let cut = null;
    if (!fits) {
      verdict = adjudicate({ report, sourceOf, pageStart, contentHeight: contentH });
      // No verdict: one uncuttable run taller than the page overflows in place (C2), and the page ends where it would have.
      if (verdict) {
        cut = this.cutOf(doc, t, verdict, report, start, from);
        to = cut ? cut.to : null;
        nextName = to == null ? '' : this.nameAt(t, to);
        usedPx = verdict.y - pageStart;
        cost = verdict.cost ?? 0;
        // A verdict that maps to no position (a cut inside a leaf), or to the page's own start with no shell that shrank and no row item that moved, is an uncuttable run at the page's start: the driver lets it overflow in place (*the build cannot fail*, C2), and so does the page.
        if (!cut || !advances(from, start, cut)) {
          whole = wholeAfter(doc, from);
          console.warn(`prosemirror-beltype: page ${this.index + 1} cannot be cut after ${from} (a ${verdict.kind} verdict mapped to ${cut ? cut.to : 'no position'}); the ${whole.node?.type.name ?? 'content'} there is taken whole and overflows the page, clipped`);
          cut = null;
          to = whole.to;
          nextName = to == null ? '' : this.nameAt(t, to);
          const el = whole.node && t.container ? nodeDom(t.container, t.trial.positions, doc, whole.at) : null;
          usedPx = Math.max(contentH, ((el && report.boxOf(el)?.rect.bottom) || report.flowBottom) - pageStart);
          cost = 0;
        }
      }
    }

    const startCut = this.addressAt(t, first);
    const endCut = to == null ? null : this.addressAt(t, to);
    // A page that ends in a shell takes no extension, nor one that resumes a painted shell (`extensionPx`, *the end gap takes no extension*); a row's divided items reach the foot.
    const shellEnd = !!cut?.shell && !cut.pieces?.length;
    const extPx = endCut && !whole && !shellEnd && start.shell?.paint == null ? extensionPx({ blank: false, start: { b: startCut.b, cut: startCut.cut }, end: { b: endCut.b, cut: endCut.cut }, closes: { contentH } }, { usedPx, cost }) : 0;
    // The tracks the trial laid its tables and grids out at, read before the measure context goes, for the pieces of them the page holds.
    /** @type {Map<number, any>} */
    const tracks = new Map();
    for (const box of report.boxes()) {
      const read = report.tracksOf(box);
      const at = read ? this.nodeOf(doc, t, box.el) : null;
      if (at != null) tracks.set(at, read);
    }
    ctx.dispose();

    this.show(this.page(doc, from, render, t, start, cut ?? { to }, tracks), forced);
    t.lawRoot.replaceChildren();
    this.dom.setFlow({ leadPx: pageStart, usedPx, extPx, costPx: extPx > 0 ? cost : 0 });
    this.to = to;
    if (to != null) this.span = to - from;
    for (const node of /** @type {Element[]} */ (this.given())) {
      this.heights.set(node, node.getBoundingClientRect().height);
      this.observer.observe(node);
    }
    const byEvent = event && to === eventTo;
    const next = to == null ? undefined : { ...hintAfter({ index: this.index, name: nextName, forced: !!byEvent, parity: byEvent ? event.parity : null }), ...shellHint(to, cut?.next) };
    this.account = { from, to, name: this.conditions.name, forced, cls: verdict?.cls ?? (byEvent ? 'A' : null), kind: whole ? 'whole' : verdict?.kind ?? (byEvent ? (event.namedSwitch ? 'name' : 'forced') : 'terminal'), y: verdict?.y ?? null, pageStart, usedPx, extPx, next };
    return next ? { to, next } : { to };
  }

  /**
   * Render the slice twice, seat the row pieces the page begins with in both, seat the law copy and pair the two, put away what takes no room in the flow, and make the trial's shells.
   * @param {PMNode} doc
   * @param {number} from
   * @param {number | null} end
   * @param {SliceRenderer} render
   * @param {boolean} forced The page begins at a forced break, which keeps the margin adjoining it.
   * @param {Start} start
   * @returns {Trial}
   */
  trial(doc, from, end, render, forced, start) {
    const trial = render(doc, from, end);
    const law = render(doc, from, end);
    const tp = new Positions(trial.positions);
    const lp = new Positions(law.positions);
    if (start.pieces) {
      seatPieces(trial.fragment, tp, doc, render, start.pieces);
      seatPieces(law.fragment, lp, doc, render, start.pieces);
    }
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
    // The shells after the pairing: a painted shell's wrapper is the engine's own element, with no source, as in the driver's feed. A blank shell's law is its shallow sibling, shown, so the Stonehand reads the box's own style off it.
    /** @type {Map<Element, number>} */
    const shelled = new Map();
    for (const shell of shellsOf(start)) {
      const source = nodeDom(lawRoot, lp, doc, shell.pos);
      if (source && shell.paint == null) removeWord(source, AWAY);
      const el = continueAsShell(trial.fragment, tp, doc, shell, source);
      if (el && shell.paint == null) shelled.set(el, shell.pos);
    }
    const blocks = [...lawRoot.children].filter((el) => !isFixedBox(el));
    return { trial: { ...trial, positions: /** @type {any} */ (tp) }, law: { ...law, positions: /** @type {any} */ (lp) }, lawOf, lawRoot, blocks, container: null, shelled };
  }

  /**
   * Where a trial whose span ends at `pos` is rendered to: past the textblock `pos` stands in, since the driver's bound falls only between blocks, or null at the document's end.
   * @param {PMNode} doc
   * @param {number} pos
   */
  boundAt(doc, pos) {
    if (pos >= doc.content.size) return null;
    const $pos = doc.resolve(pos);
    const at = $pos.parent.inlineContent && $pos.depth > 0 ? $pos.after() : pos;
    return at >= doc.content.size ? null : at;
  }

  /**
   * The bound moved past the outermost box the trial cuts off at `end` that the driver's bound never cuts inside (`neverCutInside`), read off the law copy, or `end` where there is none. The boxes the slice cuts off at its end are the ancestors of `end`, outermost first, each one element with `split` and no `end`.
   * @param {Trial} t
   * @param {PMNode} doc
   * @param {number} end
   * @returns {number | null}
   */
  sealedEnd(t, doc, end) {
    const $end = doc.resolve(end);
    const win = /** @type {Window} */ (this.doc.defaultView);
    const cut = [...t.lawRoot.querySelectorAll('*')].filter((el) => hasWord(el, SPLIT) && !hasWord(el, END) && t.law.positions.get(el));
    if (cut.length !== $end.depth) return end;
    const k = cut.findIndex((el) => neverCutInside(el, win.getComputedStyle(el)));
    if (k < 0) return end;
    const after = $end.after(k + 1);
    return after >= doc.content.size ? null : after;
  }

  /**
   * Lay the trial out in the measure context, await what the engine awaits, and take the report.
   * @param {ReturnType<typeof createMeasureContext>} ctx
   * @param {Trial} t
   * @param {boolean} truncateLead
   */
  async measure(ctx, t, truncateLead, doc, from, start) {
    await this.present(t);
    const container = ctx.measure([...t.trial.fragment.childNodes]);
    t.container = container;
    await awaitFonts(this.doc);
    await awaitCloneImages(container);
    const report = takeReport(container, { contentHeight: this.conditions.contentH });
    return { report, pageStart: truncateLead ? report.contentTop + this.spentLead(t, report, doc, from, start) : 0 };
  }

  /**
   * Present the trial and the law copy (*a copy may be presented*), once the intake is taken: each element of the trial a presenter matches is replaced by what the presenter makes from its law element, the law's by what it makes from itself, and the two presented elements are paired and the trial's registered against the law's. The law's top-level blocks are read again, since a presented element may be one.
   * @param {Trial} t
   */
  async present(t) {
    await this.intake();
    const trial = presentTree(t.trial.fragment, t.trial.positions, (x) => t.lawOf.get(x) ?? x);
    if (!trial.size) return;
    const law = presentTree(t.lawRoot, t.law.positions);
    for (const [x, made] of trial) {
      const own = law.get(/** @type {Element} */ (t.lawOf.get(x)));
      t.lawOf.delete(x);
      if (own) { t.lawOf.set(made, own); noteSource(made, own); }
    }
    t.blocks = [...t.lawRoot.children].filter((el) => !isFixedBox(el));
  }

  /**
   * The spent extent at the head of a continuation, the driver's `spentLeadOf` (a closure inside `paginateOnce`, written again here and named as a door in docs/results.md): where the page resumes inside a top-level block, the smallest gap that stands above the boxes it resumes at and is not their containers' own border and padding, read off this page's report (a table's border-spacing or its collapsed border above the row the page resumes at, a grid's spent track). Zero where the page begins at a block's start, and where it resumes a painted shell, whose box is pulled above the page on purpose. The driver's branch for a repeated table header is not written: this package repeats none.
   * @param {Trial} t
   * @param {ReturnType<typeof takeReport>} report
   * @param {PMNode} doc
   * @param {number} from
   * @param {Start} start
   */
  spentLead(t, report, doc, from, start) {
    if (start.shell?.paint != null || !divides(this.addressAt(t, from).cut)) return 0;
    const win = /** @type {Window} */ (this.doc.defaultView);
    const trialOf = new Map([...t.lawOf].map(([x, y]) => [y, x]));
    const container = /** @type {Element} */ (t.container);
    // The box a place names, as the driver's address names it: a shell's own box; the outermost box that opens at a position, which is what a bare path normalises to; the line stack a position stands in.
    const boxOf = (/** @type {number} */ pos, /** @type {boolean} */ shell) => {
      const opened = shell ? pos : openedAt(doc, pos);
      return opened < pos || shell ? nodeDom(container, t.trial.positions, doc, opened) : trialOf.get(this.boxAt(t, pos).el);
    };
    let lead = Infinity;
    const places = [start.shell ? boxOf(start.shell.pos, true) : boxOf(from, false), ...(start.pieces ?? []).map((p) => (p.from == null ? boxOf(p.pos, true) : boxOf(p.from, false)))];
    for (const el of places) {
      const box = el ? report.boxOf(el) : null;
      if (!box) return 0;
      let gap = 0;
      for (let child = box, a = box.parent; a; child = a, a = a.parent) {
        const cs = win.getComputedStyle(a.el);
        gap += child.rect.top - (a.rect.top + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.paddingTop) || 0));
      }
      lead = Math.min(lead, gap);
    }
    return lead > EPS ? lead : 0;
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
   * A verdict of the Stonehand's as the page's end (`Cut`), over the trial as the measure context laid it out: a boundary or a line as the position `to` (`verdictPosition`), the page edge's cut and an end gap as a shell, a cut through a row as its places (`rowCut`). Null where the verdict names a place no position or shell can say.
   * @param {PMNode} doc
   * @param {Trial} t
   * @param {any} v The verdict.
   * @param {ReturnType<typeof takeReport>} report
   * @param {Start} start
   * @param {number} from The page's start.
   * @returns {Cut | null}
   */
  cutOf(doc, t, v, report, start, from) {
    if (v.kind === 'R') return this.rowCut(doc, t, v, report, start, from);
    if (v.kind === 'E' || (v.kind === 'C' && v.edge !== 'start')) {
      // The edge's cut paints the box on the page after; an end gap leaves it a blank shell. The box is whole on this page and cut at its end, and `to` is the engine's reading of each (`posOfCut`): the box's start for a painted shell, its end for a blank one.
      const pos = this.nodeOf(doc, t, v.box.el);
      if (pos == null) return null;
      const box = /** @type {PMNode} */ (doc.nodeAt(pos));
      const painted = v.kind === 'E';
      /** @type {Shell} */
      const shell = { pos, remaining: v.box.rect.bottom - v.y, paint: painted ? v.y - v.box.rect.top : null };
      const at = painted ? pos : pos + box.nodeSize;
      if (at >= doc.content.size) return { to: null, end: at };
      return { to: enter(doc, at), end: pos + box.nodeSize, shell, next: { shell } };
    }
    const container = /** @type {Element} */ (t.container);
    const { pos } = verdictPosition(v, {
      pieces: (box) => report.wordsOf(box),
      words: (box) => joinedWords(box.el),
      posAt: (node, offset) => posAt(container, t.trial.positions, node, offset),
      enter: (p) => enter(doc, p)
    });
    return pos == null ? null : { to: pos };
  }

  /**
   * The position before the node a trial element was rendered for (`nodeStart`), or the one a blank shell the trial made stands for.
   * @param {PMNode} doc
   * @param {Trial} t
   * @param {Element} el
   */
  nodeOf(doc, t, el) {
    return nodeStart(el, t.trial.positions, doc, t.trial.from) ?? t.shelled.get(el) ?? null;
  }

  /**
   * A cut through a row as its places, one per item, as the driver's `rowPlaceOf` reads them off the verdict: an item wholly above the height has nothing left (a blank shell of no height, which keeps its column); one wholly below it, or a monolith the height crosses, resumes whole at its start; one the height divides resumes where its own verdict says, and one that holds nothing to show (stretched by the row) as a blank shell of what it has left. The last item's place is the page's own, `to`; every other item is a piece, rendered on this page from where it began here to its place and on the next page from its place to its end.
   * @param {PMNode} doc
   * @param {Trial} t
   * @param {any} v
   * @param {ReturnType<typeof takeReport>} report
   * @param {Start} start
   * @param {number} from
   * @returns {Cut | null}
   */
  rowCut(doc, t, v, report, start, from) {
    const incoming = new Map((start.pieces ?? []).map((p) => [p.pos, p]));
    /** @type {Piece[]} */
    const pieces = [];
    /** @type {Piece[]} */
    const next = [];
    /** @type {{ to: number, end: number, shell?: Shell } | null} */
    let main = null;
    const seen = new Set();
    for (const [i, { item, state, verdict }] of /** @type {any[]} */ (v.items).entries()) {
      const pos = this.nodeOf(doc, t, item.el);
      if (pos == null) return null;
      seen.add(pos);
      const itemEnd = pos + /** @type {PMNode} */ (doc.nodeAt(pos)).nodeSize;
      /** @type {Piece} */
      const base = incoming.get(pos) ?? { pos };
      const resumes = base.from ?? pos;
      /** @type {{ to: number, end?: number, shell?: Shell, page: Piece | null, next: Piece }} */
      let place;
      const own = (/** @type {number} */ remaining) => {
        const shell = { pos, remaining, paint: null };
        return { to: enter(doc, itemEnd), end: itemEnd, shell, page: base.from != null || base.shell || remaining > 0 ? { ...base, ...(remaining > 0 ? { end: shell } : {}) } : null, next: { pos, shell } };
      };
      if (state === 'above') place = own(0);
      else if (state === 'below' || state === 'held') place = { to: enter(doc, pos), page: { pos, empty: true }, next: { ...base, from: resumes } };
      else if (verdict) {
        const sub = this.cutOf(doc, t, verdict, report, {}, from);
        if (!sub || sub.pieces || sub.to == null) return null;
        const to = sub.to;
        place = { to, end: sub.end, shell: sub.shell, page: { ...base, from: resumes, to: sub.end ?? openedAt(doc, to), ...(sub.shell ? { end: sub.shell } : {}) }, next: { pos, from: to, ...(sub.shell ? { shell: sub.shell } : {}) } };
      } else place = own(item.rect.bottom - v.y);
      // A page whose own flow shows nothing past its start (the last item spent, the earlier ones still going) is still rendered to the row's end, so the row stands in it for the pieces to be seated in.
      if (i === v.items.length - 1) main = { to: place.to, end: Math.max(place.end ?? openedAt(doc, place.to), from < itemEnd ? 0 : doc.resolve(pos).after()), shell: place.shell };
      else {
        if (place.page) pieces.push(place.page);
        next.push(place.next);
      }
    }
    if (!main) return null;
    // A row the page resumed and does not cut again is shown from where it resumed.
    for (const [pos, p] of incoming) if (!seen.has(pos)) pieces.push(p);
    return { to: main.to, end: main.end, shell: main.shell, pieces, next: { shell: main.shell, pieces: next } };
  }

  /**
   * The page's own slice: rendered from `from` to the cut's `end`, the row pieces seated, the shells the page begins with made, and the boxes it ends with cut at their end. A painted shell the page both resumes and ends with is left to its slice, as the engine leaves a painted start (`fragmentOf`).
   * @param {PMNode} doc
   * @param {number} from
   * @param {SliceRenderer} render
   * @param {Trial} t
   * @param {Start} start
   * @param {Cut} cut
   * @param {Map<number, any>} tracks The trial's tables' and grids' tracks, by position (`pinTracks`).
   * @returns {RenderedSlice}
   */
  page(doc, from, render, t, start, cut, tracks) {
    const end = cut.end ?? (cut.to == null ? null : openedAt(doc, cut.to));
    const rendered = render(doc, from, end);
    const positions = new Positions(rendered.positions);
    const root = rendered.fragment;
    seatPieces(root, positions, doc, render, cut.pieces ?? start.pieces ?? []);
    const law = (/** @type {Shell} */ shell) => nodeDom(t.lawRoot, t.law.positions, doc, shell.pos);
    const begins = shellsOf({ shell: start.shell, pieces: cut.pieces ?? start.pieces });
    for (const shell of begins) continueAsShell(root, positions, doc, shell, law(shell));
    for (const shell of endsOf(cut)) if (!begins.some((b) => b.pos === shell.pos && b.paint != null)) endAsShell(root, positions, doc, shell, law(shell));
    pinTracks(root, positions, doc, tracks, rendered.from);
    return { ...rendered, positions: /** @type {any} */ (positions) };
  }

  /**
   * Show a rendered slice: presented (`presentTree`), given to the page through its content door, with what takes no room put away and, after a forced break, the adjoining margin kept.
   *
   * @remarks
   * The slice is presented in a hidden holder of its own before it is given, since the presenter reads the element's computed style and so needs it connected, and an element presented in the page itself is never laid out where the page was off screen: measured 2026-10-25, the facsimile fixture's landscape page, filled while the page's `content-visibility: auto` skipped its contents, kept no box at all once it was on screen, and a copy of it put in its place had its 533 × 400.
   * @param {RenderedSlice} rendered
   * @param {boolean} [forced]
   */
  show(rendered, forced = false) {
    this.rendered = rendered;
    const staging = lawHolder(this.doc, '__prosemirror-beltype-staging');
    staging.replaceChildren(rendered.fragment);
    presentTree(staging, rendered.positions);
    this.dom.setContent(...staging.childNodes);
    for (const node of /** @type {Element[]} */ (this.given())) {
      for (const el of [node, ...node.querySelectorAll('*')]) {
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
 * What the hint a cut leaves carries besides the page name: the position it was left for, and the shell and the row pieces the next page begins with.
 * @param {number} to
 * @param {Start | undefined} next
 */
function shellHint(to, next) {
  if (!next || (!next.shell && !next.pieces?.length)) return {};
  return { at: to, ...(next.shell ? { shell: next.shell } : {}), ...(next.pieces?.length ? { row: { items: next.pieces } } : {}) };
}

/**
 * Present what a rendered tree holds, as the engine's `copyOf` presents a copy: every element a registered presenter matches is replaced by the presenter's element, which stands for the same node in `positions` and carries the words the element earned (the presenter copies its attributes, `data-beltype` among them), and the walk does not descend into it. A door the engine could open instead is filed in docs/results.md ("The page presents what it renders").
 * @param {ParentNode} root
 * @param {{ get(node: Node): any, set(node: Node, span: any): unknown }} positions
 * @param {(el: Element) => Element} [sourceFor] The connected element the presenter is asked about and makes from, since it reads the computed style; the element itself by default.
 * @returns {Map<Element, Element>} Each element replaced, to what replaced it.
 */
function presentTree(root, positions, sourceFor = (el) => el) {
  /** @type {Map<Element, Element>} */
  const swaps = new Map();
  for (const el of [...root.querySelectorAll('*')]) {
    if (!root.contains(el)) continue; // inside an element presented already
    const made = presentation(sourceFor(el));
    if (!made) continue;
    el.replaceWith(made);
    const span = positions.get(el);
    if (span) positions.set(made, span);
    swaps.set(el, made);
  }
  return swaps;
}

/**
 * The text standing in `el` before its descendant `child`, less what a running element or a fixed box holds, which is no line of the container's (the driver counts words, and those boxes have none in its word space).
 * @param {Element} el
 * @param {Element} child
 */
function textBefore(el, child) {
  const walk = /** @type {Document} */ (el.ownerDocument).createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeType === 1 && isFixedBox(/** @type {Element} */ (n)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  let text = '';
  for (let n = walk.nextNode(); n && n !== child; n = walk.nextNode()) if (n.nodeType === 3) text += /** @type {Text} */ (n).data;
  return text;
}
