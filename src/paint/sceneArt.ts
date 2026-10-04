// Tahan — the painted scenes.
//
// Pure. The nine scenes as painted backdrops (assets/scenes/<key>.webp),
// generated from the drawn scenes' content in one style and chosen by the
// owner. Each is 1440 × 716. Painted into a rect it behaves like the drawn
// scene: scaled on width, anchored top; below it, the painting's own ground
// colour — sampled from its bottom edge — carries on to the bottom, with a
// short fade so the join never shows. Until a painting has loaded — a
// moment, on the first launch — its ground colour fills the rect.

import type { SceneKey } from '../theme/palettes.ts';

export const ART_W = 1440;
export const ART_H = 716;

/** The ground colour along each painting's bottom edge (median of the last 3% of rows). */
export const artFloor: Readonly<Record<SceneKey, string>> = {
  night: '#1F2129',
  forest: '#2D3524',
  tropical: '#F9D2BC',
  desert: '#EFCFA6',
  terrace: '#4A5949',
  savanna: '#613A1C',
  coast: '#EDD3B0',
  winter: '#D7DEE8',
  blossom: '#98A18B',
};

/** How much of the painting's bottom fades into its ground colour. */
export const ART_FADE = 0.1;

export interface ArtPlacement {
  /** The painting's drawn size: the rect's width, and the height that keeps its shape. */
  readonly width: number;
  readonly height: number;
  /** Where the fade into the ground colour begins and how tall it is. */
  readonly fadeTop: number;
  readonly fadeHeight: number;
}

/** Where a painting goes in a rect `width` wide. Uniform scale, never stretched. */
export function artPlacement(width: number): ArtPlacement {
  const height = (width * ART_H) / ART_W;
  const fadeHeight = height * ART_FADE;
  return { width, height, fadeTop: height - fadeHeight, fadeHeight };
}
