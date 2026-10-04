// Tahan — the preview sign-in backend.
//
// Pure, given a key-value store. Lets every screen run before Firebase is set
// up, and in Expo Go, where Firebase can't run at all. No text is sent: the
// code is always 123456. A number always maps to the same uid, the session
// and the user documents are kept in the store, so signing in twice finds the
// same person and a restart stays signed in — the same behaviour the real
// backend has, minus the network.
//
// Nothing here leaves the phone. The app says "Preview" on screen whenever
// this backend is the one in use.

import type { AuthBackend, PendingCode } from './backend.ts';
import { authError } from './backend.ts';
import { hashString, type UserFields, type UserStore } from '../data/user.ts';

export const PREVIEW_CODE = '123456';

export interface KeyValue {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const SESSION = 'tahan.preview.session';
const userKey = (uid: string) => `tahan.preview.user.${uid}`;

/** The same number is always the same person. */
export const previewUid = (phone: string): string => `preview-${hashString(phone).toString(36)}`;

export function previewBackend(kv: KeyValue, now: () => number = Date.now): AuthBackend {
  const listeners = new Set<(uid: string | null) => void>();
  let uid: string | null | undefined; // undefined until the session has been read
  const ready = kv.getItem(SESSION).then((stored) => {
    if (uid === undefined) uid = stored;
  });

  const set = async (next: string | null) => {
    uid = next;
    if (next) await kv.setItem(SESSION, next);
    else await kv.removeItem(SESSION);
    for (const l of listeners) l(next);
  };

  const users: UserStore = {
    async get(id) {
      const raw = await kv.getItem(userKey(id));
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    },
    async create(id, fields: UserFields) {
      await kv.setItem(userKey(id), JSON.stringify({ ...fields, createdAt: now() }));
    },
    async update(id, fields: UserFields) {
      const raw = await kv.getItem(userKey(id));
      if (!raw) throw authError('not-found', `no user ${id}`);
      await kv.setItem(userKey(id), JSON.stringify({ ...(JSON.parse(raw) as object), ...fields }));
    },
  };

  return {
    kind: 'preview',
    subscribe(listener) {
      listeners.add(listener);
      void ready.then(() => {
        if (listeners.has(listener)) listener(uid ?? null);
      });
      return () => listeners.delete(listener);
    },
    async sendCode(phone): Promise<PendingCode> {
      if (!/^\+1[2-9]\d{2}[2-9]\d{6}$/.test(phone)) throw authError('auth/invalid-phone-number');
      return {
        phone,
        sentAt: now(),
        async confirm(code) {
          if (code !== PREVIEW_CODE) throw authError('auth/invalid-verification-code');
          await set(previewUid(phone));
        },
      };
    },
    signOut: () => set(null),
    users,
  };
}

/** A store that forgets on restart. For tests, and if the device store fails to load. */
export function memoryKeyValue(): KeyValue {
  const m = new Map<string, string>();
  return {
    getItem: async (k) => m.get(k) ?? null,
    setItem: async (k, v) => void m.set(k, v),
    removeItem: async (k) => void m.delete(k),
  };
}
