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
- **A shell**: an end-gap Class C, an edge cut through a monolith and a cut through a row continue a box of so many pixels on the next page. `verdictPosition` answers the boundary after (an end gap) or before the box and the page warns on the console. Not reached by either document.
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
- The shells (an end-gap Class C, an edge cut, a cut through a row), the carried parallel flows, the spent lead of a resumed grid, the repeated header and the footer's reservation, the root's parity demand, the composed mode.
- **The trial in the page itself**, the plan's second option, was not measured: `takeReport` reads its container's children in the container's own coordinates, while the page's content stands in its light DOM under a shadow grid whose flow is offset by the margins, and the page neutralizes neither the break properties nor the transforms. The measure context is the engine's conditions exactly, which is what the cuts agreeing shows.
- `moved` is built and not measured: neither document has a late image or a late face.
- Editing on the pages was not tried. The page's content is editable through the view's root, but the page resets `white-space` for layout, so a typed double space collapses on the page, where `prosemirror-view` would show it; the resolution (a typed space as a non-breaking one, or the mechanics in the measure context too) is a decision for the phase that edits.
- The window policy `near` with pages, an invalidation after a `@page` edit, and a document longer than 26 pages.
