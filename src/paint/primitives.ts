// Tahan — the six drawing primitives.
//
// Everything Tahan draws (nine scenes, every avatar, the companions) is a list
// of these: rect, circle, ellipse, filled path, stroked path, sky gradient —
// plus one structural type, a group, which can transform its children and clip
// them to a path. The group arrived with the detailed avatars: shading that
// stays inside the face is a clip, and drawing the figure a little larger than
// authored is a transform. Keeping the vocabulary this small is what lets
// scenes and avatars share one painter, one scaler and one cache.
//
// Layers are authored in a fixed box — 402×216 for scenes, 78×78 for avatars —
// and painted into a real rect by a uniform scale. Nothing here knows about the
// destination size.
//
// Pure data. `skiaPaint.ts` draws it; the tests measure it.

import { cachedOps, pathBounds, type Bounds } from './pathParser.ts';

/** A rotation in degrees, clockwise, matching SVG's `rotate(a x y)`. */
export interface Rotation {
  readonly deg: number;
  /** Pivot. Defaults to the ellipse's own centre. */
  readonly px?: number;
  readonly py?: number;
}

/**
 * translate(x, y) · scale(scale) · translate(-ox, -oy): scale about the point
 * (ox, oy), then move it to (x, y). The one transform the kit needs.
 */
export interface GroupTransform {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly ox: number;
  readonly oy: number;
}

export type Layer =
  | {
      readonly kind: 'group';
      readonly transform: GroupTransform | null;
      /** Absolute path data, in the group's own coordinates. */
      readonly clip: string | null;
      readonly layers: readonly Layer[];
    }
  | {
      readonly kind: 'rect';
      readonly x: number; readonly y: number;
      readonly w: number; readonly h: number;
      readonly fill: string;
      /** Corner radius in authoring units. */
      readonly r: number;
      readonly opacity: number;
    }
  | {
      readonly kind: 'circle';
      readonly cx: number; readonly cy: number; readonly r: number;
      readonly fill: string;
      readonly opacity: number;
    }
  | {
      readonly kind: 'ellipse';
      readonly cx: number; readonly cy: number;
      readonly rx: number; readonly ry: number;
      readonly rotation: Rotation | null;
      readonly fill: string;
      readonly opacity: number;
    }
  | {
      readonly kind: 'fillPath';
      /** Absolute path data — M L Q C Z only. */
      readonly d: string;
      readonly fill: string;
      readonly opacity: number;
    }
  | {
      readonly kind: 'strokePath';
      readonly d: string;
      readonly stroke: string;
      readonly width: number;
      readonly opacity: number;
    }
  | {
      readonly kind: 'sky';
      readonly x: number; readonly y: number;
      readonly w: number; readonly h: number;
      /** Top to bottom. */
      readonly stops: readonly string[];
      /** 0–1 per stop; null means evenly spaced. */
      readonly positions: readonly number[] | null;
      readonly opacity: number;
    };

export type LayerKind = Layer['kind'];

// ---------------------------------------------------------------------------
// Constructors. Same names and argument order as the prototype's helpers in
// Tahan.dc.html, so a transcription can be checked against its source by eye:
//
//   prototype:  R(15, 24, 8, 30, hair, 1, 4)
//   here:       R(15, 24, 8, 30, hair, 1, 4)
//
// The one difference is E: the prototype takes an SVG transform string; this
// takes degrees (rotation about the ellipse's own centre) or a Rotation with an
// explicit pivot, or null.

export function R(
  x: number, y: number, w: number, h: number,
  fill: string, opacity = 1, r = 0,
): Layer {
  return { kind: 'rect', x, y, w, h, fill, r, opacity };
}

export function C(cx: number, cy: number, r: number, fill: string, opacity = 1): Layer {
  return { kind: 'circle', cx, cy, r, fill, opacity };
}

export function E(
  cx: number, cy: number, rx: number, ry: number,
  rotation: number | Rotation | null,
  fill: string, opacity = 1,
): Layer {
  const rot = rotation === null ? null : typeof rotation === 'number' ? { deg: rotation } : rotation;
  return { kind: 'ellipse', cx, cy, rx, ry, rotation: rot, fill, opacity };
}

export function P(d: string, fill: string, opacity = 1): Layer {
  return { kind: 'fillPath', d, fill, opacity };
}

export function PS(d: string, stroke: string, width: number, opacity = 1): Layer {
  return { kind: 'strokePath', d, stroke, width, opacity };
}

/**
 * An outlined circle. Built as four cubics (the standard 0.5523 handle), so
 * it is ordinary absolute path data like everything else.
 */
export function RING(cx: number, cy: number, r: number, stroke: string, width: number, opacity = 1): Layer {
  return OVAL_RING(cx, cy, r, r, stroke, width, opacity);
}

/** An outlined ellipse, as four cubics. */
export function OVAL_RING(
  cx: number, cy: number, rx: number, ry: number,
  stroke: string, width: number, opacity = 1,
): Layer {
  const kx = 0.5522847498 * rx;
  const ky = 0.5522847498 * ry;
  const f = (n: number) => +n.toFixed(3);
  const d = `M${f(cx + rx)} ${f(cy)} `
    + `C${f(cx + rx)} ${f(cy + ky)} ${f(cx + kx)} ${f(cy + ry)} ${f(cx)} ${f(cy + ry)} `
    + `C${f(cx - kx)} ${f(cy + ry)} ${f(cx - rx)} ${f(cy + ky)} ${f(cx - rx)} ${f(cy)} `
    + `C${f(cx - rx)} ${f(cy - ky)} ${f(cx - kx)} ${f(cy - ry)} ${f(cx)} ${f(cy - ry)} `
    + `C${f(cx + kx)} ${f(cy - ry)} ${f(cx + rx)} ${f(cy - ky)} ${f(cx + rx)} ${f(cy)} Z`;
  return PS(d, stroke, width, opacity);
}

/** A group of layers, optionally transformed and clipped to a path. */
export function G(
  layers: readonly Layer[],
  options: { transform?: GroupTransform; clip?: string } = {},
): Layer {
  return { kind: 'group', layers, transform: options.transform ?? null, clip: options.clip ?? null };
}

export function SKY(
  x: number, y: number, w: number, h: number,
  stops: readonly string[], positions: readonly number[] | null = null,
): Layer {
  return { kind: 'sky', x, y, w, h, stops, positions, opacity: 1 };
}

// ---------------------------------------------------------------------------

/**
 * Parse every path in `layers` now. Call once at startup per layer set, so bad
 * path data throws where somebody is looking rather than on the frame that
 * first draws it.
 */
export function warmPaths(layers: readonly Layer[]): void {
  for (const l of layers) {
    if (l.kind === 'fillPath' || l.kind === 'strokePath') cachedOps(l.d);
    if (l.kind === 'group') {
      if (l.clip) cachedOps(l.clip);
      warmPaths(l.layers);
    }
  }
}

/** Every path string in `layers`, groups and clips included. */
export function allPaths(layers: readonly Layer[], out: string[] = []): string[] {
  for (const l of layers) {
    if (l.kind === 'fillPath' || l.kind === 'strokePath') out.push(l.d);
    if (l.kind === 'group') {
      if (l.clip) out.push(l.clip);
      allPaths(l.layers, out);
    }
  }
  return out;
}

/** Map a point through a group transform. */
export function applyTransform(t: GroupTransform, x: number, y: number): [number, number] {
  return [t.x + (x - t.ox) * t.scale, t.y + (y - t.oy) * t.scale];
}

/**
 * The union of every shape, in authoring units, including stroke width and
 * ellipse rotation. Exact for every primitive.
 */
export function layerBounds(layers: readonly Layer[]): Bounds {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  const add = (b: Bounds) => {
    left = Math.min(left, b.left); top = Math.min(top, b.top);
    right = Math.max(right, b.right); bottom = Math.max(bottom, b.bottom);
  };

  for (const l of layers) {
    switch (l.kind) {
      case 'group': {
        if (l.layers.length === 0) break;
        let b = layerBounds(l.layers);
        if (l.clip) {
          const c = pathBounds(cachedOps(l.clip));
          b = {
            left: Math.max(b.left, c.left), top: Math.max(b.top, c.top),
            right: Math.min(b.right, c.right), bottom: Math.min(b.bottom, c.bottom),
          };
        }
        if (l.transform) {
          const [x0, y0] = applyTransform(l.transform, b.left, b.top);
          const [x1, y1] = applyTransform(l.transform, b.right, b.bottom);
          b = { left: x0, top: y0, right: x1, bottom: y1 };
        }
        add(b);
        break;
      }
      case 'rect':
      case 'sky':
        add({ left: l.x, top: l.y, right: l.x + l.w, bottom: l.y + l.h });
        break;
      case 'circle':
        add({ left: l.cx - l.r, top: l.cy - l.r, right: l.cx + l.r, bottom: l.cy + l.r });
        break;
      case 'ellipse': {
        const rot = l.rotation;
        const a = ((rot?.deg ?? 0) * Math.PI) / 180;
        const hx = Math.hypot(l.rx * Math.cos(a), l.ry * Math.sin(a));
        const hy = Math.hypot(l.rx * Math.sin(a), l.ry * Math.cos(a));
        // Rotating about a pivot other than the centre moves the centre too.
        let cx = l.cx, cy = l.cy;
        if (rot && rot.px !== undefined && rot.py !== undefined) {
          const dx = l.cx - rot.px, dy = l.cy - rot.py;
          cx = rot.px + dx * Math.cos(a) - dy * Math.sin(a);
          cy = rot.py + dx * Math.sin(a) + dy * Math.cos(a);
        }
        add({ left: cx - hx, top: cy - hy, right: cx + hx, bottom: cy + hy });
        break;
      }
      case 'fillPath':
        add(pathBounds(cachedOps(l.d)));
        break;
      case 'strokePath': {
        const b = pathBounds(cachedOps(l.d));
        const k = l.width / 2;
        add({ left: b.left - k, top: b.top - k, right: b.right + k, bottom: b.bottom + k });
        break;
      }
    }
  }
  return { left, top, right, bottom };
}
