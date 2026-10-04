// Onboarding 4 of 4: your name and first face.
//
// The last step before any village, and deliberately the warmest. Nobody
// uploads a photograph: you tap Surprise me a couple of times, maybe adjust
// one thing, give the name your family knows you by, and come in.

import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cleanName, MAX_NAME, surpriseFace } from '../src/auth/onboarding.ts';
import { SignedIn, useSession, useUser } from '../src/auth/SessionProvider.tsx';
import { Button, Field, Screen, T } from '../src/components/themed.tsx';
import { useScene } from '../src/theme/SceneProvider.tsx';
import { FirstFace } from '../src/widgets/Evening.tsx';

const SKY = 340;

export default function FaceScreen() {
  return (
    <SignedIn>
      <Face />
    </SignedIn>
  );
}

function Face() {
  const user = useUser();
  const { updateUser, invite } = useSession();
  const { colors } = useScene();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(user.displayName);
  const [presses, setPresses] = useState(0);
  const [comingIn, setComingIn] = useState(false);
  const clean = cleanName(name);

  // Leave once the saved name has reached the session, so the start screen
  // sees someone who has finished onboarding.
  useEffect(() => {
    if (comingIn && user.displayName) router.replace('/');
  }, [comingIn, user.displayName]);

  function surprise() {
    const n = presses + 1;
    setPresses(n);
    updateUser({ avatar: surpriseFace(user.uid, n) });
  }

  function comeIn() {
    if (!clean) return;
    updateUser({ displayName: clean });
    setComingIn(true);
  }

  return (
    <Screen style={{ paddingTop: 0 }}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={clean ? `Your face, ${clean}` : 'Your face'}
          >
            <FirstFace spec={user.avatar} height={SKY} topInset={insets.top} fadeTo={colors.bg} />
          </View>

          <View style={{ paddingHorizontal: 24, gap: 14, marginTop: -12 }}>
            <View style={{ gap: 6 }}>
              <T variant="screenTitleSmall" accessibilityRole="header">And this is you</T>
              <T color="inkMuted">No photo needed — everyone in Tahan is drawn. You can change it any evening you like.</T>
            </View>

            <Field
              value={name}
              onChangeText={setName}
              onSubmitEditing={comeIn}
              placeholder="Your name"
              autoCapitalize="words"
              autoComplete="name-given"
              textContentType="givenName"
              maxLength={MAX_NAME + 10}
              returnKeyType="done"
              accessibilityLabel="Your name"
              accessibilityHint="The name your family knows you by."
              style={{ borderColor: colors.accent }}
            />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Button label="Change my face" kind="outlined" style={{ flexGrow: 1, flexBasis: 150 }} onPress={() => router.push('/face-editor')} />
              <Button label="Surprise me" kind="outlined" style={{ flexGrow: 1, flexBasis: 150 }} onPress={surprise} />
            </View>

            <Button label="Come in" disabled={!clean} onPress={comeIn} style={{ marginTop: 6 }} />

            {invite && (
              <T variant="meta" color="inkMuted" style={{ textAlign: 'center' }}>
                Your invitation is waiting. You'll see who's inside next.
              </T>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
