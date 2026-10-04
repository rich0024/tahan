// A round back button. Drawn at 40pt, reaching the 56pt hit target with
// hitSlop. `onDark` is for use over the evening artwork.

import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
// One file per icon: the package's index pulls in all of them.
import ChevronLeft from 'lucide-react-native/icons/chevron-left';

import { withAlpha } from '../theme/oklch.ts';
import { TahanEvening } from '../theme/palettes.ts';
import { useScene } from '../theme/SceneProvider.tsx';
import { hitTarget, radius } from '../theme/tokens.ts';

const SIZE = 40;
const slop = (hitTarget - SIZE) / 2;
const darkWash = withAlpha(TahanEvening.scrim, 0.4);

export function BackButton({ onPress, onDark = false, label = 'Back', style }: {
  onPress: () => void; onDark?: boolean; label?: string; style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useScene();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={slop}
      style={({ pressed }) => [
        {
          width: SIZE, height: SIZE, borderRadius: radius.pill,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: onDark ? darkWash : colors.accent100,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <ChevronLeft size={20} strokeWidth={2.75} color={onDark ? TahanEvening.cream : colors.ink} />
    </Pressable>
  );
}
