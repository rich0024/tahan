// T1.3 — the parser accepts absolute M L Q C Z and throws on everything else.
//
// The throwing is the point of these tests. A parser that quietly skips a
// command it does not understand produces a scene that is subtly wrong and
// nobody can say why; a parser that throws produces a stack trace on the first
// run.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tahan/paint/path_parser.dart';

void main() {
  group('accepts absolute commands', () {
    test('M and L', () {
      final path = parsePath('M10 20 L30 60');
      expect(path.getBounds(), const Rect.fromLTRB(10, 20, 30, 60));
    });

    test('implicit line-tos after M', () {
      // The authored scene data relies on this: 'M0 216 0 176 24 182 ...'
      final path = parsePath('M0 216 0 176 24 182');
      expect(path.getBounds(), const Rect.fromLTRB(0, 176, 24, 216));
    });

    test('repeated L coordinates', () {
      final path = parsePath('M0 0 L10 10 20 5 30 40');
      expect(path.getBounds(), const Rect.fromLTRB(0, 0, 30, 40));
    });

    test('Q', () {
      final path = parsePath('M27 40 Q32 44 37 40');
      final bounds = path.getBounds();
      expect(bounds.left, 27);
      expect(bounds.right, 37);
      expect(bounds.top, 40);
      // The control point pulls the curve down without reaching it.
      expect(bounds.bottom, greaterThan(40));
      expect(bounds.bottom, lessThan(44));
    });

    test('repeated Q coordinates', () {
      final path = parsePath('M0 0 Q5 10 10 0 15 -10 20 0');
      expect(path.getBounds().right, 20);
    });

    test('C', () {
      final path = parsePath('M6 66 C9 50 21 43 32 43');
      final bounds = path.getBounds();
      expect(bounds.left, 6);
      expect(bounds.right, 32);
      expect(bounds.bottom, 66);
    });

    test('repeated C coordinates', () {
      // Straight from the avatar: the body is two cubics under one C.
      final path = parsePath('M6 66 C9 50 21 43 32 43 C43 43 55 50 58 66Z');
      final bounds = path.getBounds();
      expect(bounds.left, 6);
      expect(bounds.right, 58);
      expect(bounds.bottom, 66);
    });

    test('Z closes the subpath', () {
      final open = parsePath('M0 0 L10 0 L10 10');
      final closed = parsePath('M0 0 L10 0 L10 10Z');
      expect(closed.contains(const Offset(8, 5)), isTrue);
      expect(open.getBounds(), closed.getBounds());
    });

    test('lower-case z is allowed — it carries no coordinates', () {
      expect(() => parsePath('M0 0 L10 0 L10 10z'), returnsNormally);
    });

    test('negative, decimal and leading-dot numbers', () {
      final path = parsePath('M-5.5 -2 L.5 3.25');
      expect(path.getBounds(), const Rect.fromLTRB(-5.5, -2, 0.5, 3.25));
    });

    test('commas are separators', () {
      final path = parsePath('M0,0 L10,10');
      expect(path.getBounds(), const Rect.fromLTRB(0, 0, 10, 10));
    });

    test('multiple subpaths', () {
      final path = parsePath('M0 0 L5 5Z M20 20 L30 30Z');
      expect(path.getBounds(), const Rect.fromLTRB(0, 0, 30, 30));
    });
  });

  group('throws on relative commands', () {
    for (final command in ['m', 'l', 'q', 'c']) {
      test("'$command'", () {
        expect(
          () => parsePath('M0 0 ${command}10 10'),
          throwsA(
            isA<PathSyntaxException>().having(
              (e) => e.message,
              'message',
              contains('relative'),
            ),
          ),
        );
      });
    }
  });

  group('throws on arcs', () {
    test("'A'", () {
      expect(
        () => parsePath('M0 0 A5 5 0 0 1 10 10'),
        throwsA(isA<PathSyntaxException>()),
      );
    });

    test("'a'", () {
      expect(
        () => parsePath('M0 0 a5 5 0 0 1 10 10'),
        throwsA(isA<PathSyntaxException>()),
      );
    });
  });

  group('throws on every other command', () {
    // H and V are the dangerous ones: they take a single number, so a scaler
    // that offsets numbers in x,y pairs would put every following coordinate
    // on the wrong axis.
    for (final command in ['H', 'V', 'S', 'T', 'h', 'v', 's', 't']) {
      test("'$command'", () {
        expect(
          () => parsePath('M0 0 ${command}10 10'),
          throwsA(isA<PathSyntaxException>()),
        );
      });
    }
  });

  group('throws on malformed input', () {
    test('does not begin with M', () {
      expect(() => parsePath('L10 10'), throwsA(isA<PathSyntaxException>()));
    });

    test('empty', () {
      expect(() => parsePath(''), throwsA(isA<PathSyntaxException>()));
    });

    test('command with a missing coordinate', () {
      expect(() => parsePath('M0 0 L10'), throwsA(isA<PathSyntaxException>()));
    });

    test('Z before any M', () {
      expect(() => parsePath('Z'), throwsA(isA<PathSyntaxException>()));
    });

    test('coordinates after Z with no command', () {
      expect(
        () => parsePath('M0 0 L1 1Z 5 5'),
        throwsA(isA<PathSyntaxException>()),
      );
    });

    test('junk instead of a number', () {
      expect(() => parsePath('M0 0 L# 5'), throwsA(isA<PathSyntaxException>()));
    });
  });

  test('the exception says where it went wrong', () {
    try {
      parsePath('M0 0 h10');
      fail('expected a throw');
    } on PathSyntaxException catch (e) {
      expect(e.offset, 5);
      expect(e.source, 'M0 0 h10');
      expect(e.toString(), contains('offset 5'));
    }
  });
}
