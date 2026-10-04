// The room over the scene: the time-of-day wash (T2.3) and the ambient drift
// (T2.4). What a device must prove — the wash changing after a resume, drift
// pausing in the background — is checked there; what's provable here is the
// rules underneath.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { dayPartAt, dayParts, washes } from '../src/paint/wash.ts';
import { driftParticles, particleAt, particleCount } from '../src/paint/drift.ts';
import { tahanScenes } from '../src/theme/palettes.ts';

describe('T2.3 — the wash follows the clock', () => {
  test('four bands through the day, and the small hours are night', () => {
    const at = (h: number) => dayPartAt(h);
    assert.deepEqual([5, 10, 11, 16, 17, 19, 20, 23, 0, 2, 4].map(at),
      ['morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening', 'night', 'night', 'night', 'night', 'night']);
    assert.equal(new Set(Array.from({ length: 24 }, (_, h) => at(h))).size, 4);
  });

  test('each wash is low-alpha and differs from the others', () => {
    for (const part of dayParts) {
      const w = washes[part];
      assert.equal(w.colors.length, w.positions.length);
      for (const c of w.colors) {
        const a = Number(/rgba\(\d+, \d+, \d+, ([\d.]+)\)/.exec(c)?.[1]);
        assert.ok(a >= 0 && a <= 0.55, `${part}: ${c}`);
      }
    }
    assert.equal(new Set(dayParts.map((p) => JSON.stringify(washes[p]))).size, 4);
  });
});

describe('T2.4 — ambient drift', () => {
  test('each scene drifts with its own effect and count', () => {
    for (const s of tahanScenes) {
      const ps = driftParticles(s.key, s.drift);
      assert.equal(ps.length, particleCount(s.drift), s.key);
      assert.ok(ps.length >= 6 && ps.length <= 26);
    }
  });

  test('draws zero particles when motion is off — not slowed ones', () => {
    for (const s of tahanScenes) assert.deepEqual(driftParticles(s.key, s.drift, false), []);
  });

  test('the pattern is the same on every build: a hash of index and scene key, never random', () => {
    for (const s of tahanScenes) assert.deepEqual(driftParticles(s.key, s.drift), driftParticles(s.key, s.drift));
    const a = driftParticles('desert', 'dust').map((p) => p.y);
    const b = driftParticles('savanna', 'dust').map((p) => p.y);
    assert.notDeepEqual(a, b, 'two scenes with the same effect still differ');
    const phases = driftParticles('winter', 'snow').map((p) => p.phase);
    assert.ok(new Set(phases.map((v) => v.toFixed(3))).size > 20, 'phases spread out');
  });

  test('every particle loops, and stays in or near the room', () => {
    for (const s of tahanScenes) {
      for (const p of driftParticles(s.key, s.drift)) {
        for (const [w, h] of [[390, 844], [390, 210]]) {
          const a = particleAt(p, 3.7, w, h);
          const b = particleAt(p, 3.7 + p.duration, w, h);
          assert.ok(Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6, `${s.key} loops`);
          for (let t = 0; t < p.duration; t += p.duration / 17) {
            const f = particleAt(p, t, w, h);
            assert.ok(f.x > -0.3 * w && f.x < 1.4 * w && f.y > -0.15 * h && f.y < 1.15 * h, `${s.key} at ${t}`);
            assert.ok(f.opacity > 0 && f.opacity <= 1);
          }
        }
      }
    }
  });

  test('fireflies glow and fade in place; the rest travel', () => {
    const [fly] = driftParticles('night', 'fireflies');
    const dim = particleAt(fly, -fly.phase * fly.duration, 390, 844);
    const bright = particleAt(fly, (0.5 - fly.phase) * fly.duration, 390, 844);
    assert.ok(bright.opacity > 0.9 && dim.opacity < 0.15);
    assert.ok(Math.abs(bright.x - dim.x) < 1e-9);
    const [flake] = driftParticles('winter', 'snow');
    assert.ok(particleAt(flake, flake.duration * 0.5, 390, 844).y > particleAt(flake, 0.1, 390, 844).y || flake.phase > 0.4);
  });
});
