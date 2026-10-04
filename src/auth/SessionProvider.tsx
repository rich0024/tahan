// Tahan — the session: who is signed in, and their user document.
//
// Picks the backend once, at launch. Firebase when this build was made with
// Firebase configured and isn't running in Expo Go; otherwise the preview
// backend, which keeps its session and documents on the phone with
// expo-sqlite's key-value store.
//
// When someone signs in, their /users/{uid} document is read, or created on
// first sign-in, before the app shows them anything — so every signed-in
// screen can rely on having a user.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Redirect } from 'expo-router';

import type { AuthBackend, PendingCode } from './backend.ts';
import { memoryKeyValue, previewBackend, type KeyValue } from './previewBackend.ts';
import { ensureUser, type TahanUser } from '../data/user.ts';

function deviceKeyValue(): KeyValue {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: Storage } = require('expo-sqlite/kv-store') as typeof import('expo-sqlite/kv-store');
    return {
      getItem: (k) => Storage.getItem(k),
      setItem: (k, v) => Storage.setItem(k, v),
      removeItem: async (k) => { await Storage.removeItem(k); },
    };
  } catch {
    return memoryKeyValue();
  }
}

function chooseBackend(): AuthBackend {
  const configured = Constants.expoConfig?.extra?.firebase === true;
  const expoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (configured && !expoGo) {
    // Required lazily, so Expo Go never loads Firebase's native modules.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { firebaseBackend } = require('./firebaseBackend.ts') as typeof import('./firebaseBackend.ts');
    return firebaseBackend();
  }
  return previewBackend(deviceKeyValue());
}

export type Session =
  | { readonly status: 'loading' }
  | { readonly status: 'signedOut' }
  | { readonly status: 'signedIn'; readonly user: TahanUser }
  /** Signed in, but the user document couldn't be read. Offline on a first launch, usually. */
  | { readonly status: 'error'; readonly uid: string; readonly retry: () => void };

interface SessionContextValue {
  readonly session: Session;
  readonly backend: AuthBackend['kind'];
  /** The code waiting to be typed in, between the number screen and the code screen. */
  readonly pending: PendingCode | null;
  sendCode(phone: string): Promise<void>;
  confirmCode(code: string): Promise<void>;
  /** Back to the number screen without signing in. */
  clearPending(): void;
  signOut(): Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const backend = useMemo(chooseBackend, []);
  const [session, setSession] = useState<Session>({ status: 'loading' });
  const [pending, setPending] = useState<PendingCode | null>(null);
  const [attempt, setAttempt] = useState(0);
  const latestUid = useRef<string | null>(null);

  useEffect(() => backend.subscribe((uid) => {
    latestUid.current = uid;
    if (!uid) {
      setSession({ status: 'signedOut' });
      return;
    }
    setSession({ status: 'loading' });
    ensureUser(backend.users, uid).then(
      ({ user }) => { if (latestUid.current === uid) setSession({ status: 'signedIn', user }); },
      () => {
        if (latestUid.current === uid) {
          setSession({ status: 'error', uid, retry: () => setAttempt((n) => n + 1) });
        }
      },
    );
  }), [backend, attempt]);

  const sendCode = useCallback(async (phone: string) => {
    setPending(await backend.sendCode(phone));
  }, [backend]);

  const confirmCode = useCallback(async (code: string) => {
    if (!pending) throw Object.assign(new Error('no code was sent'), { code: 'auth/session-expired' });
    await pending.confirm(code);
    setPending(null);
  }, [pending]);

  const signOut = useCallback(async () => {
    setPending(null);
    await backend.signOut();
  }, [backend]);

  const value = useMemo<SessionContextValue>(() => ({
    session, backend: backend.kind, pending, sendCode, confirmCode,
    clearPending: () => setPending(null), signOut,
  }), [session, backend, pending, sendCode, confirmCode, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession() outside <SessionProvider>');
  return value;
}

/** The signed-in user. Only for screens behind the signed-in guard. */
export function useUser(): TahanUser {
  const { session } = useSession();
  if (session.status !== 'signedIn') throw new Error('useUser() while not signed in');
  return session.user;
}

/**
 * Wraps every screen that needs someone signed in. Signing out, or arriving
 * by a link while signed out, goes back to the start.
 */
export function SignedIn({ children }: { children: ReactNode }) {
  const { session } = useSession();
  if (session.status !== 'signedIn') return <Redirect href="/" />;
  return <>{children}</>;
}
