// Onboarding 3 of 4: the code.
//
// Six big boxes over one invisible field, so the phone's "From Messages"
// autofill and a paste both land in one go, and a whole code submits itself.
// The number is shown so a mistyped digit is caught here, not after a silent
// failure. The resend says when — never a greyed-out button with no reason.

import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CODE_LENGTH, codeDigits, displayPhone, formatWait, isWholeCode, resendIn, signInError,
} from '../src/auth/phone.ts';
import { useSession } from '../src/auth/SessionProvider.tsx';
import { BackButton } from '../src/components/BackButton.tsx';
import { PreviewNote } from '../src/components/PreviewNote.tsx';
import { Button, Screen, T } from '../src/components/themed.tsx';
import { useScene } from '../src/theme/SceneProvider.tsx';
import { hitTarget, radius, type } from '../src/theme/tokens.ts';

export default function CodeScreen() {
  const { pending, confirmCode, sendCode, clearPending, session } = useSession();
  const { colors } = useScene();
  const insets = useSafeAreaInsets();
  const input = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Signed in — by this code, or by Android verifying the number on its own.
  // The start screen knows what comes next.
  useEffect(() => {
    if (session.status === 'signedIn') router.replace('/');
  }, [session.status]);

  if (!pending) return session.status === 'signedIn' ? null : <Redirect href="/phone" />;

  const wait = resendIn(pending.sentAt, now);

  async function submit(value: string) {
    if (!isWholeCode(value) || busy) return;
    setBusy(true);
    setError(null);
    try {
      await confirmCode(value);
    } catch (e) {
      setError(signInError(e));
      setCode('');
      input.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!pending) return;
    setError(null);
    setCode('');
    try {
      await sendCode(pending.phone);
    } catch (e) {
      setError(signInError(e));
    }
  }

  function change() {
    clearPending();
    if (router.canGoBack()) router.back();
    else router.replace('/phone');
  }

  return (
    <Screen>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: insets.bottom + 24, gap: 20 }}
        >
          <BackButton onPress={change} label="Back to your number" />

          <View style={{ gap: 8 }}>
            <T variant="screenTitle" accessibilityRole="header">Check your texts</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6 }}>
              <T color="inkMuted">Sent to {displayPhone(pending.phone)} ·</T>
              <Pressable
                onPress={change}
                accessibilityRole="button"
                accessibilityLabel="Change number"
                hitSlop={{ top: 18, bottom: 18, left: 8, right: 8 }}
              >
                <T variant="rowTitle" color="accent700" style={{ textDecorationLine: 'underline' }}>change</T>
              </Pressable>
            </View>
          </View>

          <Pressable onPress={() => input.current?.focus()} accessible={false}>
            <View style={{ flexDirection: 'row', gap: 9 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              {Array.from({ length: CODE_LENGTH }, (_, i) => {
                const active = !busy && i === Math.min(code.length, CODE_LENGTH - 1);
                return (
                  <View
                    key={i}
                    style={{
                      flex: 1, aspectRatio: 1, maxWidth: 64, minHeight: 48, borderRadius: radius.container,
                      borderWidth: 1.5,
                      borderColor: active ? colors.accent : colors.surface,
                      backgroundColor: colors.surface,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <T variant="rowTitle" style={{ fontSize: 26, lineHeight: 32 }}>{code[i] ?? ''}</T>
                  </View>
                );
              })}
            </View>
            <TextInput
              ref={input}
              value={code}
              onChangeText={(t) => {
                const digits = codeDigits(t);
                setCode(digits);
                if (isWholeCode(digits)) void submit(digits);
              }}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              autoFocus
              caretHidden
              editable={!busy}
              accessibilityLabel={`Six-digit code. ${code.length} of ${CODE_LENGTH} entered.`}
              style={[type.body, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.01, color: colors.ink }]}
            />
          </Pressable>

          {error && <T variant="rowTitle" color="accent700" accessibilityLiveRegion="polite">{error}</T>}
          {busy && <T color="inkMuted">Checking…</T>}

          <View style={{ minHeight: hitTarget, justifyContent: 'center' }}>
            {wait > 0
              ? <T color="inkMuted">Didn't arrive? You can ask for another in <T variant="rowTitle">{formatWait(wait)}</T>.</T>
              : <Button label="Send another code" kind="outlined" onPress={() => void resend()} />}
          </View>

          <PreviewNote />

          <View style={{ flex: 1 }} />
          <View style={{ backgroundColor: colors.accent2_100, borderRadius: radius.container, padding: 16 }}>
            <T variant="bodyTight">
              If someone in your family is having trouble here, they can sign in on your phone and
              then move to theirs — the account follows the number, not the device.
            </T>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
