# Found by the studio

The one list of what BelType's studio experiment exposed when it started drawing its pages through `prosemirror-fragview`'s `FragmentedView` with this package's `CiceroPage` (the fragview round, 2026-10-24, the studio's branch `round/the-fragmented-view`, its README's section "The fragmented view"). An index of bugs to fix, filed to the layer that owns each one, never an authority: the fix is decided where the code lives. Phase 1's own "not done" list (docs/results.md) seeds it, and each of those entries says whether the studio met it.

The switch is `?view=fragmented` in the studio's URL: the same state, plugins and verbs as the studio's own orchestrator, the view mounted in the pages' pane with `words: { attribute: 'data-beltype' }` and `containers: ciceroContainers(document)`. "The old path" below is the studio without the switch, its own orchestrator (`positions.js`, `patching.js`, `input.js`, `caret.js`, `selection.js`, `clipboard.js`) over `__beltypeCicero.run()`; it is the regression witness, not the proof.

Each entry: what is wrong as the reader sees it; where it was seen (demo, act, URL); which layer owns it and the module; the smallest fix seen from here; and its state, OPEN, or CLOSED with the studio's commit when it was the studio's wiring and was fixed in the round.

## The Cicero page (this package)

### The chain stops at a page whose cut does not advance

- **Seen**: the showcase (`?demo=showcase&view=fragmented`) stopped at page 30 of 76 on load, `prosemirror-beltype: page 30 did not advance from 22811 (the verdict mapped to 22811)`, every page after it missing. Page 30 starts at the showcase's notes (`<div class="notes">`), which the studio's schema holds as one atom (`verbatim`) and which the engine, reading only the DOM, divides across pages: a cut inside an atom has no position, so the verdict maps to the atom's start. Under the generic schema (`&schema=generic&marks=structured`) it stops at page 58 instead, at the multicol `<dl class="two">`: an end-gap shell verdict (`E`) and a `LAST_RESORT` one map to the box's start, and three pages of one to five positions come before the throw.
- **Layer**: the Cicero page, `src/cicero-page.js` (`fill`, the throw after the verdict) and `src/turn.js` (`verdictPosition`).
- **Fix**: never throw from `fill`. A verdict that maps to `from`, or inside a leaf, is an uncuttable run at the page's start: take the node at `from` whole and let it overflow in place, the driver's own answer (C2). The shells (an end-gap Class C, an edge cut through a monolith, a cut through a row) are phase 1's "not done"; until they exist, a shell verdict at the page's start falls back the same way.
- **State**: CLOSED 2026-10-24, 3f9a59e and 1f6e816 on `round/the-page-always-advances`: `fill` never throws, an uncuttable run at the page's start is taken whole and overflows clipped with one console line, and the three shells are built as the engine builds them, so the showcase under the generic schema settles at 74 pages against the CLI's 76 with the glossary sliced as the CLI slices it (docs/results.md, "The page always advances, and the shells"). The studio's `atomWhole` shim is no longer reached and can go.

- **Measured 2026-10-24 before the fix**, under the studio's generic ground: the showcase's multicol glossary gave 64 end-gap shell verdicts and 46 shim warnings and settled at 138 pages, one per term. After 1f6e816 the glossary fixture agrees with the CLI round, 6 and 6, and the showcase completes at 74 pages.

### A block the engine divides, held as an atom, moves whole and overflows clipped

- **Seen**: the bill (`?demo=bolletta&view=fragmented`): 4 pages against the old path's 3, its page 2 ending at "F3." with 195 words against 353, because the readings table (a `<template data-repeat>` drawn as rows) is one `verbatim` atom, moved whole to page 3 and clipped at its foot; the old path divides the table between pages 2 and 3. The showcase's 26 pages that differ from the old path (of 76; first difference page 25) come in clusters, and every cluster but the first starts on a page holding a verbatim block the old path divides: the notes (pages 29 to 34), `aside.divided` (45 to 47), the figures of the flows family (50 to 58), `pre.code` (62 to 65), `aside.reacts` (71, 72). The chain comes back into step after each.
- **Layer**: the studio's schema (`src/schema.js`, the `verbatim` node), not this package: an atom has no position inside it, so no fragmentainer can cut it. Under the generic schema the bill has the same 2 pages on both paths (where the template's rows are not drawn at all, a known gap of the generic schema's).
- **Fix**: under the view, hold as nodes the flow content the engine divides (the generic schema does), or mark such a verbatim block `monolithic` so the page moves it whole on purpose and says so. The studio's README already names the generic schema as the view's ground.
- **The studio's half, done 2026-10-24** (studio a13830d, *the generic ground*): under the fragmented view the generic schema with structured marks is the ground, and the bill's `<template data-repeat>` rows enter the state as repeated rows the serializer drops on save, so the view divides the readings table between pages 2 and 3 as the old path does; page 3 misses only the repeated header row, phase 1's known gap. The `verbatim` atoms remain only under `?schema=studio`.
- **State**: CLOSED 2026-10-24 on both sides; what remains is the repeated header, filed under phase 1's not-done items. Since 3f9a59e the page no longer throws at such an atom: it takes the atom whole, lets it overflow clipped by the page box, and says so once on the console with the page and the node's type. Dividing the block is the studio's choice of schema, which another agent is making today.

### A running element at the document's start makes a page of its own

- **Seen**: the report (`?demo=report&view=fragmented`): 12 pages against 11, page 1 holding only "Annual … 2026" (4 words) from 0 to 24 and ending at the named switch to `cover`, every page after it one later. The manuale: 8 against 7, its page 1 empty (`svg.logo.running`, positions 0 to 4, closed by a Class C verdict at 899 px). The CLI's intake takes running elements and fixed boxes out of the flow before the first page; here the leading running element is laid out in the flow, and the named switch after it ends a page that holds nothing in flow.
- **Seen again 2026-10-24**, a third shape, under the studio's generic ground: the showcase's leading `div.press-mark` (`position: running(press)`) is a node there, and the view ends page 1 after the cover's five-word kicker, the blank verso gone. The same fix.
- **Layer**: the Cicero page, `src/cicero-page.js` (`trial` puts away what `isFixedBox` names, `grab`).
- **Fix**: two parts, to be measured apart: check that `isFixedBox` on the law copy names a running element whose `position: running()` the rewrite moved into a custom property (the report's was drawn); and let the grab take an event with no in-flow box before it as the page's start, not its end, as the driver's "strictly after the page's start" means for a page whose start holds only out-of-flow boxes.
- **State**: CLOSED 2026-10-24, f74a440 (the page's start) and 477f79d (the fixture), on `round/the-page-starts-at-its-first-box`. The put-away never missed: measured on all three demos under both schemas, the law copy is connected, the rewritten sheets reach it, `isFixedBox` names the element at any depth and the page draws it `display: none`. The page was named, and its grab's cursor read, at the running element or at the generic schema's leading whitespace leaf, so it was named `''` and ended at the cover's first child of another name; it now reads both at its first in-flow box (`inFlowStart`), and the report is 11 pages, the manual 7 and the showcase's page 1 the cover with the blank verso back (docs/results.md, "The page starts at its first in-flow box").
- **Remains**: nothing; since 2026-10-25 (3800dfb) the running element is placed in its margin box on every page, as the CLI places it ("No folios, running heads, strings or author counters", below).

### A facsimile is drawn at the browser's 150 px object height

- **Seen**: the facsimile demo (`?demo=facsimile&view=fragmented`): 5 pages against 6, first difference page 2. The three `<object type="application/pdf">` stand 150 to 152 px tall, Chromium's default for an object, where the root presents each as `<object is="beltype-facsimile">` drawn by pdf.js at the PDF page's size; the full-page landscape attachment is cut to a strip.
- **Layer**: the Cicero page, `src/cicero-page.js` (`show`): the root's presenters (`presenters.js`) run on the root's pieces, and nothing presents the content given through `setContent`.
- **Fix**: present the given content as the root presents its pieces, through the engine's presenter registry, before the trial is measured (the trial must measure the presented size too).
- **State**: CLOSED 2026-10-25, 162760b (the page presents what it renders) and 61bf7ba (the fixture), on `round/the-page-presents-what-it-renders`. The factory takes the facsimile's intake when a slice first holds a PDF `<object>`, and the page presents the trial, the law copy and the shown slice through the engine's registry, so the demo is 6 pages against 6, every page the same, the two in-flow pages 229 × 304 and the landscape page 533 × 400 on both paths, and the facsimile fixture 5 against the CLI's 5 (docs/results.md, "The page presents what it renders").

### No folios, running heads, strings or author counters

- **Seen**: every demo: no folio and no running head on any page of the quiet press, the showcase's `counter(pages)` and its `target-counter()` references blank. On the showcase the first page that differs from the old path, page 25, is the one whose paragraph reads `string(family)` in the flow: the string is empty, the line is shorter, and the page holds 11 words more (256 against 245).
- **Layer**: the Cicero page, phase 2 (reads and counters), `src/containers.js` and `src/cicero-page.js`.
- **Fix**: phase 2 as planned, its first round: the chrome the chain alone can answer.
- **Measured 2026-10-25 before the fix**, against the CLI round through the harness: the showcase 74 pages against 76, 51 the same, first difference page 25 (245 words against the CLI's 222, then 166 against 189), no margin box on any view page. Under the studio's own schema the witness's page 25 is 256 against 245, as above.
- **State**: CLOSED 2026-10-25, 3800dfb and 9b90285 on `round/the-page-wears-its-chrome`: the factory keeps one hidden rendering of the whole state per state (`Originals`, `src/originals.js`), the driver's intake read off it, and each page draws its chrome at the end of `fill` as the root does: the folio, `counter(pages)` once the chain is complete, the named strings in their four readings, the author's counters at the page's first word, the running elements copied into their boxes. The trial's measure container wears the page's number and strings, so `string()` in the flow is measured with its value. Every fixture and the specimen give the CLI's margin boxes, page for page, and the state behind them (each page's interval in the engine's word positions, its counters, strings and running elements); the showcase's first difference against the CLI moved from page 25 to page 50, the carried floats (docs/results.md, "The page wears its chrome").

### `counter(pages)` in the flow is measured at its reservation until the chain is complete

- **Seen**: by the build, 2026-10-25: a page's trial wears `page N` and, while no page has run to the document's end, no `pages`, so a flow site reading `counter(pages)` is laid out with `0`; when the chain completes every page's host is given `pages T` and the site draws the total without a refill, so its line is not measured again. The showcase's colophon ("This book has 74 pages") is the one such site in the demos; no line moved in any measured document.
- **Layer**: this package, phase 2's third round, the layout facts (the second is the reads loop around the view).
- **Fix**: the engine's answer, a site whose page's published values moved is measured again (`reads.js`, `pageFactsOf` and `linesOfSites`), the page refilled when its line moved.
- **State**: CLOSED 2026-10-25, 49cfad9 on `round/the-ledger-is-state`, by the engine's reads loop seated around the chain (`Chain.settle`, `src/chain.js`): after the chain is complete the loop reads every page's facts off the Ledger (`pageFactsOf` of the account, `page N pages T` and the strings), measures each flow site that reads a page fact under the facts the layout was laid under and under the truth, and dirties the page holding a site whose line moved, with the page before it. Measured on the showcase: its 4 page sites, the colophon's `counter(pages)` among them, are checked on load; the colophon's line does not move (the CLI's does not either) and it draws 74, the view's own total; the string sites of pages 24, 25, 31 and 32 are cut again in the loop's second run, as the CLI settles in 2 runs. On the chrome fixture, 9 page sites, 11 pages cut again, 2 runs on both sides, every page equal to the CLI's (docs/results.md, "The Ledger is state").

### `target-counter()` and `target-text()` read nothing

- **Seen**: the specimen under `--bare`, 2026-10-25: the 15 reads on its pages 1 to 3 (the contents' `p. N`, `Chapter II`) are blank on the view's pages and delivered on the CLI's; without `--bare` the CLI's delivery sheet, adopted on the document, reaches the view's elements too and they show the CLI's values. The showcase's two cross-references, the manual's contents.
- **Layer**: this package, phase 2's third round, over the reads loop of its second (`settleReads` with `run` the view's chain).
- **State**: CLOSED 2026-10-25, 49cfad9 and ce465bf on `round/the-ledger-is-state`: the engine's loop delivers on the view's pages through its own sheet, keyed by the link's attribute, once the originals' holder is body's first child (a target is `getElementById`'s first element, and the slices keep the author's ids; with the holder after the view the specimen's 15 reads showed nothing, the loop saying each target was outside the flow). Under `--bare` and without it, the specimen's 17 references (14 page reads, 3 counter or text, `target-text()`'s `Configuration` among them) are delivered and its 15 flow reads on pages 1 to 3 equal the CLI's, in 1 run on both sides; the chrome fixture's new forward reference reads `p. 15` on both sides; the showcase's 28 references settle in 2 runs on both sides, 23 of its 28 read sites showing the CLI's text and the other 5 the view's own pages, past its first cut difference (page 50) where the view's chain is two pages shorter (the contents' `65`, `71` and `74` against `67`, `73` and `76`).

### A page an edit does not refill keeps the chrome it was drawn with

- **Seen**: by reading, 2026-10-25: the chrome is read when a page fills, and an edit refills only the pages the ripple reaches, so a page after them keeps the strings, counters and total it was drawn with. Retitling a chapter's heading on page 3 leaves the old title in the running heads of the pages after it until each refills; the total is the one fact redrawn without a refill (`Originals.settle`).
- **Layer**: this package, phase 2's second round, the reads loop: a state whose reading moved a page's chrome dirties that page or redraws it.
- **Fix**: on a new state, read each live page's state over its interval and redraw the pages whose state moved; the page knows its interval in the old document only, so the view's translated entries are the door (the factory's `entries` argument is the chain when the page was built).
- **State**: CLOSED 2026-10-25, 49cfad9 and 7171e58 on `round/the-ledger-is-state`: on a new document the chain object reads every clean page's interval again over the view's mapped entries (`Chain.rechrome`), redraws the chrome of a page whose counters, strings or running elements moved, and dirties a page whose strings moved and on which a flow site reads a page fact. Measured on the chrome fixture under `--retitle`: `Strings` retitled on page 3 refills page 3 and redraws pages 4 and 5 without a refill; `Folios` retitled `Folia` on page 1 refills page 1 and dirties page 2 for its `string(chapter)` site; `Folios` retitled `Folios, retitled` wraps the heading and refills the chain to a 17th page. Each time every page's words, margin boxes and flow text equal the view's own fresh fill of the edited state after `invalidate()` (docs/results.md, "The Ledger is state").

### The originals cost a keystroke more than the refill it serves

- **Seen**: measured 2026-10-25 on the studio's showcase, five characters typed on page 3: the rendering of the whole state 1.9 to 5.6 ms and its reading 12.0 to 23.6 ms per transaction, inside `updateState`, so the chain settles in 24.1 to 46.5 ms where `main` settles in 7.6 to 22.8 ms (docs/results.md, "The page wears its chrome", the cost).
- **Seen again 2026-10-25**, with the Ledger and the reads loop (`round/the-ledger-is-state`), the showcase in the harness, five characters on page 3: the chain is quiet 26.9 to 33.9 ms after the dispatch with the Ledger and 16.5 to 21.4 ms without it; of the view's update (23.8 to 30.5 ms), the clean pages' chrome read again is 1.8 to 3.2 ms and the loop's start 7.5 to 9.6 ms, its site search, position index and written facts walking every block (`cicero:reads`), and the settle ends in 18.3 to 22.6 ms in 1 run. The engine's `keep` door would spare those walks per top-level box, but it keeps a part by the box's element, and the originals are rendered anew per state, so no element survives a transaction: the incremental rendering below is the loop's prerequisite too.
- **Layer**: this package, `src/originals.js`.
- **Fix**: render and read per top-level node, keeping each unchanged node's element, index part and ops part by the node's identity (ProseMirror's nodes are persistent, so an untouched top-level node is the same object), through the engine's own door for kept parts (`indexBlocks` and `documentOpsOf` take a `Keep`, settled by `sheetReach`, *a resumed run keeps its reads*).
- **State**: CLOSED 2026-10-25 for this package's half, 5f811f2, 65f2de8 and 692392d on `round/the-originals-keep-their-parts`: the first state is rendered whole and every later one per top-level node, matched to the last by identity, an untouched node's element surviving the edit; the engine's `ForcingMemo` is settled once per state against `sheetReach` and its `keep` handed to the originals' walks and to the loop's (docs/results.md, "The originals keep their parts"). Measured in the harness on the showcase, five characters on page 3, before and after interleaved, three runs each: the rendering 0.1 to 0.4 ms against 2.3 to 2.9, the reading 8.3 to 9.6 ms against 10.9 to 13.0 (one chapter restyled instead of the whole holder), the chain quiet 20.4 to 25.6 ms against 26.0 to 32.4 with the Ledger, and 11.3 to 15.7 ms against 16.7 to 20.8 without it. The loop's start is unchanged, 7.1 to 8.9 ms, because the showcase's sheets put the engine's memo out of use: reach 2 (one `:has()`) and 10 rules of reach 1 (`p + p` and its kin), so it keeps nothing there. Settled under reach 0 by the harness's `--reach 0`, the same keystrokes are quiet in 6.4 to 11.5 ms, the reading 1.9 to 2.4 ms and the loop's start 0.7 to 1.0 ms, every page and the originals' reading equal to a fresh whole rendering: what the engine's door below would give. In the studio, real keys on the showcase under the view: a character a third in 36.9 ms (34.5–43.1) against 42 (38.2–50.3), two thirds in 48.3 (46.8–53.7) against 53 (49.3–59.4), medians of 10; the quiet press is bound by the frame on both sides.
- **The remainder**: CLOSED 2026-10-25 with the engine's reach for a whole top-level box (BelType 8c6d8777, adopted at 94609a3): the loop's start falls from 7.0 to 8.7 ms to 0.7 to 1.0 and a keystroke on the showcase is quiet in 7.6 to 12.5 ms against 22.3 to 30.4 before; in the studio a character a third into the showcase is settled in 19.3 ms and shown at the second frame (31.5 ms against 35.5), two thirds in at 35.3 ms against 47.5, medians of 10 (docs/results.md, "The reach of a whole box"). A keystroke now costs less than the refill it serves: of the view's update (4.7 to 6.7 ms) the largest piece outside the fill is the clean pages' chrome read again (1.8 to 2.9).

### A page keeps the copy of a running element an edit changed inside it

- **Seen**: the chrome fixture under `--bare`, 2026-10-25, a character typed at the document's very start, which is inside its running element (`position: running(mark)`): pages 2 to 9, which the edit did not refill, kept `The Chrome fixture` in `@top-left` where the view's fresh fill of the same state shows `xThe Chrome fixture`, 8 of 16 pages different; each page's state equal, since a page's running elements are indices into the state's list and an edit inside one keeps its index.
- **Layer**: this package, `src/chain.js` (`rechrome` compared the indices) and `src/cicero-page.js` (`drawChrome`'s key holds the indices). Present before the round too: every state was rendered anew, so every running element was a new object, and the indices alone were compared.
- **Fix**: compare the elements a page places as well (`runningPlaced`), by identity or as equal nodes (`sameElements`), since an element whose top-level node was rendered again for an edit elsewhere in it is a new object of the same content.
- **State**: CLOSED 2026-10-25, 5f811f2 and 692392d on `round/the-originals-keep-their-parts`: the same edit gives 16 of 16 pages equal to the fresh fill. By identity alone, retitling `Strings` redrew 9 pages without a refill where 2 had moved; as equal nodes, 2.

### The view's invalidation left the originals as they were read

- **Seen**: by reading, 2026-10-25: `Originals.of` keeps one reading per document, and `invalidate()` dirties every entry without a new document, so after a conditions change (a stylesheet in the studio's amendments pane, a face arriving) the pages refilled read the counters, strings and running elements computed under the old sheets until the next edit. Not measured on a page.
- **Layer**: this package, `src/originals.js` and `src/chain.js`.
- **Fix**: forget the rendering and the memo where the view releases every page at once, which only `invalidate()` does.
- **State**: CLOSED 2026-10-25, 5f811f2 on `round/the-originals-keep-their-parts` (`Chain.released`, `Originals.forget`); the harness's fresh fill after `invalidate()` renders the originals whole, which the round's edit equalities rely on.

### A refilled page keeps the hint it was built with

- **Seen**: the chrome fixture, 2026-10-25, `Folios` retitled `Folios, retitled` by a transaction: the heading wraps and the chain refills from page 1 to a new 17th page. Page 4, which now opens chapter II at a forced break, was refilled with `forced: false` and its lead truncated (27.72 px), since its container had been built when the page before it ended unforced, and every page from 4 on differed from the view's fresh fill of the same state (77 words on page 4 against 83).
- **Layer**: the view hands a container the hint the page before it left only when it builds it (`FragmentedView.build`; `fill` takes none), and this package read it only in the constructor (`src/cicero-page.js`).
- **Fix**: at every fill the page takes the hint the page before it left at its last fill (`Chain.hintFor`, by index, so it needs no view), its name, side and blankness with it; the view's door is filed in its section.
- **State**: CLOSED 2026-10-25, 49cfad9 and 2de1bc9 on `round/the-ledger-is-state`: the same edit gives 17 pages, every one equal to the fresh fill.

### A typed double space collapses on the page

- **Seen**: the quiet press, "A  B" typed in a paragraph: the model holds two spaces, the page draws one (the four characters measure 24 px). The old path draws one too (24 px, `white-space-collapse: collapse` on the page), so it is no regression of the switch; the view alone would have shown two.
- **Layer**: the Cicero page, `src/cicero-page.js` (the page resets the view's `white-space: break-spaces` to the body's, which the trial needs).
- **Fix**: a decision, as phase 1 says: a typed space beside a space as a non-breaking one, or the editing mechanics in the measure context too.
- **Measured 2026-10-25 before the fix**, by `scripts/spaces.mjs` in the studio with real keystrokes: on both paths a typed space is U+0020 in the model and in the drawn text node, in all three places, so the browser promotes nothing (both paths cancel `beforeinput` and draw from the model). `A  B` measures 24.44 px, the second space 0 px; a space at the paragraph's end or start draws 0 px.
- **State**: CLOSED 2026-10-25, 596df51 and fceba92 on `round/a-space-beside-a-space`, by a decision: the document is HTML and whitespace collapses in the editor as in print, so a space that would collapse is promoted to U+00A0, which model, CLI round and page all draw. `collapsedSpaces()` (`src/spaces.js`) does it after every transaction, installed in the studio's state under the switch (studio da9c7e9): `A  B` is `A`, U+0020, U+00A0, `B` and measures 29.2 px with both spaces 5.47 px, the edges' spaces draw 3.17 and 8.42 px, and one undo takes a space and its promotion (docs/results.md, "A space beside a space").

### The title page refills every frame

- **Seen**: the quiet press under the view, by `scripts/spaces.mjs` (2026-10-25): with nothing done after the chain settled, page 1 announced `moved` 90 times and the view dispatched 180 refill transactions in 1.5 s, one `moved` a frame, for as long as the page stands. Each refill's transaction redraws the model's selection in the DOM, so a click on page 2 was overwritten before the browser's `selectionchange` was read and the model's head stayed on page 1: 3 clicks of 3 lost, where the old path lost none. The round placed the caret at the click's own `posAtCoords` to measure.
- **Layer**: the Cicero page, `src/cicero-page.js` (the `ResizeObserver` in the constructor and the heights `fill` records). The page records each given node's `getBoundingClientRect().height`, a border box, and the observer compares it with `contentRect.height`, a content box. The title page's `section.titlepage` has a 151.18 px `padding-top`: 522.81 px against 371.64, a difference on every observation, so every fill ends in a `moved` and a refill. The `heights` map is never cleared either, and holds one detached section per refill.
- **Fix**: compare like with like, the observer's `borderBoxSize[0].blockSize` against the recorded border box (or record the content box), and clear `heights` with the observer's `disconnect()` at the start of `fill`. Not built: the round was not to touch `cicero-page.js`.
- **Measured 2026-10-25 before the fix**, by `scripts/idle.mjs`: every observation that differed from its record differed by the node's padding and borders, its border box equal to the record, on four demos. The quiet press's `section.titlepage` (522.81 against 371.64) and the bolletta's page 3 `section.info` (197.17 against 185.52) refilled once a frame on load and for as long as they stood, 90 and 44 `moved` in an idle 1.5 s; the report's page 11 and the showcase's page 74 `section.colophon` (829.11 against 111, 536.25 against 271.69) refilled only while on screen, 10 and 11 times during a scroll, since a page off screen is skipped and its observer hears nothing. Page 1's `heights` held 104 nodes, 103 of them detached.
- **State**: CLOSED 2026-10-25, ead7cca on `round/late-truth-like-with-like`: the page compares the border box it records with the observer's `borderBoxSize`, every fill disconnects the observer and clears `heights`, and `moved` is announced only for a node the page still shows. On every studio demo under the view, load, scroll and idle give 0 `moved` and 0 refill transactions, and the view's clicks land, 3 of 3 (docs/results.md, "Late truth, like with like").

### Resumed pieces wear no dressing sheet

- **Seen**: by reading, not on a page: under the view no root runs in the document, so the root's dressing sheet (`::before`, `::marker`, `::first-letter`, `::first-line` suppressed on a resumed piece, `::after` on a cut-off one) is never adopted; `document.adoptedStyleSheets` holds none of its rules. No demo shows it yet: none of the 74 resumed pieces of the showcase, nor those of the quiet press, the manuale and the report, has a marker, generated content or a first-letter rule that would print twice.
- **Layer**: the engine's door (`root.js`, `ensureDressingSheet`, private) and this package (`src/containers.js`, which would adopt it). The phase 1 measurement did not meet it because the CLI's own root had run in the same page.
- **Fix**: export the dressing sheet's making from the engine (beside `ensureDressing` in `dressing.js`), and have `ciceroContainers` ensure it as it ensures the render conditions.
- **Seen on a page 2026-10-25**, by `fixtures/dressing/` under `node scripts/specimen.mjs --bare`, the CLI's adopted sheets taken off the document before the view is mounted: the resumed blockquote on page 3 showed its `::before` label (`"Quoted"`), the resumed items on pages 5 and 6 their author `::marker`, the resumed drop-cap paragraph on page 7 its `::first-letter` (`float: left`, 49.87 px), the resumed paragraph on page 9 its `::first-line` (16.87 px small caps against its own 14.67 px), and the cut-off aside on page 10 its `::after` attribution. No cut moved: the label pushed page 3's measured foot from 461.18 to 485.38 px with the page's start read at 24.2 px, and the first line page 9's from 401.91 to 405.52 px.
- **State**: CLOSED 2026-10-25, 1c26f19 on `round/the-host-wears-the-dressing`: the engine's door, `ensureContinuationDressing(doc)` in `dressing.js` (BelType's CHANGELOG 2026-10-25, *The continuation dressing is a door*), and the factory calling it, with `ensureDressing`, as it checks the render conditions. Under `--bare` every resumed piece of the fixture reads `none` at its edges and the paragraph's own size and caps, as the CLI's do, and the view gives the CLI's 11 pages, every fill the same as with the root's sheets worn (docs/results.md, "The host wears the dressing").

### A fill overtaken by a second transaction in the same task throws in the grab

- **Seen**: 2026-10-25, the studio's checks-see-the-view round (`round/the-checks-see-the-view`), `scripts/collab-undo.mjs` scenario (3) under `?view=fragmented&schema=studio`: two page errors, `Cannot read properties of undefined (reading 'start')` at `CiceroPage.cutOnce` (`src/cicero-page.js:371`, from `cutAndDraw` and `fill`). Reduced: the quiet press, two `studio.apply(tr.insertText('A', p))` in a row in one task in the middle of the long chapter throw once (three throw twice); one insert, or the same inserts each awaited to the settled chain, throw nothing. Real keys never arrive inside one task, which is why the typing session (61 plans, 1 803 keys) never met it; a collaboration burst or a script's batch does. The pages afterwards equal a fresh pagination in scenario (3), so the chain recovered, but the fill rejected where it should not.
- **Layer**: the Cicero page, `src/cicero-page.js`, `cutOnce`: `t.law.positions.get(event.el)` is undefined for the forcing event the grab found, so the event's element is not in the trial's law (read off a rendering of another document, by the look of it).
- **Traced** 2026-10-25, the studio's amendments pane: an identity amendment changes the document and, in the same task, the stand-in patcher invalidates the view because the sheet moved, so a second fill starts while the first awaits its measurement. The trial's law copy is written into one holder for the whole document (`lawHolder(this.doc)`, `#__prosemirror-beltype-law`), which `trial` empties and refills; the second fill's trial replaces the first's law while the first is suspended, and the first resumes reading elements that are no longer there. Page 3's fill threw, `Chain.settled` answered `{ complete: false, why: "page 3's fill threw: …" }` for the current document, and the pane counted the amendment against pages not yet refilled ("dresses no block: an orphan"). With a holder per trial (a throwaway experiment, reverted) nothing threw, every `settled` answered `{ complete: true }` and the pane counted 1.
- **Fix**: a law holder that no other fill writes while a fill is suspended (one per page, or one per trial removed at the fill's end), and where a newer fill of the same page overtook this one, end the fill as overtaken rather than throw; *the page always advances* says `fill` never throws.
- **Measured 2026-10-25 before the fix**, by `node scripts/specimen.mjs --overtaken` (each pair of neighbouring pages of the settled specimen filled over the one document in one task): `overtaken: 8 pairs of neighbouring pages filled in one task, 6 failures, 1 law holders left standing`, page 3 (with page 2) `threw Cannot read properties of undefined (reading 'start')`, pages 1 and 2 answering 41 and 1071 where the chain holds 135 and 308, page 1 showing no words where it showed `Summary … Appendix`. In the studio on `studio-view`, the quiet press with `insertText('A')` twice in one task in the long chapter: a page error `Cannot read properties of undefined (reading 'start')`.
- **State**: CLOSED 2026-10-25, e03eebc on `round/a-holder-per-fill` (the case first, 826c662 and 4635b09): `fill` makes the law holder (`__prosemirror-beltype-law-N`, hidden as before) and removes it in a `finally`, and every trial of the fill writes it, so a fill suspended at its measurement keeps its own law copy. The same case: `overtaken: 8 pairs of neighbouring pages filled in one task, 0 failures, 0 law holders left standing`; the quiet press's two inserts in one task throw nothing and the pages equal a fresh pagination (30 pages); `STUDIO_URL=http://localhost:48822/ npm run amendments` lists "the pane lists the rule, dressing 1 block" and prints no page error; collab-undo holds in every scenario with no page error; typing 61 of 61 (docs/results.md, "A law holder per fill"). **Left open, not this entry's**: the engine's measure container is one element per document that every fill's measurement shares (below).

### The measure container is one element for every fill of a document

- **Seen**: 2026-10-25, while closing the entry above. `createMeasureContext` (`measure.js` in the engine) takes its container with `getElementById`, one element for the document, and `measure(nodes)` replaces its children; `cutOnce` awaits the fonts and the images between laying the trial out in it and taking the report (`CiceroPage.measure`). Two fills of one document in one task therefore share it across that await.
- **Measured** with a throwaway probe in `measure` (not kept): in the overtaken case, 6 of 23 measurements found the fill's own nodes no longer in the container when it came to take the report, each of them paired with a report of the same 41, 47, 63, 33, 33 and 14 boxes as the other fill's. Every answer of the case still equalled the chain's `to` and every page showed the words it showed before, so no wrong page was seen; the probe says the report was the other fill's content; why the answer was still right is not traced.
- **Layer**: the engine (`createMeasureContext`, its container and its `dispose()`, which removes the shared container and sheet) and this package (`measure`). A container per context, or a fill queue per document, is the choice; neither was made.
- **State**: OPEN.

### Known from phase 1, not met by the studio

- `adjoin` after a forced break: the fill strips it; no difference traced to it.
- The repeated table header and the footer's reservation: the studio's schema holds every table as an atom (the entry above), so the header question never arose; under the generic schema the showcase's tables are not where its first difference is.
- `invalidate()` after a conditions change: met through the amendments pane (an amendment is a new sheet): the view refilled every page, 80 pages for a `body { font-size: 13pt }` rule in about 700 ms, and undo brought the sheet and the pages back.
- The `near` window policy: see the view's entry on the first frame.

## The view (prosemirror-fragview)

### A mouse selection cannot leave its page

- **Seen**: the showcase, pages 10 and 11 both in view: a drag from page 10's last lines to page 11's first, or a click on page 10 then Shift+click on page 11, leaves the model's head at 6269, the first position of page 10, and nothing of page 11 selected. Shift+ArrowDown across the same break works (anchor 6990, head 7431, two highlight ranges), and so do ArrowDown and ArrowRight. The act "select across three pages and delete" was done with the keyboard: 1 126 positions over pages 10 to 12, deleted, 76 pages to 75, every page after them refilled.
- **Layer**: the view, `src/fragmented-view.js`: the pointer is the browser's (the `mousedown` handler only forgets the drawn anchor; `readSelection` takes what the browser drew). With the content given to a `<beltype-page>` and slotted into its shadow tree, Chromium does not extend a selection from one page's content into another's; `OverflowBox` has no shadow tree, which is why the parity acts passed.
- **Fix**: the view owns the pointer, as the studio's `selection.js` did: on `mousedown` (and Shift+`mousedown`) and on `mousemove` with the button held, `posAtCoords` and a `TextSelection` from the model's anchor, with auto-scroll near the scroller's edges.
- **State**: OPEN.

### Home and End scroll the pages instead of moving the caret

- **Seen**: the quiet press, a caret in a paragraph mid-page: End scrolled the pages' pane by 2 614 px and Home by 14 864, and the caret did not move (head 1309 before and after). The studio's old path met the same thing in 2026-10-12 and took the two keys itself (`caret.js`, "in these pages the browser scrolls the document instead of moving the caret").
- **Layer**: the view, `src/fragmented-view.js` (`onKeyDown` leaves both to the browser).
- **Fix**: take Home and End: the start and end of the caret's visible line from its line rects, as `caret.js` does.
- **State**: OPEN.

### The first page waits for the whole chain

- **Seen**: the showcase: 76 pages filled in one stretch of 537 ms with no animation frame (a frame-gap probe: frames at 329 ms, then 866 ms), so the first page paints when the last is filled: 838 to 876 ms from navigation against the old path's 745 to 780 (itself a whole run, no `until`). The quiet press: 392 to 417 against 409 to 426.
- **Layer**: the view, `src/fragmented-view.js` (`fill`'s answer dispatches `refilled`, whose `update` starts the next fill at once; a `CiceroPage` awaits only promises already resolved, so the ripple never yields a task).
- **Fix**: let the first fill paint: yield to a frame after the entry that holds the viewport's first page, then fill on in idle slices, as the engine's own bootstrap cuts the first screen and one more. `window: { build: 'near' }` would build less, but its viewport is the window's (its own `ponytail:` note), and the studio's pages scroll in a pane.
- **State**: OPEN.

### `nodeDOM` answers null for a node that opens at a cut inside another that opens there

- **Seen**: the quiet press: the four empty chapter-number paragraphs at the head of chapters 2, 4, 5 and 6 (positions 4915, 27651, 32603, 37606), each the first child of a section that opens at the same cut. The amendments pane, which counts what a selector dresses through the view, counted 85 paragraphs where the document has 89.
- **Layer**: the view, `src/fragmented-view.js`, `nodeDOM`: `opens` compares `openedAt(doc, to) === pos`, true only for the outermost node that opens at the cut.
- **Fix**: a node opens at the cut when `openedAt(doc, to) <= pos < to`.
- **State**: OPEN.

### The view does not scroll to a transaction that asks for it

- **Seen**: by its header; the studio wired it before the acts, so Enter at a page's foot (the showcase, page 7) left the caret in view on page 8.
- **Layer**: the view, `src/fragmented-view.js` (`scrollIntoView` is in its "does not do yet" list).
- **Fix**: after `update`, when the transaction `scrolledIntoView`, scroll the head's `coordsAtPos` into its scrolling ancestor's view.
- **State**: OPEN. The studio does it in its wiring for now (`src/fragmented.js`, the `apply` wrapper, commit 19c06e2).

### The renderer has no door for the host's page serializer

- **Seen**: the bill: its two images (`images/qr-pagamento.png`, `images/contatore.png`) do not load under the view, asked at `/images/…` on the studio's page; the old path draws them at `/demos/bolletta/images/…`. The studio's page serializer resolves an image's address against the document's URL and the saved document keeps it as written; the view's renderer serializes with the schema's own `toDOM`.
- **Layer**: the view, `src/slice-renderer.js` (`DOMSerializer.fromSchema(schema)`, read once per schema).
- **Fix**: a `domSerializer` prop (or a `sliceRenderer` option) whose node and mark specs the renderer wraps, as `EditorView` has `clipboardSerializer`.
- **State**: OPEN; the studio routes round it (its wiring's entry below).

### Copy writes the page's markup without the slice's open depths

- **Seen**: the showcase, part of two paragraphs inside a section's header copied: the HTML is `<section class="family" id="running-heads-section"><header><p class="lead">…</p><p>…</p></header></section>`, the open ancestors written whole with their `id`, and no `data-pm-slice`. Pasted back into the studio it fits (the studio's paste verb strips ids and the parser's context places it); pasted into another editor it brings a section and its `id`. The studio's old path wrote the saved document's markup with `data-pm-slice`.
- **Layer**: the view, `src/fragmented-view.js`, `onCopy`.
- **Fix**: honour `someProp('clipboardSerializer')` and write `data-pm-slice` with the slice's `openStart` and `openEnd`, as `prosemirror-view`'s clipboard does.
- **State**: OPEN (minor).

### A refill redraws the model's selection over a click not yet read

- **Seen**: with the title page refilling every frame (the Cicero page's entry above), a click's selection, put in the DOM by the browser at `mouseup`, is replaced by the model's in the next refill's `updateState` (`update`, `selectionToDOM`) before `selectionchange` fires, so `readSelection` never sees the click. Traced 2026-10-25 by wrapping `Selection.prototype.setBaseAndExtent`: every call came from `selectionToDOM` under a refill transaction (meta `fragments$`, no selection set).
- **Layer**: the view, `src/fragmented-view.js` (`update`).
- **Fix**: read the DOM's selection before drawing the model's when a transaction set no selection (or skip `selectionToDOM` for a transaction that changed neither the document nor the selection and left the selection's fragments in place). Not needed once the page stops refilling, but any refill during a click would lose it the same way.
- **Since 2026-10-25** the Cicero page no longer refills while nobody types (its entry above is closed), and the three clicks of `scripts/spaces.mjs` land: the defect is latent until a legitimate late `moved` (an image arriving, a face loading) lands between a click's `mouseup` and its `selectionchange`.
- **State**: OPEN.

### A container is handed its hint only when it is built

- **Seen**: the chrome fixture under an edit that adds a page (this package's entry "A refilled page keeps the hint it was built with"): a ripple refills a container whose page before it now ends otherwise, and the hint that page left is in the view's `hints` but reaches the container only through the factory, at `build`.
- **Layer**: the view, `src/fragmented-view.js` (`build`, `fill`).
- **Fix**: hand `fill` the hint the entry before it left (`fill(doc, from, render, hint)`), or rebuild a container whose hint changed. Worked around in this package (the page asks the chain object for the hint the page before left).
- **State**: OPEN.

### The chain does not serialize

- **Seen**: by building the Ledger, 2026-10-25: the Ledger plugin's state round-trips through `toJSON` and `fromJSON`, but the fragments plugin has neither, so a state reopened from JSON starts with one dirty entry under key 0 and the Ledger's rows under the other keys are dropped by the first transaction; only the warm tables survive (the reopened state's first settle starts from the numbers the saved one left).
- **Layer**: the view, `src/fragments-plugin.js`.
- **Fix**: `toJSON` and `fromJSON` on the fragments plugin's state field (the entries are plain data), the keys kept so the Ledger's rows meet their entries again.
- **State**: OPEN.

### A composition in a divided paragraph loses the paragraph's other piece

- **Seen**: 2026-10-25, the studio's checks-see-the-view round, `scripts/limits.mjs` under `?view=fragmented&schema=studio`, then reduced: the quiet press, a click in the paragraph at position 5779 (777 characters, divided between two pages), a real composition through the DevTools protocol (`に`, `にほ`, committed `日本`): the paragraph is 706 characters afterwards, its last 73 characters (the piece on the next page) gone and `日本` in, the document 71 characters shorter. The old path leaves the paragraph whole.
- **Layer**: the view, `src/fragmented-view.js`, `readComposition`: "the textblock under the caret is parsed back and diffed against the model", and the DOM holds only the piece of it the caret's page shows.
- **Fix**: parse back only the piece's range (the fragment's `from` and `to` inside the textblock) and diff that against the same range of the model, or take the composed text from `compositionend`'s data and insert it at the composition's range.
- **State**: OPEN.

### A drag loses its anchor when the pane scrolls under the held button

- **Seen**: 2026-10-25, the studio's checks-see-the-view round, `scripts/selection.mjs` 1.1 under the switch ("selection 12123..12123, expected 11905..12123", a drag inside one page), then reduced: the quiet press, a button pressed at position 10290, the pages' pane scrolled 94 px by script, the pointer moved 200 px in six steps and released: the model's selection is 10708..10708, collapsed where the pointer ended. With no scroll the same drag gives 10290..10385; on the old path, scroll or not, 10290..10708 and 10290..10385. The selection, marks and lists checks scroll a target into view between `mousedown` and the move, as a reader's wheel would.
- **Layer**: the view, `src/fragmented-view.js`: the pointer is the browser's (the entry above on a selection leaving its page).
- **Fix**: the same as the entry above: the view owns the pointer, the anchor the model's position at `mousedown`, so a scroll under the held button moves only the head.
- **State**: OPEN.

### ArrowDown and ArrowUp stop in a textblock that only generated content fills

- **Seen**: 2026-10-25, the studio's checks-see-the-view round, `scripts/caret.mjs` under the switch, "press 11 (line 10 -> 11, page 2 -> 3): no DOM caret; caret on line null, expected 11", and every later press one line behind: the quiet press, ArrowDown from the contents' last line puts the head in the empty `p.chapter-number` at chapter one's head (`paragraph.chapter-number size 0`, position 282), where the DOM caret has no rectangle, and the next press reaches the chapter title. The old path's caret (`caret.js`, `nextPos`) skips such a textblock ("a block the stylesheet fills with a generated chapter number is no place for a caret"), so its walk passes the same 675 lines with no failure.
- **Layer**: the view, `src/fragmented-view.js` (the arrows are the browser's, and an empty textblock with its trailing break is a caret stop). A question of design as much as a fault: ProseMirror stops in an empty paragraph; a page that draws only generated content there shows the reader no line.
- **Fix**: decide whether an empty textblock whose box is filled only by generated content is a stop; if not, the view moves past it as `caret.js` did.
- **State**: OPEN.

### Around a facsimile, the arrows stop and a click lands in the heading

- **Seen**: 2026-10-25, the studio's checks-see-the-view round, `scripts/facsimile-check.mjs` (C) under `?view=fragmented&schema=studio`, the facsimile demo (6 pages, the landscape attachment on a page of its own): ArrowRight at the end of the last paragraph before the page of its own leaves the head where it was ("one press crosses it: {"right":2807,"heading":2814,"before":2807}"), and ArrowLeft from the heading after it goes one position past the paragraph's end (2806 where 2807 is wanted); a click on each of the three facsimiles lands in a heading, where the old path puts it in the figure's caption, the nearest text ("a click on a figure's page lands in its caption, the nearest text: ["heading","heading","heading"]"). The old path passes all three (`caret.js` takes the arrows across a box no caret can enter, and its click finds the nearest text).
- **Layer**: the view, `src/fragmented-view.js`: the arrows and the pointer are the browser's, and a page whose one box is an atom (an `<object>` drawn `contenteditable="false"`) gives the browser no place to move the caret into.
- **Fix**: the view takes the arrow across a fragment that holds no caret position (the next position the model has, as `leftAcrossCut` does across a cut), and a click on an atom's box goes to the nearest textblock position, or selects the atom.
- **State**: OPEN.

## The engine (BelType)

### The showcase does not print, on either path

- **Seen**: the print dock on the showcase, with and without the switch (the print frame paginates the state itself and never reads the view's pages): `caster: the continuation of section[4] does not mirror its source — section[35]/p[7]/span[0] has 1 element children where its twin at section[4]/p[7]/span[0] has only 0`. The quiet press (30 pages, 190 kB) and the report print under the switch.
- **Layer**: the engine's continuation of an inline element with an element child, or Caster's mirror check (`packages/caster`); not the switch.
- **Fix**: case it in the battery from the showcase's page 4 paragraph 8.
- **State**: OPEN, seen on main too.

### A margin box takes a running element only through a forwarding slot

- **Seen**: the running fixture under the view, 2026-10-25: `setMarginBox(name, parts)` takes a running element as `{ slot, node }`, a forwarding slot it makes the page's light child and the node it assigns to it, the root's chain (the page stands in the root's shadow tree, the clone is the root's light child). A page outside the root has no shadow tree above it, and a `<slot>` outside one draws nothing: with the clone the slot's child, the harness read the clone's text and the clone laid out no box.
- **Layer**: the engine, `src/chase.js` (`setMarginBox`).
- **Fix**: let a part be a node, assigned to the cell's slot directly. Worked around in `src/cicero-page.js` (`runningPart`): the clone is the page's light child and stands for the forwarding slot, its `assign` a no-op, so the cell's slot is assigned the clone, which then draws as the root's does.
- **State**: OPEN.

### The intake's running elements are read off `doc.body`

- **Seen**: by building the originals, 2026-10-25: `runningBoxes(doc)` and `topLevelBlocks(doc)` read `doc.body.children`, and `runningPosition`, the two lines that turn a running element's place into its assignment's position, is private to `driver.js`.
- **Layer**: the engine, `src/driver.js`.
- **Fix**: take the root the boxes stand in (a parameter defaulting to `doc.body`), and export `runningPosition`. Worked around in `src/originals.js`: both are asked of a stand-in whose `body` is the originals' holder, and `runningPosition` is written again.
- **State**: OPEN.

### A second host in the same document finds the margin boxes' `content` cleared

- **Seen**: the harness, 2026-10-25: the root clears every margin box's `content` from the CSSOM when it presents (`neutralizeMarginBoxes`), and the table it captured before is the client's alone (`seam/client.js`, `presented.table`), so the view's factory, made in BelType's own page after the CLI's round, read a table with no margin boxes.
- **Layer**: the engine, `seam/client.js` and `src/root.js`; met only by a page that holds both hosts.
- **Fix**: expose the captured table on the handle, or let a host pass one in. Worked around in the harness: an init script records each `content` the root removes and the harness writes them back before the factory reads the table (`restoreMarginContent`).
- **State**: OPEN (minor).

### The loop checks a page site against the facts it handed the run, not the ones the page was cut under

- **Seen**: the chrome fixture, 2026-10-25, `Strings` retitled on page 3 (docs/results.md, "The Ledger is state"): the view refilled page 3 with its new strings standing, since every page publishes its own interval's values on the trial; the loop, handed the Ledger's warm `facts`, compared the flow site on page 3 measured under the old string with the truth, found the line moved and sent a second run that refilled pages 2 and 3 to the same cuts. On load the same holds for every page with a page site (the first run is laid under no facts, as on the CLI, so both sides take 2 runs there).
- **Layer**: the engine, `src/reads.js` (`settleReads`: `laidFacts` is the `facts` the loop handed the run).
- **Fix**: let the run return the facts each page was laid out under (beside `account`), and compare the truth with those where given; the driver's own run returns the facts it was handed, so nothing changes for the CLI.
- **State**: OPEN (a run's cost, no cut: the second run converges on the first run's cuts).

### The sheets' reach is read per box, and this host replaces whole top-level boxes

- **Seen**: the round *the originals keep their parts*, 2026-10-25: `sheetReach(document)` is 2 on the specimen (3 rules, its `section:has(> h1)` as the has-words rewrite leaves it), on the flow fixture (2, `section:has(> h2.verso)` and `section:has(> h2.wide)`) and on the showcase (1 `:has()`, and 10 rules of reach 1, `p + p`, `.lead + p`, `h3 + p` and their kin), so the memo keeps nothing there and the loop's start costs on a keystroke what it cost before. Every studio demo is 2 as well, through one rule of the studio's own sheet, `li > p:first-child:not(:has(~ p) …)`, besides the demos' own (the showcase's 10 of reach 1, the manuale's 6). At reach 1 a top-level box replaced forgets every part too. Every other fixture is 0.
- **Layer**: the engine, `src/capture.js` (`sheetReach`) and `src/forcing-memo.js` (`settle`). The reach answers for `patchBox`, which replaces a box at any depth and keeps its ancestors; this host replaces a top-level box whole, its subtree with it, so a `:has()` whose subject stands inside a top-level box and whose argument does not open with `+` or `~`, and a sibling combinator between boxes inside one, cannot make another top-level box's part stale. What can: a `:has()` or a sibling combinator that matches across top-level boxes or on `html`, `body` or the holder.
- **Fix**: a reach read for a unit of replacement (a parameter of `sheetReach`, or a `settle` told the replaced boxes are top-level and whole), the engine's to decide. Measured with the reach forced to 0 on the showcase (`--reach 0`): a keystroke quiet in 6.4 to 11.5 ms against 20.4 to 25.6, the loop's start 0.7 to 1.0 ms, every page, the originals' reading and the delivered reads equal to a fresh whole rendering after 5 keystrokes; not a proof that 0 is right for the showcase's sheets.
- **State**: CLOSED 2026-10-25 by the engine, BelType's merge 8c6d8777 (`topLevelReach(doc, boxes, before)` in `capture.js`, `ForcingMemo.settle(reach, boxes)` and `memo.boxes`; its CHANGELOG, *the reach is read for a unit of replacement*), adopted here on `round/the-reach-of-a-whole-box` (94609a3), this package's structural-pseudo-class scan dropped. The specimen, the flow fixture, the showcase and the studio's report, manuale, facsimile, bolletta and showcase read 0; the studio's quiet press 1 (filed below). The showcase in the harness, five keystrokes on page 3, before and after interleaved: quiet 7.6 to 12.5 ms against 22.3 to 30.4, the reading 1.0 to 1.4 against 8.1 to 11.9, the loop's start 0.7 to 1.0 against 7.0 to 8.7, every edit equal to a fresh whole rendering with the memo in use (docs/results.md, "The reach of a whole box").

### A kept index part is read again when its block moved

- **Seen**: the chrome fixture, two paragraphs pasted at the top level, 2026-10-25: the memo's tally read the position index part of every block after the insertion again (`index` 3 read, of which 2 new), since `indexBlocks` asks a part with `still: p.b === b` and each entry of the part carries its block's number.
- **Layer**: the engine, `src/positions.js` (`indexBlock` writes `block: b` into every entry).
- **Fix**: keep the part block-relative and stamp the block when the parts are laid end to end. A keystroke moves no block, so the round's measurement does not meet it; an Enter or a paste at the top level does.
- **State**: CLOSED 2026-10-25 by the engine, BelType's merge 8c6d8777 (`indexBlocks` stamps a moved block's kept part with its new number): the same paste reads the index parts of the 2 new blocks only and keeps 4, and an Enter at the end of the running element reads 1 and keeps 7 (docs/results.md, "The reach of a whole box").

### The running elements are found by a walk with no part

- **Seen**: the showcase under `--reach 0`, 2026-10-25: of the originals' reading of a keystroke (1.9 to 2.4 ms), the intake's blocks and running elements are 1.4 to 1.6 ms, since `runningBoxes` asks the computed style of every element at any depth and takes no `keep`.
- **Layer**: the engine, `src/driver.js` (`runningBoxes`).
- **Fix**: the running elements of a top-level box as its part, through the same door.
- **State**: CLOSED 2026-10-25 by the engine, BelType's merge 8c6d8777 (`runningBoxes(doc, keep)`), the originals handing it `memo.keep` (94609a3): on the showcase the intake's blocks and running elements take 0.2 to 0.4 ms of a keystroke's reading against 1.3 to 3.8 before, the `running` walk keeping 13 boxes and reading 1.

### A sibling combinator's left side is read with its `:is()` taken out

- **Seen**: the studio's quiet press under the view, 2026-10-25, the round *the reach of a whole box*: `topLevelReach` answers 1 through one rule of the demo's sheet, `:is(header, h2, h3, figure, blockquote, ul, ol, table, section) > p:first-child, :is(h2, h3, figure, blockquote, ul, ol, table, header) + p`. The reading takes the pseudo-classes out of a compound before asking whether it can be a top-level box, so `:is(h2, …)` is matched as `*`, and every one of the eight top-level boxes (`section.titlepage`, `nav.contents`, six `article.chapter`) answers yes, though none is an `h2` or any of the list, and no top-level box is a `p`. So a keystroke forgets the boxes from the edited one on: a third in, in the fifth of eight boxes, the memo keeps the parts of the 4 boxes before it and reads the 4 from it on, where 0 would read 1.
- **Layer**: the engine, `src/capture.js` (`stripPseudos`, the `top` question of `topLevelReach`), conservative by its own header.
- **Fix**: match a `:is()` or `:where()` argument as it stands instead of taking it out, or ask the right side of a `+` or `~` too (a top-level box must be able to match it for the rule to relate two top-level boxes). The engine's to decide. The cost on the quiet press is not seen: its keys are bound by the frame on both sides (a character a third in, 32 ms against 32.8, settled in 13.9 against 14.3).
- **State**: CLOSED 2026-10-28 by the engine, BelType's merge a76ec341 (its CHANGELOG, *the reach reads a plain wrapper as it stands*): `topLevelReach` keeps a `:is()`, `:where()` or `:not()` whose argument is plain compounds and matches it as it stands; a wrapper holding a pseudo-class or a combinator is still taken out. The quiet press reads 0 for a whole top-level box (`sheetReach` stays 1). `scripts/specimen.mjs` on the quiet press with `--edits 'key:3;delete:3;paste;enter;start;end'`, normal and `--bare`: 30 pages under the CLI and the view, no difference; every edit equal to a fresh fill on 30 of 30 pages and states; a keystroke now keeps 7 of the 8 boxes' parts (the Enter at 182 read 1 and still equalled the fresh fill; which rule gave that 1 is not traced).

### The unit of a kept part is the top-level box, and a Markdown document has few

- **Seen**: the round *the originals keep their parts*, 2026-10-25: BelType's body articulates as nested `<section>` elements, so a document's top-level boxes are its outermost sections: the chrome fixture has 2 top-level nodes (its running element and one section), the specimen 7, the showcase 14 (13 blocks and a running element). A keystroke renders and reads again the whole chapter it stands in, under any reach.
- **Layer**: the engine, `src/forcing-memo.js` (`keep` takes the top-level box) and the walks that ask it per top-level block; and this package, which renders per top-level node.
- **Fix**: a part per box at a depth the host names, the engine's question; this package's per-node rendering would follow it down.
- **State**: OPEN, a question for a later round.

## The studio's wiring

### Roundtrip's re-parse check cannot hold under structured marks

- **Seen**: `npm run roundtrip` under the generic schema, with or without the switch, on 2026-10-24: the "re-parse equals the state" part fails on all four demos that have a data block, because structured marks mint a fresh instance id on every parse, and with plain marks the check's own parse drops the body's leading whitespace. The source-against-saved-body and body-against-page parts hold (quiet-press 619 nodes, report 874, manuale 1 159; the bill differs only in its data block, `giorni` 0 against 61, on `main` too). The check also crashes on the three demos without a data block, on `main` as well.
- **Layer**: the studio's wiring, `scripts/roundtrip.mjs`.
- **Fix**: compare after renumbering instance ids in order of first appearance, parse the serialization inside a `<body>` tag so the leading whitespace survives, and guard the demos without a data block.
- **State**: CLOSED 2026-10-25, the studio's `round/the-checks-see-the-view` (studio main 9db717d): instance ids renumbered in order of first appearance, the serialization parsed inside a `<body>`, the demos without a data block guarded; the quiet press, the report and the manuale equal on all three paths, the bill's re-parse leg holds, the schema lab's still fails (an instance written as two elements comes back as two).

### The studio's checks cannot see the view

- **Seen**: every check of the studio README's "Checks" section, and the panes' checks, run against a server whose default is the switch (`STUDIO_VIEW=fragmented`), each check's load gate (`__beltypeCicero.last.pages > 0`) rewritten by the runner to also pass when the view's chain has settled. Two pass: `roundtrip` and `generic-schema` (they read the state and the schema, never the pages). The rest stop within seconds on the old orchestrator's surface: `__beltypeCicero.buildAll` (typing:timings, the screens, marks, nested-lists, inline-atoms, sub-sup, inline-lists, generic-schema-edits, selection, amendments, print, repeat:check, values:check's paint-check), `eng.box` (lists), `<beltype-root>` (typing:limits, verbatim, facsimile, integration, resources), the engine's last result (typing, collab:pages, collab:together). `identity` timed out; `structure` asks a server on a port of its own (48801) and did not run. On the old path the same run passed roundtrip, typing, typing:timings and the two screens checks; identity, verbatim (two running-head assertions, the stale margin-box reading the README names) and typing:limits (a script error, `mouse.click: x: expected float, got undefined`) fail there too; the rest were not reached before the round stopped the pass.
- **Layer**: the studio's wiring, `scripts/page-helpers.js` and each check's own reads of the pages.
- **Fix**: one page reader for both paths in `page-helpers.js` (the pages as `.fragview > beltype-page` or the root's, a position's point through `studio.view.domAtPos` or `positions.js`, "settled" as the view's chain or the patcher), so a check proves the view; `scripts/fragview-pages.mjs` and `scripts/fragview-keys.mjs` already read both.
- **State**: CLOSED 2026-10-25, the studio's `round/the-checks-see-the-view` (studio main 9db717d): one reader in `scripts/page-helpers.js` for both paths, every check on it, a skip or a known difference named where the view lacks or differs by design; 43 of 65 checks pass under the view where 2 did, the typing sessions 61 of 61 on every path; the table is the studio's `notes/fragview-checks.md`.

### A value written from the pane reaches the authority as four steps under the view

- **Seen**: `npm run binds` under the switch: "the edit reached the authority as one batch: a replace per field (2) and the one SetValueStep last" fails, the batch holding replace, replace, replace, setValue. Not traced in the round; the write path is the studio's (`values.js`'s `fieldTransaction`, `store.js`'s `fieldsIn`, which reads the fields from the document's DOM and leaves out every element inside `[data-beltype~="fragment"]`, a word the view's renderer writes on every divided piece).
- **Layer**: the studio's wiring, `src/store.js` and `src/values.js`, until traced.
- **Fix**: read the fields from the state, not the page's DOM, under the view.
- **State**: OPEN.

### The bill's images were asked at the studio's origin

- **Seen**: the bill under the view (the view's entry on the page serializer).
- **Layer**: the studio's wiring, `src/fragmented.js`.
- **Fix**: the provider's page serializer is put in the schema's cache (`schema.cached.domSerializer`), which the view's renderer reads; the images load, and every page count measured before is unchanged.
- **State**: CLOSED, 84d62c6 (the view's door is still owed).

### The amendments pane read the engine's root

- **Seen**: `?amend=1&view=fragmented`: `engine(...).box is not a function` on the first read of the caret's block.
- **Layer**: the studio, `src/veneer.js`.
- **Fix**: the pane reads a geometry (`studio.geometry`), the engine's root and originals on the old path and the view's answers under the switch.
- **State**: CLOSED, 1cd062c.

### The register's stand-in view focused the engine's root

- **Seen**: by reading: `verbs.js`'s `view.focus()` focuses `<beltype-root>`, absent under the switch.
- **Layer**: the studio, `src/verbs.js` through `src/fragmented.js`.
- **Fix**: the stand-in focuses the view.
- **State**: CLOSED, 19c06e2.

### The showcase's page 25 paragraph has no `<code>` under the studio's schema

- **Seen**: measured 2026-10-25, the showcase's paragraph "A string is not only for the margins…" on page 25: the source holds three `<code>` elements (`string()`, `::before`, `::after`), and so do the CLI's page and the view's page under the generic ground; the old path and `?view=fragmented&schema=studio` draw the paragraph without them, 74.69 px tall against 77.69. So the witness's page 25 holds 245 words where the CLI's holds 222, and the view gives 245 under the studio's schema and 222 under the generic ground. Page 13 differs between the witness and the CLI the same way (282 words against 284), not traced.
- **Layer**: the studio's schema (`src/schema.js`) or its page serializer, not traced.
- **Fix**: compare the witness against the CLI's pages before reading a difference from it as the view's.
- **State**: OPEN.

### The fragmented view installs no Ledger

- **Seen**: by building the Ledger, 2026-10-25: the reads loop, the chrome of the pages an edit does not refill and the Ledger's rows need `ledger()` among the state's plugins, and the studio's mount (`src/fragmented.js`, line 171, beside `collapsedSpaces()`) does not install it, so under `?view=fragmented` the studio's pages show no `target-counter()` or `target-text()` value and keep their chrome on an edit, as before the round. The round measured the reads through the harness instead (docs/results.md, "The Ledger is state").
- **Layer**: the studio's wiring, `src/fragmented.js`.
- **Fix**: one line: `ledger()` from `prosemirror-beltype` among the plugins the mount adds.
- **State**: CLOSED 2026-10-25, studio f54ba3c: the mount installs `ledger()` beside `collapsedSpaces()`.
