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
  CACHE_SIZE_UNLIMITED, arrayUnion, collection, connectFirestoreEmulator, doc, getDoc, initializeFirestore,
  onSnapshot, serverTimestamp, setDoc, updateDoc, writeBatch, type Firestore,
} from '@react-native-firebase/firestore';

import type { AuthBackend, PendingCode } from './backend.ts';
import type { UserFields, UserStore } from '../data/user.ts';
import { paths } from '../data/paths.ts';
import { founderMemberFields, newVillageFields, villageFromDoc, type VillageStore } from '../data/village.ts';

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

  const villages: VillageStore = {
    // One batch, exactly the three writes firestore.rules allows for
    // starting a village. Not awaited: the batch lands in the phone's cache
    // at once and the commit only resolves when the server has it, which
    // offline could be hours. A refusal is logged; the rules tests are what
    // keep it from happening.
    async start(founder, name, sceneKey) {
      const ref = doc(collection(store, 'villages'));
      const batch = writeBatch(store);
      batch.set(ref, { ...newVillageFields(founder.uid, name, sceneKey), createdAt: serverTimestamp() });
      batch.set(doc(store, paths.member(ref.id, founder.uid)), {
        ...founderMemberFields(founder), joinedAt: serverTimestamp(), lastSeenAt: serverTimestamp(),
      });
      batch.update(doc(store, paths.user(founder.uid)), { villages: arrayUnion(ref.id) });
      batch.commit().catch((e: unknown) => console.warn('Tahan: starting the village failed', e));
      return ref.id;
    },
    watch(id, listener) {
      return onSnapshot(
        doc(store, paths.village(id)),
        (snap) => listener(snap.exists() ? villageFromDoc(id, snap.data() as Record<string, unknown>) : null),
        () => listener(null),
      );
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
    villages,
  };
}
