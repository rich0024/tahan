// T3.2 — Start a village: a name and a scene. The person starting it becomes
// its admin, with a copy of their name and face on their membership.
//
// The scene is chosen live: every door you tap retints the whole app at once
// and the window at the top shows the village as it will look, its name
// written on the scene as you type. Back out without starting it and the app
// goes back to the scene it had.
//
// The prototype also asks "What's it for?" and for "A picture for the door".
// Neither is in the data model (design/backend.md), and the door picture
// would be the app's first hosted photo outside a post — both are left for
// the owner to decide.

import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { SignedIn, useSession } from '../src/auth/SessionProvider.tsx';
import { BackButton } from '../src/components/BackButton.tsx';
import { ScenePicker } from '../src/components/ScenePicker.tsx';
import { Button, Field, T } from '../src/components/themed.tsx';
import { MAX_VILLAGE_NAME, cleanVillageName, peopleCount } from '../src/data/village.ts';
import { HEADER_HEIGHT } from '../src/paint/window.ts';
import { sceneByKey, type SceneKey } from '../src/theme/palettes.ts';
import { useScene, useSceneColor } from '../src/theme/SceneProvider.tsx';
import { useVillage } from '../src/village/VillageProvider.tsx';
import { HeaderFade, NamePill, WindowBackdrop } from '../src/widgets/Window.tsx';

export default function NewVillageScreen() {
  return (
    <SignedIn>
      <NewVillage />
    </SignedIn>
  );
}

function NewVillage() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { startVillage } = useSession();
  const { choose } = useVillage();
  const { palette, setPalette, colors } = useScene();

  const [name, setName] = useState('');
  const [scene, setScene] = useState<SceneKey>(palette.key);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const clean = cleanVillageName(name);

  // Leaving without starting it puts the app back in the scene it had.
  const before = useRef(palette);
  const started = useRef(false);
  const latest = useRef(palette);
  latest.current = palette;
  useEffect(() => () => {
    if (!started.current && latest.current.key !== before.current.key) setPalette(before.current);
  }, [setPalette]);

  const pick = (key: SceneKey) => {
    setScene(key);
    setPalette(sceneByKey(key));
  };

  const start = async () => {
    if (!clean || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const id = await startVillage(clean, scene);
      started.current = true;
      choose(id);
      router.replace('/village');
    } catch (e) {
      console.warn('Tahan: starting a village failed', e);
      setFailed(true);
      setBusy(false);
    }
  };

  const still = useSharedValue(0);
  const bg = useSceneColor('bg');
  const backdrop = useAnimatedStyle(() => ({ backgroundColor: bg.value }));

  return (
    <Animated.View style={[{ flex: 1 }, backdrop]}>
      <StatusBar style={palette.dark ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          {/* The village as it will look: its scene, its name on it. */}
          <View style={{ height: HEADER_HEIGHT, overflow: 'hidden' }}>
            <WindowBackdrop scroll={still} width={width} height={height} />
            <View style={{ flex: 1, paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 18 }}>
              <BackButton onDark icon="close" label="Don't start a village" onPress={() => router.back()} />
              <View style={{ flex: 1 }} />
              <NamePill name={clean || 'Your village'} line={`${sceneByKey(scene).name} · ${peopleCount(1)}`} />
            </View>
            <HeaderFade width={width} bottom={HEADER_HEIGHT} />
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 18, gap: 6 }}>
            <T variant="screenTitleSmall" accessibilityRole="header">Start a village</T>
            <T color="inkMuted">Private from the first second. Nobody sees it until you hand them the key.</T>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 22, gap: 8 }}>
            <T variant="rowTitle" nativeID="village-name-label">What do you call each other?</T>
            <Field
              value={name}
              onChangeText={setName}
              onSubmitEditing={() => void start()}
              placeholder="The Gutiérrez Family"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={MAX_VILLAGE_NAME + 10}
              returnKeyType="done"
              accessibilityLabel="What do you call each other?"
              accessibilityHint="The village's name. Only the people in it ever see it."
              style={{ borderColor: colors.accent }}
            />
          </View>

          <View style={{ paddingTop: 24, gap: 10 }}>
            <T variant="rowTitle" style={{ paddingHorizontal: 24 }}>Pick the village's scene — it sets the colours too</T>
            <ScenePicker value={scene} onChange={pick} label="The village's scene" />
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 22, gap: 10 }}>
            <Button label={busy ? 'Starting…' : 'Start the village'} disabled={!clean || busy} onPress={() => void start()} />
            {failed && (
              <T variant="meta" color="accent700" accessibilityLiveRegion="polite">
                That didn't work. Nothing was started — try again.
              </T>
            )}
            <T variant="meta" color="inkMuted">
              You'll be its admin. Inviting people comes next.
            </T>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}
