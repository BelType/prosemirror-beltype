# prosemirror-beltype

BelType's fragmentainer for [prosemirror-fragview](https://codeberg.org/egildo/prosemirror-fragview): Cicero's page implementing `fill` over the engine's own objects, with every gap between a one-round host and an editor's view filled the ProseMirror way. The engine is not changed to do this and never learns ProseMirror's name; the view never learns the engine's. This package imports both.

The plan and its phases are in [docs/plan.md](docs/plan.md). The rule it builds under is BelType's decision record [*the engine knows no view*](https://github.com/egildo/beltype/blob/main/.claude/decisions/project/the-engine-knows-no-view.md).

Nothing is built yet. Phase 0, the doors the engine and the view open, is upstream work and gates phase 1.
