// The village — where the app opens for anyone in one. The window onto its
// scene with its name on it; the feed arrives in milestone 4 (T4.1), and
// until then this is the village's first day: who's in it (you) and what
// comes next.
//
// It keeps the ways out the fork had — another village, your face, the
// review screens, sign out — until the Me tab (T4.1) takes them.

import { View, useWindowDimensions } from 'react-native';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { SignedIn, useSession, useUser } from '../src/auth/SessionProvider.tsx';
import { PreviewNote } from '../src/components/PreviewNote.tsx';
import { Button, Card, T } from '../src/components/themed.tsx';
import { villageLine } from '../src/data/village.ts';
import { AvatarSize } from '../src/paint/avatarGeometry.ts';
import { HEADER_HEIGHT } from '../src/paint/window.ts';
import { useScene } from '../src/theme/SceneProvider.tsx';
import { useVillage } from '../src/village/VillageProvider.tsx';
import { Avatar } from '../src/widgets/Avatar.tsx';
import { Glass, HeaderFade, NamePill, Veil, WindowBackdrop } from '../src/widgets/Window.tsx';

export default function VillageScreen() {
  return (
    <SignedIn>
      <Home />
    </SignedIn>
  );
}

function Home() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const { signOut } = useSession();
  const { village } = useVillage();
  const { palette, colors } = useScene();

  const scroll = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scroll.value = e.contentOffset.y;
  });

  // In no village (or the last one gone): back to the start, which is the fork.
  if (!user.villages.length) return <Redirect href="/" />;

  const founder = village?.createdBy === user.uid;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={palette.dark ? 'light' : 'dark'} />
      <WindowBackdrop scroll={scroll} width={width} height={height} />

      {/* The header: nothing in front of the scene but the village's name. */}
      <View style={{ height: HEADER_HEIGHT, paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 18, justifyContent: 'flex-end' }}>
        {village && <NamePill name={village.name} line={villageLine(village)} />}
      </View>
      <HeaderFade width={width} bottom={HEADER_HEIGHT} />

      <View style={{ flex: 1 }}>
        <Veil width={width} top={0} height={height - HEADER_HEIGHT} />
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 32, gap: 12 }}
        >
          <Card style={{ gap: 12 }}>
            <T variant="kicker" color="accent700">Day one</T>
            <T variant="sectionHeading">{village ? `${village.name} is yours.` : 'Your village'}</T>
            <T variant="bodyTight">
              It's private: nobody can see it or find it until you send them an invitation. Whoever
              you invite will open Tahan to this scene.
            </T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Avatar spec={user.avatar} size={AvatarSize.header} name={user.displayName} />
              <View style={{ flexShrink: 1 }}>
                <T variant="rowTitle">{user.displayName}</T>
                <T variant="meta" color="inkMuted">{founder ? 'Started this village · admin' : 'In this village'}</T>
              </View>
            </View>
          </Card>

          <Card style={{ gap: 10 }}>
            <T variant="sectionHeading">Invite your people</T>
            <T variant="bodyTight">
              A link that works once, per person. They land straight in the village.
            </T>
            <Button label="Invite people" disabled />
            <T variant="meta" color="inkMuted">Invitations come next.</T>
          </Card>

          <PreviewNote />

          <View style={{ gap: 4, marginTop: 8 }}>
            <Button label="Start another village" kind="text" onPress={() => router.push('/new-village')} />
            <Button label="Change my face" kind="text" onPress={() => router.push('/editor')} />
            <Button label="Milestone 1 review" kind="text" onPress={() => router.push('/review')} />
            <Button label="The nine scenes" kind="text" onPress={() => router.push('/scenes')} />
            <Button label="The window" kind="text" onPress={() => router.push('/window')} />
            <Button label="Sign out" kind="text" onPress={() => void signOut()} />
          </View>
        </Animated.ScrollView>
      </View>

      <Glass width={width} height={height} />
    </View>
  );
}
