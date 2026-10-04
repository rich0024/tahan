// Blossom — transcribed from design/Tahan.dc.html by tools/transcribeScenes.ts.
// Authored in the 402 × 216 scene box. Regenerate rather than edit by hand.

import { C, E, P, PS, SKY, type Layer } from '../primitives.ts';
import { sceneSkies } from '../../theme/palettes.ts';
import { SCENE_H, SCENE_W } from './box.ts';

/** What shows below the scene on a screen taller than it: its ground colour. */
export const floor = '#B5C294';

export const layers: readonly Layer[] = [
  SKY(0, 0, SCENE_W, SCENE_H, sceneSkies.blossom.stops, sceneSkies.blossom.positions),
  C(320, 56, 26, '#F7D3D8', 0.8),
  P('M0 150 100 128 200 150 300 126 402 148 402 216 0 216Z', '#CFD8B0'),
  P('M0 182 120 168 240 186 402 172 402 216 0 216Z', '#B5C294'),
  PS('M108 216 C112 178 110 160 96 138', '#6A4B3A', 9),
  PS('M96 138 C86 128 72 124 60 126', '#6A4B3A', 5),
  PS('M96 138 C110 126 126 122 140 126', '#6A4B3A', 5),
  E(70, 118, 34, 16, null, '#F0B8C0'),
  E(126, 116, 38, 17, null, '#F7D3D8'),
  E(98, 100, 30, 14, null, '#F0B8C0'),
  PS('M316 216 C318 192 316 176 306 158', '#6A4B3A', 6),
  E(300, 144, 26, 12, null, '#F7D3D8'),
  E(326, 148, 22, 10, null, '#F0B8C0'),
  C(180, 132, 3, '#F0B8C0', 0.9),
  C(214, 158, 2.4, '#F7D3D8', 0.9),
  C(248, 122, 2.6, '#F0B8C0', 0.8),
  C(160, 176, 2.2, '#F7D3D8', 0.8),
];
