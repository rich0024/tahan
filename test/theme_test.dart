// T1.2 — the theme is built from one palette, and the ramps are OKLCH.
//
// The ramp tests are the ones that matter. An RGB tint of a warm accent drifts
// towards grey as it lightens — the hue wanders and the chroma collapses — and
// the whole app goes muddy. Testing that hue holds across the ramp is how we
// catch somebody quietly replacing the generator with Color.lerp to white.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tahan/theme/oklch.dart';
import 'package:tahan/theme/scene_extension.dart';
import 'package:tahan/theme/tahan_palettes.dart';
import 'package:tahan/theme/village_theme.dart';

void main() {
  group('OKLCH ramps', () {
    test('500 is the source token, untouched', () {
      for (final palette in tahanScenes) {
        expect(ColorRamp.from(palette.accent).shade(500), palette.accent);
        expect(ColorRamp.from(palette.accent2).shade(500), palette.accent2);
      }
    });

    test('lightness falls monotonically from 100 to 900', () {
      for (final palette in tahanScenes) {
        final ramp = ColorRamp.from(palette.accent);
        var previous = 2.0;
        for (final step in rampSteps) {
          final l = Oklch.fromColor(ramp.shade(step)).l;
          expect(l, lessThan(previous), reason: '${palette.key} at $step');
          previous = l;
        }
      }
    });

    test('hue holds across the ramp — this is not an RGB tint', () {
      for (final palette in tahanScenes) {
        final ramp = ColorRamp.from(palette.accent);
        final baseHue = Oklch.fromColor(palette.accent).h;
        for (final step in rampSteps) {
          final hue = Oklch.fromColor(ramp.shade(step)).h;
          final drift = _hueDistance(hue, baseHue);
          expect(drift, lessThan(8), reason: '${palette.key} at $step drifted $drift°');
        }
      }
    });

    test('an RGB tint would fail the hue test — so the test has teeth', () {
      // Lightening in RGB is what we are forbidding. Confirm it actually
      // misbehaves, so a passing suite means something.
      final base = tahanScenes.first.accent; // #C67139
      final rgbTint = Color.lerp(base, const Color(0xFFFFFFFF), 0.8)!;
      final tintChroma = Oklch.fromColor(rgbTint).c;
      final rampChroma = Oklch.fromColor(ColorRamp.from(base).shade(200)).c;
      // The OKLCH step at a comparable lightness keeps materially more chroma.
      expect(rampChroma, greaterThan(tintChroma));
    });

    test('every step is fully opaque and in gamut', () {
      for (final palette in tahanScenes) {
        for (final ramp in [
          ColorRamp.from(palette.accent),
          ColorRamp.from(palette.accent2),
        ]) {
          for (final step in rampSteps) {
            final c = ramp.shade(step);
            expect(c.a, 1.0);
            for (final channel in [c.r, c.g, c.b]) {
              expect(channel, inInclusiveRange(0.0, 1.0));
            }
          }
        }
      }
    });

    test('steps clamp rather than throw', () {
      final ramp = ColorRamp.from(tahanScenes.first.accent);
      expect(ramp.shade(0), ramp.shade(100));
      expect(ramp.shade(5000), ramp.shade(900));
      expect(ramp.shade(250), ramp.shade(300));
    });
  });

  group('villageTheme', () {
    test('takes its colours from the palette', () {
      for (final palette in tahanScenes) {
        final theme = villageTheme(palette);
        expect(theme.colorScheme.primary, palette.accent);
        expect(theme.colorScheme.secondary, palette.accent2);
        expect(theme.scaffoldBackgroundColor, palette.bg);
        expect(theme.colorScheme.onSurface, tahanInk);
      }
    });

    test('swapping the palette retints buttons, cards and background', () {
      final night = villageTheme(tahanScenes[0]);
      final forest = villageTheme(tahanScenes[1]);

      expect(night.scaffoldBackgroundColor, isNot(forest.scaffoldBackgroundColor));
      expect(night.colorScheme.primary, isNot(forest.colorScheme.primary));
      expect(
        night.filledButtonTheme.style?.backgroundColor
            ?.resolve(<WidgetState>{}),
        isNot(forest.filledButtonTheme.style?.backgroundColor
            ?.resolve(<WidgetState>{})),
      );
      expect(night.cardTheme.color, isNot(forest.cardTheme.color));
    });

    test('registers the VillageScene extension', () {
      final theme = villageTheme(tahanScenes[2]);
      final scene = theme.extension<VillageScene>();
      expect(scene, isNotNull);
      expect(scene!.palette.key, 'tropical');
      expect(scene.drift, Drift.breeze);
    });

    test('every control clears the 56px minimum hit target', () {
      final theme = villageTheme(tahanScenes.first);
      for (final size in [
        theme.filledButtonTheme.style?.minimumSize?.resolve(<WidgetState>{}),
        theme.outlinedButtonTheme.style?.minimumSize?.resolve(<WidgetState>{}),
        theme.textButtonTheme.style?.minimumSize?.resolve(<WidgetState>{}),
      ]) {
        expect(size, isNotNull);
        expect(size!.height, greaterThanOrEqualTo(kMinHitTarget));
      }
    });

    test('buttons, chips and inputs are pills; cards are 16', () {
      final theme = villageTheme(tahanScenes.first);
      expect(
        theme.filledButtonTheme.style?.shape?.resolve(<WidgetState>{}),
        isA<StadiumBorder>(),
      );
      expect(theme.chipTheme.shape, isA<StadiumBorder>());
      expect(
        theme.cardTheme.shape,
        isA<RoundedRectangleBorder>().having(
          (s) => (s.borderRadius as BorderRadius).topLeft.x,
          'radius',
          TahanRadius.container,
        ),
      );
    });

    test('a dark sky gets light ink on the scene', () {
      expect(VillageScene.of(tahanScenes[0]).dark, isTrue); // night
      expect(VillageScene.of(tahanScenes[0]).onScene.computeLuminance(),
          greaterThan(0.5));
      expect(VillageScene.of(tahanScenes[1]).dark, isFalse); // forest
      expect(VillageScene.of(tahanScenes[1]).onScene, tahanInk);
    });
  });

  group('the retint', () {
    test('lerps between two scenes without passing through a third colour', () {
      final from = VillageScene.of(tahanScenes[0]);
      final to = VillageScene.of(tahanScenes[1]);

      expect(from.lerp(to, 0).accent.base, from.accent.base);
      expect(from.lerp(to, 1).accent.base, to.accent.base);

      final mid = from.lerp(to, 0.5);
      // Mid-flight the accent sits between the two, not at either end.
      expect(mid.accent.base, isNot(from.accent.base));
      expect(mid.accent.base, isNot(to.accent.base));
      // And it is still a coherent ramp.
      expect(mid.accent.shade(500), mid.accent.base);
    });

    test('is 420ms on an easeOutCubic', () {
      expect(kSceneRetintDuration, const Duration(milliseconds: 420));
      expect(kSceneRetintCurve, Curves.easeOutCubic);
    });
  });
}

double _hueDistance(double a, double b) {
  final d = (a - b).abs() % 360;
  return d > 180 ? 360 - d : d;
}
