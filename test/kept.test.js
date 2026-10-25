/**
 * The originals keep their parts: the identity diff of a state's top-level nodes against the last state's, the rebase of a kept slice's positions, and the placement in the holder, over a hand-made DOM and a stand-in renderer (the engine's reads need a browser, and are measured by the harness): a kept node's element is the same object across two states, a changed node's is new, and a position inside a kept node finds the point it found before the edit moved it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from 'prosemirror-model';
import { Transform } from 'prosemirror-transform';
import { matchNodes, rebased, runningPlaced, sameElements, Originals } from '../src/originals.js';

test('the identity diff: prefix, suffix and middle, each old node taken once', () => {
  const [a, b, c, d, e, x, y] = ['a', 'b', 'c', 'd', 'e', 'x', 'y'].map((n) => ({ n }));
  assert.deepEqual(matchNodes([a, b, c], [a, b, c]), [0, 1, 2], 'nothing changed');
  assert.deepEqual(matchNodes([a, b, c], [a, x, c]), [0, -1, 2], 'a changed node between a prefix and a suffix');
  assert.deepEqual(matchNodes([a, b, c], [a, b, x, y, c]), [0, 1, -1, -1, 2], 'two nodes inserted (a paste)');
  assert.deepEqual(matchNodes([a, b, c, d], [a, d]), [0, 3], 'two nodes deleted');
  assert.deepEqual(matchNodes([a, b, c, d, e], [a, d, b, c, e]), [0, 3, 1, 2, 4], 'a node moved: the middle\'s map finds it');
  assert.deepEqual(matchNodes([a, b, c], [x, b, c]), [-1, 1, 2], 'an edit at the very start');
  assert.deepEqual(matchNodes([a, b, c], [a, b, x]), [0, 1, -1], 'an edit at the very end');
  assert.deepEqual(matchNodes([a, b], [b, b, a]), [1, -1, 0], 'a node shared twice is kept once');
  assert.deepEqual(matchNodes([], [a]), [-1]);
  assert.deepEqual(matchNodes([a], []), []);
});

test('the rebase: a kept slice\'s positions move by the shift of its node\'s start', () => {
  assert.equal(rebased(57, { base: 50, at: 40 }), 47, 'the node starts 10 later than it was rendered at');
  assert.equal(rebased(30, { base: 30, at: 34 }), 34, 'or earlier');
  assert.equal(rebased(12, { base: 10, at: 10 }), 12, 'or where it was');
});

/** A hand-made DOM: what `place` and `pointOf` touch of an element, a text node and a document. */
class El {
  constructor(/** @type {string} */ name) { this.nodeType = 1; this.nodeName = name; /** @type {any[]} */ this.childNodes = []; /** @type {any} */ this.parentNode = null; this.id = ''; this.style = {}; }
  get children() { return this.childNodes.filter((c) => c.nodeType === 1); }
  get parentElement() { return this.parentNode; }
  get firstChild() { return this.childNodes[0] ?? null; }
  get lastChild() { return this.childNodes.at(-1) ?? null; }
  get nextSibling() { const p = this.parentNode; return p ? p.childNodes[p.childNodes.indexOf(this) + 1] ?? null : null; }
  get previousSibling() { const p = this.parentNode; return p ? p.childNodes[p.childNodes.indexOf(this) - 1] ?? null : null; }
  remove() { if (this.parentNode) { this.parentNode.childNodes.splice(this.parentNode.childNodes.indexOf(this), 1); this.parentNode = null; } }
  insertBefore(/** @type {any} */ n, /** @type {any} */ ref) { n.remove(); this.childNodes.splice(ref ? this.childNodes.indexOf(ref) : this.childNodes.length, 0, n); n.parentNode = this; return n; }
  appendChild(/** @type {any} */ n) { return this.insertBefore(n, null); }
  prepend(/** @type {any} */ n) { this.insertBefore(n, this.firstChild); }
  replaceChildren(/** @type {any} */ frag) { for (const c of [...this.childNodes]) c.remove(); for (const c of [...frag.childNodes]) this.appendChild(c); }
}
const text = (/** @type {string} */ data) => ({ nodeType: 3, data, parentNode: null, remove() {} });

const schema = new Schema({ nodes: { doc: { content: 'block+' }, paragraph: { group: 'block', content: 'text*' }, text: {} } });
const p = (/** @type {string} */ t) => schema.node('paragraph', null, t ? [schema.text(t)] : []);

/** A document with a body, and a renderer that writes one `<p>` per top-level node in range, after a shallow sibling per node before it, recording the view's spans; it counts the nodes it renders. */
function stage() {
  const body = new El('body');
  const document = /** @type {any} */ ({ body, createElement: (/** @type {string} */ n) => new El(n), getElementById: (/** @type {string} */ id) => body.children.find((c) => c.id === id) ?? null });
  const counted = { nodes: 0 };
  const render = (/** @type {any} */ doc, /** @type {number} */ from, /** @type {number | null} */ to) => {
    const end = to ?? doc.content.size;
    const fragment = new El('#fragment');
    const positions = new WeakMap();
    doc.forEach((/** @type {any} */ node, /** @type {number} */ offset) => {
      if (offset + node.nodeSize <= from) { fragment.appendChild(new El('p')); return; }
      if (offset < from || offset + node.nodeSize > end) return;
      counted.nodes++;
      const el = new El('p');
      positions.set(el, { start: offset, end: offset + node.nodeSize, contentStart: offset + 1, contentEnd: offset + node.nodeSize - 1 });
      if (node.textContent) {
        const t = el.appendChild(text(node.textContent));
        positions.set(t, { start: offset + 1, end: offset + 1 + node.textContent.length });
      }
      fragment.appendChild(el);
    });
    return { fragment, positions, from, to: end };
  };
  const o = new Originals(document);
  const place = (/** @type {any} */ doc) => {
    const placed = o.place(doc, /** @type {any} */ (render));
    o.state = /** @type {any} */ ({ doc, entries: placed.entries });
    return placed;
  };
  return { o, place, counted, body };
}

/** The holder's elements, in order, as the text they show. */
const shown = (/** @type {any} */ holder) => holder.children.map((/** @type {any} */ el) => el.childNodes[0]?.data ?? '');

test('a kept node keeps its element across two states, and a changed node gets a new one', () => {
  const { o, place, counted } = stage();
  const doc = schema.node('doc', null, [p('alpha'), p('beta'), p('gamma'), p('delta')]);
  const first = place(doc);
  assert.equal(first.rendered, 4, 'the first state is rendered whole');
  assert.equal(counted.nodes, 4);
  assert.equal(first.holder, o.holder(), 'the holder is body\'s first child');
  const els = first.entries.map((e) => e.el);

  // A keystroke in "beta".
  const typed = new Transform(doc).insert(1 + 7 + 2, schema.text('x')).doc;
  const second = place(typed);
  assert.equal(second.rendered, 1, 'one node rendered again');
  assert.equal(counted.nodes, 5);
  assert.equal(second.shaped, false, 'a node replaced in place changes no sibling\'s index');
  assert.deepEqual(second.entries.map((e, i) => e.el === els[i]), [true, false, true, true], 'the untouched nodes keep their elements; the edited one is new');
  assert.deepEqual(shown(second.holder), ['alpha', 'bexta', 'gamma', 'delta']);
  assert.equal(els[1].parentNode, null, 'the old element is out of the holder');
  assert.deepEqual(second.entries.map((e) => [e.base, e.at]), [[0, 0], [7, 7], [14, 13], [21, 20]], 'the nodes after the edit start one later than their slices were rendered at');
});

test('a paste of two paragraphs, a deletion of one, edits at the very start and at the very end: the holder shows the document in order, every untouched element kept', () => {
  const { place } = stage();
  const doc = schema.node('doc', null, [p('one'), p('two'), p('three')]);
  const els = place(doc).entries.map((e) => e.el);
  const pasted = new Transform(doc).insert(5, [p('new1'), p('new2')]).doc;
  const a = place(pasted);
  assert.deepEqual(shown(a.holder), ['one', 'new1', 'new2', 'two', 'three']);
  assert.equal(a.rendered, 2);
  assert.equal(a.shaped, true, 'an insertion shifts the indices after it');
  assert.deepEqual([a.entries[0].el, a.entries[3].el, a.entries[4].el], els);
  const deleted = new Transform(pasted).delete(5, 5 + 6).doc;
  const b = place(deleted);
  assert.deepEqual(shown(b.holder), ['one', 'new2', 'two', 'three']);
  assert.equal(b.rendered, 0, 'a deletion renders nothing');
  assert.equal(b.shaped, true);
  const atStart = new Transform(deleted).insert(1, schema.text('A')).doc;
  const c = place(atStart);
  assert.deepEqual(shown(c.holder), ['Aone', 'new2', 'two', 'three']);
  assert.equal(c.rendered, 1);
  const atEnd = new Transform(atStart).insert(atStart.content.size - 1, schema.text('Z')).doc;
  const d = place(atEnd);
  assert.deepEqual(shown(d.holder), ['Aone', 'new2', 'two', 'threeZ']);
  assert.equal(d.rendered, 1);
  assert.deepEqual(d.entries.slice(0, 3).map((e) => e.el), c.entries.slice(0, 3).map((e) => e.el));
});

test('a moved node keeps its element and is put in its new place', () => {
  const { place } = stage();
  const doc = schema.node('doc', null, [p('a'), p('b'), p('c'), p('d')]);
  const els = place(doc).entries.map((e) => e.el);
  const moved = schema.node('doc', null, [doc.child(0), doc.child(3), doc.child(1), doc.child(2)]);
  const m = place(moved);
  assert.equal(m.rendered, 0);
  assert.equal(m.shaped, true);
  assert.deepEqual(shown(m.holder), ['a', 'd', 'b', 'c']);
  assert.deepEqual(m.entries.map((e) => e.el), [els[0], els[3], els[1], els[2]]);
});

test('a position inside a kept node finds the same point after an edit before it moved the node', () => {
  const { o, place } = stage();
  const doc = schema.node('doc', null, [p('one'), p('two words')]);
  place(doc);
  const state = /** @type {any} */ (o.state);
  const before = o.pointOf(state, 5 + 1 + 4);
  const edited = new Transform(doc).insert(2, schema.text('xyz')).doc;
  place(edited);
  const after = o.pointOf(/** @type {any} */ (o.state), 5 + 3 + 1 + 4);
  assert.ok(before && after);
  assert.equal(after.node, before.node, 'the same text node of the kept element');
  assert.equal(after.offset, 4);
  assert.deepEqual(o.pointOf(/** @type {any} */ (o.state), 8), { node: o.holder(), offset: 1 }, 'between the two nodes: the holder, before the second element');
  assert.equal(o.pointOf(/** @type {any} */ (o.state), 100), null, 'past the last element');
});

test('the running elements a page places compare by identity, so an edit inside one redraws the pages that place it', () => {
  const [a, b, c] = [{ n: 'a' }, { n: 'b' }, { n: 'c' }];
  const running = { mark: { first: 0, start: 0, last: 1, 'first-except': null } };
  const before = runningPlaced(running, /** @type {any} */ ([{ el: a }, { el: b }]));
  assert.deepEqual(before, [a, null, b, a], 'the four readings in a fixed order (first, first-except, last, start)');
  assert.ok(sameElements(before, runningPlaced(running, /** @type {any} */ ([{ el: a }, { el: b }]))), 'the same elements: nothing to redraw');
  assert.ok(!sameElements(before, runningPlaced(running, /** @type {any} */ ([{ el: c }, { el: b }]))), 'the first element replaced at the same index: a redraw');
  assert.deepEqual(runningPlaced(null, []), []);
});
