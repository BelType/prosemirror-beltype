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
