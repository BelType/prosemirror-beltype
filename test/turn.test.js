/**
 * The arithmetic of a turn, without a browser: the hints a chain of fills leaves over a geometry table and a forced break, the trial's span, and a verdict of the Stonehand's mapped to a position over a hand-built `RenderedSlice` (fake DOM nodes and their position map, as the slice renderer writes them).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from 'prosemirror-model';
import { openedAt, posAt } from 'prosemirror-fragview';
import { FIRST_SPAN, firstSpan, parityAt, conditionOf, hintAfter, hintAfterBlank, enter, wordPoint, verdictPosition } from '../src/turn.js';

test('the trial renders 2 048 positions on a first fill and twice the last cut fill after', () => {
  assert.equal(FIRST_SPAN, 2048);
  assert.equal(firstSpan(0), 2048);
  assert.equal(firstSpan(300), 600);
});

test('page one is a right page and the sides alternate', () => {
  assert.deepEqual([0, 1, 2, 3].map(parityAt), ['right', 'left', 'right', 'left']);
});

test('an unforced cut names the next page and asks for nothing else', () => {
  assert.deepEqual(hintAfter({ index: 0, name: '' }), { name: '' });
  assert.deepEqual(hintAfter({ index: 3, name: 'wide', parity: 'right' }), { name: 'wide' }, 'a parity counts only where a forced break owes it');
});

test('a forced break owes a blank page only when the next page falls on the other side', () => {
  assert.deepEqual(hintAfter({ index: 1, name: 'chapter', forced: true, parity: 'right' }), { name: 'chapter', forced: true });
  assert.deepEqual(hintAfter({ index: 2, name: 'chapter', forced: true, parity: 'right' }), { name: 'chapter', forced: true, blank: true });
  assert.deepEqual(hintAfter({ index: 3, name: '', forced: true, parity: 'left' }), { name: '', forced: true, blank: true });
  assert.deepEqual(hintAfter({ index: 2, name: '', forced: true, parity: null }), { name: '', forced: true }, '`page` and a named switch demand no side');
});

test('a chain of hints selects the geometry the table gives each page, a blank page and the one after it included', () => {
  /** A table that answers a size by name and records what it was asked. */
  const asked = [];
  const table = { pageFor: (c) => (asked.push(c), { contentW: c.name === 'wide' ? 500 : 300, contentH: 400 }) };
  // Page 1 ends at a recto chapter opener; page 2 would be a left page, so it is blank; page 3 opens the chapter; page 4 switches to a wide page.
  const hints = [undefined];
  hints.push(hintAfter({ index: 0, name: 'chapter', forced: true, parity: 'right' }));
  hints.push(hintAfterBlank(hints[1]));
  hints.push(hintAfter({ index: 2, name: 'wide', forced: true }));
  const geometries = hints.map((hint, index) => table.pageFor(conditionOf(index, hint?.name ?? '', !!hint?.blank)));
  assert.deepEqual(asked, [
    { name: '', first: true, parity: 'right', blank: false },
    { name: 'chapter', first: false, parity: 'left', blank: true },
    { name: 'chapter', first: false, parity: 'right', blank: false },
    { name: 'wide', first: false, parity: 'left', blank: false }
  ]);
  assert.deepEqual(geometries.map((g) => g.contentW), [300, 300, 300, 500]);
  assert.deepEqual(hints[2], { name: 'chapter', forced: true }, 'the page after a blank keeps the margin a forced break keeps');
});

// ---- A verdict as a position, over a RenderedSlice built by hand ----

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    section: { content: 'block+', group: 'block' },
    heading: { content: 'inline*', group: 'block' },
    paragraph: { content: 'inline*', group: 'block' },
    text: { group: 'inline' }
  },
  marks: { em: {} }
});
const { section, heading, paragraph } = schema.nodes;
// <section><h1>Title</h1><p>one two <em>three four</em></p></section>: the section at 0, the heading's text at 2–7, the paragraph at 8 and its text at 9–27.
const doc = schema.node('doc', null, [section.create(null, [heading.create(null, schema.text('Title')), paragraph.create(null, [schema.text('one two '), schema.text('three four', [schema.marks.em.create()])])])]);

/** A fake DOM node: what `posAt` and `verdictPosition` read of one. */
const node = (nodeType, children = [], data) => {
  const n = { nodeType, childNodes: children, parentNode: null, data };
  for (const c of children) c.parentNode = n;
  return n;
};
const t1 = node(3, [], 'one two ');
const t2 = node(3, [], 'three four');
const em = node(1, [t2]);
const p = node(1, [t1, em]);
const title = node(3, [], 'Title');
const h1 = node(1, [title]);
const sec = node(1, [h1, p]);
const root = node(1, [sec]);
const positions = new WeakMap([
  [sec, { start: 0, end: 29, contentStart: 1, contentEnd: 28 }],
  [h1, { start: 1, end: 8, contentStart: 2, contentEnd: 7 }],
  [title, { start: 2, end: 7 }],
  [p, { start: 8, end: 28, contentStart: 9, contentEnd: 27 }],
  [t1, { start: 9, end: 17 }],
  [em, { start: 17, end: 27, mark: true }],
  [t2, { start: 17, end: 27 }]
]);
/** The Gauge's pieces of the paragraph, set on two lines: `one two` and `three four`; the joined words with their parts. */
const pieces = [{ line: 0, index: 0, char: 0 }, { line: 0, index: 1, char: 0 }, { line: 1, index: 2, char: 0 }, { line: 1, index: 3, char: 0 }];
const words = [{ parts: [{ node: t1, start: 0, end: 3 }] }, { parts: [{ node: t1, start: 4, end: 7 }] }, { parts: [{ node: t2, start: 0, end: 5 }] }, { parts: [{ node: t2, start: 6, end: 10 }] }];
const dom = (over = {}) => ({ pieces: () => pieces, words: () => words, posAt: (n, o) => posAt(root, positions, n, o), enter: (pos) => enter(doc, pos), ...over });

test('a box boundary is entered down its first-child chain, and the page before shows up to the box', () => {
  assert.equal(enter(doc, 0), 2, 'before the section, inside its heading');
  assert.equal(openedAt(doc, enter(doc, 0)), 0);
  assert.equal(enter(doc, 8), 9);
  assert.equal(enter(doc, 12), 12, 'a position inside text stays');
  assert.deepEqual(verdictPosition({ kind: 'A', box: { el: p } }, dom()), { pos: 9, shell: false });
  assert.deepEqual(verdictPosition({ kind: 'A', box: { el: sec } }, dom()), { pos: 2, shell: false });
  assert.deepEqual(verdictPosition({ kind: 'C', edge: 'start', box: { el: sec }, child: { el: h1 } }, dom()), { pos: 2, shell: false });
});

test('a Class B cut is the position of the first character the line after the cut shows, across a mark', () => {
  assert.deepEqual(verdictPosition({ kind: 'B', box: { el: p }, k: 0 }, dom()), { pos: 17, shell: false });
});

test('a line that begins inside a word cuts at that character, counted across the word\'s parts', () => {
  // `three` broken as `th|ree`: the second line begins two characters in.
  const hyphenated = [...pieces.slice(0, 2), { line: 0, index: 2, char: 0 }, { line: 1, index: 2, char: 2 }, { line: 1, index: 3, char: 0 }];
  assert.deepEqual(verdictPosition({ kind: 'B', box: { el: p }, k: 0 }, dom({ pieces: () => hyphenated })), { pos: 19, shell: false });
  // A word written across two text nodes (`two` + `three` joined as one word) and a character past the first part.
  const across = [{ parts: [{ node: t1, start: 4, end: 8 }, { node: t2, start: 0, end: 5 }] }];
  assert.deepEqual(wordPoint(across, { word: 0, char: 5 }), { node: t2, offset: 1 });
  assert.deepEqual(wordPoint(across, { word: 0, char: 0 }), { node: t1, offset: 4 });
  assert.equal(wordPoint(across, { word: 1, char: 0 }), null);
  // Text the engine wrote (the Compositor's hyphen) holds none of the word's characters.
  assert.deepEqual(wordPoint([{ parts: [{ node: t1, start: 4, end: 6 }, { node: null, start: 0, end: 1, engine: true }, { node: t2, start: 0, end: 3 }] }], { word: 0, char: 3 }), { node: t2, offset: 1 });
});

test('a verdict that continues a box as a shell answers the boundary after or before the box, and says so', () => {
  assert.deepEqual(verdictPosition({ kind: 'C', edge: 'end', box: { el: p } }, dom()), { pos: 28, shell: true });
  assert.deepEqual(verdictPosition({ kind: 'E', box: { el: p } }, dom()), { pos: 9, shell: true });
});

test('a page that cannot cut takes the node at its start whole, and the next page begins after it', async () => {
  const { wholeAfter } = await import('../src/turn.js');
  const two = schema.node('doc', null, [paragraph.create(null, schema.text('one')), section.create(null, [paragraph.create(null, schema.text('two'))]), paragraph.create(null, schema.text('three'))]);
  // <p>one</p> 0–5, <section> 5–12 holding <p>two</p> 6–11, <p>three</p> 12–19.
  assert.deepEqual(wholeAfter(two, 1), { node: two.child(0), at: 0, to: 7 }, 'the textblock to its end, the next page entered into the section');
  assert.deepEqual(wholeAfter(two, 3), { node: two.child(0), at: 0, to: 7 }, 'from inside the textblock, the rest of it');
  assert.deepEqual(wholeAfter(two, 7), { node: two.child(1).child(0), at: 6, to: 13 }, 'a section that closes after its last textblock closes on this page');
  assert.deepEqual(wholeAfter(two, 13), { node: two.child(2), at: 12, to: null }, 'the last textblock ends the document');
  assert.deepEqual(wholeAfter(two, 5), { node: two.child(1), at: 5, to: 13 }, 'a block that begins at the page start, not entered, is taken whole');
});

test('a cut moves the chain on when its position is later, or, at the page start, when a shell is entered or shrinks or a row piece moves', async () => {
  const { advances } = await import('../src/turn.js');
  assert.equal(advances(10, {}, { to: 20 }), true);
  assert.equal(advances(10, {}, { to: null }), true, 'the document end');
  assert.equal(advances(10, {}, { to: 10 }), false, 'nothing taken');
  const shell = { pos: 9, remaining: 800, paint: 461 };
  assert.equal(advances(10, {}, { to: 10, next: { shell } }), true, 'a painted shell entered at the page start');
  assert.equal(advances(10, { shell }, { to: 10, next: { shell: { ...shell, remaining: 340 } } }), true, 'the shell shrank');
  assert.equal(advances(10, { shell }, { to: 10, next: { shell } }), false, 'the same shell again');
  assert.equal(advances(10, { pieces: [{ pos: 3, from: 4 }] }, { to: 10, next: { pieces: [{ pos: 3, from: 8 }] } }), true, 'a row item moved on');
  assert.equal(advances(10, { pieces: [{ pos: 3, from: 4 }] }, { to: 10, next: { pieces: [{ pos: 3, from: 4 }] } }), false);
});

test('a page begins at its first in-flow box: an unshown leaf and a box with no footprint at its start are passed over, at their depth only', async () => {
  const { inFlowStart } = await import('../src/turn.js');
  const s = new Schema({ nodes: { doc: { content: 'block+' }, section: { content: 'block+', group: 'block' }, paragraph: { content: 'text*', group: 'block' }, mark: { group: 'block', atom: true }, ws: { group: 'block', atom: true, unshown: true }, text: {} } });
  const { section, paragraph, mark, ws } = s.nodes;
  // ws 0–1, mark 1–2, ws 2–3, <section> 3– holding mark 4–5 and <p>Cover</p> 5–12.
  const d = s.node('doc', null, [ws.create(), mark.create(), ws.create(), section.create(null, [mark.create(), paragraph.create(null, s.text('Cover'))])]);
  const away = (/** @type {number} */ pos) => d.nodeAt(pos)?.type === mark;
  assert.equal(inFlowStart(d, 0, away), 3, 'the cover section, past the leaves and the press mark');
  assert.equal(inFlowStart(d, 4, away), 5, 'inside the section, past the nested mark');
  assert.equal(inFlowStart(d, 3, away), 3, 'an in-flow box at the start is the start; the name lookup descends into it');
  assert.equal(inFlowStart(d, 0, () => false), 1, 'with nothing away, only the whitespace leaf is passed over');
});
