/**
 * Vite's configuration for the harness: the engine and the fragmented view are dev dependencies, and the harness module is loaded into a page another server serves (`scripts/specimen.mjs`).
 *
 * @remarks
 * The links resolve to folders outside this root (the engine's package, the fragmented view's), so the server is allowed to read them. Their bare imports would otherwise resolve against their own `node_modules`, a second copy of `prosemirror-model` whose nodes the state and the view here would not recognize: the three pure libraries are deduplicated to this package's copies, as the fragmented view's own configuration does.
 *
 * `FRAGVIEW` names a checkout of the fragmented view to run against instead of the pinned one, for a change not yet pushed.
 *
 * The facsimile's library: the engine's `seam/facsimile.js` imports pdf.js by URL, `./pdfjs.js` and `./pdfjs-worker.js` beside itself, names a page's server answers from the engine's asset table (`vendorAssets()`). Here the module is served from where it lives, so the same two names are answered from the same table.
 *
 * The harness runs in a page of another origin, so a module request carries an `Origin` the server must allow: Vite allows the loopback origins by default, and `cors: true` says so here rather than leaning on the default.
 *
 * @packageDocumentation
 */

import { readFileSync, realpathSync } from 'node:fs';
import { ciceroEngine } from '@beltype/cicero';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const linked = (/** @type {string} */ name) => realpathSync(new URL(`node_modules/${name}`, import.meta.url));

const fragview = process.env.FRAGVIEW && realpathSync(process.env.FRAGVIEW);

const pdfjsFiles = ciceroEngine.vendorAssets().files;
const pdfjs = {
  name: 'pdfjs-vendored',
  configureServer(/** @type {any} */ server) {
    server.middlewares.use((/** @type {any} */ req, /** @type {any} */ res, /** @type {() => void} */ next) => {
      const path = new URL(req.url, 'http://x').pathname;
      const file = path.endsWith('/seam/pdfjs.js') ? pdfjsFiles['cicero/seam/pdfjs.js'] : path.endsWith('/seam/pdfjs-worker.js') ? pdfjsFiles['cicero/seam/pdfjs-worker.js'] : null;
      if (!file) return next();
      res.setHeader('content-type', 'text/javascript');
      res.end(readFileSync(file));
    });
  }
};

export default {
  plugins: [pdfjs],
  resolve: { alias: fragview ? { 'prosemirror-fragview/schema-generic': `${fragview}/harness/schema-generic.js`, 'prosemirror-fragview': `${fragview}/src/index.js` } : {}, dedupe: ['prosemirror-model', 'prosemirror-state', 'prosemirror-transform'] },
  server: { cors: true, fs: { allow: [root, linked('@beltype/cicero'), fragview ?? linked('prosemirror-fragview')] } },
};
