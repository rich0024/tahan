// Tahan — a scene, painted into a rect.
//
// The painting (src/paint/scenes/art.ts) is scaled to the rect's width and
// anchored top; below it, its own ground colour runs to the bottom, joined by
// a short fade. While a painting is still loading — the first frame after
// launch — the drawn version of the same scene stands in, so there's never
// an empty sky. `drawn` shows the drawn version on purpose, for comparison.
//
// Decoration: a screen reader skips it — screens name the village in words.

import { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import {
  Canvas, Image, LinearGradient, Picture, Rect, Skia, useImage, vec, type SkPicture,
} from '@shopify/react-native-skia';

import { artFloor, artPlacement } from '../paint/scenes/art.ts';
import { sceneFrame } from '../paint/scenes/index.ts';
import { paintLayers } from '../paint/skiaPaint.ts';
import { withAlpha } from '../theme/oklch.ts';
import type { SceneKey } from '../theme/palettes.ts';

/* eslint-disable @typescript-eslint/no-require-imports */
const ART: Readonly<Record<SceneKey, number>> = {
  night: require('../../assets/scenes/night.webp'),
  forest: require('../../assets/scenes/forest.webp'),
  tropical: require('../../assets/scenes/tropical.webp'),
  desert: require('../../assets/scenes/desert.webp'),
  terrace: require('../../assets/scenes/terrace.webp'),
  savanna: require('../../assets/scenes/savanna.webp'),
  coast: require('../../assets/scenes/coast.webp'),
  winter: require('../../assets/scenes/winter.webp'),
  blossom: require('../../assets/scenes/blossom.webp'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

// ---------------------------------------------------------------------------
// The drawn fallback, recorded once per scene and size.

const MAX = 48;
const pictures = new Map<string, SkPicture>();

function drawn(scene: SceneKey, width: number, height: number): SkPicture {
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

// ---------------------------------------------------------------------------

export function SceneBackdrop({ scene, width, height, style, version = 'painted' }: {
  scene: SceneKey;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
  version?: 'painted' | 'drawn';
}) {
  const image = useImage(version === 'painted' ? ART[scene] : null);
  const fallback = useMemo(() => drawn(scene, width, height), [scene, width, height]);
  const art = artPlacement(width);
  const floor = artFloor[scene];

  return (
    <View
      style={[{ width, height, overflow: 'hidden' }, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Canvas style={{ width, height }}>
        {version === 'painted' && image ? (
          <>
            <Rect x={0} y={0} width={width} height={height} color={floor} />
            <Image image={image} x={0} y={0} width={art.width} height={art.height} fit="fill" />
            <Rect x={0} y={art.fadeTop} width={width} height={art.fadeHeight + 1}>
              <LinearGradient
                start={vec(0, art.fadeTop)}
                end={vec(0, art.fadeTop + art.fadeHeight)}
                colors={[withAlpha(floor, 0), floor]}
              />
            </Rect>
          </>
        ) : (
          <Picture picture={fallback} />
        )}
      </Canvas>
    </View>
  );
}
