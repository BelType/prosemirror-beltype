// usage: node scripts/idle.mjs --url <the studio's dev server> --out <file> [--demos quiet-press,report,…] [--idle 1500] — the round *late truth, like with like*'s measurement: each studio demo under `?view=fragmented`, and what the pages do while nobody types. Three spans: the load, until the chain settles; the scroll, every page brought into view in turn and the chain settled again, since a page off screen is skipped (`content-visibility: auto`) and its observer hears nothing until it is shown; and the idle window after it. In each, the `moved` events the pages dispatch (`EventTarget.prototype.dispatchEvent` wrapped from the first script, with the page each came from) and the view's refill transactions (`studio.view.dispatch` wrapped once the view exists, a transaction whose meta holds the fragments plugin's `dirtied` or `refilled`). Also every observation a page's own `ResizeObserver` receives (the class wrapped from the first script), set beside the height the page had recorded for its target at that moment, so an observation that differs from its record is named with its content box and border box. The studio's server must be started first, on a free port.
import fs from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const url = opt('--url', null);
const out = opt('--out', null);
const demos = opt('--demos', 'quiet-press,report,manuale,showcase,facsimile,bolletta,schema-lab').split(',');
const idle = Number(opt('--idle', '1500'));
if (!url || !out) throw new Error('usage: node scripts/idle.mjs --url <server> --out <file>');

/** Runs before the studio's first script: every `moved` dispatched, and every observation a Cicero page's observer receives beside the page's record. */
const BEFORE = () => {
  window.__moved = [];
  window.__observed = [];
  const dispatch = EventTarget.prototype.dispatchEvent;
  EventTarget.prototype.dispatchEvent = function (event) {
    if (event.type === 'moved') window.__moved.push({ t: performance.now(), target: this });
    return dispatch.call(this, event);
  };
  const Observer = window.ResizeObserver;
  window.ResizeObserver = class extends Observer {
    constructor(callback) {
      super((entries, observer) => {
        const view = window.studio?.view;
        const page = view ? view.entries.findIndex((e) => view.containers.get(e.key)?.observer === observer) : -1;
        if (page >= 0) {
          const heights = view.containers.get(view.entries[page].key).heights;
          for (const e of entries) {
            const el = e.target;
            window.__observed.push({ t: performance.now(), page: page + 1, node: el.localName + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : ''), connected: el.isConnected, recorded: heights.get(el) ?? null, content: e.contentRect.height, border: e.borderBoxSize?.[0]?.blockSize ?? null });
          }
        }
        return callback(entries, observer);
      });
    }
  };
};

/** Runs in the page once the view exists: the refill counter and what is read back. */
const IN_PAGE = () => {
  const view = window.studio.view;
  window.__refills = [];
  const dispatch = view.dispatch.bind(view);
  view.dispatch = (tr) => {
    const meta = Object.entries(tr.meta).find(([k]) => k.startsWith('fragments$'))?.[1];
    if (meta && (meta.dirtied || meta.refilled)) window.__refills.push(performance.now());
    return dispatch(tr);
  };
  const pageOf = (target) => view.entries.findIndex((e) => view.containers.get(e.key)?.moved === target) + 1;
  const tally = (list) => Object.entries(list.reduce((a, p) => ((a[p] = (a[p] ?? 0) + 1), a), {})).map(([p, n]) => `p${p}×${n}`).join(' ') || '-';
  window.__idle = {
    settled: () => view.filling.size === 0 && !view.entries.some((e) => e.dirty),
    pages: () => [...view.dom.querySelectorAll(':scope > beltype-page')],
    /** The span from `t0` to `t1`: moved by page, refills, and the observations that differ from their record. */
    span(t0, t1) {
      const moved = window.__moved.filter((m) => m.t >= t0 && m.t < t1).map((m) => pageOf(m.target));
      const observed = window.__observed.filter((o) => o.t >= t0 && o.t < t1);
      const r2 = (n) => (n == null ? n : Math.round(n * 100) / 100);
      const differ = {};
      for (const o of observed) {
        if (o.recorded == null || Math.abs(o.content - o.recorded) <= 0.5) continue;
        const k = `page ${o.page} ${o.node}${o.connected ? '' : ' (detached)'}: recorded ${r2(o.recorded)}, content ${r2(o.content)}, border ${r2(o.border)}`;
        differ[k] = (differ[k] ?? 0) + 1;
      }
      return { moved: moved.length, movedByPage: tally(moved), refills: window.__refills.filter((t) => t >= t0 && t < t1).length, observations: observed.length, unrecorded: observed.filter((o) => o.recorded == null).length, borderDiffers: observed.filter((o) => o.recorded != null && Math.abs(o.border - o.recorded) > 0.5).length, differ: Object.entries(differ).map(([k, n]) => `${n}× ${k}`) };
    }
  };
};

async function settle(page) {
  await page.waitForFunction(() => window.__idle.settled(), null, { timeout: 60000, polling: 50 });
  await page.waitForTimeout(400);
  await page.waitForFunction(() => window.__idle.settled(), null, { timeout: 60000, polling: 50 });
}

async function measure(browser, demo) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 1000 });
  const warnings = [];
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') warnings.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => warnings.push(`pageerror ${e.message}`));
  await page.addInitScript(BEFORE);
  await page.goto(`${url}?demo=${demo}&view=fragmented`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.studio?.fragview?.settled != null, null, { timeout: 180000 });
  await page.evaluate(IN_PAGE);
  await settle(page);
  const t1 = await page.evaluate(() => performance.now());
  const n = await page.evaluate(() => window.__idle.pages().length);
  for (let i = 0; i < n; i++) {
    await page.evaluate((i) => window.__idle.pages()[i]?.scrollIntoView({ block: 'center' }), i);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.__idle.pages()[0]?.scrollIntoView({ block: 'start' }));
  await settle(page);
  const t2 = await page.evaluate(() => performance.now());
  await page.waitForTimeout(idle);
  const t3 = await page.evaluate(() => performance.now());
  const spans = await page.evaluate(([t1, t2, t3]) => ({ load: window.__idle.span(0, t1), scroll: window.__idle.span(t1, t2), idle: window.__idle.span(t2, t3), pages: window.studio.view.entries.length }), [t1, t2, t3]);
  await page.close();
  return { demo, idleMs: idle, ...spans, warnings };
}

const browser = await chromium.launch();
const results = { date: new Date().toISOString().slice(0, 10), demos: [] };
for (const demo of demos) results.demos.push(await measure(browser, demo));
await browser.close();
fs.writeFileSync(out, JSON.stringify(results, null, 1) + '\n');
for (const r of results.demos) {
  console.log(`${r.demo}: ${r.pages} pages`);
  for (const span of ['load', 'scroll', 'idle']) {
    const s = r[span];
    console.log(`  ${span}${span === 'idle' ? ` ${r.idleMs} ms` : ''}: ${s.moved} moved (${s.movedByPage}), ${s.refills} refill transactions; ${s.observations} observations, ${s.unrecorded} of nodes not recorded, ${s.borderDiffers} whose border box differs from the record; content box differing from the record:`);
    for (const d of s.differ) console.log(`    ${d}`);
  }
  if (r.warnings.length) console.log(`  warnings: ${r.warnings.slice(0, 5).join(' | ')}${r.warnings.length > 5 ? ` (+${r.warnings.length - 5})` : ''}`);
}
