// The nine scenes as round doors, in a row that scrolls sideways. Each door
// is the scene's own painting; the chosen one wears a ring in its accent.
// Choosing one is the caller's to act on — starting a village retints the
// whole app as you choose (T3.2), the switcher will too (T3.6).

import { Image, Pressable, ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { tahanScenes, type SceneKey } from '../theme/palettes.ts';
import { useSceneColor } from '../theme/SceneProvider.tsx';
import { radius } from '../theme/tokens.ts';
import { sceneArtAsset } from '../widgets/SceneBackdrop.tsx';
import { T } from './themed.tsx';

const DOOR = 74;
const RING = 3;
const GAP = 3;
const OUTER = DOOR + 2 * (RING + GAP);

export function ScenePicker({ value, onChange, label = 'Scene' }: {
  value: SceneKey;
  onChange: (key: SceneKey) => void;
  label?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6, paddingHorizontal: 18, paddingVertical: 4 }}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      {tahanScenes.map((s) => (
        <Door key={s.key} sceneKey={s.key} name={s.name} selected={s.key === value} onPress={() => onChange(s.key)} />
      ))}
    </ScrollView>
  );
}

function Door({ sceneKey, name, selected, onPress }: {
  sceneKey: SceneKey; name: string; selected: boolean; onPress: () => void;
}) {
  const accent = useSceneColor('accent');
  const ring = useAnimatedStyle(() => ({ borderColor: selected ? accent.value : 'transparent' }));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={name}
      style={({ pressed }) => ({ width: OUTER + 8, alignItems: 'center', gap: 6, opacity: pressed ? 0.75 : 1 })}
    >
      <Animated.View style={[{ width: OUTER, height: OUTER, borderRadius: radius.pill, borderWidth: RING, padding: GAP }, ring]}>
        <View style={{ width: DOOR, height: DOOR, borderRadius: radius.pill, overflow: 'hidden' }}>
          <Image source={sceneArtAsset[sceneKey]} resizeMode="cover" style={{ width: DOOR, height: DOOR }} accessibilityIgnoresInvertColors />
        </View>
      </Animated.View>
      <T variant={selected ? 'rowTitleTight' : 'meta'} color={selected ? 'accent700' : 'ink'} style={{ textAlign: 'center' }}>
        {name}
      </T>
    </Pressable>
  );
}
