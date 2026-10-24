// usage: node scripts/specimen.mjs [target] [--headed] [--keep] [--bare] — the target is a path BelType's CLI takes, relative to its repository's root, `./test/specimen.md` by default; phase 1's measurement, one engine, two hosts, one answer. BelType's dev server serves the specimen under Cicero on a free port; Chromium opens it headless and waits for the CLI's round to be whole; every page the root presents is read (first and last visible word); then this package's harness is loaded from Vite into the same page, the view is mounted beside the root over the same served document and filled whole, and its pages are read the same way. Prints the pages side by side, the first difference, what every divided piece's edges show on each side (its pseudo-elements' computed style), and the console's warnings on each side; docs/results.md records them. `--bare` takes every adopted sheet off the document after the CLI's pages are read and before the view is mounted, the CLI's root's among them, so the view is measured in a document no root has dressed.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer as createNetServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const BELTYPE = '/Users/egildo/Privata/dev/beltype';
const root = fileURLToPath(new URL('..', import.meta.url));
const headed = process.argv.includes('--headed');
const bare = process.argv.includes('--bare');
const target = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? './test/specimen.md';

/** The ports no measurement may take: the engine repository's preview seats, and the ones Egildo keeps for other work. */
const launch = JSON.parse(readFileSync(`${BELTYPE}/.claude/launch.json`, 'utf8'));
const RESERVED = new Set([48760, 48761, 48762, 48789, 48791, 48792, 48794, 48796, 48798, 5173, ...launch.configurations.map((c) => c.port).filter(Boolean)]);

/** @returns {Promise<number>} */
async function freePort() {
  for (;;) {
    const port = await new Promise((resolve, reject) => {
      const probe = createNetServer().once('error', reject).listen(0, '127.0.0.1', () => {
        const { port } = /** @type {import('node:net').AddressInfo} */ (probe.address());
        probe.close(() => resolve(port));
      });
    });
    if (!RESERVED.has(port)) return port;
  }
}

const P = await freePort();
const beltype = spawn(process.execPath, ['bin/beltype.js', target, '--engine', 'cicero', '--port', String(P)], { cwd: BELTYPE, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
beltype.stdout.on('data', (d) => { serverLog += d; });
beltype.stderr.on('data', (d) => { serverLog += d; });
const V = await freePort();
const vite = await createServer({ root, logLevel: 'error', server: { port: V, strictPort: true, host: '127.0.0.1' } });
await vite.listen();
let browser;

try {
  const url = `http://127.0.0.1:${P}/`;
  for (let i = 0; ; i++) {
    try { if ((await fetch(url)).ok) break; } catch {}
    if (i > 600) throw new Error(`BelType's dev server did not answer on ${url}:\n${serverLog}`);
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  /** The console's messages, by side: the CLI's round until the harness is loaded, the view's after. */
  const consoles = { cli: [], view: [] };
  let side = 'cli';
  page.on('console', (m) => { if (['warning', 'error', 'info'].includes(m.type())) consoles[side].push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => consoles[side].push(`pageerror: ${e.message}`));
  await page.goto(url);
  await page.waitForFunction(() => window.__beltypeCicero?.last?.complete === true, null, { timeout: 120000 });
  const cliMs = await page.evaluate(() => window.__beltypeCicero.last.ms);
  await page.evaluate(async () => { await document.querySelector('beltype-root').buildAll?.(); });

  side = 'view';
  await page.addScriptTag({ type: 'module', url: `http://127.0.0.1:${V}/harness/specimen.js` });
  await page.waitForFunction(() => window.__prosemirrorBeltype, null, { timeout: 60000 });
  // The rim's late truth after the reference is read is the CLI's business, not this measurement's: the host takes it, so no second run of the engine shares the measure context with the view's fills.
  await page.evaluate(() => { window.__lateTruth = []; document.addEventListener('beltype:change', (e) => { window.__lateTruth.push(e.detail?.kind); e.preventDefault(); }); });
  const reference = await page.evaluate(() => window.__prosemirrorBeltype.readPages(window.__prosemirrorBeltype.rootPages()));
  const referenceDressing = await page.evaluate(() => window.__prosemirrorBeltype.dressingOf(window.__prosemirrorBeltype.rootPages()));
  const view = await page.evaluate((bare) => window.__prosemirrorBeltype.mount({ bare }), bare);
  const lateTruth = await page.evaluate(() => window.__lateTruth);

  const n = Math.max(reference.length, view.pages.length);
  const cell = (s) => (s == null ? '·' : `\`${s}\``);
  console.log(`\n## ${target}${bare ? ' (bare)' : ''}, ${reference.length} pages under the CLI, ${view.pages.length} under the view\n`);
  console.log(`The CLI's last \`run()\` call ${Math.round(cliMs)} ms (its bootstrap cuts the first screen, then the rest); the view's chain ${Math.round(view.ms)} ms over ${view.fills.length} fills; doc size ${view.docSize}.\n`);
  console.log('| Page | CLI first | CLI last | words | view first | view last | words | entry | fill | same |');
  console.log('| ---: | :-- | :-- | ---: | :-- | :-- | ---: | :-- | :-- | :-- |');
  let first = null;
  for (let i = 0; i < n; i++) {
    const a = reference[i], b = view.pages[i], e = view.entries[i];
    const fill = [...view.fills].reverse().find((f) => f.index === i);
    const same = !!a && !!b && a.first === b.first && a.last === b.last;
    if (!same && first == null) first = i;
    console.log(`| ${i + 1} | ${cell(a?.first)} | ${cell(a?.last)} | ${a?.count ?? '·'} | ${cell(b?.first)} | ${cell(b?.last)} | ${b?.count ?? '·'} | ${e ? `${e.from}–${e.to ?? 'end'}` : '·'} | ${fill ? `${fill.kind ?? ''}${fill.cls ? ` ${fill.cls}` : ''} ${fill.name || '(unnamed)'}${fill.next?.blank ? ', blank next' : ''}` : '·'} | ${same ? 'yes' : '**no**'} |`);
  }
  console.log(`\nPage sizes, CLI: ${reference.map((p) => p.size.join('×')).join(', ')}`);
  console.log(`Page sizes, view: ${view.pages.map((p) => p.size.join('×')).join(', ')}`);
  const objects = (pages) => pages.map((p, i) => (p.objects ?? []).map((o) => `page ${i + 1} ${o.is} ${o.size.join('×')}`)).flat().join(', ') || 'none';
  console.log(`\nObjects, CLI: ${objects(reference)}`);
  console.log(`Objects, view: ${objects(view.pages)}`);
  const dressing = (pieces) => pieces.map((d) => `  page ${d.page} ${d.edge} ${d.el}: ${d.edge === 'cut-off' ? `::after ${d.after}` : `::before ${d.before}${d.marker != null ? `, ::marker ${d.marker}` : ''}, ::first-letter ${d.firstLetter}, ::first-line ${d.firstLine}, own ${d.own}`}`).join('\n') || '  none';
  console.log(`\nDivided pieces' edges, CLI:\n${dressing(referenceDressing)}`);
  console.log(`\nDivided pieces' edges, view:\n${dressing(view.dressing)}`);
  if (bare) console.log(`\nAdopted sheets taken off before the view was mounted (${view.removed.length}):\n${view.removed.map((s) => `  ${s}`).join('\n') || '  none'}`);
  console.log(`\nAdopted sheets after the view settled (${view.adopted.length}):\n${view.adopted.map((s) => `  ${s}`).join('\n') || '  none'}`);
  console.log(`\nFirst difference: ${first == null ? 'none' : `page ${first + 1}`}`);
  if (!view.settled) console.log(`\n**The view's chain did not settle**: ${view.fills.filter((f) => f.error).map((f) => `page ${f.index + 1}: ${f.error}`).join('; ') || 'timed out'}`);
  console.log(`\nFills:\n${view.fills.map((f) => `  ${f.index + 1}: ${Math.round(f.ms)} ms ${JSON.stringify({ from: f.from, to: f.to, kind: f.kind, cls: f.cls, y: f.y && Math.round(f.y * 100) / 100, pageStart: f.pageStart, usedPx: f.usedPx && Math.round(f.usedPx * 100) / 100, extPx: f.extPx && Math.round(f.extPx * 100) / 100, next: f.next })}`).join('\n')}`);
  const unique = (xs) => [...new Set(xs)];
  console.log(`\nConsole, CLI (${consoles.cli.length}):\n${unique(consoles.cli).map((m) => `  ${m.slice(0, 300)}`).join('\n')}`);
  console.log(`\nConsole, view (${consoles.view.length}):\n${unique(consoles.view).map((m) => `  ${m.slice(0, 300)}`).join('\n')}`);
  console.log(`\nLate truth taken from the rim after the reference: ${JSON.stringify(lateTruth)}`);
  if (process.argv.includes('--keep')) await new Promise(() => {});
} finally {
  await browser?.close();
  await vite.close();
  beltype.kill();
}
