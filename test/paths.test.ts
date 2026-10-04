// The boundary, at a glance: every path that isn't a person's own or an
// invitation sits under /villages/{villageId}/.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { paths } from '../src/data/paths.ts';

test('everything but your own things and an invitation lives inside a village', () => {
  const outside = new Set(['user', 'recipe', 'invite', 'ownFile']);
  for (const [name, make] of Object.entries(paths)) {
    const args = Array.from({ length: make.length }, (_, i) => `id${i}`);
    const p = (make as (...a: string[]) => string)(...args);
    if (outside.has(name)) assert.ok(!p.startsWith('villages/'), name);
    else assert.ok(p.startsWith('villages/id0'), `${name}: ${p}`);
  }
});

test('where two people can act at once, the path ends in the person', () => {
  for (const make of [paths.reaction, paths.rsvp] as const) {
    assert.match(make('v', 'x', 'uid9'), /\/uid9$/);
  }
  assert.match(paths.status('v', 'uid9'), /\/uid9$/);
  assert.match(paths.imIn('v', 'e', 'i', 'uid9'), /\/uid9$/);
});
