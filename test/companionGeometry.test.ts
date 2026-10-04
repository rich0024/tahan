// Companions in the detailed kit: every path parses, nothing leaves the
// frame, every option draws something different, small companions drop their
// detail, and a companion read back from the database is always drawable.
//
// Ported from the avatar lab (design/avatar-lab.html) and checked against it
// pixel by pixel when it was ported.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { AVATAR_BOX } from '../src/paint/avatarGeometry.ts';
import { BABY_HEAD, CAT_HEAD, DOG_HEAD, companionLayers, warmCompanionPaths } from '../src/paint/companionGeometry.ts';
import { parsePath } from '../src/paint/pathParser.ts';
import { allPaths, layerBounds, type Layer } from '../src/paint/primitives.ts';
import {
  CompanionKit, companionFromMap, companionKey, companionToMap, defaultCompanion, fitCompanion,
  sampleCompanions, type CompanionSpec,
} from '../src/theme/palettes.ts';

const spec = (partial: Partial<CompanionSpec>): CompanionSpec => fitCompanion({ ...defaultCompanion, markings: 0, accessory: 0, ...partial });

function* everyOption(): Generator<{ label: string; spec: CompanionSpec }> {
  for (let kind = 0; kind < 3; kind++) {
    for (const [part, lists] of [['style', CompanionKit.styles], ['markings', CompanionKit.markings], ['accessory', CompanionKit.accessories]] as const) {
      for (let i = 0; i < lists[kind].length; i++) {
        yield { label: `${CompanionKit.kinds[kind]} ${part}=${i}`, spec: spec({ kind, [part]: i }) };
      }
    }
  }
}

function flatten(layers: readonly Layer[], out: Layer[] = []): Layer[] {
  for (const l of layers) l.kind === 'group' ? flatten(l.layers, out) : out.push(l);
  return out;
}

describe('geometry', () => {
  test('every path of every kind and option parses as absolute M L Q C Z', () => {
    for (const { label, spec: s } of everyOption()) {
      for (const small of [false, true]) {
        for (const d of allPaths(companionLayers(s, small))) assert.doesNotThrow(() => parsePath(d), label);
      }
    }
    assert.ok(warmCompanionPaths() > 60);
  });

  test('nothing leaves the frame', () => {
    for (const { label, spec: s } of everyOption()) {
      const b = layerBounds(companionLayers(s));
      assert.ok(b.top >= 2, `${label} clipped at the top: ${b.top.toFixed(1)}`);
      assert.ok(b.left >= 0 && b.right <= AVATAR_BOX, `${label} clipped at the side`);
    }
  });

  test('head shading is clipped to each kind of head', () => {
    const heads = [DOG_HEAD, CAT_HEAD, BABY_HEAD];
    for (let kind = 0; kind < 3; kind++) {
      const [figure] = companionLayers(spec({ kind }));
      assert.ok(figure.kind === 'group');
      assert.equal(figure.layers.filter((l) => l.kind === 'group' && l.clip === heads[kind]).length, 1, CompanionKit.kinds[kind]);
    }
  });

  test('every option draws something different', () => {
    for (let kind = 0; kind < 3; kind++) {
      for (const [part, lists] of [['style', CompanionKit.styles], ['markings', CompanionKit.markings], ['accessory', CompanionKit.accessories]] as const) {
        const seen = new Set<string>();
        for (let i = 0; i < lists[kind].length; i++) seen.add(JSON.stringify(companionLayers(spec({ kind, [part]: i }))));
        assert.equal(seen.size, lists[kind].length, `${CompanionKit.kinds[kind]} ${part}`);
      }
    }
  });

  test('the three kinds look nothing alike', () => {
    const drawn = new Set([0, 1, 2].map((kind) => JSON.stringify(companionLayers(spec({ kind })))));
    assert.equal(drawn.size, 3);
  });
});

describe('odd eyes', () => {
  const irises = (s: CompanionSpec) => new Set(flatten(companionLayers(s))
    .filter((l) => (l.kind === 'circle' && l.r === 7) || (l.kind === 'fillPath' && l.d.includes('C90 108 78 108') || (l.kind === 'fillPath' && l.d.includes('C110 108 122 108'))))
    .map((l) => (l.kind === 'circle' || l.kind === 'fillPath' ? l.fill : '')));

  test('each eye takes its own colour, for dogs and cats', () => {
    for (const kind of [0, 1]) {
      assert.deepEqual(irises(spec({ kind, eyeColor: '#6B4A2E', eyeColor2: '#7FB2D9' })), new Set(['#6B4A2E', '#7FB2D9']), CompanionKit.kinds[kind]);
      assert.deepEqual(irises(spec({ kind, eyeColor: '#6B4A2E', eyeColor2: '#6B4A2E' })), new Set(['#6B4A2E']), CompanionKit.kinds[kind]);
    }
  });

  test('the second colour is on the right, as you look at them', () => {
    const dog = flatten(companionLayers(spec({ kind: 0, eyeColor: '#6B4A2E', eyeColor2: '#7FB2D9' })));
    const blue = dog.find((l) => l.kind === 'circle' && l.fill === '#7FB2D9');
    assert.ok(blue && blue.kind === 'circle' && blue.cx > 100);
  });
});

describe('detail', () => {
  test('small companions drop detail', () => {
    for (const { name, ...s } of sampleCompanions) {
      assert.ok(flatten(companionLayers(s, true)).length < flatten(companionLayers(s, false)).length, name);
    }
  });

  test('a pacifier replaces the open mouth', () => {
    const tongue = (s: CompanionSpec) => flatten(companionLayers(s)).some((l) => l.kind === 'fillPath' && l.fill === '#E07A6A');
    assert.ok(tongue(spec({ kind: 2, accessory: 0 })));
    assert.ok(!tongue(spec({ kind: 2, accessory: 3 })));
  });
});

describe('the spec', () => {
  test('is exactly eleven small fields', () => {
    const map = companionToMap(defaultCompanion);
    assert.equal(Object.keys(map).length, 11);
    for (const v of Object.values(map)) assert.ok(typeof v === 'number' || /^#[0-9A-F]{6}$/i.test(v));
  });

  test('samples round-trip through the database shape', () => {
    for (const { name, ...s } of sampleCompanions) assert.deepEqual(companionFromMap(companionToMap(s)), s, name);
  });

  test('options are fitted to the kind', () => {
    const baby = fitCompanion({ ...defaultCompanion, kind: 2, style: 3, markings: 2, accessory: 3 });
    assert.equal(baby.markings, 0, 'babies have no markings');
    const cat = fitCompanion({ ...defaultCompanion, kind: 1, style: 3 });
    assert.ok(cat.style < CompanionKit.styles[1].length);
  });

  test('repairs anything malformed rather than failing to draw', () => {
    const s = companionFromMap({ kind: 7, mainColor: 'brown', skin: -3, style: 'x', accessoryColor: '#ABC' });
    assert.equal(s.kind, 1);
    assert.equal(s.mainColor, defaultCompanion.mainColor);
    assert.equal(s.skin, 0);
    assert.equal(s.accessoryColor, defaultCompanion.accessoryColor);
    assert.doesNotThrow(() => companionLayers(s));
    assert.deepEqual(companionFromMap({}), fitCompanion(defaultCompanion));
  });

  test('a companion saved before odd eyes existed gets matching eyes', () => {
    const { eyeColor2: _unused, ...old } = companionToMap(defaultCompanion);
    const s = companionFromMap(old);
    assert.equal(s.eyeColor2, s.eyeColor);
  });

  test('cache keys differ by kind', () => {
    assert.notEqual(companionKey(spec({ kind: 0 })), companionKey(spec({ kind: 1 })));
  });
});
