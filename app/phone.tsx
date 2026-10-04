// Onboarding 2 of 4: the phone number.
//
// Evening stays overhead so signing in feels like the same place, not a
// form. The screen says what will happen before it happens, and what Tahan
// does not do with the number. No password, no email — a number and a code.

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LockKeyhole from 'lucide-react-native/icons/lock-keyhole';

import { formatPhone, signInError, toE164 } from '../src/auth/phone.ts';
import { useSession } from '../src/auth/SessionProvider.tsx';
import { BackButton } from '../src/components/BackButton.tsx';
import { PreviewNote } from '../src/components/PreviewNote.tsx';
import { Button, Field, Screen, T } from '../src/components/themed.tsx';
import { useScene } from '../src/theme/SceneProvider.tsx';
import { hitTarget, radius } from '../src/theme/tokens.ts';
import { EveningBand } from '../src/widgets/Evening.tsx';

const BAND = 236;

export default function PhoneScreen() {
  const { sendCode } = useSession();
  const { colors } = useScene();
  const insets = useSafeAreaInsets();
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
    <Screen style={{ paddingTop: 0 }}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}>
          <View style={{ height: BAND }}>
            <EveningBand height={BAND} fadeTo={colors.bg} />
            {router.canGoBack() && (
              <BackButton onDark onPress={() => router.back()} style={{ position: 'absolute', left: 20, top: insets.top + 8 }} />
            )}
          </View>

          <View style={{ paddingHorizontal: 24, gap: 16 }}>
            <View style={{ gap: 8 }}>
              <T variant="screenTitle" accessibilityRole="header">What's your number?</T>
              <T color="inkMuted">We'll text you a six-digit code. That's the whole sign-in — no password to forget.</T>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <View
                accessible
                accessibilityLabel="Country code plus one"
                style={{
                  minHeight: hitTarget, minWidth: hitTarget, paddingHorizontal: 18, borderRadius: radius.pill,
                  backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <T variant="rowTitle" style={{ fontSize: 17, lineHeight: 22 }}>+1</T>
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
                style={{ flexGrow: 1, flexBasis: 200, borderColor: colors.accent, fontSize: 19 }}
              />
            </View>

            {error && <T variant="rowTitle" color="accent700" accessibilityLiveRegion="polite">{error}</T>}

            <Button label={busy ? 'Sending…' : 'Send me a code'} disabled={!phone || busy} onPress={() => void submit()} />

            <View
              style={{
                backgroundColor: colors.accent2_100, borderRadius: radius.container, padding: 16,
                flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 6,
              }}
            >
              <View
                style={{
                  width: 30, height: 30, borderRadius: radius.pill, backgroundColor: colors.accent2_200,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <LockKeyhole size={16} strokeWidth={2.75} color={colors.accent2_700} />
              </View>
              <T variant="bodyTight" style={{ flex: 1 }}>
                Your number is how you sign in and nothing else. Nobody in a village can see it, and
                we never use it to find your contacts.
              </T>
            </View>

            <PreviewNote />
          </View>

          <View style={{ flex: 1, minHeight: 24 }} />
          <T variant="metaSmall" color="inkMuted" style={{ textAlign: 'center', paddingHorizontal: 24 }}>
            Standard message rates apply. Tahan sends one text.
          </T>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
