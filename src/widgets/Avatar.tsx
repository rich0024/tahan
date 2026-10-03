// Tahan — the Avatar component.
//
// Feed rows redraw constantly and there is no reason to re-run a forty-shape
// paint list every frame, so each spec + size + scene is recorded once as an
// SkPicture and replayed after that. A picture is a vector display list, not
// a bitmap: replaying it is cheap and it stays sharp at any pixel density.
//
// Every avatar carries an accessibilityLabel with the person's name. A face
// with no name is invisible to a screen reader, and this app is built out of
// faces.

import { memo } from 'react';
import { View } from 'react-native';
import { Canvas, Picture, Skia, type SkPicture } from '@shopify/react-native-skia';

import {
  AVATAR_BOX, AVATAR_GROUND, AVATAR_ORIGIN, SCENE_TO_AVATAR_BOX,
  avatarLayers, type AvatarKind,
} from '../paint/avatarGeometry.ts';
import { SKY } from '../paint/primitives.ts';
import { paintLayers, skPath } from '../paint/skiaPaint.ts';
import { sceneByKey, sceneSkies, specKey, type AvatarSpec, type SceneKey } from '../theme/palettes.ts';
import { useScene } from '../theme/SceneProvider.tsx';

// ---------------------------------------------------------------------------
// The picture cache.
//
// Bounded LRU. Realistically a village is one scene × twelve people × five
// sizes, so 256 is generous. Evicted pictures are dropped, not disposed: a
// mounted <Canvas> may still hold one, and Skia's host objects are collected
// once nothing references them.

const MAX_PICTURES = 256;
const pictures = new Map<string, SkPicture>();

function recordAvatar(
  spec: AvatarSpec, size: number, kind: AvatarKind, coat: number, scene: SceneKey,
): SkPicture {
  const key = `${specKey(spec)}|${size}|${kind}|${coat}|${scene}`;
  const hit = pictures.get(key);
  if (hit) {
    pictures.delete(key);
    pictures.set(key, hit); // touch
    return hit;
  }

  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, size, size));
  const k = size / AVATAR_BOX;
  canvas.scale(k, k);

  // The village's sky, then the hill behind the shoulders, in scene space.
  const sky = sceneSkies[scene];
  paintLayers(canvas, [SKY(0, 0, AVATAR_BOX, AVATAR_BOX, sky.stops, sky.positions)]);
  canvas.save();
  canvas.scale(SCENE_TO_AVATAR_BOX.scale, SCENE_TO_AVATAR_BOX.scale);
  canvas.translate(SCENE_TO_AVATAR_BOX.dx, 0);
  const ground = Skia.Paint();
  ground.setAntiAlias(true);
  ground.setColor(Skia.Color(sceneByKey(scene).accent2));
  ground.setAlphaf(AVATAR_GROUND.opacity);
  canvas.drawPath(skPath(AVATAR_GROUND.d), ground);
  canvas.restore();

  // The face.
  canvas.translate(AVATAR_ORIGIN.x, AVATAR_ORIGIN.y);
  paintLayers(canvas, avatarLayers(spec, kind, coat));

  const picture = recorder.finishRecordingAsPicture();
  pictures.set(key, picture);
  while (pictures.size > MAX_PICTURES) {
    const oldest = pictures.keys().next().value;
    if (oldest === undefined) break;
    pictures.delete(oldest);
  }
  return picture;
}

/** Diagnostics for the review screen. */
export const avatarCacheSize = () => pictures.size;

// ---------------------------------------------------------------------------

export interface AvatarProps {
  spec: AvatarSpec;
  size: number;
  /** The person this face belongs to. Becomes the accessibility label. */
  name?: string;
  kind?: AvatarKind;
  coat?: number;
  /**
   * The sky behind the face. Defaults to the current village's — a face
   * belongs to the room it is in. During a retint the face moves to the new
   * sky at once rather than re-recording on every frame of the fade.
   */
  scene?: SceneKey;
}

function label(name: string | undefined, kind: AvatarKind): string | undefined {
  if (kind === 'person') return name;
  return name ? `${name}, ${kind}` : kind[0].toUpperCase() + kind.slice(1);
}

export const Avatar = memo(function Avatar({
  spec, size, name, kind = 'person', coat = 0, scene,
}: AvatarProps) {
  const current = useScene().palette.key;
  const picture = recordAvatar(spec, size, kind, coat, scene ?? current);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label(name, kind)}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}
    >
      <Canvas style={{ width: size, height: size }}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
});
