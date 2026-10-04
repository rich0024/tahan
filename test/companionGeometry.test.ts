// Companions are still the prototype's, transcribed line for line. The
// prototype's own avatar() is lifted out of Tahan.dc.html, run as-is, and
// compared shape for shape with ours for every companion and coat.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { COMPANION_BOX, COMPANION_ORIGIN, companionLayers, type CompanionKind } from '../src/paint/companionGeometry.ts';
import { layerBounds, type Layer } from '../src/paint/primitives.ts';

const here = dirname(fileURLToPath(import.meta.url));

interface ProtoLayer { [k: string]: unknown }
interface Proto {
  avatar(spec: Record<string, unknown>): ProtoLayer[];
  avKit(): { skins: string[]; hairColors: string[]; tops: string[]; coats: string[] };
}

function loadPrototype(): Proto {
  const html = readFileSync(join(here, '../design/Tahan.dc.html'), 'utf8');
  const start = html.indexOf('  avKit() {');
  const end = html.indexOf('  avFor(spec, sc) {');
  assert.ok(start > 0 && end > start, 'could not find avKit()/avatar() in the prototype');
  const Klass = new Function(`return class { ${html.slice(start, end)} }`)() as new () => Proto;
  return new Klass();
}

function toProto(l: Layer): ProtoLayer {
  const f = (c: string) => c.toLowerCase();
  switch (l.kind) {
    case 'rect': return { isRect: 1, x: l.x, y: l.y, w: l.w, h: l.h, f: f(l.fill), o: l.opacity, rx: l.r };
    case 'circle': return { isCircle: 1, cx: l.cx, cy: l.cy, r: l.r, f: f(l.fill), o: l.opacity };
    case 'ellipse': {
      const t = l.rotation ? `rotate(${l.rotation.deg} ${l.rotation.px ?? l.cx} ${l.rotation.py ?? l.cy})` : null;
      return { isEllipse: 1, cx: l.cx, cy: l.cy, rx: l.rx, ry: l.ry, t, f: f(l.fill), o: l.opacity };
    }
    case 'fillPath': return { isPath: 1, d: l.d, f: f(l.fill), o: l.opacity };
    case 'strokePath': return { isPath: 1, d: l.d, f: 'none', s: f(l.stroke), sw: l.width, o: l.opacity };
    default: throw new Error(`companions have no ${l.kind} layers`);
  }
}

function normalise(l: ProtoLayer): ProtoLayer {
  const out = { ...l };
  for (const k of ['f', 's']) if (typeof out[k] === 'string') out[k] = (out[k] as string).toLowerCase();
  if (out.isEllipse && out.t === undefined) out.t = null;
  return out;
}

const kinds: CompanionKind[] = ['dog', 'cat', 'baby'];

test('every companion and coat matches the prototype, shape for shape', () => {
  const proto = loadPrototype();
  const kit = proto.avKit();
  for (const kind of kinds) {
    for (let coat = 0; coat < 5; coat++) {
      const spec = { kind, coat, skin: coat, hairColor: (coat + 1) % 5, top: (coat + 2) % 5 };
      const theirs = proto.avatar(spec).map(normalise);
      const ours = companionLayers(kind, {
        coat: kit.coats[coat], top: kit.tops[spec.top], skin: kit.skins[spec.skin], hair: kit.hairColors[spec.hairColor],
      }).map(toProto);
      assert.deepEqual(ours, theirs, `${kind} coat ${coat}`);
    }
  }
});

test('every companion stays inside its box', () => {
  for (const kind of kinds) {
    const b = layerBounds(companionLayers(kind, { coat: '#D6B48A', top: '#C67139', skin: '#E6B98C', hair: '#2E2318' }));
    assert.ok(b.left + COMPANION_ORIGIN.x >= 0 && b.top + COMPANION_ORIGIN.y >= 0, kind);
    assert.ok(b.right + COMPANION_ORIGIN.x <= COMPANION_BOX && b.bottom + COMPANION_ORIGIN.y <= COMPANION_BOX, kind);
  }
});
