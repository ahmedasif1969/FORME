import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextDownloads } from '../src/downloadQueue.ts';

test('starts eight nearby frames before background work', () => {
  assert.deepEqual(nextDownloads(20, [0, 1, 2, 3, 4, 5, 6, 7, 8], new Set(), new Set(), new Set()), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test('reserves two slots when nearby frames are cached', () => {
  assert.deepEqual(nextDownloads(20, [0, 1], new Set(), new Set([0, 1]), new Set()), [2, 3, 4, 5, 6, 7]);
});

test('starts newly needed frames while six distant downloads are in flight', () => {
  assert.deepEqual(nextDownloads(30, [8, 7, 6], new Set([20, 21, 22, 23, 24, 25]), new Set([8]), new Set()), [7, 6]);
});

test('direction changes respect the total limit and do not duplicate active requests', () => {
  assert.deepEqual(nextDownloads(30, [8, 7, 6, 5], new Set([9, 10, 7, 20, 21, 22, 23]), new Set([8]), new Set([6])), [5]);
});

test('background loading eventually completes the whole sequence without scrolling', () => {
  const downloaded = new Set([0, 1, 2]);
  for (let round = 0; round < 20 && downloaded.size < 30; round++) {
    const batch = nextDownloads(30, [0, 1, 2], new Set(), downloaded, new Set());
    assert.ok(batch.length > 0 && batch.length <= 6);
    batch.forEach(index => downloaded.add(index));
  }
  assert.equal(downloaded.size, 30);
});
