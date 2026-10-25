/**
 * The Ledger, as plugin state: one row per page beside the fragmented view's chain, keyed by the chain entry's key, and the reads loop's two warm tables, mapped and carried by transactions like the chain itself.
 *
 * @remarks
 * Settled by Egildo, 2026-10-25: *the Ledger is plugin state of prosemirror-beltype*. The view's fragments plugin (`fragmentsKey`, prosemirror-fragview) is the Ledger's spine: an entry's key, its `from` and `to` mapped through every transaction, and whether a step touched it since its fill. This plugin keeps, under the entry's key and never in a slot of the view's entries (the view knows no engine), what the engine's Ledger holds besides the address: the page's name, parity and blank, its counters at its start, its named strings and running elements over its interval, its end as a word position and the top-level block that end stands in, its content box, the `next` hint its fill left, and the engine's key (`keyOf`). Beside the rows, what the reads loop leaves for the next state (*a resumed run starts from the numbers it left*): the values the layout was cut under (`delivered`) and the per-page published facts (`facts`), with `resumed`, `why` and `reads` of the last settle. Everything here is data, and the state round-trips through `toJSON` and `fromJSON`.
 *
 * WHO WRITES A ROW. The page's fill ends with a row the chain object computes from the page (`Chain.filled`, `chain.js`), and the view then dispatches its `refilled` transaction; this plugin's `appendTransaction` sees a transaction on the document the rows were computed for and appends one transaction carrying them (`addToHistory: false`), so the row lands in the same `state.apply` as the refill, in the state the view's `updateState` receives. An appended transaction rather than the chain dispatching its own after the view's: one state, one `update` of the view, and no moment where the spine says a page is clean and the Ledger has no row for it. The rows a new state moves without a refill (a clean page's interval read again, `Chain.rechrome`) wait for the next transaction on that document, which is the refill the edit owes. Rows whose entry the view dropped are dropped by the same append, so the plugin's order among the state's plugins does not matter (the view adds its own plugin last when the state lacks it).
 *
 * The plugin finds the chain object through the view it is given (`view.someProp('containers').chain`, the factory `ciceroContainers` returns), so `ledger()` takes no option and a state with the plugin but another factory has an inert Ledger. The plugin view hands every state to the chain object (`Chain.update`): the chrome of clean pages, the settled promise and the reads loop are its.
 *
 * @packageDocumentation
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { fragmentsKey, openedAt } from 'prosemirror-fragview';
import { parityAt } from './turn.js';

/** @import { EditorState } from 'prosemirror-state' */

/**
 * One page of the Ledger.
 * @typedef {object} Row
 * @property {string} name The page's name, the effective page name at its first in-flow box.
 * @property {'left' | 'right'} parity
 * @property {boolean} blank A page nothing flows onto.
 * @property {Record<string, number[]>} counters The document's counters at the page's first word.
 * @property {Record<string, Record<string, string>>} strings Each named string's four readings over the page's interval.
 * @property {Record<string, Record<string, number | null>>} running Each running element's four readings, the index in the originals' list.
 * @property {number | null} end The page's end in the engine's word positions, null where it runs to the document's end; a blank page ends where it starts.
 * @property {number | null} block The top-level block the end stands in, the engine's `cut.path[0]`.
 * @property {number} contentW
 * @property {number} contentH
 * @property {Record<string, any> | null} next The hint the fill left for the page after it.
 * @property {Key} key The engine's key.
 */

/**
 * The engine's key of an entry (*the run resumes from an entry*, ruling one): what a cut reads besides the address, which is the chain entry's `to`. In it: the cut's class, whether the page began at a forced break, the parity a forced side still owes, the parity itself only where it can change a cut (the geometry differs between left and right, or a side is owed), and what the next page begins with besides its slice (a box continued as a shell, a row's pieces). Out of it: the word position, the page number, the literals.
 * @typedef {{ cls: string | null, forced: boolean, owes: 'left' | 'right' | null, parity: 'left' | 'right' | null, carried: { shell: any, row: any } | null }} Key
 */

/**
 * @typedef {object} LedgerState
 * @property {ReadonlyMap<number, Row>} rows By the chain entry's key.
 * @property {Map<string, Map<string, string>> | null} delivered The values the layout was cut under, the loop's `delivered`.
 * @property {Record<string, any>[] | null} facts The per-page published facts, the loop's `facts`.
 * @property {Record<string, any> | null} resumed The last settle's `resumed`.
 * @property {string | null} why The last settle's `why`.
 * @property {Record<string, any> | null} reads The last settle's `reads` (`runs` among them).
 */

/** @type {PluginKey<LedgerState>} */
export const ledgerKey = new PluginKey('beltype-ledger');

/** @type {LedgerState} */
const EMPTY = Object.freeze({ rows: new Map(), delivered: null, facts: null, resumed: null, why: null, reads: null });

/**
 * The engine's key of a page's entry.
 * @param {object} a
 * @param {number} a.index The page's index.
 * @param {string | null | undefined} a.cls The cut's class.
 * @param {boolean} [a.forced] The page began at a forced break.
 * @param {Record<string, any> | null | undefined} a.next The fill's hint for the page after it.
 * @param {boolean} [a.sided] The page's geometry differs between a left and a right page.
 * @returns {Key}
 */
export function keyOf({ index, cls, forced = false, next, sided = false }) {
  const owes = next?.blank ? parityAt(index + 2) : null;
  return { cls: cls ?? null, forced, owes, parity: sided || owes ? parityAt(index) : null, carried: next?.shell || next?.row ? { shell: next.shell ?? null, row: next.row ?? null } : null };
}

/**
 * The account `settleReads` reads (`reads.js`' header: the driver's shape, `pos`, `cut`, `carried`, `blank`, `trace.forced` and `closes`), one entry per row in the chain's order.
 * @param {Row[]} rows
 */
export function accountOf(rows) {
  return rows.map((r, i) => ({
    pos: r.end,
    cut: { path: [r.block ?? 0], word: null, px: null },
    carried: null,
    blank: r.blank,
    trace: { forced: !!r.next?.forced },
    closes: { name: r.name, pageNumber: i + 1, parity: r.parity, blank: r.blank, counters: r.counters, contentW: r.contentW, contentH: r.contentH, strings: r.strings, running: r.running }
  }));
}

/**
 * The page that shows `pos`, from 1, by the view's own rule (`FragmentedView.indexAt`: a cut belongs to the page after it, and so do the positions that open the nodes it is the first position of), or null where the page is not known yet: no chain, an entry whose fill a step dirtied, or no row.
 * @param {EditorState} state
 * @param {number} pos
 * @returns {number | null}
 */
export function pageOf(state, pos) {
  const entries = fragmentsKey.getState(state)?.entries;
  const rows = ledgerKey.getState(state)?.rows;
  if (!entries || !rows) return null;
  let at = entries.findIndex((e) => pos >= e.from && (e.to == null || pos < e.to));
  if (at < 0) at = entries.findIndex((e) => e.to === pos);
  else {
    const to = entries[at].to;
    if (to != null && at + 1 < entries.length && pos > openedAt(state.doc, to)) at++;
  }
  if (at < 0 || entries[at].dirty || !rows.has(entries[at].key)) return null;
  return at + 1;
}

/**
 * The state after a transaction's meta: rows set and dropped, or a settle's results.
 * @param {LedgerState} value
 * @param {{ set?: [number, Row][], drop?: number[], settled?: Partial<LedgerState> } | undefined} meta
 * @returns {LedgerState}
 */
export function applyLedger(value, meta) {
  if (!meta) return value;
  let rows = value.rows;
  if (meta.set?.length || meta.drop?.length) {
    const next = new Map(rows);
    for (const key of meta.drop ?? []) next.delete(key);
    for (const [key, row] of meta.set ?? []) next.set(key, row);
    rows = next;
  }
  return { ...value, ...(meta.settled ?? {}), rows };
}

/** @param {LedgerState} value */
export function ledgerToJSON(value) {
  return {
    rows: [...value.rows],
    delivered: value.delivered ? [...value.delivered].map(([k, props]) => [k, [...props]]) : null,
    facts: value.facts,
    resumed: value.resumed,
    why: value.why,
    reads: value.reads
  };
}

/** @param {any} json @returns {LedgerState} */
export function ledgerFromJSON(json) {
  return {
    rows: new Map(json?.rows ?? []),
    delivered: json?.delivered ? new Map(json.delivered.map((/** @type {[string, [string, string][]]} */ [k, props]) => [k, new Map(props)])) : null,
    facts: json?.facts ?? null,
    resumed: json?.resumed ?? null,
    why: json?.why ?? null,
    reads: json?.reads ?? null
  };
}

/**
 * The Ledger plugin. Installed in the state the fragmented view is given, with `ciceroContainers` as its factory.
 * @returns {Plugin<LedgerState>}
 */
export function ledger() {
  /** The factory's chain object, once a view hands it over. @type {import('./chain.js').Chain | null} */
  let chain = null;
  return new Plugin({
    key: ledgerKey,
    state: {
      init: () => EMPTY,
      apply: (tr, value) => applyLedger(value, tr.getMeta(ledgerKey)),
      toJSON: ledgerToJSON,
      fromJSON: (_, json) => ledgerFromJSON(json)
    },
    appendTransaction(_, __, state) {
      const entries = fragmentsKey.getState(state)?.entries;
      const value = ledgerKey.getState(state);
      if (!entries || !value) return null;
      const live = new Set(entries.map((e) => e.key));
      const drop = [...value.rows.keys()].filter((key) => !live.has(key));
      const set = (chain?.takeRows(state.doc) ?? []).filter(([key]) => live.has(key));
      if (!drop.length && !set.length) return null;
      return state.tr.setMeta(ledgerKey, { set, drop }).setMeta('addToHistory', false);
    },
    view(view) {
      chain = /** @type {any} */ (view).someProp?.('containers')?.chain ?? null;
      chain?.attach(view);
      return {
        update: (v) => chain?.update(v),
        destroy: () => chain?.detach()
      };
    }
  });
}
