// Tahan — the six drawing primitives.
//
// Everything Tahan draws (nine scenes, every avatar, the companions) is a flat
// list of these: rect, circle, ellipse, filled path, stroked path, sky
// gradient. Six types, no more. Keeping the vocabulary this small is what lets
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

export type Layer =
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

export function PS(d: string, stroke: string, width: number): Layer {
  return { kind: 'strokePath', d, stroke, width, opacity: 1 };
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
  }
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
