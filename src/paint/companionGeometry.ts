// Tahan — companion geometry: dog, cat, baby.
//
// STILL THE ORIGINAL STYLE. These are the prototype's companions, transcribed
// line for line (test/companionGeometry.test.ts checks them against
// Tahan.dc.html). People moved to the detailed kit in avatarGeometry.ts; the
// companions need the same redraw before the Me tab ticket puts them on screen.
//
// Authored in a 78-unit square at an origin of (+7, +5), as the prototype did.
// Colours come in explicitly rather than as kit indices.

import { tahanInk } from '../theme/palettes.ts';
import { C, E, P, PS, R, type Layer } from './primitives.ts';

export const COMPANION_BOX = 78;
export const COMPANION_ORIGIN = { x: 7, y: 5 } as const;

export type CompanionKind = 'dog' | 'cat' | 'baby';

export interface CompanionColours {
  /** Fur, for a dog or cat. */
  readonly coat: string;
  /** Collar for a dog or cat; the onesie for a baby. */
  readonly top: string;
  /** A baby's skin and hair. */
  readonly skin: string;
  readonly hair: string;
}

const ink = tahanInk;
const glint = '#F9F4ED';
const muzzle = '#F7F2E6';
const catNose = '#C96B7A';
const collarTag = '#F2D08A';
const babyCheek = '#E79A95';

export function companionLayers(kind: CompanionKind, c: CompanionColours): Layer[] {
  const eyes = (y: number, r: number): Layer[] => [C(26, y, r, ink), C(38, y, r, ink)];

  if (kind === 'dog') {
    return [
      R(8, 54, 48, 14, c.coat, 1, 7),
      E(13, 24, 8, 15, -18, c.coat), E(51, 24, 8, 15, 18, c.coat),
      E(13, 27, 4.5, 9, -18, ink, 0.18), E(51, 27, 4.5, 9, 18, ink, 0.18),
      C(32, 32, 16, c.coat), E(32, 42, 11, 8.5, null, muzzle), C(32, 38, 3, ink),
      PS('M32 41 Q28 45 25 43', ink, 1.5), PS('M32 41 Q36 45 39 43', ink, 1.5),
      ...eyes(29, 2.1), C(27, 28, 0.8, glint, 0.8), C(39, 28, 0.8, glint, 0.8),
      E(32, 49, 14, 4.5, null, c.top), C(32, 53, 3, collarTag),
    ];
  }

  if (kind === 'cat') {
    return [
      P('M18 22 20 6 32 18Z', c.coat), P('M46 22 44 6 32 18Z', c.coat),
      R(8, 56, 48, 12, c.coat, 1, 6),
      C(32, 34, 15, c.coat), ...eyes(32, 2.2), P('M29 39 32 42 35 39Z', catNose),
      PS('M12 36 L22 38', ink, 1), PS('M52 36 L42 38', ink, 1),
      E(32, 51, 13, 4, null, c.top), C(32, 55, 2.8, collarTag),
    ];
  }

  return [
    P('M10 66 C12 52 22 46 32 46 C42 46 52 52 54 66Z', c.top),
    C(32, 32, 15, c.skin), PS('M30 15 C32 10 36 11 36 15', c.hair, 3),
    ...eyes(31, 2), C(21, 36, 3.4, babyCheek, 0.55), C(43, 36, 3.4, babyCheek, 0.55),
    PS('M28 39 Q32 43 36 39', ink, 1.6),
  ];
}

/**
 * The hill behind a companion, in the prototype's scene space (402×216). A
 * round companion shows the centre 216×216 of that scene, so painters reach it
 * from the 78-unit box by scaling 78/216 and shifting left by (402 − 216) / 2.
 */
export const COMPANION_GROUND = { d: 'M0 216 Q201 150 402 206 L402 216Z', opacity: 0.5 } as const;
export const SCENE_TO_COMPANION_BOX = { scale: COMPANION_BOX / 216, dx: -(402 - 216) / 2 } as const;
