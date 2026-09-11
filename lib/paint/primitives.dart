// Tahan — the six drawing primitives.
//
// Everything Tahan draws (nine scenes, every avatar, the companions) is a flat
// list of these. Six types, no more: rect, circle, ellipse, filled path,
// stroked path, sky gradient. Keeping the vocabulary this small is what lets
// the scenes and the avatars share one painter, one scaler and one cache.
//
// Layers are authored in a fixed box — 402×216 for scenes, 78×78 for avatars —
// and painted into a real rect by a uniform canvas scale. Nothing here knows
// about the destination size; that is the painter's job.

import 'dart:ui';

import 'path_parser.dart';

/// Parsed paths, kept for the life of the app.
///
/// The authored geometry is a fixed set of strings known at startup, and feed
/// rows repaint constantly — there is no reason to re-parse. Populated eagerly
/// by [warmPathCache] so a parse error surfaces at launch rather than on the
/// frame that first draws the offending scene.
final Map<String, Path> _pathCache = <String, Path>{};

Path cachedPath(String d) => _pathCache[d] ??= parsePath(d);

/// Parse every path in [layers] now. Call once at startup, per scene set, so
/// bad path data throws where somebody is looking.
void warmPathCache(Iterable<Layer> layers) {
  for (final layer in layers) {
    switch (layer) {
      case FillPathLayer(:final d):
        cachedPath(d);
      case StrokePathLayer(:final d):
        cachedPath(d);
      default:
        break;
    }
  }
}

/// How many paths are currently cached. Diagnostics only.
int get cachedPathCount => _pathCache.length;

sealed class Layer {
  /// 0–1. Multiplied into the layer's own colour at paint time.
  final double opacity;

  const Layer({this.opacity = 1});

  void paint(Canvas canvas);
}

/// A rectangle, optionally rounded. `radius` is a corner radius in authoring
/// units, not a fraction.
final class RectLayer extends Layer {
  final double x, y, width, height, radius;
  final Color fill;

  const RectLayer({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.fill,
    this.radius = 0,
    super.opacity,
  });

  @override
  void paint(Canvas canvas) {
    final paint = Paint()
      ..color = _applyOpacity(fill, opacity)
      ..isAntiAlias = true;
    final rect = Rect.fromLTWH(x, y, width, height);
    if (radius > 0) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, Radius.circular(radius)),
        paint,
      );
    } else {
      canvas.drawRect(rect, paint);
    }
  }
}

final class CircleLayer extends Layer {
  final double cx, cy, r;
  final Color fill;

  const CircleLayer({
    required this.cx,
    required this.cy,
    required this.r,
    required this.fill,
    super.opacity,
  });

  @override
  void paint(Canvas canvas) {
    canvas.drawCircle(
      Offset(cx, cy),
      r,
      Paint()
        ..color = _applyOpacity(fill, opacity)
        ..isAntiAlias = true,
    );
  }
}

/// An ellipse, optionally rotated about a point.
///
/// The rotation is what makes a dog's ears and a palm's fronds work; it is
/// expressed in degrees about an explicit centre, matching the authored data.
final class EllipseLayer extends Layer {
  final double cx, cy, rx, ry;
  final Color fill;

  /// Degrees, clockwise, matching SVG's `rotate(a x y)`.
  final double rotation;

  /// The point rotated about. Defaults to the ellipse's own centre.
  final double? pivotX, pivotY;

  const EllipseLayer({
    required this.cx,
    required this.cy,
    required this.rx,
    required this.ry,
    required this.fill,
    this.rotation = 0,
    this.pivotX,
    this.pivotY,
    super.opacity,
  });

  @override
  void paint(Canvas canvas) {
    final paint = Paint()
      ..color = _applyOpacity(fill, opacity)
      ..isAntiAlias = true;
    final rect = Rect.fromCenter(
      center: Offset(cx, cy),
      width: rx * 2,
      height: ry * 2,
    );
    if (rotation == 0) {
      canvas.drawOval(rect, paint);
      return;
    }
    final px = pivotX ?? cx;
    final py = pivotY ?? cy;
    canvas
      ..save()
      ..translate(px, py)
      ..rotate(rotation * 3.141592653589793 / 180)
      ..translate(-px, -py)
      ..drawOval(rect, paint)
      ..restore();
  }
}

final class FillPathLayer extends Layer {
  /// Absolute path data — `M L Q C Z` only. See `path_parser.dart`.
  final String d;
  final Color fill;

  const FillPathLayer({required this.d, required this.fill, super.opacity});

  @override
  void paint(Canvas canvas) {
    canvas.drawPath(
      cachedPath(d),
      Paint()
        ..color = _applyOpacity(fill, opacity)
        ..isAntiAlias = true,
    );
  }
}

final class StrokePathLayer extends Layer {
  final String d;
  final Color stroke;
  final double strokeWidth;

  const StrokePathLayer({
    required this.d,
    required this.stroke,
    required this.strokeWidth,
    super.opacity,
  });

  @override
  void paint(Canvas canvas) {
    canvas.drawPath(
      cachedPath(d),
      Paint()
        ..color = _applyOpacity(stroke, opacity)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..isAntiAlias = true,
    );
  }
}

/// The sky: a vertical gradient filling a rect.
///
/// The last stop is stretched by the scene painter so the sky runs the full
/// height of the app however tall the device is — that stretching lives in the
/// painter, not here, because it depends on the destination rect.
final class SkyGradientLayer extends Layer {
  final double x, y, width, height;
  final List<Color> stops;

  /// Positions 0–1, one per colour. Null means evenly spaced.
  final List<double>? positions;

  const SkyGradientLayer({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.stops,
    this.positions,
    super.opacity,
  });

  @override
  void paint(Canvas canvas) {
    final rect = Rect.fromLTWH(x, y, width, height);
    final colors = opacity == 1
        ? stops
        : [for (final c in stops) _applyOpacity(c, opacity)];
    canvas.drawRect(
      rect,
      Paint()
        ..shader = Gradient.linear(
          rect.topCenter,
          rect.bottomCenter,
          colors,
          positions ?? _evenStops(stops.length),
        ),
    );
  }
}

List<double> _evenStops(int count) {
  if (count <= 1) return const [0];
  return [for (var i = 0; i < count; i++) i / (count - 1)];
}

Color _applyOpacity(Color color, double opacity) =>
    opacity >= 1 ? color : color.withValues(alpha: color.a * opacity);

/// Paint a list of layers, in order, onto [canvas].
///
/// The canvas is expected to already carry the authoring-box transform.
void paintLayers(Canvas canvas, List<Layer> layers) {
  for (final layer in layers) {
    layer.paint(canvas);
  }
}
