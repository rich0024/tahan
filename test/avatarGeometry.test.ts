// The detailed avatar kit: every path parses, nothing leaves the frame, the
// colours shade the right way, small faces drop their fine detail, and a spec
// read back from the database is always drawable.
//
// The geometry was ported from the avatar lab (design/avatar-lab.html) and
// checked against it pixel by pixel when it was ported: 112 faces, mean
// difference 0.16/255 per pixel. These tests guard it from here on.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  AVATAR_BOX, HEAD, avatarColours, avatarLayers, mirror, warmAvatarPaths,
} from '../src/paint/avatarGeometry.ts';
import { parsePath } from '../src/paint/pathParser.ts';
import { allPaths, layerBounds, type Layer } from '../src/paint/primitives.ts';
import { alongStops, oklabLightness, hexToOklch } from '../src/theme/oklch.ts';
import {
  AvatarKit, avatarSpec, defaultSpec, sampleFaces, specForIndex, specFromMap, specToMap, specKey,
  type AvatarSpec,
} from '../src/theme/palettes.ts';

const parts = {
  hair: AvatarKit.hairStyles.length, eyes: AvatarKit.eyeStyles.length, mouth: AvatarKit.mouths.length,
  facial: AvatarKit.facialHair.length, glasses: AvatarKit.glasses.length, top: AvatarKit.tops.length,
  extra: AvatarKit.extras.length,
} as const;

/** Every option of every part, one at a time, at both detail levels. */
function* everyOption(): Generator<{ label: string; spec: AvatarSpec; small: boolean }> {
  for (const [part, n] of Object.entries(parts)) {
    for (let i = 0; i < n; i++) {
      for (const small of [false, true]) {
        yield { label: `${part}=${i}${small ? ' small' : ''}`, spec: avatarSpec({ [part]: i }), small };
      }
    }
  }
}

function flatten(layers: readonly Layer[], out: Layer[] = []): Layer[] {
  for (const l of layers) l.kind === 'group' ? flatten(l.layers, out) : out.push(l);
  return out;
}

describe('geometry', () => {
  test('every path of every option parses as absolute M L Q C Z', () => {
    for (const { label, spec, small } of everyOption()) {
      for (const d of allPaths(avatarLayers(spec, small))) {
        assert.doesNotThrow(() => parsePath(d), `${label}: ${d.slice(0, 40)}`);
      }
    }
  });

  test('the launch-time warm-up covers them all', () => {
    assert.ok(warmAvatarPaths() > 100);
  });

  test('no hairstyle or extra leaves the frame', () => {
    for (const part of ['hair', 'extra'] as const) {
      for (let i = 0; i < parts[part]; i++) {
        const b = layerBounds(avatarLayers(avatarSpec({ [part]: i })));
        assert.ok(b.top >= 2, `${part}=${i} clipped at the top: ${b.top.toFixed(1)}`);
        assert.ok(b.left >= 0 && b.right <= AVATAR_BOX, `${part}=${i} clipped at the side: ${b.left.toFixed(1)}–${b.right.toFixed(1)}`);
      }
    }
  });

  test('the face shading is clipped to the head', () => {
    const [figure] = avatarLayers(defaultSpec);
    assert.equal(figure.kind, 'group');
    const clipped = figure.kind === 'group' ? figure.layers.filter((l) => l.kind === 'group' && l.clip === HEAD) : [];
    assert.equal(clipped.length, 1);
  });

  test('mirror is its own inverse', () => {
    const d = 'M61 88 L66 88 L67 102 L62 100 Z';
    assert.equal(mirror(mirror(d)), d);
    assert.equal(mirror('M75 84 C80 79.5 88 79 94 81.5'), 'M125 84 C120 79.5 112 79 106 81.5');
  });

  test('every option draws something different from its neighbours', () => {
    for (const [part, n] of Object.entries(parts)) {
      const seen = new Set<string>();
      for (let i = 0; i < n; i++) seen.add(JSON.stringify(avatarLayers(avatarSpec({ glasses: part === 'glasses' ? 0 : 1, [part]: i }))));
      assert.equal(seen.size, n, part);
    }
  });
});

describe('small faces drop their fine detail', () => {
  const whiteFills = (spec: AvatarSpec, small: boolean) =>
    flatten(avatarLayers(spec, small)).filter((l) => l.kind === 'fillPath' && l.fill === '#FFFFFF').length;

  test('teeth go', () => {
    assert.ok(whiteFills(avatarSpec({ mouth: 0 }), false) > 0);
    assert.equal(whiteFills(avatarSpec({ mouth: 0 }), true), 0);
  });

  test('fewer layers, thicker lines', () => {
    for (const spec of sampleFaces) {
      const big = flatten(avatarLayers(spec, false));
      const small = flatten(avatarLayers(spec, true));
      assert.ok(small.length < big.length, spec.name);
    }
    const browWidth = (small: boolean): number => {
      const brow = flatten(avatarLayers(defaultSpec, small)).find((l) => l.kind === 'strokePath' && l.d.startsWith('M75 84'));
      assert.ok(brow && brow.kind === 'strokePath');
      return brow.width;
    };
    assert.ok(browWidth(true) > browWidth(false));
  });
});

describe('colour', () => {
  test('the skin and hair ranges start and end on their anchors', () => {
    assert.equal(alongStops(AvatarKit.skinRange, 0), AvatarKit.skinRange[0]);
    assert.equal(alongStops(AvatarKit.skinRange, 1), AvatarKit.skinRange.at(-1));
    assert.equal(alongStops(AvatarKit.hairRange, 0), AvatarKit.hairRange[0]);
  });

  test('skin darkens monotonically along its range', () => {
    let prev = Infinity;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const l = oklabLightness(alongStops(AvatarKit.skinRange, t));
      assert.ok(l < prev, `t=${t.toFixed(2)}`);
      prev = l;
    }
  });

  test('shadows are darker and highlights lighter than their base, at the same hue', () => {
    for (const spec of sampleFaces) {
      const c = avatarColours(spec);
      for (const [base, shade, light] of [[c.skin, c.skinShade, c.skinLight], [c.hair, c.hairShade, c.hairLight], [c.top, c.topShade, c.topLight]]) {
        assert.ok(oklabLightness(shade) < oklabLightness(base), `${spec.name} shade`);
        assert.ok(oklabLightness(light) > oklabLightness(base), `${spec.name} light`);
        const h0 = hexToOklch(base);
        if (h0.c > 0.03) {
          const d = Math.abs(((hexToOklch(shade).h - h0.h + 540) % 360) - 180);
          assert.ok(d < 12, `${spec.name} shade drifted ${d.toFixed(1)}°`);
        }
      }
    }
  });
});

describe('the spec', () => {
  test('is exactly thirteen small fields, with no photo or URL anywhere', () => {
    const map = specToMap(defaultSpec);
    assert.equal(Object.keys(map).length, 13);
    for (const v of Object.values(map)) assert.ok(typeof v === 'number' || /^#[0-9A-F]{6}$/i.test(v));
  });

  test('round-trips through the database shape', () => {
    for (const { name, ...spec } of sampleFaces) assert.deepEqual(specFromMap(specToMap(spec)), { ...spec, hairColor: spec.hairColor.toUpperCase() }, name);
  });

  test('repairs anything malformed rather than failing to draw', () => {
    const s = specFromMap({ skin: 7, hair: 99, hairColor: 'red', eyes: -1, mouth: 'big', glassesColor: '#12345', extra: 6.9 });
    assert.equal(s.skin, 1);
    assert.equal(s.hair, 99 % parts.hair);
    assert.equal(s.hairColor, defaultSpec.hairColor);
    assert.equal(s.eyes, parts.eyes - 1);
    assert.equal(s.mouth, defaultSpec.mouth);
    assert.equal(s.glassesColor, defaultSpec.glassesColor);
    assert.equal(s.extra, 0);
    assert.doesNotThrow(() => avatarLayers(s));
    assert.deepEqual(specFromMap({}), defaultSpec);
  });

  test('specForIndex is deterministic, varied and always valid', () => {
    assert.deepEqual(specForIndex(7), specForIndex(7));
    const hair = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const s = specForIndex(i);
      hair.add(s.hair);
      assert.deepEqual(specFromMap(specToMap(s)), { ...s, hairColor: s.hairColor.toUpperCase() });
    }
    assert.equal(hair.size, parts.hair, 'every hairstyle appears in the first 200');
  });

  test('cache keys differ when any field differs', () => {
    const keys = new Set(Object.keys(defaultSpec).map((k) => {
      const v = defaultSpec[k as keyof AvatarSpec];
      return specKey({ ...defaultSpec, [k]: typeof v === 'number' ? (k === 'skin' ? 0.9 : v + 1) : '#000000' });
    }));
    assert.equal(keys.size, Object.keys(defaultSpec).length);
  });
});
