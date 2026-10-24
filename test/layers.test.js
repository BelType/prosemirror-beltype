/**
 * The dependency direction (*the engine knows no view*, BelType's decision record of 2026-10-24): this package imports the fragmented view and the engine; neither imports it or the other. What is asserted here is this package's half, that nothing under `src/` is reached from either of them, which the two upstream sweeps assert on their side; here, the package's own import list is pinned so a new import is a deliberate act.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../src/', import.meta.url));
const ALLOWED = /^(prosemirror-(fragview|model|state|transform)|@egildo\/beltype-engine-cicero(\/.*)?|\.\/.*)$/;

test('every import under src/ is the view, the engine or a sibling', () => {
  for (const file of readdirSync(src).filter((f) => f.endsWith('.js'))) {
    const text = readFileSync(src + file, 'utf8');
    for (const m of text.matchAll(/^import .* from '([^']+)'/gm)) assert.match(m[1], ALLOWED, `${file} imports ${m[1]}`);
  }
});
