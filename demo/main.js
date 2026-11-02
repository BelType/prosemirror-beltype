/**
 * The demo: a ProseMirror editor whose pages are Cicero's, through this package over the published `@beltype/cicero`.
 *
 * A schema of four nodes and two marks, a document of a few pages, and a `FragmentedView` whose containers are `ciceroContainers`. The status line says how many pages the chain holds and which Cicero is running.
 *
 * @packageDocumentation
 */

import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { history, undo, redo } from 'prosemirror-history';
import { FragmentedView } from 'prosemirror-fragview';
import { ciceroContainers, ledger, collapsedSpaces } from '../src/index.js';
import cicero from '@beltype/cicero/package.json' with { type: 'json' };

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', parseDOM: [{ tag: 'p' }], toDOM: () => ['p', 0] },
    heading: { group: 'block', content: 'inline*', attrs: { level: { default: 1 } }, parseDOM: [1, 2].map((level) => ({ tag: `h${level}`, attrs: { level } })), toDOM: (node) => [`h${node.attrs.level}`, 0] },
    text: { group: 'inline' }
  },
  marks: {
    em: { parseDOM: [{ tag: 'em' }], toDOM: () => ['em', 0] },
    strong: { parseDOM: [{ tag: 'strong' }], toDOM: () => ['strong', 0] }
  }
});

const sentences = 'Mountain slopes compress, within a few kilometres, a climatic range that would otherwise span a continent. They have long served as natural laboratories for asking how temperature controls the processes of an ecosystem. Litter decomposition is one of the most studied of these processes, because it is slow enough to integrate seasonal variation and fast enough to be measured within the length of a grant.';
const p = (text) => schema.node('paragraph', null, [schema.text(text)]);
const h = (level, text) => schema.node('heading', { level }, [schema.text(text)]);
const blocks = [h(1, 'A document in Cicero’s pages')];
for (let section = 1; section <= 6; section++) {
  blocks.push(h(2, `Section ${section}`));
  for (let i = 0; i < 4; i++) blocks.push(p(sentences));
}
const doc = schema.node('doc', null, blocks);

const status = document.getElementById('status');
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
