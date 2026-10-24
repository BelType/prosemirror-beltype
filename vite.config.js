/**
 * Vite's configuration for the harness: the engine and the studio's generic schema are imported from linked dev dependencies, and the harness module is loaded into a page another server serves (BelType's dev server, `scripts/specimen.mjs`).
 *
 * @remarks
 * The links resolve to folders outside this root (the engine's package in BelType's repository, the studio's, the fragmented view's), so the server is allowed to read them. Their bare imports would otherwise resolve against their own `node_modules`, a second copy of `prosemirror-model` whose nodes the state and the view here would not recognize: the three pure libraries are deduplicated to this package's copies, as the fragmented view's own configuration does.
 *
 * The facsimile's library: the engine's `seam/facsimile.js` imports pdf.js by URL, `./pdfjs.js` and `./pdfjs-worker.js` beside itself, names BelType's servers answer from the engine's asset table (`vendorAssets()`). Here the module is served from where it lives, so the same two names are answered from the same table, as the studio's configuration answers them.
 *
 * The harness runs in a page of another origin, so a module request carries an `Origin` the server must allow: Vite allows the loopback origins by default, and `cors: true` says so here rather than leaning on the default.
 *
 * @packageDocumentation
 */

import { readFileSync, realpathSync } from 'node:fs';
import { ciceroEngine } from '@egildo/beltype-engine-cicero/seam/index.js';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const linked = (/** @type {string} */ name) => realpathSync(new URL(`node_modules/${name}`, import.meta.url));

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
  resolve: { dedupe: ['prosemirror-model', 'prosemirror-state', 'prosemirror-transform'] },
  server: { cors: true, fs: { allow: [root, linked('beltype-studio-experiment'), linked('@egildo/beltype-engine-cicero'), linked('prosemirror-fragview')] } },
};
