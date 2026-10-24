# prosemirror-beltype: the plan

BelType's fragmentainer for [prosemirror-fragview](https://codeberg.org/egildo/prosemirror-fragview). Written 2026-10-24, from the design round recorded in BelType as [*the engine knows no view*](https://github.com/egildo/beltype/blob/main/.claude/decisions/project/the-engine-knows-no-view.md), which this plan does not restate: that record says what the three layers are and why, this one says what this layer builds.

## The idea in one paragraph

The fragmented view renders a ProseMirror state into a chain of fragmentainers, each a component that pulls content from a position and gives back the position where it had to stop; its basic fragmentainer reads the browser's overflow. This package is the rich one: Cicero's page, with its `@page` geometry, margin boxes, named pages, forced breaks and avoids, orphans and widows, counters and strings, and the make-up order over candidates, behind the same `fill` and the same single answer, `to`. Cicero itself is not changed to do this and never learns ProseMirror's name. This package imports the engine's objects, which operate on a document and on elements, and supplies the ProseMirror half of everything the engine's own root supplies in a one-round run: positions where the engine has addresses, rendered slices where it has clones, the view's chain where it has the Ledger, the state where it has the source DOM.

## The three layers

| Layer | Knows | Sweep |
| :--- | :--- | :--- |
| `@egildo/beltype-engine-cicero` | a document and its sheets; no view | `src/` and `seam/` never name `prosemirror` (a BelType test, a door of the record) |
| `prosemirror-fragview` | ProseMirror; no engine | no import reaches an engine; the naming sweep is to do until the words registry is a parameter |
| `prosemirror-beltype` | both | every import under `src/` is the view, the engine or a sibling (`test/layers.test.js`) |

The engine is unpublished (private in BelType's monorepo), so this package reaches it by a `file:` link to `../../../../Users/egildo/Privata/dev/beltype/packages/engine-cicero` for now (four levels up from `/Volumes/dev/Codeberg/prosemirror-beltype`; three, as first written, lands in `/Volumes`), as fragview reaches the studio. A published `@egildo/beltype-engine-cicero` replaces the link the day it exists; the import specifiers are already its.

## What this package consumes

Checked against the engine's exports on 2026-10-24. Every one operates on a document, an element or plain data; none on `<beltype-root>`.

- **Capture**: `readGeometryTable(doc)` for the `@page` geometries and named pages; `registerGcpmProperties(win)`; `effectivePageName(el)`.
- **The sheets**: `rewriteDocumentSheets(doc)` (the gcpm functions Chromium drops rewritten into what it keeps), `ensureDressing(doc)` and `deliverValues(doc, words)` (the words sheet and the continuation dressing), `WORDS_RULES` and the registry in `data-beltype.js` (`ATTRIBUTE`, `FRAGMENT`, `SPLIT`, `START`, `END`, `AWAY`, `ADJOIN`, `ARTIFACT`).
- **Measure and judgement**: `createMeasureContext(doc, contentWidthPx)`, `awaitFonts`, `awaitImages`, `assertRenderConditions`; `takeReport(container, { contentHeight })`; `adjudicate({ report, sourceOf, pageStart, contentHeight })` and `adjudicateFlow` for a row item's own verdict; `firstBelowTheEdge` as the last resort.
- **The presenters**: `present(selector, make)` and `presentation(source)` (`src/presenters.js`), the registry every copy is asked of, and `noteSource` (`src/word-space.js`) for the registration; the facsimile module, `seam/facsimile.js`, whose `install(doc, present)` reads the embedded pages' sizes and registers its presenter, loaded only when the document holds a PDF `<object>`.
- **The page**: `BeltypePage` (`<beltype-page>`), with `applyConditions`, `setFlow`, `setCounters`, `setStrings`, `setMarginBox`, `dress`.
- **Document state**: `documentOpsOf(blocks, index, { styleOf, textOf, attrOf, ancestors, marks, running })`, `counterStateAt`, `stringAssignmentsOf`, `namedStringsForPage`, `runningAssignmentsOf`.
- **Reads**: `settleReads(doc, { run, blocksOf, ... })`, `findSites`, `findPageSites`, `changedPairs`, `deliver`, `withdraw`.

## What this package fills the ProseMirror way

Each line is a gap between what the engine assumes of a one-round host and what the view offers.

- **An address is a position.** The engine's unit is a path from a block plus a word or character offset; the view's is one integer under a `Mapping`. The renderer's `pointAt(pos)` and `posAt(node, offset)` are the two hops. A candidate the Stonehand chooses is a DOM point in the trial slice; `posAt` makes it `to`.
- **A clone is a slice.** The engine measures clones of source blocks built under the page's conditions (`fragments.js`). Here the feed is the renderer's own output, `renderSlice(doc, from, end)`, which already carries the engine's words, so the dressing's suppressions (`::before`, `::marker`, the first-letter and first-line rules on a resumed piece) apply to it as to a clone. The engine's clone machinery is not used. **And the source is a second rendering of the same slice** (found in phase 1, docs/results.md): the measure context neutralizes every `break-*`, `orphans` and `widows` on what it lays out, so the Stonehand's `sourceOf` answers a law copy rendered outside it and paired with the trial element by element.
- **The Ledger is the chain.** Page numbers, `counter(pages)`, `target-counter()`, and a string's `first`, `start`, `last` and `first-except` values are reads over every entry. `pageOf(pos)` is an index lookup over `fragmentsKey.getState(state).entries`; the entry's index is the folio.
- **The source DOM is the state.** The counter and string state at a cut is computed by `documentOpsOf` over readers this package supplies; the readers answer from a rendering of the whole document kept off-screen for that purpose, or from the state directly where the ops need only structure (a heading's level, an `ol`'s `start`). Which of the two is a measurement for phase 2.
- **The resume tree is `from`.** The engine's continuation shape, open ancestors rebuilt down to the cut, is what `doc.slice(from, to, true)` gives for nothing; the renderer's shallow siblings (`away`) keep the selectors true. Where the engine resumes in a form one position cannot say, a shell of a box or a row's items each at a place of its own, `from` is the position the engine's own reading gives (`posOfCut`: a painted box's start, a blank box's end, the last item's place) and the rest rides the fill's `next` (built in the round *the page always advances*, docs/results.md).
- **The driver's loop is `fill`.** One turn of it: `fill(doc, from, render)` renders a trial slice into the measure context (bounded as the Cast-off bounds the engine's feed: the span the last page took, doubled, as `OverflowBox` does), takes the report, has the Stonehand rank the candidates under the page's content height, turns the chosen candidate into `to`, renders `from` to `to` into the page's flow, and answers `{ to, next }` where `next` names the page that follows (the named page the geometry table and the forced break ask for, a blank page after `break-before: right`) and carries what it begins with besides its slice (a box continued as a shell, a row's pieces). `OverflowBox`'s cut is candidate zero: the first line past the foot, which the walk retreats from.
- **The intake is the factory's and the page's.** The one-round host's intake duties that a copy depends on, the facsimile's page sizes and the presenters, are the factory's (`takeFacsimile`, per slice, before the trial is presented) and the page's (it presents what it renders, the trial, the law copy and the shown slice).
- **Late truth is `moved`.** The engine's rim hears a box announce its size and resumes from its address; here a container that sees its content's height change after a fill dispatches `moved`, and the view refills from that entry, as the box already does.
- **Conditions changed is invalidation.** A `@page` edit, a new sheet or a face arriving dirties every entry and every page's geometry. The view's door for it is phase 0's; this package's factory asks for it.

## The container factory

`containers(index, hint, entries)` returns a page for the entry at `index`: its geometry is the one the geometry table gives the page name in `hint` (the previous fill's `next`), or the first page's; its folio is `index + 1`, written with `setCounters`; its strings are the assignments between the entries before it, written with `setStrings`; its margin boxes are dressed from the page context. The reads loop runs around the view: `settleReads`'s `run` asks the view to refill the dirty entries and awaits the chain settled, and the loop's check decides whether a delivered value moved a line.

## The proof

**One engine, two hosts, one answer.** The same document paginated twice, once by BelType's CLI under `--engine cicero` and once through `FragmentedView` with this package, read from the same browser: the same number of pages, the same cut positions (compared as the first and last word of every page), the same folios and `target-counter()` values, the same meant warnings in the console. The specimen (`test/specimen.md`) first, the showcase (`test/index.md`, 76 pages) second. Where they disagree the CLI round is the reference and this package is wrong, unless the disagreement is a cut the round itself gets wrong, which is a case for BelType's battery, filed there. A Playwright script in `scripts/` runs both and records the result in `docs/results.md`.

The studio's present orchestrator is not the proof: it is what this package replaces.

## Phases

Each phase is a branch of this repository, measured by a script, recorded in `docs/results.md`, and merged when green. Phase 0 is not this repository's work and gates phase 1.

0. **The doors, upstream.** In BelType: a page takes content from whoever holds it (`BeltypePage` given a content element directly, beside the root's slot forwarding); `documentOpsOf` kept over supplied readers; `settleReads` over an abstract chain; the `prosemirror` sweep. Each on BelType's `main` with the battery green and no cut changed. In fragview: the words registry as a parameter of the renderer with a neutral default; container invalidation. Filed in BelType's `.claude/NEEDED-FIXES.md` and in fragview's plan.
1. **The page as fragmentainer, without reads.** `CiceroPage` implementing `fill` over the measure context and the Stonehand; the factory from the geometry table; `next` hints for named and blank pages; `moved`. Measured on the specimen against the CLI round: same pages, same cuts. The phase that may send the seam back: if the trial slice does not lay out as the engine's feed does, the record's third ruling has a fourth door to name.
2. **Reads and counters.** The folio, `counter(pages)`, `target-counter()`, strings and running elements, the reads loop around the view, the counter state at a cut. Measured on the showcase: 76 pages, same words per page, same folios, the two meant warnings.
3. **The studio adopts it.** The studio mounts `FragmentedView` with this package's factory and retires `src/positions.js` and `src/patching.js`; the studio's own checks (lossless, the acts, typing sessions) run unchanged. What the studio exports to fragview (`chainOf`, the page-serializer hook per mark instance) lands on the way.
4. **Caster reads the pages.** Caster's Cicero adapter reads `<beltype-page>` elements an engine presented; the pages this package fills are the same element. The print panel's specimen through the view, printed, against the CLI's print: *the conservation of words* holds or names what it lost.

## Open questions

- Whether the counter state at a cut is read from an off-screen whole rendering or from the state's structure; a measurement for phase 2 (cost per cut on the showcase, both ways).
- ~~Whether `fill` renders the trial into the engine's measure context or into the page itself with the foot unclipped.~~ **Answered by phase 1: the measure context.** It is the engine's conditions exactly, and the cuts agreed on every page of the specimen and of the flow fixture. The page itself was not measured: `takeReport` reads its container's children in the container's coordinates, the page's content stands in its light DOM under a shadow grid offset by the margins, and the page neutralizes neither the break properties nor the transforms, so it would need a door in the Gauge and would save one render of three.
- ~~The `next` hint's shape when a forced break and a named page disagree, and whether a blank page is an entry with `from === to`.~~ **Answered by phase 1:** `{ name, forced?, blank? }`, the name the effective page name where the next page begins, `forced` for a forced break or a named switch (the next page keeps its leading margin), `blank` where a forced side is owed. A blank page is an entry with `from === to`, of the same name with `:blank`, whose hint drops `blank` and keeps `forced`. They cannot disagree: the grab's event is one place, its name is the name of the box there and its parity is the break's.
- The name of the fragmentainer class. `CiceroPage` is the working one; the craft word (the box is the galley, the engine's page is the chase with the Stonehand in it) is Egildo's to pick.

## Refused, with the reason

- **Changing a cut to make the two hosts agree.** The CLI round is the reference; a disagreement is this package's bug or the battery's case, never a tolerance.
- **Importing `<beltype-root>`.** The root is the one-round presenter; this package is the other presenter, and a page served by both would make the engine's two hosts one again.
- **Copying the reads loop.** One loop, the engine's, with `run` supplied; a second loop here would be the second implementation of the same guess the record refuses as a proof.

## Where things are

- The record: `../beltype/.claude/decisions/project/the-engine-knows-no-view.md`; the doors: `../beltype/.claude/NEEDED-FIXES.md`, entry of 2026-10-24.
- The view's seam: `prosemirror-fragview/src/fragmentainer.js` (the types), `slice-renderer.js` (the words and the two sheets), `overflow-box.js` (candidate zero), `docs/plan.md`.
- The engine: `../beltype/packages/engine-cicero/src/` (`driver.js` for the loop this package turns into `fill`, `stonehand.js`, `gauge.js`, `measure.js`, `chase.js`, `document-state.js`, `reads.js`, `capture.js`, `data-beltype.js`), `seam/` (`rewrite-document.js`, `client.js` for how the one-round host wires the same objects).
- The studio's orchestrator this replaces: `../beltype-studio-experiment/src/positions.js`, `src/patching.js`.
- The demo of the view alone: `/Volumes/dev/alpha`.
