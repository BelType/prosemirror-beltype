/**
 * The harness the specimen's measurement injects into the engine's own page (`scripts/specimen.mjs`): the reading of a page's words, the same for the engine's pages and the view's, and the view mounted beside the root over the same served document.
 *
 * @remarks
 * Loaded as a module from Vite's server into the page `scripts/specimen.mjs` serves, a finished document with the engine's head spliced in, as `beltype print` serves one, so the sheets, the faces, the geometry and the browser are the root's own. The engine's modules this file reaches through `../src/` are a second instance beside the page's: `customElements.define` is guarded on both sides, so `<beltype-page>` is whichever registered first, and nothing here asks `instanceof` of it.
 *
 * The document is the served HTML fetched again and parsed, never the root's light DOM, which the intake has reordered (blocks, then fixed boxes, then running elements). Its body's children, less the scripts, the styles and the engine's own scaffolding, are seated in a hidden holder so the studio's structured marks can read their computed style (`boxReason`), parsed with the generic schema, and taken out.
 *
 * The CLI's root clears the author's margin boxes' `content` from the CSSOM when it presents (`neutralizeMarginBoxes`), so the geometry table the view's factory reads afterwards would have no margin boxes: the measurement records each `content` the root removed (an init script in `scripts/specimen.mjs` wraps `removeProperty`) and `mount` writes them back before the factory reads the table. The chrome is read the same way on both sides (`tagChrome`): every generated margin box and every flow element with generated content is tagged, the script reads the text the browser laid out for their `::before` and `::after` through a CDP DOM snapshot (a counter's text is in no DOM), and a margin box's slotted running element is read here as text.
 *
 * A page's words are read by one function for both hosts: the text nodes its content slot holds, flattened, in order, each word kept where an inked rect of it lies inside the page box above the flow's clip, so a straddler's tail the engine clips at the cut is not read as the page's. A word that runs across two text nodes with nothing between them is one word.
 *
 * @packageDocumentation
 */

import { EditorState, TextSelection } from 'prosemirror-state';
import { history, undo, redo } from 'prosemirror-history';
import { canSplit, canJoin, findWrapping, liftTarget } from 'prosemirror-transform';
import { FragmentedView, dirtied } from 'prosemirror-fragview';
import * as g from 'prosemirror-fragview/schema-generic';
import { ciceroContainers, ledger, ledgerKey, wordsOf, firstDifference } from '../src/index.js';
import { findSites } from '@beltype/cicero/internal/reads';
import { sheetReach } from '@beltype/cicero/internal/capture';
import { topLevelReach } from '@beltype/cicero/fragmentation';

/** The guard a host runs before writing a PDF, here between the view's pages and the CLI's. */
export function compareHosts() {
  return firstDifference(wordsOfPages(viewPagesOf()), rootWords);
}

/** @param {Element[]} pages */
const wordsOfPages = (pages) => pages.map((page) => {
  page.scrollIntoView({ block: 'center' });
  return wordsOf(page);
});

/** The CLI's pages' words, read before the view is mounted, since the root is hidden after. @type {string[][]} */
let rootWords = [];

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
        // The first fragment's own edge where the engine constructs it (`mutateToFirstFragment`): a justified line before the cut, a block-end border and padding a cloned box keeps, the padding the extension adds.
        const edge = own.textAlign === 'justify' || own.boxDecorationBreak === 'clone';
        if ((after !== 'none' && after !== 'normal') || el.matches('aside') || edge) out.push({ page: i + 1, edge: 'cut-off', el: name, after, ...(edge ? { textAlignLast: own.textAlignLast, borderBottom: own.borderBottomWidth, paddingBottom: `${Math.round(parseFloat(own.paddingBottom))}px` } : {}) });
      }
    }
  });
  return out;
}

/** The sheets the document has adopted, each as its rule count and the start of its first rule. */
export const adoptedSheets = () => [...document.adoptedStyleSheets].map((s) => `${s.cssRules.length} rules: ${(s.cssRules[0]?.cssText ?? '').replace(/\s+/g, ' ').slice(0, 90)}`);

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
 * @param {{ settleMs?: number, timeoutMs?: number, bare?: boolean, noLedger?: boolean, reach?: 0 | 1 | 2 | null, withHistory?: boolean }} [options]
 */
export async function mount({ settleMs = 300, timeoutMs = 120000, bare = false, noLedger = false, reach = null, withHistory = false } = {}) {
  rootWords = wordsOfPages(rootPages());
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
  // The table the CLI's intake captured, margin boxes' `content` and all: the root has cleared them from the sheets by now (the engine's handle carries it).
  const factory = ciceroContainers(document, { table: /** @type {any} */ (window).__beltypeCicero?.table ?? undefined });
  // `--reach N`: the memo settled under N whatever the sheets say, a measurement of what each reach keeps beside the engine's reading for a whole top-level box (`topLevelReach`).
  if (reach != null) factory.originals.reachOf = () => reach;
  const started = performance.now();
  const containers = recorded(factory, fills);
  const view = new FragmentedView(host, {
    // `withHistory`: the random edits' undo and redo, every transaction its own event (`newGroupDelay: 0`), so a seed replays the same undo whatever the clock says.
    state: EditorState.create({ doc, plugins: [...(noLedger ? [] : [ledger()]), ...(withHistory ? [history({ newGroupDelay: 0 })] : [])] }),
    words: { attribute: 'data-beltype' },
    containers,
  });
  mounted = { view, factory, fills, doc };
  const settled = await quiet(view, factory, { settleMs, timeoutMs, started, failed: () => fills.some((f) => f.error) });
  const ms = performance.now() - started - (settled ? settleMs : 0);
  const pages = view.fragments.map((/** @type {any} */ f) => f.container?.dom).filter(Boolean);
  viewPages = pages;
  return { total: factory.originals.total, originals: factory.originals.timings, ms, settled, entries: view.entries.map((/** @type {any} */ { from, to }) => ({ from, to })), fills, pages: readPages(pages), dressing: dressingOf(pages), removed, adopted: adoptedSheets(), docSize: doc.content.size, reads: readsOf(), counts: { ...factory.chain.counts } };
}

/**
 * The factory with every fill's account recorded in `fills`.
 * @param {any} factory
 * @param {any[]} fills
 */
function recorded(factory, fills) {
  return Object.assign((/** @type {number} */ index, /** @type {any} */ hint, /** @type {any} */ entries) => {
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
 * The transaction of one edit on the view's state, and the position it acts at: `retitle` a heading's text (`from=>to`), `key` a character typed in the first paragraph of page `arg`, `delete` the first paragraph of page `arg` removed whole, `paste` two paragraphs inserted between the first two top-level nodes, `enter` Enter pressed at the end of the first top-level textblock (a new top-level block after it), `start` a character typed at the document's first text and `end` at its last.
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
  if (kind === 'enter') {
    // Enter at the end of the first top-level textblock, as `splitBlock` does at a block's end: a new block of the default type after it, at the top level.
    /** @type {number | null} */
    let at = null;
    let index = -1;
    doc.forEach((/** @type {any} */ node, /** @type {number} */ offset, /** @type {number} */ i) => { if (at == null && node.isTextblock) { at = offset + node.nodeSize - 1; index = i; } });
    if (at == null) throw new Error('no top-level textblock to press Enter in');
    return { tr: view.state.tr.split(at, 1, [{ type: doc.contentMatchAt(index + 1).defaultType }]), at };
  }
  if (kind === 'start') { const at = blocks[0].pos + 1; return { tr: view.state.tr.insertText('x', at), at }; }
  // The cases of a cut's own reading (`reach`, docs/results.md), all at the first cut from page `arg` on that divides a paragraph: `tail` deletes the paragraph past the first word after the cut, so its tail on the next page is one line; `past` types in the first textblock after that paragraph, which the page's decision reads no further than; `beyond` types in the textblock after that one, which it does not read.
  if (kind === 'tail' || kind === 'past' || kind === 'beyond') {
    const e = view.entries.slice(Number(arg) - 1).find((/** @type {any} */ x) => x.to != null && doc.resolve(x.to).parent.isTextblock && doc.resolve(x.to).parentOffset > 0 && doc.resolve(x.to).parent.content.size - doc.resolve(x.to).parentOffset > 40);
    if (!e) throw new Error(`no cut divides a paragraph from page ${arg} on`);
    const $to = doc.resolve(e.to);
    if (kind === 'tail') {
      const rest = $to.parent.textBetween($to.parentOffset, $to.parent.content.size, undefined, '\ufffc');
      const space = rest.indexOf(' ');
      return { tr: view.state.tr.delete(e.to + space, $to.end()), at: e.to + space };
    }
    const i = blocks.findIndex((b) => b.pos > $to.before());
    const b = blocks[i + (kind === 'past' ? 0 : 1)];
    if (!b) throw new Error(`no textblock ${kind} the cut at ${e.to}`);
    const at = b.pos + 1;
    return { tr: view.state.tr.insertText('x', at), at };
  }
  // A key on page `arg`, whose fill throws from now on: the pages after it must still be reached. The comparison's fresh fill makes new pages, so the stub goes with it.
  if (kind === 'throw') {
    const f = view.fragments[Number(arg) - 1];
    f.container.cutAndDraw = async () => { throw new Error('the harness threw'); };
    const b = /** @type {any} */ (blocks.find((x) => x.pos >= f.from && x.node.textContent.length > 8));
    const at = b.pos + 1;
    return { tr: view.state.tr.insertText('x', at), at };
  }
  // `throw` again, but the page's rendering is what throws, as a node's `toDOM` that throws would: the safety net renders too, and must still answer.
  if (kind === 'throw-render') {
    const f = view.fragments[Number(arg) - 1];
    const fill = f.container.fill.bind(f.container);
    f.container.fill = (/** @type {any} */ d, /** @type {number} */ from, /** @type {any} */ _render, /** @type {any} */ hint) => fill(d, from, () => { throw new Error('the harness\'s toDOM threw'); }, hint);
    const b = /** @type {any} */ (blocks.find((x) => x.pos >= f.from && x.node.textContent.length > 8));
    const at = b.pos + 1;
    return { tr: view.state.tr.insertText('x', at), at };
  }
  // The first page from page `arg` on that begins with a shell or row pieces, dirtied by the same transaction that types a character on page one: the page before it stays clean and its hint with it, and the page reads that hint at a `from` the character moved. One transaction, because the comparison's fresh fill after each edit would otherwise renew every hint.
  if (kind === 'carried') {
    const pages = view.fragments;
    const i = pages.findIndex((/** @type {any} */ f, /** @type {number} */ n) => n + 1 >= Number(arg || 1) && (pages[n - 1]?.container?.account?.next?.shell || pages[n - 1]?.container?.account?.next?.row));
    if (i < 0) throw new Error(`no page from ${arg} on begins with a shell or row pieces`);
    return { tr: dirtied(view.state.tr.insertText('x', blocks[0].pos + 1), pages[i].key), at: pages[i].from };
  }
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

/** The running copies the pages hold, and how many of them are shut to the caret. */
export function runningCopies() {
  const copies = viewPagesOf().flatMap((/** @type {any} */ page) => [...page.children].filter((/** @type {any} */ el) => /\bartifact\b/.test(el.getAttribute('data-beltype') ?? '')));
  return { count: copies.length, closed: copies.filter((/** @type {any} */ el) => el.getAttribute('contenteditable') === 'false' && el.hasAttribute('inert')).length };
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
  const detail = fills.slice(before.fills).map((/** @type {any} */ f) => ({ page: f.index + 1, from: f.from, to: f.to, name: f.name, forced: f.forced, kind: f.kind, cls: f.cls, pageStart: f.pageStart && Math.round(f.pageStart * 100) / 100, ...(f.clipped ? { clipped: f.clipped } : {}) }));
  viewPages = view.fragments.map((/** @type {any} */ f) => f.container?.dom).filter(Boolean);
  return { at, settled, ms: performance.now() - t0 - 300, redrawn: after.redrawn - before.redrawn, dirtied: after.dirtied - before.dirtied, refilled, detail, pages: readPages(viewPages), reads: readsOf(), state: stateOf(), originals: factory.originals.timings.at(-1) };
}

/**
 * Retitle a heading by a transaction on the view (`edit('retitle', 'from=>to')`).
 * @param {string} from The heading's text.
 * @param {string} to
 */
export const retitle = (from, to) => edit('retitle', `${from}=>${to}`);

/**
 * The supported way to change the page's geometry under a mounted view: link a sheet that changes `@page` and give the view a new factory through `setProps`, which reads the geometry table again and makes a new chain; the view invalidates on a new factory. Answers as `edit` does, and with the pages of a view mounted fresh over the same state beside it (`fresh`).
 * @param {string} href The sheet, relative to the served document.
 */
export async function repage(href) {
  const { view, fills } = mounted;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  await new Promise((resolve, reject) => { link.onload = resolve; link.onerror = () => reject(new Error(`${href} did not load`)); document.head.appendChild(link); });
  const before = fills.length;
  const t0 = performance.now();
  const factory = ciceroContainers(document);
  mounted.factory = factory;
  view.setProps({ containers: recorded(factory, fills) });
  const settled = await quiet(view, factory, { started: t0 });
  const refilled = fills.slice(before).map((/** @type {any} */ f) => f.index + 1);
  viewPages = view.fragments.map((/** @type {any} */ f) => f.container?.dom).filter(Boolean);
  const out = { at: href, settled, ms: performance.now() - t0 - 300, refilled, detail: fills.slice(before).map((/** @type {any} */ f) => ({ page: f.index + 1, from: f.from, to: f.to, name: f.name, kind: f.kind, cls: f.cls })), pages: readPages(viewPages), reads: readsOf(), state: stateOf(), originals: factory.originals.timings.at(-1) };
  // A view mounted fresh over the same state, read and taken down.
  const host = document.createElement('div');
  host.id = 'prosemirror-beltype-fresh';
  host.className = 'fragview-fresh';
  document.body.appendChild(host);
  const freshFactory = ciceroContainers(document);
  const fresh = new FragmentedView(host, { state: EditorState.create({ doc: view.state.doc, plugins: [ledger()] }), words: { attribute: 'data-beltype' }, containers: freshFactory });
  await quiet(fresh, freshFactory);
  const freshPages = readPages(fresh.fragments.map((/** @type {any} */ f) => f.container?.dom).filter(Boolean));
  fresh.destroy();
  host.remove();
  return { ...out, fresh: freshPages };
}

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
  const detail = fills.slice(before).map((/** @type {any} */ f) => ({ page: f.index + 1, from: f.from, to: f.to, name: f.name, forced: f.forced, kind: f.kind, cls: f.cls, pageStart: f.pageStart && Math.round(f.pageStart * 100) / 100, ...(f.clipped ? { clipped: f.clipped } : {}) }));
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
    const t0 = performance.now();
    view.dispatch(view.state.tr.insertText('x', /** @type {number} */ (at) + i));
    const update = view.lastUpdateMs;
    await quiet(view, factory, { started: t0, settleMs: 100 });
    const s = factory.chain.settles.at(-1);
    const r1 = (/** @type {number} */ x) => Math.round(x * 10) / 10;
    out.push({ ms: Math.round((performance.now() - t0 - 100) * 10) / 10, update: Math.round(update * 10) / 10, rechrome: r1(factory.chain.timing.rechrome), settleSync: r1(factory.chain.timing.settle), reads: r1(performance.getEntriesByName('cicero:reads').at(-1)?.duration ?? 0), settle: s ? Math.round(s.ms * 10) / 10 : null, runs: s?.runs.length ?? null, originals: factory.originals.timings.at(-1) });
  }
  return out;
}


/** A seeded generator (mulberry32): the same seed, the same edits. @param {number} a */
const seeded = (a) => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/** The random edits' kinds, each with its weight. */
const RANDOM_KINDS = [['type', 3], ['delete', 2], ['split', 2], ['join', 1], ['markup', 1], ['wrap', 1], ['lift', 1], ['undo', 1.5], ['redo', 1], ['redraw', 1]];

/**
 * Make `n` random edits from `seed` on the mounted view (mounted `withHistory`), none waiting for the chain between them, and wait for quiet only after the last: answers as `edit` does, with the edits' log, so the runner compares the whole run with a cold `invalidate()` fill once.
 *
 * @remarks
 * Every edit aims at a cut: a page's `from` or `to` read from the settled chain at the run's start and mapped through each transaction since, a few positions either side, or a textblock inside a shell or a row item near a cut, preferring one that is not its parent's last child. The kinds are typing, a delete of 1 to 30 positions, Enter (`split`), joining a textblock to the one before, a heading made a paragraph or the reverse or its level changed (`setNodeMarkup`), a wrap in a blockquote, a lift, undo, redo, and `redraw` of the range. Between two edits the run waits for nothing, a frame, 20 ms, or until a fill is in flight, so an edit can land on a page being filled. The edits a seed makes depend on the document and the seed only, never on how far the chain has filled; the pacing does depend on the clock, so a fault that needs a fill in flight can need its seed run more than once.
 *
 * A run starts from the document as mounted, with an empty history, filled cold, so a seed replays alone whatever ran before it. `skip` names edits (from 1) that are drawn but not made, for narrowing a failing seed down to the edits it needs.
 * @param {number} seed
 * @param {number} n
 * @param {number[]} [skip]
 * @param {boolean} [paced] Wait for the chain to be quiet after every edit instead, the seed's draws unchanged: a seed that fails unpaced and passes paced needs two edits with no fill between.
 */
export async function randomEdits(seed, n, skip = [], paced = false) {
  const { view, factory, fills } = mounted;
  if (view.state.doc !== mounted.doc) {
    view.updateState(EditorState.create({ doc: mounted.doc, plugins: view.state.plugins }));
    view.invalidate();
    await quiet(view, factory);
  }
  const rand = seeded(seed);
  const total = RANDOM_KINDS.reduce((a, [, w]) => a + /** @type {number} */ (w), 0);
  const kindOf = () => { let r = rand() * total; for (const [k, w] of RANDOM_KINDS) if ((r -= /** @type {number} */ (w)) < 0) return /** @type {string} */ (k); return 'type'; };
  /** @type {number[]} */
  let cuts = [...new Set(view.entries.flatMap((/** @type {any} */ e) => [e.from, e.to]).filter((/** @type {any} */ x) => x != null && x > 0))];
  const before = { ...factory.chain.counts, fills: fills.length };
  /** @type {string[]} */
  const log = [];
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    const { doc, schema } = view.state;
    const size = doc.content.size;
    const cut = cuts.length ? cuts[Math.floor(rand() * cuts.length)] : Math.floor(rand() * size);
    let pos = Math.max(0, Math.min(size, cut + Math.floor(rand() * 9) - 4));
    if (rand() < 0.35) {
      // A textblock inside a shell or a row item, the nearest to the cut, a not-last child first.
      /** @type {{ pos: number, size: number, last: boolean, d: number }[]} */
      const nested = [];
      doc.descendants((/** @type {any} */ node, /** @type {number} */ p, /** @type {any} */ parent, /** @type {number} */ index) => {
        if (node.isTextblock) { if (doc.resolve(p).depth >= 1) nested.push({ pos: p, size: node.content.size, last: index === parent.childCount - 1, d: Math.abs(p - cut) }); return false; }
        return true;
      });
      nested.sort((a, b) => Number(a.last) - Number(b.last) || a.d - b.d);
      const b = nested[Math.floor(rand() * Math.min(3, nested.length))];
      if (b) pos = b.pos + 1 + Math.floor(rand() * (b.size + 1));
    }
    const sel = TextSelection.near(doc.resolve(pos));
    const p = sel.from;
    const $p = doc.resolve(p);
    const kind = kindOf();
    const k = 1 + Math.floor(rand() * 30);
    const word = ['x', 'word ', ' and a few more words, ', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '][Math.floor(rand() * 4)];
    const level = 2 + Math.floor(rand() * 3);
    /** @type {any} */
    let tr = null;
    let note = '';
    const skipped = skip.includes(i + 1);
    try {
      if (kind === 'type') tr = view.state.tr.insertText(word, p);
      else if (kind === 'delete') tr = view.state.tr.delete(p, Math.min(size, p + k));
      else if (kind === 'split') { if (canSplit(doc, p)) tr = view.state.tr.split(p); }
      else if (kind === 'join') { const at = $p.depth ? $p.before() : p; if (canJoin(doc, at)) tr = view.state.tr.join(at); }
      else if (kind === 'markup' && $p.depth) {
        const node = $p.parent;
        const type = node.type.name === 'heading' && rand() < 0.5 ? schema.nodes.paragraph : schema.nodes.heading;
        if (type && type.validContent(node.content) && $p.node(-1).canReplaceWith($p.index(-1), $p.index(-1) + 1, type)) tr = view.state.tr.setNodeMarkup($p.before(), type, { ...node.attrs, level });
        note = `${node.type.name}→${type?.name}${type?.name === 'heading' ? level : ''}`;
      } else if (kind === 'wrap') { const range = $p.blockRange(); const w = range && schema.nodes.blockquote && findWrapping(range, schema.nodes.blockquote); if (w) tr = view.state.tr.wrap(/** @type {any} */ (range), w); }
      else if (kind === 'lift') { const range = $p.blockRange(); const target = range && liftTarget(range); if (target != null) tr = view.state.tr.lift(/** @type {any} */ (range), target); }
      else if (kind === 'undo' || kind === 'redo') (kind === 'undo' ? undo : redo)(view.state, (/** @type {any} */ t) => { tr = t; });
      else if (kind === 'redraw') { if (!skipped) view.redraw(p, Math.min(size, p + k)); note = `to ${Math.min(size, p + k)}`; }
    } catch (error) { note = `refused: ${String(/** @type {any} */ (error)?.message ?? error).slice(0, 80)}`; tr = null; }
    if (skipped) { log.push(`${i + 1} ${kind} skipped`); continue; }
    if (tr) { view.dispatch(tr); cuts = [...new Set(cuts.map((c) => tr.mapping.map(c)))]; }
    log.push(`${i + 1} ${kind}${kind === 'type' ? ` ${JSON.stringify(word)}` : kind === 'delete' ? ` ${k}` : ''} at ${p} in ${[...Array($p.depth + 1).keys()].slice(1).map((d) => $p.node(d).type.name).join('>')}${tr || kind === 'redraw' ? '' : ' (nothing to do)'}${note ? ` ${note}` : ''}`);
    const pace = rand();
    if (paced) { await quiet(view, factory); continue; }
    if (pace < 0.35) continue;
    if (pace < 0.6) await new Promise((r) => requestAnimationFrame(r));
    else if (pace < 0.8) await new Promise((r) => setTimeout(r, 20));
    else { const until = performance.now() + 300; while (view.filling.size === 0 && performance.now() < until) await new Promise((r) => setTimeout(r, 2)); }
  }
  const settled = await quiet(view, factory, { started: t0, failed: () => fills.slice(before.fills).some((/** @type {any} */ f) => f.error) });
  const after = { ...factory.chain.counts, fills: fills.length };
  const errors = fills.slice(before.fills).filter((/** @type {any} */ f) => f.error).map((/** @type {any} */ f) => `page ${f.index + 1}: ${f.error}`);
  const detail = fills.slice(before.fills).map((/** @type {any} */ f) => ({ page: f.index + 1, from: f.from, to: f.to, kind: f.kind, ...(f.error ? { error: f.error } : {}) }));
  viewPages = view.fragments.map((/** @type {any} */ f) => f.container?.dom).filter(Boolean);
  return { seed, n, log, errors, settled, ms: performance.now() - t0 - 300, redrawn: after.redrawn - before.redrawn, dirtied: after.dirtied - before.dirtied, refilled: fills.slice(before.fills).map((/** @type {any} */ f) => f.index + 1), detail, pages: readPages(viewPages), reads: readsOf(), state: stateOf(), originals: factory.originals.timings.at(-1), docSize: view.state.doc.content.size };
}

/**
 * The overtaken fill (docs/found.md, "A fill overtaken by a second transaction in the same task throws in the grab"): for each pair of neighbouring pages of the settled chain, both pages are filled from their own entry's `from` over the one document in the same task, so the first is suspended at its measurement when the second's trial begins. Each fill must answer the `to` its entry holds; a fill that throws is named with its message. Also the law holders still standing in the document once every fill has ended and the chain is quiet, which is none.
 */
export async function overtaken() {
  const { view } = mounted;
  const doc = view.state.doc;
  const entries = view.entries.map((/** @type {any} */ { key, from, to }) => ({ key, from, to }));
  /** @type {string[]} */
  const failures = [];
  const pagesOf = () => readPages(view.fragments.map((/** @type {any} */ f) => f.container?.dom).filter(Boolean));
  const before = pagesOf();
  for (let i = 0; i + 1 < entries.length; i++) {
    const pair = [entries[i], entries[i + 1]];
    const settled = await Promise.allSettled(pair.map((e, k) => view.containers.get(e.key).fill(doc, e.from, view.render, view.hints.get(entries[i + k - 1]?.key))));
    settled.forEach((r, k) => {
      const e = pair[k];
      if (r.status === 'rejected') failures.push(`page ${i + 1 + k} (with page ${i + 1 + (1 - k)}): threw ${String(r.reason?.message ?? r.reason)}`);
      else if (r.value.to !== e.to) failures.push(`page ${i + 1 + k} (with page ${i + 1 + (1 - k)}): answered ${r.value.to}, the chain holds ${e.to}`);
    });
  }
  const after = pagesOf();
  before.forEach((p, i) => { if (JSON.stringify(p) !== JSON.stringify(after[i])) failures.push(`page ${i + 1} shows ${after[i]?.first} … ${after[i]?.last} (${after[i]?.count} words) where it showed ${p.first} … ${p.last} (${p.count})`); });
  // A refill of the view's own that the case's fills set off holds its law holder until it ends; a holder still standing once the chain is quiet is one left behind.
  await quiet(view, mounted.factory);
  return { pairs: entries.length - 1, failures, holders: document.querySelectorAll('[id^="__prosemirror-beltype-law"]').length };
}

/**
 * The sheets' reach as the engine reads it for this host's unit, a whole top-level box (`topLevelReach` over the originals' holder's children, with no boxes before, and again as after a change of shape, the first box new, with the rules that give the latter; the originals' timings carry each state's own), and for `patchBox`'s (`sheetReach`), with the rules that give the latter: each rule whose selector holds `:has(`, an `@container` rule, a sheet that cannot be read (reach 2), or a sibling combinator or `:nth-…(… of …)` (reach 1), with its sheet's address; the first few of each.
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
  const holder = mounted?.factory.originals.holder();
  const boxes = holder ? [...holder.children] : [];
  // Under a change of shape (the first box new, `before` the rest), each style rule asked alone, so the rules that give the reach for a whole top-level box are named.
  /** @type {string[]} */
  const shapedRules = [];
  const each = (/** @type {CSSRuleList} */ rules, /** @type {string} */ at) => {
    for (const rule of /** @type {Iterable<any>} */ (rules)) {
      if (rule.selectorText != null && !rule.cssRules?.length) { const r = topLevelReach(/** @type {any} */ ({ styleSheets: [{ cssRules: [rule] }], adoptedStyleSheets: [] }), boxes, boxes.slice(1)); if (r) shapedRules.push(`${r} ${at}: ${rule.selectorText}`); }
      if (rule.cssRules) each(rule.cssRules, at);
    }
  };
  if (holder) for (const sheet of [...document.styleSheets, ...document.adoptedStyleSheets]) { try { each(sheet.cssRules, where(sheet)); } catch { shapedRules.push(`2 ${where(sheet)}: unreadable`); } }
  return { topLevel: holder ? topLevelReach(document, boxes, []) : null, shaped: holder ? topLevelReach(document, boxes, boxes.slice(1)) : null, shapedRules: shapedRules.slice(0, 8), reach: sheetReach(document), two: out.two.length, one: out.one.length, first: [...out.two, ...out.one].slice(0, 8) };
}

Object.assign(window, { __prosemirrorBeltype: { repage, runningCopies, compareHosts, wordsOf, readPages, dressingOf, adoptedSheets, rootPages, mount, tagChrome, untagChrome, cliLedger, viewPagesOf, readsOf, retitle, edit, stateOf, refillWhole, keystrokes, reachOf, overtaken, randomEdits } });
