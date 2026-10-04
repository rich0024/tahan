// Tahan — the Avatar and CompanionAvatar components.
//
// Feed rows redraw constantly and there is no reason to re-run a face's paint
// list every frame, so each spec + size + scene is recorded once as an
// SkPicture and replayed after that. A picture is a vector display list, not
// a bitmap: replaying it is cheap and it stays sharp at any pixel density.
//
// Every avatar carries an accessibilityLabel with the person's name. A face
// with no name is invisible to a screen reader, and this app is built out of
// faces.

import { memo } from 'react';
import { View } from 'react-native';
import { Canvas, Picture, Skia, type SkCanvas, type SkPicture } from '@shopify/react-native-skia';

import {
  AVATAR_BOX, SMALL_AVATAR, avatarBackdrop, avatarLayers,
} from '../paint/avatarGeometry.ts';
import { companionLayers } from '../paint/companionGeometry.ts';
import { paintLayers } from '../paint/skiaPaint.ts';
import {
  CompanionKit, companionKey, sceneByKey, sceneSkies, specKey,
  type AvatarSpec, type CompanionSpec, type SceneKey,
} from '../theme/palettes.ts';
import { useScene } from '../theme/SceneProvider.tsx';

// ---------------------------------------------------------------------------
// The picture cache.
//
// Bounded LRU. Realistically a village is one scene × twelve people × a few
// sizes, so 256 is generous. Evicted pictures are dropped, not disposed: a
// mounted <Canvas> may still hold one, and Skia frees them once nothing
// references them.

const MAX_PICTURES = 256;
const pictures = new Map<string, SkPicture>();

function cached(key: string, size: number, draw: (canvas: SkCanvas) => void): SkPicture {
  const hit = pictures.get(key);
  if (hit) {
    pictures.delete(key);
    pictures.set(key, hit); // touch
    return hit;
  }
  const recorder = Skia.PictureRecorder();
  draw(recorder.beginRecording(Skia.XYWHRect(0, 0, size, size)));
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

function recordFace(spec: AvatarSpec, size: number, scene: SceneKey): SkPicture {
  return cached(`p|${specKey(spec)}|${size}|${scene}`, size, (canvas) => {
    const k = size / AVATAR_BOX;
    canvas.scale(k, k);
    // The village's sky behind the face: a face belongs to the room it is in.
    paintLayers(canvas, avatarBackdrop(sceneSkies[scene], sceneByKey(scene).accent2));
    paintLayers(canvas, avatarLayers(spec, size <= SMALL_AVATAR));
  });
}

function recordCompanion(spec: CompanionSpec, size: number, scene: SceneKey): SkPicture {
  return cached(`c|${companionKey(spec)}|${size}|${scene}`, size, (canvas) => {
    const k = size / AVATAR_BOX;
    canvas.scale(k, k);
    paintLayers(canvas, avatarBackdrop(sceneSkies[scene], sceneByKey(scene).accent2));
    paintLayers(canvas, companionLayers(spec, size <= SMALL_AVATAR));
  });
}

// ---------------------------------------------------------------------------

function Round({ size, label, picture }: { size: number; label: string | undefined; picture: SkPicture }) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}
    >
      <Canvas style={{ width: size, height: size }}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
}

export interface AvatarProps {
  spec: AvatarSpec;
  size: number;
  /** The person this face belongs to. Becomes the accessibility label. */
  name?: string;
  /**
   * The sky behind the face. Defaults to the current village's. During a
   * retint the face moves to the new sky at once rather than re-recording on
   * every frame of the fade.
   */
  scene?: SceneKey;
}

export const Avatar = memo(function Avatar({ spec, size, name, scene }: AvatarProps) {
  const current = useScene().palette.key;
  return <Round size={size} label={name} picture={recordFace(spec, size, scene ?? current)} />;
});

export interface CompanionAvatarProps {
  spec: CompanionSpec;
  size: number;
  /** The companion's name. */
  name?: string;
  scene?: SceneKey;
}

/** A dog, cat or baby. A companion belongs to its person, not to a village. */
export const CompanionAvatar = memo(function CompanionAvatar({ spec, size, name, scene }: CompanionAvatarProps) {
  const current = useScene().palette.key;
  const kind = CompanionKit.kinds[spec.kind] ?? 'Companion';
  const label = name ? `${name}, ${kind.toLowerCase()}` : kind;
  return <Round size={size} label={label} picture={recordCompanion(spec, size, scene ?? current)} />;
});
