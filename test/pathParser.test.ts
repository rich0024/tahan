// T1.3 — the parser accepts absolute M L Q C Z and throws on everything else.
//
// The throwing is the point. A parser that quietly skips a command it does not
// understand produces a scene that is subtly wrong; one that throws produces a
// stack trace on the first run.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePath, pathBounds, opsToString, PathSyntaxError,
} from '../src/paint/pathParser.ts';

const bounds = (d: string) => pathBounds(parsePath(d));
const close = (a: number, b: number, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

describe('accepts absolute commands', () => {
  test('M and L', () => {
    assert.deepEqual(parsePath('M10 20 L30 60'), [
      { op: 'M', x: 10, y: 20 },
      { op: 'L', x: 30, y: 60 },
    ]);
  });

  test('implicit line-tos after M — the scene data relies on this', () => {
    assert.deepEqual(parsePath('M0 216 0 176 24 182').map((o) => o.op), ['M', 'L', 'L']);
    assert.deepEqual(bounds('M0 216 0 176 24 182'), { left: 0, top: 176, right: 24, bottom: 216 });
  });

  test('repeated L', () => {
    assert.equal(parsePath('M0 0 L10 10 20 5 30 40').length, 4);
  });

  test('Q', () => {
    assert.deepEqual(parsePath('M27 40 Q32 44 37 40')[1], { op: 'Q', x1: 32, y1: 44, x: 37, y: 40 });
  });

  test('repeated Q', () => {
    assert.deepEqual(parsePath('M0 0 Q5 10 10 0 15 -10 20 0').map((o) => o.op), ['M', 'Q', 'Q']);
  });

  test('C, and repeated C — the avatar body is two cubics under one C', () => {
    const ops = parsePath('M6 66 C9 50 21 43 32 43 C43 43 55 50 58 66Z');
    assert.deepEqual(ops.map((o) => o.op), ['M', 'C', 'C', 'Z']);
    const ops2 = parsePath('M6 66 C9 50 21 43 32 43 43 43 55 50 58 66Z');
    assert.deepEqual(ops2, ops);
  });

  test('Z, upper or lower case — it carries no coordinates', () => {
    assert.equal(parsePath('M0 0 L10 0 L10 10Z').at(-1)?.op, 'Z');
    assert.equal(parsePath('M0 0 L10 0 L10 10z').at(-1)?.op, 'Z');
  });

  test('negative, decimal, leading-dot and exponent numbers', () => {
    assert.deepEqual(parsePath('M-5.5 -2 L.5 3.25 L1e1 -2E-1'), [
      { op: 'M', x: -5.5, y: -2 },
      { op: 'L', x: 0.5, y: 3.25 },
      { op: 'L', x: 10, y: -0.2 },
    ]);
  });

  test('commas and newlines are separators', () => {
    assert.equal(parsePath('M0,0\nL10,10').length, 2);
  });

  test('numbers run straight into the next command letter', () => {
    assert.deepEqual(parsePath('M0 0L10 10Z').map((o) => o.op), ['M', 'L', 'Z']);
  });

  test('multiple subpaths', () => {
    assert.deepEqual(bounds('M0 0 L5 5Z M20 20 L30 30Z'), { left: 0, top: 0, right: 30, bottom: 30 });
  });

  test('round-trips through opsToString', () => {
    const d = 'M6 66 C9 50 21 43 32 43 C43 43 55 50 58 66Z';
    assert.deepEqual(parsePath(opsToString(parsePath(d))), parsePath(d));
  });
});

describe('throws on relative commands', () => {
  for (const c of ['m', 'l', 'q', 'c']) {
    test(`'${c}'`, () => {
      assert.throws(
        () => parsePath(`M0 0 ${c}10 10 10 10 10 10`),
        (e: unknown) => e instanceof PathSyntaxError && e.reason.includes('relative'),
      );
    });
  }
});

describe('throws on arcs', () => {
  for (const c of ['A', 'a']) {
    test(`'${c}'`, () => {
      assert.throws(() => parsePath(`M0 0 ${c}5 5 0 0 1 10 10`), PathSyntaxError);
    });
  }
});

describe('throws on every other command', () => {
  // H and V are the dangerous ones: one number each, so a scaler that offsets
  // numbers in x,y pairs would put every following coordinate on the wrong axis.
  for (const c of ['H', 'V', 'S', 'T', 'h', 'v', 's', 't']) {
    test(`'${c}'`, () => {
      assert.throws(() => parsePath(`M0 0 ${c}10 10`), PathSyntaxError);
    });
  }
});

describe('throws on malformed input', () => {
  const cases: [string, string][] = [
    ['does not begin with M', 'L10 10'],
    ['empty', ''],
    ['only whitespace', '   '],
    ['a missing coordinate', 'M0 0 L10'],
    ['Z before any M', 'Z'],
    ['coordinates after Z with no command', 'M0 0 L1 1Z 5 5'],
    ['junk instead of a number', 'M0 0 L# 5'],
    ['a bare M', 'M'],
  ];
  for (const [name, d] of cases) {
    test(name, () => assert.throws(() => parsePath(d), PathSyntaxError));
  }
});

test('the error says where it went wrong', () => {
  try {
    parsePath('M0 0 h10');
    assert.fail('expected a throw');
  } catch (e) {
    assert.ok(e instanceof PathSyntaxError);
    assert.equal(e.offset, 5);
    assert.equal(e.source, 'M0 0 h10');
    assert.match(e.message, /offset 5/);
  }
});

describe('bounds are of the curve, not the control points', () => {
  test('quadratic', () => {
    // Control point at y=44; the curve itself peaks at 42.
    const b = bounds('M27 40 Q32 44 37 40');
    close(b.bottom, 42);
    close(b.left, 27);
    close(b.right, 37);
  });

  test('cubic', () => {
    // The cap: controls at y=12, the curve's top is at 16.
    const b = bounds('M16 28 C15 12 49 12 48 28');
    close(b.top, 16);
  });
});
