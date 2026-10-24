// usage: node scripts/spaces.mjs --url <the studio's dev server> --out <file> [--demo quiet-press] — the round *a space beside a space*'s measurement, in BelType's studio on both paths, the old orchestrator and `?view=fragmented`. In one paragraph of the demo's first pages, with real keystrokes: `A`, space, space, `B` typed in the middle of a word, each key 600 ms after the last so each is an undo event of its own, then two undos; a space typed at the paragraph's end, then `x`; a space typed at its start. Each act is read back three ways: the model's code points at the typed place (`studio.state`), the drawn text node's code points, and the width the characters draw (a `Range`, `getBoundingClientRect`). Also the steps the authority accepted for each act (the collab plugin's version). The studio's server must be started first, on a free port.
import fs from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const url = opt('--url', null);
const out = opt('--out', null);
const demo = opt('--demo', 'quiet-press');
if (!url || !out) throw new Error('usage: node scripts/spaces.mjs --url <server> --out <file>');

const hex = (s) => [...s].map((c) => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(' ');

/** Runs in the page: the pages' container, the paragraphs drawn on them, and what is read back. */
const IN_PAGE = () => {
  const fragmented = !!window.studio.view;
  const pagesRoot = () => (fragmented ? document.querySelector('.fragview') : document.querySelector('beltype-root'));
  const paragraphs = () => [...pagesRoot().querySelectorAll(fragmented ? ':scope > beltype-page p' : 'p')];
  const textNodes = (el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const all = []; while (w.nextNode()) all.push(w.currentNode); return all; };
  const width = (node, from, to) => { const r = document.createRange(); r.setStart(node, from); r.setEnd(node, to); return Math.round(r.getBoundingClientRect().width * 100) / 100; };
  const collab = () => window.studio.state.plugins.map((p) => p.getState(window.studio.state)).find((s) => s && typeof s.version === 'number' && Array.isArray(s.unconfirmed));
  window.__spaces = {
    fragmented,
    /** A paragraph of 150 characters or more, whole on one page, in view; its snippet (characters 40 to 70) finds it again. */
    pick() {
      const p = paragraphs().find((el) => el.textContent.length >= 150 && el.getBoundingClientRect().height > 0 && !/fragment/.test(el.getAttribute('data-beltype') ?? ''));
      p.scrollIntoView({ block: 'center' });
      return p.textContent.slice(40, 70);
    },
    /** The drawn paragraph holding the snippet (on the old path the root also holds an undrawn one). */
    find: (snippet) => paragraphs().find((el) => el.textContent.includes(snippet) && el.getBoundingClientRect().height > 0),
    /** Viewport points: inside a word near the middle (between two letters), right of the last character, left of the first. */
    points(snippet) {
      const p = this.find(snippet);
      p.scrollIntoView({ block: 'center' });
      const nodes = textNodes(p).filter((n) => n.data.trim());
      const rect = (node, i) => { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1); return r.getBoundingClientRect(); };
      const firstNode = nodes[0], lastNode = nodes.at(-1);
      const first = rect(firstNode, firstNode.data.search(/\S/));
      const lastIndex = lastNode.data.trimEnd().length - 1;
      const last = rect(lastNode, lastIndex);
      let mid = null;
      for (const node of nodes) {
        const m = /[a-z]{4,}/g;
        m.lastIndex = Math.floor(node.data.length / 3);
        const hit = m.exec(node.data);
        if (hit) { const r = rect(node, hit.index + 1); mid = { x: r.right - 0.5, y: (r.top + r.bottom) / 2, word: hit[0] }; break; }
      }
      return { mid, end: { x: last.right - 0.5, y: (last.top + last.bottom) / 2 }, start: { x: first.left + 0.5, y: (first.top + first.bottom) / 2 } };
    },
    /** Under the view, the position the browser's own hit test gives a point, and the caret put there when the click did not reach the model (docs/found.md, "The title page refills every frame"). */
    place(x, y) {
      if (!fragmented) return false;
      const pos = window.studio.view.posAtCoords({ left: x, top: y })?.pos;
      if (pos == null || window.studio.state.selection.head === pos) return false;
      window.studio.caret.select(window.studio.lib.TextSelection.create(window.studio.state.doc, pos));
      return true;
    },
    head() { const $h = window.studio.state.selection.$head; return { head: $h.pos, offset: $h.parentOffset, size: $h.parent.content.size }; },
    model: (from, to) => window.studio.state.doc.textBetween(from, to, '', '￼'),
    version: () => collab()?.version ?? null,
    unconfirmed: () => collab()?.unconfirmed.length ?? null,
    /** The drawn characters matching `pattern` in the paragraph, and the widths of the whole match and of each character. */
    drawn(snippet, pattern) {
      const p = this.find(snippet);
      if (!p) return null;
      for (const node of textNodes(p)) {
        const m = new RegExp(pattern).exec(node.data);
        if (m) return { text: m[0], width: width(node, m.index, m.index + m[0].length), each: [...m[0]].map((_, i) => width(node, m.index + i, m.index + i + 1)) };
      }
      return null;
    },
    /** The paragraph's first or last drawn character and its width. */
    edge(snippet, which) {
      const p = this.find(snippet);
      const nodes = textNodes(p).filter((n) => n.data.length);
      const node = which === 'first' ? nodes[0] : nodes.at(-1);
      const i = which === 'first' ? 0 : node.data.length - 1;
      return { text: node.data.slice(which === 'first' ? 0 : i - 1, which === 'first' ? 2 : i + 1), width: width(node, i, i + 1) };
    },
    settled: () => (fragmented ? window.studio.view.filling.size === 0 && !window.studio.view.entries.some((e) => e.dirty) : !window.studio.patcher.busy)
  };
};

async function settle(page) {
  await page.waitForFunction(() => window.__spaces.settled(), null, { timeout: 30000 });
  await page.waitForTimeout(400);
  await page.waitForFunction(() => window.__spaces.settled(), null, { timeout: 30000 });
}

async function measure(browser, fragmented) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 1000 });
  const warnings = [];
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') warnings.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => warnings.push(`pageerror ${e.message}`));
  await page.goto(`${url}?demo=${demo}${fragmented ? '&view=fragmented' : ''}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.studio && (window.studio.fragview ? window.studio.fragview.settled != null : window.__beltypeCicero?.last?.pages > 0), null, { timeout: 180000 });
  if (!fragmented) await page.evaluate(async () => { await window.__beltypeCicero.buildAll?.(); });
  await page.evaluate(IN_PAGE);
  await settle(page);
  const snippet = await page.evaluate(() => window.__spaces.pick());
  const result = { path: fragmented ? 'view' : 'old', snippet };
  result.placed = 0;
  const click = async (pt) => {
    await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(150);
    if (await page.evaluate(({ x, y }) => window.__spaces.place(x, y), pt)) result.placed++;
    return page.evaluate(() => window.__spaces.head());
  };
  const version = async () => { await page.waitForFunction(() => window.__spaces.unconfirmed() === 0, null, { timeout: 5000 }).catch(() => {}); return page.evaluate(() => window.__spaces.version()); };

  // The middle: A, space, space, B, one undo event each.
  let pts = await page.evaluate((s) => window.__spaces.points(s), snippet);
  const at = await click(pts.mid);
  const v0 = await version();
  for (const key of ['A', ' ', ' ', 'B']) { await page.keyboard.type(key); await page.waitForTimeout(600); }
  await settle(page);
  const v1 = await version();
  result.middle = {
    word: pts.mid.word, head: at.head,
    model: hex(await page.evaluate((h) => window.__spaces.model(h, h + 4), at.head)),
    drawn: await page.evaluate((s) => window.__spaces.drawn(s, 'A[  ]{1,2}B'), snippet),
    steps: v1 - v0
  };
  result.middle.drawnCodePoints = result.middle.drawn && hex(result.middle.drawn.text);
  for (const n of [1, 2]) {
    await page.keyboard.press('ControlOrMeta+z');
    await settle(page);
    result.middle[`afterUndo${n}`] = hex(await page.evaluate((h) => window.__spaces.model(h, h + 4), at.head));
  }
  await page.keyboard.press('ControlOrMeta+z'); await page.keyboard.press('ControlOrMeta+z');
  await settle(page);
  result.middle.restored = await page.evaluate((h) => window.__spaces.model(h - 2, h + 2), at.head);

  // The end: a space, then x.
  pts = await page.evaluate((s) => window.__spaces.points(s), snippet);
  const end = await click(pts.end);
  const v2 = await version();
  await page.keyboard.type(' ');
  await settle(page);
  result.end = {
    head: end.head, atEnd: end.offset === end.size,
    model: hex(await page.evaluate((h) => window.__spaces.model(h - 1, h + 1), end.head)),
    drawn: await page.evaluate((s) => window.__spaces.edge(s, 'last'), snippet),
    steps: (await version()) - v2
  };
  result.end.drawnCodePoints = hex(result.end.drawn.text);
  await page.keyboard.type('x');
  await settle(page);
  result.end.thenX = hex(await page.evaluate((h) => window.__spaces.model(h - 1, h + 2), end.head));

  // The start: a space.
  pts = await page.evaluate((s) => window.__spaces.points(s), snippet);
  const start = await click(pts.start);
  const v3 = await version();
  await page.keyboard.type(' ');
  await settle(page);
  result.start = {
    head: start.head, atStart: start.offset === 0,
    model: hex(await page.evaluate((h) => window.__spaces.model(h, h + 2), start.head)),
    drawn: await page.evaluate((s) => window.__spaces.edge(s, 'first'), snippet),
    steps: (await version()) - v3
  };
  result.start.drawnCodePoints = hex(result.start.drawn.text);
  result.warnings = warnings;
  await page.close();
  return result;
}

const browser = await chromium.launch();
const results = { demo, date: new Date().toISOString().slice(0, 10), old: await measure(browser, false), view: await measure(browser, true) };
await browser.close();
fs.writeFileSync(out, JSON.stringify(results, null, 1) + '\n');
for (const r of [results.old, results.view]) {
  console.log(`${r.path} (caret placed after a lost click: ${r.placed} of 3): middle (in "${r.middle.word}") model ${r.middle.model}, drawn ${r.middle.drawnCodePoints} ${r.middle.drawn?.width} px [${r.middle.drawn?.each.join(', ')}], ${r.middle.steps} steps; undo 1 ${r.middle.afterUndo1}, undo 2 ${r.middle.afterUndo2}`);
  console.log(`  end (at end ${r.end.atEnd}) model ${r.end.model}, drawn ${r.end.drawnCodePoints} last ${r.end.drawn.width} px, ${r.end.steps} steps; then x ${r.end.thenX}`);
  console.log(`  start (at start ${r.start.atStart}) model ${r.start.model}, drawn ${r.start.drawnCodePoints} first ${r.start.drawn.width} px, ${r.start.steps} steps`);
  if (r.warnings.length) console.log(`  warnings: ${r.warnings.join(' | ')}`);
}
