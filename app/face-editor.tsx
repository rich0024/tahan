// "Change my face" — the face editor is T1.8. Until it lands, this says so.

import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SignedIn, useUser } from '../src/auth/SessionProvider.tsx';
import { BackButton } from '../src/components/BackButton.tsx';
import { Button, Screen, T } from '../src/components/themed.tsx';
import { AvatarSize } from '../src/paint/avatarGeometry.ts';
import { Avatar } from '../src/widgets/Avatar.tsx';

export default function FaceEditor() {
  return (
    <SignedIn>
      <Editor />
    </SignedIn>
  );
}

function Editor() {
  const user = useUser();
  return (
    <Screen>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18, alignItems: 'flex-start' }}>
        <BackButton onPress={() => router.back()} />
        <Avatar spec={user.avatar} size={AvatarSize.me} name="Your face" />
        <T variant="screenTitleSmall" accessibilityRole="header">The face editor comes next</T>
        <T>
          Skin, hair, eyes, clothes, glasses and the rest, with your face large above them — it's the
          next piece being built. For now, Surprise me picks a new face.
        </T>
        <Button label="Back" kind="outlined" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
