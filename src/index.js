/**
 * `prosemirror-beltype`: BelType's fragmentainer for `prosemirror-fragview`. The exports are the page (`CiceroPage`, the working name, kept in this one place), its factory (`ciceroContainers`), and the arithmetic of a turn (`turn.js`), which the tests pin; the plan is `docs/plan.md`.
 *
 * @packageDocumentation
 */

export { CiceroPage } from './cicero-page.js';
export { ciceroContainers } from './containers.js';
export { FIRST_SPAN, firstSpan, parityAt, conditionOf, hintAfter, hintAfterBlank, enter, wordPoint, placeAt, verdictPosition, wholeAfter, advances, inFlowStart } from './turn.js';
