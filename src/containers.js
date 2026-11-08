/**
 * `ciceroContainers(document, options)`, the factory: a `ContainerFactory` that hands the fragmented view a `CiceroPage` for every entry of its chain.
 *
 * @remarks
 * The geometry table is read once, when the factory is made (`readGeometryTable`, after `registerGcpmProperties`, as the driver reads it at a run's start), and every page is one of its geometries: the page named by the hint the fill before it left (`hintAfter`), or the first page's, and in any case named again by its own content when it fills, since the driver names a page by the content at its start (C8). A blank page is a page the hint says nothing flows onto.
 *
 * The factory takes the one-round host's intake duty for a facsimile (`seam/client.js`, `takeFacsimile`): when a page's slice first puts a PDF `<object>` in the document, the engine's `seam/facsimile.js` is loaded and its `install` awaited before the slice is measured, which reads every embedded page's size and registers the presenter in this package's registry (`takeFacsimile` below). The check is made per slice and not when the factory is made, because a host may make the factory over a document that holds no PDF yet: the studio's `prepare` takes the provider's drawing out of the body before the view is mounted, and the page's own law copy is the first PDF `<object>` the document holds again. A document without one pays nothing, and pdf.js is not fetched.
 *
 * The Cicero page's host wears the engine's dressing, and not the view's continuation sheet (`continuationSheet` in prosemirror-fragview): the engine's rules are keyed on the engine's words at every depth and `!important`, and what a divided box shows at its edges is the engine's to say, so the factory ensures the words sheet (`ensureDressing`, which the measure context also seats) and the continuation dressing (`ensureContinuationDressing`, the five rules that withhold a resumed piece's `::before`, `::marker`, `::first-letter` and `::first-line` and a cut-off piece's `::after`) as it checks the render conditions. No root runs under the view, so nothing else adopts them (docs/found.md, "Resumed pieces wear no dressing sheet", closed 2026-10-25).
 *
 * At the first fill the factory reads the document's sheets once and warns on the console for a rule scoped under the view's element (`warnScopedRules`, `scoped-css.js`), since the engine measures every page outside it.
 *
 * The page wears its chrome (phase 2's first round, docs/results.md, "The page wears its chrome"): the factory owns the chain's one rendering of the whole state (`Originals`, `originals.js`), from which every page reads its counters at its first word, its named strings and running elements over its interval, and the chain's total once a page runs to the document's end; the factory hands it to every page and exposes it as `originals` on the function it returns. The factory also owns the chain object (`Chain`, `chain.js`), which every page is told about and which the Ledger plugin's view finds as `chain` on the function the factory returns: it seats the engine's reads loop around the view and keeps the chrome of the pages an edit does not refill (the round *the Ledger is state*, docs/results.md). A state without the Ledger plugin (`ledger()`, `ledger.js`) gets the pages and their chrome as before and no loop. The table is read from the document's sheets as the host left them, its margin boxes' `content` included; a host that rewrote its sheets for Cicero (`rewriteDocumentSheets`) has done so before the factory is made, and a host whose root presented the document first has had that `content` cleared (`neutralizeMarginBoxes`) and passes the table it read before (`options.table`).
 *
 * @packageDocumentation
 */

import { readGeometryTable, registerGcpmProperties } from '@beltype/cicero/fragmentation';
import { ensureContinuationDressing, ensureDressing } from '@beltype/cicero/fragmentation';
import { assertRenderConditions } from '@beltype/cicero/fragmentation';
import { present } from '@beltype/cicero/fragmentation';
import { CiceroPage } from './cicero-page.js';
import { Originals } from './originals.js';
import { Chain } from './chain.js';
import { warnScopedRules } from './scoped-css.js';

/** The factories made, which names the scope of one that is not given a name. */
let factories = 0;

/** @import { ContainerFactory } from 'prosemirror-fragview/src/fragmentainer.js' */

/**
 * @param {Document} [document]
 * @param {object} [options]
 * @param {ReturnType<typeof readGeometryTable>} [options.table] A geometry table the host already read; read from the document when omitted.
 * @param {string} [options.scope] A name for this view in its document, which keeps its hidden holder apart from another view's; unique per factory when omitted.
 * @param {boolean} [options.relaxDpr] Pass the engine's render-condition check at a device pixel ratio other than 1, as the CLI's preview does (I5); the default.
 * @returns {ContainerFactory & { originals: Originals, chain: Chain }}
 */
export function ciceroContainers(document = globalThis.document, { table, relaxDpr = true, scope = `f${++factories}` } = {}) {
  assertRenderConditions(document, { relaxDpr });
  ensureDressing(document);
  ensureContinuationDressing(document);
  registerGcpmProperties(/** @type {any} */ (document.defaultView));
  const geometry = table ?? readGeometryTable(document);
  const intake = () => takeFacsimile(document);
  const originals = new Originals(document, `__prosemirror-beltype-originals-${scope}`);
  const chain = new Chain({ originals, table: geometry, document });
  let checked = false;
  const mounted = (/** @type {Element} */ host) => {
    if (!checked) (checked = true), warnScopedRules(document, host);
  };
  const factory = (/** @type {number} */ index, /** @type {any} */ hint, /** @type {ReadonlyArray<{ key: number }>} */ entries) => {
    const page = new CiceroPage({ table: geometry, index, hint, document, intake, mounted, originals, chain, key: entries?.[index]?.key ?? null });
    chain.adopt(page);
    return page;
  };
  return Object.assign(factory, { originals, chain });
}

/** The selector of the elements the facsimile presents, as the one-round host's intake asks it (`seam/client.js`, `PDF_OBJECT`). */
const PDF_OBJECT = 'object[type="application/pdf"]';

/** The facsimile module, once its presenter is registered in this package's registry. One per module instance, as the registry is. @type {Promise<typeof import('@beltype/cicero/facsimile')> | null} */
let facsimile = null;

/** The `data` of every PDF `<object>` an intake has taken, so a later slice that holds only these asks nothing again. */
const taken = new Set();

/**
 * The one-round host's intake for a facsimile, taken for what the document holds now: the module loaded and its presenter registered the first time the document holds a PDF `<object>`, and the size of every page the document then embeds read, so a copy made after it is given the page's ratio synchronously.
 *
 * @remarks
 * `install` is called once with this package's `present` and after that with none, since a second registration would be a second presenter for the same selector; the sizes it reads are the module's own cache, which `make` reads. In BelType's own page (the measurement's harness) the page's copy of the engine has loaded the module, defined `beltype-facsimile` and registered the presenter in its own registry already: `install` guards the element's definition, so the class that draws is the page's, and the registry and the size cache this package's copy reads are filled here.
 * `missingAlt: 'warn'` is Egildo's ruling of 2026-11-08: an embed with no fallback `alt` is told once with a `console.warn` naming it and copied with no `aria-label`, so every page still fills and Caster refuses the figure at print. A Cicero before the release that carries the option ignores it and refuses at intake, as before.
 * @param {Document} doc
 * @throws {Error} when the module cannot load, as the one-round host refuses the run, or, under a Cicero without the option, when a source has no fallback `alt`.
 */
export async function takeFacsimile(doc) {
  const urls = [...doc.querySelectorAll(PDF_OBJECT)].map((el) => el.getAttribute('data') ?? '');
  if (!urls.length) return;
  const first = !facsimile;
  // A later intake whose embeds were all taken has nothing to read, and would tell each one with no alt again.
  if (!first && urls.every((url) => taken.has(url))) return;
  facsimile ??= import('@beltype/cicero/facsimile').then(
    async (module) => { await module.install(doc, present, { missingAlt: 'warn' }); return module; },
    (error) => { throw new Error(`BelType/Cicero: the document embeds a PDF and the module that draws it did not load (${error?.message ?? error})`); }
  );
  const pending = facsimile;
  // A failed intake is tried again by the next slice, as the client's is.
  pending.catch(() => { if (facsimile === pending) facsimile = null; });
  const module = await pending;
  if (!first) await module.install(doc, () => {}, { missingAlt: 'warn' });
  for (const url of urls) taken.add(url);
}
