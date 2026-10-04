// T2.5 — glass, sill and parallax. Smoothness is checked on a device; here,
// the rules that keep the sky from ever lifting off the top.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BACKDROP_SCALE, PARALLAX, PARALLAX_MAX, alphaColor, gradientLine, parallaxOffset, sheen,
} from '../src/paint/window.ts';

describe('parallax', () => {
  test('the scene moves at a sixth of the feed', () => {
    assert.equal(parallaxOffset(60, 844), 10);
    assert.equal(PARALLAX, 1 / 6);
  });

  test('a pull-down past the top never lifts the sky off the top', () => {
    assert.equal(parallaxOffset(-120, 844), 0);
  });

  test('it stops before the scaled layer would show its bottom edge', () => {
    for (const h of [568, 667, 844, 932]) {
      const max = parallaxOffset(100_000, h);
      assert.ok(max <= PARALLAX_MAX);
      assert.ok(max <= h * (BACKDROP_SCALE - 1) + 1e-9, `${h}: ${max}`);
    }
  });
});

describe('glass', () => {
  test('the sheen is faint — never more than 16% white', () => {
    assert.equal(sheen.colors.length, sheen.positions.length);
    for (const c of sheen.colors) assert.ok(Number(/, ([\d.]+)\)$/.exec(c)?.[1]) <= 0.16);
  });

  test('a 112° gradient runs left-to-right and slightly down, corner to corner', () => {
    const g = gradientLine(112, 400, 800);
    assert.ok(g.x1 > g.x0 && g.y1 > g.y0);
    assert.ok(Math.abs((g.x0 + g.x1) / 2 - 200) < 1e-9 && Math.abs((g.y0 + g.y1) / 2 - 400) < 1e-9);
  });

  test('alpha works on hex and on a mid-retint rgba', () => {
    assert.equal(alphaColor('#F5EAD8', 0.72), 'rgba(245, 234, 216, 0.72)');
    assert.equal(alphaColor('rgba(245.4, 234, 216, 1)', 0.9), 'rgba(245, 234, 216, 0.9)');
    assert.equal(alphaColor('rgb(1, 2, 3)', 0.5), 'rgba(1, 2, 3, 0.5)');
  });
});
