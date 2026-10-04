// Tahan — what the app needs from a sign-in backend.
//
// Pure types. Two backends implement this: Firebase (the real one, in a
// development or release build once Firebase is configured) and preview
// (previewBackend.ts — runs anywhere, including Expo Go, with nothing set up).
// Screens only ever see this interface, so they don't know which one they
// are talking to.

import type { UserStore } from '../data/user.ts';

/** A code has been sent to a number and is waiting to be typed in. */
export interface PendingCode {
  /** E.164. */
  readonly phone: string;
  /** When it was sent, in ms since the epoch. Drives the resend wait. */
  readonly sentAt: number;
  /** Signs in, or throws an error with a Firebase-style `code`. */
  confirm(code: string): Promise<void>;
}

export interface AuthBackend {
  readonly kind: 'firebase' | 'preview';
  /** Called with the signed-in uid, or null, now and whenever it changes. Returns an unsubscribe. */
  subscribe(listener: (uid: string | null) => void): () => void;
  /** Texts a code to an E.164 number. */
  sendCode(phone: string): Promise<PendingCode>;
  signOut(): Promise<void>;
  readonly users: UserStore;
}

/** An error carrying a Firebase-style code, so signInError() can word it. */
export function authError(code: string, message = code): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}
