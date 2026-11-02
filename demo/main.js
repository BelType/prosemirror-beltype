/**
 * The demo: a ProseMirror editor whose pages are Cicero's, through this package over the published `@beltype/cicero`.
 *
 * A schema for a small book (a title page, chapters, sections, quotations and lists), a specimen of a few pages about pagination, and a `FragmentedView` whose containers are `ciceroContainers`. The status line says how many pages the chain holds and which Cicero is running.
 *
 * @packageDocumentation
 */

import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { history, undo, redo } from 'prosemirror-history';
import { FragmentedView } from 'prosemirror-fragview';
import { rewriteDocumentSheets } from '@beltype/cicero/rewrite';
import { ciceroContainers, ledger, collapsedSpaces } from '../src/index.js';
import cicero from '@beltype/cicero/package.json' with { type: 'json' };

const inline = 'inline*';
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    title: { group: 'block', content: inline, parseDOM: [{ tag: 'p.book-title' }], toDOM: () => ['p', { class: 'book-title' }, 0] },
    subtitle: { group: 'block', content: inline, parseDOM: [{ tag: 'p.book-subtitle' }], toDOM: () => ['p', { class: 'book-subtitle' }, 0] },
    paragraph: { group: 'block', content: inline, parseDOM: [{ tag: 'p' }], toDOM: () => ['p', 0] },
    heading: { group: 'block', content: inline, attrs: { level: { default: 1 } }, defining: true, parseDOM: [1, 2].map((level) => ({ tag: `h${level}`, attrs: { level } })), toDOM: (node) => [`h${node.attrs.level}`, 0] },
    blockquote: { group: 'block', content: 'paragraph+', defining: true, parseDOM: [{ tag: 'blockquote' }], toDOM: () => ['blockquote', 0] },
    ordered_list: { group: 'block', content: 'list_item+', parseDOM: [{ tag: 'ol' }], toDOM: () => ['ol', 0] },
    bullet_list: { group: 'block', content: 'list_item+', parseDOM: [{ tag: 'ul' }], toDOM: () => ['ul', 0] },
    list_item: { content: 'paragraph+', defining: true, parseDOM: [{ tag: 'li' }], toDOM: () => ['li', 0] },
    text: { group: 'inline' }
  },
  marks: {
    em: { parseDOM: [{ tag: 'em' }], toDOM: () => ['em', 0] },
    strong: { parseDOM: [{ tag: 'strong' }], toDOM: () => ['strong', 0] }
  }
});

/** Text with `*emphasis*` read as the `em` mark. */
const runs = (text) => text.split(/(\*[^*]+\*)/).filter(Boolean).map((part) => part.startsWith('*') ? schema.text(part.slice(1, -1), [schema.marks.em.create()]) : schema.text(part));
const p = (text) => schema.node('paragraph', null, runs(text));
const h = (level, text) => schema.node('heading', { level }, runs(text));
const quote = (...texts) => schema.node('blockquote', null, texts.map(p));
const list = (type, ...items) => schema.node(type, null, items.map((item) => schema.node('list_item', null, [p(item)])));

const doc = schema.node('doc', null, [
  schema.node('title', null, runs('On the making of pages')),
  schema.node('subtitle', null, runs('A short specimen for an editor whose pages are cut as you type')),

  h(1, 'The page'),
  p('A page is a promise about attention. It says that this much, and no more, will be in front of the reader at once, and that what follows can wait for a turn of the hand. Everything a typesetter does at the foot of a page is a negotiation with that promise: how much to keep, how much to send on, and what the reader will see first when the next page opens.'),
  p('On a screen the promise is usually broken on purpose. The text runs on, the window scrolls, and no line is ever forced to choose between two places. This editor keeps the promise instead. Every page you see is a box of a fixed size, and the text is poured into the chain of boxes again wherever you change it, so the page you are typing on is always a page that could be printed.'),
  h(2, 'The box and its margins'),
  p('The page here is A5, with a little more margin at the foot than at the head, as books have had since the scribes ruled their quires. The folio sits in the outer corner, where a thumb finds it, and the running head carries the title of the chapter on the right-hand page and the title of the book on the left. The title page carries neither: it is a named page, and its margin boxes are emptied.'),
  p('None of that is drawn by the editor. It is the stylesheet of the document, read by the paged engine, and the same sheet would give the same pages if the document were printed without an editor at all. Change a margin in the sheet and every page is cut again.'),
  h(2, 'What a page is made of'),
  list('ordered_list',
    'A size and four margins, which together give the area the text may fill.',
    'Sixteen margin boxes around that area, any of which may carry a folio, a string or an element taken out of the flow.',
    'A name, which lets one kind of page differ from another, and a side, left or right, which lets a spread differ from itself.',
    'The text, cut wherever the area runs out, under the rules the next chapter describes.'),
  p('Of these, only the last changes as you type. The first three belong to the sheet, and the engine reads them once.'),

  h(1, 'Breaking'),
  p('A break is a decision taken at the foot of a page about a box that does not fit. The simplest answer is to cut the box at the last line that fits and carry the rest over. The rules of good setting are the reasons not to take that answer.'),
  h(2, 'Widows and orphans'),
  p('A paragraph that leaves a single line at the foot of a page has left an orphan; one that carries a single line over to the top of the next has left a widow. Both are permitted by the machinery and refused by the eye, and the sheet here asks for at least two lines on each side of a cut. When a paragraph cannot honour that, the engine moves the cut up a line, and the page ends a little short.'),
  quote('The page that ends a line early is not a failure of the engine. It is the engine keeping a promise the author made in the sheet, and the white at the foot is the price of keeping it.'),
  h(2, 'Keeping headings with their text'),
  p('A heading at the very foot of a page, with its text on the next, points at nothing. The sheet says that a heading may not be separated from what follows it, so a heading that would land alone at the foot is carried over together with the first lines of its section. Type a few lines into the paragraph before a heading near the foot of a page, and watch the heading jump to the next page as soon as it would be left behind.'),
  p('The same kind of rule keeps a quotation whole. A short quotation is set as one block, and if it does not fit at the foot of a page, the whole of it goes on to the next one.'),
  h(2, 'Forced breaks'),
  p('Some breaks are not negotiated at all. Every chapter of this specimen begins on a new page, because the sheet says so on the chapter heading, and the space left at the end of the chapter before it is simply left white. The title page ends with a forced break of its own.'),
  list('bullet_list',
    'A forced break before every chapter.',
    'A break kept from falling between a heading and its text.',
    'A quotation that may not be divided.',
    'At least two lines of a paragraph on either side of a cut.'),
  p('Four rules, and every page of this specimen obeys all of them while you type.'),

  h(1, 'Running heads'),
  p('The running head is the page talking about itself. It names the chapter the reader is in, so that a book opened anywhere says where it was opened. Its value is not written on the page; it is taken from the text, from the last chapter heading the flow has passed, and set into the margin box of every page until another heading replaces it.'),
  p('That makes the running head a fact about the whole document and not about the page alone. When you rename a chapter, every page of that chapter has to learn its new name, including pages far from the one you are typing on. Try it: change the title of this chapter, and the heads of the pages that follow change with it.'),
  h(2, 'Counting pages'),
  p('The folio is the other fact a page cannot know by itself. It depends on how many pages came before, and that depends on every break above it. Insert a paragraph in the first chapter and every folio after it moves on by one, which is the cheapest way to see that the pages here are cut again and are not merely redrawn.'),
  p('An editor that keeps the promise of the page has to keep all of these facts true at once, after every keystroke. This specimen is small enough that you can watch it do so.'),
]);

const status = document.getElementById('status');
// The browser drops what it does not know, `string()` and `string-set` among them: the sheets are rewritten for Cicero first, as every host of the engine does, and only then is the page geometry read.
await rewriteDocumentSheets(document);
const containers = ciceroContainers(document);
const view = new FragmentedView(document.getElementById('editor'), {
  state: EditorState.create({ doc, plugins: [history(), ledger(), collapsedSpaces()] }),
  words: { attribute: 'data-beltype' },
  containers,
  handleKeyDown(view, event) {
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.key === 'z') return (event.shiftKey ? redo : undo)(view.state, view.dispatch);
    return false;
  }
});

const report = () => {
  const pages = document.querySelectorAll('#editor beltype-page').length;
  status.textContent = `Cicero ${cicero.version} · ${pages} pages · ${view.state.doc.textContent.length} characters`;
};
new MutationObserver(report).observe(document.getElementById('editor'), { childList: true, subtree: true });
report();
Object.assign(window, { view, containers });
