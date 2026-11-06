/**
 * `collapsedSpaces()`, without a browser: a space that HTML would collapse is promoted to U+00A0 after every transaction, over a schema of the test's own (a paragraph, a code block, a line break, an emphasis mark), with `prosemirror-history` to pin that one undo takes a typed space and its promotion together.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { history, undo, undoDepth, closeHistory } from 'prosemirror-history';
import { collapsedSpaces } from '../src/spaces.js';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    code_block: { group: 'block', content: 'text*', code: true, marks: '', toDOM: () => ['pre', 0] },
    text: { group: 'inline' },
    br: { group: 'inline', inline: true, toDOM: () => ['br'] }
  },
  marks: { em: { toDOM: () => ['em', 0] } }
});
const { paragraph: p, code_block: code, br } = schema.nodes;
const NB = ' ';

/** A state over one block, the caret at `at` (a position in the document). */
const make = (block, at) => {
  const doc = schema.node('doc', null, [block]);
  return EditorState.create({ doc, selection: TextSelection.create(doc, at), plugins: [history(), collapsedSpaces()] });
};
/** Each character typed at the caret as its own undo event, as a keystroke 600 ms after the last would be. */
const type = (state, text) => {
  for (const ch of text) state = state.apply(closeHistory(state.tr.insertText(ch)));
  return state;
};
const text = (state) => state.doc.textBetween(0, state.doc.content.size, '|', '/');

test('a space typed beside a space is promoted, and the first one breaks', () => {
  assert.equal(text(type(make(p.create(null, schema.text('AB')), 2), '  ')), `A ${NB}B`);
  assert.equal(text(type(make(p.create(null, schema.text('word')), 3), 'A  B')), `woA ${NB}Brd`);
});

test('a space typed before a space promotes itself, not its neighbour', () => {
  assert.equal(text(type(make(p.create(null, schema.text('A B')), 2), ' ')), `A${NB} B`);
});

test('a space at a line\'s end or start is promoted, and the end\'s is a space again when a word follows', () => {
  const end = type(make(p.create(null, schema.text('AB')), 3), ' ');
  assert.equal(text(end), `AB${NB}`);
  assert.equal(text(type(end, 'C')), 'AB C');
  assert.equal(text(type(make(p.create(null, schema.text('AB')), 1), ' ')), `${NB}AB`);
  assert.equal(text(type(make(p.create(null, [schema.text('A'), br.create(), schema.text('B')]), 3), ' ')), `A/${NB}B`);
});

test('a run of spaces inserted at once alternates', () => {
  const state = make(p.create(), 1);
  assert.equal(text(state.apply(state.tr.insertText('a    b'))), `a ${NB} ${NB}b`);
  assert.equal(text(state.apply(state.tr.insertText('  a'))), `${NB} a`);
});

test('a deletion that makes two spaces touch promotes the second', () => {
  const state = make(p.create(null, schema.text('A X B')), 1);
  assert.equal(text(state.apply(state.tr.delete(3, 4))), `A ${NB}B`);
});

test('a code block keeps its spaces', () => {
  assert.equal(text(type(make(code.create(null, schema.text('A')), 2), '  ')), 'A  ');
});

test('a U+00A0 an author wrote is never demoted, nor one a paste brings', () => {
  const state = make(p.create(null, schema.text(`Mr.${NB}Smith`)), 5);
  assert.equal(text(type(state, 'J. ')), `Mr.${NB}J. Smith`);
  assert.equal(text(state.apply(state.tr.delete(5, 6))), `Mr.${NB}mith`);
  assert.equal(text(state.apply(state.tr.insertText(`x${NB}y`))), `Mr.${NB}x${NB}ySmith`);
});

test('one undo takes a typed space and its promotion together', () => {
  const state = type(make(p.create(null, schema.text('AB')), 2), '  ');
  assert.equal(undoDepth(state), 2);
  let back = null;
  undo(state, (tr) => { back = state.apply(tr); });
  assert.equal(text(back), 'A B');
});

test('a promoted space keeps its marks', () => {
  const em = schema.marks.em.create();
  const state = type(make(p.create(null, schema.text('A B', [em])), 3), ' ');
  assert.equal(text(state), `A ${NB}B`);
  state.doc.descendants((node) => { if (node.isText) assert.deepEqual(node.marks.map((m) => m.type.name), ['em']); });
});

test('a transaction not added to history is left as it came', () => {
  const state = make(p.create(null, schema.text('A B')), 3);
  assert.equal(text(state.apply(state.tr.insertText(' ').setMeta('addToHistory', false))), 'A  B');
});

test('a split before a space begins the new paragraph with a U+00A0, and the join gives the space back', () => {
  const state = make(p.create(null, schema.text('end. Next')), 5);
  const split = state.apply(state.tr.split(5));
  assert.equal(text(split), `end.|${NB}Next`);
  const after = make(p.create(null, schema.text('end. Next')), 6);
  const ended = after.apply(after.tr.split(6));
  assert.equal(text(ended), `end.${NB}|Next`);
  assert.equal(text(ended.apply(ended.tr.join(7))), 'end. Next');
});

test('a run a provider wrote is never rewritten: a space typed after it is promoted alone, and a trailing space stays', () => {
  assert.equal(text(type(make(p.create(null, schema.text('a\n  b')), 5), ' ')), `a\n  ${NB}b`);
  assert.equal(text(type(make(p.create(null, schema.text('word ')), 5), 'x')), 'wordx ');
});

test('a run of spaces typed at a line\'s end, then a word: the run alternates as if it had been inserted at once, so the words do not bind', () => {
  const typed = (block, at, keys) => text(type(make(block, at), keys));
  assert.equal(typed(p.create(null, schema.text('word')), 5, '  next'), `word ${NB}next`);
  assert.equal(typed(p.create(null, schema.text('word')), 5, '   next'), `word ${NB} next`);
  assert.equal(typed(p.create(), 1, '  next'), `${NB} next`);
});
