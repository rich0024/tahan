// T1.4 — every avatar matches the prototype, and nothing escapes the box.
//
// Two kinds of check:
//
//   * Parity. The prototype's own `avatar()` is lifted out of Tahan.dc.html,
//     run as-is, and compared shape by shape with our port for every
//     hair × glasses × face × skin combination and every companion. A typo in
//     any of the forty shapes fails here.
//
//   * Bounds. "No clipped hair, no floating glasses" is a visual check on the
//     debug grid, but its mechanical half is testable: if the union of every
//     shape stays inside the 78-unit box for every combination, nothing can be
//     clipped at any size.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  AVATAR_BOX, AVATAR_ORIGIN, avatarLayers, warmAvatarPaths, type AvatarKind,
} from '../src/paint/avatarGeometry.ts';
import { layerBounds, type Layer } from '../src/paint/primitives.ts';
import { avatarSpec, specFromMap, specToMap, type AvatarSpec } from '../src/theme/palettes.ts';

const here = dirname(fileURLToPath(import.meta.url));

function* everyPerson(): Generator<AvatarSpec> {
  for (let hair = 0; hair < 8; hair++)
    for (let glasses = 0; glasses < 4; glasses++)
      for (let face = 0; face < 4; face++)
        for (let skin = 0; skin < 5; skin++)
          yield { skin, hairColor: (skin + hair) % 5, top: (skin + glasses) % 5, hair, glasses, face };
}

const companions: AvatarKind[] = ['dog', 'cat', 'baby'];

// ---------------------------------------------------------------------------
// The prototype, run as-is.

interface ProtoLayer {
  isPath?: 1; isRect?: 1; isCircle?: 1; isEllipse?: 1;
  [k: string]: unknown;
}

function loadPrototypeAvatar(): (spec: Record<string, unknown>) => ProtoLayer[] {
  const html = readFileSync(join(here, '../design/Tahan.dc.html'), 'utf8');
  const start = html.indexOf('  avKit() {');
  const end = html.indexOf('  avFor(spec, sc) {');
  assert.ok(start > 0 && end > start, 'could not find avKit()/avatar() in the prototype');
  // Two class methods, verbatim. Wrap them in a class and instantiate.
  const Klass = new Function(`return class { ${html.slice(start, end)} }`)() as new () => {
    avatar(spec: Record<string, unknown>): ProtoLayer[];
  };
  const instance = new Klass();
  return (spec) => instance.avatar(spec);
}

/** Our layer, in the prototype's object shape, so the two can be deep-compared. */
function toProto(l: Layer): ProtoLayer {
  const f = (c: string) => c.toLowerCase();
  switch (l.kind) {
    case 'rect':
      return { isRect: 1, x: l.x, y: l.y, w: l.w, h: l.h, f: f(l.fill), o: l.opacity, rx: l.r };
    case 'circle':
      return { isCircle: 1, cx: l.cx, cy: l.cy, r: l.r, f: f(l.fill), o: l.opacity };
    case 'ellipse': {
      const t = l.rotation
        ? `rotate(${l.rotation.deg} ${l.rotation.px ?? l.cx} ${l.rotation.py ?? l.cy})`
        : null;
      return { isEllipse: 1, cx: l.cx, cy: l.cy, rx: l.rx, ry: l.ry, t, f: f(l.fill), o: l.opacity };
    }
    case 'fillPath':
      return { isPath: 1, d: l.d, f: f(l.fill), o: l.opacity };
    case 'strokePath':
      return { isPath: 1, d: l.d, f: 'none', s: f(l.stroke), sw: l.width, o: l.opacity };
    case 'sky':
      throw new Error('avatars have no sky layer');
  }
}

function normaliseProto(l: ProtoLayer): ProtoLayer {
  const out: ProtoLayer = { ...l };
  for (const k of ['f', 's'] as const) {
    if (typeof out[k] === 'string') out[k] = (out[k] as string).toLowerCase();
  }
  if (out.isEllipse && out.t === undefined) out.t = null;
  return out;
}

describe('parity with the prototype', () => {
  const prototype = loadPrototypeAvatar();

  test('every person combination, shape for shape', () => {
    let checked = 0;
    for (const spec of everyPerson()) {
      const theirs = prototype({ kind: 'person', ...spec }).map(normaliseProto);
      const ours = avatarLayers(spec).map(toProto);
      assert.deepEqual(ours, theirs, `mismatch for ${JSON.stringify(spec)}`);
      checked++;
    }
    assert.equal(checked, 8 * 4 * 4 * 5);
  });

  test('every companion and coat, shape for shape', () => {
    for (const kind of companions) {
      for (let coat = 0; coat < 5; coat++) {
        const spec = avatarSpec({ skin: coat, hairColor: (coat + 1) % 5, top: (coat + 2) % 5 });
        const theirs = prototype({ kind, coat, ...spec }).map(normaliseProto);
        const ours = avatarLayers(spec, kind, coat).map(toProto);
        assert.deepEqual(ours, theirs, `mismatch for ${kind} coat ${coat}`);
      }
    }
  });
});

// ---------------------------------------------------------------------------

function assertInsideBox(layers: Layer[], label: string) {
  const b = layerBounds(layers);
  const left = b.left + AVATAR_ORIGIN.x;
  const top = b.top + AVATAR_ORIGIN.y;
  const right = b.right + AVATAR_ORIGIN.x;
  const bottom = b.bottom + AVATAR_ORIGIN.y;
  assert.ok(left >= 0 && top >= 0 && right <= AVATAR_BOX && bottom <= AVATAR_BOX,
    `${label} escapes the box: ${left.toFixed(2)},${top.toFixed(2)} → ${right.toFixed(2)},${bottom.toFixed(2)}`);
}

describe('bounds', () => {
  test('every person combination stays inside the 78-unit box', () => {
    for (const spec of everyPerson()) assertInsideBox(avatarLayers(spec), JSON.stringify(spec));
  });

  test('every companion stays inside the box', () => {
    for (const kind of companions)
      for (let coat = 0; coat < 5; coat++)
        assertInsideBox(avatarLayers(avatarSpec(), kind, coat), `${kind}/${coat}`);
  });
});

describe('structure', () => {
  test('Bald draws no hair; every other style draws some', () => {
    const bald = avatarLayers(avatarSpec({ hair: 6 })).length;
    for (let hair = 0; hair < 8; hair++) {
      const n = avatarLayers(avatarSpec({ hair })).length;
      if (hair === 6) assert.equal(n, bald);
      else assert.ok(n > bald, `hair ${hair}`);
    }
  });

  test('glasses redraw the eyes over the lens', () => {
    const eyes = (layers: Layer[]) =>
      layers.filter((l) => l.kind === 'circle' && (l.cx === 26 || l.cx === 38) && l.r < 3).length;
    assert.equal(eyes(avatarLayers(avatarSpec({ glasses: 0 }))), 2);
    for (const glasses of [1, 2, 3]) assert.equal(eyes(avatarLayers(avatarSpec({ glasses }))), 4);
  });

  test('out-of-range and negative integers wrap rather than crash', () => {
    assert.doesNotThrow(() => avatarLayers({ skin: 99, hairColor: -3, top: 7, hair: 12, glasses: -1, face: 9 }));
  });

  test('the six integers are the whole of the spec, and survive a round trip', () => {
    const spec = { skin: 3, hairColor: 1, top: 4, hair: 5, glasses: 2, face: 1 };
    assert.deepEqual(specFromMap(specToMap(spec)), spec);
    assert.equal(Object.keys(specToMap(spec)).length, 6);
    assert.deepEqual(specFromMap({}), avatarSpec());
  });
});

test('every path an avatar can use parses at launch', () => {
  // 1 ground + 1 body + 1 mouth + 1 cap + 3 facial hair + 2 temple arms
  // + dog 2 + cat 5 + baby 3 = 19 distinct strings.
  assert.equal(warmAvatarPaths(), 19);
});
