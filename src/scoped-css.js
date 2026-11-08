/**
 * `warnScopedRules(document, host)`, the dev check on content CSS scoped under the editor's element: a warning on the console for every selector of the document's sheets that dresses content only under the host.
 *
 * @remarks
 * Content CSS is document-level (ruled 2026-11-08): Cicero measures every page in its own container at the end of `body` (`#__beltype-measure`, the engine's `measure.ts`), and the chain's one rendering of the whole state (`Originals`, `originals.js`) sits outside the host too. A rule such as `.ProseMirror p` or `#editor table` dresses what the reader sees and not what the engine measured, so the cuts are wrong. The check reads the document's sheets once, `@media`, `@layer`, `@supports` and `@import` bodies included, and skips a sheet that throws on `cssRules` (a cross-origin one) silently.
 *
 * A selector is split on its top-level commas and, at every descendant or child combinator outside parentheses, brackets and strings, its left part is tested: it warns when that part matches the host (`host.matches`) and does not match a probe, a bare `div` appended to `body` where the measure stands, so `div p`, `* > p` or `body > div p` reach the measure too and pass. A left part wrapped in `:is()` or `:where()` (`:is(#host) p`) is caught, since `matches` reads it. Not parsed: a combinator inside such a wrapper (`:is(#host p)`, `:where(.editor table) td`), since the scan passes over parentheses; a nested rule (`&`), tested by its own `selectorText` as the browser gives it; a left part whose state is momentary (`#host:focus p`), tested as the host is at mount. A sibling combinator (`+`, `~`) is not a scope and is passed over.
 *
 * @packageDocumentation
 */

/** The highlight pseudo-elements, which paint and never lay out, so a rule on one scoped under the host cuts nothing differently (the view's own `.fragview ::selection`). */
const PAINT_ONLY = /::(selection|highlight\(|spelling-error|grammar-error|target-text)/;

/** How many selectors are named before the rest are counted. */
const LIMIT = 10;

/**
 * Warn, once per offending selector and at most `LIMIT` times, for every rule of the document's sheets scoped under `host`.
 * @param {Document} document
 * @param {Element} host The view's element, the parent of its pages.
 * @returns {string[]} The offending selectors, every one, named or counted.
 */
export function warnScopedRules(document, host) {
  if (typeof console === 'undefined' || typeof console.warn !== 'function') return [];
  const probe = document.body.appendChild(document.createElement('div'));
  /** @type {Set<string>} */
  const found = new Set();
  try {
    for (const sheet of Array.from(document.styleSheets)) walk(sheet, host, probe, found);
  } finally {
    probe.remove();
  }
  const all = [...found];
  for (const selector of all.slice(0, LIMIT)) console.warn(`prosemirror-beltype: the rule "${selector}" is scoped under the editor's element and does not reach the engine's measure, which lays out every page outside it; make it document-level, or the page the reader sees differs from the one that was cut.`);
  if (all.length > LIMIT) console.warn(`prosemirror-beltype: ${all.length - LIMIT} more rules are scoped under the editor's element; the first ${LIMIT} were named.`);
  return all;
}

/**
 * @param {CSSStyleSheet | CSSRule} owner A sheet or a rule that may hold rules.
 * @param {Element} host
 * @param {Element} probe
 * @param {Set<string>} found
 */
function walk(owner, host, probe, found) {
  /** @type {CSSRuleList | undefined} */
  let rules;
  try {
    rules = /** @type {any} */ (owner).cssRules;
  } catch {
    return;
  }
  for (const rule of Array.from(rules ?? [])) {
    const selectorText = /** @type {any} */ (rule).selectorText;
    if (typeof selectorText === 'string') for (const selector of split(selectorText, ',')) if (scoped(selector, host, probe)) found.add(selector);
    const imported = /** @type {any} */ (rule).styleSheet;
    if (imported) walk(imported, host, probe, found);
    walk(rule, host, probe, found);
  }
}

/**
 * Whether a descendant or child combinator of the selector has, on its left, a part that matches the host and not the probe.
 * @param {string} selector
 * @param {Element} host
 * @param {Element} probe
 */
function scoped(selector, host, probe) {
  if (PAINT_ONLY.test(selector)) return false;
  for (const at of combinators(selector)) {
    const left = selector.slice(0, at);
    try {
      if (host.matches(left) && !probe.matches(left)) return true;
    } catch {
      // A left part `matches` refuses (a pseudo-element before the combinator) scopes nothing it can test.
    }
  }
  return false;
}

/**
 * The selector's pieces between top-level occurrences of `sep`, trimmed.
 * @param {string} text
 * @param {string} sep
 */
function split(text, sep) {
  const parts = [];
  let start = 0;
  scan(text, (c, i) => {
    if (c === sep) parts.push(text.slice(start, i)), (start = i + 1);
  });
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Where every top-level descendant or child combinator starts, a run of spaces and `>` with no `+` or `~` in it.
 * @param {string} selector A trimmed selector.
 * @returns {number[]}
 */
function combinators(selector) {
  /** @type {number[]} */
  const starts = [];
  let run = -1;
  let sibling = false;
  scan(selector, (c, i) => {
    const isComb = /\s/.test(c) || c === '>' || c === '+' || c === '~';
    if (isComb) {
      if (run < 0) (run = i), (sibling = false);
      if (c === '+' || c === '~') sibling = true;
    } else if (run >= 0) {
      if (!sibling) starts.push(run);
      run = -1;
    }
  });
  return starts;
}

/**
 * Call `visit` with every character of `text` at depth 0, outside parentheses, brackets, strings and escapes.
 * @param {string} text
 * @param {(c: string, i: number) => void} visit
 */
function scan(text, visit) {
  let depth = 0;
  /** @type {string | null} */
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\\') { i++; continue; }
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (depth === 0) visit(c, i);
  }
}
