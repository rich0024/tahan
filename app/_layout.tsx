// Root layout: fonts, the session, the splash hold, the scene, the village.
//
// The splash stays up until Caprasimo and Figtree are loaded and the session
// knows whether someone is signed in, so first paint is never in a fallback
// font and never flashes the sign-in screen at someone already signed in. Both are bundled into the app binary by
// @expo-google-fonts — nothing is fetched at runtime.

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import { Figtree_400Regular, Figtree_600SemiBold } from '@expo-google-fonts/figtree';

import { SessionProvider, useSession } from '../src/auth/SessionProvider.tsx';
import { warmAvatarPaths } from '../src/paint/avatarGeometry.ts';
import { warmCompanionPaths } from '../src/paint/companionGeometry.ts';
import { SceneProvider } from '../src/theme/SceneProvider.tsx';
import { fonts } from '../src/theme/tokens.ts';
import { VillageProvider } from '../src/village/VillageProvider.tsx';

// Parse every authored path at launch. A bad path throws here, on the first
// run, not on whichever frame first draws it.
warmAvatarPaths();
warmCompanionPaths();

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      <Root />
    </SessionProvider>
  );
}

function Root() {
  const { session } = useSession();
  const [loaded, error] = useFonts({
    [fonts.display]: Caprasimo_400Regular,
    [fonts.body]: Figtree_400Regular,
    [fonts.bodySemibold]: Figtree_600SemiBold,
  });

  const fontsSettled = loaded || !!error;
  const sessionKnown = session.status !== 'loading';
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (fontsSettled && sessionKnown && !shown) {
      setShown(true);
      void SplashScreen.hideAsync();
    }
  }, [fontsSettled, sessionKnown, shown]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <SceneProvider>
        {/* The current village's scene themes everything below it. */}
        <VillageProvider>
          {/* Every scene's background is light, so the status bar is always dark. */}
          <StatusBar style="dark" />
          {/* No native header: the brief has the app draw its own chrome. */}
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
        </VillageProvider>
      </SceneProvider>
    </SafeAreaProvider>
  );
}
