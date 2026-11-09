// usage: node scripts/measure-summary.mjs <results.jsonl>... — one row per fixture and keystroke spot: runs, pages, load average range, then median [min–max] of the CLI round, the view's fill, and the keystroke (every sample of every run pooled, ms). Also reads measure-print.mjs's lines.
import { readFileSync } from 'node:fs';
const med = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const f = (a) => `${Math.round(med(a))} [${Math.round(Math.min(...a))}–${Math.round(Math.max(...a))}]`;
const by = new Map();
for (const file of process.argv.slice(2)) for (const line of readFileSync(file, 'utf8').split('\n').filter(Boolean)) { const r = JSON.parse(line); (by.get(r.fixture) ?? by.set(r.fixture, []).get(r.fixture)).push(r); }
for (const [name, rs] of by) {
  const load = rs.map((r) => Number(r.load));
  const head = `${name} | runs ${rs.length} | load ${Math.min(...load)}–${Math.max(...load)}`;
  if (rs[0].viewMs === undefined) { console.log(`${head} | print pages ${rs.map((r) => r.pages).join('/')} | wall ms ${f(rs.map((r) => r.ms))}`); continue; }
  const spots = Object.keys(rs[0].keys);
  for (const s of spots) console.log(`${head} | pages ${rs[0].viewPages} | CLI-round ms ${f(rs.map((r) => r.cliMs))} | view fill ms ${f(rs.map((r) => r.viewMs))} | keystroke ${s} ms ${f(rs.flatMap((r) => r.keys[s]))}`);
}
