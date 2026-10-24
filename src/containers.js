/**
 * `ciceroContainers(document, options)`, the factory: a `ContainerFactory` that hands the fragmented view a `CiceroPage` for every entry of its chain.
 *
 * @remarks
 * The geometry table is read once, when the factory is made (`readGeometryTable`, after `registerGcpmProperties`, as the driver reads it at a run's start), and every page is one of its geometries: the page named by the hint the fill before it left (`hintAfter`), or the first page's, and in any case named again by its own content when it fills, since the driver names a page by the content at its start (C8). A blank page is a page the hint says nothing flows onto.
 *
 * No reads in this phase: a page carries no folio, no `counter(pages)`, no named strings and no running element in its margins, and the author's counters are not delivered at its start (`setCounters` with `page N` is phase 2's, docs/plan.md). The table is read from the document's sheets as the host left them; a host that rewrote its sheets for Cicero (`rewriteDocumentSheets`) has done so before the factory is made.
 *
 * @packageDocumentation
 */

import { readGeometryTable, registerGcpmProperties } from '@egildo/beltype-engine-cicero/src/capture.js';
import { assertRenderConditions } from '@egildo/beltype-engine-cicero/src/measure.js';
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
  return (index, hint) => new CiceroPage({ table: geometry, index, hint, document });
}
