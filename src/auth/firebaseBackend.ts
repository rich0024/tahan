// Tahan — the Firebase sign-in backend.
//
// Native: React Native Firebase, which needs a development build (it can't
// run in Expo Go). Only loaded by src/auth/index.ts when the app was built
// with Firebase's config files present — until then the preview backend
// stands in.
//
// iOS: on a real device Firebase first tries a silent push to prove the app
// is genuine. Without push (a free Apple ID can't use it) it falls back to a
// short "I'm not a robot" web check; the URL scheme that check returns
// through is added by the @react-native-firebase/auth config plugin.
//
// The emulator suite: start a build with EXPO_PUBLIC_EMULATOR_HOST set to
// your Mac's address on the Wi-Fi (e.g. 192.168.1.20) and Auth and Firestore
// talk to the emulators instead. Codes then appear in the emulator UI, and
// no real text is sent.

import {
  connectAuthEmulator, getAuth, onAuthStateChanged, signInWithPhoneNumber, signOut,
} from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import {
  CACHE_SIZE_UNLIMITED, connectFirestoreEmulator, doc, getDoc, initializeFirestore, serverTimestamp,
  setDoc, updateDoc, type Firestore,
} from '@react-native-firebase/firestore';

import type { AuthBackend, PendingCode } from './backend.ts';
import type { UserFields, UserStore } from '../data/user.ts';

let emulatorsConnected = false;
let firestore: Firestore | null = null;

/**
 * Firestore with persistence on and an unlimited cache: the feed opens from
 * the phone's copy, writes queue on the phone and go when there's signal.
 * Set once, before anything else touches Firestore.
 */
function db(): Firestore {
  firestore ??= initializeFirestore(getApp(), { persistence: true, cacheSizeBytes: CACHE_SIZE_UNLIMITED });
  return firestore;
}

export function firebaseBackend(): AuthBackend {
  const auth = getAuth();
  const store = db();

  const emulator = process.env.EXPO_PUBLIC_EMULATOR_HOST;
  if (emulator && !emulatorsConnected) {
    connectAuthEmulator(auth, `http://${emulator}:9099`);
    connectFirestoreEmulator(store, emulator, 8080);
    emulatorsConnected = true;
  }

  const users: UserStore = {
    async get(uid) {
      const snap = await getDoc(doc(store, 'users', uid));
      return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
    },
    async create(uid, fields: UserFields) {
      await setDoc(doc(store, 'users', uid), { ...fields, createdAt: serverTimestamp() });
    },
    async update(uid, fields: UserFields) {
      await updateDoc(doc(store, 'users', uid), fields);
    },
  };

  return {
    kind: 'firebase',
    subscribe(listener) {
      return onAuthStateChanged(auth, (user) => listener(user?.uid ?? null));
    },
    async sendCode(phone): Promise<PendingCode> {
      const confirmation = await signInWithPhoneNumber(auth, phone);
      return {
        phone,
        sentAt: Date.now(),
        async confirm(code) {
          await confirmation.confirm(code);
        },
      };
    },
    signOut: () => signOut(auth),
    users,
  };
}
