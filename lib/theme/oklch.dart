// Tahan — OKLCH colour ramps.
//
// Every role in the theme gets a 100–900 ramp. The ramps are generated in
// OKLCH, never as RGB tints: RGB tints of a warm accent go grey and muddy at
// the light end, and warmth is the whole point of this app.
//
// Shape of the ramp:
//   * step 500 is the source token, EXACTLY. The design tokens are final and
//     must survive the ramp untouched, so 500 is pinned rather than snapped to
//     a nominal lightness.
//   * every other step rides the same normalised lightness curve, so accent,
//     accent-2 and the neutrals stay in step with one another — a 200 is a 200
//     whichever role it came from.
//   * hue is preserved; chroma follows a curve that eases off at both ends,
//     where the sRGB gamut is tight, and is then gamut-clipped by bisection so
//     no step can clip to a flat, over-saturated block.

import 'dart:math' as math;
import 'dart:ui';

/// Normalised lightness curve, shared by every role.
///
/// Index 0..8 maps to steps 100..900. Values are the fraction of the way from
/// the light anchor (`_lMax`) to the source lightness for steps below 500, and
/// from the source lightness to the dark anchor (`_lMin`) for steps above it.
const List<double> _lightnessCurve = [
  1.00, // 100 — at the light anchor
  0.78, // 200
  0.55, // 300
  0.29, // 400
  0.00, // 500 — the source
  0.20, // 600
  0.44, // 700
  0.70, // 800
  1.00, // 900 — at the dark anchor
];

/// Chroma multiplier per step, relative to the source chroma. Eased off at the
/// extremes: near white and near black the gamut has little room, and pushing
/// chroma there is what produces the muddy, dirty steps we are avoiding.
const List<double> _chromaCurve = [
  0.34, // 100
  0.52, // 200
  0.72, // 300
  0.90, // 400
  1.00, // 500
  0.97, // 600
  0.88, // 700
  0.72, // 800
  0.55, // 900
];

const double _lMax = 0.972;
const double _lMin = 0.268;

const List<int> rampSteps = [100, 200, 300, 400, 500, 600, 700, 800, 900];

/// A generated 100–900 ramp for one theme role.
class ColorRamp {
  /// The source token, unmodified. Identical to `shade(500)`.
  final Color base;
  final Map<int, Color> _steps;

  const ColorRamp._(this.base, this._steps);

  /// Generate a ramp from a source colour. The source becomes step 500.
  factory ColorRamp.from(Color base) {
    final lch = Oklch.fromColor(base);
    final steps = <int, Color>{};
    for (var i = 0; i < rampSteps.length; i++) {
      final step = rampSteps[i];
      if (step == 500) {
        steps[step] = base;
        continue;
      }
      final t = _lightnessCurve[i];
      final l = step < 500
          ? lch.l + (_lMax - lch.l) * t
          : lch.l + (_lMin - lch.l) * t;
      final c = lch.c * _chromaCurve[i];
      steps[step] = Oklch(l, c, lch.h).toColor();
    }
    return ColorRamp._(base, steps);
  }

  /// The colour at [step]. Steps outside 100–900 are clamped to the ends;
  /// steps that are not multiples of 100 are rounded to the nearest one.
  Color shade(int step) {
    final s = (step / 100).round().clamp(1, 9) * 100;
    return _steps[s]!;
  }

  Color get s100 => shade(100);
  Color get s200 => shade(200);
  Color get s300 => shade(300);
  Color get s400 => shade(400);
  Color get s500 => shade(500);
  Color get s600 => shade(600);
  Color get s700 => shade(700);
  Color get s800 => shade(800);
  Color get s900 => shade(900);

  @override
  bool operator ==(Object other) => other is ColorRamp && other.base == base;

  @override
  int get hashCode => base.hashCode;
}

/// A colour in the OKLCH space: perceptual lightness, chroma, hue in degrees.
class Oklch {
  final double l;
  final double c;
  final double h;

  const Oklch(this.l, this.c, this.h);

  factory Oklch.fromColor(Color color) {
    final lab = _Oklab.fromColor(color);
    final c = math.sqrt(lab.a * lab.a + lab.b * lab.b);
    var h = math.atan2(lab.b, lab.a) * 180 / math.pi;
    if (h < 0) h += 360;
    return Oklch(lab.l, c, h);
  }

  /// Convert back to sRGB, reducing chroma until the result is in gamut.
  ///
  /// Clamping the channels instead would shift the hue and flatten the step
  /// into a solid block, which is exactly the failure mode this file exists to
  /// avoid — so we bisect on chroma and keep lightness and hue intact.
  Color toColor() {
    if (_inGamut(c)) return _at(c);
    var lo = 0.0;
    var hi = c;
    for (var i = 0; i < 24; i++) {
      final mid = (lo + hi) / 2;
      if (_inGamut(mid)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return _at(lo);
  }

  Color _at(double chroma) {
    final rad = h * math.pi / 180;
    return _Oklab(l, chroma * math.cos(rad), chroma * math.sin(rad)).toColor();
  }

  bool _inGamut(double chroma) {
    final rad = h * math.pi / 180;
    final rgb =
        _Oklab(l, chroma * math.cos(rad), chroma * math.sin(rad)).toLinearRgb();
    const eps = 1e-4;
    return rgb.every((v) => v >= -eps && v <= 1 + eps);
  }
}

class _Oklab {
  final double l;
  final double a;
  final double b;

  const _Oklab(this.l, this.a, this.b);

  factory _Oklab.fromColor(Color color) {
    final r = _toLinear(color.r);
    final g = _toLinear(color.g);
    final bl = _toLinear(color.b);

    final lms0 = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bl;
    final lms1 = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bl;
    final lms2 = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bl;

    final l_ = _cbrt(lms0);
    final m_ = _cbrt(lms1);
    final s_ = _cbrt(lms2);

    return _Oklab(
      0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
      1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
      0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    );
  }

  List<double> toLinearRgb() {
    final l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    final m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    final s_ = l - 0.0894841775 * a - 1.2914855480 * b;

    final lms0 = l_ * l_ * l_;
    final lms1 = m_ * m_ * m_;
    final lms2 = s_ * s_ * s_;

    return [
      4.0767416621 * lms0 - 3.3077115913 * lms1 + 0.2309699292 * lms2,
      -1.2684380046 * lms0 + 2.6097574011 * lms1 - 0.3413193965 * lms2,
      -0.0041960863 * lms0 - 0.7034186147 * lms1 + 1.7076147010 * lms2,
    ];
  }

  Color toColor() {
    final rgb = toLinearRgb();
    return Color.fromARGB(
      255,
      _toByte(rgb[0]),
      _toByte(rgb[1]),
      _toByte(rgb[2]),
    );
  }
}

double _cbrt(double x) => x < 0 ? -math.pow(-x, 1 / 3).toDouble() : math.pow(x, 1 / 3).toDouble();

double _toLinear(double c) =>
    c <= 0.04045 ? c / 12.92 : math.pow((c + 0.055) / 1.055, 2.4).toDouble();

double _toSrgb(double c) =>
    c <= 0.0031308 ? 12.92 * c : 1.055 * math.pow(c, 1 / 2.4).toDouble() - 0.055;

int _toByte(double linear) =>
    (_toSrgb(linear.clamp(0.0, 1.0)) * 255).round().clamp(0, 255);
