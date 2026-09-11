// Tahan — the app shell.
//
// One job at this stage: hold the current scene and hand its theme to
// MaterialApp, so that changing village or scene retints the entire app —
// chrome included — over 420ms with no flash of the previous accent.
//
// MaterialApp does the animating itself when given a duration and a curve, so
// there is no second AnimatedTheme and no chance of the chrome and the body
// retinting on different clocks.

import 'package:flutter/material.dart';

import 'screens/debug_gallery.dart';
import 'theme/scene_extension.dart';
import 'theme/tahan_palettes.dart';
import 'theme/village_theme.dart';

/// Changes the current scene. Reached with `SceneController.of(context)`.
class SceneController extends InheritedWidget {
  final ScenePalette palette;
  final ValueChanged<ScenePalette> setPalette;

  const SceneController({
    super.key,
    required this.palette,
    required this.setPalette,
    required super.child,
  });

  static SceneController of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<SceneController>()!;

  @override
  bool updateShouldNotify(SceneController old) => old.palette != palette;
}

class TahanApp extends StatefulWidget {
  const TahanApp({super.key});

  @override
  State<TahanApp> createState() => _TahanAppState();
}

class _TahanAppState extends State<TahanApp> {
  // First village is the owner's own family; night sky is its scene.
  ScenePalette _palette = tahanScenes.first;

  @override
  Widget build(BuildContext context) {
    return SceneController(
      palette: _palette,
      setPalette: (p) => setState(() => _palette = p),
      child: MaterialApp(
        title: 'Tahan',
        debugShowCheckedModeBanner: false,
        theme: villageTheme(_palette),
        // The retint.
        themeAnimationDuration: kSceneRetintDuration,
        themeAnimationCurve: kSceneRetintCurve,
        // textScaler is deliberately NOT capped or clamped anywhere in this
        // app. Every screen is laid out to survive 150%: rows go vertical,
        // reaction rows collapse, hit targets stay at 56. If a screen breaks
        // at large text, fix the screen.
        home: const DebugGalleryScreen(),
      ),
    );
  }
}
