// Forest — transcribed from design/Tahan.dc.html by tools/transcribeScenes.ts.
// Authored in the 402 × 216 scene box. Regenerate rather than edit by hand.

import { C, P, R, SKY, type Layer } from '../primitives.ts';
import { sceneSkies } from '../../theme/palettes.ts';
import { SCENE_H, SCENE_W } from './box.ts';

/** What shows below the scene on a screen taller than it: its ground colour. */
export const floor = '#272E1B';

export const layers: readonly Layer[] = [
  SKY(0, 0, SCENE_W, SCENE_H, sceneSkies.forest.stops, sceneSkies.forest.positions),
  C(312, 52, 26, '#F9F4ED', 0.85),
  P('M0 132 96 92 186 124 276 84 402 126 402 216 0 216Z', '#AEBF92'),
  P('M0 166 74 138 168 164 258 132 340 160 402 144 402 216 0 216Z', '#728157'),
  R(0, 128, 402, 20, '#F9F4ED', 0.3, 0),
  P('M40 190L58 118L76 190Z', '#3D472B'),
  P('M96 194L118 104L140 194Z', '#3D472B'),
  P('M158 190L174 128L190 190Z', '#3D472B'),
  P('M214 196L238 98L262 196Z', '#3D472B'),
  P('M284 190L300 126L316 190Z', '#3D472B'),
  P('M336 194L356 112L376 194Z', '#3D472B'),
  P('M0 216 0 186 402 174 402 216Z', '#272E1B'),
  R(14, 0, 11, 216, '#272E1B', 1, 5),
  R(366, 0, 9, 216, '#272E1B', 1, 4),
  R(60, 0, 4, 216, '#272E1B', 0.7, 2),
];
