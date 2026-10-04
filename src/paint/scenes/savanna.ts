// Savanna — transcribed from design/Tahan.dc.html by tools/transcribeScenes.ts.
// Authored in the 402 × 216 scene box. Regenerate rather than edit by hand.

import { C, E, P, PS, SKY, type Layer } from '../primitives.ts';
import { sceneSkies } from '../../theme/palettes.ts';
import { SCENE_H, SCENE_W } from './box.ts';

/** What shows below the scene on a screen taller than it: its ground colour. */
export const floor = '#8A5A2E';

export const layers: readonly Layer[] = [
  SKY(0, 0, SCENE_W, SCENE_H, sceneSkies.savanna.stops, sceneSkies.savanna.positions),
  C(196, 108, 46, '#F0B04A', 0.95),
  P('M0 150 402 144 402 216 0 216Z', '#A9642E', 0.45),
  P('M0 168 Q120 158 402 170 L402 216 0 216Z', '#8A5A2E'),
  PS('M96 216 C100 180 104 160 106 132', '#2E2318', 8),
  E(106, 126, 56, 13, null, '#2E2318'),
  E(78, 134, 26, 8, null, '#2E2318'),
  E(134, 134, 26, 8, null, '#2E2318'),
  PS('M310 216 C312 192 314 178 316 158', '#2E2318', 5),
  E(316, 152, 34, 9, null, '#2E2318'),
  E(298, 158, 16, 6, null, '#2E2318'),
  P('M22 216L30 194L38 216Z', '#4A3320'),
  P('M193 216L200 198L207 216Z', '#4A3320'),
  P('M241 216L250 192L259 216Z', '#4A3320'),
  P('M362 216L370 196L378 216Z', '#4A3320'),
];
