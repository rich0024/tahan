// Tahan — tokens: radius, hit target, type scale, retint timing.
//
// Pure TypeScript. No screen hard-codes a radius, a font name or a size; they
// come from here. Colours come from sceneColors.ts.

/** Two radii, and no others. */
export const radius = {
  /** Containers: cards, sheets. */
  container: 16,
  /** Buttons, chips, inputs, avatars — fully round. */
  pill: 999,
} as const;

/**
 * The minimum hit target, on every control. Not 44, not 48 — 56. This is a
 * family app and half its users hold the phone at arm's length.
 */
export const hitTarget = 56;

/** The whole app retints over this long when the village or scene changes. */
export const retint = { durationMs: 420 } as const; // easing: easeOutCubic

/**
 * Font families as registered with expo-font in app/_layout.tsx. React Native
 * picks a face by family name, not by fontWeight, so each weight is its own
 * family. Caprasimo is display and titles only; Figtree is everything else.
 */
export const fonts = {
  display: 'Caprasimo',
  body: 'Figtree',
  bodySemibold: 'Figtree-SemiBold',
} as const;

export interface TypeStyle {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly letterSpacing?: number;
  readonly textTransform?: 'uppercase';
}

const style = (
  fontFamily: string, fontSize: number, lineHeight: number,
  extra: Partial<TypeStyle> = {},
): TypeStyle => ({ fontFamily, fontSize, lineHeight: Math.round(fontSize * lineHeight), ...extra });

/**
 * The type scale, in points, as the prototype uses it.
 *
 * Text scaling is never capped: nothing in this app sets
 * allowFontScaling={false} or maxFontSizeMultiplier. Every screen is laid out
 * to survive 150%. test/guards.test.ts enforces it.
 */
export const type = {
  wordmark: style(fonts.display, 52, 1.05),
  screenTitle: style(fonts.display, 30, 1.15),
  screenTitleSmall: style(fonts.display, 28, 1.15),
  sectionHeading: style(fonts.display, 19, 1.2),
  sectionHeadingSmall: style(fonts.display, 15, 1.25),
  body: style(fonts.body, 14, 1.45),
  bodyTight: style(fonts.body, 13.5, 1.45),
  rowTitle: style(fonts.bodySemibold, 14, 1.3),
  rowTitleTight: style(fonts.bodySemibold, 13.5, 1.3),
  meta: style(fonts.body, 12.5, 1.35),
  metaSmall: style(fonts.body, 11.5, 1.35),
  kicker: style(fonts.bodySemibold, 11, 1.2, { letterSpacing: 11 * 0.12, textTransform: 'uppercase' }),
} as const;

export type TypeVariant = keyof typeof type;
