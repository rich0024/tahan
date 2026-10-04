// The Firestore rules, against the emulator. Run with `npm run test:rules`
// (it starts the emulators for a demo project, runs this, and stops them).
//
// The first three tests are the product's whole promise (T3.1):
//   a non-member cannot read a village's posts,
//   a member cannot appoint an admin,
//   a member cannot edit another member's post.
// The rest walk every other path in firestore.rules.

import { after, before, beforeEach, describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch,
  type Firestore,
  setLogLevel,
} from 'firebase/firestore';

let env: RulesTestEnvironment;

// The cast: Alice founded the village and is its admin; Bob and Carol are
// members; Mallory is signed in but not in it.
const V = 'v1';
const as = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;
const anonymous = () => env.unauthenticatedContext().firestore() as unknown as Firestore;
const zero = { heart: 0, hands: 0, smile: 0, star: 0 };
const face = { skin: 0.4, hair: 1 };

before(async () => {
  // Every refused write is a test passing; the SDK would log each one as an error.
  setLogLevel('silent');
  env = await initializeTestEnvironment({
    projectId: 'demo-tahan',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, `villages/${V}`), { name: 'The Gutiérrez Family', sceneKey: 'night', createdBy: 'alice', memberCount: 3, createdAt: new Date() });
    for (const [uid, role] of [['alice', 'admin'], ['bob', 'member'], ['carol', 'member']] as const) {
      await setDoc(doc(db, `villages/${V}/members/${uid}`), { role, displayName: uid, avatar: face, joinedAt: new Date(), lastSeenAt: new Date() });
    }
    await setDoc(doc(db, `villages/${V}/posts/alicePost`), { type: 'update', authorId: 'alice', body: 'Back from the lake', photoPaths: [], reactionCounts: zero, noteCount: 0, createdAt: new Date() });
    await setDoc(doc(db, `villages/${V}/posts/bobPost`), { type: 'update', authorId: 'bob', body: 'Who has the big pot?', photoPaths: [], reactionCounts: zero, noteCount: 0, createdAt: new Date() });
    await setDoc(doc(db, `villages/${V}/posts/alicePost/notes/n1`), { authorId: 'carol', body: 'Lovely', createdAt: new Date() });
    await setDoc(doc(db, `villages/${V}/moderation/m1`), { actorUid: 'alice', authorUid: 'bob', postType: 'update', reason: 'Duplicate', at: new Date() });
    await setDoc(doc(db, `invites/tok123`), { villageId: V, createdBy: 'alice', expiresAt: new Date(Date.now() + 86_400_000), usedAt: null });
    await setDoc(doc(db, `users/alice`), { displayName: 'Alice', avatar: face, companion: null, villages: [V], textScale: 1, createdAt: new Date() });
    await setDoc(doc(db, `users/bob`), { displayName: 'Bob', avatar: face, companion: null, villages: [V], textScale: 1, createdAt: new Date() });
    await setDoc(doc(db, `users/mallory`), { displayName: 'Mallory', avatar: face, companion: null, villages: [], textScale: 1, createdAt: new Date() });
    await setDoc(doc(db, `users/alice/recipes/adobo`), { title: 'Adobo', sharedWith: [V] });
    await setDoc(doc(db, `villages/${V}/events/e1`), { title: 'Sunday', startsAt: new Date(), where: 'Ours', hostId: 'alice', postId: 'alicePost' });
    await setDoc(doc(db, `villages/${V}/events/e1/bring/pot`), { group: 'eat', title: 'Big pot of rice', askedBy: 'alice', claimedBy: null, note: '' });
    await setDoc(doc(db, `villages/${V}/routines/meds`), { title: 'Morning pills', ownerId: 'carol', forCompanion: false, schedule: 'daily', visibility: 'private' });
  });
});

// ---------------------------------------------------------------------------

describe('the promise', () => {
  test('a non-member cannot read a village\'s posts', async () => {
    await assertFails(getDoc(doc(as('mallory'), `villages/${V}/posts/alicePost`)));
    await assertFails(getDocs(collection(as('mallory'), `villages/${V}/posts`)));
    await assertFails(getDoc(doc(anonymous(), `villages/${V}/posts/alicePost`)));
    await assertSucceeds(getDoc(doc(as('bob'), `villages/${V}/posts/alicePost`)));
    await assertSucceeds(getDocs(collection(as('bob'), `villages/${V}/posts`)));
  });

  test('a member cannot appoint an admin — not themselves, not anyone', async () => {
    await assertFails(updateDoc(doc(as('bob'), `villages/${V}/members/bob`), { role: 'admin' }));
    await assertFails(updateDoc(doc(as('bob'), `villages/${V}/members/carol`), { role: 'admin' }));
    await assertSucceeds(updateDoc(doc(as('alice'), `villages/${V}/members/bob`), { role: 'admin' }));
  });

  test('a member cannot edit another member\'s post', async () => {
    await assertFails(updateDoc(doc(as('bob'), `villages/${V}/posts/alicePost`), { body: 'Rewritten by Bob' }));
    await assertFails(updateDoc(doc(as('bob'), `villages/${V}/posts/alicePost`), { authorId: 'bob' }));
    await assertFails(deleteDoc(doc(as('bob'), `villages/${V}/posts/alicePost`)));
    await assertSucceeds(updateDoc(doc(as('alice'), `villages/${V}/posts/alicePost`), { body: 'Back from the lake!' }));
  });
});

// ---------------------------------------------------------------------------

describe('villages', () => {
  test('members read it; outsiders and strangers do not', async () => {
    await assertSucceeds(getDoc(doc(as('carol'), `villages/${V}`)));
    await assertFails(getDoc(doc(as('mallory'), `villages/${V}`)));
    await assertFails(getDocs(collection(as('mallory'), 'villages')));
  });

  test('only an admin renames it or changes its scene, and it is never deleted', async () => {
    await assertSucceeds(updateDoc(doc(as('alice'), `villages/${V}`), { sceneKey: 'coast' }));
    await assertFails(updateDoc(doc(as('bob'), `villages/${V}`), { sceneKey: 'coast' }));
    await assertFails(updateDoc(doc(as('alice'), `villages/${V}`), { sceneKey: 'mars' }));
    await assertFails(updateDoc(doc(as('alice'), `villages/${V}`), { memberCount: 40 }));
    await assertFails(deleteDoc(doc(as('alice'), `villages/${V}`)));
  });

  test('starting a village: the village, your own admin membership and your list of villages, together', async () => {
    const db = as('mallory');
    const batch = writeBatch(db);
    batch.set(doc(db, 'villages/v2'), { name: 'Mallory\'s', sceneKey: 'forest', createdBy: 'mallory', memberCount: 1, createdAt: serverTimestamp() });
    batch.set(doc(db, 'villages/v2/members/mallory'), { role: 'admin', displayName: 'Mallory', avatar: face, joinedAt: serverTimestamp(), lastSeenAt: serverTimestamp() });
    batch.update(doc(db, 'users/mallory'), { villages: arrayUnion('v2') });
    await assertSucceeds(batch.commit());
    await assertSucceeds(getDoc(doc(db, 'villages/v2')));
  });

  test('…and a second one goes on the end of the list', async () => {
    const db = as('alice');
    const batch = writeBatch(db);
    batch.set(doc(db, 'villages/v2'), { name: 'Book club', sceneKey: 'coast', createdBy: 'alice', memberCount: 1, createdAt: serverTimestamp() });
    batch.set(doc(db, 'villages/v2/members/alice'), { role: 'admin', displayName: 'Alice', avatar: face, joinedAt: serverTimestamp(), lastSeenAt: serverTimestamp() });
    batch.update(doc(db, 'users/alice'), { villages: arrayUnion('v2') });
    await assertSucceeds(batch.commit());
  });

  test('the list only gains the village being started — never one you were not given', async () => {
    // A village you're a member of, but didn't just start: that's redeemInvite()'s to add.
    await assertFails(updateDoc(doc(as('bob'), 'users/bob'), { villages: [V, V] }));
    await assertFails(updateDoc(doc(as('mallory'), 'users/mallory'), { villages: [V] }));
    // Starting one village doesn't let you slip in another.
    const db = as('mallory');
    const batch = writeBatch(db);
    batch.set(doc(db, 'villages/v2'), { name: 'Mallory\'s', sceneKey: 'forest', createdBy: 'mallory', memberCount: 1, createdAt: serverTimestamp() });
    batch.set(doc(db, 'villages/v2/members/mallory'), { role: 'admin', displayName: 'Mallory', avatar: face, joinedAt: serverTimestamp(), lastSeenAt: serverTimestamp() });
    batch.update(doc(db, 'users/mallory'), { villages: [V, 'v2'] });
    await assertFails(batch.commit());
    // Nor drop one: leaving is leaveVillage()'s.
    await assertFails(updateDoc(doc(as('alice'), 'users/alice'), { villages: [] }));
  });

  test('…but not a village without its founder, nor a village founded in someone else\'s name', async () => {
    await assertFails(setDoc(doc(as('mallory'), 'villages/v3'), { name: 'Lonely', sceneKey: 'forest', createdBy: 'mallory', memberCount: 1, createdAt: serverTimestamp() }));
    const db = as('mallory');
    const batch = writeBatch(db);
    batch.set(doc(db, 'villages/v4'), { name: 'Framed', sceneKey: 'forest', createdBy: 'bob', memberCount: 1, createdAt: serverTimestamp() });
    batch.set(doc(db, 'villages/v4/members/mallory'), { role: 'admin', displayName: 'M', avatar: face, joinedAt: serverTimestamp(), lastSeenAt: serverTimestamp() });
    await assertFails(batch.commit());
  });
});

describe('members', () => {
  test('nobody joins by writing their own membership — that is redeemInvite()', async () => {
    await assertFails(setDoc(doc(as('mallory'), `villages/${V}/members/mallory`), { role: 'member', displayName: 'M', avatar: face, joinedAt: serverTimestamp(), lastSeenAt: serverTimestamp() }));
    await assertFails(setDoc(doc(as('mallory'), `villages/${V}/members/mallory`), { role: 'admin', displayName: 'M', avatar: face, joinedAt: serverTimestamp(), lastSeenAt: serverTimestamp() }));
  });

  test('the founder can never be stepped down, so a village always has an admin', async () => {
    await assertSucceeds(updateDoc(doc(as('alice'), `villages/${V}/members/bob`), { role: 'admin' }));
    await assertFails(updateDoc(doc(as('bob'), `villages/${V}/members/alice`), { role: 'member' }));
    await assertSucceeds(updateDoc(doc(as('alice'), `villages/${V}/members/bob`), { role: 'member' }));
  });

  test('you may mark yourself seen, and change nothing else about your membership', async () => {
    await assertSucceeds(updateDoc(doc(as('bob'), `villages/${V}/members/bob`), { lastSeenAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as('bob'), `villages/${V}/members/bob`), { displayName: 'Robert' }));
    await assertFails(updateDoc(doc(as('bob'), `villages/${V}/members/carol`), { lastSeenAt: serverTimestamp() }));
  });

  test('nobody deletes a membership directly — leaving takes everything with it, through leaveVillage()', async () => {
    await assertFails(deleteDoc(doc(as('bob'), `villages/${V}/members/bob`)));
    await assertFails(deleteDoc(doc(as('alice'), `villages/${V}/members/bob`)));
  });
});

describe('posts', () => {
  test('a member posts as themselves, starting from zero', async () => {
    const ok = { type: 'update', authorId: 'bob', body: 'Hello', photoPaths: [], reactionCounts: zero, noteCount: 0, createdAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(as('bob'), `villages/${V}/posts/p1`), ok));
    await assertFails(setDoc(doc(as('bob'), `villages/${V}/posts/p2`), { ...ok, authorId: 'alice' }));
    await assertFails(setDoc(doc(as('bob'), `villages/${V}/posts/p3`), { ...ok, reactionCounts: { ...zero, heart: 9 } }));
    await assertFails(setDoc(doc(as('bob'), `villages/${V}/posts/p4`), { ...ok, type: 'advert' }));
    await assertFails(setDoc(doc(as('mallory'), `villages/${V}/posts/p5`), { ...ok, authorId: 'mallory' }));
  });

  test('anyone in the village moves a count by one — never more, never anything else', async () => {
    await assertSucceeds(updateDoc(doc(as('bob'), `villages/${V}/posts/alicePost`), { reactionCounts: { ...zero, heart: 1 } }));
    await assertFails(updateDoc(doc(as('bob'), `villages/${V}/posts/alicePost`), { reactionCounts: { ...zero, heart: 5 } }));
    await assertFails(updateDoc(doc(as('bob'), `villages/${V}/posts/alicePost`), { reactionCounts: { ...zero, angry: 1 } }));
    await assertFails(updateDoc(doc(as('mallory'), `villages/${V}/posts/alicePost`), { reactionCounts: { ...zero, heart: 1 } }));
  });

  test('an admin can take a post down; nobody else can delete another\'s', async () => {
    await assertFails(deleteDoc(doc(as('carol'), `villages/${V}/posts/bobPost`)));
    await assertSucceeds(deleteDoc(doc(as('alice'), `villages/${V}/posts/bobPost`)));
  });

  test('reactions: your own, one of four', async () => {
    await assertSucceeds(setDoc(doc(as('bob'), `villages/${V}/posts/alicePost/reactions/bob`), { kind: 'hands' }));
    await assertFails(setDoc(doc(as('bob'), `villages/${V}/posts/alicePost/reactions/carol`), { kind: 'heart' }));
    await assertFails(setDoc(doc(as('bob'), `villages/${V}/posts/alicePost/reactions/bob`), { kind: 'angry' }));
  });

  test('notes: written as yourself, never edited, removed by their author or an admin', async () => {
    await assertSucceeds(setDoc(doc(as('bob'), `villages/${V}/posts/alicePost/notes/n2`), { authorId: 'bob', body: 'Glad you\'re back', createdAt: serverTimestamp() }));
    await assertFails(setDoc(doc(as('bob'), `villages/${V}/posts/alicePost/notes/n3`), { authorId: 'carol', body: 'Not me', createdAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as('carol'), `villages/${V}/posts/alicePost/notes/n1`), { body: 'Edited' }));
    await assertFails(deleteDoc(doc(as('bob'), `villages/${V}/posts/alicePost/notes/n1`)));
    await assertSucceeds(deleteDoc(doc(as('alice'), `villages/${V}/posts/alicePost/notes/n1`)));
  });
});

describe('the bring board', () => {
  test('claim an open row for yourself, release your own — never take someone else\'s', async () => {
    const row = `villages/${V}/events/e1/bring/pot`;
    await assertSucceeds(updateDoc(doc(as('bob'), row), { claimedBy: 'bob' }));
    await assertFails(updateDoc(doc(as('carol'), row), { claimedBy: 'carol' }));
    await assertFails(updateDoc(doc(as('carol'), row), { claimedBy: null }));
    await assertSucceeds(updateDoc(doc(as('bob'), row), { claimedBy: null }));
  });

  test('RSVPs and "I\'m in" are one document per person', async () => {
    await assertSucceeds(setDoc(doc(as('bob'), `villages/${V}/events/e1/rsvps/bob`), { answer: 'coming' }));
    await assertFails(setDoc(doc(as('bob'), `villages/${V}/events/e1/rsvps/carol`), { answer: 'cant' }));
    await assertSucceeds(setDoc(doc(as('carol'), `villages/${V}/events/e1/ideas/i1`), { title: 'Picnic', byUid: 'carol' }));
    await assertSucceeds(setDoc(doc(as('bob'), `villages/${V}/events/e1/ideas/i1/imIn/bob`), {}));
    await assertFails(setDoc(doc(as('bob'), `villages/${V}/events/e1/ideas/i1/imIn/carol`), {}));
  });
});

describe('routines', () => {
  test('a private routine is its owner\'s alone', async () => {
    await assertSucceeds(getDoc(doc(as('carol'), `villages/${V}/routines/meds`)));
    await assertFails(getDoc(doc(as('bob'), `villages/${V}/routines/meds`)));
  });

  test('a check-in is self-reported — there is no way to write a missed dose', async () => {
    const at = `villages/${V}/routines/meds/checkins/2026-10-04`;
    await assertSucceeds(setDoc(doc(as('carol'), at), { byUid: 'carol', at: serverTimestamp() }));
    await assertFails(setDoc(doc(as('carol'), `${at}-b`), { byUid: 'carol', at: serverTimestamp(), missed: true }));
    await assertFails(setDoc(doc(as('carol'), `${at}-c`), { byUid: 'bob', at: serverTimestamp() }));
  });
});

describe('outside the village', () => {
  test('an invitation can be looked up by anyone, listed by nobody, written by no client', async () => {
    await assertSucceeds(getDoc(doc(anonymous(), 'invites/tok123')));
    await assertFails(getDocs(collection(anonymous(), 'invites')));
    await assertFails(setDoc(doc(as('alice'), 'invites/tok999'), { villageId: V, createdBy: 'alice', expiresAt: new Date(), usedAt: null }));
    await assertFails(updateDoc(doc(as('mallory'), 'invites/tok123'), { usedAt: new Date() }));
  });

  test('your own document is yours alone, and you cannot add a village to it', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'users/alice')));
    await assertFails(getDoc(doc(as('bob'), 'users/alice')));
    await assertSucceeds(updateDoc(doc(as('alice'), 'users/alice'), { displayName: 'Lola' }));
    await assertFails(updateDoc(doc(as('alice'), 'users/alice'), { villages: [V, 'someone-elses'] }));
  });

  test('a recipe lent to a village is readable there, and nowhere else', async () => {
    await assertSucceeds(getDoc(doc(as('bob'), 'users/alice/recipes/adobo')));
    await assertFails(getDoc(doc(as('mallory'), 'users/alice/recipes/adobo')));
    await assertFails(setDoc(doc(as('bob'), 'users/alice/recipes/adobo'), { title: 'Bob\'s now', sharedWith: [V] }));
  });

  test('moderation records: admins read them, no client writes them', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), `villages/${V}/moderation/m1`)));
    await assertFails(getDoc(doc(as('bob'), `villages/${V}/moderation/m1`)));
    await assertFails(setDoc(doc(as('alice'), `villages/${V}/moderation/m2`), { reason: 'x' }));
  });

  test('anything not named in the rules is closed', async () => {
    await assertFails(setDoc(doc(as('alice'), 'stuff/x'), { a: 1 }));
    await assertFails(getDoc(doc(as('alice'), 'stuff/x')));
  });
});
