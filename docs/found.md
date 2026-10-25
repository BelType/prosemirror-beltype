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
- **State**: OPEN, round 3's.

### `target-counter()` and `target-text()` read nothing

- **Seen**: the specimen under `--bare`, 2026-10-25: the 15 reads on its pages 1 to 3 (the contents' `p. N`, `Chapter II`) are blank on the view's pages and delivered on the CLI's; without `--bare` the CLI's delivery sheet, adopted on the document, reaches the view's elements too and they show the CLI's values. The showcase's two cross-references, the manual's contents.
- **Layer**: this package, phase 2's third round, over the reads loop of its second (`settleReads` with `run` the view's chain).
- **State**: OPEN, round 3's.

### A page an edit does not refill keeps the chrome it was drawn with

- **Seen**: by reading, 2026-10-25: the chrome is read when a page fills, and an edit refills only the pages the ripple reaches, so a page after them keeps the strings, counters and total it was drawn with. Retitling a chapter's heading on page 3 leaves the old title in the running heads of the pages after it until each refills; the total is the one fact redrawn without a refill (`Originals.settle`).
- **Layer**: this package, phase 2's second round, the reads loop: a state whose reading moved a page's chrome dirties that page or redraws it.
- **Fix**: on a new state, read each live page's state over its interval and redraw the pages whose state moved; the page knows its interval in the old document only, so the view's translated entries are the door (the factory's `entries` argument is the chain when the page was built).
- **State**: OPEN.

### The originals cost a keystroke more than the refill it serves

- **Seen**: measured 2026-10-25 on the studio's showcase, five characters typed on page 3: the rendering of the whole state 1.9 to 5.6 ms and its reading 12.0 to 23.6 ms per transaction, inside `updateState`, so the chain settles in 24.1 to 46.5 ms where `main` settles in 7.6 to 22.8 ms (docs/results.md, "The page wears its chrome", the cost).
- **Layer**: this package, `src/originals.js`.
- **Fix**: proposed, not built: render and read per top-level node, keeping each unchanged node's element, index part and ops part by the node's identity (ProseMirror's nodes are persistent, so an untouched top-level node is the same object), through the engine's own door for kept parts (`indexBlocks` and `documentOpsOf` take a `Keep`, settled by `sheetReach`, *a resumed run keeps its reads*).
- **State**: OPEN.

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

## The studio's wiring

### Roundtrip's re-parse check cannot hold under structured marks

- **Seen**: `npm run roundtrip` under the generic schema, with or without the switch, on 2026-10-24: the "re-parse equals the state" part fails on all four demos that have a data block, because structured marks mint a fresh instance id on every parse, and with plain marks the check's own parse drops the body's leading whitespace. The source-against-saved-body and body-against-page parts hold (quiet-press 619 nodes, report 874, manuale 1 159; the bill differs only in its data block, `giorni` 0 against 61, on `main` too). The check also crashes on the three demos without a data block, on `main` as well.
- **Layer**: the studio's wiring, `scripts/roundtrip.mjs`.
- **Fix**: compare after renumbering instance ids in order of first appearance, parse the serialization inside a `<body>` tag so the leading whitespace survives, and guard the demos without a data block.
- **State**: OPEN.

### The studio's checks cannot see the view

- **Seen**: every check of the studio README's "Checks" section, and the panes' checks, run against a server whose default is the switch (`STUDIO_VIEW=fragmented`), each check's load gate (`__beltypeCicero.last.pages > 0`) rewritten by the runner to also pass when the view's chain has settled. Two pass: `roundtrip` and `generic-schema` (they read the state and the schema, never the pages). The rest stop within seconds on the old orchestrator's surface: `__beltypeCicero.buildAll` (typing:timings, the screens, marks, nested-lists, inline-atoms, sub-sup, inline-lists, generic-schema-edits, selection, amendments, print, repeat:check, values:check's paint-check), `eng.box` (lists), `<beltype-root>` (typing:limits, verbatim, facsimile, integration, resources), the engine's last result (typing, collab:pages, collab:together). `identity` timed out; `structure` asks a server on a port of its own (48801) and did not run. On the old path the same run passed roundtrip, typing, typing:timings and the two screens checks; identity, verbatim (two running-head assertions, the stale margin-box reading the README names) and typing:limits (a script error, `mouse.click: x: expected float, got undefined`) fail there too; the rest were not reached before the round stopped the pass.
- **Layer**: the studio's wiring, `scripts/page-helpers.js` and each check's own reads of the pages.
- **Fix**: one page reader for both paths in `page-helpers.js` (the pages as `.fragview > beltype-page` or the root's, a position's point through `studio.view.domAtPos` or `positions.js`, "settled" as the view's chain or the patcher), so a check proves the view; `scripts/fragview-pages.mjs` and `scripts/fragview-keys.mjs` already read both.
- **State**: OPEN.

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
