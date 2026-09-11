// Tahan — the path parser.
//
// ABSOLUTE COMMANDS ONLY: M L Q C Z.
//
// This is a hard constraint, not a starting point. The geometry scaler offsets
// every number in a path as an absolute x,y pair; a relative command would be
// scaled as though it were a point, and the shape would come out subtly,
// silently wrong. So the parser THROWS on anything it does not know rather
// than guessing — a loud failure at startup beats a scene that is 4px off and
// nobody can say why.
//
// Do not "add support" for h, v, s, t or a. If authored data needs one of
// them, convert it to M/L/Q/C at transcription time (see the note on T below).
//
// One deliberate allowance: `z` may be lower-case. It carries no coordinates,
// so the absolute/relative distinction does not exist for it, and SVG authors
// write it in either case. Every other lower-case letter throws.
//
// NOTE for T2.1 (scene transcription): several scene paths in the prototype
// use `T` (smooth quadratic). `T` is not in the allowed set and this parser
// will throw on it. Convert each one to an explicit `Q` when transcribing —
// the control point of a `T` is the reflection of the previous control point
// about the current point, so the conversion is exact:
//     given ... Q cx cy x y  T x2 y2
//     the T's control point is (2*x - cx, 2*y - cy)
// Do not relax the parser to accept it.

import 'dart:ui';

/// Thrown when a path string contains anything outside `M L Q C Z`.
class PathSyntaxException implements Exception {
  final String message;
  final String source;
  final int offset;

  const PathSyntaxException(this.message, this.source, this.offset);

  @override
  String toString() =>
      'PathSyntaxException: $message (at offset $offset of "$source")';
}

const Set<String> _allowedCommands = {'M', 'L', 'Q', 'C', 'Z'};

/// Parse an absolute-only SVG path string into a [Path].
///
/// Supports the implicit-repetition rule that SVG defines and the authored
/// scene and avatar data relies on:
///   * extra coordinate pairs after `M` are line-tos (`M0 216 0 176 24 182`)
///   * extra pairs after `L`, extra pairs-of-pairs after `Q`, extra triples
///     after `C` repeat that command.
Path parsePath(String d) {
  final path = Path();
  final scanner = _Scanner(d);

  String? command;
  var haveStart = false;

  while (true) {
    scanner.skipSeparators();
    if (scanner.atEnd) break;

    final char = scanner.peek();
    if (_isLetter(char)) {
      final offset = scanner.offset;
      scanner.advance();
      final upper = char.toUpperCase();

      if (!_allowedCommands.contains(upper)) {
        throw PathSyntaxException(
          "unsupported command '$char' — this parser accepts absolute "
          "M L Q C Z only",
          d,
          offset,
        );
      }
      if (char != upper && upper != 'Z') {
        throw PathSyntaxException(
          "relative command '$char' — path data must be absolute; every "
          "number is scaled as an absolute coordinate",
          d,
          offset,
        );
      }

      if (upper == 'Z') {
        if (!haveStart) {
          throw PathSyntaxException(
            "'Z' before any 'M'", d, offset,
          );
        }
        path.close();
        // A close returns the pen to the start of the subpath. Any command
        // that follows starts from there.
        command = null;
        continue;
      }

      command = upper;
      if (command == 'M') {
        final x = scanner.readNumber(d);
        final y = scanner.readNumber(d);
        path.moveTo(x, y);
        haveStart = true;
        // Implicit line-tos follow a move-to.
        command = 'L';
      }
      continue;
    }

    // A number with no command in front of it. Legal only as a repetition of
    // the command we are already inside.
    if (command == null) {
      if (!haveStart) {
        throw PathSyntaxException(
          'path does not begin with an absolute M', d, scanner.offset,
        );
      }
      throw PathSyntaxException(
        'coordinates after Z with no new command', d, scanner.offset,
      );
    }

    switch (command) {
      case 'L':
        path.lineTo(scanner.readNumber(d), scanner.readNumber(d));
      case 'Q':
        path.quadraticBezierTo(
          scanner.readNumber(d),
          scanner.readNumber(d),
          scanner.readNumber(d),
          scanner.readNumber(d),
        );
      case 'C':
        path.cubicTo(
          scanner.readNumber(d),
          scanner.readNumber(d),
          scanner.readNumber(d),
          scanner.readNumber(d),
          scanner.readNumber(d),
          scanner.readNumber(d),
        );
      default:
        throw PathSyntaxException(
          "unreachable command '$command'", d, scanner.offset,
        );
    }
  }

  if (!haveStart) {
    throw PathSyntaxException('empty path', d, 0);
  }

  return path;
}

class _Scanner {
  final String src;
  int offset = 0;

  _Scanner(this.src);

  bool get atEnd => offset >= src.length;

  String peek() => src[offset];

  void advance() => offset++;

  void skipSeparators() {
    while (offset < src.length) {
      final c = src.codeUnitAt(offset);
      // space, tab, LF, CR, comma
      if (c == 0x20 || c == 0x09 || c == 0x0A || c == 0x0D || c == 0x2C) {
        offset++;
      } else {
        break;
      }
    }
  }

  double readNumber(String d) {
    skipSeparators();
    final start = offset;
    if (atEnd) {
      throw PathSyntaxException('expected a number, found end of path', d, start);
    }

    if (_isAt(0x2D) || _isAt(0x2B)) offset++; // - +
    var digits = 0;
    while (!atEnd && _isDigit(src.codeUnitAt(offset))) {
      offset++;
      digits++;
    }
    if (!atEnd && _isAt(0x2E)) {
      offset++; // .
      while (!atEnd && _isDigit(src.codeUnitAt(offset))) {
        offset++;
        digits++;
      }
    }
    if (digits == 0) {
      throw PathSyntaxException(
        "expected a number, found '${src[start]}'", d, start,
      );
    }
    if (!atEnd && (_isAt(0x65) || _isAt(0x45))) {
      // e E — exponent. Only consume it if it really is one, otherwise this
      // is the next command letter.
      final save = offset;
      offset++;
      if (!atEnd && (_isAt(0x2D) || _isAt(0x2B))) offset++;
      var expDigits = 0;
      while (!atEnd && _isDigit(src.codeUnitAt(offset))) {
        offset++;
        expDigits++;
      }
      if (expDigits == 0) offset = save;
    }

    final text = src.substring(start, offset);
    final value = double.tryParse(text);
    if (value == null) {
      throw PathSyntaxException("could not parse '$text' as a number", d, start);
    }
    return value;
  }

  bool _isAt(int code) => src.codeUnitAt(offset) == code;
}

bool _isDigit(int code) => code >= 0x30 && code <= 0x39;

bool _isLetter(String c) {
  final code = c.codeUnitAt(0);
  return (code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A);
}
