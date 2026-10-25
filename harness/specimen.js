/**
 * The harness the specimen's measurement injects into BelType's own page (`scripts/specimen.mjs`): the reading of a page's words, the same for the engine's pages and the view's, and the view mounted beside the root over the same served document.
 *
 * @remarks
 * Loaded as a module from Vite's server into a page BelType's dev server serves, so the sheets, the faces, the geometry and the browser are the CLI's own. The engine's modules this file reaches through `../src/` are a second instance beside the page's: `customElements.define` is guarded on both sides, so `<beltype-page>` is whichever registered first, and nothing here asks `instanceof` of it.
 *
 * The document is the served HTML fetched again and parsed, never the root's light DOM, which the intake has reordered (blocks, then fixed boxes, then running elements). Its body's children, less the scripts, the styles and the engine's own scaffolding, are seated in a hidden holder so the studio's structured marks can read their computed style (`boxReason`), parsed with the generic schema, and taken out.
 *
 * The CLI's root clears the author's margin boxes' `content` from the CSSOM when it presents (`neutralizeMarginBoxes`), so the geometry table the view's factory reads afterwards would have no margin boxes: the measurement records each `content` the root removed (an init script in `scripts/specimen.mjs` wraps `removeProperty`) and `mount` writes them back before the factory reads the table. The chrome is read the same way on both sides (`tagChrome`): every generated margin box and every flow element with generated content is tagged, the script reads the text the browser laid out for their `::before` and `::after` through a CDP DOM snapshot (a counter's text is in no DOM), and a margin box's slotted running element is read here as text.
 *
 * A page's words are read by one function for both hosts: the text nodes its content slot holds, flattened, in order, each word kept where an inked rect of it lies inside the page box above the flow's clip, so a straddler's tail the engine clips at the cut is not read as the page's. A word that runs across two text nodes with nothing between them is one word.
 *
 * @packageDocumentation
 */

import { EditorState } from 'prosemirror-state';
import { FragmentedView } from 'prosemirror-fragview';
import * as g from 'beltype-studio-experiment/src/schema-generic.js';
import { ciceroContainers, ledger, ledgerKey } from '../src/index.js';
import { findSites } from '@egildo/beltype-engine-cicero/src/reads.js';

/** The Gauge's word: a maximal run of what a breaking space does not divide. */
const WORD = /[\S  ﻿]+/g;

/**
 * The visible words of one `<beltype-page>`, in order.
 * @param {Element} page
 * @returns {string[]}
 */
export function wordsOf(page) {
  const shadow = /** @type {ShadowRoot} */ (page.shadowRoot);
  const flow = /** @type {HTMLElement} */ (shadow.querySelector('.flow'));
  const slot = /** @type {HTMLSlotElement} */ (flow.querySelector('slot'));
  const box = page.getBoundingClientRect();
  const clipped = getComputedStyle(flow).overflowY === 'clip';
  const foot = clipped ? Math.min(box.bottom, flow.getBoundingClientRect().bottom) : box.bottom;
  const range = document.createRange();
  /** @type {string[]} */
  const words = [];
  /** The text node the last word kept ended at the end of, so a word that goes on in the next node is joined to it. */
  let open = null;
  const visit = (/** @type {Node} */ node) => {
    if (node.nodeType === 3) {
      const text = /** @type {Text} */ (node);
      for (const m of text.data.matchAll(WORD)) {
        range.setStart(text, /** @type {number} */ (m.index));
        range.setEnd(text, /** @type {number} */ (m.index) + m[0].length);
        const seen = [...range.getClientRects()].some((r) => r.width > 0.5 && r.top >= box.top - 0.5 && r.bottom <= foot + 0.5 && r.left >= box.left - 0.5 && r.right <= box.right + 0.5);
        if (!seen) { open = null; continue; }
        if (m.index === 0 && open && open.ends) words[words.length - 1] += m[0];
        else words.push(m[0]);
        open = { ends: m.index + m[0].length === text.data.length };
      }
      if (!/\S$/.test(text.data)) open = null;
      return;
    }
    if (node.nodeType === 1) {
      const display = getComputedStyle(/** @type {Element} */ (node)).display;
      if (display !== 'inline' && display !== 'contents') open = null;
      for (const child of node.childNodes) visit(child);
      if (display !== 'inline' && display !== 'contents') open = null;
    }
  };
  for (const node of slot.assignedNodes({ flatten: true })) visit(node);
  return words;
}

/**
 * Each page's first and last visible word and its word count.
 * @param {Element[]} pages
 */
export function readPages(pages) {
  return pages.map((page) => {
    page.scrollIntoView({ block: 'center' });
    const words = wordsOf(page);
    // The `<object>`s a page shows, presented or not, each as its box's size and what it is: the facsimile's measure, read the same on both sides.
    const slot = /** @type {HTMLSlotElement} */ (/** @type {ShadowRoot} */ (page.shadowRoot).querySelector('.flow slot'));
    const objects = slot.assignedElements({ flatten: true }).flatMap((el) => [...(el.matches('object') ? [el] : []), ...el.querySelectorAll('object')]).map((o) => ({ is: o.getAttribute('is') ?? o.getAttribute('type'), size: [Math.round(o.getBoundingClientRect().width), Math.round(o.getBoundingClientRect().height)] }));
    return { first: words[0] ?? null, last: words.at(-1) ?? null, count: words.length, size: [Math.round(page.getBoundingClientRect().width), Math.round(page.getBoundingClientRect().height)], ...(objects.length ? { objects } : {}) };
  });
}

/** A piece that did not begin its box, and one the cut passes through: the engine's `RESUMED` and `CUT_OFF`, spelled here so the harness reads the words without the engine. */
const RESUMED = '[data-beltype~="split"]:not([data-beltype~="start"])';
const CUT_OFF = '[data-beltype~="split"]:not([data-beltype~="end"])';

/**
 * What each divided piece's edges show, read from the computed style of its pseudo-elements: on a resumed piece `::before` and `::marker` content, `::first-letter` float and size and `::first-line` size and caps beside the element's own size, and on a cut-off piece `::after` content. Only the pieces whose box an author rule dresses at that edge are kept, so the list is the continuation dressing's work and nothing else.
 * @param {Element[]} pages
 */
export function dressingOf(pages) {
  /** @type {any[]} */
  const out = [];
  pages.forEach((page, i) => {
    const slot = /** @type {HTMLSlotElement} */ (/** @type {ShadowRoot} */ (page.shadowRoot).querySelector('.flow slot'));
    const els = slot.assignedElements({ flatten: true }).flatMap((el) => [el, ...el.querySelectorAll('*')]);
    for (const el of els) {
      const name = `${el.localName}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : ''}`;
      const own = getComputedStyle(el);
      if (el.matches(RESUMED)) {
        const before = getComputedStyle(el, '::before').content;
        const marker = own.display === 'list-item' ? getComputedStyle(el, '::marker').content : null;
        const letter = getComputedStyle(el, '::first-letter');
        const line = getComputedStyle(el, '::first-line');
        const piece = { page: i + 1, edge: 'resumed', el: name, before, marker, firstLetter: `${letter.float} ${letter.fontSize}`, firstLine: `${line.fontSize} ${line.fontVariantCaps}`, own: `${own.fontSize} ${own.fontVariantCaps}` };
        if (before !== 'none' && before !== 'normal' || (marker && marker !== 'none') || letter.float !== 'none' || letter.fontSize !== own.fontSize || line.fontSize !== own.fontSize || line.fontVariantCaps !== own.fontVariantCaps || el.matches('blockquote, li, p.cap, p.lead')) out.push(piece);
      }
      if (el.matches(CUT_OFF)) {
        const after = getComputedStyle(el, '::after').content;
        if ((after !== 'none' && after !== 'normal') || el.matches('aside')) out.push({ page: i + 1, edge: 'cut-off', el: name, after });
      }
    }
  });
  return out;
}

/** The sheets the document has adopted, each as its rule count and the start of its first rule. */
export const adoptedSheets = () => [...document.adoptedStyleSheets].map((s) => `${s.cssRules.length} rules: ${(s.cssRules[0]?.cssText ?? '').replace(/\s+/g, ' ').slice(0, 90)}`);

/** Put back the margin boxes' `content` the CLI's root took out of the CSSOM, as the init script recorded it. @returns {number} How many were put back. */
export function restoreMarginContent() {
  const removed = /** @type {any} */ (window).__marginContent ?? [];
  for (const [style, value, priority] of removed) style.setProperty('content', value, priority);
  return removed.length;
}

/**
 * Tag every page's chrome for the script's DOM snapshot, and read what the DOM holds: each generated margin box (`data-generated`) as `<side>:<page>:<box>` with the text of what is slotted into it (a running element), and each flow element whose `::before` or `::after` generates content as `<side>:<page>:f<k>`, with whether it is a `target-counter()` read (`findSites`, a rule whose `content` reads a `--beltype-read-` property). Every page is made `content-visibility: visible` while it is read, since a page the browser skips has no layout to read.
 * @param {Element[]} pages
 * @param {string} side
 */
export function tagChrome(pages, side) {
  const reads = new Set((findSites(document) ?? []).map((s) => s.el));
  const tags = pages.map((page, i) => {
    /** @type {HTMLElement} */ (page).style.contentVisibility = 'visible';
    // Measured 2026-10-25: a page refilled after `invalidate()` and never scrolled to since had its slotted flow left out of the DOM snapshot, its tags and all; a page scrolled to is not.
    page.scrollIntoView({ block: 'center' });
    const shadow = /** @type {ShadowRoot} */ (page.shadowRoot);
    const boxes = [...shadow.querySelectorAll('.margin-cell[data-generated]')].map((cell) => {
      const probe = `${side}:${i}:${cell.getAttribute('data-box')}`;
      cell.setAttribute('data-probe', probe);
      const nodes = [...cell.querySelectorAll('slot')].flatMap((s) => s.assignedNodes({ flatten: true }));
      // A slotted element that lays out no box is not seen, whatever its text: said, so a clone the cell does not render is not read as placed.
      const unseen = nodes.some((n) => n.nodeType === 1 && !/** @type {Element} */ (n).getClientRects().length);
      const slotted = nodes.map((n) => n.textContent ?? '').join('').replace(/\s+/g, ' ').trim() + (unseen ? ' (no box)' : '');
      return { box: cell.getAttribute('data-box'), probe, slotted };
    });
    const slot = /** @type {HTMLSlotElement} */ (shadow.querySelector('.flow slot'));
    // Only what the page shows, as `wordsOf` reads words: an element whose box lies wholly below the flow's clip (a caption in a slice of a figure the page cuts) is in the page's DOM and not on its paper.
    const box = page.getBoundingClientRect();
    const flowEl = /** @type {HTMLElement} */ (shadow.querySelector('.flow'));
    const foot = getComputedStyle(flowEl).overflowY === 'clip' ? Math.min(box.bottom, flowEl.getBoundingClientRect().bottom) : box.bottom;
    const flow = [];
    let k = 0;
    for (const el of slot.assignedElements({ flatten: true }).flatMap((e) => [e, ...e.querySelectorAll('*')])) {
      const gen = ['::before', '::after'].some((p) => !['none', 'normal'].includes(getComputedStyle(el, p).content));
      if (!gen || getComputedStyle(el).display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.top >= foot - 0.5 || r.bottom <= box.top + 0.5) continue;
      const probe = `${side}:${i}:f${k++}`;
      el.setAttribute('data-probe', probe);
      flow.push({ probe, read: reads.has(el), el: `${el.localName}${typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/)[0]}` : ''}` });
    }
    return { boxes, flow };
  });
  // ponytail: forced layout so the snapshot holds every page made visible above
  void document.body.offsetHeight;
  return tags;
}

/** Take the tags off, and give every page its own `content-visibility` back. @param {Element[]} pages */
export function untagChrome(pages) {
  for (const page of pages) {
    /** @type {HTMLElement} */ (page).style.contentVisibility = '';
    for (const el of /** @type {ShadowRoot} */ (page.shadowRoot).querySelectorAll('[data-probe]')) el.removeAttribute('data-probe');
  }
  for (const el of document.querySelectorAll('[data-probe]')) el.removeAttribute('data-probe');
}

/** The CLI's Ledger, each page's interval end (`pos`) and the state its chrome is drawn from. */
export const cliLedger = () => (/** @type {any} */ (window).__beltypeCicero.ledger ?? []).map((/** @type {any} */ e) => ({ pos: e.pos ?? null, blank: !!e.blank, counters: e.closes?.counters ?? {}, strings: e.closes?.strings ?? {}, running: e.closes?.running ?? {} }));

/** The view's pages, after `mount`. @type {Element[]} */
let viewPages = [];
export const viewPagesOf = () => viewPages;

/** The engine's pages, as the root presents them. */
export const rootPages = () => [.../** @type {ShadowRoot} */ (/** @type {Element} */ (document.querySelector('beltype-root')).shadowRoot).querySelectorAll('beltype-page')];

/**
 * The served document as a ProseMirror doc of the studio's generic schema with structured marks.
 */
async function servedDoc() {
  const html = await (await fetch(location.href)).text();
  const served = new DOMParser().parseFromString(html, 'text/html');
  const holder = document.createElement('div');
  holder.style.display = 'none';
  for (const el of [...served.body.children]) {
    if (['SCRIPT', 'STYLE'].includes(el.tagName) || el.id.startsWith('__beltype') || el.localName === 'beltype-root') continue;
    holder.appendChild(document.importNode(el, true));
  }
  document.body.appendChild(holder);
  const doc = g.parseBody(g.structuredSchema, holder, {}, { layout: holder });
  holder.remove();
  return doc;
}

/** The mounted view and its factory, for the edit and the cost after `mount`. @type {any} */
let mounted = null;

/**
 * Wait until the chain is quiet: nothing in flight and nothing dirty for `settleMs` in a row, and the reads loop's last settle ended.
 * @param {any} view
 * @param {any} factory
 * @param {{ settleMs?: number, timeoutMs?: number, started?: number, failed?: () => boolean }} [o]
 */
async function quiet(view, factory, { settleMs = 300, timeoutMs = 120000, started = performance.now(), failed = () => false } = {}) {
  for (;;) {
    let calm = 0;
    while (calm < settleMs) {
      // A chain that stops (a fill that threw leaves its entry dirty) is read as it stands, and says so.
      if (performance.now() - started > timeoutMs || failed()) return false;
      await new Promise((r) => setTimeout(r, 50));
      calm = view.filling.size === 0 && !view.entries.some((/** @type {any} */ e) => e.dirty) ? calm + 50 : 0;
    }
    const settling = factory.chain.settling;
    await settling;
    if (settling === factory.chain.settling && view.filling.size === 0 && !view.entries.some((/** @type {any} */ e) => e.dirty)) return true;
  }
}

/**
 * Mount the view beside the root, the root hidden, and wait for the chain to fill whole and the reads loop to settle. `bare` first takes every sheet the document has adopted off it, the CLI's root's among them, so the view is measured in a document no root has dressed, as it is in a host that runs none. `noLedger` mounts the state without the Ledger plugin, as round 1 did: no reads loop, no chrome on an edit.
 * @param {{ settleMs?: number, timeoutMs?: number, bare?: boolean, noLedger?: boolean, reach?: 0 | 1 | 2 | null }} [options]
 */
export async function mount({ settleMs = 300, timeoutMs = 120000, bare = false, noLedger = false, reach = null } = {}) {
  const removed = bare ? adoptedSheets() : [];
  if (bare) document.adoptedStyleSheets = [];
  /** @type {any[]} */
  const fills = [];
  const doc = await servedDoc();
  const root = /** @type {HTMLElement} */ (document.querySelector('beltype-root'));
  root.style.display = 'none';
  const host = document.createElement('div');
  host.id = 'prosemirror-beltype-view';
  document.body.appendChild(host);
  const style = document.createElement('style');
  style.textContent = '#prosemirror-beltype-view .fragview { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px 0; outline: none; } #prosemirror-beltype-view beltype-page { box-shadow: 0 1px 4px rgba(0,0,0,.2); flex: none; }';
  document.head.appendChild(style);
  const restored = restoreMarginContent();
  const factory = ciceroContainers(document);
  // `--reach N`: the memo settled under N whatever the sheets say, to measure what a host-side reading of the reach would keep (docs/found.md, the engine's `sheetReach` and this host's unit of replacement).
  if (reach != null) factory.originals.reachOf = () => reach;
  const started = performance.now();
  const containers = Object.assign((/** @type {number} */ index, /** @type {any} */ hint, /** @type {any} */ entries) => {
    const page = factory(index, hint, entries);
    const fill = page.fill.bind(page);
    page.fill = async (/** @type {any[]} */ ...args) => {
      const t0 = performance.now();
      try {
        const answer = await fill(...args);
        fills.push({ index, ms: performance.now() - t0, ...page.account });
        return answer;
      } catch (error) {
        fills.push({ index, ms: performance.now() - t0, error: String(/** @type {any} */ (error)?.message ?? error) });
        throw error;
      }
    };
    return page;
  }, { chain: factory.chain, originals: factory.originals });
  const view = new FragmentedView(host, {
    state: EditorState.create({ doc, plugins: noLedger ? [] : [ledger()] }),
    words: { attribute: 'data-beltype' },
    containers,
  });
  mounted = { view, factory, fills };
  const settled = await quiet(view, factory, { settleMs, timeoutMs, started, failed: () => fills.some((f) => f.error) });
  const ms = performance.now() - started - (settled ? settleMs : 0);
  const pages = view.fragments.map((/** @type {any} */ f) => f.container?.dom).filter(Boolean);
  viewPages = pages;
  return { restored, total: factory.originals.total, originals: factory.originals.timings, ms, settled, entries: view.entries.map((/** @type {any} */ { from, to }) => ({ from, to })), fills, pages: readPages(pages), dressing: dressingOf(pages), removed, adopted: adoptedSheets(), docSize: doc.content.size, reads: readsOf(), counts: { ...factory.chain.counts } };
}

/** What the reads loop did, settle by settle: each run's pages dirtied and cut, and the loop's own result. */
export function readsOf() {
  if (!mounted) return null;
  const { view, factory } = mounted;
  const ledgerState = ledgerKey.getState(view.state);
  return {
    settles: factory.chain.settles.map((/** @type {any} */ s) => ({ ms: Math.round(s.ms * 10) / 10, overtaken: s.overtaken, runs: s.runs.map((/** @type {any} */ r) => ({ ...r, ms: Math.round(r.ms * 10) / 10 })), result: s.result })),
    ledger: ledgerState ? { rows: ledgerState.rows.size, delivered: ledgerState.delivered ? [...ledgerState.delivered].map(([k, m]) => [k, [...m]]) : null, facts: ledgerState.facts?.length ?? null, resumed: ledgerState.resumed, why: ledgerState.why, reads: ledgerState.reads } : null
  };
}

/**
 * The transaction of one edit on the view's state, and the position it acts at: `retitle` a heading's text (`from=>to`), `key` a character typed in the first paragraph of page `arg`, `delete` the first paragraph of page `arg` removed whole, `paste` two paragraphs inserted between the first two top-level nodes, `start` a character typed at the document's first text and `end` at its last.
 * @param {any} view
 * @param {string} kind
 * @param {string} [arg]
 * @returns {{ tr: any, at: number }}
 */
function editOf(view, kind, arg = '') {
  const { doc } = view.state;
  /** @type {{ node: any, pos: number }[]} */
  const blocks = [];
  doc.descendants((/** @type {any} */ node, /** @type {number} */ pos) => { if (node.isTextblock) { blocks.push({ node, pos }); return false; } return true; });
  const paragraph = (/** @type {{ node: any }} */ b) => b.node.type.name === 'paragraph' || b.node.type.name === 'p' || /^p$/i.test(b.node.attrs?.tag ?? '');
  const onPage = (/** @type {number} */ n) => { const e = view.entries[n - 1]; return blocks.find((b) => paragraph(b) && b.pos >= e.from && b.node.textContent.length > 8); };
  if (kind === 'retitle') {
    const [from, to] = arg.split('=>');
    const b = blocks.find((x) => x.node.textContent === from);
    if (!b) throw new Error(`no textblock reads "${from}"`);
    return { tr: view.state.tr.insertText(to, b.pos + 1, b.pos + 1 + from.length), at: b.pos + 1 };
  }
  if (kind === 'key') { const b = /** @type {any} */ (onPage(Number(arg))); const at = b.pos + 1 + b.node.textContent.indexOf(' '); return { tr: view.state.tr.insertText('x', at), at }; }
  if (kind === 'delete') { const b = /** @type {any} */ (onPage(Number(arg))); return { tr: view.state.tr.delete(b.pos, b.pos + b.node.nodeSize), at: b.pos }; }
  if (kind === 'paste') {
    const like = /** @type {any} */ (blocks.find(paragraph)).node;
    const at = doc.child(0).nodeSize;
    const made = ['Pasted, the first of two paragraphs, with a few words in it.', 'Pasted, the second, a little longer than the first so it runs on.'].map((t) => like.type.create(like.attrs, view.state.schema.text(t)));
    return { tr: view.state.tr.insert(at, made), at };
  }
  if (kind === 'start') { const at = blocks[0].pos + 1; return { tr: view.state.tr.insertText('x', at), at }; }
  if (kind === 'end') { const b = /** @type {any} */ (blocks.at(-1)); const at = b.pos + 1 + b.node.content.size; return { tr: view.state.tr.insertText('x', at), at }; }
  throw new Error(`no edit named "${kind}"`);
}

/**
 * What the comparison of an edited state with its fresh fill reads beside the pages: the originals' reading (the position index's bases, the counter log, the strings and running elements assigned, the page sites, every entry's interval as word addresses), each live page's chrome state, and the delivered reads.
 */
export function stateOf() {
  const { view, factory } = mounted;
  const o = factory.originals;
  const s = o.state;
  const ledgerState = ledgerKey.getState(view.state);
  const pages = view.fragments.map((/** @type {any} */ f) => f.container).filter(Boolean);
  return {
    originals: { bases: s.index.bases, total: s.index.total, ops: JSON.stringify(s.ops), strings: s.strings, running: s.running, boxes: s.boxes.map((/** @type {any} */ b) => b.name), sites: s.sites, addresses: view.entries.map((/** @type {any} */ e) => [o.addressAt(s, e.from), e.to == null ? null : o.addressAt(s, e.to)]) },
    chrome: pages.map((/** @type {any} */ p) => p.chrome && { start: p.chrome.start, end: p.chrome.end, block: p.chrome.block, counters: p.chrome.counters, strings: p.chrome.strings, running: p.chrome.running }),
    delivered: ledgerState?.delivered ? [...ledgerState.delivered].map(([k, m]) => [k, [...m]]) : null
  };
}

/**
 * Edit by a transaction on the view (`editOf`), and wait for the chain and the loop: the counts of pages redrawn without a refill, dirtied for a flow site, and fills, before and after, the pages read, and the state read (`stateOf`).
 * @param {string} kind
 * @param {string} [arg]
 */
export async function edit(kind, arg) {
  const { view, factory, fills } = mounted;
  const { tr, at } = editOf(view, kind, arg);
  const before = { ...factory.chain.counts, fills: fills.length };
  const t0 = performance.now();
  view.dispatch(tr);
  const settled = await quiet(view, factory, { started: t0 });
  const after = { ...factory.chain.counts, fills: fills.length };
  const refilled = fills.slice(before.fills).map((/** @type {any} */ f) => f.index + 1);
  const detail = fills.slice(before.fills).map((/** @type {any} */ f) => ({ page: f.index + 1, from: f.from, to: f.to, name: f.name, forced: f.forced, kind: f.kind, cls: f.cls, pageStart: f.pageStart && Math.round(f.pageStart * 100) / 100 }));
  viewPages = view.fragments.map((/** @type {any} */ f) => f.container?.dom).filter(Boolean);
  return { at, settled, ms: performance.now() - t0 - 300, redrawn: after.redrawn - before.redrawn, dirtied: after.dirtied - before.dirtied, refilled, detail, pages: readPages(viewPages), reads: readsOf(), state: stateOf(), originals: factory.originals.timings.at(-1) };
}

/**
 * Retitle a heading by a transaction on the view (`edit('retitle', 'from=>to')`).
 * @param {string} from The heading's text.
 * @param {string} to
 */
export const retitle = (from, to) => edit('retitle', `${from}=>${to}`);

/** Invalidate the view and wait for its fresh fill of the same state. */
export async function refillWhole() {
  const { view, factory, fills } = mounted;
  const before = fills.length;
  const t0 = performance.now();
  view.invalidate();
  const settled = await quiet(view, factory, { started: t0 });
  // Late truth after quiet: a page's observer announces `moved` a frame later, and the view refills it.
  const quietAt = fills.length;
  await new Promise((r) => setTimeout(r, 1000));
  await quiet(view, factory);
  const late = fills.slice(quietAt).map((/** @type {any} */ f) => f.index + 1);
  const pages = view.fragments.map((/** @type {any} */ f) => f.container?.dom).filter(Boolean);
  viewPages = pages;
  const detail = fills.slice(before).map((/** @type {any} */ f) => ({ page: f.index + 1, from: f.from, to: f.to, name: f.name, forced: f.forced, kind: f.kind, cls: f.cls, pageStart: f.pageStart && Math.round(f.pageStart * 100) / 100 }));
  return { settled, fills: fills.length - before, late, detail, pages: readPages(pages), reads: readsOf(), state: stateOf(), originals: factory.originals.timings.at(-1) };
}

/**
 * Type `n` characters, one transaction each, at the end of the first word of the first paragraph on page `pageNo`, each awaited until the chain is quiet and the loop settled: the milliseconds from the dispatch to quiet, less the quiet window, and the loop's own.
 * @param {number} pageNo
 * @param {number} n
 */
export async function keystrokes(pageNo, n) {
  const { view, factory } = mounted;
  const entry = view.entries[pageNo - 1];
  /** @type {number | null} */
  let at = null;
  view.state.doc.nodesBetween(entry.from, entry.to ?? view.state.doc.content.size, (/** @type {any} */ node, /** @type {number} */ pos) => {
    if (at == null && node.isTextblock && pos >= entry.from && node.textContent.length > 8) at = pos + 1 + node.textContent.indexOf(' ');
    return at == null;
  });
  const out = [];
  for (let i = 0; i < n; i++) {
    const settles = factory.chain.settles.length;
    const t0 = performance.now();
    view.dispatch(view.state.tr.insertText('x', /** @type {number} */ (at) + i));
    const update = view.lastUpdateMs;
    await quiet(view, factory, { started: t0, settleMs: 100 });
    const s = factory.chain.settles[settles];
    const r1 = (/** @type {number} */ x) => Math.round(x * 10) / 10;
    out.push({ ms: Math.round((performance.now() - t0 - 100) * 10) / 10, update: Math.round(update * 10) / 10, rechrome: r1(factory.chain.timing.rechrome), settleSync: r1(factory.chain.timing.settle), reads: r1(performance.getEntriesByName('cicero:reads').at(-1)?.duration ?? 0), settle: s ? Math.round(s.ms * 10) / 10 : null, runs: s?.runs.length ?? null, originals: factory.originals.timings.at(-1) });
  }
  return out;
}


/**
 * The sheets' reach as the engine reads it (`sheetReach`), and the rules that give it: each rule whose selector holds `:has(`, an `@container` rule, a sheet that cannot be read (reach 2), or a sibling combinator or `:nth-…(… of …)` (reach 1), with its sheet's address; the first few of each.
 */
export function reachOf() {
  /** @type {{ two: string[], one: string[] }} */
  const out = { two: [], one: [] };
  const where = (/** @type {CSSStyleSheet} */ sheet) => sheet.href ?? (sheet.ownerNode ? `<${sheet.ownerNode.nodeName.toLowerCase()}${/** @type {Element} */ (sheet.ownerNode).id ? ` id=${/** @type {Element} */ (sheet.ownerNode).id}` : ''}>` : 'adopted');
  const inRules = (/** @type {CSSRuleList} */ rules, /** @type {string} */ at) => {
    for (const rule of /** @type {Iterable<any>} */ (rules)) {
      const text = rule.selectorText;
      if (rule.constructor?.name === 'CSSContainerRule' || text?.includes(':has(')) out.two.push(`${at}: ${text ?? '@container'}`);
      else if (text && (/:nth-[\w-]+\([^)]*\sof\s/.test(text) || /[+~]/.test(text.replace(/\[[^\]]*\]/g, '').replace(/:nth-[\w-]+\([^)]*\)/g, '')))) out.one.push(`${at}: ${text}`);
      if (rule.cssRules) inRules(rule.cssRules, at);
      if (rule.styleSheet) inSheet(rule.styleSheet);
    }
  };
  const inSheet = (/** @type {CSSStyleSheet} */ sheet) => { try { inRules(sheet.cssRules, where(sheet)); } catch { out.two.push(`${where(sheet)}: unreadable`); } };
  for (const sheet of [...document.styleSheets, ...document.adoptedStyleSheets]) inSheet(sheet);
  return { reach: out.two.length ? 2 : out.one.length ? 1 : 0, two: out.two.length, one: out.one.length, first: [...out.two, ...out.one].slice(0, 8) };
}

Object.assign(window, { __prosemirrorBeltype: { wordsOf, readPages, dressingOf, adoptedSheets, rootPages, mount, tagChrome, untagChrome, cliLedger, viewPagesOf, readsOf, retitle, edit, stateOf, refillWhole, keystrokes, reachOf } });
