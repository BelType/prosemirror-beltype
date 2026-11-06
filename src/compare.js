/**
 * The guard against a PDF that is not the screen: the words each page shows, read the same way from the view's pages and from a print frame's, and the first page where they part.
 *
 * @remarks
 * A print frame cuts the state itself and never reads the view's pages, so the file can differ from what the editor shows with nothing to say so. A host reads both sides with {@link wordsOf} and hands them to {@link firstDifference} before it writes the PDF. What it does with a difference, warn or refuse, is the host's.
 *
 * Margin boxes are not read, and neither is a page's position in the document: this compares the flow's words.
 *
 * @packageDocumentation
 */

/** The Gauge's word: a maximal run of what a breaking space does not divide. */
const WORD = /[\S  ﻿]+/g;

/**
 * The visible words of one `<beltype-page>`, in order: the text nodes its content slot holds, flattened, each word kept where an inked rect of it lies inside the page box above the flow's clip. The page must be laid out, so a host brings one under `content-visibility` into view first.
 * @param {Element} page
 * @returns {string[]}
 */
export function wordsOf(page) {
  const shadow = /** @type {ShadowRoot} */ (page.shadowRoot);
  const flow = /** @type {HTMLElement} */ (shadow.querySelector('.flow'));
  const slot = /** @type {HTMLSlotElement} */ (flow.querySelector('slot'));
  const doc = page.ownerDocument;
  const css = /** @type {Window} */ (doc.defaultView);
  const box = page.getBoundingClientRect();
  const clipped = css.getComputedStyle(flow).overflowY === 'clip';
  const foot = clipped ? Math.min(box.bottom, flow.getBoundingClientRect().bottom) : box.bottom;
  const range = doc.createRange();
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
      const display = css.getComputedStyle(/** @type {Element} */ (node)).display;
      if (display !== 'inline' && display !== 'contents') open = null;
      for (const child of node.childNodes) visit(child);
      if (display !== 'inline' && display !== 'contents') open = null;
    }
  };
  for (const node of slot.assignedNodes({ flatten: true })) visit(node);
  return words;
}

/**
 * The first page where two hosts' pages hold different words, from 1, or null when every page agrees.
 * @param {string[][]} view Each page's words, the view's.
 * @param {string[][]} frame Each page's words, the print frame's.
 * @returns {{ pages: [number, number], first: number | null }}
 */
export function firstDifference(view, frame) {
  const n = Math.max(view.length, frame.length);
  for (let i = 0; i < n; i++) {
    if (view[i]?.join(' ') !== frame[i]?.join(' ')) return { pages: [view.length, frame.length], first: i + 1 };
  }
  return { pages: [view.length, frame.length], first: null };
}
