// The start. Sends each person to where they are in the app: the welcome,
// the next onboarding step, an invitation waiting for them, or the fork.
// The rules are src/auth/onboarding.ts.
//
// While the session is loading the splash screen is still up (see
// _layout.tsx), so this draws nothing in that state.

import { View } from 'react-native';
import { Redirect, type Href } from 'expo-router';

import { useSession } from '../src/auth/SessionProvider.tsx';
import { Button, Screen, T } from '../src/components/themed.tsx';

export default function Start() {
  const { session, signOut, start } = useSession();

  if (session.status === 'error') {
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
  if (!start) return <Screen />;
  return <Redirect href={start as Href} />;
}
