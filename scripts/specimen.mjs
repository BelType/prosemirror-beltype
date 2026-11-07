// usage: node scripts/specimen.mjs [folder holding an index.html, `fixtures/specimen` when omitted] [--headed] [--keep] [--bare] [--no-ledger] [--retitle 'old=>new'] [--edits 'key:3;delete:2;paste;enter;start;end;retitle:old=>new'] [--keys page:n] [--reach 0|1|2] [--overtaken] [--strict] [--dpr n] — the target is a path BelType's CLI takes, relative to its repository's root, `./test/specimen.md` by default; `BELTYPE_ROOT` names the BelType checkout whose CLI is spawned (default `/Users/egildo/Privata/dev/beltype`), so a worktree's engine can run on both sides, the CLI's and the view's (this package's `node_modules/@egildo/beltype-engine-cicero` is the view's); phase 1's measurement, one engine, two hosts, one answer. BelType's dev server serves the specimen under Cicero on a free port; Chromium opens it headless and waits for the CLI's round to be whole; every page the root presents is read (first and last visible word); then this package's harness is loaded from Vite into the same page, the view is mounted beside the root over the same served document and filled whole, and its pages are read the same way. Prints the pages side by side, the first difference, each page's chrome on both sides (every generated margin box's text, read as the browser laid out its `::before` and `::after` through a CDP DOM snapshot, with its slotted running element, and every flow element's generated text, a `target-counter()` read marked as the round 3 difference it is) and the state it is drawn from (each page's interval end in the engine's word positions, its counters, strings and running elements, the CLI's Ledger against the view's fills), what every divided piece's edges show on each side (its pseudo-elements' computed style), and the console's warnings on each side; docs/results.md records them. `--bare` takes every adopted sheet off the document after the CLI's pages are read and before the view is mounted, the CLI's root's among them, so the view is measured in a document no root has dressed. `--no-ledger` mounts the state without the Ledger plugin. `--retitle` and `--edits` edit the view's state by transactions (the harness's `editOf`), and compare each edited state with the view's fresh fill of it after `invalidate()`, which renders the originals whole: the pages' words, margin boxes and flow, each page's chrome state, the originals' reading and the delivered reads. `--keys page:n` types n characters on a page and prints each one's cost, then compares the same way. `--reach` settles the originals' memo under a reach of its own, whatever the sheets say, to measure what each reach keeps beside the engine's reading for a whole top-level box (`topLevelReach`). `--overtaken` mounts the view and fills each pair of neighbouring pages over the one document in one task (the harness's `overtaken`), prints the failures and the law holders left standing, and exits 1 if there are any, reading nothing else. Every run prints the sheets' reach under both units and the rules that give `sheetReach`'s. `--dpr n` lays both sides out at a device pixel ratio of n, 1 by default, which is the ratio print runs at. A run that is not `--overtaken` exits 1 when the guard (`compareHosts`) finds a page where the view's words and the CLI's part, unless `ALLOWED` names that target and that page with its reason; `--strict` adds an edited chain that differs from a fresh fill.
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { ciceroEngine } from '@beltype/cicero/engine';

const root = fileURLToPath(new URL('..', import.meta.url));
const headed = process.argv.includes('--headed');
const bare = process.argv.includes('--bare');
const overtaken = process.argv.includes('--overtaken');
const strict = process.argv.includes('--strict');
const noLedger = process.argv.includes('--no-ledger');
const opt = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const retitle = opt('--retitle');
const keys = opt('--keys');
const forcedReach = opt('--reach') == null ? null : Number(opt('--reach'));
const dpr = Number(opt('--dpr') ?? 1);
const target = process.argv.slice(2).find((a, i, all) => !a.startsWith('--') && !['--retitle', '--keys', '--reach', '--edits', '--dpr'].includes(all[i - 1])) ?? 'fixtures/specimen';

/**
 * The fixtures whose view and CLI are known to hold different words on one page, each with the page and the reason: the default run exits with an error when the guard (`compareHosts`) names any other page, or any page on any other target.
 */
const ALLOWED = {
  multicol: { page: 3, reason: "the CLI's own first slice of the two-column glossary measures the `dl` 9.59 px shorter than its second slice does, and the view's measures it as the second does, so the view's page 3 shows 170 words to the CLI's 174 with the same first and last word (docs/results.md, \"The one word count that differs\")" },
  clipped: { page: 3, reason: 'the fixture is built to differ: a rule scoped to the view\'s own host (`#prosemirror-beltype-view p.taller`) makes the shown page taller than its trial, so the view\'s pages 3 and 4 cut off 108 and 267 px no page shows and say so, and the CLI never wears the rule (docs/results.md, "What the foot cuts off")' }
};

/** The ports no measurement may take: the ones Egildo keeps for other work. */
const RESERVED = new Set([48760, 48761, 48762, 48789, 48791, 48792, 48794, 48796, 48798, 5173]);

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
const folder = path.resolve(target);
if (!existsSync(path.join(folder, 'index.html'))) throw new Error(`${target} holds no index.html: a target is a finished document's folder`);
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf' };
/** The file a `/_beltype/` path names, from the engine's own table of what a page asks it for. */
function engineFile(/** @type {string} */ rest) {
  const { files, dirs } = ciceroEngine.vendorAssets();
  if (files[rest]) return files[rest];
  const dir = Object.keys(dirs).find((d) => rest.startsWith(`${d}/`));
  return dir ? path.join(dirs[dir], rest.slice(dir.length + 1)) : null;
}
/** The document served with the engine's head ahead of its own, as `beltype print` serves one, from the folder's parent, so a base beside the fixtures is in reach and a document's own relative references hold. */
const beltype = createHttpServer((req, res) => {
  const pathname = decodeURIComponent(new URL(/** @type {string} */ (req.url), 'http://x').pathname);
  if (pathname === `/${path.basename(folder)}/`) {
    res.setHeader('content-type', 'text/html');
    return res.end(readFileSync(path.join(folder, 'index.html'), 'utf8').replace(/<head\b[^>]*>/i, (head) => `${head}\n  ${ciceroEngine.headHtml('/')}`));
  }
  const file = pathname.startsWith('/_beltype/') ? engineFile(pathname.slice('/_beltype/'.length)) : path.join(path.dirname(folder), pathname);
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
  const url = `http://127.0.0.1:${P}/${path.basename(folder)}/`;
  browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: dpr });
  const page = await context.newPage();
  /** The console's messages, by side: the CLI's round until the harness is loaded, the view's after. */
  const consoles = { cli: [], view: [] };
  let side = 'cli';
  page.on('console', (m) => { if (['warning', 'error', 'info'].includes(m.type())) consoles[side].push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => consoles[side].push(`pageerror: ${e.message}`));
  const cdp = await context.newCDPSession(page);
  /** Every tagged element's generated text, by its probe: what the browser laid out for its `::before` and `::after`. */
  const generated = async () => {
    const snap = await cdp.send('DOMSnapshot.captureSnapshot', { computedStyles: [] });
    const str = (i) => (i < 0 ? null : snap.strings[i]);
    const out = new Map();
    for (const d of snap.documents) {
      const { nodes, layout } = d;
      const probe = new Map();
      nodes.attributes.forEach((attrs, n) => { for (let a = 0; a < attrs.length; a += 2) if (str(attrs[a]) === 'data-probe') probe.set(n, str(attrs[a + 1])); });
      const texts = new Map();
      for (let i = 0; i < layout.nodeIndex.length; i++) {
        const n = layout.nodeIndex[i];
        const t = str(layout.text[i]);
        const name = str(nodes.nodeName[n]);
        if (!t || (name !== '::before' && name !== '::after')) continue;
        const owner = probe.get(nodes.parentIndex[n]);
        if (owner == null) continue;
        const k = `${owner}|${name}`;
        texts.set(k, (texts.get(k) ?? '') + t);
      }
      for (const [k, t] of texts) out.set(k, t);
      for (const v of probe.values()) out.set(`${v}|seen`, '');
    }
    return out;
  };
  /** Each page's chrome on one side: its margin boxes' text and its flow's generated text. */
  const chromeOf = async (side, pagesExpr) => {
    // A tagged element can be missing from a snapshot (measured 2026-10-25: the slotted flow of a page refilled after `invalidate()`, now and then; and the flow of a page an edit refilled, page 1 of the specimen in one run of three): snapshot again, three times at most a frame apart, then tag the pages again and start over, three times at most, until every tag is in it; each miss is said, with how many of the missing elements the document still holds.
    let tags, texts, missing;
    for (let attempt = 1; ; attempt++) {
      tags = await page.evaluate(([side, expr]) => window.__prosemirrorBeltype.tagChrome(eval(expr), side), [side, pagesExpr]);
      const tagged = tags.flatMap((t) => [...t.boxes.map((b) => b.probe), ...t.flow.map((f) => f.probe)]);
      texts = await generated();
      for (let i = 0; i < 2 && tagged.some((p) => !texts.has(`${p}|seen`)); i++) { await page.waitForTimeout(50); texts = await generated(); }
      missing = tagged.filter((p) => !texts.has(`${p}|seen`));
      if (missing.length) {
        const held = await page.evaluate((ps) => ps.filter((p) => document.querySelector(`[data-probe="${p}"]`)).length, missing);
        console.log(`(the snapshot misses ${missing.length} tagged element(s) on the ${side} side, ${held} of them in the document's light tree, attempt ${attempt}: ${missing.slice(0, 6).join(', ')})`);
      }
      if (!missing.length || attempt === 3) break;
      await page.evaluate((expr) => window.__prosemirrorBeltype.untagChrome(eval(expr)), pagesExpr);
      await page.waitForTimeout(200);
    }
    await page.evaluate((expr) => window.__prosemirrorBeltype.untagChrome(eval(expr)), pagesExpr);
    const text = (probe) => `${texts.get(`${probe}|::before`) ?? ''}`;
    const after = (probe) => `${texts.get(`${probe}|::after`) ?? ''}`;
    return tags.map(({ boxes, flow }) => ({
      boxes: Object.fromEntries(boxes.map((b) => [b.box, `${text(b.probe)}${b.slotted ? `[${b.slotted}]` : ''}${after(b.probe)}`.replace(/\s+/g, ' ').trim()])),
      flow: flow.map((f) => ({ el: f.el, read: f.read, text: `${text(f.probe)}|${after(f.probe)}` }))
    }));
  };
  await page.goto(url);
  await page.waitForFunction(() => window.__beltypeCicero?.run, null, { timeout: 60000 });
  // The engine's whole run, which a host asks for: no `until`.
  await page.evaluate(() => window.__beltypeCicero.run());
  await page.waitForFunction(() => window.__beltypeCicero?.last?.complete === true, null, { timeout: 120000 });
  const cliMs = await page.evaluate(() => window.__beltypeCicero.last.ms);
  const shownDpr = await page.evaluate(() => window.devicePixelRatio);
  await page.evaluate(async () => { await document.querySelector('beltype-root').buildAll?.(); });

  side = 'view';
  await page.addScriptTag({ type: 'module', url: `http://127.0.0.1:${V}/harness/specimen.js` });
  await page.waitForFunction(() => window.__prosemirrorBeltype, null, { timeout: 60000 });
  // The rim's late truth after the reference is read is the CLI's business, not this measurement's: the host takes it, so no second run of the engine shares the measure context with the view's fills.
  await page.evaluate(() => { window.__lateTruth = []; document.addEventListener('beltype:change', (e) => { window.__lateTruth.push(e.detail?.kind); e.preventDefault(); }); });
  const reference = await page.evaluate(() => window.__prosemirrorBeltype.readPages(window.__prosemirrorBeltype.rootPages()));
  const referenceDressing = await page.evaluate(() => window.__prosemirrorBeltype.dressingOf(window.__prosemirrorBeltype.rootPages()));
  const referenceChrome = await chromeOf('cli', 'window.__prosemirrorBeltype.rootPages()');
  const ledger = await page.evaluate(() => window.__prosemirrorBeltype.cliLedger());
  const view = await page.evaluate(([bare, noLedger, reach]) => window.__prosemirrorBeltype.mount({ bare, noLedger, reach }), [bare, noLedger, forcedReach]);
  if (overtaken) {
    // The overtaken fill's case (docs/found.md): the settled chain's neighbouring pages filled over one document in one task. Nothing else is read.
    const r = await page.evaluate(() => window.__prosemirrorBeltype.overtaken());
    console.log(`overtaken: ${r.pairs} pairs of neighbouring pages filled in one task, ${r.failures.length} failures, ${r.holders} law holders left standing`);
    for (const f of r.failures) console.log(`  ${f}`);
    await browser.close();
    await vite.close();
    beltype.closeAllConnections(); beltype.close();
    process.exit(r.failures.length || r.holders ? 1 : 0);
  }
  const viewChrome = await chromeOf('view', 'window.__prosemirrorBeltype.viewPagesOf()');
  const copies = await page.evaluate(() => window.__prosemirrorBeltype.runningCopies());
  console.log(`Running copies in the view's margin boxes: ${copies.count}, of them inert and not editable: ${copies.closed}`);
  const lateTruth = await page.evaluate(() => window.__lateTruth);

  const n = Math.max(reference.length, view.pages.length);
  const cell = (s) => (s == null ? '·' : `\`${s}\``);
  console.log(`\n## ${target}${bare ? ' (bare)' : ''}${noLedger ? ' (no Ledger)' : ''}${forcedReach != null ? ` (the memo settled under reach ${forcedReach})` : ''}${shownDpr !== 1 ? ` (at a device pixel ratio of ${shownDpr})` : ''}, ${reference.length} pages under the CLI, ${view.pages.length} under the view\n`);
  console.log(`The CLI's last \`run()\` call ${Math.round(cliMs)} ms (its bootstrap cuts the first screen, then the rest); the view's chain ${Math.round(view.ms)} ms over ${view.fills.length} fills; doc size ${view.docSize}.\n`);
  console.log('| Page | CLI first | CLI last | words | view first | view last | words | entry | fill | same |');
  console.log('| ---: | :-- | :-- | ---: | :-- | :-- | ---: | :-- | :-- | :-- |');
  let first = null;
  /** Whether page i holds the same words on both sides: a chrome difference on a page that does not is the cut's, not the chrome's. */
  const wordsSame = [];
  for (let i = 0; i < n; i++) {
    const a = reference[i], b = view.pages[i], e = view.entries[i];
    const fill = [...view.fills].reverse().find((f) => f.index === i);
    const same = !!a && !!b && a.first === b.first && a.last === b.last;
    if (!same && first == null) first = i;
    wordsSame[i] = same && a.count === b.count;
    console.log(`| ${i + 1} | ${cell(a?.first)} | ${cell(a?.last)} | ${a?.count ?? '·'} | ${cell(b?.first)} | ${cell(b?.last)} | ${b?.count ?? '·'} | ${e ? `${e.from}–${e.to ?? 'end'}` : '·'} | ${fill ? `${fill.kind ?? ''}${fill.cls ? ` ${fill.cls}` : ''} ${fill.name || '(unnamed)'}${fill.next?.blank ? ', blank next' : ''}` : '·'} | ${same ? 'yes' : '**no**'} |`);
  }
  const guard = await page.evaluate(() => window.__prosemirrorBeltype.compareHosts());
  console.log(`\nThe guard, view against CLI: ${guard.pages[0]} pages against ${guard.pages[1]}, ${guard.first == null ? 'every page holds the same words' : `first difference on page ${guard.first}`}.`);
  const allowed = ALLOWED[path.basename(folder)];
  if (guard.first != null) {
    if (allowed?.page === guard.first) console.log(`The difference is allowed: ${allowed.reason}.`);
    else { console.log('**The view and the CLI disagree**: this run exits with an error.'); process.exitCode = 1; }
  }
  console.log(`\nPage sizes, CLI: ${reference.map((p) => p.size.join('×')).join(', ')}`);
  console.log(`Page sizes, view: ${view.pages.map((p) => p.size.join('×')).join(', ')}`);
  const objects = (pages) => pages.map((p, i) => (p.objects ?? []).map((o) => `page ${i + 1} ${o.is} ${o.size.join('×')}`)).flat().join(', ') || 'none';
  console.log(`\nObjects, CLI: ${objects(reference)}`);
  console.log(`Objects, view: ${objects(view.pages)}`);
  const dressing = (pieces) => pieces.map((d) => `  page ${d.page} ${d.edge} ${d.el}: ${d.edge === 'cut-off' ? `::after ${d.after}${d.textAlignLast ? `, text-align-last ${d.textAlignLast}, border-bottom ${d.borderBottom}, padding-bottom ${d.paddingBottom}` : ''}` : `::before ${d.before}${d.marker != null ? `, ::marker ${d.marker}` : ''}, ::first-letter ${d.firstLetter}, ::first-line ${d.firstLine}, own ${d.own}`}`).join('\n') || '  none';
  console.log(`\nDivided pieces' edges, CLI:\n${dressing(referenceDressing)}`);
  console.log(`\nDivided pieces' edges, view:\n${dressing(view.dressing)}`);
  // The cut-off edges only, the first fragment's: a resumed piece is named by its outermost divided box, which the root's tree and the schema's can give differently with the same edge (the trattato's `main.testo` and `section.parte`).
  const cutOff = (pieces) => dressing(pieces.filter((d) => d.edge === 'cut-off'));
  if (cutOff(referenceDressing) !== cutOff(view.dressing)) { console.log("**The cut-off pieces' edges differ**: this run exits with an error."); process.exitCode = 1; }
  if (bare) console.log(`\nAdopted sheets taken off before the view was mounted (${view.removed.length}):\n${view.removed.map((s) => `  ${s}`).join('\n') || '  none'}`);
  console.log(`\nAdopted sheets after the view settled (${view.adopted.length}):\n${view.adopted.map((s) => `  ${s}`).join('\n') || '  none'}`);
  console.log(`\nFirst difference: ${first == null ? 'none' : `page ${first + 1}`}`);

  // The chrome: margin boxes, then the flow's generated text, then the state they are drawn from.
  console.log(`\n### Chrome\n\nThe view's total: ${view.total}.\n`);
  console.log('| Page | CLI margin boxes | view margin boxes | same |');
  console.log('| ---: | :-- | :-- | :-- |');
  const boxText = (b) => (b ? Object.entries(b).map(([k, v]) => `${k}: ${v === '' ? '∅' : v}`).join('; ') : '·');
  let firstChrome = null;
  let chromeSame = 0;
  for (let i = 0; i < n; i++) {
    const a = referenceChrome[i]?.boxes, b = viewChrome[i]?.boxes;
    const same = JSON.stringify(a) === JSON.stringify(b);
    if (same) chromeSame++;
    if (!same && firstChrome == null) firstChrome = i;
    console.log(`| ${i + 1} | ${boxText(a)} | ${boxText(b)} | ${same ? 'yes' : `**no**${wordsSame[i] ? '' : ' (the page holds other words)'}`} |`);
  }
  console.log(`\nMargin boxes the same on ${chromeSame} of ${n} pages. First margin-box difference: ${firstChrome == null ? 'none' : `page ${firstChrome + 1}`}`);
  const flowDiffs = [];
  for (let i = 0; i < n; i++) {
    const a = referenceChrome[i]?.flow ?? [], b = viewChrome[i]?.flow ?? [];
    for (let k = 0; k < Math.max(a.length, b.length); k++) {
      if (a[k]?.text === b[k]?.text && a[k]?.el === b[k]?.el) continue;
      flowDiffs.push({ page: i + 1, el: a[k]?.el ?? b[k]?.el, cli: a[k]?.text ?? '·', view: b[k]?.text ?? '·', known: !!(a[k]?.read || b[k]?.read), moved: !wordsSame[i] });
    }
  }
  const flowSites = (side) => side.reduce((s, p) => s + (p?.flow.length ?? 0), 0);
  const why = (d) => (d.moved ? 'the page holds other words' : d.known ? '**a target-counter() read**' : '**unexplained**');
  const readSites = (side) => side.reduce((s, p) => s + (p?.flow.filter((f) => f.read).length ?? 0), 0);
  console.log(`\nFlow generated content: ${flowSites(referenceChrome)} sites under the CLI, ${flowSites(viewChrome)} under the view, of which ${readSites(referenceChrome)} and ${readSites(viewChrome)} are \`target-counter()\` or \`target-text()\` reads; ${flowDiffs.filter((d) => !d.moved).length} differ on a page that holds the same words (${flowDiffs.filter((d) => d.known && !d.moved).length} of them reads), ${flowDiffs.filter((d) => d.moved).length} stand on a page that holds other words (${flowDiffs.filter((d) => d.known && d.moved).length} of them reads).`);
  for (const d of flowDiffs) console.log(`  page ${d.page} ${d.el}: CLI \`${d.cli}\`, view \`${d.view}\` — ${why(d)}`);
  // The state: the CLI's entry for page i ends at its `pos`; the view's fill recorded its interval in the same word positions.
  console.log('\n| Page | CLI end | view start–end | counters | strings | running | recuts |');
  console.log('| ---: | ---: | :-- | :-- | :-- | :-- | ---: |');
  let firstState = null;
  for (let i = 0; i < n; i++) {
    const c = ledger[i];
    const f = [...view.fills].reverse().find((x) => x.index === i);
    const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const ends = c && f && (c.pos ?? null) === (f.end ?? null);
    const cs = c && f && eq(c.counters, f.counters), ss = c && f && eq(c.strings, f.strings), rs = c && f && eq(c.running, f.running);
    if (!(ends && cs && ss && rs) && firstState == null) firstState = i;
    console.log(`| ${i + 1} | ${c?.pos ?? (c ? 'end' : '·')} | ${f ? `${f.start}–${f.end ?? 'end'}` : '·'}${ends ? '' : ' **≠**'} | ${cs ? 'same' : `**${JSON.stringify(c?.counters)} / ${JSON.stringify(f?.counters)}**`} | ${ss ? 'same' : `**${JSON.stringify(c?.strings)} / ${JSON.stringify(f?.strings)}**`} | ${rs ? 'same' : `**${JSON.stringify(c?.running)} / ${JSON.stringify(f?.running)}**`} | ${f?.recuts ?? '·'} |`);
  }
  console.log(`\nFirst state difference: ${firstState == null ? 'none' : `page ${firstState + 1}`}`);
  console.log(`The originals rendered ${view.originals.length} time(s): ${view.originals.map((t) => `render ${t.render.toFixed(1)} ms, read ${t.read.toFixed(1)} ms`).join('; ')}`);
  if (!view.settled) console.log(`\n**The view's chain did not settle**: ${view.fills.filter((f) => f.error).map((f) => `page ${f.index + 1}: ${f.error}`).join('; ') || 'timed out'}`);
  console.log(`\nFills:\n${view.fills.map((f) => `  ${f.index + 1}: ${Math.round(f.ms)} ms ${JSON.stringify({ from: f.from, to: f.to, kind: f.kind, cls: f.cls, y: f.y && Math.round(f.y * 100) / 100, pageStart: f.pageStart, usedPx: f.usedPx && Math.round(f.usedPx * 100) / 100, extPx: f.extPx && Math.round(f.extPx * 100) / 100, next: f.next })}`).join('\n')}`);
  const unique = (xs) => [...new Set(xs)];
  console.log(`\nConsole, CLI (${consoles.cli.length}):\n${unique(consoles.cli).map((m) => `  ${m.slice(0, 300)}`).join('\n')}`);
  console.log(`\nConsole, view (${consoles.view.length}):\n${unique(consoles.view).map((m) => `  ${m.slice(0, 300)}`).join('\n')}`);
  console.log(`\nLate truth taken from the rim after the reference: ${JSON.stringify(lateTruth)}`);
  const reach = await page.evaluate(() => window.__prosemirrorBeltype.reachOf());
  console.log(`\nThe sheets' reach for a whole top-level box (\`topLevelReach\`): ${reach.topLevel}, and after a change of shape ${reach.shaped}${reach.shapedRules.length ? ` (${reach.shapedRules.join(' | ')})` : ''}; for a box at any depth (\`sheetReach\`): ${reach.reach}; ${reach.two} rule(s) of reach 2, ${reach.one} of reach 1${reach.first.length ? `, the first: ${reach.first.join(' | ')}` : ''}. The originals' last reading kept ${view.originals.at(-1)?.kept ?? 0} node(s) and rendered ${view.originals.at(-1)?.rendered ?? 0}; the memo's tally ${JSON.stringify(view.originals.at(-1)?.tally ?? {})}.`);
  console.log(`\n### The reads loop\n\nChain counts: ${JSON.stringify(view.counts)}`);
  console.log(JSON.stringify(view.reads, null, 1));

  /** Compare an edited state with the view's fresh fill of it after `invalidate()`, which renders the originals whole again: pages (words, margin boxes, flow), each page's chrome state, the originals' reading and the delivered reads. */
  let disagreed = 0;
  const compare = async (label, edit) => {
    const edited = await chromeOf('view', 'window.__prosemirrorBeltype.viewPagesOf()');
    const fresh = await page.evaluate(() => window.__prosemirrorBeltype.refillWhole());
    const freshChrome = await chromeOf('view', 'window.__prosemirrorBeltype.viewPagesOf()');
    console.log(`\n### ${label}\n\nSettled: ${edit.settled}, ${Math.round(edit.ms)} ms. Pages redrawn without a refill: ${edit.redrawn ?? '·'}; dirtied for a flow site: ${edit.dirtied ?? '·'}; fills: ${edit.refilled?.length ?? '·'} (pages ${edit.refilled?.join(', ') || 'none'}). The originals' last reading: ${edit.originals ? `${edit.originals.rendered} node(s) rendered, ${edit.originals.kept} kept, reach ${edit.originals.reach}, tally ${JSON.stringify(edit.originals.tally)}` : '·'}. The fresh fill after \`invalidate()\`: ${fresh.fills} fills, settled ${fresh.settled}, late fills ${JSON.stringify(fresh.late)}, the originals ${fresh.originals.rendered} node(s) rendered whole.\n`);
    console.log('| Page | after the edit: words, margin boxes, flow | the fresh fill | same |');
    console.log('| ---: | :-- | :-- | :-- |');
    let sameAll = 0;
    const m = Math.max(edit.pages.length, fresh.pages.length);
    for (let i = 0; i < m; i++) {
      const a = edit.pages[i], b = fresh.pages[i];
      const ca = edited[i], cb = freshChrome[i];
      const same = JSON.stringify([a, ca]) === JSON.stringify([b, cb]);
      if (same) sameAll++;
      else disagreed++;
      const show = (p, c) => (p ? `${p.count} words, ${boxText(c?.boxes)}; flow ${c?.flow.map((f) => f.text).join(' ') || '∅'}` : '·');
      console.log(`| ${i + 1} | ${show(a, ca)} | ${same ? '=' : show(b, cb)} | ${same ? 'yes' : '**no**'} |`);
    }
    const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
    const chromeSame = edit.state.chrome.filter((c, i) => eq(c, fresh.state.chrome[i])).length;
    const parts = Object.keys(edit.state.originals).filter((k) => !eq(edit.state.originals[k], fresh.state.originals[k]));
    console.log(`\nThe edited chain and the fresh fill agree on ${sameAll} of ${m} pages (words, margin boxes, flow generated content); each page's state (start, end, block, counters, strings, running) on ${chromeSame} of ${Math.max(edit.state.chrome.length, fresh.state.chrome.length)}; the originals' reading ${parts.length ? `**differs** in ${parts.join(', ')}` : 'the same in bases, total, the counter log, strings, running elements, page sites and every entry\'s word addresses'}; the delivered reads ${eq(edit.state.delivered, fresh.state.delivered) ? 'the same' : '**differ**'}.`);
    for (const k of parts) console.log(`  ${k}: edited ${JSON.stringify(edit.state.originals[k]).slice(0, 300)} / fresh ${JSON.stringify(fresh.state.originals[k]).slice(0, 300)}`);
    console.log(JSON.stringify(edit.reads?.settles.at(-1)));
    console.log(JSON.stringify(fresh.reads?.settles.at(-1)));
    console.log(`\nThe edit's fills:\n${(edit.detail ?? []).map((f) => `  ${JSON.stringify(f)}`).join('\n')}\nThe fresh fill's:\n${fresh.detail.map((f) => `  ${JSON.stringify(f)}`).join('\n')}`);
  };

  // The edits, each by a transaction, each compared with the fresh fill of the state it made: `--retitle old=>new` (a heading), `--edits 'key:3;delete:2;paste;start;end'` (editOf in the harness).
  const edits = [...(retitle ? [`retitle:${retitle}`] : []), ...(opt('--edits') ?? '').split(';').filter(Boolean)];
  for (const e of edits) {
    const [kind, ...rest] = e.split(':');
    const arg = rest.join(':');
    const done = await page.evaluate(([kind, arg]) => window.__prosemirrorBeltype.edit(kind, arg), [kind, arg]);
    await compare(kind === 'retitle' ? `Retitled \`${arg.split('=>')[0]}\` to \`${arg.split('=>')[1]}\` at ${done.at}` : `Edit \`${e}\` at ${done.at}`, done);
  }
  if (strict && disagreed) process.exitCode = 1;

  if (keys) {
    const [pageNo, n] = keys.split(':').map(Number);
    const typed = await page.evaluate(([p, n]) => window.__prosemirrorBeltype.keystrokes(p, n), [pageNo, n]);
    console.log(`\n### ${n} keystrokes on page ${pageNo}\n`);
    for (const t of typed) console.log(`  ${JSON.stringify(t)}`);
    const state = await page.evaluate(() => window.__prosemirrorBeltype.stateOf());
    await compare(`After the ${n} keystrokes`, { settled: true, ms: 0, pages: await page.evaluate(() => window.__prosemirrorBeltype.readPages(window.__prosemirrorBeltype.viewPagesOf())), state });
  }
  if (process.argv.includes('--keep')) await new Promise(() => {});
} finally {
  await browser?.close();
  await vite.close();
  beltype.closeAllConnections(); beltype.close();
}
