// The nine scenes. T2.1 is done when each scene's layer count and colours
// match the prototype exactly; this re-runs the prototype's own scenes() and
// compares, layer by layer. T2.2 is done when all nine paint at header height
// and full height, on short and tall phones, with no stretched geometry.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { expandSmoothQuads, prototypeScenes } from '../tools/prototypeScenes.ts';
import { SCENE_H, SCENE_W, sceneFloor, sceneFrame, sceneLayers, scenePlacement, warmScenePaths } from '../src/paint/scenes/index.ts';
import { parsePath } from '../src/paint/pathParser.ts';
import { allPaths, layerBounds, type Layer } from '../src/paint/primitives.ts';
import { sceneSkies, tahanScenes, type SceneKey } from '../src/theme/palettes.ts';

const here = dirname(fileURLToPath(import.meta.url));
const proto = prototypeScenes(readFileSync(join(here, '../design/Tahan.dc.html'), 'utf8'));

const colourOf = (l: Layer): string => {
  switch (l.kind) {
    case 'strokePath': return l.stroke;
    case 'sky': return 'sky';
    case 'group': return 'group';
    default: return l.fill;
  }
};

describe('T2.1 — transcribed exactly', () => {
  test('the same nine scenes, in the same order as the palettes', () => {
    assert.deepEqual(proto.map((s) => s.key), tahanScenes.map((s) => s.key));
  });

  for (const s of proto) {
    test(`${s.key}: layer count, kinds, colours, opacities and geometry match the prototype`, () => {
      const ours = sceneLayers(s.key as SceneKey);
      assert.equal(ours.length, s.layers.length, 'layer count');
      s.layers.forEach((p, i) => {
        const l = ours[i];
        const at = `${s.key} layer ${i}`;
        if (p.isRect && String(p.f).startsWith('url(')) {
          assert.equal(l.kind, 'sky', at);
          if (l.kind === 'sky') assert.deepEqual(l.stops, sceneSkies[s.key as SceneKey].stops, at);
          return;
        }
        assert.equal(colourOf(l), (p.isPath && p.f === 'none' ? p.s : p.f).toUpperCase(), `${at} colour`);
        assert.equal(l.kind === 'group' || l.kind === 'sky' ? 1 : l.opacity, p.o, `${at} opacity`);
        if (p.isRect) assert.ok(l.kind === 'rect' && l.x === p.x && l.y === p.y && l.w === p.w && l.h === p.h && l.r === p.rx, at);
        if (p.isCircle) assert.ok(l.kind === 'circle' && l.cx === p.cx && l.cy === p.cy && l.r === p.r, at);
        if (p.isEllipse) assert.ok(l.kind === 'ellipse' && l.cx === p.cx && Math.abs(l.rx - p.rx) < 1e-3 && Math.abs(l.ry - p.ry) < 1e-3, at);
        if (p.isPath) {
          assert.ok(l.kind === 'fillPath' || l.kind === 'strokePath', at);
          if (l.kind === 'fillPath' || l.kind === 'strokePath') assert.equal(l.d, expandSmoothQuads(p.d), at);
          if (l.kind === 'strokePath') assert.equal(l.width, p.sw, at);
        }
      });
      assert.equal(sceneFloor(s.key as SceneKey), s.floor.toUpperCase(), 'floor');
    });
  }

  test('the seven smooth quadratics became exactly the Qs in SETUP.md', () => {
    const setup = readFileSync(join(here, '../SETUP.md'), 'utf8');
    const pairs = [...setup.matchAll(/^(M0 \d+ Q[^\n]*T[^\n]*)\n(M0 \d+ Q[^\n]*)$/gm)];
    assert.equal(pairs.length, 7);
    for (const [, before, after] of pairs) assert.equal(expandSmoothQuads(before), after);
    const converted = proto.flatMap((s) => s.layers).filter((l) => l.isPath && l.d.includes('T'));
    assert.equal(converted.length, 7);
  });

  test('every path parses — absolute M L Q C Z only', () => {
    for (const s of proto) for (const d of allPaths(sceneLayers(s.key as SceneKey))) assert.doesNotThrow(() => parsePath(d), d);
    assert.ok(warmScenePaths() > 100);
  });
});

describe('T2.2 — painted into any rect', () => {
  const phones = [{ name: 'short', w: 375, h: 667 }, { name: 'tall', w: 430, h: 932 }];

  test('scaled uniformly on width and anchored top — never stretched', () => {
    for (const { w } of phones) {
      const { scale, height } = scenePlacement(w);
      assert.equal(height / SCENE_H, w / SCENE_W, 'one scale for both axes');
      for (const key of tahanScenes.map((s) => s.key)) {
        const [scene, floor] = sceneFrame(key, w, 900);
        assert.equal(floor.kind, 'rect');
        assert.ok(scene.kind === 'group' && scene.transform?.scale === scale && scene.transform.y === 0, key);
      }
    }
  });

  test('at header height the scene fills the width and is cropped, not squashed — no ground drawn', () => {
    for (const { w } of phones) {
      for (const key of tahanScenes.map((s) => s.key)) {
        assert.equal(sceneFrame(key, w, 200).length, 1);
        const b = layerBounds(sceneFrame(key, w, 216));
        assert.ok(Math.abs(b.left) < 1e-6 && Math.abs(b.right - w) < 1e-6, `${key} spans the width`);
      }
    }
  });

  test('at full height the ground colour carries the room to the bottom', () => {
    for (const { w, h } of phones) {
      for (const key of tahanScenes.map((s) => s.key)) {
        const [, floor] = sceneFrame(key, w, h);
        const { height: drawn } = scenePlacement(w);
        assert.ok(floor.kind === 'rect' && floor.fill === sceneFloor(key), key);
        assert.ok(floor.kind === 'rect' && floor.y < drawn && floor.y + floor.h === h, `${key}: tucked under the scene and down to the bottom`);
      }
    }
  });

  test('each floor is the colour of the scene\'s own lowest ground, so the join doesn\'t show', () => {
    for (const s of tahanScenes) {
      const grounds = sceneLayers(s.key).filter((l) => {
        if (l.kind !== 'fillPath') return false;
        const b = layerBounds([l]);
        return b.left <= 0 && b.right >= SCENE_W && b.bottom >= SCENE_H;
      });
      const last = grounds[grounds.length - 1];
      assert.ok(last && last.kind === 'fillPath' && last.fill === sceneFloor(s.key), `${s.key}: ${last && 'fill' in last ? last.fill : '?'}`);
    }
  });
});
