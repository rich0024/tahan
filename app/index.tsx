// The start. Sends a signed-out person to sign in and a signed-in one home.
//
// While the session is loading the splash screen is still up (see
// _layout.tsx), so this draws nothing in that state.

import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { useSession } from '../src/auth/SessionProvider.tsx';
import { Button, Screen, T } from '../src/components/themed.tsx';

export default function Start() {
  const { session, signOut } = useSession();

  switch (session.status) {
    case 'loading':
      return <Screen />;
    case 'signedOut':
      return <Redirect href="/phone" />;
    case 'signedIn':
      return <Redirect href="/home" />;
    case 'error':
      return (
        <Screen>
          <View style={{ padding: 24, gap: 16 }}>
            <T variant="screenTitle">Couldn't reach Tahan</T>
            <T>
              You're signed in, but your details didn't load. The first time on a phone needs a
              connection; after that, Tahan works offline.
            </T>
            <Button label="Try again" onPress={session.retry} />
            <Button label="Sign out" kind="text" onPress={() => void signOut()} />
          </View>
        </Screen>
      );
  }
}
