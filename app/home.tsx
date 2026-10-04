// Signed in. A stand-in home until the onboarding (T1.7) and the feed exist:
// your first face, drawn from your user document, and a way out.

import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { SignedIn, useSession, useUser } from '../src/auth/SessionProvider.tsx';
import { PreviewNote } from '../src/components/PreviewNote.tsx';
import { Button, Card, Screen, T } from '../src/components/themed.tsx';
import { AvatarSize } from '../src/paint/avatarGeometry.ts';
import { Avatar } from '../src/widgets/Avatar.tsx';

export default function HomeScreen() {
  return (
    <SignedIn>
      <Home />
    </SignedIn>
  );
}

function Home() {
  const user = useUser();
  const { signOut } = useSession();
  const name = user.displayName || 'You';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48, gap: 20 }}>
        <T variant="wordmark">Tahan</T>

        <View style={{ alignItems: 'center', gap: 12 }}>
          <Avatar spec={user.avatar} size={AvatarSize.editor} name={name} />
          <T variant="sectionHeading">{user.displayName || "You're in."}</T>
        </View>

        <Card style={{ gap: 6 }}>
          <T variant="rowTitle">This is your first face</T>
          <T variant="bodyTight">
            Picked for you when you first signed in. Choosing a name and changing your face come next.
          </T>
        </Card>

        <PreviewNote />

        <Button label="Milestone 1 review" kind="outlined" onPress={() => router.push('/review')} />
        <Button label="Sign out" kind="text" onPress={() => void signOut()} />
      </ScrollView>
    </Screen>
  );
}
