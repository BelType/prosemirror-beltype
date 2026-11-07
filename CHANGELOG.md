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
- Changing the page's geometry under a mounted view is proved and documented: link the sheet with the new `@page` and give the view a new factory, `view.setProps({ containers: ciceroContainers(document) })`. On the new fixture `repage`, whose second sheet also sets margins by side, the repaged chain equals a fresh mount and the CLI's pages of the same geometry (`repage-b`) on every page. `view.invalidate()` on the same factory keeps the old geometry, since the factory reads the geometry table once. The harness gains the edit `repage:<sheet>`.
- The chain is cut again when the device pixel ratio changes, as a browser zoom or a move to another screen changes it: a `resolution` media query, asked again at each new ratio, calls the view's `invalidate()` once the ratio has held for 250 ms. A page cut at a ratio other than 1 says so with `dpr` in its account, and the console says it once per document and ratio, since print runs at 1. `scripts/specimen.mjs` gains `--dpr n`.
- A page under a zoom built on a CSS transform no longer dispatches `moved` at every frame. It recorded each node's height after the transform and compared it with the observer's `borderBoxSize`, from before it, so at `scale(0.5)` the four pages of a test document dispatched 120 `moved` in 30 frames after the chain settled. It now takes the observer's first report after the fill as the height to compare with (`test/zoom.test.js`, at 0.5 and 1.5).
- A page ends the boxes an ordinary cut divides as the engine ends its constructed first fragment, through `mutateToFirstFragment`: the last line before the cut stays justified, a box with `box-decoration-break: clone` keeps its block-end border and padding, and the innermost divided box takes the extension as block-end padding, so its background reaches the page's foot. The trial does the same at its bound, and a box the page resumes keeps its cloned block-start border and padding, on the trial and on the page. The new fixture `justified` was 10 pages against 10 with the first difference on page 4; it now agrees on every page and every divided piece's edge. The harness now also exits with an error when the cut-off pieces' edges differ.
- `scripts/specimen.mjs` exits with an error when the view's pages and the CLI's hold different words on any page (the guard, `compareHosts`), where it used to print the difference and exit 0. Two differences are allowed, each named in the script's `ALLOWED` list with its fixture, its page and its reason: `multicol` page 3 and `clipped` page 3.
- The harness gains the edits `throw`, `tail`, `past`, `beyond` and `carried`, and the fixture `clipped`, and `scripts/specimen.mjs` gains `--strict`, which exits with an error when an edited chain differs from a fresh fill.

- The `prosemirror-fragview` dev pin moves to `805db68`, its `main` with the hint passed on every fill, `handleFillRejected`, the selected node's class on every piece and every `handleDOMEvents` key. Nothing in this package changed for it: `pnpm test` 67 of 67, and every fixture agrees with the CLI and with a fresh fill under `--strict` with the edits `start;key:2;delete:2;end;paste`.
- A page reads its hint from `fill`'s fourth argument, which `prosemirror-fragview` 805db68 hands every fill, and `Chain.hintFor`, the side channel that read it by index, is gone. On the chrome fixture, retitling `Folios` gives 17 of 17 pages equal to a fresh fill, and 5 of 17 when the page ignores the hint it is handed. A view older than 805db68 refills a page under the hint it was built with.

- `handleFillRejected`, exported, is the view's prop for a chain of Cicero pages, as `prosemirror-fragview` 805db68 defines it. A fill whose safety net threw too used to leave its page dirty and every page after it waiting, with the error raised and nothing else. The page now shows empty, answers past the node at its start with `failed` in its account, and the chain goes on, while `chain.settled(doc)` answers incomplete naming the page (`test/settle.test.js`, with the bare view's stop beside it). Any other container is left to the view.
- The README says how to host the pages: the two props, prefixing author ids so Cicero's `target-text()` cannot read a host app's element of the same id, and that the `near` window is not supported with Cicero pages.
- Late truth stays on the page's own `ResizeObserver`. `@beltype/cicero` 0.1.8 has `watchLateTruth` in `dist/seam/rim.js`, used by its client, but no export reaches it: `./internal/*` maps `dist/src` only. Seating it in `ciceroContainers` needs Cicero to export it, for instance a `./rim` entry for `dist/seam/rim.js` with `watchLateTruth`, `bringsNewFace` and `knowLoadedFaces`, and the page to answer its `presented`, `pageHolding` and `measured` questions from the chain's pages. The Cicero dev pin stays at 0.1.6.

## 0.1.1 (2026-11-04)

No code change. The first version published by the workflow: a tag `v0.1.1` publishes by trusted publishing, with provenance.

## 0.1.0 (2026-11-04)

The first release to npm, published by hand.
