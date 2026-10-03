// Tahan — the path parser.
//
// ABSOLUTE COMMANDS ONLY: M L Q C Z.
//
// This is a hard constraint, not a starting point. The geometry scaler offsets
// every number in a path as an absolute x,y pair; a relative command would be
// scaled as though it were a point, and the shape would come out subtly,
// silently wrong. So the parser THROWS on anything it does not know rather
// than guessing — a loud failure at startup beats a scene that is 4px off and
// nobody can say why.
//
// Do not "add support" for H, V, S, T or A, in either case. If authored data
// needs one, convert it at transcription time. (Seven scene paths in the
// prototype use T; SETUP.md lists all seven already converted to exact Qs.)
//
// One deliberate allowance: `z` may be lower-case. It carries no coordinates,
// so the absolute/relative distinction does not exist for it. Every other
// lower-case letter throws.
//
// This module is pure: it turns a string into a list of ops. Building a Skia
// path from the ops lives in `skiaPaint.ts`, so the grammar is testable with
// no native code at all.

export type PathOp =
  | { readonly op: 'M'; readonly x: number; readonly y: number }
  | { readonly op: 'L'; readonly x: number; readonly y: number }
  | {
      readonly op: 'Q';
      readonly x1: number; readonly y1: number;
      readonly x: number; readonly y: number;
    }
  | {
      readonly op: 'C';
      readonly x1: number; readonly y1: number;
      readonly x2: number; readonly y2: number;
      readonly x: number; readonly y: number;
    }
  | { readonly op: 'Z' };

export class PathSyntaxError extends Error {
  readonly source: string;
  readonly offset: number;
  readonly reason: string;

  constructor(reason: string, source: string, offset: number) {
    super(`${reason} (at offset ${offset} of "${source}")`);
    this.name = 'PathSyntaxError';
    this.reason = reason;
    this.source = source;
    this.offset = offset;
  }
}

const ALLOWED = new Set(['M', 'L', 'Q', 'C', 'Z']);

/**
 * Parse an absolute-only SVG path string.
 *
 * Supports SVG's implicit-repetition rule, which the authored data relies on:
 * extra pairs after `M` are line-tos (`M0 216 0 176 24 182`), and extra
 * coordinate groups after `L`, `Q` or `C` repeat that command.
 */
export function parsePath(d: string): PathOp[] {
  const ops: PathOp[] = [];
  const s = new Scanner(d);
  let command: 'L' | 'Q' | 'C' | null = null;
  let haveStart = false;

  for (;;) {
    s.skipSeparators();
    if (s.atEnd) break;

    const ch = s.peek();
    if (isLetter(ch)) {
      const at = s.offset;
      s.advance();
      const upper = ch.toUpperCase();

      if (!ALLOWED.has(upper)) {
        throw new PathSyntaxError(
          `unsupported command '${ch}' — this parser accepts absolute M L Q C Z only`,
          d, at,
        );
      }
      if (ch !== upper && upper !== 'Z') {
        throw new PathSyntaxError(
          `relative command '${ch}' — path data must be absolute; every number is scaled as an absolute coordinate`,
          d, at,
        );
      }

      if (upper === 'Z') {
        if (!haveStart) throw new PathSyntaxError("'Z' before any 'M'", d, at);
        ops.push({ op: 'Z' });
        command = null;
        continue;
      }

      if (upper === 'M') {
        ops.push({ op: 'M', x: s.number(), y: s.number() });
        haveStart = true;
        command = 'L'; // implicit line-tos follow a move-to
        continue;
      }

      if (!haveStart) {
        throw new PathSyntaxError('path does not begin with an absolute M', d, at);
      }
      command = upper as 'L' | 'Q' | 'C';
      continue;
    }

    // A number with no command letter in front of it: legal only as a
    // repetition of the command we are already inside.
    if (command === null) {
      throw new PathSyntaxError(
        haveStart
          ? 'coordinates after Z with no new command'
          : 'path does not begin with an absolute M',
        d, s.offset,
      );
    }

    switch (command) {
      case 'L':
        ops.push({ op: 'L', x: s.number(), y: s.number() });
        break;
      case 'Q':
        ops.push({ op: 'Q', x1: s.number(), y1: s.number(), x: s.number(), y: s.number() });
        break;
      case 'C':
        ops.push({
          op: 'C',
          x1: s.number(), y1: s.number(),
          x2: s.number(), y2: s.number(),
          x: s.number(), y: s.number(),
        });
        break;
    }
  }

  if (!haveStart) throw new PathSyntaxError('empty path', d, 0);
  return ops;
}

const opCache = new Map<string, PathOp[]>();

/** Parsed ops, cached for the life of the app. The authored set is fixed. */
export function cachedOps(d: string): PathOp[] {
  let ops = opCache.get(d);
  if (!ops) {
    ops = parsePath(d);
    opCache.set(d, ops);
  }
  return ops;
}

/** Re-serialise ops. Output contains only M L Q C Z. */
export function opsToString(ops: readonly PathOp[]): string {
  return ops
    .map((o) => {
      switch (o.op) {
        case 'M':
        case 'L':
          return `${o.op}${o.x} ${o.y}`;
        case 'Q':
          return `Q${o.x1} ${o.y1} ${o.x} ${o.y}`;
        case 'C':
          return `C${o.x1} ${o.y1} ${o.x2} ${o.y2} ${o.x} ${o.y}`;
        case 'Z':
          return 'Z';
      }
    })
    .join(' ');
}

export interface Bounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/**
 * Exact bounds of the curve, not of its control points: a control point can
 * sit far outside the shape it bends. Extrema of each Bézier are found from
 * the roots of its derivative.
 */
export function pathBounds(ops: readonly PathOp[]): Bounds {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  const add = (x: number, y: number) => {
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  };

  let cx = 0, cy = 0, sx = 0, sy = 0;
  for (const o of ops) {
    switch (o.op) {
      case 'M':
        cx = sx = o.x; cy = sy = o.y; add(cx, cy);
        break;
      case 'L':
        cx = o.x; cy = o.y; add(cx, cy);
        break;
      case 'Q': {
        add(o.x, o.y);
        for (const t of quadExtrema(cx, o.x1, o.x)) add(quadAt(cx, o.x1, o.x, t), quadAt(cy, o.y1, o.y, t));
        for (const t of quadExtrema(cy, o.y1, o.y)) add(quadAt(cx, o.x1, o.x, t), quadAt(cy, o.y1, o.y, t));
        cx = o.x; cy = o.y;
        break;
      }
      case 'C': {
        add(o.x, o.y);
        const ts = [...cubicExtrema(cx, o.x1, o.x2, o.x), ...cubicExtrema(cy, o.y1, o.y2, o.y)];
        for (const t of ts) add(cubicAt(cx, o.x1, o.x2, o.x, t), cubicAt(cy, o.y1, o.y2, o.y, t));
        cx = o.x; cy = o.y;
        break;
      }
      case 'Z':
        cx = sx; cy = sy;
        break;
    }
  }
  return { left, top, right, bottom };
}

function quadAt(p0: number, p1: number, p2: number, t: number): number {
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

function quadExtrema(p0: number, p1: number, p2: number): number[] {
  const den = p0 - 2 * p1 + p2;
  if (den === 0) return [];
  const t = (p0 - p1) / den;
  return t > 0 && t < 1 ? [t] : [];
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function cubicExtrema(p0: number, p1: number, p2: number, p3: number): number[] {
  // d/dt of the cubic is a quadratic: a t² + b t + c
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;
  const roots: number[] = [];
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) roots.push(-c / b);
  } else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sq = Math.sqrt(disc);
      roots.push((-b + sq) / (2 * a), (-b - sq) / (2 * a));
    }
  }
  return roots.filter((t) => t > 0 && t < 1);
}

class Scanner {
  readonly src: string;
  offset = 0;

  constructor(src: string) {
    this.src = src;
  }

  get atEnd(): boolean {
    return this.offset >= this.src.length;
  }

  peek(): string {
    return this.src[this.offset];
  }

  advance(): void {
    this.offset++;
  }

  skipSeparators(): void {
    while (this.offset < this.src.length && /[\s,]/.test(this.src[this.offset])) this.offset++;
  }

  number(): number {
    this.skipSeparators();
    const start = this.offset;
    if (this.atEnd) {
      throw new PathSyntaxError('expected a number, found end of path', this.src, start);
    }
    const m = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(this.src.slice(start));
    if (!m) {
      throw new PathSyntaxError(
        `expected a number, found '${this.src[start]}'`, this.src, start,
      );
    }
    this.offset += m[0].length;
    return Number(m[0]);
  }
}

function isLetter(ch: string): boolean {
  return /[A-Za-z]/.test(ch);
}
