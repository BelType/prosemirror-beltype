/**
 * `ciceroContainers(document, options)`, the factory: a `ContainerFactory` that hands the fragmented view a `CiceroPage` for every entry of its chain.
 *
 * @remarks
 * The geometry table is read once, when the factory is made (`readGeometryTable`, after `registerGcpmProperties`, as the driver reads it at a run's start), and every page is one of its geometries: the page named by the hint the fill before it left (`hintAfter`), or the first page's, and in any case named again by its own content when it fills, since the driver names a page by the content at its start (C8). A blank page is a page the hint says nothing flows onto.
 *
 * The factory takes the one-round host's intake duty for a facsimile (`seam/client.js`, `takeFacsimile`): when a page's slice first puts a PDF `<object>` in the document, the engine's `seam/facsimile.js` is loaded and its `install` awaited before the slice is measured, which reads every embedded page's size and registers the presenter in this package's registry (`takeFacsimile` below). The check is made per slice and not when the factory is made, because a host may make the factory over a document that holds no PDF yet: the studio's `prepare` takes the provider's drawing out of the body before the view is mounted, and the page's own law copy is the first PDF `<object>` the document holds again. A document without one pays nothing, and pdf.js is not fetched.
 *
 * No reads in this phase: a page carries no folio, no `counter(pages)`, no named strings and no running element in its margins, and the author's counters are not delivered at its start (`setCounters` with `page N` is phase 2's, docs/plan.md). The table is read from the document's sheets as the host left them; a host that rewrote its sheets for Cicero (`rewriteDocumentSheets`) has done so before the factory is made.
 *
 * @packageDocumentation
 */

import { readGeometryTable, registerGcpmProperties } from '@egildo/beltype-engine-cicero/src/capture.js';
import { assertRenderConditions } from '@egildo/beltype-engine-cicero/src/measure.js';
import { present } from '@egildo/beltype-engine-cicero/src/presenters.js';
import { CiceroPage } from './cicero-page.js';

/** @import { ContainerFactory } from 'prosemirror-fragview/src/fragmentainer.js' */

/**
 * @param {Document} [document]
 * @param {object} [options]
 * @param {ReturnType<typeof readGeometryTable>} [options.table] A geometry table the host already read; read from the document when omitted.
 * @param {boolean} [options.relaxDpr] Pass the engine's render-condition check at a device pixel ratio other than 1, as the CLI's preview does (I5); the default.
 * @returns {ContainerFactory}
 */
export function ciceroContainers(document = globalThis.document, { table, relaxDpr = true } = {}) {
  assertRenderConditions(document, { relaxDpr });
  registerGcpmProperties(/** @type {any} */ (document.defaultView));
  const geometry = table ?? readGeometryTable(document);
  const intake = () => takeFacsimile(document);
  return (index, hint) => new CiceroPage({ table: geometry, index, hint, document, intake });
}

/** The selector of the elements the facsimile presents, as the one-round host's intake asks it (`seam/client.js`, `PDF_OBJECT`). */
const PDF_OBJECT = 'object[type="application/pdf"]';

/** The facsimile module, once its presenter is registered in this package's registry. One per module instance, as the registry is. @type {Promise<typeof import('@egildo/beltype-engine-cicero/seam/facsimile.js')> | null} */
let facsimile = null;

/**
 * The one-round host's intake for a facsimile, taken for what the document holds now: the module loaded and its presenter registered the first time the document holds a PDF `<object>`, and the size of every page the document then embeds read, so a copy made after it is given the page's ratio synchronously.
 *
 * @remarks
 * `install` is called once with this package's `present` and after that with none, since a second registration would be a second presenter for the same selector; the sizes it reads are the module's own cache, which `make` reads. In BelType's own page (the measurement's harness) the page's copy of the engine has loaded the module, defined `beltype-facsimile` and registered the presenter in its own registry already: `install` guards the element's definition, so the class that draws is the page's, and the registry and the size cache this package's copy reads are filled here.
 * @param {Document} doc
 * @throws {Error} when the module cannot load, as the one-round host refuses the run, or when a source has no fallback `alt` (`install`'s refusal).
 */
export async function takeFacsimile(doc) {
  if (!doc.querySelector(PDF_OBJECT)) return;
  const first = !facsimile;
  facsimile ??= import('@egildo/beltype-engine-cicero/seam/facsimile.js').then(
    async (module) => { await module.install(doc, present); return module; },
    (error) => { throw new Error(`BelType/Cicero: the document embeds a PDF and the module that draws it did not load (${error?.message ?? error})`); }
  );
  const pending = facsimile;
  // A failed intake is tried again by the next slice, as the client's is.
  pending.catch(() => { if (facsimile === pending) facsimile = null; });
  const module = await pending;
  if (!first) await module.install(doc, () => {});
}
