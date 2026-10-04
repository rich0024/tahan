// An invitation link: tahan://invite/<code>, or a web link ending in it.
//
// Signed out, it skips the welcome and goes straight to sign-in, holding the
// invitation; after the first face it comes back here. Signed in, this is
// where the invitation screen goes — the inviting village's own scene, who's
// inside, and Join. That's T3.4; the village behind a code doesn't exist
// until milestone 3, so for now this says so honestly.

import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { isInviteCode, isOnboarded } from '../../src/auth/onboarding.ts';
import { useSession } from '../../src/auth/SessionProvider.tsx';
import { Button, Card, Screen, T } from '../../src/components/themed.tsx';
import { useScene } from '../../src/theme/SceneProvider.tsx';
import { EveningBand } from '../../src/widgets/Evening.tsx';

export default function Invite() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { session, invite, setInvite } = useSession();
  const { colors } = useScene();
  const valid = typeof code === 'string' && isInviteCode(code);

  useEffect(() => {
    if (valid && invite !== code) setInvite(code);
  }, [valid, code, invite, setInvite]);

  if (!valid) {
    return (
      <Screen>
        <View style={{ padding: 24, gap: 16 }}>
          <T variant="screenTitle" accessibilityRole="header">That link doesn't look right</T>
          <T>It may have been cut short when it was copied. Ask whoever sent it to send it again.</T>
          <Button label="Go to the start" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }
  if (session.status === 'loading') return <Screen />;
  if (session.status !== 'signedIn') return <Redirect href="/phone" />;
  if (!isOnboarded(session.user)) return <Redirect href="/face" />;

  function notNow() {
    setInvite(null);
    router.replace('/');
  }

  return (
    <Screen style={{ paddingTop: 0 }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <EveningBand fadeTo={colors.bg} />
        <View style={{ paddingHorizontal: 24, gap: 16 }}>
          <T variant="kicker" color="accent700">An invitation</T>
          <T variant="screenTitle" accessibilityRole="header">You've been invited</T>
          <T>
            Seeing who's inside and joining them arrive with villages, in the next milestone. Keep
            the link, and open it again then.
          </T>
          <Card>
            <T variant="meta" color="inkMuted">Invitation {code}</T>
          </Card>
          <Button label="Not now" kind="outlined" onPress={notNow} />
        </View>
      </ScrollView>
    </Screen>
  );
}
