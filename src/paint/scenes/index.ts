// Tahan — the nine scenes, and how one is painted into a real rect.
//
// Pure. Each scene is authored in a 402 × 216 box (one file each, transcribed
// from the prototype). Painted into any rect it is scaled uniformly to the
// rect's width and anchored to the top — never stretched. A rect taller than
// the scaled scene shows the scene's ground colour below it, so the room runs
// the full height of the app; a shorter one (a header) simply crops the
// bottom of the scene.

import { G, R, warmPaths, type Layer } from '../primitives.ts';
import type { SceneKey } from '../../theme/palettes.ts';
import { SCENE_H, SCENE_W } from './box.ts';
import * as night from './night.ts';
import * as forest from './forest.ts';
import * as tropical from './tropical.ts';
import * as desert from './desert.ts';
import * as terrace from './terrace.ts';
import * as savanna from './savanna.ts';
import * as coast from './coast.ts';
import * as winter from './winter.ts';
import * as blossom from './blossom.ts';

export { SCENE_H, SCENE_W };

const scenes: Readonly<Record<SceneKey, { readonly layers: readonly Layer[]; readonly floor: string }>> = {
  night, forest, tropical, desert, terrace, savanna, coast, winter, blossom,
};

export const sceneLayers = (key: SceneKey): readonly Layer[] => scenes[key].layers;
export const sceneFloor = (key: SceneKey): string => scenes[key].floor;

/** Parse every scene path once, at launch — a bad path throws there, not on a frame. */
export function warmScenePaths(): number {
  let n = 0;
  for (const s of Object.values(scenes)) {
    warmPaths(s.layers);
    n += s.layers.length;
  }
  return n;
}

/** The scene's scale and drawn height in a rect `width` wide. */
export function scenePlacement(width: number): { scale: number; height: number } {
  const scale = width / SCENE_W;
  return { scale, height: SCENE_H * scale };
}

/** How far the ground colour tucks under the scene's lowest edge. */
const SEAM = 1;

/**
 * Everything to paint for a scene in a width × height rect, in the rect's own
 * units: the scene, scaled on width and anchored top, then — if the rect is
 * taller — the ground colour from the scene's bottom edge down. The ground
 * starts a point inside the scene: every scene's lowest ground is that same
 * colour, and the overlap hides the hairline an anti-aliased edge would leave.
 */
export function sceneFrame(key: SceneKey, width: number, height: number): Layer[] {
  const { scale, height: drawn } = scenePlacement(width);
  const layers: Layer[] = [G(sceneLayers(key), { transform: { x: 0, y: 0, scale, ox: 0, oy: 0 } })];
  if (height > drawn) layers.push(R(0, drawn - SEAM, width, height - drawn + SEAM, sceneFloor(key)));
  return layers;
}
