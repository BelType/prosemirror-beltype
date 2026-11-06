/**
 * `prosemirror-beltype`: BelType's fragmentainer for `prosemirror-fragview`. The exports are the page (`CiceroPage`, the working name, kept in this one place), its factory (`ciceroContainers`), the chain's rendering of the whole state the chrome is read from (`Originals`, with its pure parts: the position mapping, a page's state and the total), the Ledger as plugin state (`ledger()`, `ledgerKey`, `pageOf`, and the account it gives the reads loop) and the chain object that seats the loop (`Chain`), the arithmetic of a turn (`turn.js`), which the tests pin, and `collapsedSpaces()`, the plugin that promotes a space HTML would collapse to U+00A0 (`spaces.js`); the plan is `docs/plan.md`.
 *
 * @packageDocumentation
 */

export { CiceroPage } from './cicero-page.js';
export { ciceroContainers } from './containers.js';
export { Originals, wordsBeforePoint, wordPositionOf, wordAddressOf, stateOfPage, totalAfter } from './originals.js';
export { ledger, ledgerKey, pageOf, accountOf, keyOf, applyLedger, ledgerToJSON, ledgerFromJSON } from './ledger.js';
export { Chain, Overtaken } from './chain.js';
export { collapsedSpaces } from './spaces.js';
export { wordsOf, firstDifference } from './compare.js';
export { FIRST_SPAN, firstSpan, parityAt, conditionOf, hintAfter, hintAfterBlank, enter, wordPoint, verdictPosition, wholeAfter, advances, inFlowStart } from './turn.js';
