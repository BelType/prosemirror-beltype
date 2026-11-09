// usage: node scripts/measure.mjs <fixture folder> [--keys first,mid,last|p1,p2|none] [--n 3] [--pages] [--profile out.cpuprofile] — one run, one JSON line: the CLI round's `run()` ms and page count in BelType's own page, the view's whole fill in ms and fills and pages, and for each page asked the `n` keystrokes' ms (harness `keystrokes`). Run it under the browser lock, three times, from scripts/measure-all.sh. `--pages` adds each host's pages as the harness reads them (`readPages`: first and last word, word count, size), for scripts/verdicts.mjs to compare. `--profile` records Chromium's CPU profile over the keystrokes into the file named, and adds the fills each keystroke ran (page, ms, from, to), for scripts/profile-summary.mjs to read. Serves like scripts/specimen.mjs, a fixture's `../base.css` falling back to fixtures/.
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { ciceroEngine } from '@beltype/cicero/engine';

const root = fileURLToPath(new URL('..', import.meta.url));
const opt = (name, d) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : d);
const folder = path.resolve(process.argv[2]);
const keysAt = opt('--keys', 'last').split(',').filter((k) => k && k !== 'none');
const withPages = process.argv.includes('--pages');
const profileTo = opt('--profile', null);
const nKeys = Number(opt('--n', 3));
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const RESERVED = new Set([48760, 48761, 48762, 48789, 48791, 48792, 48794, 48796, 48798, 5173]);
async function freePort() {
  for (;;) {
    const port = await new Promise((resolve, reject) => {
      const probe = createNetServer().once('error', reject).listen(0, '127.0.0.1', () => { const { port } = probe.address(); probe.close(() => resolve(port)); });
    });
    if (!RESERVED.has(port)) return port;
  }
}
function engineFile(rest) {
  const { files, dirs } = ciceroEngine.vendorAssets();
  if (files[rest]) return files[rest];
  const dir = Object.keys(dirs).find((d) => rest.startsWith(`${d}/`));
  return dir ? path.join(dirs[dir], rest.slice(dir.length + 1)) : null;
}
const P = await freePort();
const beltype = createHttpServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pathname === `/${path.basename(folder)}/`) {
    res.setHeader('content-type', 'text/html');
    return res.end(readFileSync(path.join(folder, 'index.html'), 'utf8').replace(/<head\b[^>]*>/i, (head) => `${head}\n  ${ciceroEngine.headHtml('/')}`));
  }
  let file = pathname.startsWith('/_beltype/') ? engineFile(pathname.slice('/_beltype/'.length)) : path.join(path.dirname(folder), pathname);
  if (file && !existsSync(file)) file = path.join(path.dirname(path.dirname(folder)), pathname);
  if (!file || !existsSync(file) || !statSync(file).isFile()) { res.statusCode = 404; return res.end(); }
  res.setHeader('content-type', TYPES[path.extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => beltype.listen(P, '127.0.0.1', resolve));
const V = await freePort();
const vite = await createServer({ root, logLevel: 'error', server: { port: V, strictPort: true, host: '127.0.0.1' } });
await vite.listen();
let browser;
try {
  browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${P}/${path.basename(folder)}/`);
  await page.waitForFunction(() => window.__beltypeCicero?.run, null, { timeout: 60000 });
  await page.evaluate(() => window.__beltypeCicero.run());
  await page.waitForFunction(() => window.__beltypeCicero?.last?.complete === true, null, { timeout: 3000000 });
  const cliMs = await page.evaluate(() => window.__beltypeCicero.last.ms);
  await page.evaluate(async () => { await document.querySelector('beltype-root').buildAll?.(); });
  const cliPages = await page.evaluate(() => document.querySelectorAll('beltype-page').length);
  await page.addScriptTag({ type: 'module', url: `http://127.0.0.1:${V}/harness/specimen.js` });
  await page.waitForFunction(() => window.__prosemirrorBeltype, null, { timeout: 60000 });
  // The CLI's pages are read before the mount hides its root.
  const cliRead = withPages ? await page.evaluate(() => window.__prosemirrorBeltype.readPages(window.__prosemirrorBeltype.rootPages())) : null;
  await page.evaluate(() => { document.addEventListener('beltype:change', (e) => e.preventDefault()); });
  const view = await page.evaluate(async () => { const v = await window.__prosemirrorBeltype.mount({ timeoutMs: 3000000 }); window.__mountFills = v.fills; return v; });
  const nPages = view.pages.length;
  const pages = withPages ? { cliRead, viewRead: view.pages } : {};
  const keys = {};
  for (const k of keysAt) {
    const p = k === 'last' ? nPages : k === 'first' ? 1 : k === 'mid' ? Math.ceil(nPages / 2) : Number(k);
    const cdp = profileTo ? await page.context().newCDPSession(page) : null;
    if (cdp) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start'); }
    const before = await page.evaluate(() => window.__mountFills.length);
    const typed = await page.evaluate(([p, n]) => window.__prosemirrorBeltype.keystrokes(p, n, true), [p, nKeys]);
    keys[`${k}:${p}`] = typed.map((t) => t.ms);
    if (cdp) {
      const { profile } = await cdp.send('Profiler.stop');
      writeFileSync(profileTo, JSON.stringify(profile));
      keys[`${k}:${p}:fills`] = await page.evaluate((b) => window.__mountFills.slice(b).map((f) => ({ page: f.index + 1, ms: Math.round(f.ms), from: f.from, to: f.to })), before);
    }
  }
  console.log(JSON.stringify({ fixture: path.basename(folder), load: os.loadavg()[0].toFixed(1), cliPages, cliMs: Math.round(cliMs), viewPages: nPages, viewMs: Math.round(view.ms), fills: view.fills.length, settled: view.settled, keys, errors: errors.slice(0, 3), ...pages }));
} finally {
  await browser?.close();
  await vite.close();
  beltype.closeAllConnections(); beltype.close();
}
