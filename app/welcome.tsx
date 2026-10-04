// Onboarding 1 of 4: the welcome.
//
// Evening, a house with the lights on, and two doors. Most people arrive
// holding an invitation, so that door is named first. Nothing here asks for
// anything yet.
//
// The brief's warning: cream type over the lit windows fails contrast unless
// the scrim behind the text is near-opaque. Here the text sits on a 94% scrim
// (cream on it is over 12:1, tested) and the artwork is placed so the house
// stands above the text block however large the text grows.

import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, T } from '../src/components/themed.tsx';
import { TahanEvening } from '../src/theme/palettes.ts';
import { ScrimEdge, WelcomeArt, scrimColor } from '../src/widgets/Evening.tsx';

const EDGE = 140;

export default function Welcome() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [textTop, setTextTop] = useState(height * 0.62);
  const cream = { color: TahanEvening.cream };

  return (
    <View style={{ flex: 1, backgroundColor: TahanEvening.scrim }}>
      <StatusBar style="light" />
      <WelcomeArt height={height} textTop={textTop} />
      <ScrollView
        bounces={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
      >
        <View onLayout={(e) => setTextTop(e.nativeEvent.layout.y + EDGE)}>
          <ScrimEdge height={EDGE} />
          <View
            style={{
              backgroundColor: scrimColor,
              paddingHorizontal: 26,
              paddingBottom: insets.bottom + 28,
              gap: 12,
            }}
          >
            <T variant="wordmark" accessibilityRole="header" style={cream}>Tahan</T>
            <T style={[cream, { fontSize: 15.5, lineHeight: 23, opacity: 0.92, marginBottom: 14 }]}>
              A quiet house for the people you'd call first. No feed to scroll, no strangers,
              nothing to keep up with.
            </T>
            <Button label="I have an invitation" onPress={() => router.push('/invitation')} />
            <Button label="Start on my own" kind="onDark" onPress={() => router.push('/phone')} />
            <T variant="metaSmall" style={[cream, { opacity: 0.7, textAlign: 'center', marginTop: 6 }]}>
              Your phone number, and nothing else.
            </T>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
