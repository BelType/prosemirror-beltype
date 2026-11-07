# Results

A record, not a plan: what each phase of [the plan](plan.md) built, what its measurement found, and what it left undone. The plan says what is meant; this file says what happened.

## Phase 1, the page as fragmentainer without reads

Written 2026-10-24, on the branch `phase/1-the-page-as-fragmentainer`. Run it again with `npm test` (10 tests, in node) and `npm run specimen` (BelType's specimen; `node scripts/specimen.mjs <target>` takes any path BelType's CLI takes, relative to its repository's root, such as the flow fixture's absolute path).

### What was built

| Module | Lines | What it is |
| :--- | ---: | :--- |
| `src/cicero-page.js` | 426 | `CiceroPage`, the fragmentainer: a `<beltype-page>` made with `createElement`, given its geometry (`applyConditions`), dressed (`dress`), filled through `setContent`, its flow set (`setFlow`); `fill` is one turn of the driver's loop through the engine's own functions; `pointAt` and `posAt` over the slice it shows; `moved` from a `ResizeObserver` on what it was given; `release`. |
| `src/containers.js` | 30 | `ciceroContainers(document, options)`: the render conditions asserted (`assertRenderConditions`, the device pixel ratio relaxed as the CLI's preview relaxes it), the gcpm properties registered, the geometry table read once, and a page per entry. |
| `src/turn.js` | 138 | The arithmetic between the engine's calls: the trial's span, the side, the condition the table is asked, the hint a fill leaves, a box boundary as a position (`enter`), a word of the Gauge's as a DOM point (`wordPoint`, `placeAt`), and a verdict as a position (`verdictPosition`). |
| `src/index.js` | 9 | The exports. |
| `harness/specimen.js` | 143 | The module the measurement injects into BelType's page: the one reading of a page's words for both hosts, the served document parsed with the studio's generic schema, the view mounted beside the root. |
| `scripts/specimen.mjs` | 97 | The measurement: BelType's dev server under Cicero, Vite, Chromium, the two hosts read and compared. |
| `test/turn.test.js` | 127 | The hints over a geometry table and a forced break, the span, and Class A, B and C verdicts mapped over a hand-built `RenderedSlice`. `test/layers.test.js` is unchanged and green. |
| `fixtures/flow/` | 122 | A 1 991-word document on a 110 × 150 mm page whose cuts reach the Stonehand, since the specimen's never do (below). |

### The fill, step by step, and where it departs from the driver's loop

1. **Conditions.** The page's name is the effective page name at `from`, read off the trial's law copy (step 2) as the driver's `nameAt` reads it off the source: the box the page begins in, or, at a box's start, the deepest in-flow block beginning there, then `effectivePageName`. Its geometry is `pageFor({ name, first, parity, blank })`, its side from its index (page one a right page). The factory's hint names the page before the fill, so the element has its size while it waits; the fill names it again from its content, which is the driver's rule (C8).
2. **The trial.** The slice from `from` to `from + span` (the span the last cut fill held, doubled; 2 048 on a first fill) is rendered twice by the view's renderer, with the engine's words (`{ attribute: 'data-beltype' }`): once into the engine's measure context at the page's content width (`createMeasureContext`), once into a hidden holder outside it, the **law copy**. The two trees are paired element by element, and the pairing is the Stonehand's `sourceOf`. A box `isFixedBox` names (a `position: fixed` box, a running element) is put away on both copies and on the page. The fonts and the trial's images are awaited (`awaitFonts`, `awaitCloneImages`), the report taken (`takeReport`), and the trial doubled until it reaches below the edge (`reachesBelowTheEdge`) or the document's end.
3. **The grab.** The engine's `forcingIndexOf` is built over the law copy's top-level blocks, with readers this package supplies (the law's computed style, `effectivePageName`, a path from `pathOf`), and asked for the first forcing event strictly after the page's start, for a page of this name (`find`). An event in the trial is entered as a position (`enter`), the trial is rendered again up to `openedAt` of it, as the driver cuts its feed at the event, and measured again.
4. **Judgement.** The in-flow procession's bottom is compared with the content height, the driver's `fits`. A page that fits ends at the event, or at the document's end (`to: null`). One that does not has the Stonehand rank the candidates (`adjudicate`); no verdict is one uncuttable run taller than the page, which ends where it would have (C2).
5. **The verdict as a position** (`verdictPosition`). A Class A boundary before a box is the box's position entered down its first-child chain, the fragmented view's convention: the nodes that open at a cut are the next fragment's, drawn with `adjoin`, and the page before shows up to `openedAt(doc, to)`, the position before the box. An anonymous run's boundary is its first word. **A Class B cut is the position of the first character the line after the cut shows**: `placeAt(report.wordsOf(box), k + 1)` gives a word and, where the line begins inside it, a character, and `joinedWords(box.el)` gives the text node and offset, across the word's parts and past any text the engine wrote. The breaking space that ended the line before stays on the page before, and no line is split between two positions. A start-edge Class C is the boundary before the child after the gap.
6. **The page.** The slice from `from` to `openedAt(doc, to)` is rendered again and given through `setContent`; after a forced break the `adjoin` word is taken off every element, since §5.2 keeps the margin after a forced break and the engine builds that continuation with `forced`. The flow is given the lead the report measured (`report.contentTop` after an unforced break, 0 after a forced one or at the document's start), the extent the verdict used, and the extension a divided box takes (`extensionPx`, the engine's own arithmetic, over the addresses of `from` and `to` in the law copy). The answer is `{ to, next }`, `next` the hint below.

Where the fill departs from the driver's loop. None of these changed a cut in the two documents measured, and each would in a document that reaches it.

- **The bound on the feed** is the view's span, doubled until the Cast-off's own check holds, not the Cast-off's word estimate. The check is the engine's, so a trial that reaches the Stonehand holds the box the walk stops at, as a bounded feed must.
- **The spent lead of a resumed box** (`spentLeadOf`: a grid's track, a table's repeated header) is not read; the lead is `contentTop` alone.
- **A parallel flow carried across a cut** (a float, an absolutely positioned box, a row item) has no place in a position: the driver mints a resume tree for it, and a position names one place. Not reached by either document.
- **A shell**: an end-gap Class C, an edge cut through a monolith and a cut through a row continue a box of so many pixels on the next page. `verdictPosition` answers the boundary after (an end gap) or before the box and the page warns on the console. Not reached by either document. (Built since: "The page always advances, and the shells", below.)
- **The repeated table header** (`fragments.js`' `liftRepeatedHeader`, decided by the driver's `decideRepeats`) and the repeated footer's reservation have no counterpart: the renderer writes a `thead` before the cut as a shallow sibling, put away. This is the showcase's first difference (below).
- **The root's parity demand** on the document's first page (`rootParityDemand`) is not read.
- **No reads.** No folio, no `counter(pages)`, no named strings, no running element in a margin, and the author's counters are not delivered at a page's start (`setCounters`). In the measurement's page the CLI's delivery sheet is adopted on the document and keyed by attribute, so the view's content shows the CLI's `target-counter()` values: phase 1 is without reads on the view's side only.
- **The composed mode** is not offered: the fill reads the browser's own lines.

### The next hint's shape, and the blank page

`next` is `{ name, forced?, blank? }`. `name` is the effective page name where the next page begins, read off the law copy at `to`, or off the event's box for a forced break. `forced` says the next page begins at a forced break or a named-page switch, so its leading margin is kept. `blank` is set where a forced `left`, `right`, `recto` or `verso` demands a side the next page does not fall on: the next page is **an entry with `from === to`**, the factory makes a page of the same name with `:blank` on, and its fill renders nothing and answers `{ to: from, next: { name, forced: true } }`, which spends the demand whether or not it was needed, as the driver's blank entry does. A forced break and a named page cannot disagree here: the grab's event is one place, its name is the name of the box there, and its parity is the break's (§4.3's combination is the engine's, inside `find`).

### The measurement

**Setup: one page, two instances of the engine.** BelType's dev server serves the target under Cicero on a free port (`node bin/beltype.js <target> --engine cicero --port P`, run from the engine's repository, `P` drawn by the operating system and refused if it is a port `.claude/launch.json` lists or one of 48760–48762, 48789, 48791, 48792, 48794, 48796, 48798 and 5173). Chromium opens it headless at 1400 × 1000, device pixel ratio 1, and waits for `__beltypeCicero.last.complete`; the root builds every page (`buildAll`), and each page's first and last visible word is read. Then the harness module is loaded from Vite on a second free port into the same page (`page.addScriptTag({ type: 'module' })`; Vite answers the cross-origin module request, `cors: true`), the rim's later signals are taken by the host (`beltype:change`, `preventDefault`; none arrived), the root is hidden, and the view is mounted beside it: the served HTML fetched again and parsed with the studio's generic schema (structured marks), `words: { attribute: 'data-beltype' }`, the factory above, the default window policy (every page built). The engine's modules in the page and the ones the harness imports are two instances; `<beltype-page>` is the page's, registered first, and `createElement` makes it for both. No fallback page was needed.

The words are read by one function for both hosts (`harness/specimen.js`' `wordsOf`): the text the page's content slot holds, flattened, each word kept where an inked rect of it lies inside the page box and above the flow's clip, a word running across two text nodes counted once.

**The specimen** (`test/specimen.md`): 9 pages on each side, the same first and last word on every page, the same page sizes. First difference: none.

| Page | CLI first | CLI last | words | View first | View last | words | entry | the view's fill |
| ---: | :-- | :-- | ---: | :-- | :-- | ---: | :-- | :-- |
| 1 | `Summary` | `Appendix` | 7 | `Summary` | `Appendix` | 7 | 0–135 | forced, unnamed |
| 2 | `Table` | `Appendix` | 13 | `Table` | `Appendix` | 13 | 135–308 | named switch, unnamed |
| 3 | `Introduction` | `path.` | 113 | `Introduction` | `path.` | 113 | 308–1071 | forced, `chapter`, blank next |
| 4 | · | · | 0 | · | · | 0 | 1071–1071 | blank, `chapter` |
| 5 | `Installation` | `order.` | 37 | `Installation` | `order.` | 37 | 1071–1340 | forced, `chapter`, blank next |
| 6 | · | · | 0 | · | · | 0 | 1340–1340 | blank, `chapter` |
| 7 | `Configuration` | `keys.` | 30 | `Configuration` | `keys.` | 30 | 1340–1565 | forced, `chapter`, blank next |
| 8 | · | · | 0 | · | · | 0 | 1565–1565 | blank, `chapter` |
| 9 | `Appendix` | `material.` | 3 | `Appendix` | `material.` | 3 | 1565–end | terminal, `chapter` |

Every page of the specimen fits: each ends at a forced break, a named-page switch or the document's end, and **the Stonehand is never asked**. The specimen proves the grab, the named pages, the parity and the blank pages, and nothing about a cut.

**The flow fixture** (`fixtures/flow/flow.md`), written for that reason: 26 pages on each side, the same first and last word on every page, the same sizes (13 pages at 110 × 150 mm, six of the named `wide` page at 150 × 110 mm, seven more of the first). First difference: none. Its cuts: 8 Class B, 13 Class A adjudicated, one forced break owing a blank page, two named-page switches, the terminal page.

| Page | CLI first | CLI last | View first | View last | words | the view's fill |
| ---: | :-- | :-- | :-- | :-- | ---: | :-- |
| 1 | `The` | `marginal` | `The` | `marginal` | 59 | B |
| 2 | `ink` | `a.` | `ink` | `a.` | 99 | A |
| 3 | `Which` | `ornament.` | `Which` | `ornament.` | 106 | A |
| 4 | `To` | `colophon.` | `To` | `colophon.` | 63 | A |
| 5 | `Page` | `Justification` | `Page` | `Justification` | 114 | B |
| 6 | `compositor` | `tympan.` | `compositor` | `tympan.` | 24 | forced, blank next |
| 7 | · | · | · | · | 0 | blank |
| 8 | `Part` | `dingbat;` | `Part` | `dingbat;` | 74 | A |
| 9 | `With` | `for.` | `With` | `for.` | 56 | A |
| 10 | `Glossary` | `ellipsis;` | `Glossary` | `ellipsis;` | 92 | A |
| 11 | `Ligature` | `quoin` | `Ligature` | `quoin` | 103 | B |
| 12 | `rule` | `bibliography` | `rule` | `bibliography` | 86 | B |
| 13 | `small` | `chapter.` | `small` | `chapter.` | 17 | named switch |
| 14 | `Part` | `spread.` | `Part` | `spread.` | 90 | A, `wide` |
| 15 | `Heading` | `diaeresis;` | `Heading` | `diaeresis;` | 93 | A, `wide` |
| 16 | `Capitals` | `furniture.` | `Capitals` | `furniture.` | 85 | A, `wide` |
| 17 | `Break` | `lead.` | `Break` | `lead.` | 92 | A, `wide` |
| 18 | `Section` | `column` | `Section` | `column` | 103 | B, `wide` |
| 19 | `signature` | `recto.` | `signature` | `recto.` | 39 | named switch, `wide` |
| 20 | `Part` | `imposition.` | `Part` | `imposition.` | 91 | B |
| 21 | `Baseline` | `recto.` | `Baseline` | `recto.` | 89 | A |
| 22 | `With` | `are` | `With` | `are` | 100 | B |
| 23 | `lead.` | `are.` | `lead.` | `are.` | 67 | A |
| 24 | `Appendix` | `impression.` | `Appendix` | `impression.` | 100 | A |
| 25 | `A` | `column` | `A` | `column` | 87 | B |
| 26 | `fragment.` | `from.` | `fragment.` | `from.` | 19 | terminal |

The words column is the same on both sides on every page, so it is given once.

**The console.** No warning and no error on either side, for either document. The CLI's round writes four `info` lines (the sheet rewrite, a stop at a page, the reads settled, the page count), which are its seam's and not the engine's functions'; the view's fills wrote none.

**Time**, for scale and not as a comparison: the view's chain filled the specimen in 14 to 17 ms over 9 fills and the flow fixture in 24 to 34 ms over 26, each fill rendering the slice three times (trial, law copy, page) and measuring once or twice; the CLI's last `run()` call took 13 to 15 ms and 28 ms, after its bootstrap had cut the first screen.

**A wider probe, the showcase** (`test/index.md`, phase 2's document): 7 pages under the CLI, 6 under the view. Page 1 agrees (`Welcome` to `Working`, a Class A cut after the first row of the features table, the same on both sides). **The first difference is page 2: the CLI's begins with `Feature`, the view's with `Hot`.** The cause, read off the two pages: the CLI repeats the table's header on the table's second fragment (`Feature | Status`, *the header repeats*), and the view's slice of the table has its `thead` written as a shallow sibling and put away, so the view's page 2 holds the header's height more of rows and every page after it differs. It is the repeated header in the departures above, and it is phase 2's document's to settle.

### What each fix was measured to be worth

Each was left out once and the measurement run again, 2026-10-24.

- **The law copy.** With the trial read as its own source by the Stonehand (the grab still read the law copy), the measure context's neutralizing sheet answers `auto` for every `break-*` and 2 for `orphans` and `widows`: on the flow fixture's page 4, where the CLI moves the box kept whole to the next page and leaves 154 px empty, the view cut between its lines, and every page after it differed, 22 pages against 26.
- **The text mechanics.** The fragmented view's editing host sets `white-space: break-spaces`, `overflow-wrap: break-word` and no ligatures on its root, and Chromium's UA style gives a `contenteditable` host `line-break: after-white-space` and `overflow-wrap: break-word` (checked 2026-10-24 on Playwright's Chromium: both inherit to a child); all of them inherit into a container's content, and the trial in the measure context inherits from the body instead. With the page's reset left out the cuts were the same, since the trial decides them, but the page set the text on more lines than the trial: the specimen's page 3 showed 92 of its 113 words above its clip, and the flow fixture differed from page 1. `break-spaces` preserves the newlines of the source's text, which the generic schema keeps (`preserveWhitespace: 'full'`).
- **The margin after a forced break.** With `adjoin` left on after a forced break, the specimen agreed (its chapter openers' margins did not reach a cut) and the flow fixture's page 8, the first after the forced `verso` opener, ended later than the CLI's, as did page 20, the first after the switch back from the `wide` pages.

### What surprised

- **The specimen never reaches the Stonehand.** Nine pages, every one ending at a forced break, a named switch or the end. A measurement on it alone would have said that `fill` agrees with the driver without one adjudicated cut; the flow fixture was written to ask.
- **A slice cannot be its own source in the measure context.** The plan's sentence that the slice's elements carry the author's CSS is true of the document and false of the measure context, which neutralizes the break properties on purpose so the browser's own fragmentation cannot move a line; the engine reads its law from the sources, outside it. The law copy is the ProseMirror way of having a source: the same render, twice.
- **The editing host's text mechanics reach the page.** The fragmented view's root is the editing host for every container, and what it sets for editing is inherited by the page's slotted content. A page that lays out as the engine measured has to take them back, which leaves an open question for editing (below).
- **The renderer cannot know a cut was forced.** It writes `adjoin` on the chain that opens at every `from`, which is right after an unforced break and wrong after a forced one; only the fragmentainer knows, from its hint.
- **The same page shares more than the conditions.** The CLI's delivered reads are adopted on the document and keyed by attribute, so they reach the view's content too; in a page of its own the view would show `target-counter()` at its reservation.
- **Nothing else was needed.** One door of the three the record opened was used (`setContent`), and it behaved as its header says: the content lands where the root's would, the clips and the grid untouched, the author's sheets reaching it. The two instances of the engine never met: `customElements.define` is guarded on both sides and nothing here asks `instanceof`.

### Doors missing, and what the smallest opening would be

None blocked the phase. Each is a place where this package wrote a few lines the engine or the view already has, or could not reach something:

- **`placeAt`** (`driver.js`, a closure inside `paginateOnce`): two lines, written again in `turn.js`. Opening: export it from `positions.js`, beside the address it reads into. (Closed 2026-10-29, "The driver's doors" below.)
- **`nameAt`** (the same closure): the descent from a box down its first in-flow child chain while no word stands before the child, written again in `CiceroPage.nameAt` over `blockChildrenOf` and `effectivePageName`. Opening: a `nameAt(el, styleOf)` exported from `capture.js` beside `effectivePageName`.
- **The `fits` test** (the same closure): the in-flow procession's bottom against the content height, six lines written again. Opening: a `fitsPage({ report, sourceOf, pageStart, contentHeight })` in `stonehand.js` beside `reachesBelowTheEdge`, its one reader of the same predicates.
- **The repeated header** (`fragments.js`' `liftRepeatedHeader` and `repeatedGroup`, internal; `decideRepeats`, a closure in `paginateOnce`): no counterpart. Opening: an exported function that, given a table element whose body a fragment resumes and the page's content height, decides whether its header repeats and returns the copy to seat, marked `artifact`; the renderer's shallow `thead` is where it would go.
- **In the view**: the slice renderer's `adjoin` could take a flag for a forced start (the fill strips it today), and the editing host's text mechanics could stand on a class a container may opt out of, or be documented as the container's to reset.

### Not done

- Reads, all of phase 2: the folio (`setCounters` with `page N`), `counter(pages)`, `target-counter()` from the view's own chain, strings, running elements, the author's counters at a page's start, `settleReads` around the view.
- The shells (an end-gap Class C, an edge cut, a cut through a row; built since, below), the carried parallel flows, the spent lead of a resumed grid, the repeated header and the footer's reservation, the root's parity demand, the composed mode.
- **The trial in the page itself**, the plan's second option, was not measured: `takeReport` reads its container's children in the container's own coordinates, while the page's content stands in its light DOM under a shadow grid whose flow is offset by the margins, and the page neutralizes neither the break properties nor the transforms. The measure context is the engine's conditions exactly, which is what the cuts agreeing shows.
- `moved` is built and not measured: neither document has a late image or a late face.
- Editing on the pages was not tried. The page's content is editable through the view's root, but the page resets `white-space` for layout, so a typed double space collapses on the page, where `prosemirror-view` would show it; the resolution (a typed space as a non-breaking one, or the mechanics in the measure context too) is a decision for the phase that edits.
- The window policy `near` with pages, an invalidation after a `@page` edit, and a document longer than 26 pages.

## The page always advances, and the shells

Written 2026-10-24, on the branch `round/the-page-always-advances`, for the first two entries of docs/found.md ("The chain stops at a page whose cut does not advance", "A block the engine divides, held as an atom, moves whole and overflows clipped"). Run it again with `npm test` (12 tests, in node), `npm run specimen`, and `node scripts/specimen.mjs <absolute path>` on each fixture under `fixtures/` and on the studio's showcase (`beltype-studio-experiment/demos/showcase/index.html`). The script now reads a chain that stops as it stands and says which page stopped it, so a measurement before a fix still has both sides.

### What was built

| Module | Lines | What it is |
| :--- | ---: | :--- |
| `src/cicero-page.js` | 664 | `fill` never throws; `cutOf` turns a verdict into the page's end (`to`, the slice's own end, the box it ends with, the row's pieces, and what the page after begins with); `rowCut`; `page` builds the page's slice; the trial is bounded at a block boundary and never inside a box the driver's bound never cuts inside (`boundAt`, `sealedEnd`); `spentLead`. |
| `src/shells.js` | 265 | New. A composite position map (`Positions`), an element's node position and a node's element in a rendered slice (`nodeStart`, `nodeDom`), the shells made by the engine's own `mutateToContinuation` and `mutateToFirstFragment` (`continueAsShell`, `endAsShell`), a row's pieces seated (`seatPieces`), and the trial's tracks pinned on the page (`pinTracks`). |
| `src/turn.js` | 180 | `wholeAfter` (where a page that cannot cut ends) and `advances` (whether a cut moves the chain on), both pinned in node. |
| `fixtures/tall/` | 1 129 words | A code block taller than the page (BelType's addendum gives `pre` `overflow-x: auto`, `core/assets/beltype-ua.css`, so the engine holds it as a scroll container, a monolith, and slices it) and a plate, an SVG image 1 408 px tall, on the flow fixture's 110 × 150 mm page. |
| `fixtures/end-gap/` | 317 words | A box whose 70 mm bottom padding crosses the edge, and a box of declared height 190 mm holding one paragraph. |
| `fixtures/row/` | 1 358 words | A table whose second row is taller than the room left, a flex row of two columns, and the same two again with the first column and the first cell the long ones. No `thead`: with one, the CLI round refuses the document (below). |
| `fixtures/multicol/` | 632 words | The studio showcase's glossary, a `dl` of 26 terms set in two columns (`.two`), which the engine holds as a monolith (`notYetDivided`). |

### What `fill` does at an uncuttable run

A verdict that maps to no position (a cut inside a leaf, which a schema's atom has none of), or to the page's own start with no shell entered or shrunk and no row piece moved (`advances`, the driver's `cutAfter` read on positions), is an uncuttable run at the page's start. The page takes the node there whole (`wholeAfter`: the atom at `from`, else the textblock `from` stands in to its end, else the block that begins at `from`, unshown whitespace leaves passed over first), renders it as it is, sets the flow to the node's measured height (at least the content height) so the overflow is clipped by the page box as the engine's own page clips an overflowing box, answers `to` after the node (past every parent that closes there, entered), and says it once on the console: `prosemirror-beltype: page N cannot be cut after F (a K verdict mapped to T); the <type> there is taken whole and overflows the page, clipped`. Nothing in `fill` throws. With the shells built, none of the fixtures nor the showcase under the generic schema reaches this branch; under step 1 alone the showcase settled at 92 pages, the glossary a page per term, where it had stopped at page 58.

### The shells, each side, and where `to` lands

| The verdict | The page before shows | `to` | The page after shows | `next` carries |
| :--- | :--- | :--- | :--- | :--- |
| The page edge's cut through a box (`E`, painted) | its slice to the end of the box, so the box is whole and the rest of its parents is left out, the box cut at its end (`mutateToFirstFragment`, `split start`), its flow clipped at the cut | the box's own position, entered: the engine's reading of a painted cut (`posOfCut`, the box's start) | its slice from `to`, where the box opens whole; the renderer's `adjoin` is taken off the box and its chain, and `mutateToContinuation` wraps it in the engine's slice wrapper as tall as it has left, the part already shown pulled above the clip; the wrapper is given the box's span, marked as standing for no node, so `pointAt` reaches inside | `at` (the position it was left for) and `shell: { pos, remaining, paint }` |
| An end-gap Class C (blank) | as above: the box whole, cut at its end | the position after the box, entered: the engine's reading of a blank cut (`posOfCut`, the box's end), so the box's positions stay with the page that shows its content | its slice from `to`, in which the renderer wrote the box as a shallow sibling (`away`); the word is taken off and `mutateToContinuation` makes it the blank shell, no children and the height it has left | `at` and `shell: { pos, remaining, paint: null }` |
| A cut through a row (`R`) | each item from where it began on this page to its own place, the last through the page's own slice and every other rendered on its own and swapped in for the item's element; an item with nothing left is shown whole, one the cut left whole is emptied and keeps its column (`mutateToFirstFragment`'s rule for an item with no place), one with only its stretch left is cut at its end | the last item's place, as the driver makes the last item's place the main path: a position inside it, or after it (entered) where it has nothing left, or before it where it resumes whole | the row resumed in its slice, every earlier item a shallow sibling there; each is replaced by its own piece, rendered from its place to its end, or made a blank shell (of no height where it had nothing left: it keeps its column), and the slice is rendered at least to the row's end when its own flow shows nothing more | `at` and `row.items: [{ pos, from?, shell? }]`, one per item but the last, and `shell` where the last item continues as one |

A row item's own verdict is read as the page's is (`cutOf` on the item's verdict), so a shell inside an item is a piece whose render carries the shell. A row inside a row item is not built: the page takes the node at its start whole (not met by any document measured). A painted shell a page both resumes and ends with is left to its slice, as the engine leaves a painted start (`fragmentOf`). A blank shell whose box ends the document is not continued: the view drops an entry whose `from` is the document's end (not met).

The hint reaches a page once, when the view builds it (`build`), and a container refilled from another `from` keeps the hint it was built with; so a page reads `shell` and `row` only when `at` is its own `from`, and a stale one is ignored rather than applied to the wrong slice. A door owed in the view (below).

### Closures of the driver's, written again

Closed 2026-10-29 but for the third, "The driver's doors" below.

Besides `placeAt`, `nameAt` and `fits` (phase 1), the shells needed three more, each the smallest copy that answers and each named as a door:

- **The bound never cuts inside a box the driver's bound never cuts inside** (`driver.js`' `boundAt` rule over `stonehand.js`' `neverCutInside`, which is exported): the trial's end is moved past the textblock it falls in, then past the outermost box the law copy says it cuts off and `neverCutInside` names. Without it a monolith's or a table's trial is the box truncated, and a shell's remainder is measured on a box that is not the box. Opening: export the rule as a function of a box chain, beside `neverCutInside`.
- **The spent lead** (`spentLeadOf`, a closure in `paginateOnce`): the gap above the boxes a page resumes at that is not their containers' own border and padding. Measured on the row fixture: without it the page that opens on the table's second row starts its flow at 0 where the CLI's starts at 0.5 px (the collapsed border above the row), the Stonehand ranks a start-edge Class C at 0.5 px first, and 2 pages of 8 agree; with it, 7. The driver's branch for a repeated table header is not written. Opening: export `gapAbove(box, report, styleOf)`.
- **The pinned tracks** (`fragments.js`' `pinTracks` and `pinTable`, internal): a divided table on the page holds fewer rows than the trial that decided it, and its automatic layout widens or narrows its columns. Measured on the row fixture: without it page 3 agrees on its cut and shows 155 words where the CLI shows 158 (its last visible word `or` for `cut`). Written by tag, since the page's slice is not in the document when it is pinned. Opening: export `pinTracks(root, tracks, { tracksAt })` taking a lookup in place of the source map.

### The measurement

Every document agrees with the CLI round on its page count and on the first and last word of every page, and every page's word count is the same on both sides but one (below). No warning from the view on any of them.

| Document | CLI | View | Same | First difference | What the view's fills were |
| :--- | ---: | ---: | ---: | :--- | :--- |
| `test/specimen.md` (`npm run specimen`) | 9 | 9 | 9 | none | as phase 1 |
| `fixtures/flow` | 26 | 26 | 26 | none | as phase 1 |
| `fixtures/tall` | 10 | 10 | 10 | none | the code block sliced twice (E, E) then cut between its lines (B); the plate sliced three times (E, E, E), three pages of no words on both sides |
| `fixtures/end-gap` | 6 | 6 | 6 | none | C (the padded box), A, C (the tall box), a page that holds the 441 px blank shell and nothing else on both sides |
| `fixtures/row` | 13 | 13 | 13 | none | seven R cuts: three where every earlier item ends as a blank shell, four where the first item resumes at a position inside it (`row.items: [{ pos: 5311, from: 5830 }]` and on, in the flex row and in the table), one of them a page whose own flow shows nothing new (page 10, 77 words, all of the first column) |
| `fixtures/multicol` | 6 | 6 | 6 | none | the glossary sliced twice (E, E), each shell's remainder within 0.01 px of the CLI's on the second |
| the studio showcase, generic schema | 76 | 74 | 51 | page 25 | it settles; phase 1 stopped at page 58 |

**Before the round**, the same script: the tall fixture stopped at page 3 (`did not advance from 565`), the multicol at page 3, the row fixture at page 3; the end-gap fixture ran on and differed from page 3 (5 pages against 6), its two shells answered with the boundary after the box.

**The one word count that differs**, the multicol fixture's page 3 (the glossary's first slice): 174 words under the CLI, 170 under the view, the first and last the same. The CLI's own first slice measures the `dl` 9.59 px shorter than its second slice does (remaining 802.09 after 461.10, then 350.59 after 922.20, so 1 263 px and then 1 273), and the view's measures it 1 273 px both times; the balance of its two columns moves, and two words of a line at the clip (`read`, `generated`) are inked above it on the CLI's page and below it on the view's. A difference in the CLI round between two feeds of one box, recorded and not chased.

**The showcase** under the generic schema (the studio's own `demos/showcase/index.html`, served by the CLI, parsed with `schema-generic.js`): 74 pages against 76, 51 the same. The differences are three clusters, none a shell:

- Pages 25 and 26: `string(family)` in the flow is empty under the view (reads are phase 2's), as found.md's entry says.
- Pages 50 to 58, the flows family: the CLI's page 49 carries a float across its cut (`carried: [[8, 3]]`) and the view has no place for a carried parallel flow (phase 1's "not done"). Inside the cluster the glossary is sliced once by both, the view's shell `{ remaining: 346.996, paint: 642.520 }` and the CLI's `{ remaining: 346.996, paint: 642.520 }`, and the two pages after it begin on the same word.
- Page 63 on: the CLI's continuation of the divided `pre.code` opens with blank lines as tall as the piece before it (a fault the studio's showcase already records in its own text: "the second piece opens with an empty tinted band about as tall as the first piece before the code resumes"), and the view's slice of the same block begins at its next line; the CLI's page 63 holds 114 words, the view's 207, and every page after is one or two pages early. A case for BelType's battery, filed there; the view is not bent to it.

**Time**, for scale: the view's chains filled the specimen in 15 ms, the flow fixture in 30 ms, the row fixture in 18 ms and the showcase in 394 ms over 74 fills; the CLI's last `run()` calls took 16, 34, 28 and 345 ms.

### What each fix was worth

Each was found by a measurement that failed and was taken out of it by the fix; the counts are the measurement before and after.

- **`adjoin` off a painted box.** The renderer writes `adjoin` on the chain that opens at a slice's start, and the words sheet's `margin-top: 0 !important` beat the shell's inline negative margin: the code block's second slice was drawn from its top again, its remainder never shrank, and the page fell back to taking it whole. Tall fixture 6 pages of 10 the same (9 under the view), multicol 3 of 6 (36 under the view, the glossary a page per term); after, 10 and 6.
- **A shell counted among a holder's node elements.** A blank shell is a shallow sibling with its `away` taken off, and a painted one's box stands inside a wrapper; the descent that finds a node's element (`nodeDom`) skipped both, so it named the next sibling: the end-gap fixture's page after the padded box took the shell's 266 px as a spent lead. End-gap 2 of 5; after, 6 of 6.
- **The box a place names, as the driver's address names it.** The spent lead read from the line stack a position stands in found a gap inside a multicol's first column (9.59 px); the driver's bare path names the outermost box that opens there. Multicol page 3's lead 9.59 px; after, 0.
- **The spent lead and the pinned tracks**, above: row fixture 2 of 8, then 7 of 8, then 8 of 8.
- **A page whose own flow shows nothing past its start is rendered to the row's end.** The row fixture's page 10 resumes only its first column: its own slice from `to` to `to` was empty, so the row was not in it and the piece had nowhere to go. 0 words against 77; after, 77.

### Found, and where each is filed

- **The CLI round refuses a table with a `thead` whose row is cut** (BelType, the engine): the row fixture with a header row added, `BelType/Cicero refused to paginate this document — showing it unpaginated instead. entry position runs backward (I1: flow is forward)`, two pages cut. A case for the battery; the case document is the row fixture with `<thead><tr><th>Term</th><th>Gloss</th></tr></thead>` before its `tbody`.
- **The continuation of a divided `pre` opens with blank lines** (BelType, the engine): the showcase's page 63, above.
- **The hint reaches a page once** (the view, `fragmented-view.js`' `build`): a container refilled from a new `from` keeps the hint it was built with. A forced break's `forced`, a blank page and now a shell and a row's pieces all ride it. Opening: hand `fill` the hint of the entry before, or build a new container when the hint changed.
- **A position names one page, and a row cut draws an earlier item's remainder on the page after the one that owns its positions** (this package and the view): the chain gives `[from, to)` to a page, and an earlier item's remainder is below the last item's place in the document and above it on the page. A caret placed there is drawn where the item was cut, on the page before. Not met by editing yet.
- **A node's position is inferred from the renderer's spans** (the view, `slice-renderer.js`): the spans are clamped to the slice, so `nodeStart` reads a resumed node's position off its end, or, for a node divided at both ends, off the depth of the slice's first position. Opening: the renderer could record each element's unclamped node position beside its span.

### Not done

- Reads, all of phase 2, as before; the showcase's first difference is still page 25.
- The carried parallel flows (a float, an absolutely positioned box crossing a cut): the showcase's flows family.
- A row inside a row item, a blank shell at the document's end, the repeated table header and the footer's reservation, the root's parity demand, the composed mode.
- `pinExtents` (§5.3's extension for a divided row item, a `min-height` or a cell's `height` to the foot): visual only, no word moves; not written.
- Editing over a shell or a row cut was not tried.

## The page starts at its first in-flow box

Written 2026-10-24, on the branch `round/the-page-starts-at-its-first-box`, for docs/found.md's "A running element at the document's start makes a page of its own". Run it again with `npm test` (13 tests, in node), `npm run specimen`, `node scripts/specimen.mjs <absolute path>` on each fixture under `fixtures/`, and, with the studio's dev server started on a free port, the studio's `node scripts/fragview-pages.mjs --demo <demo> --url <its url> --out <a file outside the studio>` on `report`, `manuale` and `showcase`.

### What was built

| Module | Lines | What it is |
| :--- | ---: | :--- |
| `src/turn.js` | 196 | `inFlowStart(doc, from, away)`: the page's start as the driver's cursor stands, the first in-flow box at or after `from`, past the unshown whitespace leaves and the boxes `away` names among `from`'s siblings. Pinned in node. |
| `src/cicero-page.js` | 667 | `fill` reads the page's name (`nameAt`), the grab's cursor (`grab`) and the start address `extensionPx` is given (`addressAt`) at that box, asking `isFixedBox` of the law copy's element for each node passed; `textBefore`, which the name's descent asks, leaves out the text a running element or a fixed box holds, as the driver's word count does. The header says the placement in the margin box is phase 2's. |
| `fixtures/running/` | 812 words | A press mark (`position: running(press)`) at the top level and a mark nested in the cover's header (`position: running(logo)`), before a cover on a named page with `break-before: right`, then a front matter on a named page that owes a right page, and three families that each open a page. |

### The two causes, as measured

**The put-away does not miss the element.** Measured in the studio on 2026-10-24 under the generic schema and under the studio's own (`schema=studio`), on the report, the manual and the showcase, by a probe in `trial` on the first page's law copy and by reading the page's content after the fill: the law copy is connected when asked, the sheets the studio rewrote into its layer reach it (`--beltype-running` computes `mark`, `logo`, `press` in the hidden holder), `isFixedBox` names the element (the report's `svg.mark`, the manual's `svg.logo.running`, the showcase's `div.press-mark`), the trial copy carries `away`, and on the page the element computes `display: none` with no height. The walk reaches every depth (the pairing walks every element of both copies, and `show` every element of the page), and the predicate's cache is keyed by the element asked, which is a fresh one on every trial and every page. The fixture's nested mark is put away too: its two words are on no page. What looked like a drawn mark was the second cause: a page named `''` whose first line is the cover's kicker.

**The page was named, and its grab's cursor read, at the running element or at a whitespace leaf.** The generic schema begins a document with a `ws` leaf, which the page does not draw, so `nameAt(t, 0)` found a text node in the law holder and answered the holder's name, `''`; under the studio's schema the first node is the running element itself, whose effective name is its own (`''` for the report's and the manual's, `cover` for the showcase's, which declares `page: cover`). The grab's cursor stood at the cover, since the law copy's blocks leave the running element out, and the first event strictly after it was the cover's first child of another name than the page's: `cover` against `''`. So the report's page 1 ended after the kicker (0 to 28, 4 words), the showcase's after its kicker (0 to 68, 5 words) with the cover's rest on a left page and no blank, and the manual's cover, `display: flex` and 1 123 px on a page that has no margins, was measured on a page named `''` with margins and cut by an end-gap Class C at 899.9 px, its 222.6 px blank shell a page of its own. With the page's name and cursor read at its first in-flow box, the cover names page 1, an event at that box names the page or sets its side and does not end it, and the front matter's `break-before: right` owes the blank on page 2, as the CLI puts it. The running element's positions stay with page 1, invisible.

### The measurement

| Document | CLI | View | Same | First difference | Before the round |
| :--- | ---: | ---: | ---: | :--- | :--- |
| `test/specimen.md` | 9 | 9 | 9 | none | the same |
| `fixtures/flow` | 26 | 26 | 26 | none | the same |
| `fixtures/tall` | 10 | 10 | 10 | none | the same |
| `fixtures/end-gap` | 6 | 6 | 6 | none | the same |
| `fixtures/row` | 13 | 13 | 13 | none | the same |
| `fixtures/multicol` | 6 | 6 | 6 | none | the same |
| `fixtures/running` | 13 | 13 | 13 | none | 13 against 13, first difference page 1: page 1 the press mark and the cover's header alone (0 to 48, no word), the cover on page 2, no blank |

The running fixture page by page beside the CLI: page 1 the cover, `A` to `platen.`, 21 words (0 to 210, named `cover`, its hint `blank`); page 2 the blank verso, named `front`; page 3 `Front` to `quire.`, 85 words; pages 4 to 13 the same on both sides, the last `Frontispiece` to `stonehand.`, 9 words. No warning from the view on any fixture.

The studio's demos through its regression witness, the old path against the view, served by a dev server of the studio's own on a free port:

| Demo | Old path | View before | View after | Same after | First difference after |
| :--- | ---: | ---: | ---: | ---: | :--- |
| report | 11 | 12 | 11 | 11 | none |
| manuale | 7 | 8 | 7 | 6 | page 5: the repeated table header (`Operazione` and its four roles, 5 words), phase 1's "not done" |
| showcase | 76 | 74 | 74 | 45 | page 13, the clusters the last round recorded; pages 1 and 2 are the cover and the blank verso on both paths |

The showcase's count did not move: before the round its cover took two pages and its blank verso none, so the fix moved a page from the cover to the blank. Under the studio's own schema (`--query schema=studio`) the report is 11 and 11 the same, the manual 7 and 7 with its first difference page 4 (the table held as an atom, found.md's atom entry, the studio's), and the showcase 76 and 76 with its first difference page 25 (`string(family)`, the reads).

### Doors

None filed: neither cause is in the engine, and the predicate answers the view's copies as it answers the root's.

### Not done

- Placing a running element in its margin box (`setMarginBox`, the running assignments): the reads' work, phase 2.
- A running element before a forced break in mid-document stays with the page before the break, since the grab's event names the in-flow block after it; the driver logs its assignment at that block. It decides nothing about a cut and matters only to the reads.
- The root's parity demand (a `break-before: left` on the first in-flow box shifting every side) is still not read; the fixture's `break-before: right` on page 1 demands what page 1 already is.

## The page presents what it renders

Written 2026-10-25, on the branch `round/the-page-presents-what-it-renders`, for docs/found.md's "A facsimile is drawn at the browser's 150 px object height". Run it again with `npm test` (13 tests, in node), `node scripts/specimen.mjs <absolute path>` on each fixture under `fixtures/`, and, with the studio's dev server started on a free port, the studio's `node scripts/fragview-pages.mjs --demo facsimile --url <server> --out <file>`.

### What was built

| Module | Lines | What it is |
| :--- | ---: | :--- |
| `src/containers.js` | 62 | `takeFacsimile(doc)`: when the document holds a PDF `<object>`, the engine's `seam/facsimile.js` is imported and `install(doc, present)` awaited once, with this package's `present`; every later call runs `install` with no presenter, which reads the sizes of the pages the document then embeds. The factory hands every page `intake`, which calls it. |
| `src/cicero-page.js` | 716 | `present(t)`, at the start of `measure`: the intake awaited, then every element of the trial a presenter matches replaced by what it makes from the paired law element, the law copy's by what it makes from itself, the two paired in `lawOf` and the trial's registered against the law's (`noteSource`), and the law's top-level blocks read again. `show` presents the slice in a hidden holder of its own (`__prosemirror-beltype-staging`) before it is given. `presentTree` is the walk. |
| `vite.config.js` | 39 | pdf.js answered beside the facsimile module from the engine's asset table (`vendorAssets()`), as the studio's configuration answers it, so the harness's copy of the module can read a size. |
| `harness/specimen.js`, `scripts/specimen.mjs` | 153, 101 | Each page's `<object>` boxes, read through the content slot on both sides, printed under the page sizes. |
| `fixtures/facsimile/` | 161 words | The flow fixture's small page with a portrait PDF page in the flow (`portrait.pdf`, page 1 of 2, 300 × 400 pt, at 50 mm wide) and a landscape page of its own (`landscape.pdf`, 400 × 300 pt, on a named page of that size with no margin, `width: 100%; height: 100%`), each with a fallback `<img alt>`. The two files are the studio's demo attachments, copied. |

### The readiness, and why per slice

The brief offered two shapes: the factory awaits the intake before it returns, or the first fill awaits a readiness promise the factory holds. Neither holds as stated, because the factory cannot know when it is made whether the document holds a PDF: the studio's `prepare` takes the provider's drawing out of the body before `mount` makes the factory, so `document.querySelector('object[type="application/pdf"]')` finds nothing then, and the first PDF `<object>` the document holds again is a page's own law copy. So the intake is asked per slice, in the second shape: the factory hands each page an `intake` function and the page awaits it before it presents a trial, when its law copy is connected and in the document. A document without a PDF pays one `querySelector` per trial and never loads the module. Every caller is unchanged: the harness and the studio call `ciceroContainers(document)` as before, synchronously, and the studio needs no change.

### How the presenting runs, and where the pairing needed care

The engine presents a copy as it makes it (`copyOf`, `shellOf`, `mapCloneToSource`, each pairing a `cloneNode` copy with its source index by index); here the renderer makes the tree, so the walk runs over a tree already made (`presentTree`): every element whose source a presenter matches is replaced, the presented element takes the replaced element's span in the slice's positions (so `nodeStart`, `nodeDom`, `pointAt` and `posAt` find the node there), and the walk does not descend into it. It carries the words the element earned because the presenter copies its attributes, `data-beltype` among them.

- **The source a presenter reads must be connected.** `make` gives the element the page's `aspect-ratio` only where the source's computed `aspect-ratio` is `auto`, and a detached element computes none. The trial is detached when it is presented, so its elements are made from their law elements, which stand in the hidden law holder; the law's are made from themselves, after the trial's.
- **The pairing is kept by the swap, not by a second walk.** `lawOf` is built element by element before the presenting; a trial element and its law element are each replaced by a presented element with the same shape, and the trial's replaced entry is moved to the pair of presented elements. The trial's presented element is registered against the law's (`noteSource`), since the law copy is the trial's source; the law's and the shown page's are registered against nothing, because the element each replaces is detached and a detached source answers no computed style (`isFixedBox` would read every position as static).
- **The law copy is presented too.** In BelType's page the head's rule hides an unpresented PDF `<object>` outside a root, which the law holder is, so an unpresented law answered `display: none` to the name, the grab and the Stonehand, and the named page its `page: insert` asked for was lost. Presented, it answers the box the trial lays out. The cost is the engine's own: an author rule keyed on `type` or `data` reaches neither the presented trial nor the law, where the engine's law reads such a rule off the original. No fixture has one.
- **The shown slice is presented before it is given, in a hidden holder.** Presented in the page after `setContent`, the fixture's landscape page kept no box at all, 0 × 0 with `checkVisibility()` false, on screen and off: the page was filled while its `content-visibility: auto` skipped its contents, and a copy of the same element put in its place had its 533 × 400 at once. Presented in a hidden holder of its own and then given, it is 533 × 400 like the CLI's. The holder is written and emptied in one synchronous stretch, so two fills in flight cannot meet in it.

### Two instances of the engine

In the harness the page's copy of the engine (served by BelType's dev server) has loaded `seam/facsimile.js`, defined `beltype-facsimile` and registered its presenter in its own registry before the view is mounted, and this package's copy (served by Vite) has a registry, a size cache and a module of its own. `install` guards `customElements.define`, so the second call does not throw and the class that draws is the page's, its own pdf.js and drawing cache; the registry `presentation` reads and the size cache `make` reads are this package's, filled by `takeFacsimile`. pdf.js had to be answered beside the module on Vite's side too, or the size read 404s and `make` gives no ratio. In the studio there is one instance (both resolve the engine to the same `/@fs/` path), and the studio's own intake never runs under the switch (`prepare` replaces the run), so the factory's is the only one.

### The hidden rule

The engine's head (`seam/index.js`, `PDF_OBJECT_RULES`) holds `object[type="application/pdf"]:not(beltype-root *) { display: none; }` and a zero-specificity `display: inline-block` for both the source and `object[is="beltype-facsimile"]`. Under the view there is no root, so the first rule matches every unpresented `<object>` the view renders. Before the round, in BelType's page, the view's objects were 0 × 0 and the fixture was 2 pages against the CLI's 5, the named landscape page gone; in the studio the rule is in the head but the author's `object.flow { display: block }` and `object.insert { display: block }` prevail (computed `display: block`), and the objects stood at their fallback's height, 229 × 39 and 533 × 19 in this run (found.md recorded 150 to 152 px). A presented element carries no `type`, so the first rule never reaches it and the second is a default the author's rule overrides: after the round every presented element is `display: block` at the author's width and the page's ratio, in both hosts.

### The measurement

| Document | CLI | View | Same | First difference | Objects, CLI and view |
| :--- | ---: | ---: | ---: | :--- | :--- |
| `test/specimen.md` | 9 | 9 | 9 | none | none |
| `fixtures/flow` | 26 | 26 | 26 | none | none |
| `fixtures/tall` | 10 | 10 | 10 | none | none |
| `fixtures/end-gap` | 6 | 6 | 6 | none | none |
| `fixtures/row` | 13 | 13 | 13 | none | none |
| `fixtures/multicol` | 6 | 6 | 6 | none | none |
| `fixtures/running` | 13 | 13 | 13 | none | none |
| `fixtures/facsimile` | 5 | 5 | 5 | none | page 2 189 × 252, page 4 533 × 400, on both sides |

The facsimile fixture page by page: page 1 `The` to `leading`, 72 words; page 2 `stonehand` to `flow`, 33 words, the portrait page in its figure; page 3 `typeface` to `versal.`, 11 words, ended by the named switch; page 4 the landscape page alone, 533 × 399, named `insert`; page 5 `Impression` to `ink.`, 45 words. Before the round the same fixture was 2 pages against 5, first difference page 2, the objects 0 × 0. No warning from the view on any fixture; the multicol fixture's `info` that a multicol is not divided yet is the engine's, as before.

The studio's facsimile demo through its witness, a dev server of the studio's own on a free port: 6 pages on the old path and 6 under the view, 6 the same (first and last word, count, size), first difference none, against 5 and 6 with the first difference on page 2 before the round (found.md). The objects, read by hand on both paths: 229 × 304, 533 × 400 and 229 × 304, the same.

### Doors

- **A tree already made, presented.** `word-space.js` presents only as it copies: `copyOf`, `shellOf`, `dressWords` and `mapCloneToSource` walk a `cloneNode` copy beside its source, index by index. A host whose renderer makes the tree has no export to call, so `presentTree` is written here. The smallest opening: `presentTree(root, sourceFor)` beside `copyOf`, replacing every element of a made tree whose source a presenter matches and registering it, with the caller's position bookkeeping left to the caller (it would return the swaps).
- **The sizes without the registration.** `facsimile.js` reads sizes only inside `install`, which registers a presenter each time it is called, so this package calls it once with `present` and after that with a presenter that does nothing. The smallest opening: export the read (`readSizes(doc)`, the loop `install` runs), and let `install` call it.

### Not done

- **Late truth.** A size learned after a measure (a file that was not there at intake) is announced by `facsimile.js` as a `beltype:change` for the box, found through `window.__beltypeCicero.sourceOf`, which the view does not answer for its pages; here such a box has no ratio until a later fill, and the page's `moved` fires only if its height changes when the canvas is drawn. Not reached by the fixture or the demo.
- **A PDF `<object>` with no fallback `alt`.** `install` refuses it by name, as the one-round host refuses the run, and the refusal is thrown from `fill`, the one thing the page throws (*the build cannot fail* says otherwise of the cut); the view leaves the entry dirty.
- **The shared holders.** The law holder is one per document and a fill awaits between rendering its law copy and reading it, so two fills in flight can evict each other's law; that was so before the round, and the presenting adds one await (the intake) only where the document holds a PDF.

## The host wears the dressing

Written 2026-10-25, on the branch `round/the-host-wears-the-dressing`, for docs/found.md's "Resumed pieces wear no dressing sheet", after BelType opened the door the same day (`ensureContinuationDressing` in `engine-cicero/src/dressing.js`, its CHANGELOG's *The continuation dressing is a door*). Run it again with `npm test` (13 tests, in node), `node scripts/specimen.mjs <absolute path>` and `node scripts/specimen.mjs <absolute path> --bare` on each fixture under `fixtures/` and on `./test/specimen.md`, and, with the studio's dev server started on a free port, the studio's `node scripts/fragview-pages.mjs --demo <demo> --url <its url> --out <a file outside the studio>` on `report`, `quiet-press`, `showcase`, `manuale` and `facsimile`.

### What was built

| Module | Lines | What it is |
| :--- | ---: | :--- |
| `src/containers.js` | 67 | The factory calls `ensureDressing(document)` and `ensureContinuationDressing(document)` after `assertRenderConditions`. Its header says why the Cicero page's host wears the engine's dressing and not the view's `continuationSheet`: the engine's rules are keyed on the engine's words at every depth and `!important`, and what a divided box shows at its edges is the engine's to say. `ensureDressing` is also called by `createMeasureContext` on the same document before any slice is shown; the factory names it so the page's dressing is one place. |
| `harness/specimen.js`, `scripts/specimen.mjs` | 192, 108 | `--bare`: after the CLI's pages are read and before the view is mounted, every sheet the document has adopted is listed and taken off, so the view is measured in a document no root has dressed. Each side's divided pieces are read at their edges from the computed style of their pseudo-elements (`dressingOf`), and the adopted sheets are listed after the view settles. BelType's dev server is given 60 s to answer, since its cold start took 12.8 s in this round and the old 10 s wait failed twice. |
| `fixtures/dressing/` | 1 052 words | The flow fixture's 110 × 150 mm page with one divided box for each rule: a blockquote whose `::before` is a block label (`"Quoted"`), an ordered list with an author `::marker` (`"No. " counter(list-item)`) and items long enough to be cut through, a paragraph with a floated drop cap (`p.cap::first-letter`, 3.4em), a paragraph whose `::first-line` is small caps at 1.15em, and an aside whose `::after` is a block attribution. |

### What `--bare` takes off

In BelType's page the author's sheets are a `<link>` and `<style>`s in the head, and the words sheet's rules ride in the engine's provision `<style>` there too, so `ensureDressing` adopts nothing and clearing `adoptedStyleSheets` leaves the words, the margins and the indents in place. What the CLI's root had adopted, listed before the clearing, is three sheets on every fixture: the continuation dressing (5 rules), the root's fixed-box sheet (`[data-beltype~="fixed"] { position: absolute !important; }`) and its breaks sheet (`beltype-root, beltype-root * { break-before: auto !important; … }`); the specimen has a fourth, the reads' delivery sheet (9 rules, its `target-counter()` values), which the view does not deliver yet (phase 2). After the view settles, the document wears one adopted sheet, the continuation dressing the factory ensured. None of the three root sheets is the view's to need: fixed boxes are put away on the view's pages, and the breaks sheet is keyed on `beltype-root`.

### Measurement B, the defect, before and after

`node scripts/specimen.mjs <dressing.md> --bare`, each resumed piece's edges on the view's pages; on the CLI's pages every value is the "after" column, with or without `--bare`, since the CLI's are read before the clearing.

| Page | Piece | Read | Before (main, f805bc8) | After (1c26f19) |
| ---: | :--- | :--- | :--- | :--- |
| 3 | resumed `blockquote.open` | `::before` content | `"Quoted"` | `none` |
| 5 | resumed `li` | `::marker` content | `"No. " counter(list-item) "  "` | `none` |
| 6 | resumed `li` | `::marker` content | `"No. " counter(list-item) "  "` | `none` |
| 7 | resumed `p.cap` | `::first-letter` float, size | `left`, 49.8667px | `none`, 14.6667px (the paragraph's) |
| 9 | resumed `p.lead` | `::first-line` size, caps | 16.8667px, `small-caps` | 14.6667px, `normal` (the paragraph's) |
| 10 | cut-off `aside.close` | `::after` content | `"— the compositor"` | `none` |

Every construct is divided, read off the pieces' words in the measurement: the blockquote between pages 2 and 3, the list through an item between pages 4 and 5 and through the next between 5 and 6, the drop-cap paragraph between 6 and 7, the small-caps paragraph between 8 and 9, the aside between 10 and 11.

**No cut moved before the fix**, here: under `--bare` on main the view gave the CLI's 11 pages, every page the same, and only two fills measured differently from the run with the root's sheets worn. Page 3's label took 24.2 px at the top of the trial: the fill read the page's start at 24.20 px and its foot at 485.38 px against 461.18, the same cut, so the shown page ran the label's height past its flow. Page 9's small-caps first line measured the page at 405.52 px against 401.91, the same cut. After the fix every fill under `--bare` is the run with the root's sheets worn, position for position and pixel for pixel.

### Measurement A, parity

| Document | CLI | View | Same | First difference | Under `--bare` |
| :--- | ---: | ---: | ---: | :--- | :--- |
| `test/specimen.md` | 9 | 9 | 9 | none | 9, 9 the same, none |
| `fixtures/flow` | 26 | 26 | 26 | none | 26, 26 the same, none |
| `fixtures/tall` | 10 | 10 | 10 | none | 10, 10 the same, none |
| `fixtures/end-gap` | 6 | 6 | 6 | none | 6, 6 the same, none |
| `fixtures/row` | 13 | 13 | 13 | none | 13, 13 the same, none |
| `fixtures/multicol` | 6 | 6 | 6 | none | 6, 6 the same, none |
| `fixtures/running` | 13 | 13 | 13 | none | 13, 13 the same, none |
| `fixtures/facsimile` | 5 | 5 | 5 | none, objects page 2 189 × 252 and page 4 533 × 400 on both sides | 5, 5 the same, none, the same objects |
| `fixtures/dressing` | 11 | 11 | 11 | none | 11, 11 the same, none |

The dressing fixture page by page, the same on both sides and in both modes: page 1 `The` to `preface.`, 63 words; 2 `Appendix` to `small.`, 91; 3 `Superior` to `paragraph`, 86; 4 `spread` to `errata`, 95; 5 `preface` to `margin`, 108; 6 `numeral` to `on`, 96; 7 `capitals.` to `glossary`, 108; 8 `platen` to `the`, 121; 9 `errata.` to `imposition.`, 95; 10 `Of` to `ascender`, 117; 11 `proof` to `colophon.`, 72; every page 416 × 566. No warning from the view on any fixture; the multicol fixture's `info` that a multicol is not divided yet is the engine's, as before.

### The studio, through its witness

A dev server of the studio's own on a free port, the old path against the view, the studio unchanged:

| Demo | Old path | View | Same | First difference | As last recorded |
| :--- | ---: | ---: | ---: | :--- | :--- |
| report | 11 | 11 | 11 | none | yes |
| quiet-press | 30 | 30 | 30 | none | yes (the studio's `notes/fragview-results.md`) |
| showcase | 76 | 74 | 45 | page 13 | yes |
| manuale | 7 | 7 | 6 | page 5, the repeated table header | yes |
| facsimile | 6 | 6 | 6 | none | yes |

The view's document in the studio now wears the continuation dressing too, and none of these demos moved, as found.md predicted: none of their resumed pieces has generated content, an author marker or a first-letter or first-line rule.

### Doors

None filed: the engine's door was opened before the round, and the factory is its first caller outside the root.

### Not done

- **A host that empties the adopted sheets after the factory is made** (a `document.open()`, as BelType's kept print frame does) loses the continuation dressing until a new factory is made: the factory calls the door once. Neither the harness nor the studio does so; the studio's sheets are all appended. Calling the door per fill would cost a lookup and an `includes` per page.
- **`ensureDressing` answers its remembered record**, so a host without the provision whose adopted words sheet was taken off does not get it back (BelType's NEEDED-FIXES, *two of Cicero's sheets are remembered, not asked for*). Not met: BelType's page and the studio both carry the provision (the studio splices the engine's head fragment in its `vite.config.js`).
- **A node test of the factory**: it would need a stub document answering `assertRenderConditions`, `registerGcpmProperties` and `readGeometryTable` to prove two calls; `--bare` is the check.

## A space beside a space

Written 2026-10-25, on the branch `round/a-space-beside-a-space`, for docs/found.md's "A typed double space collapses on the page". Run it again with `npm test` (25 tests, in node, 12 of them the plugin's), and, with the studio's dev server started on a free port (`npx vite --port <port> --strictPort` in the studio), `node scripts/spaces.mjs --url <its url> --out <a file outside the studio>` for the typing, and the studio's `node scripts/fragview-pages.mjs --demo <demo> --url <its url> --out <a file outside the studio>` on `quiet-press` and `report` for the regression. The studio carries the plugin on its branch of the same name (da9c7e9).

### The decision

The document is HTML, and HTML collapses whitespace: a space beside a space, and a space at a line's start or end, draw nothing, on the Cicero page and in BelType's CLI round alike. The page is right to collapse them, under *one engine, two hosts, one answer*, since the trial it lays out as lays out under the body's `white-space`; the fault is the editor's, whose model held a character print never draws. So whitespace collapses in the editor as in print, and a space that would collapse is promoted to U+00A0, a non-breaking space, a glyph print draws: model, CLI round and page agree on a visible character. It is what CKEditor 5 and TinyMCE do where the host collapses whitespace, and what Chromium's contenteditable does on its own under `white-space: normal`; here it is deliberate and the same in every browser. Not chosen: refusing the second space, or giving the measure context the editing mechanics, which would make the view disagree with the CLI.

### Step 1, before

`scripts/spaces.mjs` in the studio on its default demo, the quiet press, on both paths (the old orchestrator, and `?view=fragmented` on the generic schema with structured marks), in the paragraph "Quis ut minim consequat…" on page 2: `A`, space, space, `B` typed with `page.keyboard.type` between the second and third letters of "sollicitudin", each key 600 ms after the last; a space typed at the paragraph's end, then `x`; a space typed at its start. Each place read as the model's code points (`studio.state.doc.textBetween`), the drawn text node's code points, and the width of a `Range` over the characters. Steps are the collab plugin's version before the act and after the authority confirmed it.

| Path | Place | Model | Drawn | Width | Steps |
| :--- | :--- | :--- | :--- | :--- | ---: |
| old | middle | U+0041 U+0020 U+0020 U+0042 | the same | 24.44 px: 9.58, 6.14, 0, 8.75 | 4 |
| old | end | U+002E U+0020 | the same | the space 0 px | 1 |
| old | start | U+0020 U+0051 | the same | the space 0 px | 1 |
| view | middle | U+0041 U+0020 U+0020 U+0042 | the same | 24.44 px: 9.58, 6.14, 0, 8.75 | 4 |
| view | end | U+002E U+0020 | the same | the space 0 px | 1 |
| view | start | U+0020 U+0051 | the same | the space 0 px | 1 |

**The browser promotes nothing, on either path**: a typed space is U+0020 in the model and in the DOM in all three places. Both paths cancel `beforeinput` and draw from the model (the old path's `input.js`, the view's `onBeforeInput`), so Chromium's own promotion under `white-space: normal` never runs. The model really holds two U+0020, and the page really draws one. Undo took one key per press on both paths (after two, `A`, U+0020, `c`).

Under the view the three clicks did not reach the model: the title page refills every frame and each refill redraws the model's selection over the browser's (docs/found.md, "The title page refills every frame" and the view's "A refill redraws the model's selection over a click not yet read"). The script puts the caret where the click's own `posAtCoords` says when the model's head did not move, and says how often it had to (3 of 3 under the view, 0 of 3 on the old path); the keys are real either way.

### The plugin

`collapsedSpaces()` in `src/spaces.js`, exported from `src/index.js`: a plain function returning a `Plugin`, named for what it looks for, a space the layout collapses. Its one hook is `appendTransaction`, so the studio's verbs are left alone: typed text still reaches `insert:text` through the studio's `handleTextInput`, and a paste `paste` through `handlePaste`, and the plugin reads the document those verbs made.

- **Where it looks**: the ranges every step of the transactions inserted, mapped to the new document (a deletion is an empty range), and the one character on each side of each, and at each only on the side the change touched: the character before is asked about its new next, the one after about its new previous, so a run of whitespace a provider wrote is never rewritten.
- **What it promotes**, left to right over a textblock's characters (an inline node with content is walked through, an inline leaf is ink, a `br` is a line's edge): a U+0020 whose previous character is a collapsible space (U+0020, a tab, a line feed) or a line's start; one whose next is a line's end; and an inserted one whose next is a collapsible space the transaction did not insert, so a space typed before a space promotes itself and not its neighbour. A run inserted at once alternates, space, U+00A0, space, U+00A0, so a line still breaks inside it, as CKEditor does with a paste.
- **What it gives back**: a U+00A0 becomes U+0020 again only when the change put ink on both its sides and, in the document before, it stood beside a space or at a line's edge, where it stood in for a collapsed space; a space typed at a paragraph's end and then a word is a plain space between two words, as Chromium leaves it. A U+00A0 an author or a provider wrote between words is never demoted, and one the transaction inserted is kept.
- **What it leaves alone**: a textblock whose spec says `code` (the generic schema's `pre`, `white-space: pre`), a transaction marked `addToHistory: false` (a collaborator's steps are that client's to promote, and a host's bookkeeping, the values' writes among them, is not an edit), and tabs and line feeds, which it never writes over.
- **How**: one appended transaction, each promotion a `replaceWith` of one character by one, with the character's own marks; positions do not move. `prosemirror-history` folds an appended transaction into its parent's event, so one undo takes a space and its promotion together (pinned in node).

**The authority counts the promotion.** The collab plugin's unconfirmed steps include the appended transaction's, so a promoted space reaches the authority as two steps in one submission, the insertion and the replacement. The studio's checks that compare steps are not reached: `authority-check` builds its own states with no plugin, `roundtrip` serializes without editing, and the values' writes the `binds` check counts are `addToHistory: false`, which the plugin skips.

### Step 3, the studio

One commit on the studio's branch, da9c7e9: `src/fragmented.js` imports `collapsedSpaces` beside `ciceroContainers` and appends it to the plugins `listen` reconfigures the state with, after the editing props. Nothing else changed. The old path would want it too, since its root collapses whitespace the same way (24.44 px above); it is not installed there, which would be the provider's `plugins`.

### Step 4, after

The same script, the plugin installed under the switch (at 596df51 and again at fceba92, the same numbers both times):

| Path | Place | Model | Drawn | Width | Steps |
| :--- | :--- | :--- | :--- | :--- | ---: |
| old | middle, end, start | as before | as before | as before | 4, 1, 1 |
| view | middle | U+0041 U+0020 U+00A0 U+0042 | the same | 29.2 px: 9.58, 5.47, 5.47, 8.73 | 5 |
| view | end | U+002E U+00A0 | the same | the space 3.17 px | 2 |
| view | start | U+00A0 U+0051 | the same | the space 8.42 px | 2 |

`A  B` now draws two spaces' worth (the paragraph is justified, so both spaces are stretched alike, 5.47 px, where the one drawn space was 6.14 before). After the space at the end, `x` gives `.`, U+0020, `x`: the promoted space was given back. Undo, one key a press: the first undo leaves `A`, U+0020, U+00A0, `c`; the second `A`, U+0020, `c`, the second space and its promotion taken together. The middle act's four keys reached the authority as five steps, the edges' one key each as two.

### The regression

The studio's witness on its own server, the old path against the view:

| Demo | Old path | View | Same | First difference | As last recorded |
| :--- | ---: | ---: | ---: | :--- | :--- |
| quiet-press | 30 | 30 | 30 | none | yes |
| report | 11 | 11 | 11 | none | yes |

No warning from the view; the old path's one 404 on load is as before.

### Not done

- **The old path** does not carry the plugin (above).
- **Enter beside a space**: the rule reads the document after the step, so a paragraph split before a space begins the new paragraph with a U+00A0, and one split after a space ends the old one with one; both are the truth of what print would hide, and a Backspace that joins them gives the space back. Measured in neither demo.
- **A run the provider wrote**: a source whose paragraphs hold runs of collapsible whitespace (line feeds and indentation) keeps them; the plugin looks only beside a change, and a space typed at the end of such a run is promoted alone, so the run still draws one space and the typed one a second, and a trailing space a provider wrote stays a space when a word is typed before it (pinned in node).
- **The title page's refill loop** is filed, not fixed: the round was not to touch `cicero-page.js`.

## Late truth, like with like

Written 2026-10-25, on the branch `round/late-truth-like-with-like`, for docs/found.md's "The title page refills every frame". Run it again with `npm test` (25 tests, in node), `node scripts/specimen.mjs <absolute path>` on each fixture under `fixtures/` and on `./test/specimen.md`, and, with the studio's dev server started on a free port (`npx vite --port <port> --strictPort` in the studio), `node scripts/idle.mjs --url <its url> --out <a file outside the studio>` for the pages left alone, `node scripts/spaces.mjs --url <its url> --out <a file outside the studio>` for the clicks, and the studio's `node scripts/fragview-pages.mjs --demo <demo> --url <its url> --out <a file outside the studio>` on `quiet-press` and `report`.

### The defect

After a fill the page recorded each given node's `getBoundingClientRect().height`, a border box, and observed the node; the observer compared the record with `contentRect.height`, a content box. A node with vertical padding or borders differed on every observation, so every fill ended in `moved`, the view marked the page dirty and refilled it, and the refill's fresh nodes were observed and differed again: once a frame, for as long as the page was rendered. `fill` disconnected the observer but never cleared `heights`, which kept one detached node per refill.

`scripts/idle.mjs` wraps the `ResizeObserver` class from the first script and sets every observation a page's own observer receives beside the height the page had recorded for its target at that moment. Before the fix, on every demo, every observation that differed from its record differed by the node's padding and borders, its border box equal to the record, and no node differed for any other reason:

| Demo | Page | Node | Recorded | Content box | Border box | When it loops |
| :--- | ---: | :--- | ---: | ---: | ---: | :--- |
| quiet-press | 1 | `section.titlepage` (151.18 px `padding-top`) | 522.81 | 371.64 | 522.81 | from load, for as long as it stands |
| bolletta | 3 | `section.info` | 197.17 | 185.52 | 197.17 | from load, for as long as it stands |
| report | 11 | `section.colophon` | 829.11 | 111 | 829.11 | while on screen |
| showcase | 74 | `section.colophon` | 536.25 | 271.69 | 536.25 | while on screen |

The last two refill only while shown: a page off screen is skipped (`content-visibility: auto`) and its observer hears nothing, so they loop while a reader scrolls past them and stop when the page leaves the screen. Probed 2026-10-25 on the quiet press 1.5 s after the chain settled: page 1's `heights` held 104 nodes, 103 of them detached; pages 2 and 3 held two and three, the nodes they show.

### What was built

`src/cicero-page.js`, three changes and nothing else:

- **Like with like**: the observer reads `borderBoxSize[0].blockSize`, or the target's `getBoundingClientRect().height` where `borderBoxSize` is absent, against the border box `fill` records. The border box is the measure, since padding and borders are what the cut was decided against. The field's comment says so, and names the ceiling: the two readings agree while no transform scales the page and the node's writing mode is horizontal (the studio scales nothing).
- **A fill starts clean**: `fill` disconnects the observer and clears `heights` before anything else, so a refill watches only what it now shows and the map holds no detached node; after `show` it records and observes as before. A blank page records and observes nothing, as before.
- **Only what the page shows**: an observation counts only when its target is still connected and still one of the page's given nodes (`this.heights.has(target)`); `moved` is still dispatched in the next frame.

**The first observation is harmless, measured.** `observe()` makes one observation at once with the node's current size. After the fix, on every demo and in every span, the border box of every observation equalled the record (0 differing), so `EPS` drops it; it is not ignored by design.

### Before and after

`node scripts/idle.mjs` on each demo under `?view=fragmented`, three spans: the load, until the chain settles (`moved` counted from the first script, refills only from the studio's first settled mark, so the load's refills are a floor); the scroll, each page brought into view in turn, 50 ms apart, then back to the top and settled; and an idle 1.5 s. `moved` events, by page, and refill transactions (a `dirtied` or a `refilled`), before (main, 75ae643) and after (ead7cca):

| Demo | Pages | Load, before | Scroll, before | Idle, before | Load, scroll, idle, after |
| :--- | ---: | :--- | :--- | :--- | :--- |
| quiet-press | 30 | 25 moved (page 1), 48 refills | 35, 70 | 90, 180 | 0, 0 in each |
| report | 11 | 0, 0 | 10 moved (page 11), 20 | 0, 0 | 0, 0 in each |
| manuale | 7 | 0, 0 | 0, 0 | 0, 0 | 0, 0 in each |
| showcase | 74 | 0, 0 | 11 moved (page 74), 22 | 0, 0 | 0, 0 in each |
| facsimile | 6 | 0, 0 | 0, 0 | 0, 0 | 0, 0 in each |
| bolletta | 3 | 17 moved (page 3), 32 | 29, 58 | 44, 88 | 0, 0 in each |
| schema-lab | 6 | 0, 0 | 0, 0 | 0, 0 | 0, 0 in each |

After the fix each of the four nodes is observed once, on `observe()`, with its border box equal to the record. The idle window holds no observation at all on any demo.

**The facsimile announces no late size**, before or after, in any span: the page takes the facsimile's intake before its trial is presented (docs/results.md, "The page presents what it renders"), so the PDF's size is known when the fill measures and nothing arrives after it. A late `moved` there is legitimate and would count once; none was seen.

### The clicks

`node scripts/spaces.mjs` clicks three times in the quiet press's paragraph on page 2 (inside a word, after the last character, before the first) and now says, for each click, the position the view's `posAtCoords` gives its point, the model's head after the click, and whether the script had to put the caret there:

| Path | Before (75ae643) | After (ead7cca) |
| :--- | :--- | :--- |
| view | 3 of 3 placed: 341 against a head of 4, 748 against 341, 311 against 750 | 0 of 3 placed: 341, 748, 311, the head where the click is |
| old | 0 of 3 | 0 of 3 |

Before, the head stayed where the last placement had put it; after, every click reaches the model on its own. The typing that follows is the last round's "after" to the character and the step: `A  B` is `A`, U+0020, U+00A0, `B` at 29.2 px in 5 steps, the end's space U+00A0 at 3.17 px and the start's at 8.42 px in 2 steps each.

### Parity

| Document | CLI | View | Same | First difference |
| :--- | ---: | ---: | ---: | :--- |
| `test/specimen.md` | 9 | 9 | 9 | none |
| `fixtures/flow` | 26 | 26 | 26 | none |
| `fixtures/tall` | 10 | 10 | 10 | none |
| `fixtures/end-gap` | 6 | 6 | 6 | none |
| `fixtures/row` | 13 | 13 | 13 | none |
| `fixtures/multicol` | 6 | 6 | 6 | none |
| `fixtures/running` | 13 | 13 | 13 | none |
| `fixtures/facsimile` | 5 | 5 | 5 | none, objects page 2 189 × 252 and page 4 533 × 400 on both sides |
| `fixtures/dressing` | 11 | 11 | 11 | none |

No warning from the view on any fixture; the multicol fixture's `info` is the engine's, as before. The studio's witness, old path against view: quiet-press 30, 30, 30 the same, none; report 11, 11, 11 the same, none.

### Not done

- **The view's selection over a click** (docs/found.md, "A refill redraws the model's selection over a click not yet read") is the view's, and open: no refill happens while nobody types now, so it waits for a legitimate late `moved` during a click.
- **A node test**: the observer's judgement needs a `ResizeObserver` and a page that fills; the page's constructor needs the engine's `<beltype-page>`. `scripts/idle.mjs` is the check.
- **A page scaled by a transform, or a node in a vertical writing mode**, would make the recorded `getBoundingClientRect().height` and the observer's `blockSize` disagree and loop again; neither occurs in the studio or the fixtures.

## The page wears its chrome

Written 2026-10-25, on the branch `round/the-page-wears-its-chrome`, phase 2's first round, for docs/found.md's "No folios, running heads, strings or author counters". Run it again with `npm test` (30 tests, in node, 5 of them the chrome's), `node scripts/specimen.mjs <absolute path>` and `node scripts/specimen.mjs <absolute path> --bare` on each fixture under `fixtures/`, on `./test/specimen.md` and on the studio's `demos/showcase/index.html` (the CLI round is the reference), and, with the studio's dev server started on a free port (`npx vite --port <port> --strictPort` in the studio), the studio's `node scripts/fragview-pages.mjs --demo <demo> --url <its url> --out <a file outside the studio>` on `showcase`, `quiet-press`, `report`, `manuale`, `facsimile` and `bolletta`, and once more on `showcase` with `--query schema=studio`.

### What was built

| Module | Lines | What it is |
| :--- | ---: | :--- |
| `src/originals.js` | 219 | `Originals`, the chain's one rendering of the whole state, the factory's: the view's renderer renders the document into a hidden holder once per state (`of`), and the driver's intake reads it, `topLevelBlocks` and `runningBoxes` asked of a stand-in whose `body` is the holder, `indexBlocks` over the blocks, `documentOpsOf` with the computed style and `html` and `body` as the ancestors, each running element logged where the flow resumed after it, the string and running assignments, and the model positions of the flow sites that read a page fact (`findPageSites`). The pure parts are exported and pinned in node: `wordsBeforePoint` and `wordPositionOf` (the mapping, below), `stateOfPage` (a page's counters at its first word, its strings and running elements over its interval) and `totalAfter` (the page total). `settle` moves the total when a page answers and has every other live page redraw its chrome. |
| `src/cicero-page.js` | 850 | `fill` wraps the cut, which is phase 1's `fill` renamed `cutOnce` and unchanged but for the measure container: the page's state is read off the originals, the trial wears what the page publishes (`publishOf`: `page N`, `pages T` once known, every string's four properties), and a page whose interval reads its strings otherwise than the trial wore and on which a flow site stands is cut again under its own values, twice at most. Then `drawChrome`, the root's `#chrome`: `dress` with each margin box's `content` transliterated (`transliterateContent`, `pagesKnown` while the total is known), `setCounters(counters, { page: index + 1, pages })`, `setStrings`, `setMarginBox` with each running element a copy of the originals' (`runningPart`), `layoutBands`. A redraw that would change nothing does nothing, and every dress `conditionsFor` makes forgets what the chrome was drawn with. |
| `src/containers.js` | 69 | The factory makes the `Originals`, hands it to every page and exposes it as `originals` on the function it returns. |
| `harness/specimen.js`, `scripts/specimen.mjs` | 259, 203 | The chrome read on both sides: the margin boxes' `content` the CLI's root clears put back first (an init script records each one, `restoreMarginContent` writes them back before the factory reads the table); every generated margin box and every flow element with generated content inked on the page tagged, and the text the browser laid out for its `::before` and `::after` read through a CDP DOM snapshot, since a counter's text is in no DOM; a slotted running element read as text, and said when it lays out no box; the CLI's Ledger beside the view's fills (each page's end in word positions, its counters, strings and running elements). A `target-counter()` read is marked round 3's known difference, a difference on a page whose words differ the cut's. |
| `fixtures/chrome/` | 1 257 words | The flow fixture's 110 × 150 mm page wearing every kind of chrome the chain answers: `counter(page) " / " counter(pages)` at the foot; a chapter string set from `h2` and read as `string(chapter) " · " string(chapter, start)` in `@top-right`, `first-except` in `@top-center` and `last` at the inner foot, with `:first` clearing the head; `body { counter-reset: chapter }`, `h2 { counter-increment: chapter }`, the counter read at the outer foot (`"Ch. " counter(chapter, upper-roman)`) and in the flow (`h2::before`); a running element written at the start and again in chapter IV, in `@top-left`; two flow sites, `string(chapter)` and `counter(page)`, in six chapters, three of which open a page. |

### The originals, and why one rendering

Counters, strings and running elements are CSS, so the state at a cut is a question about computed style, and the driver answers it once at intake with the source in its real ancestor chain. The view has no source in the document: its pages hold slices, and a slice's ancestors are partial copies. So the factory keeps one rendering of the whole state, made by the same slice renderer the pages are filled with (so the elements the engine reads are the ones a page shows), hidden in a holder that is a child of `body`, so `body`'s and `html`'s own rules apply to its blocks as they apply to the source's: the showcase's `body { counter-reset: family }` is in force on page one, read at position −1 from `body` itself. It is made when a page first fills a state the object has not seen, and kept for every other page of that state, so a chain of 74 fills reads it once.

The name is the engine's: `paginate`'s `originals` is every top-level box the intake took, and the reads loop of the next round will ask the same object. Egildo names it finally.

### The mapping

A page knows `from` and `to` as model positions, and the engine's state is ordered by the flat word position of its index. The renderer's map turns a model position into a DOM point of the originals (`pointAt`); the point is climbed to the holder's child that holds it, a block or not; and the word position is the block's base (`index.bases[b]`) plus the words of the block wholly before the point, tokenized as the engine's `indexBlock` tokenizes it, fixed boxes and running elements skipped at any depth, a point inside a word counted as that word's (`wordsBeforeChar`'s rule). A point between blocks, or in a top-level running element, is the next block's base; past the last block it is the index's total.

So a Class A cut before a box, which the view enters down the box's first-child chain, is the words before the box, the driver's `posOfCut` of a bare path; a Class B cut mid-paragraph, the position of the first character the next line shows, is that line's first word, the driver's `wordsBefore(leaf) + word`; a painted shell's `to`, the box's own position, is the words before it; a blank shell's, after the box, the words before what follows. A running element has no word: it is logged at the position of the first word after it, `index.bases[block] + wordsBefore(next)`, the driver's `runningPosition`.

Measured: every page's end on every fixture, the specimen and the showcase's first 49 pages equals the CLI's `entry.pos`, and every page's counters, strings and running elements equal its `closes`; the chrome fixture's nine Class B pages and three Class A, and the flow fixture's 26 pages, cut mid-paragraph and between boxes.

### The page total

The view says the chain is complete when a fill answers `to: null`: it drops every entry after that one, and it fills the first dirty entry first, so every page before it has filled. `totalAfter` is the arithmetic: a page that runs to the end makes the total its index plus one; the last page known cutting again makes it blank, since a later page must end the chain; any other answer leaves it. Until then every page's `counter(pages)` is `""` (`transliterateContent` with `pagesKnown` false) and its host resets no `pages`, as the CLI's `run({ until })` leaves the total blank until the document is complete; when it moves every live page draws its chrome again, `setCounters` with the total and the plan transliterated with `pagesKnown`, without a refill.

### The measure container, measured with and without

The engine's measure context has the door: `createMeasureContext(doc, w).measure(nodes, publish)` writes a page's published values on the container (`publishOn`), which the driver uses for the facts the run before it decided. The page's strings are a reading of its interval, which the cut decides, so the first trial wears the entry values (or the last fill's, where the page filled before), and a page on which a flow site stands is cut again when its own interval reads them otherwise. The chrome fixture's pages 3, 9, 12 and 15 were cut twice (a chapter that opens the page with a flow site on it); no other page of any fixture, the specimen or the showcase was.

| Document | With the published values | Without |
| :--- | :--- | :--- |
| `fixtures/chrome` | 16 of 16 the same | first difference page 10: 87 words against 88, and page 13 91 against 92 |
| the showcase against the CLI | page 25 222 words to `name.`, the CLI's; page 26 189 | page 25 233 words to `the`, page 26 166 |

The brief asked page 25 to hold 245. That is the old path's count, not the CLI's: the CLI's page 25 holds 222 words and ends at `name.`, and the view's now does too. The old path, and the view under the studio's own schema, draw the page's first paragraph without the three `<code>` elements the source holds, 3 px shorter (docs/found.md, the studio's entry), so the witness's page 25 holds 245, and under `schema=studio` the view gives 245 with the string delivered (256 before). Under the generic ground before the round the view's page 25 was 245 by chance: the empty string shortened its line by what the `<code>` lines had lengthened it.

### Parity

`node scripts/specimen.mjs`, the CLI round against the view in one page, after the round (3800dfb, 9b90285); "margin boxes" is the generated boxes' laid-out text, page for page, with the CLI's count of boxes read; "state" is each page's end, counters, strings and running elements against the CLI's Ledger. Every row is the same under `--bare`.

| Document | CLI | View | Same | First difference | Margin boxes (read) | State | Flow generated content |
| :--- | ---: | ---: | ---: | :--- | :--- | :--- | :--- |
| `test/specimen.md` | 9 | 9 | 9 | none | 9 of 9 (24) | none differs | 19 sites, the same; under `--bare` 15 `target-counter()` reads blank on the view, pages 1 to 3 |
| `fixtures/flow` | 26 | 26 | 26 | none | no box declared | none differs | none |
| `fixtures/tall` | 10 | 10 | 10 | none | no box declared | none differs | 1 site, the same |
| `fixtures/end-gap` | 6 | 6 | 6 | none | no box declared | none differs | none |
| `fixtures/row` | 13 | 13 | 13 | none | no box declared | none differs | none |
| `fixtures/multicol` | 6 | 6 | 6 | none | no box declared | none differs | none |
| `fixtures/running` | 13 | 13 | 13 | none | 13 of 13 (26) | none differs | none |
| `fixtures/facsimile` | 5 | 5 | 5 | none | no box declared | none differs | 1 site, the same |
| `fixtures/dressing` | 11 | 11 | 11 | none | no box declared | none differs | 2 sites, the same |
| `fixtures/chrome` | 16 | 16 | 16 | none | 16 of 16 (94) | none differs | 15 sites, the same |
| the showcase | 76 | 74 | 53 | page 50 | 65 of 76 (216), first difference page 18 | first difference page 50 | 194 sites; 2 `target-counter()` reads, 33 on pages that hold other words |

The running fixture's two running elements now stand in `@top-left` and `@bottom-left` on all 13 view pages, each laying out a box. The chrome fixture page by page, the same on both sides: page 1 the head cleared by `:first`, `Folios` at the inner foot, `1 / 16`, `Ch. 0`; page 2 `Folios` in all three readings and `Ch. I`; page 3, where chapter II opens the page, `first-except` empty, `Strings · Strings`; page 10, the first after the second mark is written, `The second mark` in `@top-left` to page 16; page 16 `16 / 16` and `Ch. VI`. The flow's 15 sites, the chapter numbers before each heading, the `[chapter]` strings and the `(page N)` folios, read the same on both sides.

**The specimen's reads.** Without `--bare` the CLI's delivery sheet, adopted on the document (`:where([href="#x"])::before { --beltype-read-…: "3" }`), reaches the view's links as well, so the view's pages show the CLI's values; with it taken off, the view's 15 reads on pages 1 to 3 are blank (`p. 3` and the rest on page 1, nine on page 2, `(Configuration, p. 7)` and `Chapter II` on page 3), round 3's. No cut moved for them.

**The showcase against the CLI.** Before the round (main, a134b04): 74 pages against 76, 51 the same, first difference page 25 (245 words against 222, then 166 against 189), no margin box. After: 53 the same, first difference page 50, the carried floats of the flows family (pages 50 to 58) and the engine's own page-63 continuation of a `pre` (pages 63 on), as recorded in "The page always advances". The margin boxes differ on page 18, the `band` page's `page 18 of 76` against `of 74`, the chain's length, and on the pages from 58 that hold other words; the state differs from page 50 only.

### The studio, through its witness

A dev server of the studio's own on a free port, the old path against the view, the studio unchanged; margin boxes read by a probe with the harness's CDP reading on both paths:

| Demo | Old path | View | Same | First difference | As last recorded | Margin boxes the same |
| :--- | ---: | ---: | ---: | :--- | :--- | :--- |
| showcase | 76 | 74 | 43 | page 13 | 45, page 13 | 65 of 76 (216 boxes against 210), first difference page 18 |
| showcase, `schema=studio` | 76 | 76 | 52 | page 29 | 50, page 25 | not read |
| quiet-press | 30 | 30 | 30 | none | yes | 30 of 30 (50), the running head `Notes on the Quiet Press` on both |
| report | 11 | 11 | 11 | none | yes | 11 of 11 (30) |
| manuale | 7 | 7 | 6 | page 5, the repeated table header | yes | 7 of 7 (24), `Pagina N di 7` |
| facsimile | 6 | 6 | 6 | none | yes | 6 of 6 (5) |
| bolletta | 3 | 3 | 2 | page 3 | yes | 3 of 3 (10), `pagina 2 di 3` |

Under the generic ground the witness's pages 25 and 26 now differ (222 and 189 against its 245 and 166), where they agreed by chance before; both are the CLI's counts, and the witness drops the `<code>` there. Under the studio's own schema the reads cluster closed: pages 25 and 26 hold 245 and 166 on both paths, and the first difference is page 29, the `verbatim` atoms found.md records. The bolletta's page 3 is phase 1's repeated table header, as recorded.

### The cost

The plan's open question, measured on the studio's showcase (74 pages, 1 421 elements in the originals), under `?view=fragmented`. Load, the sums over the 74 fills of the account's own timings: the originals rendered once, 4.8 ms, and read, 18.4 ms; with each page's two word positions, 36.7 ms; the cuts 490.6 ms; the chrome drawn at each fill's end 116.3 ms; the redraw of 73 pages when the total arrived 69.1 ms. No page was cut twice. Five transactions, one character typed into a paragraph on page 3, each awaited until the chain is quiet:

| Transaction | Render | Read | Settled, the round | Settled, main |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 5.6 ms | 23.6 ms | 46.5 ms | 22.8 ms |
| 2 | 2.3 ms | 14.7 ms | 28.0 ms | 9.9 ms |
| 3 | 2.0 ms | 13.1 ms | 25.7 ms | 9.1 ms |
| 4 | 1.9 ms | 12.0 ms | 24.1 ms | 7.6 ms |
| 5 | 2.2 ms | 12.6 ms | 25.4 ms | 7.9 ms |

The view's first paint, which is its whole chain (docs/found.md, the view's "The first page waits for the whole chain"), the studio's script three times each: the showcase 936, 763 and 774 ms on main against 1 087, 1 051 and 1 042 ms after, the whole chain 875, 709 and 713 against 1 035, 999 and 990; the quiet press's first paint 485, 424 and 437 against 468, 452 and 459.

So the rendering is small beside a whole chain (23.2 ms of about 700) and large beside a keystroke: a transaction that refills one page settled in 7.6 to 9.9 ms and now in 24.1 to 28.0, of which the originals are 14.2 to 16.0, inside `updateState`. The load's 280 ms are mostly the chrome's (116.3 and 69.1 ms), the root's own cost for the same work; the originals are 36.7. An incremental path, proposed and not built (docs/found.md, "The originals cost a keystroke more than the refill it serves"): render and read per top-level node, keeping each untouched node's element, its index part and its ops part by the node's identity, ProseMirror's nodes being persistent, through the engine's own `Keep` door on `indexBlocks` and `documentOpsOf`, settled against the sheets' reach as the engine's memo is.

### Doors

- **`setMarginBox` takes a running element only through a forwarding slot** (`chase.js`): a page outside the root cannot forward, and a `<slot>` outside a shadow tree draws nothing (measured: the clone laid out no box). Worked around by slotting the clone itself, with an `assign` that does nothing.
- **`runningBoxes` and `topLevelBlocks` read `doc.body`, `runningPosition` is private** (`driver.js`): worked around by a stand-in document and two lines written again.
- **The root clears the margin boxes' `content` and keeps the table it captured** (`seam/client.js`): met only by the harness, which holds both hosts; worked around there.

### Not done

- **The reads loop** (phase 2's second round): a page an edit does not refill keeps its chrome, and no page is refilled because another page's chrome moved (docs/found.md).
- **The layout facts** (phase 2's third round): `target-counter()` and `target-text()`, and `counter(pages)` in the flow measured at its reservation until the chain is complete.
- **The incremental originals**, above.
- **A node test of `drawChrome`**: it needs the engine's `<beltype-page>`; the chrome fixture is the check.

## The Ledger is state

Written 2026-10-25, on the branch `round/the-ledger-is-state`, phase 2's second round, for docs/found.md's "A page an edit does not refill keeps the chrome it was drawn with" and the `target-counter()` part of "`target-counter()` and `target-text()` read nothing". Run it again with `npm test` (38 tests, in node, 8 of them the round's), `node scripts/specimen.mjs <absolute path>` and the same with `--bare` on each fixture under `fixtures/`, on `./test/specimen.md` and on the studio's `demos/showcase/index.html`; `--retitle 'Strings=>Strings, retitled'` (and `'Folios=>Folia'`, `'Folios=>Folios, retitled'`) on `fixtures/chrome` for the chrome on an edit; `--keys 3:5` on the showcase for the cost, with and without `--no-ledger`; and the studio's `node scripts/fragview-pages.mjs --demo <demo> --url <its url> --out <a file outside the studio>` on its six demos, with the studio's dev server on a free port.

### The decision

Settled by Egildo, 2026-10-25: *the Ledger is plugin state of prosemirror-beltype*. The view's fragments plugin is the Ledger's spine: each entry's key, its `from` and `to` mapped through every transaction, and its `dirty`. This package keeps, in a plugin of its own keyed by the entry's key and never in a slot of the view's entries (the view knows no engine), one row per page, pure data, and the reads loop's two warm tables. *The memos are not state*: the whole rendering (`Originals`), the live pages and the rows waiting for a transaction live on an object the factory owns, beside the state.

### The plugin

`ledger()` (`src/ledger.js`) returns a `Plugin` under `ledgerKey`, with no option. Its state:

| Field | What it holds |
| :--- | :--- |
| `rows` | A `Map` from the chain entry's key to the page's row: `name`, `parity`, `blank`, `counters` at its start, `strings` and `running` over its interval in their four readings, `end` as a word position (null at the document's end, the start on a blank page), `block`, the top-level block that end stands in, `contentW` and `contentH`, `next`, the hint its fill left, and `key`, the engine's key. |
| `delivered`, `facts` | The loop's warm tables (*a resumed run starts from the numbers it left*): the values the layout was cut under and each page's published facts. |
| `resumed`, `why`, `reads` | The last settle's own results, `reads.runs` among them. |

The engine's key (`keyOf`) is *the run resumes from an entry*'s: in it the cut's class, whether the page began at a forced break, the side a forced break still owes, the parity only where it can change a cut (the page's geometry differs between left and right, or a side is owed), and what the next page begins with besides its slice (a shell, a row's pieces); the address itself is the entry's `to`, which the spine holds and maps; out of it the word position, the page number and the literals. `pageOf(state, pos)` is an index lookup over the entries by the view's own rule (a cut belongs to the page after it), null where the entry is dirty or has no row yet. `accountOf(rows)` is the rows in the driver's account shape. The state round-trips through `toJSON` and `fromJSON`; the fragments plugin has neither, so a reopened state keeps its warm tables and loses its rows at its first transaction (filed in docs/found.md, the view's "The chain does not serialize").

**Who writes the row.** The page's fill ends with the chain object computing its row (`Chain.filled`) and staging it for the document it was cut from; the view then dispatches its `refilled` transaction, and the Ledger's `appendTransaction`, seeing a transaction on that document, appends one carrying the staged rows, outside the history. An appended transaction rather than the chain object dispatching its own after the view's: the refill and its row land in one `state.apply`, so the view's `updateState` receives one state in which the spine and the Ledger agree, with no extra update of the view. The same append drops a row whose entry the view dropped, so the plugin's place among the state's plugins does not matter (the view adds its own last when the state lacks it). The plugin finds the chain object through the view it is given, `view.someProp('containers').chain`.

### The chain object

`Chain` (`src/chain.js`), made by `ciceroContainers` beside `Originals` and exposed as `chain` on the function it returns, is the factory's: the live pages by their entry's key and by their index, the rows staged per document, the waiters, and the reads loop's seat. A new object rather than `Originals` grown: `Originals` is one rendering of one state and what is read off it, a memo every fill reads synchronously; the chain object is the chain's life across states and needs the view. Egildo names both finally. Its three doors:

1. **Settled.** `settled(doc)` resolves `{ complete: true }` at the first update of `doc` in which no entry is dirty, the last entry runs to the end and no dirtying the object owes is pending; `{ complete: false, why }` where the chain stops short (a dirty entry and no fill in flight after the view's update, or a fill that threw); and rejects with `Overtaken` when a newer document arrives first. The signals are the view's: the Ledger's plugin view hears every update after the view's `refresh` has started the next fill, and each page says when its fill begins and ends. Nothing polls.
2. **The account.** `account(view)`, the Ledger's rows in the chain's order through `accountOf`: `pos` each page's end in word positions, `cut.path[0]` its block, `closes` the page's number, content box, counters and strings; its `index` is the originals'.
3. **A resume.** `resume(view, at, index, blocks, account)`: the loop's `resume.at`, addresses in the originals' position space, each found as an element (`elAt`) and its words (`index.entryFor`), its page found by the engine's own `pageIntervals` and `pageContaining` over the account, and that page and the one before it dirtied through the view's `dirtied`, earliest first (the driver restarts one page before the page holding an edit).

### The loop seated

Once per document, and once after an `invalidate()`, the chain object runs `settleReads(document, { run, blocksOf: () => originals' blocks, originals: the holder's children, warm: the Ledger's delivered, warmFacts: the Ledger's facts, hide: 'beltype-page' })`, called from the Ledger's plugin view after the view's update has started the state's first fill. `run(laid)` is the chain: the first attempt dirties nothing and awaits `settled(doc)`, the chain as the view fills it after `updateState`; a later one dirties the pages `laid.resume.at` names and awaits `settled(doc)` again; both return `{ account, index, resumed, why }`, `resumed` the pages refilled in the run (`from`, `to`, `shift`, `converged`, `kept`) and `why` a sentence where none is (the chain's first fill, an invalidation, every page cut again). The settle is synchronous up to its first `await run`, so its delivery and its reservations are adopted before the state's first trial is measured, which a fill measures after its first `await`. The loop's result is written into the Ledger by one transaction outside the history.

A newer document overtakes a settle: its pending `run` rejects with `Overtaken`, and since the loop delivers only after a `run` returns, an overtaken settle never writes again and its results are dropped; the newer settle has delivered its own on its first line. No second loop: the loop is the engine's, untouched.

**The hiding scope.** `hideSheetText` scopes its rules as `${scope} :where([href="#x"])::before`; a page's slice is its light children (`setContent`), so `beltype-page` reaches them, and the CLI's pages, slotted from a root's light DOM, are out of its reach. Not measured on screen: the reservations stand only while a run is in flight.

**The page's own facts.** The loop hands `run` the facts the layout before it decided (`laid.facts`), which the driver's pages wear; this package's pages wear their own interval's values, read off the originals, which are those facts or truer, so `laid.facts` is not read. One consequence is filed for the engine (docs/found.md, "The loop checks a page site against the facts it handed the run"): where an edit moves a string a flow site reads, the loop sends a second run that refills pages already cut under the truth.

### The tree-order check

`reads.js`' header: a target is `getElementById`'s answer, the first element in tree order, so the originals must precede every copy that keeps the id. The view's renderer keeps the author's ids (`slice-renderer.js` has no word for them; the schema's `toDOM` writes them), so every page's slice, the law copy and the staging copy carry them, and in the harness so do the CLI's root's light children. The holder was a body child appended when a page first filled, after the view. Measured with it there, the specimen under `--bare`: the loop warned that the nine targets were outside the flow, and all 15 reads differed from the CLI's. The holder is now body's first child (`Originals.of`), and the 15 are the CLI's.

### Found on the way: a refilled page kept the hint it was built with

Measured on the chrome fixture before the fix, `Folios` retitled `Folios, retitled`: the heading wraps, the chain refills from page 1 to a 17th page, and page 4, which now opens chapter II at a forced break, was refilled with `forced: false` and a lead of 27.72 px truncated, since the view hands a container its hint only when it builds it; every page from 4 on differed from a fresh fill (77 words against 83 on page 4). The page now takes, at every fill, the hint the page before it left last (`Chain.hintFor`, by index); the view's door is filed.

### The chrome on an edit

`--retitle` on `fixtures/chrome` under `--bare`: a heading's text replaced by a transaction on the view, the chain and the loop awaited, every page's words, margin boxes and flow read; then `invalidate()`, the view's fresh fill of the same state read the same way, and the two compared page for page.

| Edit | Refilled | Redrawn, no refill | Dirtied for a flow site | Loop | Equal to the fresh fill |
| :--- | :--- | ---: | :--- | :--- | :--- |
| `Strings` to `Strings, retitled`, page 3 | 3 | 2 (pages 4, 5) | none | 2 runs: page 3, then 2 and 3 | 16 of 16 |
| `Folios` to `Folia`, page 1 | 1 | 0 | page 2 | 1 run: pages 1 and 2 | 16 of 16 |
| `Folios` to `Folios, retitled`, page 1 | 1 to 17, a page added | 0 | page 2 | 2 runs: 1 to 17, then 1 and 2 | 17 of 17 |

After the first edit page 3 reads `Strings, retitled · Strings, retitled` in `@top-right` and `[Strings, retitled]` in its flow, page 4 the same in its head and foot, page 5 `Counters · Strings, retitled`, the `start` reading; pages 6 to 16 keep their own. The chain was quiet 13 ms after the dispatch, 13 ms and 98 ms for the other two. The second run of the first edit is the engine door above: page 3 was refilled under its new string, and the loop, laid under the warm facts, measured its site under the old one.

### Parity

`node scripts/specimen.mjs`, the CLI round against the view in one page, at 2de1bc9; every row is the same under `--bare`. "Reads" are the flow sites that read `target-counter()` or `target-text()`; "runs" the loop's on each side.

| Document | CLI | View | Same | First difference | Margin boxes | State | Reads the same | Runs, CLI / view |
| :--- | ---: | ---: | ---: | :--- | :--- | :--- | :--- | :--- |
| `test/specimen.md` | 9 | 9 | 9 | none | 9 of 9 | none differs | 15 of 15 | 1 / 1 |
| `fixtures/flow` | 26 | 26 | 26 | none | 26 of 26 | none differs | none declared | no loop |
| `fixtures/tall` | 10 | 10 | 10 | none | 10 of 10 | none differs | none declared | no loop |
| `fixtures/end-gap` | 6 | 6 | 6 | none | 6 of 6 | none differs | none declared | no loop |
| `fixtures/row` | 13 | 13 | 13 | none | 13 of 13 | none differs | none declared | no loop |
| `fixtures/multicol` | 6 | 6 | 6 | none | 6 of 6 | none differs | none declared | no loop |
| `fixtures/running` | 13 | 13 | 13 | none | 13 of 13 | none differs | none declared | no loop |
| `fixtures/facsimile` | 5 | 5 | 5 | none | 5 of 5 | none differs | none declared | no loop |
| `fixtures/dressing` | 11 | 11 | 11 | none | 11 of 11 | none differs | none declared | no loop |
| `fixtures/chrome` | 16 | 16 | 16 | none | 16 of 16 | none differs | 1 of 1 (`p. 15`) | 2 / 2 |
| the showcase | 76 | 74 | 53 | page 50 | 65 of 76, first page 18 | first page 50 | 23 of 28 | 2 / 2 |

The reads delivered: the specimen's 17 references (14 page reads and 3 counter or text reads, `target-text()`'s `Configuration` among them), its 15 flow reads on pages 1 to 3 the CLI's; the chrome fixture's 2 references and 9 page sites; the showcase's 28 references and 4 page sites. On the showcase the 5 read sites that differ are past its first cut difference, where the view's chain is two pages shorter: the contents' `65`, `71` and `74` against `67`, `73` and `76` on page 3, and the cross-reference that reads `p. 38` on both sides, on the view's page 67 and the CLI's 69. `counter(pages)` in the flow, the colophon's, is one of the 4 page sites: checked by the loop, its line not moved, it draws 74, the view's total, where the CLI's draws 76. Both sides print the same two meant warnings (the `words` counter style, `#a-chapter-never-written`). Before the round the specimen's 15 reads were blank on the view under `--bare`, and without it showed the CLI's values only because the CLI's own delivery sheet reached the view's links; nothing else in the table moved (round 1: the showcase 53 the same, first difference page 50, margin boxes 65 of 76, state page 50).

### The studio, through its witness

The studio was not edited, and its mount does not install `ledger()` (filed, the studio's "The fragmented view installs no Ledger"), so its pages have the round's holder and the hint taken by index, and no loop. A dev server of the studio's own on a free port:

| Demo | Old path | View | Same | First difference | As last recorded |
| :--- | ---: | ---: | ---: | :--- | :--- |
| showcase | 76 | 74 | 43 | page 13 | yes |
| showcase, `schema=studio` | 76 | 76 | 52 | page 29 | yes |
| quiet-press | 30 | 30 | 30 | none | yes |
| report | 11 | 11 | 11 | none | yes |
| manuale | 7 | 7 | 6 | page 5 | yes |
| facsimile | 6 | 6 | 6 | none | yes |
| bolletta | 3 | 3 | 2 | page 3 | yes |

### The cost

The studio's showcase under the view, three runs each the same afternoon: on `main` (ca7a9c6) the first paint 1 300, 1 255 and 1 212 ms and the whole chain 1 236, 1 195 and 1 147 ms; on the branch (2de1bc9) 1 152, 1 158 and 1 229 ms and 1 099, 1 102 and 1 168 ms. Round 1's 1 087, 1 051 and 1 042 ms were measured on another afternoon; the two today are the comparison, and they do not differ beyond their spread.

With the loop, measured in the harness on the showcase (the studio cannot install the plugin), three runs each:

| | Without the Ledger (`--no-ledger`) | With it |
| :--- | :--- | :--- |
| The chain quiet after the mount | 779, 852 and 813 ms over 74 fills | 862, 882 and 893 ms over 78 fills |
| The settle | none | 878.8, 898.6 and 908.9 ms: run 1, the chain as the view fills it, 757.0, 786.7 and 797.0 ms; run 2, pages 24, 25, 31 and 32, 46.4, 54.7 and 46.6 ms |
| Five keystrokes on page 3, the chain quiet after each dispatch | 21.4, 20.2, 16.5, 18.8, 18.7; 20.9, 18.0, 17.3, 18.6, 20.2; 19.7, 20.1, 16.6, 19.7, 18.1 ms | 32.1, 27.7, 27.7, 29.8, 27.2; 30.6, 26.9, 27.8, 27.0, 27.0; 33.9, 29.7, 28.1, 30.9, 27.8 ms |

Each keystroke settles in 1 run. Inside the view's update with the Ledger (23.8 to 30.5 ms), the clean pages' chrome read again takes 1.8 to 3.2 ms and the loop's start 7.5 to 9.6 ms (`cicero:reads`: the site search, the position index and the written facts over every block); the settle ends 18.3 to 22.6 ms after the dispatch. Before the clean runs were shifted (7171e58) the chrome took 9.9 to 10.9 ms, one reading of each of the 74 pages, and a keystroke 33.7 to 41.7 ms. Round 1's 46.5, 28.0, 25.7, 24.1 and 25.4 ms were the studio's, with no loop. The loop's start walks every block per state because the engine's `keep` door keeps a part by the box's element and the originals are rendered anew per state; the incremental rendering filed in docs/found.md is its prerequisite too.

### Doors

- **The view hands a container its hint only when it builds it** (`fragmented-view.js`, `build`, `fill`): worked around by the page asking the chain object.
- **The fragments plugin does not serialize** (`fragments-plugin.js`): the Ledger's rows cannot meet their entries in a reopened state.
- **The loop checks a page site against the facts it handed the run** (`reads.js`, `settleReads`): a run that could return the facts each page was cut under would spare the second run of an edit that moves a string a flow site reads.
- **The studio's mount installs no Ledger** (`src/fragmented.js`): one line.

### Not done

- **The incremental originals and the loop's kept parts** (docs/found.md, "The originals cost a keystroke more than the refill it serves"): left filed, since the `keep` door needs box identity across states that a rendering made anew per state does not have, which is a round of its own.
- **The hiding sheet seen on screen**: built and scoped, not measured.
- **A browser test of the chain object**: its pure parts are pinned in node; the rest is measured by the harness.
- The harness: a page refilled after `invalidate()` and never scrolled to had its slotted flow left out of the DOM snapshot now and then; the script scrolls each page in and snapshots again, three times at most, until every tag is in it.

## The originals keep their parts

Written 2026-10-25, on the branch `round/the-originals-keep-their-parts`, phase 2's third round, for docs/found.md's "The originals cost a keystroke more than the refill it serves". Run it again with `npm test` (45 tests, in node, 7 of them the round's, `test/kept.test.js`); `node scripts/specimen.mjs <absolute path>` and the same with `--bare` on each fixture under `fixtures/`, on `./test/specimen.md` and on the studio's `demos/showcase/index.html`; `--edits 'retitle:Strings=>Strings, retitled;retitle:Folios=>Folia;retitle:Folia=>Folios, retitled;key:3;delete:2;paste;start;end'` on `fixtures/chrome` (and `--edits 'key:2;delete:2;paste;start;end'` on the specimen and `fixtures/running`, `'key:3;delete:3;paste;start;end'` on the showcase) for the edit equalities; `--keys 3:5` on the showcase for the cost, with `--no-ledger` and with `--reach 0`; the studio's `node scripts/fragview-pages.mjs --demo <demo> --url <its url> --out <a file outside the studio>` on its six demos. The "before" is main at 7051a1c, run from a copy of it (`git archive 7051a1c`) beside this checkout, so no branch was checked out.

### The design as built

`Originals.of` (`src/originals.js`) renders the first state whole, as before, and finds each top-level node's element by the start its node was rendered at. A later state is placed per top-level node (`place`):

- **The identity diff.** ProseMirror's nodes are persistent, so a top-level node a transaction did not touch is the same object in the new document. `matchNodes(before, after)` answers, for each new child, the index of the same object among the old ones or −1: the common prefix, the common suffix, then a map from each old node to its indices, each taken once in order, for the middle a paste or a move leaves.
- **The placement.** A kept node keeps its entry `{ node, el, positions, at }`: its element and the position map of the slice it was rendered in, and `at`, its node's start in the document that slice was rendered from. A changed or new node is rendered alone, `render(doc, start, start + nodeSize)`. A range that is exactly one top-level node renders, as read in the view's `slice-renderer.js`, as the node's own element with no partial wrapper and no dressing word (it is neither resumed nor cut off, and opens at `from`), after `$from.index(0)` shallow siblings marked `away`, which stand for no position; the element is the one fragment child the map holds. A removed node's element is taken out; then, from the last entry to the first, each element whose next sibling is not the one it should have is put before it, which is every new element and every moved one, and only those. Every element taken out, put in or moved is reported to the engine's memo, `memo.replaced(el)`, the door `patchBox` uses. An untouched node's element is never touched, so its object survives the edit, the one condition on which the engine's `keep` works.
- **The rebase.** A kept slice's map holds the absolute positions of the document it was rendered from. A node now starts at `base`, so a model position is asked of its slice at `pos − base + at` (`rebased`) and a recorded start answered at `start + base − at` (`positionOf`, for the page sites). `pointOf` finds the node holding a position by a binary search over the entries' bases; inside a node it asks the view's `pointAt` over that node's element alone, through a root that holds the element only, so the walk steps into it as it stepped in from the holder; between nodes, or in a node the page does not draw, it answers the holder before the next element, which is what `pointAt` over the whole rendering answered.
- **The memo's seat.** The originals own one `ForcingMemo` (the engine's, imported from `src/forcing-memo.js`, nothing copied). Once per state, after the placement and before any walk, `memo.settle(sheetReach(document))`; where it answers that the memo may be used, the state carries `memo.keep`, and `indexBlocks`, `documentOpsOf` and `findPageSites` here, and `settleReads` in `Chain.settle` (its site search, position index and written facts), take it. `indexBlocks` keys its part by the top-level block and accepts a kept part only for the same block index; `documentOpsOf` keys its part by the block, and its marked part by the marks in the block; both lay kept parts end to end offset by each block's base, so a part kept for a block whose base moved is laid where the block is now, and the measurement below finds every reading equal. At reach 2 nothing is kept and the console says once what the engine's `settledMemo` says of its runs. Where an edit inserted, removed or moved a top-level box and a sheet holds a structural pseudo-class (`:nth-child`, `:first-child` and their kin), every part is forgotten (`memo.clear()`), since the engine's reach does not count them: `patchBox` keeps a parent's child count, an edit here does not.
- **Fixed boxes and running elements.** `topLevelBlocks` and `runningBoxes` are asked, as before, of the stand-in whose body is the holder, every state: a running element inside a kept node is the same element, one inside a changed node is found again, and the positions handed to `documentOpsOf` come from the state's index, so they rebase with it.
- **The view's invalidation.** `invalidate()` releases every page at once, which nothing else does, so the chain's last release makes the originals forget their rendering and their parts (`Chain.released`, `Originals.forget`), before the first new fill asks for them, and the next state is rendered whole. Before the round the originals were kept per document, and an invalidation, which makes no new document, left them as read under the old conditions.
- **The chrome of a running element.** A page now compares the running elements it places as well as their indices (`runningPlaced`, `sameElements`, by identity or as equal nodes), in `Chain.rechrome` and in `drawChrome`: found on the way, below.

### The sheets' reach, and what the memo keeps

`sheetReach(document)` as each harness run and the studio read it (`reachOf` lists the rules that give it):

| Document | Reach | Rules of reach 2, of reach 1 | Top-level nodes, blocks |
| :--- | ---: | :--- | :--- |
| `fixtures/chrome`, `dressing`, `end-gap`, `facsimile`, `multicol`, `row`, `running`, `tall` | 0 | none | the chrome fixture 2 nodes, 1 block |
| `fixtures/flow` | 2 | 2 (`section:has(> h2.verso)`, `section:has(> h2.wide)`), 0 | |
| `test/specimen.md` | 2 | 3 (`section:has(> h1)` and two rules under it), 0 | 7 |
| the showcase, in BelType's page | 2 | 1 (`section.sub:has(> h3.special)`), 10 (`p + p`, `.lead + p`, `h3 + p` and their kin) | 14 nodes, 13 blocks |
| the studio's quiet press | 2 | 1, 1 | 18 nodes, 8 blocks, 208 elements |
| the studio's report | 2 | 1, 2 | 20, 8, 322 |
| the studio's manuale | 2 | 1, 6 | 12, 4, 449 |
| the studio's facsimile | 2 | 1, 0 | 7, 3, 28 |
| the studio's bolletta | 2 | 2, 3 | 10, 4, 1 113 |
| the studio's showcase | 2 | 2, 10 | 29, 13, 1 421 |

Every `:has()` above is the has-words rewrite of an author's `:has()` (`section:is(:where([data-beltype~="has:…"]), :where(:not(fragment)):has(> h1))`). Every studio demo is reach 2 through one rule of the studio's own sheet, `li > p:first-child:not(:has(~ p) …)`. So in the studio, and on the specimen and the showcase, the memo keeps nothing, and a keystroke spares only the rendering and the restyle; on the fixtures of reach 0 it keeps every untouched block's parts. The tally (`memo.tally`, per walk, both the originals' walks and the loop's, so a block asked twice in one state is counted twice):

| Edit (fixture, reach 0) | Nodes rendered, kept | `index` kept, read | `ops` kept, read | `sites` kept, read | `ops:marked` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| the chrome fixture, any edit inside its one section | 1, 1 | 1, 1 | 0, 1 | 11, 1 | 0, 1 |
| the chrome fixture, two paragraphs pasted at the top level | 2, 2 | 3, 3 | 1, 2 | 24, 2 | none |
| the chrome fixture, a character at the start (inside its running element) | 1, 3 | 6, 0 | 3, 0 | 25, 1 | none |
| the chrome fixture, a character at the end | 1, 3 | 5, 1 | 2, 1 | 25, 1 | none |
| `fixtures/running`, a key on page 2 | 1, 2 | 1, 1 | 1, 1 | 5, 1 | none |
| `fixtures/running`, two paragraphs pasted | 2, 3 | 0, 4 | 2, 2 | 8, 2 | none |
| the showcase settled under reach 0, a key on page 3 | 1, 13 | 25, 1 | 12, 1 | 178, 1 | 12, 1 |

The hits and misses of the memo's per-element reads are 0 throughout: they are the forcing index's, which the pages build with readers of their own. After a paste every later block reads its index part again, since the part carries its block's number (filed). The chrome fixture's whole flow is one top-level section, so an edit anywhere in it reads it whole: the unit of a part is the top-level box (filed).

### Before and after, per keystroke

The showcase in the harness, BelType's own page, five characters typed on page 3, each awaited until the chain is quiet and the loop settled; before (7051a1c) and after (692392d) interleaved, three runs each, with the Ledger. Milliseconds, the range over 15 keystrokes:

| | Before | After |
| :--- | :--- | :--- |
| The chain quiet after the dispatch | 26.0 to 32.4 (30.7, 28.8, 26.0, 29.5, 28.2; 30.0, 27.1, 27.2, 27.1, 26.3; 32.4, 27.7, 28.5, 27.1, 26.9) | 20.4 to 25.6 (25.6, 24.3, 23.6, 22.4, 22.8; 24.4, 23.2, 21.9, 21.7, 21.6; 25.6, 22.8, 22.3, 21.5, 20.4) |
| The view's update | 23.8 to 28.5 | 18.5 to 22.4 |
| The originals' rendering | 2.3 to 2.9 | 0.1 to 0.4 |
| The originals' reading | 10.9 to 13.0 | 8.3 to 9.6 |
| The loop's start (`cicero:reads`) | 7.3 to 9.4 | 7.1 to 8.9 |
| The settle, in 1 run | 18.1 to 22.0 | 17.6 to 20.5 |
| The view's chain on load | 781, 824, 847 | 794, 799, 813 |

The rendering is one chapter's (rendered 1 node, kept 13) instead of the whole state's, and the reading is cheaper by the restyle: the first `getComputedStyle` after a whole holder replaced paid for 1 421 elements, now for one chapter's. The loop's start is the same, because the showcase's reach is 2. Of the reading after, the intake's blocks and running elements take 1.3 to 1.9 ms, the position index 2.6 to 3.9 and the counter log 3.8 to 4.5.

Without the Ledger (`--no-ledger`, no loop), run consecutively rather than interleaved, three runs each: quiet 16.7 to 20.8 ms before (render 2.2 to 2.9, read 10.8 to 13.3) and 11.3 to 15.7 ms after (render 0.2 to 0.4, read 8.2 to 9.9); the chain on load 806, 837 and 803 ms before, 839, 737 and 723 after. Round 2 recorded 26.9 to 33.9 ms with the Ledger and 16.5 to 21.4 without on another hour; the interleaved runs above are the comparison.

**What the engine's door would give.** With the memo settled under reach 0 whatever the sheets say (`--reach 0`, a measurement, not a reading the round makes), three runs: quiet 6.4 to 11.5 ms, the view's update 5.6 to 7.8, the reading 1.9 to 2.4 (of which the intake's blocks and running elements 1.4 to 1.6, a walk with no part), the loop's start 0.7 to 1.0, the settle 11.1 to 14.4; after the five keystrokes every page, every page's state, the originals' reading and the delivered reads equal a fresh whole rendering. That is not a proof that 0 is right for the showcase's sheets; it is the ceiling of the door filed in docs/found.md, "The sheets' reach is read per box, and this host replaces whole top-level boxes".

**In the studio, through the view.** `fragview-pages.mjs` has no keystroke mode; the studio's `scripts/fragview-keys.mjs` has one (a real key pressed, keydown to the first frame after the chain settled), and it was run from a copy that names its server and skips the old path (`--url`, `--view-only`; the studio was not edited), against two dev servers of the studio on free ports, one resolving this branch and one main's copy, 10 presses of each pair at each spot, medians (min–max):

| Studio, the view | Before | After |
| :--- | :--- | :--- |
| showcase, a character a third in | 42 (38.2–50.3) | 36.9 (34.5–43.1) |
| showcase, Backspace a third in | 43.3 (39–47.5) | 36.1 (34.6–38.1) |
| showcase, Enter a third in | 38.8 (37.7–41.6) | 34.8 (33.3–39.7) |
| showcase, the join a third in | 39.6 (37.1–43.3) | 35.8 (34.6–36.7) |
| showcase, a character two thirds in | 53 (49.3–59.4) | 48.3 (46.8–53.7) |
| showcase, Backspace two thirds in | 52.8 (48.9–57.4) | 48.9 (46.3–52.1) |
| showcase, Enter two thirds in (4 pages refilled) | 107.2 (101.7–111.7) | 102.7 (98.8–109.3) |
| showcase, the join two thirds in (4 pages refilled) | 107.4 (103.7–121.5) | 114.1 (109.9–116.1) |
| quiet press, a character a third in | 31.6 (22.1–33) | 31.4 (20.6–32.9) |
| quiet press, Enter a third in (4 pages refilled) | 33.7 (31.2–35.6) | 32.7 (29.5–34.8) |

The quiet press is bound by the frame on both sides (its originals are 208 elements: rendering 0.4 to 0.5 ms before and 0.2 to 0.3 after, reading 3.3 to 3.4 before and 3.1 to 3.4 after). On the studio's showcase (29 top-level nodes) the last four keys' rendering was 2.1 to 2.9 ms before and 0.6 to 0.7 after, the reading 12.0 to 15.2 and 10.7 to 11.1.

### The load

Unchanged by design: the first state is rendered whole. The studio's showcase under the view, before and after interleaved, three runs each: first paint 1 605, 1 326 and 1 303 ms before, 1 617, 1 247 and 1 322 after; the whole chain 1 539, 1 268 and 1 238 before, 1 558, 1 192 and 1 257 after. Round 2's 1 152, 1 158 and 1 229 were measured without the Ledger in the studio, which now installs it (studio f54ba3c); the interleaved runs are the comparison, and they do not differ beyond their spread. The originals' one whole reading on load is 4.8 to 5.7 ms of rendering and 14.4 to 16.4 of reading, as before.

### The edit equalities

Each edit by a transaction on the view; the chain and the loop awaited; every page's words, margin boxes and flow read, each page's chrome state (`start`, `end`, `block`, counters, strings, running), the originals' reading (the index's bases and total, the counter log, the strings and running elements assigned, the page sites, every entry's `from` and `to` as word addresses) and the delivered reads; then `invalidate()`, which now renders the originals whole, and the same read off the view's fresh fill; the two compared. At 692392d:

| Document | Edits | Pages equal | Page states equal | Originals' reading | Delivered reads |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `fixtures/chrome`, normal and `--bare` | `Strings` retitled; `Folios` to `Folia`; `Folia` to `Folios, retitled` (a 17th page); a key on page 3; the first paragraph of page 2 deleted; two paragraphs pasted at the top level; a character at the very start; one at the very end | 16, 16, 17, 17, 16, 16, 16, 16 of as many | all | the same, every edit | the same, every edit |
| `test/specimen.md` (reach 2) | a key on page 2; a paragraph deleted; two pasted; the start; the end | 9 of 9 each | all | the same | the same |
| `fixtures/running` | the same five | 13, 13, 15, 15, 15 | all | the same | the same |
| the showcase (reach 2) | a key on page 3; a paragraph deleted; two pasted; the start; the end | 74 of 74 each | all | the same | the same |
| the showcase, after five keystrokes (`--keys`) | each of the 12 harness runs above, with and without the Ledger and under reach 0 | 74 of 74 | 74 of 74 | the same | the same |

On the chrome fixture the retitles behave as round 2 recorded (`Strings`: page 3 refilled, pages 4 and 5 redrawn; `Folia`: page 1 refilled, page 2 dirtied for its flow site; `Folios, retitled`: pages 1 to 17 and a second run of pages 1 and 2); a character at the start, inside the running element, redraws the 9 pages that place it.

### Found on the way: a page kept the copy of a running element an edit changed

The chrome fixture's first equality run, before the fix: a character typed at the start, inside the running element, left `The Chrome fixture` in `@top-left` on pages 2 to 9, which the edit did not refill, where the fresh fill shows `xThe Chrome fixture`: 8 of 16 pages different, every page state equal. A page's running elements are indices into the state's list, an edit inside one keeps its index, and `rechrome` and `drawChrome` compared the indices only. Present before the round too. A page now compares the elements it places (`runningPlaced`): by identity alone, retitling `Strings` redrew 9 pages without a refill where 2 had moved (the second mark stands in the section the retitle rendered again, a new object of the same content); by identity or as equal nodes (`sameElements`), 2.

### Parity

`node scripts/specimen.mjs`, at 65f2de8 (692392d changed only which pages an edit redraws, and the chrome fixture and `fixtures/running` were run again at it, the same); every row is the same under `--bare`:

| Document | CLI | View | Same | First difference | Margin boxes | State | Reads the same | Runs, CLI / view |
| :--- | ---: | ---: | ---: | :--- | :--- | :--- | :--- | :--- |
| `test/specimen.md` | 9 | 9 | 9 | none | 9 of 9 | none differs | 15 of 15 | 1 / 1 |
| `fixtures/flow` | 26 | 26 | 26 | none | 26 of 26 | none differs | none declared | no loop |
| `fixtures/tall` | 10 | 10 | 10 | none | 10 of 10 | none differs | none declared | no loop |
| `fixtures/end-gap` | 6 | 6 | 6 | none | 6 of 6 | none differs | none declared | no loop |
| `fixtures/row` | 13 | 13 | 13 | none | 13 of 13 | none differs | none declared | no loop |
| `fixtures/multicol` | 6 | 6 | 6 | none | 6 of 6 | none differs | none declared | no loop |
| `fixtures/running` | 13 | 13 | 13 | none | 13 of 13 | none differs | none declared | no loop |
| `fixtures/facsimile` | 5 | 5 | 5 | none | 5 of 5 | none differs | none declared | no loop |
| `fixtures/dressing` | 11 | 11 | 11 | none | 11 of 11 | none differs | none declared | no loop |
| `fixtures/chrome` | 16 | 16 | 16 | none | 16 of 16 | none differs | 1 of 1 (`p. 15`) | 2 / 2 |
| the showcase | 76 | 74 | 53 | page 50 | 65 of 76, first page 18 | first page 50 | 23 of 28 | 2 / 2 |

Every row is round 2's. The view's console has one line more where the reach is 2, the originals' (`prosemirror-beltype: a stylesheet uses :has(), …`), once per page load; the two meant warnings on the showcase are the same on both sides.

### The studio, through its witness

The studio was not edited. A dev server of its own on a free port, with a Vite cache directory of its own (below), at 692392d:

| Demo | Old path | View | Same | First difference | As last recorded |
| :--- | ---: | ---: | ---: | :--- | :--- |
| showcase | 76 | 74 | 43 | page 13 | yes |
| showcase, `schema=studio` | 76 | 76 | 52 | page 29 | yes |
| quiet-press | 30 | 30 | 30 | none | yes |
| report | 11 | 11 | 11 | none | yes |
| manuale | 7 | 7 | 6 | page 5 | yes |
| facsimile | 6 | 6 | 6 | none | yes |
| bolletta | 3 | 3 | 2 | page 3 | yes |

A second dev server of the studio, for the "before", resolved `prosemirror-beltype` to main's copy through a configuration of its own (the studio's merged with an alias); both were given cache directories outside the studio after the first start of the "before" server re-optimized the studio's shared `node_modules/.vite` and the other server answered 504 (`Outdated Optimize Dep`) until restarted.

### Not done

- **The memo kept on the studio's demos**: every one has reach 2, so a keystroke there keeps no part; the door is the engine's.
- **A part per box below the top level**: the engine's question (filed).
- **`--reach 0` as a reading**: measured only; the round does not read the reach otherwise than the engine does.
- **A browser test of the placement**: pinned in node over a hand-made DOM, and measured by the harness's equalities.

## The reach of a whole box

Written 2026-10-25, on the branch `round/the-reach-of-a-whole-box`, for docs/found.md's three engine entries of the round before (the reach per box, the index part of a moved block, the running elements' walk), which BelType closed in its merge 8c6d8777 (its CHANGELOG of 2026-10-25, *the reach is read for a unit of replacement*). Run it again with `npm test` (45 tests); `node scripts/specimen.mjs <absolute path>` and the same with `--bare` on each fixture under `fixtures/` and on `./test/specimen.md`; `--edits 'retitle:Strings=>Strings, retitled;retitle:Folios=>Folia;retitle:Folia=>Folios, retitled;key:3;delete:2;paste;enter;start;end'` on `fixtures/chrome/chrome.md`, `--edits 'key:2;delete:2;paste;enter;start;end'` on the specimen and `fixtures/running/running.md`, `--edits 'key:3;delete:3;paste;enter;start;end'` on the studio's `demos/showcase/index.html`, each normal and `--bare`, for the edit equalities; `--keys 3:5` on the showcase, with and without `--no-ledger`, for the cost; the studio's `node scripts/fragview-pages.mjs --demo <demo> --url <its url> --out <a file outside the studio>` on its six demos, and a copy of its `scripts/fragview-keys.mjs` that takes `--url` and `--view-only` for the real keys. The "before" is main at 8b75207, run from a copy of it (`git archive 8b75207`, its `node_modules` a link to this checkout's, its Vite cache a directory of its own), so no branch was checked out; both sides reach the engine at 8c6d8777, so the before is the engine's new door unused.

### The door adopted

`Originals.of` settles the memo once per state with the unit this host replaces, a whole top-level box: `memo.settle(topLevelReach(document, boxes, memo.boxes), boxes)`, `boxes` the holder's element children in order (running elements and fixed boxes among them, as the engine's header asks) and `memo.boxes` the boxes the memo was settled with last, which the engine keeps. The engine reads off the two lists what an edit inserted, removed, moved or replaced, so this package's own scan for structural pseudo-classes and `place()`'s `shaped` flag, which forgot every part where an edit changed the holder's shape and a sheet held `:nth-child` or its kin, are dropped: the engine answers the structural forms per change, the first forms 1 and the last and only forms 2. `runningBoxes(stand, keep)` takes the memo's door, so a running element is found again only in a top-level box the edit replaced. `forget` still clears the memo, which empties `memo.boxes`, so the next state is read whole and no structural answer is stale. The console line stays where the reach is 2, in the engine's `settledMemo` wording; no document measured here reaches 2 now, so it is no longer printed anywhere. `--reach N` stays, a measurement: it puts N in place of the engine's reading, and the reading's arguments are ignored.

### The reach each document answers, and what the memo keeps

`topLevelReach` over the holder's children, as the harness prints it (`reachOf`, also as after a change of shape, the first box new) and as the studio's view reads it (the originals' timings), against `sheetReach`, the reading for `patchBox`'s unit, which the round before used:

| Document | `sheetReach` | `topLevelReach` | After a change of shape |
| :--- | ---: | ---: | :--- |
| every fixture under `fixtures/` | 0, the flow fixture 2 | 0 | 0 |
| `test/specimen.md` | 2 | 0 | 0 |
| the showcase, in BelType's page | 2 | 0 | 0; 1 once a top-level box is a `p` (below) |
| the studio's quiet press | 2 | 1 | 1 |
| the studio's report, manuale, facsimile, bolletta and showcase | 2 | 0 | 0 |

The quiet press reads 1 through one rule of its own sheet, `:is(header, h2, h3, figure, blockquote, ul, ol, table, section) > p:first-child, :is(h2, h3, figure, blockquote, ul, ol, table, header) + p`: the engine reads a `+` whose left side can be a top-level box, and takes the pseudo-classes out of that side before matching it, so `:is(h2, …)` is read as `*` and matches each of the quiet press's eight top-level boxes (`section.titlepage`, `nav.contents` and six `article.chapter`), none of them an `h2` and none followed by a top-level `p`. Conservative, as the engine's header says; filed in docs/found.md. On the showcase in the harness, the edits that put a top-level paragraph in (a paste, an Enter at the end of the leading running element) make the showcase read 1 from then on, through `p + p` and its kin in its sheets: two top-level paragraphs now stand beside each other, so that reading is the true one.

What the memo keeps (`memo.tally`, per walk, kept and read, both the originals' walks and the loop's, so a box asked twice in one state is counted twice):

| Edit | Reach | Nodes rendered, kept | `running` | `index` | `ops` | `sites` | `ops:marked` |
| :--- | ---: | :--- | :--- | :--- | :--- | :--- | :--- |
| the showcase in the harness, a key on page 3 | 0 | 1, 13 | 13, 1 | 25, 1 | 12, 1 | 178, 1 | 12, 1 |
| the studio's showcase, a key a third in | 0 | 1, 28 | 13, 1 | 25, 1 | 12, 1 | 178, 1 | 12, 1 |
| the studio's report, a key a third in | 0 | 1, 19 | 8, 1 | 15, 1 | 7, 1 | 80, 1 | 7, 1 |
| the studio's manuale, a key a third in | 0 | 1, 11 | 4, 1 | 7, 1 | 3, 1 | 59, 1 | 3, 1 |
| the studio's facsimile, a key a third in | 0 | 1, 6 | 2, 1 | 2, 1 | 2, 1 | none | none |
| the studio's bolletta, a key a third in | 0 | 1, 10 | 4, 1 | 9, 1 | 4, 1 | 4, 1 | none |
| the studio's bolletta, Enter there (a top-level paragraph split) | 0 | 2, 10 | 4, 2 | 10, 2 | 4, 2 | 4, 2 | none |
| the studio's quiet press, a key a third in (the fifth of eight boxes) | 1 | 1, 17 | 4, 4 | 12, 4 | 4, 4 | 4, 4 | none |
| the chrome fixture, two paragraphs pasted at the top level | 0 | 2, 2 | 2, 2 | 4, 2 | 1, 2 | 24, 2 | none |
| the chrome fixture, Enter at the end of its running element (a new top-level paragraph) | 0 | 2, 3 | 3, 2 | 7, 1 | 3, 1 | 31, 2 | none |
| the showcase, two paragraphs pasted after its first top-level box | 1 | 2, 14 | 1, 15 | 15, 15 | 0, 15 | 190, 15 | 0, 15 |
| the showcase, a key at the very end | 1 | 1, 16 | 16, 1 | 31, 1 | 15, 1 | 217, 1 | 15, 1 |
| the showcase, a key at the very start | 1 | 1, 16 | 0, 17 | 16, 16 | 0, 16 | 201, 17 | 0, 16 |

At 0 a keystroke reads one top-level box again and keeps every other; a paste at the top level reads only the boxes it put in, and a moved box keeps its index part (the round before read 3 index parts on the chrome fixture's paste, of which 2 new; now 2, both new, the engine's rider). At 1 the memo keeps the boxes before the earliest change and reads the ones from it on: the showcase's paste keeps its first box and reads the 15 after it, a key at its end keeps 16 boxes and reads 1, a key at its start (inside its first top-level box, the running element) reads everything. On the studio's showcase the memo now keeps the parts of 13 of its 14 top-level boxes per keystroke, where it kept none.

### Before and after, per keystroke

The showcase in the harness, BelType's own page, five characters typed on page 3, each awaited until the chain is quiet and the loop settled; before (8b75207) and after (94609a3) interleaved, three runs each, with the Ledger. Milliseconds, the range over 15 keystrokes:

| | Before | After |
| :--- | :--- | :--- |
| The chain quiet after the dispatch | 22.3 to 30.4 (30.4, 23.5, 24.7, 26.2, 22.7; 26.7, 23.9, 23.3, 23.3, 22.3; 26.9, 23.9, 23.6, 23.0, 22.9) | 7.6 to 12.5 (12.2, 7.8, 9.3, 8.6, 8.9; 12.5, 8.7, 10.2, 7.6, 9.7; 9.5, 8.1, 9.8, 9.9, 9.1) |
| The view's update | 18.1 to 24.0 | 4.7 to 6.7 |
| The clean pages' chrome read again | 1.9 to 2.9 | 1.8 to 2.9 |
| The originals' rendering | 0.2 to 0.4 | 0.1 to 0.3 |
| The originals' reading | 8.1 to 11.9 | 1.0 to 1.4 |
| of it, the reach | 0 to 0.2 (`sheetReach`) | 0.3 to 0.5 (`topLevelReach`) |
| of it, the intake's blocks and running elements | 1.3 to 3.8 | 0.2 to 0.4 |
| of it, the position index | 2.6 to 3.6 | 0.1 to 0.3 |
| of it, the counter log | 3.7 to 4.2 | 0.1 to 0.3 |
| The loop's start (`cicero:reads`) | 7.0 to 8.7 | 0.7 to 1.0 |
| The settle, in 1 run | 17.8 to 20.5 | 10.9 to 12.5 |
| The view's chain on load | 813, 781, 779 | 796, 796, 765 |

The round before recorded after 20.4 to 25.6 ms quiet, the reading 8.3 to 9.6 and the loop's start 7.1 to 8.9, and under `--reach 0`, its measurement of what this door would give, quiet 6.4 to 11.5 and the loop's start 0.7 to 1.0: the engine's reading gives the ceiling that measurement drew, and the reading falls further (1.0 to 1.4 ms against 1.9 to 2.4) because the running elements now keep their part. What is left of the view's update is the clean pages' chrome read again (`Chain.rechrome`, 1.8 to 2.9 ms) and the page's own fill.

Without the Ledger (`--no-ledger`, no loop), interleaved, three runs each: quiet 11.9 to 16.2 ms before (the update 8.8 to 11.1, the reading 8.0 to 10.0) and 5.1 to 8.6 ms after (the update 2.0 to 2.8, the reading 1.0 to 1.6); the chain on load 677, 687 and 686 ms before, 686, 680 and 719 after.

**In the studio, through the view.** The copy of `fragview-keys.mjs` (a real key pressed, keydown to the first frame after the chain settled), against two dev servers of the studio on free ports, one resolving this branch and one main's copy through a configuration of its own (the studio's merged with an alias), each with a Vite cache directory of its own; 10 presses of each pair at each spot, medians (min–max), before and after interleaved per demo. The time to the transaction that left the chain settled, before the frame is waited for, is beside it:

| Studio, the view | Before | After | Settled, before | Settled, after |
| :--- | :--- | :--- | :--- | :--- |
| showcase, a character a third in | 35.5 (32.9–42.2) | 31.5 (25.7–32.1) | 33.5 | 19.3 |
| showcase, Backspace a third in | 35.5 (33.7–41.7) | 32 (25.1–32.8) | 33.8 | 19.1 |
| showcase, Enter a third in | 32.6 (30.4–38.1) | 32.1 (27.5–32.2) | 30.8 | 18.7 |
| showcase, the join a third in | 33.8 (33–34.4) | 32.1 (24.9–32.9) | 31.7 | 18.9 |
| showcase, a character two thirds in | 47.5 (44.8–50.7) | 35.3 (34.4–36.3) | 45.7 | 33.5 |
| showcase, Backspace two thirds in | 46.7 (44.1–50.8) | 35.4 (34.5–36.3) | 45.1 | 33.8 |
| showcase, Enter two thirds in (4 pages refilled) | 102.7 (94.4–108.1) | 90.5 (86–97.5) | 100 | 87.7 |
| showcase, the join two thirds in (4 pages refilled) | 110 (104.5–116.4) | 98.4 (90.7–109.7) | 107 | 95.7 |
| quiet press, a character a third in | 32.8 (20.5–33.6) | 32 (18.8–33.5) | 14.3 | 13.9 |
| quiet press, Enter a third in (4 pages refilled) | 31.6 (28.8–32.6) | 30.7 (29.4–33.7) | 29.8 | 28.3 |

A character a third into the showcase is now settled in 19.3 ms and shown at the second frame, so it is bound by the frame as the quiet press is on both sides; two thirds in it is shown at the third. The round before recorded a character a third in at 36.9 ms after its round and two thirds in at 48.3; the interleaved runs above are the comparison. The quiet press keeps less (reach 1, above) and was bound by the frame already.

### The edit equalities

Each edit by a transaction on the view, with the memo in use; the chain and the loop awaited; every page's words, margin boxes and flow read, each page's chrome state, the originals' reading and the delivered reads; then `invalidate()`, which renders the originals whole and clears the memo, and the same read off the view's fresh fill; the two compared. At 94609a3, read with 24b383c's comparison (below):

| Document | Edits | Pages equal | Page states, originals' reading, delivered reads |
| :--- | :--- | :--- | :--- |
| `fixtures/chrome`, normal and `--bare` | `Strings` retitled; `Folios` to `Folia`; `Folia` to `Folios, retitled` (a 17th page); a key on page 3; the first paragraph of page 2 deleted; two paragraphs pasted at the top level; Enter at the end of the running element; a character at the very start; one at the very end | 16, 16, 17, 17, 16, 16, 16, 16, 16 of as many | the same, every edit |
| `test/specimen.md` (reach 0, was 2), normal and `--bare` | a key on page 2; a paragraph deleted; two pasted; Enter; the start; the end | 9 of 9 each | the same |
| `fixtures/running`, normal and `--bare` | the same six | 13, 13, 15, 15, 15, 15 | the same |
| the showcase (reach 0, 1 after the paste), normal and `--bare` | a key on page 3; a paragraph deleted; two pasted; Enter; the start; the end | 74 of 74 each | the same |
| the showcase, after five keystrokes (`--keys`) | each of the 12 runs above, before and after, with and without the Ledger | 74 of 74 | the same |

### Found on the way: the measurement read a page whose flow had been replaced

The first pass of the equalities gave 5 inequalities of 54 edits, each one page whose flow's generated content read empty on one side: on the chrome fixture `Folia` to `Folios, retitled` (page 2, the fresh fill) and, under `--bare`, the key on page 3 (page 2, the fresh fill); on the specimen Enter and the start (page 1, the edited side, its contents' `3`, `5`, `7` and `9` empty) and, under `--bare`, the end (page 1, the fresh fill). Each page's words, margin boxes, state, the originals' reading and the delivered reads were equal, and each coincided with the line `(the snapshot misses …)`: the elements the comparison had tagged were not in the DOM snapshot after three tries. Asked of the document, none of them was there any longer: the page's slotted flow had been replaced between the tagging and the snapshot, so the snapshot could not find them, now and then (the specimen's paste, Enter, start and end in five more runs: one clean, four with a miss). The comparison now tags the pages again and takes a new snapshot when a tag is missing, three times at most, and says each miss with how many of the missing elements the document still holds; with it every edit above is equal, and every miss in the reruns was answered at the second attempt. Not this round's code: the round before met the same miss after `invalidate()` and scrolled each page into view for it.

### Parity

`node scripts/specimen.mjs` at 94609a3; every row is the same under `--bare`, and every row is the round before's:

| Document | CLI | View | Same | First difference | Margin boxes | State | Reads the same | Runs, CLI / view |
| :--- | ---: | ---: | ---: | :--- | :--- | :--- | :--- | :--- |
| `test/specimen.md` | 9 | 9 | 9 | none | 9 of 9 | none differs | 15 of 15 | 1 / 1 |
| `fixtures/flow` | 26 | 26 | 26 | none | 26 of 26 | none differs | none declared | no loop |
| `fixtures/tall` | 10 | 10 | 10 | none | 10 of 10 | none differs | none declared | no loop |
| `fixtures/end-gap` | 6 | 6 | 6 | none | 6 of 6 | none differs | none declared | no loop |
| `fixtures/row` | 13 | 13 | 13 | none | 13 of 13 | none differs | none declared | no loop |
| `fixtures/multicol` | 6 | 6 | 6 | none | 6 of 6 | none differs | none declared | no loop |
| `fixtures/running` | 13 | 13 | 13 | none | 13 of 13 | none differs | none declared | no loop |
| `fixtures/facsimile` | 5 | 5 | 5 | none | 5 of 5 | none differs | none declared | no loop |
| `fixtures/dressing` | 11 | 11 | 11 | none | 11 of 11 | none differs | none declared | no loop |
| `fixtures/chrome` | 16 | 16 | 16 | none | 16 of 16 | none differs | 1 of 1 (`p. 15`) | 2 / 2 |
| the showcase | 76 | 74 | 53 | page 50 | 65 of 76, first page 18 | first page 50 | 23 of 28 | 2 / 2 |

The view's console no longer has the originals' line on the specimen, the flow fixture and the showcase, since none of them reaches 2.

### The studio, through its witness

The studio was not edited. `fragview-pages.mjs --url` against the dev server resolving this branch:

| Demo | Old path | View | Same | First difference | As last recorded |
| :--- | ---: | ---: | ---: | :--- | :--- |
| showcase | 76 | 74 | 43 | page 13 | yes |
| showcase, `schema=studio` | 76 | 76 | 52 | page 29 | yes |
| quiet-press | 30 | 30 | 30 | none | yes |
| report | 11 | 11 | 11 | none | yes |
| manuale | 7 | 7 | 6 | page 5 | yes |
| facsimile | 6 | 6 | 6 | none | yes |
| bolletta | 3 | 3 | 2 | page 3 | yes |

### Not done

- **A tighter reading of the quiet press's rule**: the engine's (filed).
- **A part per box below the top level**: the engine's question, still open.
- **The clean pages' chrome read again on every state** (`Chain.rechrome`, 1.8 to 2.9 ms on the showcase), now the largest piece of a keystroke's update outside the fill; not filed as a fault, named here as what is left.

## A law holder per fill

Written 2026-10-25, on the branch `round/a-holder-per-fill`, for docs/found.md's "A fill overtaken by a second transaction in the same task throws in the grab". Run it again with `npm test` (45 tests) and `node scripts/specimen.mjs --overtaken`; the studio's lines below are with its dev server on `STUDIO_SCHEMA=studio STUDIO_VIEW=fragmented` (`studio-view`, port 48822), warmed once.

### The defect

`CiceroPage.trial` wrote the law copy into one holder for the whole document, `#__prosemirror-beltype-law`, emptying and refilling it. A fill suspended at its measurement found, when it resumed, the other fill's law copy in the holder: the engine's grab read `t.blocks`, the new children, against `t.law.positions`, the old elements, and `t.law.positions.get(event.el)` was undefined.

### The case, before and after

`harness/specimen.js`' `overtaken` fills each pair of neighbouring pages of the settled chain over the one document in one task (both `fill` calls before either answers), and compares each answer with the `to` its entry holds, each page's words and size before and after, and the law holders left standing. `--overtaken` on `scripts/specimen.mjs` mounts the view on `./test/specimen.md` and runs it:

| | Pairs | Failures | Law holders left standing |
| :--- | ---: | :--- | ---: |
| `main` (826c662 and 4635b09 on it) | 8 | 6: page 3 threw `Cannot read properties of undefined (reading 'start')`; pages 1 and 2 answered 41 and 1071, the chain holding 135 and 308; page 2 answered 157 against 308; page 1 showed no words where it showed `Summary … Appendix`, page 2 `Table … Contents` where it showed `Table … Appendix` | 1 |
| the fix (e03eebc) | 8 | 0 | 0 |

### What was built

`fill` makes the fill's holder (`lawHolder(this.doc, '__prosemirror-beltype-law-N')`, `N` counting the fills that have begun), hands it down `cutAndDraw`, `cutOnce` and `trial`, and takes it out of the document in a `finally`. The trials of one fill run one after another, so the fill's holder is emptied and refilled by each as before; `cutOnce`'s `replaceChildren()` at its end stays. The `staging` holder in `show` is filled and emptied synchronously and is the same one as before.

### The studio

- The reduction of the entry, the quiet press with two `insertText('A')` in one task in the long chapter: `main`, `page errors: Cannot read properties of undefined (reading 'start')`; the fix, `page errors: none`, `chain.settled(doc)` `{"complete":true,"why":null}` and `incremental == fresh: 30 pages, visible text, margin boxes and line geometry equal page for page`.
- A fill of a released container (an insertion and `view.invalidate()` in one task, which releases every container while its fill is in flight): the view discards the answer, and `Chain.filled` stages a row only when the document is current. The fix: `incremental == fresh: 30 pages` and no page error; `main`: the same pages, the page error.
- amendments: "the pane lists the rule, dressing 1 block" passes; no page error "reading 'start'". The run is `104 of 110 checks passed`, the six that do not are not this entry's (3b the chapter extent dresses 0 and the subsection spans no page, by place matches nothing; (s3) times out, (s6) `Position undefined out of range`, the layers' sheet-order check).
- collab-undo: `collab-undo: all scenarios hold`, no page error. typing: 61 of 61 plans, 1 803 keystrokes, end `incremental == fresh: 30 pages`.

### Not done

- **The measure container**: one element per document that every fill shares across its fonts and images await; filed in docs/found.md.


## The four doors

Written 2026-10-28, on the branch `round/the-four-doors`, for docs/found.md's four engine entries still open (the forwarding slot, the intake's root, the cleared `content`, the loop's facts), which BelType closed on its `round/the-four-doors` (e04c7d0, its battery f9bb84a: 26 of 26, the pin standing; its CHANGELOG of 2026-10-28, *Four small doors for a view*). Run it again with `npm test` (45 tests, in node), and `BELTYPE_ROOT=<BelType checkout> node scripts/specimen.mjs <absolute path>`: the script spawns the CLI of the checkout `BELTYPE_ROOT` names, and this package's `node_modules/@egildo/beltype-engine-cicero` is the engine the view runs, so the two sides run one engine only when they name the same checkout. For this round both were BelType's `round/the-four-doors` worktree.

### What was dropped here

- `CiceroPage.runningPart` returns the clone; the fake forwarding slot (`Object.assign(clone, { assign() {} })`) is gone, and `setMarginBox` is handed the node.
- `Originals.of` asks the holder, `topLevelBlocks(d, holder)` and `runningBoxes(d, keep, holder)`, and imports the engine's `runningPosition`; the stand-in document and the two lines written again are gone.
- The harness no longer puts the margin boxes' `content` back: the init script in `scripts/specimen.mjs` and `restoreMarginContent` in `harness/specimen.js` are gone, and the factory is handed `window.__beltypeCicero.table`, the table the CLI's intake captured. The chrome table no longer prints the count of boxes put back.
- The `Chain`'s `run` returns `laidFacts`, one entry per row: the page values the row's page was last cut under. A `Row` carries them as `laid` (the page's `publish`).
- `scripts/specimen.mjs` reads `BELTYPE_ROOT` (default the path it hardcoded) for the CLI it spawns and the port list it reads.

### That the view ran the worktree's engine

`node_modules` of the worktree is a directory of links to the main checkout's entries, except `@egildo/beltype-engine-cicero`, which links to the BelType worktree's `packages/engine-cicero`; Vite's cache is the worktree's own `node_modules/.vite` (a directory, not a link). A throwaway script started this package's Vite, loaded `harness/specimen.js` in Chromium and listed the page's resource entries: 27 engine modules, every one under `/@fs/Users/egildo/Privata/dev/beltype/.claude/worktrees/the-four-doors/packages/engine-cicero/` (`src/reads.js` among them), none under BelType's main checkout. The CLI's side is the worktree's too: the margin boxes agree on every page with no `content` put back, which is only possible if `window.__beltypeCicero.table` exists, and it does not on `main`. The first attempt at the *before* column showed the other direction: the worktree's `originals.js` under `main`'s engine fails to load (`runningPosition` is not exported there), so the page never mounts.

### Door 1, before and after

The reads loop's runs, counted two ways: the console's `the pages settled in N runs` on each side on load, and a settle's `reads.runs` after an edit (`readsOf()`). *Before* is `main` of both repositories (the engine's `a76ec341`, this package's `1b181cf`, exported with `git archive` into a scratch directory with its own `node_modules` of links); *after* is the two worktrees. The chrome fixture, the edits of the harness's list:

| | Before | After |
| :-- | ---: | ---: |
| Load, CLI | 2 | 2 |
| Load, view | 2 | 2 |
| `Strings` retitled on page 3 | 2 runs, 3 fills (pages 3, 2, 3) | 1 run, 1 fill (page 3) |
| `Folios` retitled to `Folia` | 1 | 1 |
| `Folia` retitled to `Folios, retitled` | 2 | 1 |
| `key:3` | 1 | 1 |
| `delete:2` | 2, 21 fills | 1, 16 fills |
| `paste`, `enter`, `start`, `end` | 1 each | 1 each |
| Fills in the nine edits | 53 | 44 |

The load stays at two on both sides: the first run is laid under no page values, as on the CLI. The cuts did not move: every edit below equals its fresh fill.

### The harness, fixture by fixture

First difference *none* on each of the nine fixtures under `fixtures/` (chrome, dressing, end-gap, facsimile, flow, multicol, row, running, tall) and on `./test/specimen.md`, normal and `--bare`, and every margin box the same where printed. The edits, each normal and `--bare`, each edit equal to the fresh fill on every page and every page's state, the originals' reading and the delivered reads (66 of 66 edit blocks):

| Target | Edits | Pages | Result |
| :-- | :-- | ---: | :-- |
| `fixtures/chrome/chrome.md` | the three retitles, `key:3`, `delete:2`, `paste`, `enter`, `start`, `end` | 16 | equal, 9 of 9, both |
| `./test/specimen.md` | `key:2`, `delete:2`, `paste`, `enter`, `start`, `end` | 9 | equal, 6 of 6, both |
| `fixtures/running/running.md` | the same six | 13 | equal, 6 of 6, both |
| the studio's quiet press | `key:3`, `delete:3`, `paste`, `enter`, `start`, `end` | 30 | equal, 6 of 6, both |
| the studio's showcase | the same six | 74 | equal, 6 of 6, both |

The showcase's first difference against the CLI is page 50, as recorded above (76 pages under the CLI, 74 under the view); it is the repeated header's, not this round's.

### Not done

- The other doors of docs/found.md (the six closures in `src/turn.js`, `presentTree`, the part's unit) are out of this round's scope. (The closures: "The driver's doors", below.)
- Door 1 was counted before and after on the chrome fixture only, where the finding was seen. After the round the specimen settles in one run on both sides; it was not counted before, and the other fixtures read nothing the loop settles.
- The studio itself was not run; it picks the doors up when both repositories' mains have them.


## The driver's doors

Written 2026-10-29, on the branch `round/the-driver-doors`, for the six closures of the driver's that this package wrote again (the lists above, "Doors missing" and "Closures of the driver's, written again"), which BelType opened on its `round/the-driver-doors` (engine commit 9934b8c2, its battery 17d5a495: 26 of 26 in 10.6 minutes, `--check-pin` ok; its CHANGELOG of 2026-10-28, *The driver's closures are doors*). Run it again as the four doors' section says, with `BELTYPE_ROOT` naming the BelType worktree and `node_modules/@egildo/beltype-engine-cicero` linked to its `packages/engine-cicero`, and give the script an absolute path for a fixture (it spawns the CLI in BelType's directory, where `./fixtures/...` does not exist). `npm test` is 45 of 45.

### What was dropped here, and what was kept

Each copy was read against its original line by line first. None was drifted on purpose except where said.

| The copy here | Its original | Identical? | Now |
| :-- | :-- | :-- | :-- |
| `placeAt` in `src/turn.js` | the closure in `paginateOnce` | the same two lines | dropped; `turn.js` imports the engine's `placeAt` (`positions.js`) and `src/index.js` no longer exports it, since nothing here or in the studio asked it |
| the descent in `CiceroPage.nameAt` | the closure `nameAt` | the same walk: first in-flow block child, out-of-flow skipped, then `effectivePageName`. It differs in one read: whether a run of words stands before the child. The driver compares `index.wordsBefore` over its position index; a trial's law copy has no word index, so this package tests `/\S/` over the text before the child (`textBefore`, fixed boxes skipped) | the descent dropped; `pageNameDownFrom(el, { styleOf, runBefore })` is called with the text read as `runBefore`. The guard (`inside`, the root) stays here |
| the loop and the test in `fill` | `inFlowBottom`'s loop and `fits` in `paginateOnce` | the same arithmetic; the original reads the top-level item a box stands in to say whether the box is parallel, this package the box's own source, which differs only for a block item in a top-level inline container that is itself out of flow | both dropped; `processionBottoms` and `fitsPage` are called, `parallel` being this package's reading |
| the gap loop in `CiceroPage.spentLead` | `gapAbove`, inside the closure `spentLeadOf` | the same sum of how far each child stands below its container's content edge, without the branch for a repeated header's copy (`artifact`) that this package's pages never hold | the loop dropped; the engine's `gapAbove(box, report, win)` is called. The places the lead is read at, and the quarter pixel, stay here (the driver reads its cursor, this package a shell and a row's pieces) |
| `pinTracks` and `pinTable` in `src/shells.js` | `pinTracks` and `pinTable` in `fragments.js` | the same writes, but the original reads a row and a cell by computed display (`sourceStyle`), which this package's slice cannot be asked, and handles a header lifted into the caption, which it never holds | `pinTable` dropped; `pinTracks` keeps its own loop, which finds a box by the position of its node, and calls the engine's `pinTrack(el, t, byTag)` with a display function by tag |
| `sealedEnd` (the bound that never cuts inside a box `neverCutInside` names) | `forcingIndexOf`'s `sealedBy` and `boundAt` | **Not the same, and kept.** The driver's rule is an index over the whole intake (each event records the outermost sealing box it stands in) that `boundAt` asks of a cursor; there is no function of a box chain to lift. This package asks it of one trial's end position and finds the outermost sealed ancestor of it. The predicate is the engine's (`neverCutInside`, imported, as the record said) and the walk differs by representation: the driver then moves to the first in-flow box after the sealed subtree, skipping a float; this package ends the trial at the position after the sealed box | kept; its comment now says why. A change to share it would rewrite the driver's walk, which is not additive |

`src/turn.js` is 188 lines (196), `src/shells.js` 242 (265), `src/cicero-page.js` 883 (897). `test/turn.test.js` loses the one assertion of `placeAt`, which is the engine's to pin (`test/driver-doors.test.js` in BelType); the count of tests is the same, 45.

### That the view ran the worktree's engine

`node_modules` of this worktree is a directory of links to the main checkout's entries, except `@egildo/beltype-engine-cicero`, which links to the BelType worktree's `packages/engine-cicero`; Vite's cache is the worktree's own `node_modules/.vite`. A throwaway script started this package's Vite, loaded `harness/specimen.js` in Chromium after the CLI's round and listed the page's resource entries: 27 engine modules, every one under `/@fs/Users/egildo/Privata/dev/beltype/.claude/worktrees/the-driver-doors/packages/engine-cicero/` (`driver.js`, `fragments.js`, `positions.js`, `stonehand.js` and `reads.js` among them), none from BelType's main checkout. The page also mounts only if the new exports exist, since `cicero-page.js` imports `gapAbove` and `pageNameDownFrom` from `driver.js` by name.

### The harness, fixture by fixture

First difference *none* on each of the nine fixtures under `fixtures/` and on `./test/specimen.md`, normal and `--bare`: chrome 16 pages, dressing 11, end-gap 6, facsimile 5, flow 26, multicol 6, row 13, running 13, tall 10, specimen 9, the same on both sides. The edits, each normal and `--bare`, each edit equal to the fresh fill on every page and every page's state:

| Target | Edits | Pages | Result |
| :-- | :-- | ---: | :-- |
| `fixtures/chrome/chrome.md` | the three retitles, `key:3`, `delete:2`, `paste`, `enter`, `start`, `end` | 16 | equal, 9 of 9, both |
| `./test/specimen.md` | `key:2`, `delete:2`, `paste`, `enter`, `start`, `end` | 9 | equal, 6 of 6, both (see below) |
| `fixtures/running/running.md` | the same six | 13 | equal, 6 of 6, both |
| the studio's quiet press | `key:3`, `delete:3`, `paste`, `enter`, `start`, `end` | 30 | equal, 6 of 6, both |
| the studio's showcase | the same six | 74 | equal, 6 of 6, both |

The specimen's first normal run read the `enter` edit as 8 of 9 pages, page 1's flow text empty, with the harness logging `the snapshot misses 4 tagged element(s) on the view side` three times: the DOM snapshot flake that `scripts/specimen.mjs` already names (page 1 of the specimen, 2026-10-25). The words and the page's state agreed. Three more runs of the same edits read 6 of 6 at 9 of 9 each.

### The showcase

The showcase's difference from the CLI is what it was: 76 pages under the CLI against 74 under the view, first difference page 50, normal and `--bare`. Run before and after in one sitting (*before* the two mains, this package's exported with `git archive` into a scratch directory with links, BelType's checkout as the CLI and the engine; *after* the two worktrees), the per-page table of 228 rows is identical, and the six edits are equal to the fresh fill on 74 of 74 pages in both. The copies decide cuts, and nothing the showcase draws moved.

### Not done

- `sealedEnd` is kept (above), and `presentTree`, the repeated header's one function and the part's unit are other doors, not this round's.
- The studio itself was not run; it picks the doors up when both repositories' mains have them.
- The branch was cut from `ae6e9d5`; `main` has since taken two commits that touch `docs/found.md` only.

# The page answers how far it read

The integration review of 2026-11-04 found that a page's cut reads more than the first word after it, while the view dirtied the page only for that word. Shortening the tail of a divided paragraph left the page before it with the old cut and a one-line widow on the next page, until something else dirtied it. `prosemirror-fragview` now takes a fill's `reach`, and this round makes `CiceroPage` answer it.

## The rule

*The Cast-off bounds the feed* already states what a verdict depends on: every box that can stand on the page, and the first in-flow box that cannot. So `reachOf` asks the engine's `firstBelowTheEdge` for that box and answers the end of its first textblock, because the box's interior moves nothing above it. Where the box stands inside something whose layout reads its whole interior (`neverCutInside`), the whole of that ancestor counts. A feed that holds no such box answers its own bound: the forced event, or null at the document's end.

The whole trial would also be a correct answer, but the trial runs about a page past the cut, so nearly every key would refill two pages. This answer costs a second fill only for a key in the divided paragraph's tail or in the first textblock after it.

## The numbers

The flow fixture's tail (`tail:1`), with `prosemirror-fragview` at e005070, agreeing with a fresh fill:

| | Pages agreeing | Fills |
| :--- | :--- | :--- |
| Before this round | 23 of 26 | 2 (pages 2, 3) |
| After | 26 of 26 | 2 (pages 1, 2) |

The controls on the same run: `beyond:1`, a key in the textblock after the one the page reads, refills only its own page; `key:3` is one fill, as before.

Single edits, each on a fresh mount, this round with fragview e005070 against the pin a4ac0a5:

| Fixture | Edit | Pin | This round |
| :--- | :--- | :--- | :--- |
| `end-gap` | `tail:1` | 0 of 6 | 4 of 6 |
| `end-gap` | `past:1` | 6 of 6 | 6 of 6 |
| `end-gap` | `delete:2` | 4 of 6 | 4 of 6 |
| `row` | `tail:1` | 11 of 13 | 13 of 13 |
| `row` | `past:1` | 13 of 13 | 13 of 13 |
| `row` | `delete:2` | 11 of 13 | 11 of 13 |
| `tall` | `tail:1` | 2 of 10 | 4 of 10 |
| `tall` | `past:1` | 10 of 10 | 10 of 10 |
| `tall` | `delete:2` | 8 of 10 | 8 of 10 |

No edit got worse. What is left on those three fixtures is a page that begins with a shell or row pieces, filed in found.md. The chained runs over the nine fixtures and the specimen show the same faults on `tall`, `end-gap` and `row`, and every edit on the other fixtures agrees with a fresh fill. `tail`, `past` and `beyond` find no divided paragraph on `facsimile` and `multicol`. `enter` stops the chained run on seven fixtures, which have no top-level textblock to press it in, so `enter` and the `end` after it ran only on `chrome`, `running` and the specimen. `npm test` 45 of 45.

## Not done

The pin stays at a4ac0a5 until fragview is pushed, so a checkout of this package does not see `reach` take effect yet; these runs swapped fragview into `node_modules` by hand. `firstBelowTheEdge` comes from `@beltype/cicero/internal/stonehand`, since the `fragmentation` face does not export it: a door owed. Late truth still dirties only its own page.

# A hint is a value, relative to its cut

Two faults the integration review named, and that the `tail` edit showed: the ripple stopped at an equal `to` though the next page had been cut under another hint, and a shell's or row's positions were absolute, so an edit before them made a page drop its hint as if it were left for another slice.

## The fix

The view (`prosemirror-fragview`) compares a fill's hint with the last one, by its JSON, and fills the next fragment when it moved. This package's hint holds its positions relative to the cut (`carriedHint`), and a page reads them at its own `from` (`startFrom`), which replaces the guard `hint.at === from`. Relative is what makes the view's comparison mean something: an absolute position changes with every shift.

The shift is uniform because the page before is clean: every position a hint carries lies inside what that page read, so with `reach` a change to any of them would have dirtied it. A page fills only after the pages before it, so the page before is clean when the hint is read.

## The numbers

Pages agreeing with a fresh fill, with fragview's comparison in both columns:

| Fixture | Edit | Absolute hints | Relative hints |
| :--- | :--- | :--- | :--- |
| `row` | `carried:1` | 5 of 13 | 13 of 13 |
| `row` | `carried:5` | 5 of 13 | 13 of 13 |
| `tall` | `carried:1` | 5 of 11 | 10 of 10 |
| `tall` | `carried:5` | 5 of 12 | 10 of 10 |
| `end-gap` | `carried:1` | 2 of 6 | 6 of 6 |
| `end-gap` | `carried:5` | 4 of 6 | 6 of 6 |

`carried` types on page one and dirties a page that begins with a shell or row pieces in one transaction. One transaction, because the comparison's fresh fill after each edit renews every hint: **a chained `--edits` list is not cumulative**, and no chain of edits can show a fault that needs two edits in a row with no fill between. This hid the fault through the first three tries at a red case, and the harness's other chains have the same limit.

Against the pin a4ac0a5, the cases of the last section, each on a fresh mount:

| Fixture | Edit | Pin | Now |
| :--- | :--- | :--- | :--- |
| `end-gap` | `tail:1` | 0 of 6 | 6 of 6 |
| `end-gap` | `delete:2` | 4 of 6 | 5 of 5 |
| `row` | `tail:1` | 11 of 13 | 13 of 13 |
| `row` | `delete:2` | 11 of 13 | 13 of 13 |
| `tall` | `tail:1` | 2 of 10 | 9 of 9 |
| `tall` | `delete:2` | 8 of 10 | 9 of 9 |

A chain of ten edits (`start;key:2;key:3;key:4;end;delete:2;key:2;end;paste;key:3`) agrees on every page of all nine fixtures, under `--strict`. The specimen with `key:3;delete:2;paste;enter;start;end` gave 9 of 9 on all six edits in three runs of four; the fourth had one edit at 8 of 9, the harness's known snapshot flake, not traced further. `npm test` 47 of 47.

## Not done

A page still answers one range of positions, so a key in a page's painted shell dirties by `reach` and not by what it shows (the review's finding on shells and row cuts). The pin stays at a4ac0a5 until fragview is pushed.

# The silent faults

The integration review's faults in this package that give a wrong page or a wrong document with no sign of it. Each was seen failing first, on the old code, except the bounded feed, which no fixture reaches.

## Spaces

Typing `word`, two spaces, `next` at a paragraph's end left two U+00A0 in the saved document and bound the words. Only a lone U+00A0 was demoted, so a run stayed. A run that stood in for spaces at a line's edge now alternates when ink lands after it, from a space after ink: `word`, U+0020, U+00A0, `next`, as the same text inserted at once gives. Whether the plugin should write into the document at all stays Egildo's ruling.

## A fill that throws

The rejected fill left its entry dirty and the chain stopped there. `CiceroPage.failSafe` now shows the node at the page's start unmeasured and unclipped and answers past it, with the account's `kind` set to `failed`. `chain.settled(doc)` answers incomplete, naming the page, until the page fills. A host must not print while it is so.

`fixtures/flow`, `--edits throw:3`, whose page 3 throws on every fill:

| | Settled | Fills |
| :--- | :--- | :--- |
| Before | no, after 119 723 ms | pages 2, 3, 3 |
| After | yes, 11 ms | pages 2, 3, 4, 5, 6, 7 |

The fragmented view itself still stops at a fill that rejects: this package's page no longer rejects. The facsimile intake still reads the whole host document, so one PDF with no alt fails every page, each now showing one node. Whether the editor warns there and refuses only at print is Egildo's ruling, and so are timeouts on the image and font waits.

## What the foot cuts off

`clippedBy` compares the shown tree's bottom with the flow's foot after `show()`, which catches the shown tree standing taller than the trial, whatever the cause. `parallelBelow` reads a float or absolute box that starts on the page and crosses the cut, which this page does not carry. A page says so once and keeps `clipped` in its account. A page that ends in, or begins with, a shell or a row is cut there on purpose and is not asked. Nothing lowers the cut: this only stops the loss being silent.

`fixtures/clipped`, a float 200 mm tall and a rule scoped to the view's own host:

| Page | `flow` | `parallel` |
| ---: | ---: | ---: |
| 2 | 0 | 455 |
| 3 | 108 | 0 |
| 4 | 267 | 0 |

On the other nine fixtures and the specimen, `clipped` never fired. The first reading did fire on a node put away, whose rect is all zeros and whose bottom reads below a page scrolled above the viewport, so a node with no height is skipped.

## The rest

The bounded feed that decides nothing takes the node at the page's start whole, with a warning. `endsNowhere` is tested alone; no fixture reaches the branch. The running copies are `inert`, `contenteditable="false"` and `spellcheck="false"`: on `fixtures/running`, 26 of 26. The Ledger reattaches when `setProps` makes a new chain. `Chain.settles` and `Originals.timings` keep 64 records, the settle record drops its document, and the per-state element count is gone.

## The numbers

Each fixture under `--strict` with `start;key:2;delete:2;end;paste`, and the specimen with `key:3;delete:2;paste;enter;start;end`: every edit agrees with a fresh fill. Forty keys on the flow fixture's page 3, median over two runs each: 5.2 and 6.3 ms now, 6.5 and 6.7 ms before, so the checks cost nothing measurable. `npm test` 51 of 51.

## Not done

The cut is not lowered and a float is not carried. Two paginated editors in one document still share a holder, which waits on a ruling. The measure container is still one per document, for the Cicero round. `user-select: none` on the bands and the margin cells is the engine's.

# The guard: the words of two hosts' pages

The integration review of 2026-11-04 found that the PDF comes from a second pagination nobody compares with the editor's pages. `wordsOf`, the reader the harness already used on both sides, moved into the package as `src/compare.js`, beside `firstDifference`, which names the first page where two hosts' words part. A host calls them before it writes a PDF, and what it does with a difference is its own. No host calls them yet: the studio takes this package from npm. Since 2026-11-07 the harness fails on them: a default run of `scripts/specimen.mjs` exits 1 when the guard names a page, except the two recorded allowances in its `ALLOWED` list, `multicol` page 3 (the CLI's first glossary slice measures 9.59 px short, 174 words to the view's 170) and `clipped` page 3 (the fixture's rule scoped to the view's host). Before it, both read their difference and exited 0, and the per-page table called multicol's page 3 the same, since it reads only the first and last word. With the `multicol` entry taken out, the run exits 1. The specimen and the other eight fixtures exit 0.

`scripts/specimen.mjs` now prints the guard's line. On the showcase it reads 74 pages against 76, first difference on page 50, which is the per-page table's answer. On `fixtures/clipped` it reads 7 against 7, first difference on page 3.

Running it found a fault of this package's own. `clippedBy` computed the foot from the margin and the used height and left out the lead, so it warned on 43 of the showcase's 74 pages, on words that no page had lost. It now reads the flow box's bottom, and the showcase warns on three: page 49, a float crossing the cut (80 px of the flow, 91 of a parallel flow); page 52, a table's foot (11 px); and page 62, a `<pre>` (9 px). Those three were not traced further.

# The measurement leaves the monorepo

2026-11-07. `scripts/specimen.mjs` needed a BelType checkout's dev server for its page, and the old studio's checkout for its schema. BelType's Codeberg command line prints finished HTML and compiles no Markdown, so the fixtures were frozen once as finished HTML, under the sheets and fonts the old command line put beneath them, and the script now serves them itself with the engine's head.

Every fixture was run on the new path against what the old command line cut it to:

| Fixture | Pages, old | Pages, new | The guard, view against root |
| :--- | ---: | ---: | :--- |
| chrome | 16 | 16 | every page the same |
| clipped | 7 | 7 | first difference on page 3, as recorded above |
| dressing | 11 | 11 | every page the same |
| end-gap | 6 | 6 | every page the same |
| facsimile | 5 | 5 | every page the same |
| flow | 26 | 26 | every page the same |
| multicol | 6 | 6 | first difference on page 3 |
| row | 13 | 13 | every page the same |
| running | 13 | 13 | every page the same |
| tall | 10 | 10 | every page the same |
| specimen | 9 | 9 | every page the same |

Multicol's difference is not this round's. On the old path too, its page 3 holds 174 words at the root and 170 in the view, with the same first and last word. It is the sliced two-column list.

Only the page counts were compared with the old path, and multicol's words. The root on the old path was the monorepo's legacy Cicero, and here it is the pinned `@beltype/cicero`, the same copy the view runs. These runs set `FRAGVIEW` to a checkout of fragview's `main`, since the pin then stood before `prosemirror-fragview/schema-generic`; it has moved since.

On the new path, `--edits` on `fixtures/chrome` and `--bare` on `fixtures/specimen` hold every page the same. `--overtaken` on `fixtures/flow` reports 42 failures over 25 pairs and exits 1, the same output on the old path with the same fragview checkout, so it is not this round's. Traced the same day: the 42 failures are not fragview's either. They are Cicero 0.1.6's measure container, one per document, which two fills in flight share; under Cicero `main`, which gives each measure context its own container (20aa979, unreleased), the case gives 0 over 25 with either fragview (`found.md`, "The measure container is one element for every fill of a document").

# The settle starts cold where the driver does

2026-11-07. A first fill, a restored state and `invalidate()` settled warm, from whatever tables the Ledger held, where the engine's driver goes warm only on a resume (`opts.prior && opts.dirtyAt`). So the editor could land on other page numbers than a reopen or the command line. `Chain.settle` now passes the warm tables only when the settle has no `reason`, which is an incremental one; a settle that ended incomplete writes nothing into the Ledger; and `Originals.forget()` blanks the total, which a page publishes as `pages T`. `test/settle.test.js` restores a Ledger whose page number is `"99"` and records every sheet the settle delivers: before the fix the restored page number was delivered before the first layout, and now none is, and the restored chain's tables equal a first fill's.

## Not done

This also makes the harness's `invalidate()` reference cold: a comparison of an edited chain with its fresh fill after `invalidate()` now compares with a settle that started from the reservations, not from the edited chain's tables. No fixture was run on it here.

# The safety net renders under its own guard

2026-11-07. Where a node's `toDOM` throws, the page's safety net threw too: `failSafe` rendered the node again outside any guard, inside the fill's `catch`, so `Chain.failed` was skipped, the chain's `inflight` stayed up and `settled()` never answered. The harness's `throw` stubs `cutAndDraw`, so the render never threw there. `failSafe` now renders in a `try`, shows the page empty where the rendering throws and answers past the node, and the fill calls `Chain.failed` in a `finally`. `test/settle.test.js` makes page 2's rendering throw: before the fix `settled()` gave no answer in five seconds, and now it answers `{ complete: false, why: "page 2's fill threw: toDOM threw" }`, the last entry runs to the end and the Ledger keeps its tables. The harness's new edit `throw-render:2` on `fixtures/specimen` settles incomplete with that reason over 11 pages, two of them empty, against the fresh fill's 9; a `key:1` after it agrees with the fresh fill on 9 of 9.
