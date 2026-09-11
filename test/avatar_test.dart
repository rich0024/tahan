// T1.4 / T1.5 — every avatar combination draws, and nothing escapes the box.
//
// "No clipped hair, no floating glasses" from the ticket is a visual check on
// a debug grid, but the mechanical half of it is testable: all 16,000
// combinations are built from the same forty shapes, so if the union of every
// shape stays inside the 78-unit box for every combination, nothing can be
// clipped at any size.

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tahan/paint/avatar_painter.dart';
import 'package:tahan/paint/primitives.dart';
import 'package:tahan/theme/tahan_palettes.dart';
import 'package:tahan/theme/village_theme.dart';
import 'package:tahan/widgets/avatar.dart';

/// The union of every shape in [layers], in authoring units, including stroke
/// width and ellipse rotation.
Rect layerBounds(List<Layer> layers) {
  var rect = Rect.zero;
  var first = true;
  void add(Rect r) {
    rect = first ? r : rect.expandToInclude(r);
    first = false;
  }

  for (final layer in layers) {
    switch (layer) {
      case RectLayer(:final x, :final y, :final width, :final height):
        add(Rect.fromLTWH(x, y, width, height));
      case CircleLayer(:final cx, :final cy, :final r):
        add(Rect.fromCircle(center: Offset(cx, cy), radius: r));
      case EllipseLayer(:final cx, :final cy, :final rx, :final ry, :final rotation):
        final a = rotation * math.pi / 180;
        final hx = math.sqrt(
          math.pow(rx * math.cos(a), 2) + math.pow(ry * math.sin(a), 2),
        );
        final hy = math.sqrt(
          math.pow(rx * math.sin(a), 2) + math.pow(ry * math.cos(a), 2),
        );
        add(Rect.fromCenter(center: Offset(cx, cy), width: hx * 2, height: hy * 2));
      case FillPathLayer(:final d):
        add(cachedPath(d).getBounds());
      case StrokePathLayer(:final d, :final strokeWidth):
        add(cachedPath(d).getBounds().inflate(strokeWidth / 2));
      case SkyGradientLayer(:final x, :final y, :final width, :final height):
        add(Rect.fromLTWH(x, y, width, height));
    }
  }
  return rect;
}

/// Where the authored geometry sits inside the 78-unit box.
const Offset kAvatarOrigin = Offset(7, 5);

Iterable<AvatarSpec> everyCombination() sync* {
  for (var hair = 0; hair < 8; hair++) {
    for (var glasses = 0; glasses < 4; glasses++) {
      for (var face = 0; face < 4; face++) {
        for (var skin = 0; skin < 5; skin++) {
          yield AvatarSpec(
            skin: skin,
            hairColor: (skin + hair) % 5,
            top: (skin + glasses) % 5,
            hair: hair,
            glasses: glasses,
            face: face,
          );
        }
      }
    }
  }
}

void main() {
  group('geometry', () {
    test('every person combination builds without throwing', () {
      for (final spec in everyCombination()) {
        expect(() => avatarLayers(spec), returnsNormally, reason: '$spec');
      }
    });

    test('every person combination stays inside the 78-unit box', () {
      for (final spec in everyCombination()) {
        final bounds = layerBounds(avatarLayers(spec)).shift(kAvatarOrigin);
        expect(bounds.left, greaterThanOrEqualTo(0), reason: '$spec');
        expect(bounds.top, greaterThanOrEqualTo(0), reason: '$spec');
        expect(bounds.right, lessThanOrEqualTo(kAvatarBox), reason: '$spec');
        expect(bounds.bottom, lessThanOrEqualTo(kAvatarBox), reason: '$spec');
      }
    });

    test('companions stay inside the box too', () {
      for (final kind in [AvatarKind.dog, AvatarKind.cat, AvatarKind.baby]) {
        for (var coat = 0; coat < 5; coat++) {
          final bounds = layerBounds(
            avatarLayers(const AvatarSpec(), kind: kind, coat: coat),
          ).shift(kAvatarOrigin);
          expect(bounds.left, greaterThanOrEqualTo(0), reason: '$kind');
          expect(bounds.top, greaterThanOrEqualTo(0), reason: '$kind');
          expect(bounds.right, lessThanOrEqualTo(kAvatarBox), reason: '$kind');
          expect(bounds.bottom, lessThanOrEqualTo(kAvatarBox), reason: '$kind');
        }
      }
    });

    test('bald draws no hair, and every other style draws some', () {
      final bald = avatarLayers(const AvatarSpec(hair: 6));
      final short = avatarLayers(const AvatarSpec(hair: 0));
      expect(short.length, greaterThan(bald.length));

      for (var hair = 0; hair < 8; hair++) {
        final count = avatarLayers(AvatarSpec(hair: hair)).length;
        if (hair == 6) {
          expect(count, bald.length);
        } else {
          expect(count, greaterThan(bald.length), reason: 'hair $hair');
        }
      }
    });

    test('glasses redraw the eyes over the lens', () {
      // Without glasses the eyes are drawn once; with them, again on top, so
      // they read through the lens fill.
      final none = avatarLayers(const AvatarSpec(glasses: 0));
      final round = avatarLayers(const AvatarSpec(glasses: 1));
      final eyesInNone = none.whereType<CircleLayer>().where(_isEye).length;
      final eyesInRound = round.whereType<CircleLayer>().where(_isEye).length;
      expect(eyesInNone, 2);
      expect(eyesInRound, 4);
    });

    test('the six integers are the whole of the spec', () {
      const spec = AvatarSpec(skin: 3, hairColor: 1, top: 4, hair: 5, glasses: 2, face: 1);
      expect(AvatarSpec.fromMap(spec.toMap()), spec);
      expect(spec.toMap().keys.length, 6);
    });

    test('out-of-range integers wrap rather than crash', () {
      expect(
        () => avatarLayers(const AvatarSpec(skin: 99, hairColor: 42, top: 7)),
        returnsNormally,
      );
    });
  });

  group('painting', () {
    testWidgets('renders at every size in use', (tester) async {
      for (final size in [
        AvatarSize.feedRow,
        AvatarSize.statusRow,
        AvatarSize.header,
        AvatarSize.me,
        AvatarSize.editor,
      ]) {
        await tester.pumpWidget(
          _host(Avatar(spec: const AvatarSpec(hair: 3, glasses: 2, face: 1), size: size, name: 'Rosa')),
        );
        expect(tester.takeException(), isNull, reason: 'size $size');
      }
    });

    testWidgets('carries the person\'s name as a Semantics label', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _host(const Avatar(spec: AvatarSpec(), size: 44, name: 'Nina')),
      );
      expect(find.bySemanticsLabel('Nina'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('a companion says what it is', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _host(const Avatar(
          spec: AvatarSpec(),
          size: 44,
          name: 'Bandit',
          kind: AvatarKind.dog,
        )),
      );
      expect(find.bySemanticsLabel('Bandit, dog'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('the same spec and size is recorded once', (tester) async {
      clearAvatarCache();
      await tester.pumpWidget(
        _host(Column(
          children: List.generate(
            20,
            (_) => const Avatar(spec: AvatarSpec(hair: 2), size: 26, name: 'Rosa'),
          ),
        )),
      );
      await tester.pump();
      expect(avatarCacheSize, 1);
    });

    testWidgets('200 avatars build without exhausting the cache', (tester) async {
      clearAvatarCache();
      await tester.pumpWidget(
        _host(SizedBox(
          height: 600,
          child: ListView.builder(
            itemCount: 200,
            itemExtent: 30,
            itemBuilder: (context, i) => Avatar(
              spec: AvatarSpec(
                skin: i % 5,
                hairColor: (i * 3) % 5,
                top: (i * 7) % 5,
                hair: i % 8,
                glasses: i % 4,
                face: (i * 2) % 4,
              ),
              size: AvatarSize.feedRow,
              name: 'Person $i',
            ),
          ),
        )),
      );
      await tester.pump();
      expect(tester.takeException(), isNull);
      // Bounded, not unbounded.
      expect(avatarCacheSize, lessThanOrEqualTo(256));
    });
  });
}

bool _isEye(CircleLayer c) =>
    (c.cx == 26 || c.cx == 38) && c.r < 3 && c.fill == tahanInk;

/// The widget reads the current scene for its default sky, so it needs a real
/// theme around it.
Widget _host(Widget child) => MaterialApp(
      theme: villageTheme(tahanScenes.first),
      home: Scaffold(body: Center(child: child)),
    );
