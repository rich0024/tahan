// Tahan — the theme, built from one scene palette.
//
// Everything visual comes from here: colour, type, radius, hit target. No
// screen hard-codes a hex, a font name or a corner radius. Swapping the
// palette constant retints buttons, cards and background, which is the whole
// definition-of-done for T1.2.

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'scene_extension.dart';
import 'tahan_palettes.dart';

/// Radii. Two of them, and no others.
class TahanRadius {
  /// Containers: cards, sheets, fields with a body.
  static const double container = 16;

  /// Buttons, chips, inputs, avatars — fully round.
  static const double pill = 999;

  static const BorderRadius containerAll =
      BorderRadius.all(Radius.circular(container));
  static const BorderRadius pillAll = BorderRadius.all(Radius.circular(pill));
}

/// The minimum hit target, everywhere, on every control. Not 48 — 56. This is
/// a family app and half its users are holding the phone at arm's length.
const double kMinHitTarget = 56;

/// The type scale, in logical px, exactly as the prototype uses it.
///
/// Caprasimo is display and titles only. Figtree is everything else, at 400
/// and 600. Nothing else, no third weight, no third family.
class TahanText {
  static TextStyle get wordmark => GoogleFonts.caprasimo(fontSize: 52, height: 1.05);

  static TextStyle get screenTitle => GoogleFonts.caprasimo(fontSize: 30, height: 1.15);
  static TextStyle get screenTitleSmall => GoogleFonts.caprasimo(fontSize: 28, height: 1.15);

  static TextStyle get sectionHeading => GoogleFonts.caprasimo(fontSize: 19, height: 1.2);
  static TextStyle get sectionHeadingSmall => GoogleFonts.caprasimo(fontSize: 15, height: 1.25);

  static TextStyle get body =>
      GoogleFonts.figtree(fontSize: 14, fontWeight: FontWeight.w400, height: 1.45);
  static TextStyle get bodyTight =>
      GoogleFonts.figtree(fontSize: 13.5, fontWeight: FontWeight.w400, height: 1.45);

  static TextStyle get rowTitle =>
      GoogleFonts.figtree(fontSize: 14, fontWeight: FontWeight.w600, height: 1.3);
  static TextStyle get rowTitleTight =>
      GoogleFonts.figtree(fontSize: 13.5, fontWeight: FontWeight.w600, height: 1.3);

  static TextStyle get meta =>
      GoogleFonts.figtree(fontSize: 12.5, fontWeight: FontWeight.w400, height: 1.35);
  static TextStyle get metaSmall =>
      GoogleFonts.figtree(fontSize: 11.5, fontWeight: FontWeight.w400, height: 1.35);

  static TextStyle get kicker => GoogleFonts.figtree(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        height: 1.2,
        letterSpacing: 11 * 0.12,
      );
}

/// Build the app theme for one scene.
///
/// `AnimatedTheme` with [kSceneRetintDuration] / [kSceneRetintCurve] over the
/// result of this function is what produces the 420ms retint.
ThemeData villageTheme(ScenePalette palette) {
  final scene = VillageScene.of(palette);
  final accent = scene.accent;
  final accent2 = scene.accent2;

  final colorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: accent.s500,
    onPrimary: const Color(0xFFFDF7EC),
    primaryContainer: accent.s200,
    onPrimaryContainer: accent.s800,
    secondary: accent2.s500,
    onSecondary: const Color(0xFFFDF7EC),
    secondaryContainer: accent2.s200,
    onSecondaryContainer: accent2.s800,
    error: const Color(0xFF9C3B2E),
    onError: const Color(0xFFFDF7EC),
    errorContainer: const Color(0xFFF2D8D2),
    onErrorContainer: const Color(0xFF5C1F17),
    surface: palette.surface,
    onSurface: tahanInk,
    surfaceContainerLowest: palette.bg,
    surfaceContainerLow: palette.bg,
    surfaceContainer: palette.surface,
    surfaceContainerHigh: accent.s100,
    surfaceContainerHighest: accent.s200,
    onSurfaceVariant: _mute(tahanInk),
    outline: accent.s300,
    outlineVariant: accent.s200,
    shadow: const Color(0x33201E1D),
    scrim: const Color(0x99201E1D),
    inverseSurface: tahanInk,
    onInverseSurface: palette.bg,
    inversePrimary: accent.s300,
  );

  final textTheme = TextTheme(
    displayLarge: TahanText.wordmark,
    displayMedium: TahanText.screenTitle,
    displaySmall: TahanText.screenTitleSmall,
    headlineLarge: TahanText.screenTitle,
    headlineMedium: TahanText.screenTitleSmall,
    headlineSmall: TahanText.sectionHeading,
    titleLarge: TahanText.sectionHeading,
    titleMedium: TahanText.sectionHeadingSmall,
    titleSmall: TahanText.rowTitle,
    bodyLarge: TahanText.body,
    bodyMedium: TahanText.bodyTight,
    bodySmall: TahanText.meta,
    labelLarge: TahanText.rowTitle,
    labelMedium: TahanText.meta,
    labelSmall: TahanText.kicker,
  ).apply(bodyColor: tahanInk, displayColor: tahanInk);

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: palette.bg,
    canvasColor: palette.bg,
    textTheme: textTheme,
    splashFactory: InkSparkle.splashFactory,
    // Padded, not shrinkWrap: hit targets never fall below the minimum, even
    // when a control's painted size is small.
    materialTapTargetSize: MaterialTapTargetSize.padded,
    visualDensity: VisualDensity.standard,
    extensions: <ThemeExtension<dynamic>>[scene],

    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      foregroundColor: scene.onScene,
      titleTextStyle: TahanText.sectionHeading.copyWith(color: scene.onScene),
    ),

    cardTheme: CardThemeData(
      color: palette.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: const RoundedRectangleBorder(borderRadius: TahanRadius.containerAll),
    ),

    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: accent.s500,
        foregroundColor: const Color(0xFFFDF7EC),
        disabledBackgroundColor: accent.s200,
        disabledForegroundColor: accent.s400,
        minimumSize: const Size(kMinHitTarget, kMinHitTarget),
        padding: const EdgeInsets.symmetric(horizontal: 24),
        textStyle: TahanText.rowTitle,
        shape: const StadiumBorder(),
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: accent.s700,
        minimumSize: const Size(kMinHitTarget, kMinHitTarget),
        padding: const EdgeInsets.symmetric(horizontal: 24),
        textStyle: TahanText.rowTitle,
        side: BorderSide(color: accent.s400, width: 1.5),
        shape: const StadiumBorder(),
      ),
    ),

    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: accent.s700,
        minimumSize: const Size(kMinHitTarget, kMinHitTarget),
        textStyle: TahanText.rowTitle,
        shape: const StadiumBorder(),
      ),
    ),

    chipTheme: ChipThemeData(
      backgroundColor: accent.s100,
      selectedColor: accent.s200,
      side: BorderSide(color: accent.s300),
      labelStyle: TahanText.rowTitleTight,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      shape: const StadiumBorder(),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: accent.s100,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      hintStyle: TahanText.body.copyWith(color: _mute(tahanInk)),
      border: OutlineInputBorder(
        borderRadius: TahanRadius.pillAll,
        borderSide: BorderSide(color: accent.s300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: TahanRadius.pillAll,
        borderSide: BorderSide(color: accent.s300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: TahanRadius.pillAll,
        borderSide: BorderSide(color: accent.s500, width: 2),
      ),
    ),

    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: palette.bg,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(TahanRadius.container)),
      ),
    ),

    dividerTheme: DividerThemeData(color: accent.s200, thickness: 1, space: 1),

    // The tab bar is drawn by the app and looks identical on both platforms.
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: palette.bg,
      surfaceTintColor: Colors.transparent,
      indicatorColor: accent.s200,
      height: 72,
      labelTextStyle: WidgetStatePropertyAll(TahanText.metaSmall),
    ),

    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.android: CupertinoPageTransitionsBuilder(),
      },
    ),
  );
}

/// Secondary ink: the same ink, softened, never a different grey.
Color _mute(Color ink) => ink.withValues(alpha: 0.62);
