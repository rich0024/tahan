// Tahan — phone numbers and sign-in codes.
//
// Pure. Sign-in is a phone number and a six-digit code: no password, no
// email. The number field sits beside a fixed "+1" chip, so a number here is
// a North American one — ten digits, area code and exchange each starting
// 2–9. A pasted "+1 (650) 555-3434" or "1-650-555-3434" is fine; the leading
// country code is dropped.
//
// The number signs you in and nothing else. It is never written to a user
// document, never shown to a village and never used to find contacts.

export const COUNTRY_CODE = '+1';
export const CODE_LENGTH = 6;
/** How long before "Resend" is offered. The screen states the wait, it doesn't grey out. */
export const RESEND_SECONDS = 30;

/** The national digits of whatever was typed or pasted, at most ten. */
export function phoneDigits(input: string): string {
  let d = input.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  else if (d.length > 10 && input.trim().startsWith('+1')) d = d.slice(1);
  return d.slice(0, 10);
}

/** "(650) 555-3434", filled in as the person types. */
export function formatPhone(input: string): string {
  const d = phoneDigits(input);
  if (d.length === 0) return '';
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** The number in E.164 ("+16505553434"), or null if it isn't a whole, valid one. */
export function toE164(input: string): string | null {
  const d = phoneDigits(input);
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(d)) return null;
  return `${COUNTRY_CODE}${d}`;
}

/** An E.164 number as the code screen shows it: "+1 (650) 555-3434". */
export function displayPhone(e164: string): string {
  return `${COUNTRY_CODE} ${formatPhone(e164.slice(COUNTRY_CODE.length))}`;
}

/** The digits of a code, at most six. Autofill sometimes pastes "123 456". */
export function codeDigits(input: string): string {
  return input.replace(/\D/g, '').slice(0, CODE_LENGTH);
}

export const isWholeCode = (code: string): boolean => new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code);

/** Whole seconds until a resend is allowed; 0 once it is. */
export function resendIn(sentAtMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((sentAtMs + RESEND_SECONDS * 1000 - nowMs) / 1000));
}

/** "0:24". */
export function formatWait(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * What to say when sign-in fails, from a Firebase Auth error code. Plain
 * words, and always something the person can do next.
 */
export function signInError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/invalid-phone-number':
    case 'auth/missing-phone-number':
      return "That number doesn't look right. Check it and try again.";
    case 'auth/invalid-verification-code':
    case 'auth/missing-verification-code':
      return "That code didn't match. Check the text message and try again.";
    case 'auth/code-expired':
    case 'auth/session-expired':
      return 'That code has expired. Send a new one.';
    case 'auth/too-many-requests':
    case 'auth/quota-exceeded':
      return 'Too many tries for now. Wait a little while, then try again.';
    case 'auth/network-request-failed':
      return "You're offline. Signing in needs a connection, just this once.";
    case 'auth/web-context-cancelled':
    case 'auth/captcha-check-failed':
      return 'The check was closed before it finished. Try again.';
    default:
      return 'Something went wrong signing in. Try again.';
  }
}
