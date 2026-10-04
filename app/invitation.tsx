// "I have an invitation" — for someone who opened the app before the link.
//
// An invitation is a link, and tapping it opens Tahan straight to it
// (app/invite/[code].tsx). This screen says so, and takes a pasted link for
// anyone who'd rather copy it across.

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { parseInviteLink } from '../src/auth/onboarding.ts';
import { useSession } from '../src/auth/SessionProvider.tsx';
import { BackButton } from '../src/components/BackButton.tsx';
import { Button, Card, Field, Screen, T } from '../src/components/themed.tsx';

export default function InvitationHelp() {
  const { setInvite } = useSession();
  const [text, setText] = useState('');
  const code = parseInviteLink(text);
  const tried = text.trim().length > 0;

  function go() {
    if (!code) return;
    setInvite(code);
    router.push('/phone');
  }

  return (
    <Screen>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingBottom: 48, gap: 18 }}>
          <BackButton onPress={() => router.back()} />
          <T variant="screenTitle" accessibilityRole="header">Open your invitation</T>
          <T>
            Your invitation came as a link, in a text or an email. Tap it, and Tahan opens right to
            it — you'll sign in on the way.
          </T>

          <View style={{ gap: 10 }}>
            <T variant="rowTitle">Or paste the link here</T>
            <Field
              value={text}
              onChangeText={setText}
              onSubmitEditing={go}
              placeholder="https://…/invite/…"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              accessibilityLabel="Invitation link"
            />
            {tried && !code && (
              <T variant="rowTitle" color="accent700" accessibilityLiveRegion="polite">
                That doesn't look like a Tahan invitation link. Copy the whole link and try again.
              </T>
            )}
          </View>

          <Button label="Continue" disabled={!code} onPress={go} />

          <Card>
            <T variant="bodyTight">
              No link yet? Ask whoever invited you to send it again. Tahan can't look anyone up —
              an invitation is the only way into a village.
            </T>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
