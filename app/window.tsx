// Review screen for T2.5 and T2.6: the window over a long feed.
//
// T2.5 is done when scrolling a long list stays at 60fps on the oldest phone
// you support — scroll the two hundred dummy rows and watch the ridge line
// hold almost still while the cards pass (check in a release build; debug
// builds aren't representative). T2.6 is done when cycling all nine scenes
// shows no flash of the old accent and no unthemed widget — tap through the
// chips at the top of the feed.
//
// The real home screen (T4.1) is built from these same pieces.

import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { BackButton } from '../src/components/BackButton.tsx';
import { Button, Card, Chip, T } from '../src/components/themed.tsx';
import { AvatarSize } from '../src/paint/avatarGeometry.ts';
import { HEADER_HEIGHT, NAME_PILL_ALPHA, alphaColor } from '../src/paint/window.ts';
import { sampleFaces, tahanInk, tahanScenes } from '../src/theme/palettes.ts';
import { useScene } from '../src/theme/SceneProvider.tsx';
import { Avatar } from '../src/widgets/Avatar.tsx';
import { Glass, HeaderFade, Veil, WindowBackdrop } from '../src/widgets/Window.tsx';

const rows = Array.from({ length: 200 }, (_, i) => i);
const lines = [
  'Back from the lake, phone nearly dead', 'Who has the big pot?', 'She lost her first tooth!',
  'Thank you for the flowers', 'Sunday at ours — bring a chair', 'Found the sock. Kept the sock.',
];

export default function WindowReview() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { palette, setPalette, colors } = useScene();
  const scroll = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scroll.value = e.contentOffset.y;
  });
  const pill = alphaColor(tahanInk, NAME_PILL_ALPHA);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={palette.dark ? 'light' : 'dark'} />
      <WindowBackdrop scroll={scroll} width={width} height={height} />

      {/* The header: nothing in front of the scene but the village's name. */}
      <View style={{ height: HEADER_HEIGHT, paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 18 }}>
        <BackButton onDark onPress={() => router.back()} />
        <View style={{ flex: 1 }} />
        <View style={{ alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, backgroundColor: pill }}>
          <T variant="screenTitleSmall" style={{ fontSize: 25, lineHeight: 30, color: colors.bg }} accessibilityRole="header">
            The Gutiérrez Family
          </T>
          <T variant="metaSmall" style={{ color: colors.bg, opacity: 0.85 }}>{palette.name} · 12 people</T>
        </View>
      </View>
      <HeaderFade width={width} bottom={HEADER_HEIGHT} />

      {/* The feed, over the veil. */}
      <View style={{ flex: 1 }}>
        <Veil width={width} top={0} height={height - HEADER_HEIGHT} />
        <Animated.FlatList
          data={rows}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 32, gap: 12 }}
          ListHeaderComponent={
            <View style={{ gap: 10, marginBottom: 6 }}>
              <T variant="kicker" color="accent700">Try every scene</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel="Scene">
                {tahanScenes.map((s) => (
                  <Chip key={s.key} label={s.name} selected={palette.key === s.key} onPress={() => setPalette(s)} />
                ))}
              </View>
              <T variant="meta" color="inkMuted">
                Everything retints over 420ms — the scene, the cards, the chips, the veil. Scroll: the
                scene moves at a sixth of the feed's speed.
              </T>
            </View>
          }
          renderItem={({ item }) => {
            const { name, ...face } = sampleFaces[item % sampleFaces.length];
            return (
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                <Avatar spec={face} size={AvatarSize.statusRow} name={name} />
                <View style={{ flex: 1, gap: 2 }}>
                  <T variant="rowTitle">{name}</T>
                  <T variant="bodyTight">{lines[item % lines.length]}</T>
                </View>
              </Card>
            );
          }}
          ListFooterComponent={<Button label="Back" kind="text" onPress={() => router.back()} style={{ marginTop: 12 }} />}
        />
      </View>

      <Glass width={width} height={height} />
    </View>
  );
}
