// Tahan — the current village's scene, carried through the theme.
//
// Changing village (or scene) retints the whole app, chrome included. Putting
// the palette and its ramps in a ThemeExtension is what makes that a single
// animated value rather than a hundred setStates: `AnimatedTheme` lerps this
// extension and every widget reading it moves together, with no flash of the
// previous accent.

import 'package:flutter/material.dart';

import 'oklch.dart';
import 'tahan_palettes.dart';

/// How long the whole app takes to retint when the village or scene changes.
const Duration kSceneRetintDuration = Duration(milliseconds: 420);
const Curve kSceneRetintCurve = Curves.easeOutCubic;

@immutable
class VillageScene extends ThemeExtension<VillageScene> {
  /// The scene this theme was built from. During a retint this stays the
  /// destination palette — read the ramps, not this, for colours mid-flight.
  final ScenePalette palette;

  final ColorRamp accent;
  final ColorRamp accent2;

  final Color bg;
  final Color surface;
  final Color ink;

  /// A dark sky wants light ink in the header. Not animated: it flips at the
  /// midpoint of the retint rather than passing through a muddy in-between.
  final bool dark;

  final Drift drift;

  VillageScene({
    required this.palette,
    required this.bg,
    required this.surface,
    required this.ink,
    required this.dark,
    required this.drift,
    ColorRamp? accent,
    ColorRamp? accent2,
  })  : accent = accent ?? ColorRamp.from(palette.accent),
        accent2 = accent2 ?? ColorRamp.from(palette.accent2);

  factory VillageScene.of(ScenePalette palette) => VillageScene(
        palette: palette,
        bg: palette.bg,
        surface: palette.surface,
        ink: tahanInk,
        dark: palette.dark,
        drift: palette.drift,
      );

  /// Ink that reads on the scene itself — cream over a dark sky, near-black
  /// over a light one.
  Color get onScene => dark ? const Color(0xFFFDF7EC) : tahanInk;

  @override
  VillageScene copyWith({
    ScenePalette? palette,
    ColorRamp? accent,
    ColorRamp? accent2,
    Color? bg,
    Color? surface,
    Color? ink,
    bool? dark,
    Drift? drift,
  }) =>
      VillageScene(
        palette: palette ?? this.palette,
        accent: accent ?? this.accent,
        accent2: accent2 ?? this.accent2,
        bg: bg ?? this.bg,
        surface: surface ?? this.surface,
        ink: ink ?? this.ink,
        dark: dark ?? this.dark,
        drift: drift ?? this.drift,
      );

  @override
  VillageScene lerp(covariant VillageScene? other, double t) {
    if (other == null) return this;
    return VillageScene(
      palette: t < 0.5 ? palette : other.palette,
      // Ramps are regenerated from the lerped base rather than lerped
      // step-by-step: an OKLCH ramp of a mid-transition colour stays a
      // coherent ramp, where nine independently lerped steps drift apart.
      accent: ColorRamp.from(Color.lerp(accent.base, other.accent.base, t)!),
      accent2: ColorRamp.from(Color.lerp(accent2.base, other.accent2.base, t)!),
      bg: Color.lerp(bg, other.bg, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      ink: Color.lerp(ink, other.ink, t)!,
      dark: t < 0.5 ? dark : other.dark,
      drift: t < 0.5 ? drift : other.drift,
    );
  }
}

extension VillageSceneContext on BuildContext {
  /// The current scene. Every colour in Tahan comes through here or through
  /// `Theme.of(context)` — never a hard-coded hex.
  VillageScene get scene => Theme.of(this).extension<VillageScene>()!;
}
