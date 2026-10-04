// Review screen for T2.1 and T2.2: the nine scenes at header height, painted
// or drawn, each with a way to see it full screen. Delete with the other review screens once
// the feed exists.

import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../src/components/BackButton.tsx';
import { Button, Chip, Screen, T } from '../src/components/themed.tsx';
import { SCENE_H, SCENE_W } from '../src/paint/scenes/index.ts';
import { tahanScenes } from '../src/theme/palettes.ts';
import { SceneBackdrop } from '../src/widgets/SceneBackdrop.tsx';

export default function Scenes() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const header = Math.round((width / SCENE_W) * SCENE_H);
  const [version, setVersion] = useState<'painted' | 'drawn'>('painted');

  return (
    <Screen>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40, gap: 22 }}>
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          <BackButton onPress={() => router.back()} />
          <T variant="screenTitle" accessibilityRole="header">The nine scenes</T>
          <T color="inkMuted">
            Each at header height ({header}pt on this phone) — scaled on width, never stretched. Open one
            full screen to see the ground carry on below it.
          </T>
          <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Version">
            <Chip label="Painted" selected={version === 'painted'} onPress={() => setVersion('painted')} />
            <Chip label="Drawn" selected={version === 'drawn'} onPress={() => setVersion('drawn')} />
          </View>
        </View>
        {tahanScenes.map((s) => (
          <View key={s.key} style={{ gap: 8 }}>
            <SceneBackdrop scene={s.key} width={width} height={header} version={version} />
            <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <T variant="sectionHeading">{s.name}</T>
              <Button
                label="Full screen"
                kind="outlined"
                onPress={() => router.push({ pathname: '/scene/[key]', params: { key: s.key } })}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
