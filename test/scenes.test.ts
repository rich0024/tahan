// The nine scene paintings (assets/scenes/), and how one is painted into a
// rect: scaled on width, anchored top, never stretched, with the painting's
// own ground colour carrying on below it.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ART_H, ART_W, artFloor, artPlacement } from '../src/paint/sceneArt.ts';
import { tahanScenes } from '../src/theme/palettes.ts';

const here = dirname(fileURLToPath(import.meta.url));

describe('the scene paintings', () => {
  test('one per scene, a real WebP, small enough to ship', () => {
    let total = 0;
    for (const { key } of tahanScenes) {
      const file = join(here, `../assets/scenes/${key}.webp`);
      assert.ok(existsSync(file), key);
      const header = readFileSync(file).subarray(0, 12);
      assert.equal(header.subarray(0, 4).toString(), 'RIFF', key);
      assert.equal(header.subarray(8, 12).toString(), 'WEBP', key);
      total += statSync(file).size;
      assert.match(artFloor[key], /^#[0-9A-F]{6}$/, key);
    }
    assert.ok(total < 1_000_000, `${Math.round(total / 1024)} KB for all nine`);
  });

  test('scaled on width, never stretched, and the fade ends where the ground begins', () => {
    for (const w of [375, 390, 430]) {
      const p = artPlacement(w);
      assert.equal(p.width, w);
      assert.ok(Math.abs(p.height / p.width - ART_H / ART_W) < 1e-9, 'one scale for both axes');
      assert.ok(Math.abs(p.fadeTop + p.fadeHeight - p.height) < 1e-9);
    }
  });
});
