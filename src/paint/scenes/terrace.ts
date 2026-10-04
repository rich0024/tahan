// Rice terraces — transcribed from design/Tahan.dc.html by tools/transcribeScenes.ts.
// Authored in the 402 × 216 scene box. Regenerate rather than edit by hand.

import { C, P, R, SKY, type Layer } from '../primitives.ts';
import { sceneSkies } from '../../theme/palettes.ts';
import { SCENE_H, SCENE_W } from './box.ts';

/** What shows below the scene on a screen taller than it: its ground colour. */
export const floor = '#6F8F62';

export const layers: readonly Layer[] = [
  SKY(0, 0, SCENE_W, SCENE_H, sceneSkies.terrace.stops, sceneSkies.terrace.positions),
  C(316, 58, 24, '#EFC27A', 0.95),
  P('M0 112 68 74 128 106 196 66 268 104 340 78 402 110 402 216 0 216Z', '#8FA79A', 0.8),
  P('M0 138 78 112 158 136 244 108 320 134 402 122 402 216 0 216Z', '#6D8A7D'),
  P('M0 150 Q120 138 220 152 Q320 166 402 146 L402 168 0 172Z', '#CFE0B0'),
  P('M0 170 Q140 156 244 174 Q348 192 402 166 L402 186 0 192Z', '#A8C08F'),
  P('M0 190 Q120 178 236 194 Q352 210 402 186 L402 206 0 212Z', '#8FAE74'),
  P('M0 208 Q160 198 402 208 L402 216 0 216Z', '#6F8F62'),
  R(60, 156, 44, 3, '#F9F4ED', 0.5, 2),
  R(210, 176, 60, 3, '#F9F4ED', 0.45, 2),
  R(120, 196, 50, 3, '#F9F4ED', 0.4, 2),
  P('M354 132L366 88L378 132Z', '#3F5A48'),
  P('M378 136L388 102L398 136Z', '#3F5A48'),
];
