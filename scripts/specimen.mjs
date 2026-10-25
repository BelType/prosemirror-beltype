// usage: node scripts/specimen.mjs [target] [--headed] [--keep] [--bare] — the target is a path BelType's CLI takes, relative to its repository's root, `./test/specimen.md` by default; phase 1's measurement, one engine, two hosts, one answer. BelType's dev server serves the specimen under Cicero on a free port; Chromium opens it headless and waits for the CLI's round to be whole; every page the root presents is read (first and last visible word); then this package's harness is loaded from Vite into the same page, the view is mounted beside the root over the same served document and filled whole, and its pages are read the same way. Prints the pages side by side, the first difference, each page's chrome on both sides (every generated margin box's text, read as the browser laid out its `::before` and `::after` through a CDP DOM snapshot, with its slotted running element, and every flow element's generated text, a `target-counter()` read marked as the round 3 difference it is) and the state it is drawn from (each page's interval end in the engine's word positions, its counters, strings and running elements, the CLI's Ledger against the view's fills), what every divided piece's edges show on each side (its pseudo-elements' computed style), and the console's warnings on each side; docs/results.md records them. `--bare` takes every adopted sheet off the document after the CLI's pages are read and before the view is mounted, the CLI's root's among them, so the view is measured in a document no root has dressed.
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
const noLedger = process.argv.includes('--no-ledger');
const opt = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const retitle = opt('--retitle');
const keys = opt('--keys');
const target = process.argv.slice(2).find((a, i, all) => !a.startsWith('--') && !['--retitle', '--keys'].includes(all[i - 1])) ?? './test/specimen.md';

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
  // The root clears the author's margin boxes' `content` when it presents (`neutralizeMarginBoxes`): each value is recorded here, before anything runs, so the harness can put it back for the view's factory to read.
  await page.addInitScript(() => {
    const removed = (window.__marginContent = []);
    const remove = CSSStyleDeclaration.prototype.removeProperty;
    CSSStyleDeclaration.prototype.removeProperty = function (prop) {
      if (prop === 'content' && this.parentRule?.constructor?.name === 'CSSMarginRule' && this.getPropertyValue('content')) removed.push([this, this.getPropertyValue('content'), this.getPropertyPriority('content')]);
      return remove.call(this, prop);
    };
  });
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
    }
    return out;
  };
  /** Each page's chrome on one side: its margin boxes' text and its flow's generated text. */
  const chromeOf = async (side, pagesExpr) => {
    const tags = await page.evaluate(([side, expr]) => window.__prosemirrorBeltype.tagChrome(eval(expr), side), [side, pagesExpr]);
    const texts = await generated();
    await page.evaluate((expr) => window.__prosemirrorBeltype.untagChrome(eval(expr)), pagesExpr);
    const text = (probe) => `${texts.get(`${probe}|::before`) ?? ''}`;
    const after = (probe) => `${texts.get(`${probe}|::after`) ?? ''}`;
    return tags.map(({ boxes, flow }) => ({
      boxes: Object.fromEntries(boxes.map((b) => [b.box, `${text(b.probe)}${b.slotted ? `[${b.slotted}]` : ''}${after(b.probe)}`.replace(/\s+/g, ' ').trim()])),
      flow: flow.map((f) => ({ el: f.el, read: f.read, text: `${text(f.probe)}|${after(f.probe)}` }))
    }));
  };
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
  const referenceChrome = await chromeOf('cli', 'window.__prosemirrorBeltype.rootPages()');
  const ledger = await page.evaluate(() => window.__prosemirrorBeltype.cliLedger());
  const view = await page.evaluate(([bare, noLedger]) => window.__prosemirrorBeltype.mount({ bare, noLedger }), [bare, noLedger]);
  const viewChrome = await chromeOf('view', 'window.__prosemirrorBeltype.viewPagesOf()');
  const lateTruth = await page.evaluate(() => window.__lateTruth);

  const n = Math.max(reference.length, view.pages.length);
  const cell = (s) => (s == null ? '·' : `\`${s}\``);
  console.log(`\n## ${target}${bare ? ' (bare)' : ''}${noLedger ? ' (no Ledger)' : ''}, ${reference.length} pages under the CLI, ${view.pages.length} under the view\n`);
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

  // The chrome: margin boxes, then the flow's generated text, then the state they are drawn from.
  console.log(`\n### Chrome\n\nMargin boxes' \`content\` put back for the view's table: ${view.restored}. The view's total: ${view.total}.\n`);
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
  console.log(`The originals rendered ${view.originals.length} time(s): ${view.originals.map((t) => `render ${t.render.toFixed(1)} ms, read ${t.read.toFixed(1)} ms over ${t.nodes} elements`).join('; ')}`);
  if (!view.settled) console.log(`\n**The view's chain did not settle**: ${view.fills.filter((f) => f.error).map((f) => `page ${f.index + 1}: ${f.error}`).join('; ') || 'timed out'}`);
  console.log(`\nFills:\n${view.fills.map((f) => `  ${f.index + 1}: ${Math.round(f.ms)} ms ${JSON.stringify({ from: f.from, to: f.to, kind: f.kind, cls: f.cls, y: f.y && Math.round(f.y * 100) / 100, pageStart: f.pageStart, usedPx: f.usedPx && Math.round(f.usedPx * 100) / 100, extPx: f.extPx && Math.round(f.extPx * 100) / 100, next: f.next })}`).join('\n')}`);
  const unique = (xs) => [...new Set(xs)];
  console.log(`\nConsole, CLI (${consoles.cli.length}):\n${unique(consoles.cli).map((m) => `  ${m.slice(0, 300)}`).join('\n')}`);
  console.log(`\nConsole, view (${consoles.view.length}):\n${unique(consoles.view).map((m) => `  ${m.slice(0, 300)}`).join('\n')}`);
  console.log(`\nLate truth taken from the rim after the reference: ${JSON.stringify(lateTruth)}`);
  console.log(`\n### The reads loop\n\nChain counts: ${JSON.stringify(view.counts)}`);
  console.log(JSON.stringify(view.reads, null, 1));

  if (retitle) {
    // The chrome on an edit: a heading retitled by a transaction, every page's margin boxes and flow read; then the view invalidated and its fresh fill of the same state read; the two compared page for page.
    const [from, to] = retitle.split('=>');
    const edit = await page.evaluate(([from, to]) => window.__prosemirrorBeltype.retitle(from, to), [from, to]);
    const edited = await chromeOf('view', 'window.__prosemirrorBeltype.viewPagesOf()');
    const fresh = await page.evaluate(() => window.__prosemirrorBeltype.refillWhole());
    const freshChrome = await chromeOf('view', 'window.__prosemirrorBeltype.viewPagesOf()');
    console.log(`\n### Retitled \`${from}\` to \`${to}\` at ${edit.at}\n\nSettled: ${edit.settled}, ${Math.round(edit.ms)} ms. Pages redrawn without a refill: ${edit.redrawn}; dirtied for a flow site: ${edit.dirtied}; fills: ${edit.refilled.length} (pages ${edit.refilled.join(', ') || 'none'}). The fresh fill after \`invalidate()\`: ${fresh.fills} fills, settled ${fresh.settled}, late fills ${JSON.stringify(fresh.late)}.\n`);
    console.log('| Page | after the edit: words, margin boxes, flow | the fresh fill | same |');
    console.log('| ---: | :-- | :-- | :-- |');
    let sameAll = 0;
    const m = Math.max(edit.pages.length, fresh.pages.length);
    for (let i = 0; i < m; i++) {
      const a = edit.pages[i], b = fresh.pages[i];
      const ca = edited[i], cb = freshChrome[i];
      const same = JSON.stringify([a, ca]) === JSON.stringify([b, cb]);
      if (same) sameAll++;
      const show = (p, c) => (p ? `${p.count} words, ${boxText(c?.boxes)}; flow ${c?.flow.map((f) => f.text).join(' ') || '∅'}` : '·');
      console.log(`| ${i + 1} | ${show(a, ca)} | ${same ? '=' : show(b, cb)} | ${same ? 'yes' : '**no**'} |`);
    }
    console.log(`\nThe edited chain and the fresh fill agree on ${sameAll} of ${m} pages (words, margin boxes, flow generated content).`);
    console.log(JSON.stringify(edit.reads?.settles.at(-1)));
    console.log(JSON.stringify(fresh.reads?.settles.at(-1)));
    console.log(`\nThe edit's fills:\n${edit.detail.map((f) => `  ${JSON.stringify(f)}`).join('\n')}\nThe fresh fill's:\n${fresh.detail.map((f) => `  ${JSON.stringify(f)}`).join('\n')}`);
  }

  if (keys) {
    const [pageNo, n] = keys.split(':').map(Number);
    const typed = await page.evaluate(([p, n]) => window.__prosemirrorBeltype.keystrokes(p, n), [pageNo, n]);
    console.log(`\n### ${n} keystrokes on page ${pageNo}\n`);
    for (const t of typed) console.log(`  ${JSON.stringify(t)}`);
  }
  if (process.argv.includes('--keep')) await new Promise(() => {});
} finally {
  await browser?.close();
  await vite.close();
  beltype.kill();
}
