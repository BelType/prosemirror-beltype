/**
 * The pure parts of the chrome, without a browser: the position mapping from a DOM point of the originals' rendering to the engine's word position (over plain object trees, the engine's predicates injected), a page's state over the chain's intervals from a hand-written log of operations, and the page total, blank until the chain is complete.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { wordsBeforePoint, wordPositionOf, stateOfPage, totalAfter, Originals } from '../src/originals.js';

/** A plain tree: an element is `{ tag, inline?, fixed?, kids }`, a string is a text node; parents and siblings are wired. */
function tree(spec, parent = null) {
  if (typeof spec === 'string') return { nodeType: 3, data: spec, parentNode: parent };
  const el = { nodeType: 1, tag: spec.tag, inline: !!spec.inline, fixed: !!spec.fixed, parentNode: parent, childNodes: [] };
  el.childNodes = (spec.kids ?? []).map((k) => tree(k, el));
  el.childNodes.forEach((n, i) => { n.nextSibling = el.childNodes[i + 1] ?? null; });
  return el;
}
const reads = { isInline: (/** @type {any} */ el) => el.inline, isFixed: (/** @type {any} */ el) => el.fixed, isBreak: () => false };

test('the words before a point: a word begun before it counts, a point inside a word is that word', () => {
  // <p>Alpha beta<em>ga</em>mma delta<span fixed>run</span> eps</p>: words Alpha, beta…mma (one word across the em), delta, eps; the fixed box has none.
  const p = tree({ tag: 'p', kids: ['Alpha beta', { tag: 'em', inline: true, kids: ['ga'] }, 'mma delta', { tag: 'span', inline: true, fixed: true, kids: ['run'] }, ' eps'] });
  const [t0, em, t2, , t4] = p.childNodes;
  assert.equal(wordsBeforePoint(p, { node: t0, offset: 0 }, reads), 0, 'the block\'s start');
  assert.equal(wordsBeforePoint(p, { node: t0, offset: 6 }, reads), 1, 'the first character of a word: the words before it');
  assert.equal(wordsBeforePoint(p, { node: t0, offset: 8 }, reads), 1, 'inside "beta": that word, the second');
  assert.equal(wordsBeforePoint(p, { node: em.childNodes[0], offset: 1 }, reads), 1, 'inside the word that runs across the inline seam');
  assert.equal(wordsBeforePoint(p, { node: t2, offset: 4 }, reads), 2, 'the start of "delta", past the joined word');
  assert.equal(wordsBeforePoint(p, { node: t4, offset: 1 }, reads), 3, 'past the fixed box, whose word is in no flow');
  assert.equal(wordsBeforePoint(p, { node: p, offset: 3 }, reads), 3, 'an element point: the words of the children before it (a cut between boxes, where no word straddles)');
  assert.equal(wordsBeforePoint(p, { node: p, offset: 5 }, reads), 4, 'the block\'s end');
});

test('a block boundary breaks a word, and a point between blocks is the next block\'s base', () => {
  const holder = tree({ tag: 'div', kids: [
    { tag: 'section', kids: [{ tag: 'h2', kids: ['One two'] }, { tag: 'p', kids: ['three four five'] }] },
    { tag: 'div', fixed: true, kids: ['mark'] },
    { tag: 'p', kids: ['six seven'] }
  ] });
  const [section, mark, last] = holder.childNodes;
  const blocks = [section, last];
  const blockIndex = new Map(blocks.map((b, i) => [b, i]));
  const index = { bases: [0, 5, 7], total: 7 };
  const p = section.childNodes[1];
  assert.equal(wordPositionOf(holder, blockIndex, index, { node: holder, offset: 0 }, reads), 0, 'before the first block');
  assert.equal(wordPositionOf(holder, blockIndex, index, { node: p.childNodes[0], offset: 6 }, reads), 3, 'a Class B cut: the first word the next line shows, "four"');
  assert.equal(wordPositionOf(holder, blockIndex, index, { node: section, offset: 1 }, reads), 2, 'a Class A cut before the paragraph: the words before it');
  assert.equal(wordPositionOf(holder, blockIndex, index, { node: holder, offset: 1 }, reads), 5, 'before a running element at the top level: the next block\'s base');
  assert.equal(wordPositionOf(holder, blockIndex, index, { node: mark.childNodes[0], offset: 2 }, reads), 5, 'inside it: the same');
  assert.equal(wordPositionOf(holder, blockIndex, index, { node: last.childNodes[0], offset: 4 }, reads), 6, 'inside the last block');
  assert.equal(wordPositionOf(holder, blockIndex, index, { node: holder, offset: 3 }, reads), 7, 'past the last block: the total');
});

test('a page\'s state over the chain\'s intervals, from a log of operations', () => {
  // body { counter-reset: chapter } at −1; three headings incrementing it and setting the chapter string at words 0, 12 and 30; a running element assigned at 0 and another at 20.
  const heading = (pos, name) => ({ reset: [], increment: [['chapter', 1]], set: [], strings: [{ name: 'chapter', terms: [{ kind: 'content', which: 'text' }], text: name, attrs: {} }], pos, depth: 2 });
  const ops = [
    { reset: [['chapter', 0]], increment: [], set: [], strings: null, pos: -1, depth: 1 },
    { reset: [], increment: [], set: [], strings: null, running: { name: 'mark', at: 0 }, pos: 0, depth: Infinity },
    heading(0, 'One'),
    heading(12, 'Two'),
    { reset: [], increment: [], set: [], strings: null, running: { name: 'mark', at: 1 }, pos: 20, depth: Infinity },
    heading(30, 'Three')
  ];
  const log = { ops, strings: [{ name: 'chapter', value: 'One', pos: 0 }, { name: 'chapter', value: 'Two', pos: 12 }, { name: 'chapter', value: 'Three', pos: 30 }], running: [{ name: 'mark', value: 0, pos: 0 }, { name: 'mark', value: 1, pos: 20 }] };
  // Pages [0, 10), [10, 25), [25, 30) and [30, end): the third holds no assignment, the fourth begins with one.
  const pages = [[0, 10], [10, 25], [25, 30], [30, null]].map(([a, b]) => stateOfPage(log, a, b));
  assert.deepEqual(pages.map((p) => p.counters), [{ chapter: [0] }, { chapter: [1] }, { chapter: [2] }, { chapter: [2] }], 'the counters strictly before each page\'s first word, the body\'s reset in force on page one');
  assert.deepEqual(pages[0].strings.chapter, { first: 'One', start: 'One', last: 'One', 'first-except': '' });
  assert.deepEqual(pages[1].strings.chapter, { first: 'Two', start: 'One', last: 'Two', 'first-except': '' }, 'an assignment past the page\'s start: start is the entry value');
  assert.deepEqual(pages[2].strings.chapter, { first: 'Two', start: 'Two', last: 'Two', 'first-except': 'Two' }, 'no assignment: every reading is the entry value');
  assert.deepEqual(pages[3].strings.chapter, { first: 'Three', start: 'Three', last: 'Three', 'first-except': '' });
  assert.deepEqual(pages.map((p) => p.running.mark.first), [0, 1, 1, 1], 'the first element assigned on the page, or the one in effect, by its place in the list');
  assert.deepEqual(pages.map((p) => p.running.mark.start), [0, 0, 1, 1], 'start: the one in effect unless the page begins with an assignment');
  assert.deepEqual(stateOfPage(log, 10, 10).strings.chapter, { first: 'One', start: 'One', last: 'One', 'first-except': 'One' }, 'a blank page reads the entry value');
  assert.equal(stateOfPage({ ops: [], strings: [], running: [{ name: 'mark', value: 0, pos: 5 }] }, 0, 5).running.mark.first, null, 'before the element is written there is none, null where a string has ""');
});

test('the page total is blank until a page runs to the end, and moves only there', () => {
  assert.equal(totalAfter(null, 0, 120), null, 'a first page that cut: not complete');
  assert.equal(totalAfter(null, 73, null), 74, 'the last page answered the document\'s end');
  assert.equal(totalAfter(74, 10, 900), 74, 'a refill in the middle leaves it');
  assert.equal(totalAfter(74, 73, 80000), null, 'the last page now cuts: the chain grows, and is not complete until a later page ends it');
  assert.equal(totalAfter(74, 71, null), 72, 'an earlier page runs to the end: the chain is shorter');
});

test('the chain redraws every other live page when its total moves, and none when it does not', () => {
  const o = new Originals(/** @type {any} */ ({}));
  const drawn = [];
  const pages = [0, 1, 2].map((index) => ({ index, drawChrome: () => drawn.push(index) }));
  for (const p of pages) o.pages.add(p);
  o.settle(pages[0], 100);
  o.settle(pages[1], 200);
  assert.deepEqual(drawn, [], 'nothing known, nothing redrawn');
  o.settle(pages[2], null);
  assert.equal(o.total, 3);
  assert.deepEqual(drawn, [0, 1], 'the total arrives: the pages before the last are redrawn, the last draws itself');
  drawn.length = 0;
  o.settle(pages[1], 200);
  assert.deepEqual(drawn, [], 'a refill that leaves the total leaves the others');
});
