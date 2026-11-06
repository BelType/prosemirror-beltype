/**
 * `collapsedSpaces()`: a plugin that keeps the model from holding a space the page does not draw. The document is HTML, and HTML collapses whitespace: a space beside a space, and a space at a line's start or end, draw nothing, on the Cicero page as in BelType's CLI round (the page lays its text out as the trial in the measure context does, under the body's `white-space`, docs/results.md, *a space beside a space*). So a space that would collapse is promoted to U+00A0, a non-breaking space, a glyph print draws, and model, CLI round and page agree on a visible character. CKEditor 5 and TinyMCE do the same where the host collapses whitespace, and Chromium's contenteditable does it on its own under `white-space: normal`; here it is deliberate and the same in every browser. The name says what the plugin looks for, a space the layout collapses, rather than what it writes.
 *
 * @remarks
 * The rule is about the document after every transaction, not about typing, and it looks only where the transaction changed something: the inserted text and the one character on each side of every change, and at each only on the side the change touched, so a run of whitespace a provider wrote is never rewritten. There, left to right, a U+0020 becomes U+00A0 when the character before it is a collapsible space (U+0020, a tab, a line feed) or a line's start, when the character after it is a line's end, or when it was inserted and the character after it is a collapsible space the transaction did not insert (so a space typed before a space promotes itself, not its neighbour). A run of spaces inserted at once alternates, space, U+00A0, space, U+00A0, so a line can still break inside it, as CKEditor does with a paste. A line's start and end are a textblock's and a `<br>`'s.
 *
 * A deletion that brings two spaces together is promoted the same way, since the rule reads the document after the step. The inverse is narrower: a U+00A0 becomes U+0020 again only when the change put ink after it (a run of them alternates, from a space after ink) and, before the transaction, it stood beside a space or at a line's edge, where it was standing in for a space that collapsed (a space typed at a paragraph's end, then a word). A U+00A0 an author or a provider wrote between two words is never demoted, and one the transaction inserted is kept as it came.
 *
 * Left alone: a textblock whose node spec says `code` (`pre` under the studio's generic schema, where `white-space: pre` keeps every space), a transaction marked `addToHistory: false` (a collaborator's steps, received through `prosemirror-collab`, are that client's to promote, and a host's bookkeeping is not an edit), and tabs and line feeds, which are never written over. The promotion is one appended transaction, which `prosemirror-history` folds into the event of the transaction it follows, so one undo takes the typed character and its promotion together; a collaboration authority receives it as one more step in the same submission.
 *
 * @packageDocumentation
 */
import { Plugin, PluginKey } from 'prosemirror-state';
import { Mapping } from 'prosemirror-transform';

const SPACE = ' ';
const NBSP = ' ';
/** A line's start or end, in the characters of a textblock. */
const EDGE = null;
const COLLAPSIBLE = new Set([' ', '\t', '\n', '\r', '\f']);
/** The inline leaves that end a line. */
const BREAKS = new Set(['br', 'hard_break']);
const key = new PluginKey('collapsedSpaces');

/** @typedef {{ pos: number, ch: string | null }} Char */

/**
 * The characters of a textblock in order, each at its position: a text node's one by one, an inline leaf as one, a line break as an edge; an inline node with content is walked through.
 * @param {import('prosemirror-model').Node} block
 * @param {number} start - the position of the block's content
 * @returns {Char[]}
 */
function charsOf(block, start) {
  /** @type {Char[]} */
  const chars = [];
  block.descendants((node, pos) => {
    if (node.isText) for (let i = 0; i < /** @type {string} */ (node.text).length; i++) chars.push({ pos: start + pos + i, ch: /** @type {string} */ (node.text)[i] });
    else if (node.isLeaf) chars.push({ pos: start + pos, ch: BREAKS.has(node.type.name) ? EDGE : '￼' });
  });
  return chars;
}

const collapsible = (/** @type {string | null} */ ch) => ch === EDGE || COLLAPSIBLE.has(ch);
const ink = (/** @type {string | null} */ ch) => ch !== EDGE && ch !== NBSP && !COLLAPSIBLE.has(ch);

/**
 * Whether the U+00A0 at `pos` in a document stood beside a space or at a line's edge.
 * @param {import('prosemirror-model').Node} doc
 * @param {number} pos
 */
function besideSpace(doc, pos) {
  const $pos = doc.resolve(pos);
  if (!$pos.parent.isTextblock) return false;
  const chars = charsOf($pos.parent, $pos.start());
  const k = chars.findIndex((c) => c.pos === pos);
  return k >= 0 && chars[k].ch === NBSP && (!ink(k ? chars[k - 1].ch : EDGE) || !ink(chars[k + 1]?.ch ?? EDGE));
}

/** @returns {Plugin} */
export function collapsedSpaces() {
  return new Plugin({
    key,
    appendTransaction(trs, oldState, state) {
      const own = trs.filter((tr) => tr.docChanged && tr.getMeta('addToHistory') !== false && !tr.getMeta(key));
      if (!own.length) return null;
      // What the transactions inserted, in the new document's positions (a deletion is an empty range).
      /** @type {[number, number][]} */
      let ranges = [];
      const maps = [];
      for (const tr of trs) {
        for (const map of tr.mapping.maps) {
          ranges = ranges.map(([a, b]) => [map.map(a, -1), map.map(b, 1)]);
          if (own.includes(tr)) map.forEach((_a, _b, from, to) => { ranges.push([from, to]); });
          maps.push(map);
        }
      }
      if (!ranges.length) return null;
      const back = new Mapping(maps).invert();
      const { doc } = state;
      const inserted = (/** @type {number} */ pos) => ranges.some(([a, b]) => pos >= a && pos < b);
      // A character whose previous character the change may have made (an inserted one, or the one after the change), and one whose next it may have made (an inserted one, or the one before).
      const opens = (/** @type {number} */ pos) => ranges.some(([a, b]) => pos >= a && pos <= b);
      const closes = (/** @type {number} */ pos) => ranges.some(([a, b]) => pos >= a - 1 && pos < b);
      /** @type {Map<number, import('prosemirror-model').Node>} */
      const blocks = new Map();
      for (const [a, b] of ranges) {
        doc.nodesBetween(Math.max(0, a - 1), Math.min(doc.content.size, b + 1), (node, pos) => {
          if (!node.isTextblock) return true;
          if (!node.type.spec.code) blocks.set(pos, node);
          return false;
        });
      }
      const tr = state.tr;
      for (const [pos, block] of blocks) {
        const chars = charsOf(block, pos + 1);
        for (let k = 0; k < chars.length; k++) {
          const c = chars[k];
          const open = opens(c.pos), close = closes(c.pos);
          if (!open && !close) continue;
          const before = k ? chars[k - 1].ch : EDGE;
          const after = chars[k + 1] ?? null;
          const next = after ? after.ch : EDGE;
          let ch = null;
          if (c.ch === SPACE) {
            if ((open && collapsible(before)) || (close && next === EDGE) || (inserted(c.pos) && after && COLLAPSIBLE.has(/** @type {string} */ (next)) && !inserted(after.pos))) ch = NBSP;
          } else if (c.ch === NBSP && !inserted(c.pos) && ink(next)) {
            // Ink landed after a run of U+00A0 that stood in for spaces at a line's edge: the run alternates, from a space after ink, as the same run inserted at once does.
            let first = k;
            while (first > 0 && chars[first - 1].ch === NBSP && !inserted(chars[first - 1].pos)) first--;
            const run = chars.slice(first, k + 1);
            if (run.every((r) => besideSpace(oldState.doc, back.map(r.pos, 1)))) {
              const startsSpace = ink(first ? chars[first - 1].ch : EDGE);
              run.forEach((r, i) => {
                const want = (i % 2 === 0) === startsSpace ? SPACE : NBSP;
                if (r.ch === want) return;
                r.ch = want;
                tr.replaceWith(r.pos, r.pos + 1, state.schema.text(want, /** @type {import('prosemirror-model').Node} */ (doc.nodeAt(r.pos)).marks));
              });
            }
          }
          if (ch == null) continue;
          c.ch = ch;
          tr.replaceWith(c.pos, c.pos + 1, state.schema.text(ch, /** @type {import('prosemirror-model').Node} */ (doc.nodeAt(c.pos)).marks));
        }
      }
      return tr.docChanged ? tr.setMeta(key, true) : null;
    }
  });
}
