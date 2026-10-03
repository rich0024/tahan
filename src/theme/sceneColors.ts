// Tahan — the colours one scene gives the app.
//
// Pure. The SceneProvider animates between two of these; everything themed
// reads its colours from here, by role, never as a hex literal.

import { lerpHex, makeRamp } from './oklch.ts';
import { tahanCream, tahanInk, type ScenePalette } from './palettes.ts';

export interface SceneColors {
  readonly bg: string;
  readonly surface: string;
  readonly ink: string;
  /** Secondary ink: the same ink, softened — never a different grey. */
  readonly inkMuted: string;
  /** Ink that reads on the scene itself: cream on a dark sky, ink on a light one. */
  readonly onScene: string;
  /** Text and icons on a filled accent button. */
  readonly onAccent: string;

  readonly accent: string; // 500 — the token
  readonly accent100: string; // tinted fills, field backgrounds
  readonly accent200: string; // selected chips, hovers
  readonly accent300: string; // outlines
  readonly accent400: string;
  readonly accent700: string; // text on tinted fills, outlined buttons
  readonly accent800: string; // pressed

  readonly accent2: string;
  readonly accent2_100: string;
  readonly accent2_200: string;
  readonly accent2_700: string;
}

export type SceneColorRole = keyof SceneColors;

export function sceneColors(p: ScenePalette): SceneColors {
  const a = makeRamp(p.accent);
  const b = makeRamp(p.accent2);
  return {
    bg: p.bg,
    surface: p.surface,
    ink: tahanInk,
    // Ink at 62% over this scene's background, flattened to an opaque colour
    // so it can animate like every other role.
    inkMuted: lerpHex(p.bg, tahanInk, 0.62),
    onScene: p.dark ? tahanCream : tahanInk,
    onAccent: tahanCream,
    accent: a[500],
    accent100: a[100],
    accent200: a[200],
    accent300: a[300],
    accent400: a[400],
    accent700: a[700],
    accent800: a[800],
    accent2: b[500],
    accent2_100: b[100],
    accent2_200: b[200],
    accent2_700: b[700],
  };
}
