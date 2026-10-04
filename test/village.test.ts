// T3.2 — starting a village. The founder becomes its admin, their membership
// carries a copy of their name and face, and the village joins the end of
// their list so the app opens on it. The same write in Firestore is proven
// against the rules in test-rules/firestore.test.ts.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { memoryKeyValue, previewBackend } from '../src/auth/previewBackend.ts';
import { ensureUser, userFromDoc, type TahanUser } from '../src/data/user.ts';
import {
  MAX_VILLAGE_NAME, cleanVillageName, founderMemberFields, memberFromDoc, newVillageFields, peopleCount,
  pickVillage, previewVillageId, villageFromDoc, villageLine, type Village,
} from '../src/data/village.ts';
import { sampleFaces, specToMap, tahanScenes } from '../src/theme/palettes.ts';

const { name: _n, ...face } = sampleFaces[3];
const rosa: TahanUser = { ...userFromDoc('rosa', {}), displayName: 'Rosa', avatar: face };

describe('a village\'s name', () => {
  test('is trimmed, single-spaced and at most 60 characters, as the rules require', () => {
    assert.equal(cleanVillageName('  The   Gutiérrez \n Family '), 'The Gutiérrez Family');
    assert.equal(cleanVillageName('x'.repeat(80)).length, MAX_VILLAGE_NAME);
    assert.equal(cleanVillageName('   '), '');
  });

  test('a village with no name, or no real scene, is never written', () => {
    assert.throws(() => newVillageFields('rosa', '  ', 'night'));
    assert.throws(() => newVillageFields('rosa', 'Ours', 'mars' as never));
  });
});

describe('starting a village', () => {
  test('the document: the name, the scene, its founder, one person', () => {
    assert.deepEqual(newVillageFields('rosa', ' The Gutiérrez Family ', 'coast'), {
      name: 'The Gutiérrez Family', sceneKey: 'coast', createdBy: 'rosa', memberCount: 1,
    });
  });

  test('the founder is an admin, with a copy of their name and face', () => {
    const m = founderMemberFields(rosa);
    assert.deepEqual(m, { role: 'admin', displayName: 'Rosa', avatar: specToMap(face) });
    const read = memberFromDoc('rosa', m);
    assert.equal(read.role, 'admin');
    assert.deepEqual(read.avatar, face);
  });

  test('in preview: the village, the membership and the list, and the app opens on it', async () => {
    const kv = memoryKeyValue();
    let t = 1_000;
    const backend = previewBackend(kv, () => t++);
    await ensureUser(backend.users, 'rosa');
    const first = await backend.villages.start(rosa, 'The Gutiérrez Family', 'blossom');
    const second = await backend.villages.start(rosa, 'Book club', 'coast');
    assert.notEqual(first, second);

    const stored = userFromDoc('rosa', (await backend.users.get('rosa'))!);
    assert.deepEqual(stored.villages, [first, second], 'each new village joins the end of the list');
    assert.equal(pickVillage(stored.villages, null), second, 'the newest opens');

    const seen = await new Promise<Village | null>((resolve) => backend.villages.watch(first, resolve));
    assert.deepEqual(seen, { id: first, name: 'The Gutiérrez Family', sceneKey: 'blossom', createdBy: 'rosa', memberCount: 1 });

    const member = JSON.parse((await kv.getItem(`tahan.preview.member.${first}.rosa`))!) as Record<string, unknown>;
    assert.equal(member.role, 'admin');
    assert.equal(member.displayName, 'Rosa');
  });

  test('a village that isn\'t there reads as null, not a crash', async () => {
    const backend = previewBackend(memoryKeyValue());
    assert.equal(await new Promise((resolve) => backend.villages.watch('nope', resolve)), null);
  });

  test('preview ids are stable for the same moment and differ between moments — no Math.random()', () => {
    assert.equal(previewVillageId('rosa', 5), previewVillageId('rosa', 5));
    assert.notEqual(previewVillageId('rosa', 5), previewVillageId('rosa', 6));
    assert.notEqual(previewVillageId('rosa', 5), previewVillageId('ben', 5));
  });
});

describe('which village the app opens on', () => {
  test('the one last chosen on this phone, if still in it; otherwise the newest; none is the fork', () => {
    assert.equal(pickVillage(['a', 'b', 'c'], 'a'), 'a');
    assert.equal(pickVillage(['a', 'b', 'c'], 'gone'), 'c');
    assert.equal(pickVillage(['a', 'b', 'c'], null), 'c');
    assert.equal(pickVillage([], 'a'), null);
  });
});

describe('reading a village', () => {
  test('a malformed document is repaired, never fatal', () => {
    const v = villageFromDoc('v1', { name: 42, sceneKey: 'mars', memberCount: -3 });
    assert.equal(v.name, 'Our village');
    assert.equal(v.sceneKey, tahanScenes[0].key);
    assert.equal(v.memberCount, 1);
  });

  test('the line under its name', () => {
    assert.equal(peopleCount(1), '1 person');
    assert.equal(peopleCount(12), '12 people');
    assert.equal(villageLine(villageFromDoc('v1', { name: 'Ours', sceneKey: 'winter', memberCount: 12 })), 'Winter · 12 people');
  });
});
