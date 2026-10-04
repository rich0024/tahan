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
import {
  COMPANION_BOX, COMPANION_GROUND, COMPANION_ORIGIN, SCENE_TO_COMPANION_BOX,
  companionLayers, type CompanionColours, type CompanionKind,
} from '../paint/companionGeometry.ts';
import { SKY } from '../paint/primitives.ts';
import { paintLayers, skPath } from '../paint/skiaPaint.ts';
import { sceneByKey, sceneSkies, specKey, type AvatarSpec, type SceneKey } from '../theme/palettes.ts';
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

function recordCompanion(kind: CompanionKind, colours: CompanionColours, size: number, scene: SceneKey): SkPicture {
  const key = `c|${kind}|${colours.coat}|${colours.top}|${colours.skin}|${colours.hair}|${size}|${scene}`;
  return cached(key, size, (canvas) => {
    const k = size / COMPANION_BOX;
    canvas.scale(k, k);
    const sky = sceneSkies[scene];
    paintLayers(canvas, [SKY(0, 0, COMPANION_BOX, COMPANION_BOX, sky.stops, sky.positions)]);
    canvas.save();
    canvas.scale(SCENE_TO_COMPANION_BOX.scale, SCENE_TO_COMPANION_BOX.scale);
    canvas.translate(SCENE_TO_COMPANION_BOX.dx, 0);
    const ground = Skia.Paint();
    ground.setAntiAlias(true);
    ground.setColor(Skia.Color(sceneByKey(scene).accent2));
    ground.setAlphaf(COMPANION_GROUND.opacity);
    canvas.drawPath(skPath(COMPANION_GROUND.d), ground);
    canvas.restore();
    canvas.translate(COMPANION_ORIGIN.x, COMPANION_ORIGIN.y);
    paintLayers(canvas, companionLayers(kind, colours));
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
  kind: CompanionKind;
  colours: CompanionColours;
  size: number;
  name?: string;
  scene?: SceneKey;
}

/** A dog, cat or baby. Still in the original style; see companionGeometry.ts. */
export const CompanionAvatar = memo(function CompanionAvatar({ kind, colours, size, name, scene }: CompanionAvatarProps) {
  const current = useScene().palette.key;
  const label = name ? `${name}, ${kind}` : kind[0].toUpperCase() + kind.slice(1);
  return <Round size={size} label={label} picture={recordCompanion(kind, colours, size, scene ?? current)} />;
});
