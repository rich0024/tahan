// Coast — transcribed from design/Tahan.dc.html by tools/transcribeScenes.ts.
// Authored in the 402 × 216 scene box. Regenerate rather than edit by hand.

import { C, P, PS, R, SKY, type Layer } from '../primitives.ts';
import { sceneSkies } from '../../theme/palettes.ts';
import { SCENE_H, SCENE_W } from './box.ts';

/** What shows below the scene on a screen taller than it: its ground colour. */
export const floor = '#D9C49A';

export const layers: readonly Layer[] = [
  SKY(0, 0, SCENE_W, SCENE_H, sceneSkies.coast.stops, sceneSkies.coast.positions),
  C(96, 52, 22, '#F2D08A', 0.95),
  P('M0 118 402 112 402 164 0 170Z', '#6F9FAE'),
  R(30, 132, 90, 4, '#F9F4ED', 0.5, 2),
  R(190, 146, 120, 4, '#F9F4ED', 0.45, 2),
  R(300, 128, 70, 4, '#F9F4ED', 0.4, 2),
  P('M262 118 300 78 340 92 402 70 402 118Z', '#BFA67C'),
  R(300, 84, 26, 22, '#F7F2E6', 1, 3),
  P('M298 84 313 72 328 84Z', '#C96B4A'),
  R(346, 74, 22, 20, '#F7F2E6', 1, 3),
  P('M344 74 357 63 370 74Z', '#C96B4A'),
  P('M0 162 Q120 148 240 166 Q360 184 402 158 L402 216 0 216Z', '#E8DCBE'),
  P('M0 196 Q140 184 402 196 L402 216 0 216Z', '#D9C49A'),
  PS('M120 176 L150 176', '#6F6152', 4),
  P('M124 174 148 174 142 164 130 164Z', '#F7F2E6'),
];
