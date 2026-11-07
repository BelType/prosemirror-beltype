# Changelog

## Unreleased

The measurement stands on its own.

- `scripts/specimen.mjs` no longer starts a BelType checkout's dev server. It serves a finished document's folder itself, with the engine's head spliced in as `beltype print` does, and asks the engine for its whole run. `BELTYPE_ROOT` and `BELTYPE_STUDIO` are gone.
- The fixtures are finished HTML, `fixtures/<name>/index.html`, on `fixtures/base.css` and `fixtures/fonts`, which freeze what the old command line put under a document. The specimen is `fixtures/specimen`, and it is the default target. A target is now a folder, so `@beltype/specimens`' documents can be measured too.
- The harness parses with `prosemirror-fragview/schema-generic`, and the pin moves to fragview's `main` for it. `FRAGVIEW` names a checkout to run against instead, for a change not yet pushed.
- A leaf's node view is proved on a real `CiceroPage` (`test/faces.test.js`): the same cuts, and the host's element kept across a refill and a move to the next page. Nothing in the page changed for it.
- A first fill, a restored state and an `invalidate()` settle cold, as the engine's driver settles anything but a resume, so the editor lands on the page numbers a reopen and the command line land on. Only an incremental settle starts from the Ledger's tables, a settle that ended incomplete no longer writes them, and `invalidate()` blanks the page total until a page runs to the end again (`test/settle.test.js`).

- `CiceroPage` answers `reach`, how far its decision read: every box that can stand on the page, the first textblock of the first in-flow box that cannot, and the whole of a table, flex or grid container it stands in. With `prosemirror-fragview` after 0.1.1, a change in the tail of a divided paragraph now refills the page before it. With an older view the answer is ignored.
- A hint carries its shell and row positions relative to the cut, so a page no longer drops a hint because an earlier edit shifted the document. With `prosemirror-fragview` after 0.1.1, a hint that changes under an equal `to` also fills the next page.
- `collapsedSpaces` no longer binds words: spaces typed one by one at a line's end, then a word, alternate as the same run inserted at once does. They used to stay as two U+00A0 in the saved document.
- A fill that throws no longer stops the chain. The page shows the node at its start unmeasured and answers past it, its account says `failed`, and `chain.settled(doc)` answers incomplete until the page fills.
- A fill whose rendering throws, a node's `toDOM`, no longer stops the chain at that page: the safety net rendered again outside any guard, so `chain.settled(doc)` never answered. The page now shows empty and answers past the node, and the chain hears of the failure whatever the safety net does. The harness gains the edit `throw-render`.
- A page says what its foot cuts off with no later page to show it: `clipped` in its account, in pixels of the flow and of a parallel flow, and one warning per page.
- A bounded feed that decides nothing takes the node at the page's start whole, with a warning, where it used to take the rest of the document and close the chain.
- The running copies in the margin boxes are `inert`, not editable and not spellchecked.
- The Ledger follows the chain when `setProps` gives the view a new factory.
- `Chain.settles` and `Originals.timings` keep the last 64 records, the settle record holds no document, and the per-state element count is gone.
- The chain is cut again when the device pixel ratio changes, as a browser zoom or a move to another screen changes it: a `resolution` media query, asked again at each new ratio, calls the view's `invalidate()` once the ratio has held for 250 ms. A page cut at a ratio other than 1 says so with `dpr` in its account, and the console says it once per document and ratio, since print runs at 1. `scripts/specimen.mjs` gains `--dpr n`.
- A page under a zoom built on a CSS transform no longer dispatches `moved` at every frame. It recorded each node's height after the transform and compared it with the observer's `borderBoxSize`, from before it, so at `scale(0.5)` the four pages of a test document dispatched 120 `moved` in 30 frames after the chain settled. It now records the height divided by the page's scale (`test/zoom.test.js`, at 0.5 and 1.5).
- A page ends the boxes an ordinary cut divides as the engine ends its constructed first fragment, through `mutateToFirstFragment`: the last line before the cut stays justified, a box with `box-decoration-break: clone` keeps its block-end border and padding, and the innermost divided box takes the extension as block-end padding, so its background reaches the page's foot. The trial does the same at its bound, and a box the page resumes keeps its cloned block-start border and padding, on the trial and on the page. The new fixture `justified` was 10 pages against 10 with the first difference on page 4; it now agrees on every page and every divided piece's edge. The harness now also exits with an error when the cut-off pieces' edges differ.
- `scripts/specimen.mjs` exits with an error when the view's pages and the CLI's hold different words on any page (the guard, `compareHosts`), where it used to print the difference and exit 0. Two differences are allowed, each named in the script's `ALLOWED` list with its fixture, its page and its reason: `multicol` page 3 and `clipped` page 3.
- The harness gains the edits `throw`, `tail`, `past`, `beyond` and `carried`, and the fixture `clipped`, and `scripts/specimen.mjs` gains `--strict`, which exits with an error when an edited chain differs from a fresh fill.

## 0.1.1 (2026-11-04)

No code change. The first version published by the workflow: a tag `v0.1.1` publishes by trusted publishing, with provenance.

## 0.1.0 (2026-11-04)

The first release to npm, published by hand.
