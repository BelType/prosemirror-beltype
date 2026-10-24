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
- **Remains**: the running element is not placed in its margin box, the reads' work (phase 2).

### A facsimile is drawn at the browser's 150 px object height

- **Seen**: the facsimile demo (`?demo=facsimile&view=fragmented`): 5 pages against 6, first difference page 2. The three `<object type="application/pdf">` stand 150 to 152 px tall, Chromium's default for an object, where the root presents each as `<object is="beltype-facsimile">` drawn by pdf.js at the PDF page's size; the full-page landscape attachment is cut to a strip.
- **Layer**: the Cicero page, `src/cicero-page.js` (`show`): the root's presenters (`presenters.js`) run on the root's pieces, and nothing presents the content given through `setContent`.
- **Fix**: present the given content as the root presents its pieces, through the engine's presenter registry, before the trial is measured (the trial must measure the presented size too).
- **State**: CLOSED 2026-10-25, 162760b (the page presents what it renders) and 61bf7ba (the fixture), on `round/the-page-presents-what-it-renders`. The factory takes the facsimile's intake when a slice first holds a PDF `<object>`, and the page presents the trial, the law copy and the shown slice through the engine's registry, so the demo is 6 pages against 6, every page the same, the two in-flow pages 229 × 304 and the landscape page 533 × 400 on both paths, and the facsimile fixture 5 against the CLI's 5 (docs/results.md, "The page presents what it renders").

### No folios, running heads, page totals, cross-references or strings

- **Seen**: every demo: no folio and no running head on any page of the quiet press, the showcase's `counter(pages)` and its `target-counter()` references blank. On the showcase the first page that differs from the old path, page 25, is the one whose paragraph reads `string(family)` in the flow: the string is empty, the line is shorter, and the page holds 11 words more (256 against 245).
- **Layer**: the Cicero page, phase 2 (reads and counters), `src/containers.js` and `src/cicero-page.js`.
- **Fix**: phase 2 as planned.
- **State**: OPEN (known, phase 1's "not done").

### A typed double space collapses on the page

- **Seen**: the quiet press, "A  B" typed in a paragraph: the model holds two spaces, the page draws one (the four characters measure 24 px). The old path draws one too (24 px, `white-space-collapse: collapse` on the page), so it is no regression of the switch; the view alone would have shown two.
- **Layer**: the Cicero page, `src/cicero-page.js` (the page resets the view's `white-space: break-spaces` to the body's, which the trial needs).
- **Fix**: a decision, as phase 1 says: a typed space beside a space as a non-breaking one, or the editing mechanics in the measure context too.
- **State**: OPEN (known, phase 1's "not done").

### Resumed pieces wear no dressing sheet

- **Seen**: by reading, not on a page: under the view no root runs in the document, so the root's dressing sheet (`::before`, `::marker`, `::first-letter`, `::first-line` suppressed on a resumed piece, `::after` on a cut-off one) is never adopted; `document.adoptedStyleSheets` holds none of its rules. No demo shows it yet: none of the 74 resumed pieces of the showcase, nor those of the quiet press, the manuale and the report, has a marker, generated content or a first-letter rule that would print twice.
- **Layer**: the engine's door (`root.js`, `ensureDressingSheet`, private) and this package (`src/containers.js`, which would adopt it). The phase 1 measurement did not meet it because the CLI's own root had run in the same page.
- **Fix**: export the dressing sheet's making from the engine (beside `ensureDressing` in `dressing.js`), and have `ciceroContainers` ensure it as it ensures the render conditions.
- **State**: OPEN (latent).

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

## The engine (BelType)

### The showcase does not print, on either path

- **Seen**: the print dock on the showcase, with and without the switch (the print frame paginates the state itself and never reads the view's pages): `caster: the continuation of section[4] does not mirror its source — section[35]/p[7]/span[0] has 1 element children where its twin at section[4]/p[7]/span[0] has only 0`. The quiet press (30 pages, 190 kB) and the report print under the switch.
- **Layer**: the engine's continuation of an inline element with an element child, or Caster's mirror check (`packages/caster`); not the switch.
- **Fix**: case it in the battery from the showcase's page 4 paragraph 8.
- **State**: OPEN, seen on main too.

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
