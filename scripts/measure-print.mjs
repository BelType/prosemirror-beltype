// usage: node scripts/measure-print.mjs <fixture>... — for each fixture a self-contained copy (base.css inlined, since `beltype print` refuses a reference outside the document's folder) under /private/tmp/pmb-measure/print/, then `lockf` + `node <cli>/dist/src/cli.js print` three times, each wall time (lock wait excluded) printed as one JSON line with the pages the PDF holds. CLI: BELTYPE_CLI, /Volumes/dev/Codeberg/BelType/cli by default, read-only.
import { cpSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('..', import.meta.url));
const cli = process.env.BELTYPE_CLI ?? '/Volumes/dev/Codeberg/BelType/cli';
const base = readFileSync(path.join(here, 'fixtures/base.css'), 'utf8');
for (const name of process.argv.slice(2)) {
  const dir = `/private/tmp/pmb-measure/print/${name}`;
  mkdirSync(dir, { recursive: true });
  const html = readFileSync(path.join(here, 'fixtures/measure', name, 'index.html'), 'utf8').replace('<link rel="stylesheet" href="../base.css">', () => `<style>${base}</style>`);
  writeFileSync(path.join(dir, 'index.html'), html);
  // The base look asks for /fonts/…, which must sit inside the document's folder.
  cpSync(path.join(here, 'fixtures/fonts'), path.join(dir, 'fonts'), { recursive: true });
  for (let r = 1; r <= 3; r++) {
    const out = path.join(dir, `out${r}.pdf`);
    // The lock wait is outside the timing: the timed child is the one the lock runs.
    const timed = `const t=Date.now();const r=require('child_process').spawnSync('node',['${cli}/dist/src/cli.js','print','${dir}/index.html','-o','${out}'],{cwd:'${cli}',encoding:'utf8'});console.log(JSON.stringify({ms:Date.now()-t,status:r.status,err:(r.stderr||'').slice(0,200)}))`;
    const p = spawnSync('lockf', ['-t', '3600', '/private/tmp/beltype-browser.lock', 'node', '-e', timed], { encoding: 'utf8' });
    const got = JSON.parse(p.stdout.trim().split('\n').pop());
    let pages = null, pdfBytes = null;
    try { pages = (readFileSync(out, 'latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length; pdfBytes = statSync(out).size; } catch { /* the CLI refused: `err` says why */ }
    console.log(JSON.stringify({ fixture: name, run: r, load: os.loadavg()[0].toFixed(1), pdfBytes, pages, ...got }));
  }
}
