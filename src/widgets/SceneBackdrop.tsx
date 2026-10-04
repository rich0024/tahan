// Tahan — a scene, painted into a rect.
//
// The scene is scaled to the rect's width and anchored top; below it, the
// scene's ground colour runs to the bottom (src/paint/scenes). Recorded once
// per scene and size as an SkPicture and replayed after that. Decoration: a
// screen reader skips it — screens name the village in words.

import { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, Picture, Skia, type SkPicture } from '@shopify/react-native-skia';

import { sceneFrame } from '../paint/scenes/index.ts';
import { paintLayers } from '../paint/skiaPaint.ts';
import type { SceneKey } from '../theme/palettes.ts';

const MAX = 48;
const pictures = new Map<string, SkPicture>();

function record(scene: SceneKey, width: number, height: number): SkPicture {
  const key = `${scene}|${Math.round(width)}|${Math.round(height)}`;
  const hit = pictures.get(key);
  if (hit) {
    pictures.delete(key);
    pictures.set(key, hit);
    return hit;
  }
  const recorder = Skia.PictureRecorder();
  paintLayers(recorder.beginRecording(Skia.XYWHRect(0, 0, width, height)), sceneFrame(scene, width, height));
  const picture = recorder.finishRecordingAsPicture();
  pictures.set(key, picture);
  while (pictures.size > MAX) {
    const oldest = pictures.keys().next().value;
    if (oldest === undefined) break;
    pictures.delete(oldest);
  }
  return picture;
}

export function SceneBackdrop({ scene, width, height, style }: {
  scene: SceneKey; width: number; height: number; style?: StyleProp<ViewStyle>;
}) {
  const picture = useMemo(() => record(scene, width, height), [scene, width, height]);
  return (
    <View
      style={[{ width, height, overflow: 'hidden' }, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Canvas style={{ width, height }}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
}
