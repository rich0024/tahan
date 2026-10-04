// Night sky — transcribed from design/Tahan.dc.html by tools/transcribeScenes.ts.
// Authored in the 402 × 216 scene box. Regenerate rather than edit by hand.

import { C, E, P, R, SKY, type Layer } from '../primitives.ts';
import { sceneSkies } from '../../theme/palettes.ts';
import { SCENE_H, SCENE_W } from './box.ts';

/** What shows below the scene on a screen taller than it: its ground colour. */
export const floor = '#2E2B25';

export const layers: readonly Layer[] = [
  SKY(0, 0, SCENE_W, SCENE_H, sceneSkies.night.stops, sceneSkies.night.positions),
  C(46, 34, 1.6, '#F9F4ED', 0.9),
  C(98, 62, 1.1, '#F9F4ED', 0.6),
  C(140, 26, 1.4, '#F9F4ED', 0.8),
  C(196, 48, 1, '#F9F4ED', 0.5),
  C(238, 22, 1.7, '#F9F4ED', 0.9),
  C(286, 56, 1.2, '#F9F4ED', 0.65),
  C(330, 30, 1.5, '#F9F4ED', 0.85),
  C(366, 66, 1, '#F9F4ED', 0.5),
  P('M0 168 54 116 92 138 148 84 214 148 252 126 300 164 402 142 402 216 0 216Z', '#82796A', 0.5),
  P('M84 216 201 74 318 216Z', '#645C50'),
  P('M201 74 233 113 214 116 226 138 201 112 176 138 188 116 169 113Z', '#EEE7DB', 0.92),
  P('M0 216 0 176 24 182 40 158 56 182 78 170 96 186 120 162 140 186 164 176 186 190 212 172 236 190 262 168 286 188 312 174 334 190 360 170 382 186 402 176 402 216Z', '#2E2B25'),
  R(10, 0, 10, 216, '#201E1D', 1, 4),
  R(58, 0, 5, 216, '#201E1D', 0.85, 2),
  R(372, 0, 12, 216, '#201E1D', 1, 5),
  R(344, 0, 4, 216, '#201E1D', 0.8, 2),
  E(201, 214, 86, 18, null, '#F6A06B', 0.35),
];
