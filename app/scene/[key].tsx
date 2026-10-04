// One scene, full screen, as a room: the painting, the time-of-day wash and
// the scene's drift. For checking T2.2–T2.4 on a short phone and a tall one:
// force a part of the day, or turn Ambient motion off to see the drift go —
// entirely, not slowly.

import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';

import { BackButton } from '../../src/components/BackButton.tsx';
import { Card, Chip, T } from '../../src/components/themed.tsx';
import { dayPartName, dayParts, type DayPart } from '../../src/paint/wash.ts';
import { sceneByKey, tahanScenes, type SceneKey } from '../../src/theme/palettes.ts';
import { Room } from '../../src/widgets/Room.tsx';
import { useDayPart } from '../../src/widgets/useDayPart.ts';

export default function FullScene() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scene = (tahanScenes.find((s) => s.key === key)?.key ?? 'night') as SceneKey;
  const { name, dark, drift } = sceneByKey(scene);
  const [when, setWhen] = useState<DayPart | 'auto'>('auto');
  const [ambient, setAmbient] = useState(true);
  const clock = useDayPart('auto');
  const reduced = useReducedMotion();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Room scene={scene} width={width} height={height} dayPart={when} ambient={ambient} style={{ position: 'absolute', top: 0, left: 0 }} />
      <BackButton onDark onPress={() => router.back()} style={{ position: 'absolute', top: insets.top + 8, left: 16 }} />
      <Card style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16, gap: 10 }}>
        <View style={{ gap: 2 }}>
          <T variant="sectionHeading">{name}</T>
          <T variant="meta" color="inkMuted">
            {Math.round(width)} × {Math.round(height)}pt · drift: {drift}
            {reduced ? ' (off — the phone asks for reduced motion)' : ''}
          </T>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel="Time of day">
          <Chip label={`Clock (${dayPartName[clock]})`} selected={when === 'auto'} onPress={() => setWhen('auto')} />
          {dayParts.map((p) => <Chip key={p} label={dayPartName[p]} selected={when === p} onPress={() => setWhen(p)} />)}
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Chip label={ambient ? 'Ambient motion: on' : 'Ambient motion: off'} selected={ambient} onPress={() => setAmbient((a) => !a)} />
        </View>
      </Card>
    </View>
  );
}
