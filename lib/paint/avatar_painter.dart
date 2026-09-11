// Tahan — the avatar painter.
//
// An avatar is six integers. There is no file, no upload, no crop, no image
// host: 5 skins × 5 hair colours × 8 styles × 4 beards × 4 glasses × 5 clothes
// is 16,000 faces out of about forty shapes, and all of it fits in a document
// field.
//
// Authored in a 78-unit square and painted at any size by uniform scale. The
// authored coordinates sit a little inside that square — the transcription
// below applies the same +7,+5 origin the prototype uses, so the head lands on
// the box's centre line and a circular crop takes head and shoulders.
//
// Sizes in use: 26 (feed row), 34 (status row), 44 (header / village
// switcher), 96 (Me), 216 (editor).

import 'dart:ui';

import '../theme/tahan_palettes.dart';
import 'primitives.dart';

/// The authoring box. Everything below is in these units.
const double kAvatarBox = 78;

/// Where the authored geometry sits inside the box.
const double _originX = 7;
const double _originY = 5;

const Color _ink = tahanInk;
const Color _glint = Color(0xFFF9F4ED);
const Color _dogMuzzle = Color(0xFFF7F2E6);
const Color _catNose = Color(0xFFC96B7A);
const Color _collarTag = Color(0xFFF2D08A);
const Color _babyCheek = Color(0xFFE79A95);
const Color _readerFrame = Color(0xFF4A4038);

/// A person, or one of the three companions. A companion belongs to the user,
/// not to a village.
enum AvatarKind { person, dog, cat, baby }

/// The layer list for one avatar, in paint order.
///
/// Pure geometry: no canvas, no size. The painter scales it; the cache keys on
/// the spec that produced it.
List<Layer> avatarLayers(
  AvatarSpec spec, {
  AvatarKind kind = AvatarKind.person,
  int coat = 0,
}) {
  final skin = AvatarKit.skins[spec.skin % 5];
  final hair = AvatarKit.hairColors[spec.hairColor % 5];
  final top = AvatarKit.clothes[spec.top % 5];
  final coatColor = AvatarKit.coats[coat % 5];

  switch (kind) {
    case AvatarKind.dog:
      return _dog(coatColor, top);
    case AvatarKind.cat:
      return _cat(coatColor, top);
    case AvatarKind.baby:
      return _baby(skin, hair, top);
    case AvatarKind.person:
      return _person(spec, skin, hair, top);
  }
}

List<Layer> _eyes(double y, double r) => [
      CircleLayer(cx: 26, cy: y, r: r, fill: _ink),
      CircleLayer(cx: 38, cy: y, r: r, fill: _ink),
    ];

List<Layer> _person(AvatarSpec spec, Color skin, Color hair, Color top) {
  // The skull cap of hair that every style except Bald sits on.
  final hairMass = CircleLayer(cx: 32, cy: 28, r: 15.4, fill: hair);

  final back = <Layer>[];
  final front = <Layer>[];

  switch (spec.hair) {
    case 0: // Short
      back.add(hairMass);
    case 1: // Long
      back.addAll([
        RectLayer(x: 15, y: 24, width: 8, height: 30, fill: hair, radius: 4),
        RectLayer(x: 41, y: 24, width: 8, height: 30, fill: hair, radius: 4),
        hairMass,
      ]);
    case 2: // Bun
      back.addAll([
        CircleLayer(cx: 32, cy: 13, r: 7.5, fill: hair),
        hairMass,
      ]);
    case 3: // Curls
      back.addAll([
        CircleLayer(cx: 20, cy: 23, r: 8.5, fill: hair),
        CircleLayer(cx: 32, cy: 17, r: 9.5, fill: hair),
        CircleLayer(cx: 44, cy: 23, r: 8.5, fill: hair),
        hairMass,
      ]);
    case 4: // Wrap
      back.add(hairMass);
      front.add(
        RectLayer(x: 15, y: 21, width: 34, height: 8, fill: top, radius: 4),
      );
    case 5: // Braids
      back.addAll([
        RectLayer(x: 14, y: 26, width: 7, height: 32, fill: hair, radius: 3.5),
        RectLayer(x: 43, y: 26, width: 7, height: 32, fill: hair, radius: 3.5),
        CircleLayer(cx: 17, cy: 58, r: 4, fill: hair),
        CircleLayer(cx: 47, cy: 58, r: 4, fill: hair),
        hairMass,
      ]);
    case 6: // Bald — no hair layers at all.
      break;
    case 7: // Cap
      back.add(hairMass);
      front.addAll([
        FillPathLayer(d: 'M16 28 C15 12 49 12 48 28 L48 25 16 25Z', fill: hair),
        RectLayer(x: 13, y: 24, width: 38, height: 6, fill: hair, radius: 3),
      ]);
  }

  final glasses = spec.glasses;
  final face = spec.face;
  final acc = <Layer>[];

  // Facial hair first, glasses over it.
  switch (face) {
    case 1: // Beard
      acc.add(FillPathLayer(
        d: 'M19 36 C19 52 26 57 32 57 C38 57 45 52 45 36 '
            'C41 43 38 45 32 45 C26 45 23 43 19 36Z',
        fill: hair,
        opacity: 0.92,
      ));
    case 2: // Moustache
      acc.add(FillPathLayer(
        d: 'M24 44 C27 42 30 43 32 44 C34 43 37 42 40 44 '
            'C37 47 34 47 32 46 C30 47 27 47 24 44Z',
        fill: hair,
      ));
    case 3: // Stubble
      acc.add(FillPathLayer(
        d: 'M20 38 C21 51 26 56 32 56 C38 56 43 51 44 38 '
            'C41 44 38 46 32 46 C26 46 23 44 20 38Z',
        fill: hair,
        opacity: 0.3,
      ));
  }

  final frame = glasses == 3 ? _readerFrame : _ink;

  switch (glasses) {
    case 1: // Round
      acc.addAll([
        CircleLayer(cx: 26, cy: 33, r: 7, fill: frame),
        CircleLayer(cx: 26, cy: 33, r: 5.4, fill: skin),
        CircleLayer(cx: 38, cy: 33, r: 7, fill: frame),
        CircleLayer(cx: 38, cy: 33, r: 5.4, fill: skin),
        RectLayer(x: 31.4, y: 32.3, width: 1.2, height: 1.4, fill: frame),
      ]);
    case 2: // Square
      acc.addAll([
        RectLayer(x: 20, y: 28, width: 12, height: 10, fill: frame, radius: 3),
        RectLayer(x: 21.5, y: 29.5, width: 9, height: 7, fill: skin, radius: 2),
        RectLayer(x: 32, y: 28, width: 12, height: 10, fill: frame, radius: 3),
        RectLayer(x: 33.5, y: 29.5, width: 9, height: 7, fill: skin, radius: 2),
        RectLayer(x: 31.4, y: 32.3, width: 1.2, height: 1.4, fill: frame),
      ]);
    case 3: // Readers — temple arms, because that is what reads as a
      // grandparent's reading pair.
      acc.addAll([
        RectLayer(x: 19.5, y: 29, width: 12.5, height: 9, fill: frame, radius: 2),
        RectLayer(x: 21, y: 30.4, width: 9.5, height: 6.2, fill: skin, radius: 1.5),
        RectLayer(x: 31.5, y: 29, width: 12.5, height: 9, fill: frame, radius: 2),
        RectLayer(x: 33, y: 30.4, width: 9.5, height: 6.2, fill: skin, radius: 1.5),
        RectLayer(x: 31.2, y: 33, width: 1.6, height: 1.3, fill: frame),
        StrokePathLayer(d: 'M19.5 31 L14 29', stroke: frame, strokeWidth: 1.5),
        StrokePathLayer(d: 'M44 31 L49.5 29', stroke: frame, strokeWidth: 1.5),
      ]);
  }

  // Eyes are redrawn over the lens fill so they read through the glass.
  if (glasses > 0) acc.addAll(_eyes(33, 1.9));

  return [
    FillPathLayer(d: 'M6 66 C9 50 21 43 32 43 C43 43 55 50 58 66Z', fill: top),
    CircleLayer(cx: 19, cy: 34, r: 3.4, fill: skin),
    CircleLayer(cx: 45, cy: 34, r: 3.4, fill: skin),
    ...back,
    CircleLayer(cx: 32, cy: 33, r: 14, fill: skin),
    ...front,
    ..._eyes(33, 1.9),
    const StrokePathLayer(d: 'M27 40 Q32 44 37 40', stroke: _ink, strokeWidth: 1.6),
    ...acc,
  ];
}

List<Layer> _dog(Color coat, Color top) => [
      RectLayer(x: 8, y: 54, width: 48, height: 14, fill: coat, radius: 7),
      EllipseLayer(cx: 13, cy: 24, rx: 8, ry: 15, fill: coat, rotation: -18),
      EllipseLayer(cx: 51, cy: 24, rx: 8, ry: 15, fill: coat, rotation: 18),
      EllipseLayer(
        cx: 13, cy: 27, rx: 4.5, ry: 9,
        fill: _ink, opacity: 0.18, rotation: -18,
      ),
      EllipseLayer(
        cx: 51, cy: 27, rx: 4.5, ry: 9,
        fill: _ink, opacity: 0.18, rotation: 18,
      ),
      CircleLayer(cx: 32, cy: 32, r: 16, fill: coat),
      const EllipseLayer(cx: 32, cy: 42, rx: 11, ry: 8.5, fill: _dogMuzzle),
      const CircleLayer(cx: 32, cy: 38, r: 3, fill: _ink),
      const StrokePathLayer(d: 'M32 41 Q28 45 25 43', stroke: _ink, strokeWidth: 1.5),
      const StrokePathLayer(d: 'M32 41 Q36 45 39 43', stroke: _ink, strokeWidth: 1.5),
      ..._eyes(29, 2.1),
      const CircleLayer(cx: 27, cy: 28, r: 0.8, fill: _glint, opacity: 0.8),
      const CircleLayer(cx: 39, cy: 28, r: 0.8, fill: _glint, opacity: 0.8),
      EllipseLayer(cx: 32, cy: 49, rx: 14, ry: 4.5, fill: top),
      const CircleLayer(cx: 32, cy: 53, r: 3, fill: _collarTag),
    ];

List<Layer> _cat(Color coat, Color top) => [
      FillPathLayer(d: 'M18 22 20 6 32 18Z', fill: coat),
      FillPathLayer(d: 'M46 22 44 6 32 18Z', fill: coat),
      RectLayer(x: 8, y: 56, width: 48, height: 12, fill: coat, radius: 6),
      CircleLayer(cx: 32, cy: 34, r: 15, fill: coat),
      ..._eyes(32, 2.2),
      const FillPathLayer(d: 'M29 39 32 42 35 39Z', fill: _catNose),
      const StrokePathLayer(d: 'M12 36 L22 38', stroke: _ink, strokeWidth: 1),
      const StrokePathLayer(d: 'M52 36 L42 38', stroke: _ink, strokeWidth: 1),
      EllipseLayer(cx: 32, cy: 51, rx: 13, ry: 4, fill: top),
      const CircleLayer(cx: 32, cy: 55, r: 2.8, fill: _collarTag),
    ];

List<Layer> _baby(Color skin, Color hair, Color top) => [
      FillPathLayer(
        d: 'M10 66 C12 52 22 46 32 46 C42 46 52 52 54 66Z',
        fill: top,
      ),
      CircleLayer(cx: 32, cy: 32, r: 15, fill: skin),
      StrokePathLayer(d: 'M30 15 C32 10 36 11 36 15', stroke: hair, strokeWidth: 3),
      ..._eyes(31, 2),
      const CircleLayer(cx: 21, cy: 36, r: 3.4, fill: _babyCheek, opacity: 0.55),
      const CircleLayer(cx: 43, cy: 36, r: 3.4, fill: _babyCheek, opacity: 0.55),
      const StrokePathLayer(d: 'M28 39 Q32 43 36 39', stroke: _ink, strokeWidth: 1.6),
    ];

/// Paints one avatar into the given size.
///
/// [background] is the village's sky — the avatar is drawn on it, so the face
/// belongs to the room it is in. Pass null for a transparent avatar.
class AvatarPainter extends CustomPainter {
  final AvatarSpec spec;
  final AvatarKind kind;
  final int coat;
  final List<Color>? background;

  const AvatarPainter({
    required this.spec,
    this.kind = AvatarKind.person,
    this.coat = 0,
    this.background,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / kAvatarBox;
    canvas
      ..save()
      ..scale(scale);

    final sky = background;
    if (sky != null && sky.isNotEmpty) {
      SkyGradientLayer(
        x: 0,
        y: 0,
        width: kAvatarBox,
        height: size.height / scale,
        stops: sky,
      ).paint(canvas);
    }

    canvas.translate(_originX, _originY);
    paintLayers(canvas, avatarLayers(spec, kind: kind, coat: coat));
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant AvatarPainter old) =>
      old.spec != spec ||
      old.kind != kind ||
      old.coat != coat ||
      !_sameSky(old.background, background);

  static bool _sameSky(List<Color>? a, List<Color>? b) {
    if (identical(a, b)) return true;
    if (a == null || b == null || a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}
