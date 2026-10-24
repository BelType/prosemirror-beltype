/**
 * The harness the specimen's measurement injects into BelType's own page (`scripts/specimen.mjs`): the reading of a page's words, the same for the engine's pages and the view's, and the view mounted beside the root over the same served document.
 *
 * @remarks
 * Loaded as a module from Vite's server into a page BelType's dev server serves, so the sheets, the faces, the geometry and the browser are the CLI's own. The engine's modules this file reaches through `../src/` are a second instance beside the page's: `customElements.define` is guarded on both sides, so `<beltype-page>` is whichever registered first, and nothing here asks `instanceof` of it.
 *
 * The document is the served HTML fetched again and parsed, never the root's light DOM, which the intake has reordered (blocks, then fixed boxes, then running elements). Its body's children, less the scripts, the styles and the engine's own scaffolding, are seated in a hidden holder so the studio's structured marks can read their computed style (`boxReason`), parsed with the generic schema, and taken out.
 *
 * A page's words are read by one function for both hosts: the text nodes its content slot holds, flattened, in order, each word kept where an inked rect of it lies inside the page box above the flow's clip, so a straddler's tail the engine clips at the cut is not read as the page's. A word that runs across two text nodes with nothing between them is one word.
 *
 * @packageDocumentation
 */

import { EditorState } from 'prosemirror-state';
import { FragmentedView } from 'prosemirror-fragview';
import * as g from 'beltype-studio-experiment/src/schema-generic.js';
import { ciceroContainers } from '../src/index.js';

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

/**
 * Mount the view beside the root, the root hidden, and wait for the chain to fill whole. `bare` first takes every sheet the document has adopted off it, the CLI's root's among them, so the view is measured in a document no root has dressed, as it is in a host that runs none.
 * @param {{ settleMs?: number, timeoutMs?: number, bare?: boolean }} [options]
 */
export async function mount({ settleMs = 300, timeoutMs = 120000, bare = false } = {}) {
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
  const factory = ciceroContainers(document);
  const started = performance.now();
  const view = new FragmentedView(host, {
    state: EditorState.create({ doc }),
    words: { attribute: 'data-beltype' },
    containers: (index, hint, entries) => {
      const page = factory(index, hint, entries);
      const fill = page.fill.bind(page);
      page.fill = async (...args) => {
        const t0 = performance.now();
        try {
          const answer = await fill(...args);
          fills.push({ index, ms: performance.now() - t0, ...page.account });
          return answer;
        } catch (error) {
          fills.push({ index, ms: performance.now() - t0, error: String(error?.message ?? error) });
          throw error;
        }
      };
      return page;
    },
  });
  // Settled: nothing in flight and nothing dirty, for `settleMs` in a row.
  let quiet = 0;
  let settled = true;
  while (quiet < settleMs) {
    // A chain that stops (a fill that threw leaves its entry dirty) is read as it stands, and says so.
    if (performance.now() - started > timeoutMs || fills.some((f) => f.error)) { settled = false; break; }
    await new Promise((r) => setTimeout(r, 50));
    quiet = view.filling.size === 0 && !view.entries.some((e) => e.dirty) ? quiet + 50 : 0;
  }
  const ms = performance.now() - started - (settled ? settleMs : 0);
  const pages = view.fragments.map((f) => /** @type {any} */ (f.container)?.dom).filter(Boolean);
  return { ms, settled, entries: view.entries.map(({ from, to }) => ({ from, to })), fills, pages: readPages(pages), dressing: dressingOf(pages), removed, adopted: adoptedSheets(), docSize: doc.content.size };
}

Object.assign(window, { __prosemirrorBeltype: { wordsOf, readPages, dressingOf, adoptedSheets, rootPages, mount } });
