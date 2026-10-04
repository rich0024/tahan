// Sign in, step one: the phone number.
//
// T1.6 makes it work; T1.7 gives it the evening band and the rest of the
// onboarding look. No password, no email — a number and a code.

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { formatPhone, signInError, toE164 } from '../src/auth/phone.ts';
import { useSession } from '../src/auth/SessionProvider.tsx';
import { PreviewNote } from '../src/components/PreviewNote.tsx';
import { Button, Card, Field, Screen, T } from '../src/components/themed.tsx';
import { useScene } from '../src/theme/SceneProvider.tsx';
import { hitTarget, radius } from '../src/theme/tokens.ts';

export default function PhoneScreen() {
  const { sendCode } = useSession();
  const { colors } = useScene();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phone = toE164(text);

  async function submit() {
    if (!phone || busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendCode(phone);
      router.push('/code');
    } catch (e) {
      setError(signInError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingBottom: 48, gap: 20 }}>
          <T variant="screenTitle" accessibilityRole="header">What's your number?</T>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <View
              accessible
              accessibilityLabel="Country code plus one"
              style={{
                minHeight: hitTarget, minWidth: hitTarget, paddingHorizontal: 18, borderRadius: radius.pill,
                backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <T variant="rowTitle" style={{ fontSize: 18 }}>+1</T>
            </View>
            <Field
              value={formatPhone(text)}
              onChangeText={setText}
              onSubmitEditing={() => void submit()}
              placeholder="(555) 555-0123"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              autoFocus
              returnKeyType="send"
              accessibilityLabel="Phone number"
              style={{ flexGrow: 1, flexBasis: 200 }}
            />
          </View>

          {error && <T variant="rowTitle" color="accent700" accessibilityLiveRegion="polite">{error}</T>}

          <Button label={busy ? 'Sending…' : 'Send me a code'} disabled={!phone || busy} onPress={() => void submit()} />

          <Card style={{ gap: 6 }}>
            <T variant="rowTitle">Just to sign you in</T>
            <T variant="bodyTight">
              Your number signs you in and does nothing else. Nobody in a village sees it, and it's
              never used to find your contacts.
            </T>
          </Card>

          <PreviewNote />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
