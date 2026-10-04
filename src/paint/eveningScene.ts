// Tahan — the evening artwork for onboarding.
//
// Pure. Before anyone has a village there is no scene to take colours from,
// so onboarding has its own fixed evening: a dusk sky, two hills, and a house
// with its lights on. Ported from the prototype (design/Tahan.dc.html, 16a,
// 16b and 16d), coordinates unchanged.

import { avatarLayers, AVATAR_BOX } from './avatarGeometry.ts';
import { C, E, G, P, R, SKY, type Layer } from './primitives.ts';
import { TahanEvening as EV, type AvatarSpec } from '../theme/palettes.ts';

// ---------------------------------------------------------------------------
// The welcome: full-bleed, authored in a 402 × 874 phone.

export const WELCOME_W = 402;
export const WELCOME_H = 874;
/** Where the welcome's text block begins, in the artwork's own units. */
export const WELCOME_TEXT_TOP = 600;

export function welcomeLayers(): Layer[] {
  return [
    SKY(0, 0, WELCOME_W, WELCOME_H, EV.skyStops, EV.skyPositions),
    C(76, 118, 2, EV.star, 0.7),
    C(318, 86, 2.5, EV.star, 0.6),
    C(212, 62, 1.8, EV.star, 0.5),
    C(140, 170, 1.6, EV.star, 0.4),
    P('M0 470 Q120 430 210 456 Q300 480 402 448 L402 874 L0 874 Z', EV.farHill, 0.85),
    P('M0 560 Q140 522 240 548 Q330 570 402 542 L402 874 L0 874 Z', EV.nearHill, 0.9),
    R(128, 440, 146, 78, EV.house, 1, 8),
    P('M112 444 L201 390 L290 444 Z', EV.roof),
    R(146, 460, 34, 28, EV.lampLight, 0.92, 4),
    R(222, 460, 34, 28, EV.lampLight, 0.92, 4),
    R(188, 476, 26, 42, EV.doorLight, 0.9, 5),
    E(201, 522, 104, 16, null, EV.lampLight, 0.14),
    C(104, 416, 4.5, EV.lantern, 0.75),
    C(300, 412, 4.5, EV.lantern, 0.75),
    C(66, 498, 3, EV.lantern, 0.5),
    C(344, 512, 3, EV.lantern, 0.45),
  ];
}

/**
 * Where to draw the welcome in a screen, so the house always stands just
 * above the text however tall the text grows. The artwork is scaled to the
 * screen's width and moved so its text line meets the top of the text
 * block; the sky's top colour fills anything above it, the scrim anything
 * below.
 */
export function welcomePlacement(screenW: number, textTop: number): { scale: number; y: number } {
  const scale = screenW / WELCOME_W;
  return { scale, y: textTop - WELCOME_TEXT_TOP * scale };
}

// ---------------------------------------------------------------------------
// The band: evening overhead on the number screen. 402 × 236.

export const BAND_W = 402;
export const BAND_H = 236;

export function bandLayers(): Layer[] {
  return [
    SKY(0, 0, BAND_W, BAND_H, EV.bandStops, EV.bandPositions),
    C(72, 52, 2, EV.star, 0.6),
    C(322, 40, 2.2, EV.star, 0.5),
    P('M0 196 Q120 168 214 186 Q310 204 402 178 L402 236 L0 236 Z', EV.bandHill, 0.8),
  ];
}

// ---------------------------------------------------------------------------
// The first face: the figure, large, on an evening sky.

/** The top of the tallest hair, and the chin, in the avatar box. */
const HAIR_TOP = 9.3;
const CHIN = 148;
/** The chin sits this far down the sky, so the fade below takes only the shoulders. */
const CHIN_AT = 0.72;

/**
 * A figure on a w × h sky, as large as it can be with the tallest hair just
 * under the status bar and the chin above the fade. Full detail — this is
 * the largest a face ever appears.
 */
export function firstFaceLayers(spec: AvatarSpec, w: number, h: number, topInset = 0): Layer[] {
  // Large enough to reach the bottom of the sky, too — on a phone with a
  // tall status bar this wins, and the chin sits a little lower.
  const scale = Math.max((h * CHIN_AT - topInset) / (CHIN - HAIR_TOP), (h - topInset) / (AVATAR_BOX - HAIR_TOP));
  return [
    SKY(0, 0, w, h, EV.bandStops, EV.bandPositions),
    G(avatarLayers(spec, false), { transform: { x: w / 2, y: topInset, scale, ox: AVATAR_BOX / 2, oy: HAIR_TOP } }),
  ];
}

/** How much of the first face's sky fades into the screen below. */
export const FIRST_FACE_FADE = 0.24;
