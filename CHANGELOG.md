# Changelog

## Unreleased

A release is published by hand. `scripts/release.sh` installs, tests and publishes from a clean checkout of HEAD, then tags and pushes, signed in to npm with Egildo's security key. `.github/workflows/release.yml` is gone, and with it the token and the provenance attestation; the record is *a release moves three remotes at once*, amended 2026-11-07.

The measurement stands on its own.

- `scripts/specimen.mjs` no longer starts a BelType checkout's dev server. It serves a finished document's folder itself, with the engine's head spliced in as `beltype print` does, and asks the engine for its whole run. `BELTYPE_ROOT` and `BELTYPE_STUDIO` are gone.
- The fixtures are finished HTML, `fixtures/<name>/index.html`, on `fixtures/base.css` and `fixtures/fonts`, which freeze what the old command line put under a document. The specimen is `fixtures/specimen`, and it is the default target. A target is now a folder, so `@beltype/specimens`' documents can be measured too.
- The harness parses with `prosemirror-fragview/schema-generic`. That needs fragview after 0.1.1: until the pin moves, set `FRAGVIEW` to a checkout.

- `CiceroPage` answers `reach`, how far its decision read: every box that can stand on the page, the first textblock of the first in-flow box that cannot, and the whole of a table, flex or grid container it stands in. With `prosemirror-fragview` after 0.1.1, a change in the tail of a divided paragraph now refills the page before it. With an older view the answer is ignored.
- A hint carries its shell and row positions relative to the cut, so a page no longer drops a hint because an earlier edit shifted the document. With `prosemirror-fragview` after 0.1.1, a hint that changes under an equal `to` also fills the next page.
- `collapsedSpaces` no longer binds words: spaces typed one by one at a line's end, then a word, alternate as the same run inserted at once does. They used to stay as two U+00A0 in the saved document.
- A fill that throws no longer stops the chain. The page shows the node at its start unmeasured and answers past it, its account says `failed`, and `chain.settled(doc)` answers incomplete until the page fills.
- A page says what its foot cuts off with no later page to show it: `clipped` in its account, in pixels of the flow and of a parallel flow, and one warning per page.
- A bounded feed that decides nothing takes the node at the page's start whole, with a warning, where it used to take the rest of the document and close the chain.
- The running copies in the margin boxes are `inert`, not editable and not spellchecked.
- The Ledger follows the chain when `setProps` gives the view a new factory.
- `Chain.settles` and `Originals.timings` keep the last 64 records, the settle record holds no document, and the per-state element count is gone.
- The harness gains the edits `throw`, `tail`, `past`, `beyond` and `carried`, and the fixture `clipped`, and `scripts/specimen.mjs` gains `--strict`, which exits with an error when an edited chain differs from a fresh fill.

## 0.1.1 (2026-11-04)

No code change. The first version published by the workflow: a tag `v0.1.1` publishes by trusted publishing, with provenance. Corrected 2026-11-07: npm shows this version published by hand, with no attestation.

## 0.1.0 (2026-11-04)

The first release to npm, published by hand.
