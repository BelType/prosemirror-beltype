/**
 * The random edits' red cases: each a seed of `scripts/specimen.mjs --random` that a fill of the edited chain and the cold fill after `invalidate()` disagree on, paced (the chain quiet after every edit) so the run does not depend on the clock, narrowed with `--skip` to the edits it needs. Each is `todo` until its fault is fixed, and then loses the flag.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const root = new URL('..', import.meta.url).pathname;
const run = (/** @type {string[]} */ args) => promisify(execFile)('node', ['scripts/specimen.mjs', ...args], { cwd: root, maxBuffer: 1 << 26 }).then(() => 0, (/** @type {any} */ e) => e.code);

test('specimen, seed 6: a chapter heading split and lifted out of its section, after a redraw, leaves a page cut for a page name the cold fill does not see', async () => {
  assert.equal(await run(['fixtures/specimen', '--random', '6:20', '--paced', '--skip', '1,2,10,11,12,13,14,15,16,17,18,19,20']), 0);
});
