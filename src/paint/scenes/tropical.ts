// Tropical — transcribed from design/Tahan.dc.html by tools/transcribeScenes.ts.
// Authored in the 402 × 216 scene box. Regenerate rather than edit by hand.

import { C, E, P, PS, R, SKY, type Layer } from '../primitives.ts';
import { sceneSkies } from '../../theme/palettes.ts';
import { SCENE_H, SCENE_W } from './box.ts';

/** What shows below the scene on a screen taller than it: its ground colour. */
export const floor = '#FFE1D0';

export const layers: readonly Layer[] = [
  SKY(0, 0, SCENE_W, SCENE_H, sceneSkies.tropical.stops, sceneSkies.tropical.positions),
  C(286, 74, 38, '#F6A06B', 0.9),
  P('M0 140 402 132 402 176 0 184Z', '#4F8A80'),
  R(24, 150, 86, 4, '#F9F4ED', 0.45, 2),
  R(150, 162, 120, 4, '#F9F4ED', 0.45, 2),
  R(288, 146, 72, 4, '#F9F4ED', 0.45, 2),
  P('M0 178 Q200 164 402 180 L402 216 0 216Z', '#FFE1D0'),
  PS('M62 216 C68 176 78 138 92 112', '#56633F', 9),
  E(92, 112, 40, 12, -24, '#3D472B'),
  E(92, 112, 40, 12, 18, '#3D472B'),
  E(92, 112, 34, 11, -68, '#3D472B'),
  E(92, 112, 34, 11, 66, '#3D472B'),
  E(92, 112, 26, 9, -4, '#3D472B'),
  PS('M352 216 C358 176 318 166 332 140', '#56633F', 6),
  E(332, 140, 26.6667, 8, -24, '#56633F'),
  E(332, 140, 26.6667, 8, 18, '#56633F'),
  E(332, 140, 22.6667, 7.3333, -68, '#56633F'),
  E(332, 140, 22.6667, 7.3333, 66, '#56633F'),
  E(332, 140, 17.3333, 6, -4, '#56633F'),
];
