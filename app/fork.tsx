// The end of onboarding for someone who arrived without an invitation: start
// a village, or wait for one. No browse, no suggestions, no "find friends" —
// with nobody to invite, the honest answer is to ask for a link.
//
// Starting one opens app/new-village.tsx. Someone already in a village never
// lands here — the app opens on their village — so the review screens and
// sign-out are kept here and on the village screen alike.

import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SignedIn, useSession, useUser } from '../src/auth/SessionProvider.tsx';
import { PreviewNote } from '../src/components/PreviewNote.tsx';
import { Button, Card, Screen, T } from '../src/components/themed.tsx';
import { AvatarSize } from '../src/paint/avatarGeometry.ts';
import { Avatar } from '../src/widgets/Avatar.tsx';

export default function ForkScreen() {
  return (
    <SignedIn>
      <Fork />
    </SignedIn>
  );
}

function Fork() {
  const user = useUser();
  const { signOut } = useSession();

  return (
    <Screen>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Avatar spec={user.avatar} size={AvatarSize.me} name={user.displayName} />
          <T variant="screenTitle" accessibilityRole="header" style={{ flexShrink: 1 }}>
            Welcome, {user.displayName}.
          </T>
        </View>
        <T>Tahan is made of villages: a small, private group of the people you'd call first.</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Button label="Change my face" kind="outlined" style={{ flexGrow: 1, flexBasis: 150 }} onPress={() => router.push('/editor')} />
          <Button
            label={user.companion ? (user.companion.name || 'Your companion') : 'Add a companion'}
            kind="outlined"
            style={{ flexGrow: 1, flexBasis: 150 }}
            onPress={() => router.push({ pathname: '/editor', params: { mode: 'companion' } })}
          />
        </View>

        <Card style={{ gap: 10 }}>
          <T variant="sectionHeading">Start a village</T>
          <T variant="bodyTight">
            For your family, or your closest friends. You'll name it, choose its scene, and invite
            them with a link.
          </T>
          <Button label="Start a village" onPress={() => router.push('/new-village')} />
        </Card>

        <Card style={{ gap: 10 }}>
          <T variant="sectionHeading">Wait for an invitation</T>
          <T variant="bodyTight">
            If someone is setting one up, ask them to send you a link. When you tap it, Tahan opens
            straight to their village. There's nothing to search for here — that's on purpose.
          </T>
        </Card>

        <PreviewNote />

        <View style={{ gap: 4, marginTop: 8 }}>
          <Button label="Milestone 1 review" kind="text" onPress={() => router.push('/review')} />
          <Button label="The nine scenes" kind="text" onPress={() => router.push('/scenes')} />
          <Button label="The window" kind="text" onPress={() => router.push('/window')} />
          <Button label="Sign out" kind="text" onPress={() => void signOut()} />
        </View>
      </ScrollView>
    </Screen>
  );
}
