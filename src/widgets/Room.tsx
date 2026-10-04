// Tahan — the room: a village's scene, the time of day over it, and its
// weather drifting across.
//
// Three layers: the painted scene (SceneBackdrop), one low-alpha wash tinted
// by the clock (src/paint/wash.ts), and the ambient drift
// (src/paint/drift.ts). The drift runs off a single frame clock on the UI
// thread. It draws nothing at all — not slower particles — when the phone
// asks for reduced motion or Ambient motion is off; and it stops, holding its
// place, while the app is in the background or the screen isn't the one in
// front. The window treatment (glass, sill, parallax) is T2.5.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  BlurMask, Canvas, Group, LinearGradient, Rect, RoundedRect, vec,
} from '@shopify/react-native-skia';
import {
  useDerivedValue, useFrameCallback, useReducedMotion, useSharedValue, type SharedValue,
} from 'react-native-reanimated';

import { driftParticles, particleAt, type Particle } from '../paint/drift.ts';
import { washes, type DayPart } from '../paint/wash.ts';
import { sceneByKey, type SceneKey } from '../theme/palettes.ts';
import { SceneBackdrop } from './SceneBackdrop.tsx';
import { useAppActive, useDayPart } from './useDayPart.ts';

/** Longest step the clock takes in one frame, so a stall doesn't make the weather jump. */
const MAX_STEP_MS = 64;

export interface RoomProps {
  scene: SceneKey;
  width: number;
  height: number;
  /** Ambient motion setting. Off draws no particles. */
  ambient?: boolean;
  /** Force a part of the day; 'auto' follows the clock. */
  dayPart?: DayPart | 'auto';
  version?: 'painted' | 'drawn';
  style?: StyleProp<ViewStyle>;
}

export function Room({ scene, width, height, ambient = true, dayPart = 'auto', version, style }: RoomProps) {
  const part = useDayPart(dayPart);
  const reduced = useReducedMotion();
  const { drift } = sceneByKey(scene);
  const particles = useMemo(() => driftParticles(scene, drift, ambient && !reduced), [scene, drift, ambient, reduced]);
  const wash = washes[part];

  return (
    <View style={[{ width, height }, style]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SceneBackdrop scene={scene} width={width} height={height} version={version} />
      <Canvas style={{ position: 'absolute', top: 0, left: 0, width, height }}>
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[...wash.colors]} positions={[...wash.positions]} />
        </Rect>
        {particles.length > 0 && <Drift particles={particles} width={width} height={height} />}
      </Canvas>
    </View>
  );
}

// ---------------------------------------------------------------------------

function Drift({ particles, width, height }: { particles: Particle[]; width: number; height: number }) {
  const clock = useSharedValue(0);
  const appActive = useAppActive();
  const [focused, setFocused] = useState(true);

  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  // One controller for every particle.
  const frame = useFrameCallback((info) => {
    const step = Math.min(info.timeSincePreviousFrame ?? 0, MAX_STEP_MS);
    clock.value += step / 1000;
  }, false);

  const running = appActive && focused;
  useEffect(() => {
    frame.setActive(running);
  }, [frame, running]);

  return (
    <>
      {particles.map((p, i) => <Mote key={i} p={p} clock={clock} width={width} height={height} />)}
    </>
  );
}

function Mote({ p, clock, width, height }: { p: Particle; clock: SharedValue<number>; width: number; height: number }) {
  const transform = useDerivedValue(() => {
    const f = particleAt(p, clock.value, width, height);
    return [{ translateX: f.x }, { translateY: f.y }, { rotate: (f.rotate * Math.PI) / 180 }, { scale: f.scale }];
  });
  const opacity = useDerivedValue(() => particleAt(p, clock.value, width, height).opacity);
  return (
    <Group transform={transform} opacity={opacity}>
      <RoundedRect x={-p.w / 2} y={-p.h / 2} width={p.w} height={p.h} r={p.r} color={p.color}>
        {p.motion === 'glow' && <BlurMask blur={1.5} style="solid" />}
      </RoundedRect>
    </Group>
  );
}
