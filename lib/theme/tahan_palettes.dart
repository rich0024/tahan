// Tahan — scene palettes and the avatar kit.
// Generated from the design prototype. Values are exact; do not adjust by eye.

import 'dart:ui';

enum Drift { fireflies, leaves, breeze, dust, rain, snow, petals }

class ScenePalette {
  final String key;
  final String name;
  final Color accent;
  final Color accent2;
  final Color bg;
  final Color surface;
  final bool dark; // dark sky -> light ink in the header
  final Drift drift;

  const ScenePalette({
    required this.key,
    required this.name,
    required this.accent,
    required this.accent2,
    required this.bg,
    required this.surface,
    required this.dark,
    required this.drift,
  });
}

const Color tahanInk = Color(0xFF201E1D);

const List<ScenePalette> tahanScenes = [
  ScenePalette(
    key: 'night', name: 'Night sky',
    accent: Color(0xFFC67139), accent2: Color(0xFF7A8A5E),
    bg: Color(0xFFF5EAD8), surface: Color(0xFFEBDDC5),
    dark: true, drift: Drift.fireflies,
  ),
  ScenePalette(
    key: 'forest', name: 'Forest',
    accent: Color(0xFF6F7F52), accent2: Color(0xFFB06A3C),
    bg: Color(0xFFF3EFDD), surface: Color(0xFFE5E5C9),
    dark: false, drift: Drift.leaves,
  ),
  ScenePalette(
    key: 'tropical', name: 'Tropical',
    accent: Color(0xFFD9663F), accent2: Color(0xFF3F8A7A),
    bg: Color(0xFFFBF0DD), surface: Color(0xFFF3DFC4),
    dark: false, drift: Drift.breeze,
  ),
  ScenePalette(
    key: 'desert', name: 'Desert',
    accent: Color(0xFFC98A3C), accent2: Color(0xFF9C5A4A),
    bg: Color(0xFFF8ECD8), surface: Color(0xFFEFDCBA),
    dark: false, drift: Drift.dust,
  ),
  ScenePalette(
    key: 'terrace', name: 'Rice terraces',
    accent: Color(0xFFB0813F), accent2: Color(0xFF5D8A6B),
    bg: Color(0xFFF4F0E0), surface: Color(0xFFE5E5CD),
    dark: false, drift: Drift.rain,
  ),
  ScenePalette(
    key: 'savanna', name: 'Savanna',
    accent: Color(0xFFC9662E), accent2: Color(0xFF8A7A3E),
    bg: Color(0xFFF7ECD4), surface: Color(0xFFEEDDB6),
    dark: false, drift: Drift.dust,
  ),
  ScenePalette(
    key: 'coast', name: 'Coast',
    accent: Color(0xFF3F6F8A), accent2: Color(0xFFC9834A),
    bg: Color(0xFFF4F1E6), surface: Color(0xFFE4E3D2),
    dark: false, drift: Drift.breeze,
  ),
  ScenePalette(
    key: 'winter', name: 'Winter',
    accent: Color(0xFF6F7F9A), accent2: Color(0xFF8A6F5A),
    bg: Color(0xFFF1F1EC), surface: Color(0xFFE2E2DA),
    dark: false, drift: Drift.snow,
  ),
  ScenePalette(
    key: 'blossom', name: 'Blossom',
    accent: Color(0xFFC96B7A), accent2: Color(0xFF7A8A5E),
    bg: Color(0xFFF9EEE6), surface: Color(0xFFF0DBD2),
    dark: false, drift: Drift.petals,
  ),
];

/// Fixed palette for onboarding — there is no village yet, so there is no scene.
class TahanEvening {
  static const List<Color> skyStops = [
    Color(0xFF26241F), Color(0xFF4A3C2E), Color(0xFFA85F31), Color(0xFFE0975C),
  ];
  static const Color cream = Color(0xFFF7ECD9);
  static const Color lampLight = Color(0xFFF6D9A0);
  static const Color doorLight = Color(0xFFF0BD72);
}

/// The avatar kit. Six integers per avatar; these are the only colours.
class AvatarKit {
  static const List<Color> skins = [
    Color(0xFFF4D3AE), Color(0xFFE6B98C), Color(0xFFCF9463),
    Color(0xFFA86E44), Color(0xFF7D4E2D),
  ];
  static const List<Color> hairColors = [
    Color(0xFF2E2318), Color(0xFF5A3A22), Color(0xFF8A6A3A),
    Color(0xFFC2A06A), Color(0xFFC9C2B8),
  ];
  static const List<Color> clothes = [
    Color(0xFFC67139), Color(0xFF7A8A5E), Color(0xFF3F6F8A),
    Color(0xFFC96B7A), Color(0xFFB0813F),
  ];
  static const List<String> hairNames = [
    'Short', 'Long', 'Bun', 'Curls', 'Wrap', 'Braids', 'Bald', 'Cap',
  ];
  static const List<String> glassesNames = ['None', 'Round', 'Square', 'Readers'];
  static const List<String> faceNames = ['None', 'Beard', 'Moustache', 'Stubble'];

  /// Companion coats — dog, cat. A companion carries the same six integers
  /// plus this one index. Belongs to the user, not a village.
  static const List<Color> coats = [
    Color(0xFFF2ECE2), Color(0xFFD6B48A), Color(0xFFA8764A),
    Color(0xFF6B5647), Color(0xFF3A3330),
  ];
}

class AvatarSpec {
  final int skin;      // 0-4
  final int hairColor; // 0-4
  final int top;       // 0-4
  final int hair;      // 0-7
  final int glasses;   // 0-3
  final int face;      // 0-3
  const AvatarSpec({
    this.skin = 0, this.hairColor = 0, this.top = 0,
    this.hair = 0, this.glasses = 0, this.face = 0,
  });

  AvatarSpec copyWith({
    int? skin, int? hairColor, int? top, int? hair, int? glasses, int? face,
  }) =>
      AvatarSpec(
        skin: skin ?? this.skin,
        hairColor: hairColor ?? this.hairColor,
        top: top ?? this.top,
        hair: hair ?? this.hair,
        glasses: glasses ?? this.glasses,
        face: face ?? this.face,
      );

  /// Six ints, and nothing else, is the whole of an avatar. This is the shape
  /// that goes into `/users/{uid}` — there is no image, no file, no upload.
  Map<String, Object?> toMap() => {
        'skin': skin, 'hairColor': hairColor, 'top': top,
        'hair': hair, 'glasses': glasses, 'face': face,
      };

  factory AvatarSpec.fromMap(Map<String, Object?> map) => AvatarSpec(
        skin: (map['skin'] as num?)?.toInt() ?? 0,
        hairColor: (map['hairColor'] as num?)?.toInt() ?? 0,
        top: (map['top'] as num?)?.toInt() ?? 0,
        hair: (map['hair'] as num?)?.toInt() ?? 0,
        glasses: (map['glasses'] as num?)?.toInt() ?? 0,
        face: (map['face'] as num?)?.toInt() ?? 0,
      );

  @override
  bool operator ==(Object other) =>
      other is AvatarSpec &&
      other.skin == skin &&
      other.hairColor == hairColor &&
      other.top == top &&
      other.hair == hair &&
      other.glasses == glasses &&
      other.face == face;

  @override
  int get hashCode => Object.hash(skin, hairColor, top, hair, glasses, face);

  @override
  String toString() =>
      'AvatarSpec($skin,$hairColor,$top,$hair,$glasses,$face)';
}
