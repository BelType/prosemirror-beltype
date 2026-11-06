# Changelog

## Unreleased

- `CiceroPage` answers `reach`, how far its decision read: every box that can stand on the page, the first textblock of the first in-flow box that cannot, and the whole of a table, flex or grid container it stands in. With `prosemirror-fragview` after 0.1.1, a change in the tail of a divided paragraph now refills the page before it. With an older view the answer is ignored.
- A hint carries its shell and row positions relative to the cut, so a page no longer drops a hint because an earlier edit shifted the document. With `prosemirror-fragview` after 0.1.1, a hint that changes under an equal `to` also fills the next page.
- The harness gains the edits `tail`, `past`, `beyond` and `carried`, and `scripts/specimen.mjs` gains `--strict`, which exits with an error when an edited chain differs from a fresh fill.

## 0.1.1 (2026-11-04)

No code change. The first version published by the workflow: a tag `v0.1.1` publishes by trusted publishing, with provenance.

## 0.1.0 (2026-11-04)

The first release to npm, published by hand.
