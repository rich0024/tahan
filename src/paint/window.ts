// Tahan — the window: glass, sill and parallax.
//
// Pure. The values are the prototype's (design/Tahan.dc.html, turn 7): a
// faint diagonal sheen across the pane, a soft vignette at the edges, and a
// warm ledge where the glass meets the room — kept quiet on purpose, so the
// window is only noticed on the second look. The scene sits behind the feed
// and moves at a sixth of its speed.

/** The header: the part of the window with nothing in front of it. */
export const HEADER_HEIGHT = 216;

/** The scene layer is drawn this much larger, so it can travel without showing an edge. */
export const BACKDROP_SCALE = 1.06;

/** It moves this fast against the feed: one sixth. */
export const PARALLAX = 1 / 6;

/** And never further than this, in points. */
export const PARALLAX_MAX = 44;

/**
 * How far the scene moves up for a scroll offset: a sixth of it, never
 * negative (a pull-down past the top would lift the sky off the top of the
 * screen) and never past the extra the scale gives it at the bottom.
 */
export function parallaxOffset(scrollY: number, screenHeight: number): number {
  'worklet';
  const room = Math.min(PARALLAX_MAX, screenHeight * (BACKDROP_SCALE - 1));
  return Math.min(room, Math.max(0, scrollY * PARALLAX));
}

/** The sheen: CSS `linear-gradient(112deg, …)`, as colours and stops. */
export const SHEEN_ANGLE = 112;
export const sheen = {
  colors: ['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.09)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)'],
  positions: [0, 0.16, 0.34, 0.62, 0.76, 0.88, 1],
} as const;

/** Where a CSS angle gradient starts and ends in a w × h box. */
export function gradientLine(angleDeg: number, w: number, h: number): { x0: number; y0: number; x1: number; y1: number } {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  return { x0: w / 2 - dx * half, y0: h / 2 - dy * half, x1: w / 2 + dx * half, y1: h / 2 + dy * half };
}

/** The vignette: an inner shadow all round, and a hairline of light at the edge. */
export const vignette = { blur: 90, spread: 26, color: 'rgba(32, 30, 29, 0.16)', hairline: 'rgba(253, 247, 236, 0.22)' } as const;

/** The sill: a 9pt ledge, a line of light along its top, a soft shadow below. */
export const sill = {
  height: 9, radius: 5,
  highlight: 'rgba(253, 247, 236, 0.55)',
  shadow: { dy: 5, blur: 14, color: 'rgba(32, 30, 29, 0.16)' },
} as const;

/** The veil behind the feed: the scene's background, nearly opaque. */
export const veil = { alphas: [0.72, 0.9, 0.93], positions: [0, 0.22, 1] } as const;

/** The fade at the bottom of the header, into the veil. */
export const HEADER_FADE = { height: 56, alpha: 0.7 } as const;

/** The village name's pill over the scene: ink at 58%. */
export const NAME_PILL_ALPHA = 0.58;

/**
 * A colour at an opacity, from either '#RRGGBB' or the 'rgba(r, g, b, a)' a
 * retint produces mid-fade. A worklet, so animated colours can use it.
 */
export function alphaColor(color: string, alpha: number): string {
  'worklet';
  if (color.charAt(0) === '#') {
    const n = parseInt(color.slice(1, 7), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const parts = color.slice(color.indexOf('(') + 1, color.indexOf(')')).split(',');
  return `rgba(${Math.round(parseFloat(parts[0]))}, ${Math.round(parseFloat(parts[1]))}, ${Math.round(parseFloat(parts[2]))}, ${alpha})`;
}
