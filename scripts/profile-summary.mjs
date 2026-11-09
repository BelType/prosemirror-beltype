// usage: node scripts/profile-summary.mjs <profile.cpuprofile> [n=30] — a CPU profile (measure.mjs `--profile`) read two ways: the functions by self time, and by inclusive time (a function counted once per stack, however deep it recurs), each with its share of the sampled time; `(idle)` is left out of the total.
import { readFileSync } from 'node:fs';
const { nodes, samples, timeDeltas } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const top = Number(process.argv[3] ?? 30);
const byId = new Map(nodes.map((n) => [n.id, n]));
const parent = new Map();
for (const n of nodes) for (const c of n.children ?? []) parent.set(c, n.id);
const name = (n) => `${n.callFrame.functionName || '(anonymous)'} ${n.callFrame.url.replace(/^.*\/(src|dist|node_modules)\//, '$1/')}:${n.callFrame.lineNumber + 1}`;
const self = new Map(); const incl = new Map(); let total = 0;
samples.forEach((id, i) => {
  const ms = (timeDeltas[i] ?? 0) / 1000;
  const n = byId.get(id);
  if (n.callFrame.functionName === '(idle)') return;
  total += ms;
  self.set(name(n), (self.get(name(n)) ?? 0) + ms);
  const seen = new Set();
  for (let x = id; x != null; x = parent.get(x)) { const k = name(byId.get(x)); if (!seen.has(k)) { seen.add(k); incl.set(k, (incl.get(k) ?? 0) + ms); } }
});
const show = (title, m) => { console.log(`\n${title} (of ${Math.round(total)} ms sampled)`); for (const [k, v] of [...m].sort((a, b) => b[1] - a[1]).slice(0, top)) console.log(`${String(Math.round(v)).padStart(8)} ms ${String((100 * v / total).toFixed(1)).padStart(5)}%  ${k}`); };
show('self', self);
show('inclusive', incl);
