/**
 * The guard's comparison, without a browser: the page where two hosts' words part.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { firstDifference } from '../src/compare.js';

test('two hosts with the same words on every page agree', () => {
  assert.deepEqual(firstDifference([['a', 'b'], ['c']], [['a', 'b'], ['c']]), { pages: [2, 2], first: null });
});

test('a word moved across a cut is the page it left', () => {
  assert.deepEqual(firstDifference([['a', 'b'], ['c']], [['a'], ['b', 'c']]), { pages: [2, 2], first: 1 });
});

test('a page only one host has is a difference, on that page', () => {
  assert.deepEqual(firstDifference([['a']], [['a'], ['b']]), { pages: [1, 2], first: 2 });
});

test('words are compared, not their spelling across a join', () => {
  assert.deepEqual(firstDifference([['ab', 'c']], [['a', 'bc']]).first, 1);
});
