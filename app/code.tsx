// Sign in, step two: the six-digit code.
//
// Six boxes over one invisible field, so the phone's "From Messages" autofill
// and a paste both land in one go. A whole code submits itself. The resend
// states its wait ("in 0:24") rather than greying out.

import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import {
  CODE_LENGTH, codeDigits, displayPhone, formatWait, isWholeCode, resendIn, signInError,
} from '../src/auth/phone.ts';
import { useSession } from '../src/auth/SessionProvider.tsx';
import { PreviewNote } from '../src/components/PreviewNote.tsx';
import { Button, Screen, T } from '../src/components/themed.tsx';
import { useScene } from '../src/theme/SceneProvider.tsx';
import { hitTarget, radius, type } from '../src/theme/tokens.ts';

const BOX = 54;

export default function CodeScreen() {
  const { pending, confirmCode, sendCode, clearPending, session } = useSession();
  const { colors } = useScene();
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
  useEffect(() => {
    if (session.status === 'signedIn') router.replace('/home');
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingBottom: 48, gap: 20 }}>
          <T variant="screenTitle" accessibilityRole="header">Enter the code</T>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 4 }}>
            <T>We texted it to {displayPhone(pending.phone)}.</T>
            <Pressable
              onPress={change}
              accessibilityRole="button"
              accessibilityLabel="Change number"
              hitSlop={{ top: 18, bottom: 18, left: 8, right: 8 }}
            >
              <T variant="rowTitle" color="accent700" style={{ textDecorationLine: 'underline' }}>change</T>
            </Pressable>
          </View>

          <Pressable onPress={() => input.current?.focus()} accessible={false}>
            <View style={{ flexDirection: 'row', gap: 8 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              {Array.from({ length: CODE_LENGTH }, (_, i) => {
                const active = i === Math.min(code.length, CODE_LENGTH - 1);
                return (
                  <View
                    key={i}
                    style={{
                      flex: 1, maxWidth: BOX, minHeight: BOX, borderRadius: radius.container,
                      borderWidth: active ? 2 : 1.5,
                      borderColor: active ? colors.accent : colors.accent300,
                      backgroundColor: colors.surface,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <T variant="sectionHeading">{code[i] ?? ''}</T>
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
              ? <T color="inkMuted">Didn't get it? You can send a new code in {formatWait(wait)}.</T>
              : <Button label="Send a new code" kind="outlined" onPress={() => void resend()} />}
          </View>

          <PreviewNote />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
