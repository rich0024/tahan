// The throwaway review screen for milestone 1.
//
// The screen the tickets ask you to look at: T1.2 wants headings in Caprasimo,
// body in Figtree, and a palette swap that retints everything; T1.4 wants a
// grid of faces at 26, 44 and 96 with every combination legible; T1.5 wants
// two hundred avatars scrolling smoothly.
//
// Delete it once milestone 2 has a real feed.

import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { Button, Card, Chip, Screen, T, Wrap } from '../src/components/themed.tsx';
import { AvatarSize, type AvatarKind } from '../src/paint/avatarGeometry.ts';
import { makeRamp, rampSteps } from '../src/theme/oklch.ts';
import { AvatarKit, avatarSpec, specForIndex, tahanScenes } from '../src/theme/palettes.ts';
import { useScene } from '../src/theme/SceneProvider.tsx';
import { radius } from '../src/theme/tokens.ts';
import { Avatar } from '../src/widgets/Avatar.tsx';

export default function ReviewScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 64, gap: 32 }}>
        <View style={{ gap: 4 }}>
          <T variant="wordmark">Tahan</T>
          <T>Milestone 1 review — theme, painters, cache.</T>
        </View>

        <Section title="The nine scenes">
          <SceneSwitcher />
          <T variant="meta" color="inkMuted">
            Tap one. The screen retints over 420ms — background, cards, buttons, chips and the
            faces' sky — with no flash of the old accent.
          </T>
        </Section>

        <Section title="Type">
          <Card style={{ gap: 6 }}>
            <T variant="kicker">Kicker</T>
            <T variant="screenTitle">Screen title</T>
            <T variant="sectionHeading">Section heading</T>
            <T variant="rowTitle">Row title</T>
            <T>
              Body copy in Figtree. Tagalog tahan: to find solace; tahanan: home. Headings are
              Caprasimo and nothing else is.
            </T>
            <T variant="meta" color="inkMuted">Secondary and meta</T>
          </Card>
          <T variant="meta" color="inkMuted">
            Set the phone to its largest text size and come back: nothing here is capped.
          </T>
        </Section>

        <Section title="Ramps">
          <Ramps />
        </Section>

        <Section title="Controls">
          <Wrap gap={12}>
            <Button label="I'm coming" />
            <Button label="Can't this time" kind="outlined" />
            <Button label="Who sees me?" kind="text" />
          </Wrap>
        </Section>

        <Section title="Faces — 24 specs">
          {[AvatarSize.me, AvatarSize.header, AvatarSize.feedRow].map((size) => (
            <View key={size} style={{ gap: 8 }}>
              <T variant="kicker">{`${size}pt`}</T>
              <Wrap>
                {Array.from({ length: 24 }, (_, i) => (
                  <Avatar key={i} spec={specForIndex(i)} size={size} name={`Face ${i}`} />
                ))}
              </Wrap>
            </View>
          ))}
        </Section>

        <Section title="Every hairstyle">
          <Wrap gap={14}>
            {AvatarKit.hairNames.map((name, hair) => (
              <Labelled key={name} label={name}>
                <Avatar spec={avatarSpec({ skin: 1, hairColor: hair % 5, top: hair % 5, hair })} size={AvatarSize.me} name={name} />
              </Labelled>
            ))}
          </Wrap>
        </Section>

        <Section title="Glasses and facial hair">
          <Wrap gap={14}>
            {[0, 1, 2, 3].flatMap((glasses) =>
              [0, 1, 2, 3].map((face) => {
                const label = `${AvatarKit.glassesNames[glasses]} · ${AvatarKit.faceNames[face]}`;
                return (
                  <Labelled key={label} label={label}>
                    <Avatar
                      spec={avatarSpec({ skin: (glasses + face) % 5, hairColor: 4 - glasses, top: 1, glasses, face })}
                      size={AvatarSize.me}
                      name={label}
                    />
                  </Labelled>
                );
              }),
            )}
          </Wrap>
        </Section>

        <Section title="Companions">
          <Wrap gap={14}>
            {(['dog', 'cat', 'baby'] as AvatarKind[]).flatMap((kind) =>
              [0, 2, 4].map((coat) => (
                <Avatar
                  key={`${kind}${coat}`}
                  spec={avatarSpec({ skin: 2, hairColor: 1, top: coat })}
                  size={AvatarSize.me}
                  kind={kind}
                  coat={coat}
                />
              )),
            )}
          </Wrap>
        </Section>

        <Button label="200 avatars, scroll test" onPress={() => router.push('/scroll-test')} />
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <T variant="sectionHeading" accessibilityRole="header">{title}</T>
      {children}
    </View>
  );
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      {children}
      <T variant="metaSmall" color="inkMuted" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {label}
      </T>
    </View>
  );
}

function SceneSwitcher() {
  const { palette, setPalette } = useScene();
  return (
    <Wrap>
      {tahanScenes.map((p) => (
        <Chip key={p.key} label={p.name} selected={p.key === palette.key} onPress={() => setPalette(p)} />
      ))}
    </Wrap>
  );
}

function Ramps() {
  const { palette } = useScene();
  return (
    <View style={{ gap: 8 }}>
      {[
        ['accent', palette.accent],
        ['accent-2', palette.accent2],
      ].map(([name, base]) => {
        const ramp = makeRamp(base);
        return (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <T variant="metaSmall" style={{ width: 64 }}>{name}</T>
            <View style={{ flex: 1, flexDirection: 'row', height: 36, borderRadius: radius.container, overflow: 'hidden' }}>
              {rampSteps.map((step) => (
                <View key={step} style={{ flex: 1, backgroundColor: ramp[step] }} />
              ))}
            </View>
          </View>
        );
      })}
      <T variant="meta" color="inkMuted">
        Generated in OKLCH on one shared lightness curve. 500 is the token itself, untouched.
      </T>
    </View>
  );
}
