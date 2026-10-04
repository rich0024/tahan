// The Storage rules, against the emulator: photos sit inside the village
// boundary, checked against the same membership documents as Firestore.

import { after, before, beforeEach, describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, setLogLevel, type Firestore } from 'firebase/firestore';
import { deleteObject, getBytes, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';

let env: RulesTestEnvironment;
const V = 'v1';
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const store = (uid: string | null) =>
  (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).storage() as unknown as FirebaseStorage;
const photo = (author: string) => ({ contentType: 'image/jpeg', customMetadata: { authorId: author } });

before(async () => {
  // Every refused write is a test passing; the SDK would log each one as an error.
  setLogLevel('silent');
  env = await initializeTestEnvironment({
    projectId: 'demo-tahan',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
    storage: { rules: readFileSync(new URL('../storage.rules', import.meta.url), 'utf8') },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    for (const [uid, role] of [['alice', 'admin'], ['bob', 'member'], ['carol', 'member']] as const) {
      await setDoc(doc(db, `villages/${V}/members/${uid}`), { role });
    }
    const s = ctx.storage() as unknown as FirebaseStorage;
    await uploadBytes(ref(s, `villages/${V}/p1/bob.jpg`), jpeg, photo('bob'));
  });
});

describe('photos', () => {
  test('only members see a village\'s photos', async () => {
    await assertSucceeds(getBytes(ref(store('carol'), `villages/${V}/p1/bob.jpg`)));
    await assertFails(getBytes(ref(store('mallory'), `villages/${V}/p1/bob.jpg`)));
    await assertFails(getBytes(ref(store(null), `villages/${V}/p1/bob.jpg`)));
  });

  test('members upload photos as themselves; nothing that isn\'t a photo', async () => {
    await assertSucceeds(uploadBytes(ref(store('bob'), `villages/${V}/p2/a.jpg`), jpeg, photo('bob')));
    await assertFails(uploadBytes(ref(store('bob'), `villages/${V}/p2/b.jpg`), jpeg, photo('carol')));
    await assertFails(uploadBytes(ref(store('bob'), `villages/${V}/p2/c.pdf`), jpeg, { contentType: 'application/pdf', customMetadata: { authorId: 'bob' } }));
    await assertFails(uploadBytes(ref(store('mallory'), `villages/${V}/p2/d.jpg`), jpeg, photo('mallory')));
  });

  test('a photo is removed by its author or an admin, nobody else', async () => {
    await assertFails(deleteObject(ref(store('carol'), `villages/${V}/p1/bob.jpg`)));
    await assertSucceeds(deleteObject(ref(store('alice'), `villages/${V}/p1/bob.jpg`)));
  });

  test('a person\'s own folder is theirs alone', async () => {
    await assertSucceeds(uploadBytes(ref(store('bob'), 'users/bob/recipes/adobo.jpg'), jpeg, { contentType: 'image/jpeg' }));
    await assertFails(uploadBytes(ref(store('carol'), 'users/bob/recipes/x.jpg'), jpeg, { contentType: 'image/jpeg' }));
  });
});
