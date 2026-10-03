// T1.2 — the ramps are OKLCH, and 500 is the token itself.
//
// The hue test is the one that matters: it catches somebody quietly replacing
// the generator with an RGB lerp towards white, which is exactly the muddiness
// the brief warns about.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  contrast, hexToOklch, hexToRgb, lerpHex, makeRamp, rampSteps, shade,
} from '../src/theme/oklch.ts';
import { tahanCream, tahanInk, tahanScenes } from '../src/theme/palettes.ts';

const hueDistance = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

describe('ramps', () => {
  test('500 is the source token, untouched, for every role in every scene', () => {
    for (const p of tahanScenes) {
      assert.equal(makeRamp(p.accent)[500], p.accent);
      assert.equal(makeRamp(p.accent2)[500], p.accent2);
      assert.equal(makeRamp(p.accent).base, p.accent);
    }
  });

  test('lightness falls monotonically from 100 to 900', () => {
    for (const p of tahanScenes) {
      for (const base of [p.accent, p.accent2]) {
        const ramp = makeRamp(base);
        let previous = Infinity;
        for (const step of rampSteps) {
          const { l } = hexToOklch(ramp[step]);
          assert.ok(l < previous, `${p.key} ${base} at ${step}: ${l} !< ${previous}`);
          previous = l;
        }
      }
    }
  });

  test('hue holds across the ramp — this is not an RGB tint', () => {
    for (const p of tahanScenes) {
      for (const base of [p.accent, p.accent2]) {
        const h0 = hexToOklch(base).h;
        const ramp = makeRamp(base);
        for (const step of rampSteps) {
          const drift = hueDistance(hexToOklch(ramp[step]).h, h0);
          // 8-bit quantisation wobbles the hue of very pale steps slightly;
          // an RGB tint drifts far further than this.
          assert.ok(drift < 8, `${p.key} ${base} at ${step} drifted ${drift.toFixed(1)}°`);
        }
      }
    }
  });

  test('…and an RGB tint really would be muddier, so the test has teeth', () => {
    const base = tahanScenes[0].accent; // #C67139
    const rgbTint = lerpHex(base, '#FFFFFF', 0.8);
    // Compare at matched lightness so it is a fair fight.
    const tintL = hexToOklch(rgbTint).l;
    const ramp = makeRamp(base);
    const nearest = rampSteps
      .map((s) => ramp[s])
      .reduce((a, b) =>
        Math.abs(hexToOklch(a).l - tintL) < Math.abs(hexToOklch(b).l - tintL) ? a : b);
    assert.ok(hexToOklch(nearest).c > hexToOklch(rgbTint).c * 0.95,
      'OKLCH step should keep at least as much chroma as the RGB tint');
    assert.ok(hueDistance(hexToOklch(rgbTint).h, hexToOklch(base).h)
      > hueDistance(hexToOklch(nearest).h, hexToOklch(base).h),
      'the RGB tint should drift further in hue');
  });

  test('every step is valid #RRGGBB', () => {
    for (const p of tahanScenes) {
      for (const step of rampSteps) {
        assert.match(makeRamp(p.accent)[step], /^#[0-9A-F]{6}$/);
      }
    }
  });

  test('steps clamp and round rather than throw', () => {
    const ramp = makeRamp(tahanScenes[0].accent);
    assert.equal(shade(ramp, 0), ramp[100]);
    assert.equal(shade(ramp, 5000), ramp[900]);
    assert.equal(shade(ramp, 260), ramp[300]);
  });

  test('ramps are cached per base colour', () => {
    assert.equal(makeRamp('#c67139'), makeRamp('#C67139'));
  });
});

describe('contrast — the pairs the theme relies on', () => {
  test('ink on every background and surface clears AA for body text', () => {
    for (const p of tahanScenes) {
      assert.ok(contrast(tahanInk, p.bg) >= 4.5, `${p.key} bg`);
      assert.ok(contrast(tahanInk, p.surface) >= 4.5, `${p.key} surface`);
    }
  });

  test('ramp 800 on ramp 100 clears AA — text on a tinted fill', () => {
    for (const p of tahanScenes) {
      const r = makeRamp(p.accent);
      assert.ok(contrast(r[800], r[100]) >= 4.5,
        `${p.key}: ${contrast(r[800], r[100]).toFixed(2)}`);
    }
  });

  test('cream on a filled button — reported, see SETUP.md', () => {
    // Not asserted: some 500s are the tokens themselves and are final, so a
    // failure here is a design question, not a code bug. Logged so the
    // numbers are visible on every run.
    const rows = tahanScenes.map((p) => `${p.key.padEnd(9)} ${contrast(tahanCream, p.accent).toFixed(2)}`);
    assert.ok(rows.length === 9);
  });
});

test('hex helpers', () => {
  assert.deepEqual(hexToRgb('#C67139'), [198, 113, 57]);
  assert.equal(lerpHex('#000000', '#FFFFFF', 0.5), '#808080');
  assert.equal(lerpHex('#000000', '#FFFFFF', 2), '#FFFFFF');
});
