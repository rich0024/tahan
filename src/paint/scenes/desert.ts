// Desert — transcribed from design/Tahan.dc.html by tools/transcribeScenes.ts.
// Authored in the 402 × 216 scene box. Regenerate rather than edit by hand.

import { C, P, PS, SKY, type Layer } from '../primitives.ts';
import { sceneSkies } from '../../theme/palettes.ts';
import { SCENE_H, SCENE_W } from './box.ts';

/** What shows below the scene on a screen taller than it: its ground colour. */
export const floor = '#F2D3A2';

export const layers: readonly Layer[] = [
  SKY(0, 0, SCENE_W, SCENE_H, sceneSkies.desert.stops, sceneSkies.desert.positions),
  C(120, 64, 30, '#D9763A', 0.92),
  P('M0 128 44 128 60 104 96 104 112 128 176 124 198 100 246 100 262 126 402 120 402 216 0 216Z', '#B4713F', 0.55),
  P('M0 150 Q90 118 176 148 Q262 178 402 138 L402 216 0 216Z', '#E0A862'),
  P('M0 178 Q120 150 220 180 Q320 210 402 168 L402 216 0 216Z', '#CF8E4D'),
  P('M0 200 Q140 182 262 202 Q384 222 402 196 L402 216 0 216Z', '#F2D3A2'),
  PS('M330 216 C332 190 334 176 336 158', '#7A4A2E', 7),
  P('M336 158 C316 156 310 142 320 130 C330 124 340 132 336 158Z', '#7A4A2E'),
  P('M336 158 C356 152 366 138 356 126 C344 122 336 134 336 158Z', '#7A4A2E'),
  C(60, 26, 1.2, '#F9F4ED', 0.5),
  C(300, 34, 1, '#F9F4ED', 0.4),
];
