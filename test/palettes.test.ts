// The palettes and skies are lifted from the design files. These tests re-read
// those files and fail if the TypeScript ever drifts from them.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  AvatarKit, sceneSkies, specForIndex, tahanScenes,
} from '../src/theme/palettes.ts';

const here = dirname(fileURLToPath(import.meta.url));
const design = (f: string) => readFileSync(join(here, '../design', f), 'utf8');

test('the nine palettes match tahan_palettes.dart exactly', () => {
  const dart = design('tahan_palettes.dart');
  const re = /key: '(\w+)', name: '([^']+)',\s*accent: Color\(0xFF(\w{6})\), accent2: Color\(0xFF(\w{6})\),\s*bg: Color\(0xFF(\w{6})\), surface: Color\(0xFF(\w{6})\),\s*dark: (true|false), drift: Drift\.(\w+)/g;
  const fromDart = [...dart.matchAll(re)].map((m) => ({
    key: m[1], name: m[2],
    accent: `#${m[3]}`, accent2: `#${m[4]}`, bg: `#${m[5]}`, surface: `#${m[6]}`,
    dark: m[7] === 'true', drift: m[8],
  }));
  assert.equal(fromDart.length, 9);
  assert.deepEqual(tahanScenes.map((s) => ({ ...s })), fromDart);
});

test('the avatar kit matches tahan_palettes.dart exactly', () => {
  const dart = design('tahan_palettes.dart');
  const list = (name: string) => {
    const m = new RegExp(`${name} = \\[([^\\]]+)\\]`).exec(dart);
    assert.ok(m, name);
    return [...m[1].matchAll(/0xFF(\w{6})/g)].map((x) => `#${x[1]}`);
  };
  assert.deepEqual([...AvatarKit.skins], list('skins'));
  assert.deepEqual([...AvatarKit.hairColors], list('hairColors'));
  assert.deepEqual([...AvatarKit.clothes], list('clothes'));
});

test('the nine skies match the prototype exactly', () => {
  const html = design('Tahan.dc.html');
  const re = /\{ key: '(\w+)', name: '[^']*', dark: (?:true|false),\s*pal: \{[^}]*\},\s*stops: (\[[^\]]*\])/g;
  const found = [...html.matchAll(re)];
  assert.equal(found.length, 9);
  for (const m of found) {
    const stops = new Function(`return ${m[2]}`)() as { o: number | string; c: string }[];
    const sky = sceneSkies[m[1] as keyof typeof sceneSkies];
    assert.ok(sky, m[1]);
    assert.deepEqual([...sky.stops], stops.map((s) => s.c.toUpperCase()), m[1]);
    assert.deepEqual([...sky.positions], stops.map((s) => Number(s.o)), m[1]);
  }
});

test('specForIndex is deterministic and covers the range', () => {
  assert.deepEqual(specForIndex(7), specForIndex(7));
  const seen = new Set<number>();
  for (let i = 0; i < 200; i++) {
    const s = specForIndex(i);
    seen.add(s.hair);
    assert.ok(s.skin >= 0 && s.skin < 5 && s.hair >= 0 && s.hair < 8);
    assert.ok(s.glasses >= 0 && s.glasses < 4 && s.face >= 0 && s.face < 4);
  }
  assert.equal(seen.size, 8, 'all eight hairstyles appear in the first 200');
});
