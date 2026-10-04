// Tahan — a village, /villages/{villageId}, and its members.
//
// Pure. Starting a village is one write of three documents — the village,
// the founder's own admin membership, and the village added to the end of
// the founder's list — which firestore.rules allows exactly, so it works
// offline: the phone has the village straight away and the server catches
// up when there's signal. Everyone after the founder joins by invitation
// (redeemInvite(), T3.3); no other client write ever adds a member.

import { sceneByKey, specFromMap, specToMap, tahanScenes, type AvatarSpec, type SceneKey } from '../theme/palettes.ts';
import { hashString, type TahanUser, type UserFields } from './user.ts';

/** As firestore.rules: a name of 1 to 60 characters. */
export const MAX_VILLAGE_NAME = 60;

export type Role = 'admin' | 'member';

export interface Village {
  readonly id: string;
  readonly name: string;
  readonly sceneKey: SceneKey;
  readonly createdBy: string;
  readonly memberCount: number;
}

export interface Member {
  readonly uid: string;
  readonly role: Role;
  /** Copied from the person's own document when they joined. */
  readonly displayName: string;
  readonly avatar: AvatarSpec;
}

/** A village's name as it will be shown: trimmed, single-spaced, not too long. */
export function cleanVillageName(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_VILLAGE_NAME).trim();
}

const SCENE_KEYS: readonly string[] = tahanScenes.map((s) => s.key);
export const isSceneKey = (k: unknown): k is SceneKey => typeof k === 'string' && SCENE_KEYS.includes(k);

/** The village document, as written when it's started. The store adds createdAt. */
export function newVillageFields(founderUid: string, name: string, sceneKey: SceneKey): UserFields {
  const clean = cleanVillageName(name);
  if (!clean) throw new Error('A village needs a name');
  if (!isSceneKey(sceneKey)) throw new Error(`No scene called ${String(sceneKey)}`);
  return { name: clean, sceneKey, createdBy: founderUid, memberCount: 1 };
}

/** The founder's membership: an admin, with a copy of their name and face. The store adds joinedAt and lastSeenAt. */
export function founderMemberFields(founder: TahanUser): UserFields {
  return { role: 'admin', displayName: founder.displayName, avatar: specToMap(founder.avatar) };
}

/** Reads a stored village, repairing anything malformed rather than failing to open it. */
export function villageFromDoc(id: string, data: Record<string, unknown>): Village {
  return {
    id,
    name: typeof data.name === 'string' && data.name.trim() ? cleanVillageName(data.name) : 'Our village',
    sceneKey: isSceneKey(data.sceneKey) ? data.sceneKey : tahanScenes[0].key,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    memberCount: typeof data.memberCount === 'number' && data.memberCount >= 1 ? Math.floor(data.memberCount) : 1,
  };
}

export function memberFromDoc(uid: string, data: Record<string, unknown>): Member {
  return {
    uid,
    role: data.role === 'admin' ? 'admin' : 'member',
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    avatar: specFromMap(data.avatar && typeof data.avatar === 'object' ? data.avatar as Record<string, unknown> : {}),
  };
}

/** "1 person", "12 people". */
export const peopleCount = (n: number): string => (n === 1 ? '1 person' : `${n} people`);

/** "Night sky · 1 person" — the line under a village's name. */
export const villageLine = (v: Village): string => `${sceneByKey(v.sceneKey).name} · ${peopleCount(v.memberCount)}`;

/**
 * Which village the app opens on: the one last chosen on this phone, if the
 * person is still in it; otherwise the one they joined or started most
 * recently. Null with no villages — that's the fork.
 */
export function pickVillage(villages: readonly string[], lastChosen: string | null): string | null {
  if (lastChosen && villages.includes(lastChosen)) return lastChosen;
  return villages.length ? villages[villages.length - 1] : null;
}

/**
 * An id for a village started in preview mode, where there's no Firestore to
 * make one. From the founder and the moment rather than a random number: the
 * app never calls Math.random().
 */
export const previewVillageId = (founderUid: string, now: number): string =>
  `v-${hashString(`${founderUid}@${now}`).toString(36)}${now.toString(36)}`;

/** Where villages live. Firestore in the app; a key-value store in preview mode. */
export interface VillageStore {
  /**
   * Starts a village: the village, the founder's admin membership and the
   * founder's list, in one write. Resolves with the new id as soon as the
   * phone has it — not when the server does, which offline may be a while.
   */
  start(founder: TahanUser, name: string, sceneKey: SceneKey): Promise<string>;
  /** Calls back with the village now and on every change, or null if it can't be read. Returns an unsubscribe. */
  watch(id: string, listener: (village: Village | null) => void): () => void;
}
