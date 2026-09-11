// Tahan — the throwaway review screen for milestone 1.
//
// This is the screen the tickets ask you to look at: T1.2 wants headings in
// Caprasimo and body in Figtree with the palette swap retinting everything,
// T1.4 wants a grid of specs at 26, 44 and 96 with every combination legible,
// T1.5 wants two hundred avatars scrolling at 60fps.
//
// Delete it once milestone 2 has a real feed.

import 'package:flutter/material.dart';

import '../app.dart';
import '../paint/avatar_painter.dart';
import '../theme/oklch.dart';
import '../theme/scene_extension.dart';
import '../theme/tahan_palettes.dart';
import '../theme/village_theme.dart';
import '../widgets/avatar.dart';

/// A stable spec for index [i].
///
/// Deliberately not Random(): the grid has to look the same on every rebuild,
/// or "that combination was wrong" is not a reproducible report.
AvatarSpec specFor(int i) {
  final h = 0x9E3779B1 * (i + 1);
  int nibble(int shift, int mod) => (h >> shift & 0xFF) % mod;
  return AvatarSpec(
    skin: nibble(0, 5),
    hairColor: nibble(5, 5),
    top: nibble(10, 5),
    hair: nibble(15, 8),
    glasses: nibble(20, 4),
    face: nibble(24, 4),
  );
}

class DebugGalleryScreen extends StatelessWidget {
  const DebugGalleryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scene = context.scene;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 48),
          children: [
            Text('Tahan', style: TahanText.wordmark),
            const SizedBox(height: 4),
            Text(
              'Milestone 1 review — theme, painters, cache.',
              style: TahanText.body,
            ),
            const SizedBox(height: 28),

            _Heading('The nine scenes'),
            const SizedBox(height: 12),
            const _SceneSwitcher(),
            const SizedBox(height: 8),
            Text(
              'Tap one. The whole screen retints over 420ms — background, '
              'cards, buttons, chips and the avatars\' sky.',
              style: TahanText.meta,
            ),
            const SizedBox(height: 32),

            _Heading('Type'),
            const SizedBox(height: 12),
            _Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('KICKER', style: TahanText.kicker),
                  const SizedBox(height: 8),
                  Text('Screen title', style: TahanText.screenTitle),
                  const SizedBox(height: 4),
                  Text('Section heading', style: TahanText.sectionHeading),
                  const SizedBox(height: 10),
                  Text('Row title', style: TahanText.rowTitle),
                  const SizedBox(height: 4),
                  Text(
                    'Body copy in Figtree. Tagalog tahan: to find solace; '
                    'tahanan: home. Headings are Caprasimo and nothing else '
                    'is.',
                    style: TahanText.body,
                  ),
                  const SizedBox(height: 4),
                  Text('Secondary and meta', style: TahanText.meta),
                ],
              ),
            ),
            const SizedBox(height: 32),

            _Heading('Ramps'),
            const SizedBox(height: 12),
            _RampStrip(label: 'accent', ramp: scene.accent),
            const SizedBox(height: 8),
            _RampStrip(label: 'accent-2', ramp: scene.accent2),
            const SizedBox(height: 8),
            Text(
              'Generated in OKLCH on a shared lightness curve. 500 is the '
              'token itself, untouched.',
              style: TahanText.meta,
            ),
            const SizedBox(height: 32),

            _Heading('Controls'),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                FilledButton(onPressed: () {}, child: const Text('I\'m coming')),
                OutlinedButton(
                  onPressed: () {},
                  child: const Text('Can\'t this time'),
                ),
                TextButton(onPressed: () {}, child: const Text('Who sees me?')),
                const Chip(label: Text('to eat')),
              ],
            ),
            const SizedBox(height: 32),

            _Heading('Faces — 24 specs'),
            const SizedBox(height: 12),
            const _AvatarGrid(),
            const SizedBox(height: 32),

            _Heading('Every hairstyle'),
            const SizedBox(height: 12),
            const _HairRow(),
            const SizedBox(height: 32),

            _Heading('Glasses and facial hair'),
            const SizedBox(height: 12),
            const _AccessoryRow(),
            const SizedBox(height: 32),

            _Heading('Companions'),
            const SizedBox(height: 12),
            const _CompanionRow(),
            const SizedBox(height: 32),

            FilledButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const _ScrollTestScreen()),
              ),
              child: const Text('200 avatars, scroll test'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Heading extends StatelessWidget {
  final String text;
  const _Heading(this.text);

  @override
  Widget build(BuildContext context) =>
      Text(text, style: TahanText.sectionHeading);
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: context.scene.surface,
          borderRadius: TahanRadius.containerAll,
        ),
        child: child,
      );
}

class _SceneSwitcher extends StatelessWidget {
  const _SceneSwitcher();

  @override
  Widget build(BuildContext context) {
    final controller = SceneController.of(context);
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (final palette in tahanScenes)
          ChoiceChip(
            label: Text(palette.name),
            selected: palette.key == controller.palette.key,
            onSelected: (_) => controller.setPalette(palette),
          ),
      ],
    );
  }
}

class _RampStrip extends StatelessWidget {
  final String label;
  final ColorRamp ramp;

  const _RampStrip({required this.label, required this.ramp});

  @override
  Widget build(BuildContext context) => Row(
        children: [
          SizedBox(width: 68, child: Text(label, style: TahanText.metaSmall)),
          Expanded(
            child: ClipRRect(
              borderRadius: TahanRadius.containerAll,
              child: Row(
                children: [
                  for (final step in rampSteps)
                    Expanded(
                      child: Container(height: 36, color: ramp.shade(step)),
                    ),
                ],
              ),
            ),
          ),
        ],
      );
}

class _AvatarGrid extends StatelessWidget {
  const _AvatarGrid();

  @override
  Widget build(BuildContext context) => Column(
        children: [
          for (final size in [
            AvatarSize.me,
            AvatarSize.header,
            AvatarSize.feedRow,
          ]) ...[
            Align(
              alignment: Alignment.centerLeft,
              child: Text('${size.toInt()}px', style: TahanText.kicker),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                for (var i = 0; i < 24; i++)
                  Avatar(spec: specFor(i), size: size, name: 'Face $i'),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ],
      );
}

class _HairRow extends StatelessWidget {
  const _HairRow();

  @override
  Widget build(BuildContext context) => Wrap(
        spacing: 14,
        runSpacing: 14,
        children: [
          for (var hair = 0; hair < 8; hair++)
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Avatar(
                  spec: AvatarSpec(skin: 1, hairColor: 0, top: hair % 5, hair: hair),
                  size: AvatarSize.me,
                  name: AvatarKit.hairNames[hair],
                ),
                const SizedBox(height: 6),
                Text(AvatarKit.hairNames[hair], style: TahanText.metaSmall),
              ],
            ),
        ],
      );
}

class _AccessoryRow extends StatelessWidget {
  const _AccessoryRow();

  @override
  Widget build(BuildContext context) => Wrap(
        spacing: 14,
        runSpacing: 14,
        children: [
          for (var glasses = 0; glasses < 4; glasses++)
            for (var face = 0; face < 4; face++)
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Avatar(
                    spec: AvatarSpec(
                      skin: 2,
                      hairColor: 1,
                      top: 1,
                      hair: 0,
                      glasses: glasses,
                      face: face,
                    ),
                    size: AvatarSize.me,
                    name: '${AvatarKit.glassesNames[glasses]}, '
                        '${AvatarKit.faceNames[face]}',
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${AvatarKit.glassesNames[glasses]} · '
                    '${AvatarKit.faceNames[face]}',
                    style: TahanText.metaSmall,
                  ),
                ],
              ),
        ],
      );
}

class _CompanionRow extends StatelessWidget {
  const _CompanionRow();

  @override
  Widget build(BuildContext context) => Wrap(
        spacing: 14,
        runSpacing: 14,
        children: [
          for (final kind in [AvatarKind.dog, AvatarKind.cat, AvatarKind.baby])
            for (var coat = 0; coat < 3; coat++)
              Avatar(
                spec: const AvatarSpec(skin: 1, hairColor: 0, top: 2),
                size: AvatarSize.me,
                kind: kind,
                coat: coat,
                name: kind.name,
              ),
        ],
      );
}

/// T1.5's definition of done. Run in profile mode with the performance overlay.
class _ScrollTestScreen extends StatelessWidget {
  const _ScrollTestScreen();

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('200 avatars')),
        body: ListView.builder(
          itemCount: 200,
          itemBuilder: (context, i) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
            child: Row(
              children: [
                Avatar(
                  spec: specFor(i),
                  size: AvatarSize.feedRow,
                  name: 'Face $i',
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text('Face $i', style: TahanText.rowTitle),
                ),
              ],
            ),
          ),
        ),
      );
}
