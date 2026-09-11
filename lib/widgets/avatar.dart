// Tahan — the avatar widget.
//
// Feed rows redraw constantly and there is no reason to re-run a forty-shape
// paint list every frame, so each spec+size is recorded once as a ui.Picture
// and replayed after that. A Picture is a vector display list, not a bitmap:
// replaying it costs almost nothing and it stays sharp at any device pixel
// ratio.
//
// Every avatar carries a Semantics label with the person's name. A face with
// no name is invisible to a screen reader, and this is an app built out of
// faces.

import 'dart:collection';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../paint/avatar_painter.dart';
import '../theme/scene_extension.dart';
import '../theme/tahan_palettes.dart';
import '../theme/village_theme.dart';

/// The sizes the app actually uses. Kept here so the cache stays small and
/// predictable: a handful of specs across six sizes, not an unbounded set.
class AvatarSize {
  static const double feedRow = 26;
  static const double statusRow = 34;
  static const double header = 44;
  static const double me = 96;
  static const double editor = 216;
}

@immutable
class _AvatarKey {
  final AvatarSpec spec;
  final double size;
  final AvatarKind kind;
  final int coat;
  final int skyHash;

  const _AvatarKey(this.spec, this.size, this.kind, this.coat, this.skyHash);

  @override
  bool operator ==(Object other) =>
      other is _AvatarKey &&
      other.spec == spec &&
      other.size == size &&
      other.kind == kind &&
      other.coat == coat &&
      other.skyHash == skyHash;

  @override
  int get hashCode => Object.hash(spec, size, kind, coat, skyHash);
}

/// Recorded avatars, most-recently-used last.
///
/// Bounded so a village switcher that walks many villages cannot grow it
/// without limit; evicted pictures are disposed rather than left to the GC.
class _AvatarPictureCache {
  static const int _maxEntries = 256;
  static final LinkedHashMap<_AvatarKey, ui.Picture> _entries =
      LinkedHashMap<_AvatarKey, ui.Picture>();

  static ui.Picture get(_AvatarKey key, Size size, AvatarPainter painter) {
    final existing = _entries.remove(key);
    if (existing != null) {
      _entries[key] = existing; // touch
      return existing;
    }

    final recorder = ui.PictureRecorder();
    painter.paint(Canvas(recorder), size);
    final picture = recorder.endRecording();

    _entries[key] = picture;
    while (_entries.length > _maxEntries) {
      final oldest = _entries.keys.first;
      _entries.remove(oldest)?.dispose();
    }
    return picture;
  }

  static int get length => _entries.length;

  static void clear() {
    for (final picture in _entries.values) {
      picture.dispose();
    }
    _entries.clear();
  }
}

/// Diagnostics for tests and the debug grid.
int get avatarCacheSize => _AvatarPictureCache.length;
void clearAvatarCache() => _AvatarPictureCache.clear();

/// One person's face, drawn from six integers.
class Avatar extends StatelessWidget {
  final AvatarSpec spec;
  final double size;

  /// The person this face belongs to. Becomes the Semantics label.
  final String? name;

  final AvatarKind kind;
  final int coat;

  /// The sky behind the face. Defaults to the current village's — a face
  /// belongs to the room it is in. Pass an empty list for no sky.
  final List<Color>? sky;

  const Avatar({
    super.key,
    required this.spec,
    required this.size,
    this.name,
    this.kind = AvatarKind.person,
    this.coat = 0,
    this.sky,
  });

  @override
  Widget build(BuildContext context) {
    final scene = context.scene;
    final resolvedSky = sky ?? _defaultSky(scene);

    final label = switch (kind) {
      AvatarKind.person => name,
      AvatarKind.dog => name == null ? 'Dog' : '$name, dog',
      AvatarKind.cat => name == null ? 'Cat' : '$name, cat',
      AvatarKind.baby => name == null ? 'Baby' : '$name, baby',
    };

    return Semantics(
      label: label,
      image: true,
      excludeSemantics: true,
      child: ClipRRect(
        borderRadius: TahanRadius.pillAll,
        child: SizedBox(
          width: size,
          height: size,
          child: CustomPaint(
            painter: _CachedAvatarPainter(
              key: _AvatarKey(
                spec,
                size,
                kind,
                coat,
                Object.hashAll(resolvedSky),
              ),
              painter: AvatarPainter(
                spec: spec,
                kind: kind,
                coat: coat,
                background: resolvedSky,
              ),
            ),
            size: Size(size, size),
          ),
        ),
      ),
    );
  }

  /// A two-stop wash pulled from the village's own palette, so the face sits
  /// on the same sky the scene does without needing the full scene painter.
  static List<Color> _defaultSky(VillageScene scene) => [
        scene.accent.s300,
        scene.accent2.s200,
      ];
}

class _CachedAvatarPainter extends CustomPainter {
  final _AvatarKey key;
  final AvatarPainter painter;

  const _CachedAvatarPainter({required this.key, required this.painter});

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawPicture(_AvatarPictureCache.get(key, size, painter));
  }

  @override
  bool shouldRepaint(covariant _CachedAvatarPainter old) => old.key != key;
}
