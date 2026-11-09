// usage: node scripts/verdicts.mjs <before.jsonl> <after.jsonl> — the verdict test of a change that must move no cut: every fixture's pages in both hosts (measure.mjs `--pages`: each page's first and last word and word count, the CLI round's and the view's) are compared, every run of `after` against the first run of `before`. Prints one line per fixture and exits 1 at the first page that differs, or a fixture `after` lacks.
import { readFileSync } from 'node:fs';
const read = (file) => {
  const by = new Map();
  for (const line of readFileSync(file, 'utf8').split('\n').filter(Boolean)) {
    const r = JSON.parse(line);
    if (!r.cliRead) continue;
    (by.get(r.fixture) ?? by.set(r.fixture, []).get(r.fixture)).push(r);
  }
  return by;
};
const key = (pages) => pages.map((p) => `${p.first}|${p.last}|${p.count}`);
const differs = (a, b) => { const n = Math.max(a.length, b.length); for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i + 1; return 0; };
const [before, after] = process.argv.slice(2).map(read);
let failed = false;
for (const [fixture, [base]] of before) {
  const runs = after.get(fixture);
  if (!runs) { console.log(`${fixture}: missing after`); failed = true; continue; }
  const bad = [];
  for (const r of runs) for (const side of ['cliRead', 'viewRead']) {
    const at = differs(key(base[side]), key(r[side]));
    if (at) bad.push(`${side} page ${at}: ${JSON.stringify(base[side][at - 1])} → ${JSON.stringify(r[side][at - 1])}`);
  }
  if (bad.length) failed = true;
  console.log(`${fixture}: ${bad.length ? `DIFFERS ${bad[0]}` : `identical (${base.cliRead.length} CLI pages, ${base.viewRead.length} view pages, ${runs.length} runs)`}`);
}
process.exit(failed ? 1 : 0);
