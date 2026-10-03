// Tahan — themed building blocks.
//
// Screens are built from these, never from raw colours. Surfaces that fill an
// area (screen, card, filled button) fade through the retint; text snaps to
// the destination scene, because ink is the same in every scene and the one
// role that differs (ink on the scene itself) should flip, not pass through a
// muddy midpoint.
//
// Platform-native only for modal sheets and the share action. Everything here
// is drawn by the app and looks the same on iOS and Android.

import type { ReactNode } from 'react';
import {
  Pressable, Text, View, type PressableProps, type StyleProp, type TextProps,
  type TextStyle, type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScene, useSceneColor } from '../theme/SceneProvider.tsx';
import type { SceneColorRole } from '../theme/sceneColors.ts';
import { hitTarget, radius, type, type TypeVariant } from '../theme/tokens.ts';

// ---------------------------------------------------------------------------

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const bg = useSceneColor('bg');
  const insets = useSafeAreaInsets();
  const animated = useAnimatedStyle(() => ({ backgroundColor: bg.value }));
  return (
    <Animated.View style={[{ flex: 1, paddingTop: insets.top }, animated, style]}>
      {children}
    </Animated.View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const surface = useSceneColor('surface');
  const animated = useAnimatedStyle(() => ({ backgroundColor: surface.value }));
  return (
    <Animated.View style={[{ borderRadius: radius.container, padding: 18 }, animated, style]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------

export interface TProps extends TextProps {
  variant?: TypeVariant;
  color?: SceneColorRole;
  style?: StyleProp<TextStyle>;
}

/**
 * Text. Never pass allowFontScaling={false} or maxFontSizeMultiplier — text
 * scaling is never capped in Tahan. test/guards.test.ts fails the build if
 * either appears.
 */
export function T({ variant = 'body', color = 'ink', style, ...rest }: TProps) {
  const { colors } = useScene();
  return <Text {...rest} style={[type[variant], { color: colors[color] }, style]} />;
}

// ---------------------------------------------------------------------------

type ButtonKind = 'filled' | 'outlined' | 'text';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  kind?: ButtonKind;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, kind = 'filled', style, ...rest }: ButtonProps) {
  const { colors } = useScene();
  const accent = useSceneColor('accent');
  const outline = useSceneColor('accent400');

  const fill = useAnimatedStyle(() => {
    if (kind === 'filled') return { backgroundColor: accent.value, borderColor: accent.value };
    if (kind === 'outlined') return { backgroundColor: 'transparent', borderColor: outline.value };
    return { backgroundColor: 'transparent', borderColor: 'transparent' };
  });

  const labelColor = kind === 'filled' ? colors.onAccent : colors.accent700;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} {...rest} style={style}>
      {({ pressed }: { pressed: boolean }) => (
        <Animated.View
          style={[
            {
              minHeight: hitTarget,
              minWidth: hitTarget,
              paddingHorizontal: 24,
              borderRadius: radius.pill,
              borderWidth: 1.5,
              alignItems: 'center',
              justifyContent: 'center',
            },
            fill,
            pressed && {
              backgroundColor: kind === 'filled' ? colors.accent800 : colors.accent100,
            },
          ]}
        >
          <Text style={[type.rowTitle, { color: labelColor, textAlign: 'center' }]}>{label}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------

const CHIP_HEIGHT = 40;
const chipSlop = (hitTarget - CHIP_HEIGHT) / 2;

export interface ChipProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  selected?: boolean;
}

/**
 * A chip. Drawn 40pt tall, but its hit target is extended to the full 56 —
 * the brief's minimum is about where a thumb lands, not how big a pill looks.
 */
export function Chip({ label, selected = false, ...rest }: ChipProps) {
  const { colors } = useScene();
  const soft = useSceneColor('accent100');
  const tint = useSceneColor('accent200');
  const line = useSceneColor('accent300');
  const animated = useAnimatedStyle(() => ({
    backgroundColor: selected ? tint.value : soft.value,
    borderColor: line.value,
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      hitSlop={{ top: chipSlop, bottom: chipSlop, left: 4, right: 4 }}
      {...rest}
    >
      <Animated.View
        style={[
          {
            minHeight: CHIP_HEIGHT,
            paddingHorizontal: 14,
            borderRadius: radius.pill,
            borderWidth: 1,
            justifyContent: 'center',
          },
          animated,
        ]}
      >
        <Text style={[type.rowTitleTight, { color: selected ? colors.accent800 : colors.ink }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------

/** A row that wraps, for chips and controls. Goes vertical on its own at large text. */
export function Wrap({ children, gap = 10 }: { children: ReactNode; gap?: number }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, alignItems: 'flex-end' }}>{children}</View>;
}
