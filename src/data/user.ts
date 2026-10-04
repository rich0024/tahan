// Tahan — the user document, /users/{uid}.
//
// Pure. The first time someone signs in they get a document with an empty
// name and a first face. The face is drawn from a hash of their uid rather
// than a random number: the app never calls Math.random(), and if two of
// their devices race to create the document they both write the same face.
//
// The phone number is not here. It lives with Firebase Auth, signs you in,
// and nothing else in Tahan ever reads it.

import {
  companionFromMap, companionToMap, specForIndex, specFromMap, specToMap,
  type AvatarSpec, type CompanionSpec,
} from '../theme/palettes.ts';

/** A companion, with the name they're known by. */
export interface TahanCompanion extends CompanionSpec {
  readonly name: string;
}

export const MAX_COMPANION_NAME = 30;

export interface TahanUser {
  readonly uid: string;
  /** Empty until the name-and-face onboarding screen. */
  readonly displayName: string;
  readonly avatar: AvatarSpec;
  /** At most one: a dog, a cat or a baby. Belongs to the person, not a village. */
  readonly companion: TahanCompanion | null;
  readonly villages: readonly string[];
  readonly textScale: number;
}

/** The fields a new document is created with. The store adds createdAt. */
export type UserFields = Record<string, unknown>;

/** FNV-1a, 32-bit. Stable across devices, platforms and app versions. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** The face someone starts with. Theirs to change straight away. */
export const firstFace = (uid: string): AvatarSpec => specForIndex(hashString(uid));

export function newUserFields(uid: string): UserFields {
  return {
    displayName: '',
    avatar: specToMap(firstFace(uid)),
    companion: null,
    villages: [],
    textScale: 1,
  };
}

const MAX_NAME = 40; // as onboarding.ts

/** Reads a stored document, repairing anything malformed rather than failing to sign in. */
export function userFromDoc(uid: string, data: Record<string, unknown>): TahanUser {
  const avatar = data.avatar && typeof data.avatar === 'object'
    ? specFromMap(data.avatar as Record<string, unknown>)
    : firstFace(uid);
  const stored = data.companion && typeof data.companion === 'object' ? data.companion as Record<string, unknown> : null;
  const companion = stored
    ? { ...companionFromMap(stored), name: typeof stored.name === 'string' ? stored.name.trim().slice(0, MAX_COMPANION_NAME) : '' }
    : null;
  const textScale = typeof data.textScale === 'number' && Number.isFinite(data.textScale)
    ? Math.min(2, Math.max(1, data.textScale))
    : 1;
  return {
    uid,
    displayName: typeof data.displayName === 'string' ? data.displayName.trim().slice(0, MAX_NAME) : '',
    avatar,
    companion,
    villages: Array.isArray(data.villages) ? data.villages.filter((v): v is string => typeof v === 'string') : [],
    textScale,
  };
}

export function userToFields(user: TahanUser): UserFields {
  return {
    displayName: user.displayName,
    avatar: specToMap(user.avatar),
    companion: user.companion ? { ...companionToMap(user.companion), name: user.companion.name } : null,
    villages: [...user.villages],
    textScale: user.textScale,
  };
}

/** Where user documents live. Firestore in the app; a key-value store in preview mode. */
export interface UserStore {
  get(uid: string): Promise<Record<string, unknown> | null>;
  /** Creates the document. Adds createdAt. */
  create(uid: string, fields: UserFields): Promise<void>;
  /** Changes some fields of an existing document, leaving the rest. */
  update(uid: string, fields: UserFields): Promise<void>;
}

/** The fields a person can change about themselves. */
export type UserChanges = Partial<Pick<TahanUser, 'displayName' | 'avatar' | 'companion' | 'textScale'>>;

/** Changes as stored fields — only the ones given. */
export function changesToFields(changes: UserChanges): UserFields {
  const all = userToFields({ uid: '', displayName: '', avatar: firstFace(''), companion: null, villages: [], textScale: 1, ...changes });
  return Object.fromEntries(Object.keys(changes).map((k) => [k, all[k]]));
}

/**
 * The user's document, creating it on their first sign-in. Signing in again —
 * on this device or another — finds the same document and changes nothing.
 */
export async function ensureUser(store: UserStore, uid: string): Promise<{ user: TahanUser; created: boolean }> {
  const existing = await store.get(uid);
  if (existing) return { user: userFromDoc(uid, existing), created: false };
  const fields = newUserFields(uid);
  await store.create(uid, fields);
  return { user: userFromDoc(uid, fields), created: true };
}
