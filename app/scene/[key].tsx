// One scene, full screen — for checking T2.2 on a short phone and a tall one.

import { useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../../src/components/BackButton.tsx';
import { Card, T } from '../../src/components/themed.tsx';
import { sceneByKey, tahanScenes, type SceneKey } from '../../src/theme/palettes.ts';
import { SceneBackdrop } from '../../src/widgets/SceneBackdrop.tsx';

export default function FullScene() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scene = (tahanScenes.find((s) => s.key === key)?.key ?? 'night') as SceneKey;
  const { name, dark } = sceneByKey(scene);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <SceneBackdrop scene={scene} width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }} />
      <BackButton onDark onPress={() => router.back()} style={{ position: 'absolute', top: insets.top + 8, left: 16 }} />
      <Card style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16, gap: 4 }}>
        <T variant="sectionHeading">{name}</T>
        <T variant="meta" color="inkMuted">{Math.round(width)} × {Math.round(height)}pt</T>
      </Card>
    </View>
  );
}
