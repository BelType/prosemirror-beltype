/**
 * `Chain`, the factory's chain object: what relates the view's chain of pages, the Ledger (`ledger.js`) and the engine's reads loop, kept beside the state and never in it.
 *
 * @remarks
 * *The memos are not state* (Egildo, 2026-10-25). The whole rendering (`Originals`), the live pages by their entry's key and the rows waiting for a transaction live here, on an object the factory owns; the Ledger plugin holds the data. A new object beside `Originals` rather than `Originals` grown: `Originals` is one rendering of one state and what is read off it, a memo the pages read synchronously in every fill, and this object is the chain's life across states, which needs the view (to dispatch, and to read the spine) and is reached only through the Ledger plugin's view. Egildo names both finally.
 *
 * THE THREE DOORS.
 * 1. `settled(doc)`, a promise resolved at the first state of `doc` in which no entry is dirty, the last entry runs to the document's end and no dirtying this object owes is pending: `{ complete: true }`. Resolved with `{ complete: false, why }` where the chain stops short (a dirty entry and no fill in flight after the view's update: the window policy left it unbuilt, the browser is composing, or a page's fill threw), and rejected with `Overtaken` when a newer document arrives first. The view's own signals, read where the view gives them: the plugin view's `update` comes after the view's `refresh`, which has started the next fill when there is one, and each page says when its fill begins and ends (`began`, `filled`). Nothing polls.
 * 2. `account(view)`, the Ledger's rows in the chain's order, in the shape of the driver's account (`accountOf`): `pos` the word position of the page's end, `cut.path[0]` the top-level block it stands in, `closes` the page's number, content box, counters and strings. Its `index` is the originals' own.
 * 3. `resume(view, at, ...)`, the loop's `resume.at` (the addresses, in the originals' position space, of the boxes whose lines a delivered value moved) mapped to the pages that hold them through the account's intervals (`pageIntervals`, `pageContaining`, the engine's own), and each such page and the one before it dirtied through the view's `dirtied`, earliest first: the driver restarts one page before the page holding the edit, since a cut reads what it pushed to the next page.
 *
 * THE LOOP SEATED (*the engine knows no view*, ruling 3: the loop is the engine's, `run` is the door). Once per document, after the view's update that started its first fill (`update`, through the Ledger's plugin view), `settleReads` runs with `blocksOf` the originals' blocks, `originals` the holder's children, the Ledger's warm tables, `hide` scoped to `beltype-page`, `keep` the engine memo's door the originals settled for the state (so the site search, the position index and the written facts take the parts of the top-level boxes the edit did not replace), and `run` this object's: the first attempt is the chain as the view fills it for that state, awaited `settled`; a later one dirties the pages `resume.at` names and awaits `settled` again. Each returns `{ account, index, resumed, why, laidFacts }`, `laidFacts` the page values each page was laid out under, which the loop compares the truth with. The settle is synchronous up to its first `await run`, so its delivery sheet and its reservations are adopted before the first trial of the state is measured (a fill measures after its first `await`). A newer document overtakes a settle: its pending `run` rejects, and since the loop delivers only after a `run` returns, an overtaken settle never writes again; its results are not recorded. The loop's result (`delivered`, `facts`, `resumed`, `why`, `reads`) is written into the Ledger by one transaction outside the history.
 *
 * THE CHROME OF CLEAN PAGES (docs/found.md, "A page an edit does not refill keeps the chrome it was drawn with"). On a new document every clean page's interval, translated by the view's mapping, is read again off the new rendering (`stateOfPage`), and its row is staged for the next transaction on that document; a page whose counters, strings or running elements moved, by value or by a running element it places being replaced by one of other content (`runningPlaced`, `sameElements`), has its chrome redrawn without a refill (`drawChrome`), unless its strings moved and a flow site that reads a page fact stands on it (`Originals.sitesIn`), which is a line that may move, so the page is dirtied (`dirtied`, deferred to a microtask so the view's update is not re-entered). Counters are chrome (*the run resumes from an entry*: named strings, running elements and counters reach no cut).
 *
 * THE VIEW'S INVALIDATION. `invalidate()` releases every built container at once, which nothing else does (the window policy keeps the near ones built): the last release tells the originals to forget their rendering and its kept parts (`Originals.forget`), before the first new fill asks for them, so the conditions that moved are read afresh over a whole rendering.
 *
 * @packageDocumentation
 */

import { settleReads } from '@egildo/beltype-engine-cicero/src/reads.js';
import { pageIntervals, pageContaining, elAt } from '@egildo/beltype-engine-cicero/src/positions.js';
import { fragmentsKey, dirtied } from 'prosemirror-fragview';
import { ledgerKey, keyOf, accountOf } from './ledger.js';
import { stateOfPage, runningPlaced, sameElements } from './originals.js';
import { parityAt } from './turn.js';

/** @import { Node as PMNode } from 'prosemirror-model' */
/** @import { Entry } from 'prosemirror-fragview/src/fragments-plugin.js' */
/** @import { Originals } from './originals.js' */
/** @import { CiceroPage } from './cicero-page.js' */
/** @import { Row } from './ledger.js' */

/** A settle a newer document overtook: its `run` is refused, so the loop stops without delivering again. */
export class Overtaken extends Error {
  constructor() {
    super('prosemirror-beltype: a newer document overtook the settle');
  }
}

const same = (/** @type {unknown} */ a, /** @type {unknown} */ b) => JSON.stringify(a) === JSON.stringify(b);

export class Chain {
  /**
   * @param {object} a
   * @param {Originals} a.originals
   * @param {{ pageFor: (cond: object) => any }} a.table
   * @param {Document} a.document
   */
  constructor({ originals, table, document }) {
    this.originals = originals;
    this.table = table;
    this.document = document;
    /** The live pages, by their entry's key. @type {Map<number, CiceroPage>} */
    this.pages = new Map();
    /** The live pages, by their index in the chain, which a container keeps for its life. @type {Map<number, CiceroPage>} */
    this.byIndex = new Map();
    /** The view, once the Ledger's plugin view hands it over. @type {any} */
    this.view = null;
    /** The document the last update saw. @type {PMNode | null} */
    this.doc = null;
    /** @type {ReadonlyArray<Entry>} */
    this.entries = [];
    /** Rows computed for a document, waiting for a transaction on it (`takeRows`). @type {{ doc: PMNode | null, rows: Map<number, Row> }} */
    this.pending = { doc: null, rows: new Map() };
    /** @type {{ doc: PMNode, resolve: (v: { complete: boolean, why: string | null }) => void, reject: (e: Error) => void }[]} */
    this.waiters = [];
    /** Fills begun and not ended. */
    this.inflight = 0;
    /** Dirtyings deferred to a microtask, not yet dispatched. */
    this.owed = 0;
    /** The pages filled for the current document, and for the current resumed run. @type {{ doc: PMNode | null, pages: Set<number> }} */
    this.cut = { doc: null, pages: new Set() };
    /** @type {Set<number> | null} */
    this.runCut = null;
    /** Why the next settle's first layout is whole, where it is. @type {string | null} */
    this.reason = null;
    /** The chain's length before the current document. */
    this.lengthBefore = 0;
    /** What the measurement reads: pages redrawn without a refill, dirtied for a flow site, fills ended, and each settle. */
    this.counts = { redrawn: 0, dirtied: 0, fills: 0 };
    /** @type {any[]} */
    this.settles = [];
    /** The last settle's promise, for a reader that awaits it. @type {Promise<any> | null} */
    this.settling = null;
    /** @type {Map<string, boolean>} */
    this.sidedness = new Map();
    /** What the last new document cost inside the view's update: the clean pages' chrome read again, and the settle up to its first `run` (the site search, the position index, the written and cascade facts, the delivery). */
    this.timing = { rechrome: 0, settle: 0 };
  }

  /** @param {CiceroPage} page */
  adopt(page) {
    if (page.key != null) this.pages.set(page.key, page);
    this.byIndex.set(page.index, page);
  }

  /** @param {CiceroPage} page */
  released(page) {
    if (page.key != null && this.pages.get(page.key) === page) this.pages.delete(page.key);
    if (this.byIndex.get(page.index) === page) this.byIndex.delete(page.index);
    // Every live page released is the view's `invalidate()`, the one act that releases them all (the window policy keeps the near ones built): the conditions moved, so the originals forget their rendering and its kept parts before the first new fill asks for them.
    if (!this.byIndex.size) this.originals.forget();
  }

  /** @param {CiceroPage} _page */
  began(_page) {
    this.inflight++;
  }

  /**
   * A page's fill ended: its row staged for the next transaction on `doc`, which is the `refilled` the view dispatches next.
   * @param {CiceroPage} page
   * @param {PMNode} doc
   * @param {{ to: number | null }} _answer
   */
  filled(page, doc, _answer) {
    this.inflight--;
    this.counts.fills++;
    // A fill of a document a newer one overtook is the view's to discard, and so is its row.
    if (!this.view || doc !== this.doc) return;
    if (this.cut.doc !== doc) this.cut = { doc, pages: new Set() };
    this.cut.pages.add(page.index);
    this.runCut?.add(page.index);
    const row = this.rowOf(page, doc);
    if (row && page.key != null) this.stage(doc, page.key, row);
  }

  /**
   * A page's fill threw: the view records nothing, so the chain stops here.
   * @param {CiceroPage} page
   * @param {PMNode} doc
   * @param {any} error
   */
  failed(page, doc, error) {
    this.inflight--;
    const why = `page ${page.index + 1}'s fill threw: ${error?.message ?? error}`;
    this.waiters = this.waiters.filter((w) => (w.doc === doc ? (w.resolve({ complete: false, why }), false) : true));
  }

  /**
   * The row of a page as its last fill or reading left it, over the rendering of `doc`: its end and the block that end stands in are the page's own record (`chrome.end`, `chrome.block`).
   * @param {CiceroPage} page
   * @param {PMNode} doc
   * @returns {Row | null}
   */
  rowOf(page, doc) {
    const c = page.chrome;
    if (!c || this.originals.state?.doc !== doc) return null;
    const g = page.conditions;
    const next = page.account?.next ?? null;
    return {
      name: g.name,
      parity: parityAt(page.index),
      blank: page.blank,
      counters: c.counters,
      strings: c.strings,
      running: c.running,
      end: c.end,
      block: c.block ?? null,
      laid: page.publish ?? null,
      contentW: g.contentW,
      contentH: g.contentH,
      next,
      key: keyOf({ index: page.index, cls: page.account?.cls, forced: !!page.hint.forced, next, sided: this.sided(g.name) })
    };
  }

  /**
   * Whether a page of this name has another geometry on a left page than on a right one, so its parity can change a cut.
   * @param {string} name
   */
  sided(name) {
    let answer = this.sidedness.get(name);
    if (answer == null) {
      const box = (/** @type {'left' | 'right'} */ parity) => { const g = this.table.pageFor({ name, first: false, parity, blank: false }); return [g.pageW, g.pageH, g.contentW, g.contentH, g.margins]; };
      answer = !same(box('left'), box('right'));
      this.sidedness.set(name, answer);
    }
    return answer;
  }

  /**
   * @param {PMNode} doc
   * @param {number} key
   * @param {Row} row
   */
  stage(doc, key, row) {
    if (this.pending.doc !== doc) this.pending = { doc, rows: new Map() };
    this.pending.rows.set(key, row);
  }

  /**
   * The rows staged for `doc`, taken: the Ledger plugin's `appendTransaction` writes them into the state that holds `doc`.
   * @param {PMNode} doc
   * @returns {[number, Row][]}
   */
  takeRows(doc) {
    if (this.pending.doc !== doc || !this.pending.rows.size) return [];
    const rows = [...this.pending.rows];
    this.pending.rows = new Map();
    return rows;
  }

  /** @param {any} view */
  attach(view) {
    this.view = view;
    this.update(view);
  }

  detach() {
    for (const w of this.waiters) w.reject(new Overtaken());
    this.waiters = [];
    this.view = null;
  }

  /**
   * A state reached the view: on a new document the clean pages' chrome is read again and a settle begins; on an invalidation (every entry dirtied at once) a settle begins; then the waiters are answered.
   * @param {any} view
   */
  update(view) {
    const doc = view.state.doc;
    const entries = fragmentsKey.getState(view.state)?.entries ?? [];
    const invalidated = this.doc === doc && entries.length > 0 && entries.every((e) => e.dirty) && this.entries.some((e) => !e.dirty);
    if (doc !== this.doc || invalidated) {
      const first = this.doc == null;
      this.lengthBefore = this.entries.length;
      this.doc = doc;
      this.reason = first ? 'the chain\'s first fill' : invalidated ? 'the view was invalidated: every entry dirtied' : null;
      const t0 = performance.now();
      if (!first && !invalidated) this.rechrome(view, entries);
      const t1 = performance.now();
      this.entries = entries;
      this.settle(doc);
      this.timing = { rechrome: t1 - t0, settle: performance.now() - t1 };
    }
    this.entries = entries;
    this.check(view);
  }

  /**
   * Answer the waiters: done, stopped short, or overtaken.
   * @param {any} view
   */
  check(view) {
    if (!this.waiters.length) return;
    const doc = view.state.doc;
    const entries = fragmentsKey.getState(view.state)?.entries ?? [];
    const done = entries.length > 0 && !entries.some((e) => e.dirty) && entries[entries.length - 1].to == null && !this.owed;
    const stopped = !done && !this.owed && this.inflight === 0;
    this.waiters = this.waiters.filter((w) => {
      if (w.doc !== doc) w.reject(new Overtaken());
      else if (done) w.resolve({ complete: true, why: null });
      else if (stopped) w.resolve({ complete: false, why: 'the view filled no dirty entry after its update: the window policy left it unbuilt, or the browser is composing' });
      else return true;
      return false;
    });
  }

  /**
   * The first door: the chain settled for `doc`.
   * @param {PMNode} doc
   * @returns {Promise<{ complete: boolean, why: string | null }>}
   */
  settled(doc) {
    return new Promise((resolve, reject) => {
      this.waiters.push({ doc, resolve, reject });
      if (this.view) this.check(this.view);
    });
  }

  /**
   * The hint the page before `page` left at its last fill, which is what the view recorded for it; `{}` for the first page, and `undefined` where the page before is not built or has not filled, so the page keeps the one it was built with. Read by index, so it needs no view and holds in a state without the Ledger plugin.
   * @param {CiceroPage} page
   * @returns {Record<string, any> | undefined}
   */
  hintFor(page) {
    if (page.index === 0) return {};
    const prev = this.byIndex.get(page.index - 1);
    return prev?.account ? prev.account.next ?? {} : undefined;
  }

  /**
   * The rows in the chain's order, as the Ledger holds them, a staged row standing in for one the state does not hold yet.
   * @param {any} view
   * @returns {Row[]}
   */
  rows(view) {
    const held = ledgerKey.getState(view.state)?.rows ?? new Map();
    const entries = fragmentsKey.getState(view.state)?.entries ?? [];
    const staged = this.pending.doc === view.state.doc ? this.pending.rows : new Map();
    return /** @type {Row[]} */ (entries.map((e) => staged.get(e.key) ?? held.get(e.key)).filter(Boolean));
  }

  /**
   * The second door: the account, in the driver's shape.
   * @param {any} view
   */
  account(view) {
    return accountOf(this.rows(view));
  }

  /**
   * The third door: dirty the pages that hold the boxes at `at` and the page before each, earliest first.
   * @param {any} view
   * @param {{ path: number[] }[]} at Addresses in the originals' position space.
   * @param {any} index The position index over `blocks`.
   * @param {Element[]} blocks
   * @param {any[]} account The layout the addresses were found in.
   * @returns {number[]} The indices dirtied.
   */
  resume(view, at, index, blocks, account) {
    const pages = pageIntervals(account, index.bases, index.endOf);
    /** @type {Set<number>} */
    const hit = new Set();
    for (const a of at) {
      const el = elAt(blocks, a.path);
      const entry = el ? index.entryFor(el) : null;
      const p = entry ? pageContaining(pages, { b: entry.block, w: entry.before }) : null;
      if (p == null) continue;
      if (p > 0) hit.add(p - 1);
      hit.add(p);
    }
    const order = [...hit].sort((a, b) => a - b);
    for (const i of order) {
      const entry = (fragmentsKey.getState(view.state)?.entries ?? [])[i];
      if (entry) view.dispatch(dirtied(view.state.tr, entry.key));
    }
    return order;
  }

  /**
   * On a new document, each clean page's interval read again off the new rendering, the chrome redrawn where its state moved, or the page dirtied where a flow site reads a string that moved; every clean page's row staged.
   *
   * @remarks
   * A clean page before the first dirty entry is passed over: nothing before it or in it changed, so its interval, its counters at its start and its strings and running elements over it are what they were. A run of clean pages after a dirty one is untouched by the edit, so its word positions moved by one amount and its blocks by one count: the first page of the run reads its interval off the rendering (`addressAt`, twice), and the others are shifted by the same amounts, which spares a walk of the block per page (measured on the showcase, a keystroke on page 3: 10 ms for 74 pages read each).
   * @param {any} view
   * @param {ReadonlyArray<Entry>} entries
   */
  rechrome(view, entries) {
    const doc = view.state.doc;
    const o = this.originals;
    const state = o.of(doc, view.render);
    const firstDirty = entries.findIndex((e) => e.dirty);
    /** @type {number[]} */
    const dirty = [];
    /** The shift of the clean run being read, in words and in blocks, null at a run's first page. @type {{ pos: number, block: number } | null} */
    let shift = null;
    /** The previous page's end, which is this page's start. @type {number | null} */
    let prevEnd = null;
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const page = this.pages.get(e.key);
      const c = page?.chrome;
      if (e.dirty || !page || !c) { shift = null; prevEnd = null; continue; }
      if (firstDirty < 0 || i < firstDirty) { prevEnd = c.end; continue; }
      /** @type {number} */
      let start;
      /** @type {{ pos: number, block: number } | null} */
      let endAt;
      if (!shift) {
        start = i === 0 ? 0 : prevEnd ?? o.addressAt(state, e.from).pos;
        endAt = e.to == null ? null : o.addressAt(state, e.to);
        shift = { pos: endAt && c.end != null ? endAt.pos - c.end : start - c.start, block: endAt && c.block != null ? endAt.block - c.block : 0 };
      } else {
        start = c.start + shift.pos;
        endAt = c.end == null ? null : { pos: c.end + shift.pos, block: (c.block ?? 0) + shift.block };
      }
      const end = page.blank ? start : endAt?.pos ?? null;
      prevEnd = end;
      const facts = stateOfPage(state, start, end);
      const strings = !same(facts.strings, c.strings);
      if (strings && o.sitesIn(state, e.from, e.to)) { dirty.push(e.key); continue; }
      const moved = strings || !same(facts.counters, c.counters) || !same(facts.running, c.running) || !sameElements(runningPlaced(facts.running, state.boxes), runningPlaced(c.running, c.boxes));
      page.chrome = { ...facts, boxes: state.boxes, start, end, block: endAt?.block ?? null };
      if (moved) { page.drawChrome(); this.counts.redrawn++; }
      const row = this.rowOf(page, doc);
      if (row) this.stage(doc, e.key, row);
    }
    if (!dirty.length) return;
    this.counts.dirtied += dirty.length;
    this.owed++;
    queueMicrotask(() => {
      this.owed--;
      for (const key of dirty) if (this.view === view && view.state.doc === doc) view.dispatch(dirtied(view.state.tr, key));
      if (this.view === view) this.check(view);
    });
  }

  /**
   * The engine's reads loop around the chain, once for `doc`.
   * @param {PMNode} doc
   */
  settle(doc) {
    const view = this.view;
    const o = this.originals;
    const state = o.of(doc, view.render);
    const value = ledgerKey.getState(view.state);
    const reason = this.reason;
    this.reason = null;
    const record = { doc, started: performance.now(), runs: /** @type {any[]} */ ([]), ms: 0, result: /** @type {any} */ (null), overtaken: false };
    this.settles.push(record);
    this.settling = settleReads(this.document, {
      run: (laid) => this.run(doc, /** @type {any} */ (laid), record, reason),
      blocksOf: () => state.blocks,
      originals: [...o.holder().children],
      warm: value?.delivered ?? null,
      warmFacts: value?.facts ?? null,
      hide: 'beltype-page',
      keep: state.keep
    }).then((result) => {
      record.ms = performance.now() - record.started;
      record.result = { resumed: result.resumed, why: result.why, reads: result.reads, complete: result.complete };
      if (this.view !== view || view.state.doc !== doc) return null;
      const settled = { delivered: result.delivered, facts: result.facts, resumed: result.resumed, why: result.why, reads: result.reads };
      view.dispatch(view.state.tr.setMeta(ledgerKey, { settled }).setMeta('addToHistory', false));
      return result;
    }, (error) => {
      record.ms = performance.now() - record.started;
      if (error instanceof Overtaken) { record.overtaken = true; return null; }
      console.warn(`prosemirror-beltype: the reads loop stopped (${error?.message ?? error})`);
      return null;
    });
  }

  /**
   * The loop's `run`: the first attempt is the chain as the view fills it, a later one the pages `laid.resume.at` names, refilled; both awaited settled.
   * @param {PMNode} doc
   * @param {{ attempt: number, index: any, resume?: { prior: any, at: { path: number[] }[] } | null }} laid
   * @param {{ runs: any[] }} record
   * @param {string | null} reason Why the first attempt is whole, where it is.
   */
  async run(doc, laid, record, reason) {
    const view = this.view;
    if (!view || view.state.doc !== doc) throw new Overtaken();
    const state = /** @type {any} */ (this.originals.state);
    const index = laid.index ?? state.index;
    const started = performance.now();
    let before = this.lengthBefore;
    let dirtiedPages = /** @type {number[]} */ ([]);
    if (laid.resume) {
      before = laid.resume.prior.account.length;
      this.runCut = new Set();
      dirtiedPages = this.resume(view, laid.resume.at, index, state.blocks, laid.resume.prior.account);
    } else this.runCut = null;
    const end = await this.settled(doc);
    const cut = laid.resume ? /** @type {Set<number>} */ (this.runCut) : this.cut.doc === doc ? this.cut.pages : new Set();
    this.runCut = null;
    const account = this.account(view);
    const n = account.length;
    const pages = [...cut].sort((a, b) => a - b);
    /** @type {any} */
    let resumed = null;
    /** @type {string | null} */
    let why = null;
    if (!laid.resume && reason) why = reason;
    else if (!pages.length) why = 'no page was cut again';
    else if (pages[0] === 0 && pages[pages.length - 1] === n - 1) why = 'every page was cut again';
    else {
      const last = pages[pages.length - 1];
      resumed = { from: pages[0] + 1, to: last + 1, shift: n - before, converged: last < n - 1, kept: n - 1 - last };
    }
    record.runs.push({ attempt: laid.attempt, ms: performance.now() - started, dirtied: dirtiedPages.map((i) => i + 1), cut: pages.map((i) => i + 1), complete: end.complete, why: end.why });
    // `laidFacts`: the page values each page was laid out under, its own interval's (`CiceroPage.publish`), which the loop compares the truth with in place of the table it handed this run (the engine's `settleReads`).
    return { account, index, resumed, why, complete: end.complete, laidFacts: this.rows(view).map((r) => r.laid ?? null) };
  }
}
