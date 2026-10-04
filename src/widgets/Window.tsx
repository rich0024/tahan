// Tahan — the window onto a village's scene.
//
// The pieces a screen stacks to look out of the window (src/paint/window.ts):
//
//   WindowBackdrop  the room (painting, wash, drift), 6% larger and moving at
//                   a sixth of the feed's scroll, on the UI thread — no
//                   re-render per scroll frame. When the scene changes it
//                   cross-fades to the new one over the same 420ms the
//                   colours take.
//   HeaderFade      the bottom of the header softening into the room.
//   Veil            the scene's background behind the feed, nearly opaque.
//   Glass           the sheen and vignette, over everything, touch-through.
//
// Colours that belong to the scene take the retint (useSceneColor); the
// glass is the same in every scene.

import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  Box, BoxShadow, Canvas, LinearGradient, Rect, rect, rrect, vec,
} from '@shopify/react-native-skia';
import Animated, {
  Easing, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';

import {
  BACKDROP_SCALE, HEADER_FADE, SHEEN_ANGLE, alphaColor, gradientLine, parallaxOffset, sheen, veil, vignette,
} from '../paint/window.ts';
import type { SceneKey } from '../theme/palettes.ts';
import { useScene, useSceneColor } from '../theme/SceneProvider.tsx';
import { retint } from '../theme/tokens.ts';
import { Room } from './Room.tsx';

const absolute = { position: 'absolute', top: 0, left: 0 } as const;

// ---------------------------------------------------------------------------

export function WindowBackdrop({ scroll, width, height }: { scroll: SharedValue<number>; width: number; height: number }) {
  const { palette } = useScene();
  const [shown, setShown] = useState<{ key: SceneKey; previous: SceneKey | null }>({ key: palette.key, previous: null });
  const fade = useSharedValue(1);
  const latest = useRef(palette.key);

  useEffect(() => {
    if (palette.key === latest.current) return;
    const previous = latest.current;
    latest.current = palette.key;
    setShown({ key: palette.key, previous });
    const done = () => setShown((s) => ({ key: s.key, previous: null }));
    fade.value = 0;
    fade.value = withTiming(1, { duration: retint.durationMs, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(done)();
    });
  }, [palette.key, fade]);

  const travel = useAnimatedStyle(() => ({
    transform: [{ translateY: -parallaxOffset(scroll.value, height) }, { scale: BACKDROP_SCALE }],
  }));
  const fadeIn = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <Animated.View pointerEvents="none" style={[absolute, { width, height, transformOrigin: 'top' }, travel]}>
      {shown.previous && <Room scene={shown.previous} width={width} height={height} ambient={false} style={absolute} />}
      <Animated.View style={[absolute, { width, height }, fadeIn]}>
        <Room scene={shown.key} width={width} height={height} />
      </Animated.View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------

/** The bottom of the header softening into the room. Sits on the header's lower edge. */
export function HeaderFade({ width, bottom }: { width: number; bottom: number }) {
  const bg = useSceneColor('bg');
  const colors = useDerivedValue(() => [alphaColor(bg.value, 0), alphaColor(bg.value, HEADER_FADE.alpha)]);
  return (
    <View pointerEvents="none" style={[absolute, { top: bottom - HEADER_FADE.height, width, height: HEADER_FADE.height }]}>
      <Canvas style={{ width, height: HEADER_FADE.height }}>
        <Rect x={0} y={0} width={width} height={HEADER_FADE.height}>
          <LinearGradient start={vec(0, 0)} end={vec(0, HEADER_FADE.height)} colors={colors} />
        </Rect>
      </Canvas>
    </View>
  );
}

/** The scene's background behind the feed: 72% at the top, 93% below. */
export function Veil({ width, top, height }: { width: number; top: number; height: number }) {
  const bg = useSceneColor('bg');
  const colors = useDerivedValue(() => veil.alphas.map((a) => alphaColor(bg.value, a)));
  const h = height - top;
  return (
    <View pointerEvents="none" style={[absolute, { top, width, height: h }]}>
      <Canvas style={{ width, height: h }}>
        <Rect x={0} y={0} width={width} height={h}>
          <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={colors} positions={[...veil.positions]} />
        </Rect>
      </Canvas>
    </View>
  );
}

/** The glass: a faint diagonal sheen and a soft vignette, over everything, never in the way. */
export function Glass({ width, height }: { width: number; height: number }) {
  const line = useMemo(() => gradientLine(SHEEN_ANGLE, width, height), [width, height]);
  return (
    <View pointerEvents="none" style={[absolute, { width, height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Canvas style={{ width, height }}>
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient start={vec(line.x0, line.y0)} end={vec(line.x1, line.y1)} colors={[...sheen.colors]} positions={[...sheen.positions]} />
        </Rect>
        <Box box={rrect(rect(0, 0, width, height), 0, 0)} color="transparent">
          <BoxShadow dx={0} dy={0} blur={vignette.blur} spread={vignette.spread} color={vignette.color} inner />
          <BoxShadow dx={0} dy={0} blur={0} spread={1} color={vignette.hairline} inner />
        </Box>
      </Canvas>
    </View>
  );
}
