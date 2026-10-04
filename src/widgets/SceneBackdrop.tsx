// Tahan — a scene, painted into a rect.
//
// The painting (src/paint/sceneArt.ts) is scaled to the rect's width and
// anchored top; below it, its own ground colour runs to the bottom, joined by
// a short fade. While the painting is still loading — a moment, on the first
// launch — the ground colour alone fills the rect.
//
// Decoration: a screen reader skips it — screens name the village in words.

import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, Image, LinearGradient, Rect, useImage, vec } from '@shopify/react-native-skia';

import { artFloor, artPlacement } from '../paint/sceneArt.ts';
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

export function SceneBackdrop({ scene, width, height, style }: {
  scene: SceneKey;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
}) {
  const image = useImage(ART[scene]);
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
        <Rect x={0} y={0} width={width} height={height} color={floor} />
        {image && (
          <>
            <Image image={image} x={0} y={0} width={art.width} height={art.height} fit="fill" />
            <Rect x={0} y={art.fadeTop} width={width} height={art.fadeHeight + 1}>
              <LinearGradient
                start={vec(0, art.fadeTop)}
                end={vec(0, art.fadeTop + art.fadeHeight)}
                colors={[withAlpha(floor, 0), floor]}
              />
            </Rect>
          </>
        )}
      </Canvas>
    </View>
  );
}
