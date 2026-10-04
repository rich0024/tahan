// Winter — transcribed from design/Tahan.dc.html by tools/transcribeScenes.ts.
// Authored in the 402 × 216 scene box. Regenerate rather than edit by hand.

import { C, P, R, SKY, type Layer } from '../primitives.ts';
import { sceneSkies } from '../../theme/palettes.ts';
import { SCENE_H, SCENE_W } from './box.ts';

/** What shows below the scene on a screen taller than it: its ground colour. */
export const floor = '#F6F7F8';

export const layers: readonly Layer[] = [
  SKY(0, 0, SCENE_W, SCENE_H, sceneSkies.winter.stops, sceneSkies.winter.positions),
  C(300, 66, 22, '#E8CFAE', 0.8),
  P('M0 128 90 96 176 124 268 92 402 126 402 216 0 216Z', '#DFE6EC'),
  P('M0 162 96 138 190 164 280 136 402 156 402 216 0 216Z', '#F6F7F8'),
  P('M38 176L54 116L70 176Z', '#4A5A63'),
  P('M92 182L112 106L132 182Z', '#4A5A63'),
  P('M162 176L176 122L190 176Z', '#4A5A63'),
  P('M224 184L246 100L268 184Z', '#4A5A63'),
  P('M297 176L312 118L327 176Z', '#4A5A63'),
  P('M45 156L54 130L63 156Z', '#F6F7F8'),
  P('M101 158L112 128L123 158Z', '#F6F7F8'),
  P('M234 160L246 128L258 160Z', '#F6F7F8'),
  R(20, 0, 9, 216, '#EEF1F3', 1, 4),
  R(24, 46, 9, 3, '#4A5A63', 0.8, 1),
  R(24, 96, 9, 3, '#4A5A63', 0.7, 1),
  R(376, 0, 7, 216, '#EEF1F3', 1, 3),
  R(378, 68, 7, 3, '#4A5A63', 0.7, 1),
  C(150, 30, 1.4, '#F9F4ED', 0.55),
  C(220, 44, 1.1, '#F9F4ED', 0.45),
  C(340, 26, 1.2, '#F9F4ED', 0.5),
];
