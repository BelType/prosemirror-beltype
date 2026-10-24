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

- **`placeAt`** (`driver.js`, a closure inside `paginateOnce`): two lines, written again in `turn.js`. Opening: export it from `positions.js`, beside the address it reads into.
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
