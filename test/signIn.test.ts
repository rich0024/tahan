// Sign-in: phone numbers, codes, the user document and the session.
//
// T1.6 is done when signing in twice on the same device reuses the same user
// document and signing out returns to the start. The preview backend behaves
// as the Firebase one does, so the session rules are proven here against it;
// the Firebase half is proven on a device.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  codeDigits, displayPhone, formatPhone, formatWait, isWholeCode, phoneDigits, resendIn,
  signInError, toE164,
} from '../src/auth/phone.ts';
import { authError } from '../src/auth/backend.ts';
import { PREVIEW_CODE, memoryKeyValue, previewBackend, previewUid } from '../src/auth/previewBackend.ts';
import {
  ensureUser, firstFace, hashString, newUserFields, userFromDoc, userToFields, type UserStore,
} from '../src/data/user.ts';
import { specToMap } from '../src/theme/palettes.ts';

describe('phone numbers', () => {
  test('typed, pasted and autofilled numbers all land on the same ten digits', () => {
    for (const input of ['6505553434', '(650) 555-3434', '650.555.3434', '+1 650 555 3434', '1-650-555-3434', '+16505553434']) {
      assert.equal(phoneDigits(input), '6505553434', input);
      assert.equal(toE164(input), '+16505553434', input);
    }
  });

  test('formats as the person types', () => {
    assert.equal(formatPhone(''), '');
    assert.equal(formatPhone('6'), '(6');
    assert.equal(formatPhone('6505'), '(650) 5');
    assert.equal(formatPhone('6505553'), '(650) 555-3');
    assert.equal(formatPhone('650555343499'), '(650) 555-3434');
    assert.equal(displayPhone('+16505553434'), '+1 (650) 555-3434');
  });

  test('rejects anything that is not a whole North American number', () => {
    for (const input of ['', '555', '650555343', '0505553434', '1505553434', '6501553434', 'phone']) {
      assert.equal(toE164(input), null, input);
    }
  });
});

describe('codes', () => {
  test('keeps six digits, whatever autofill pastes', () => {
    assert.equal(codeDigits('123 456'), '123456');
    assert.equal(codeDigits('12-34-56-78'), '123456');
    assert.ok(isWholeCode('123456'));
    assert.ok(!isWholeCode('12345'));
    assert.ok(!isWholeCode('12345a'));
  });

  test('the resend wait is stated, counting down to zero', () => {
    assert.equal(resendIn(0, 0), 30);
    assert.equal(resendIn(0, 6_200), 24);
    assert.equal(resendIn(0, 30_000), 0);
    assert.equal(resendIn(0, 99_000), 0);
    assert.equal(formatWait(24), '0:24');
    assert.equal(formatWait(5), '0:05');
    assert.equal(formatWait(75), '1:15');
  });

  test('every failure says what to do next', () => {
    for (const code of ['auth/invalid-phone-number', 'auth/invalid-verification-code', 'auth/code-expired',
      'auth/too-many-requests', 'auth/network-request-failed', 'something/else']) {
      assert.match(signInError(authError(code)), /\.$/);
    }
    assert.match(signInError(new Error('boom')), /Try again/);
    assert.match(signInError(null), /Try again/);
  });
});

describe('the user document', () => {
  test('a new person gets an empty name and a face drawn from their uid', () => {
    const fields = newUserFields('uid-a');
    assert.equal(fields.displayName, '');
    assert.deepEqual(fields.avatar, specToMap(firstFace('uid-a')));
    assert.deepEqual(firstFace('uid-a'), firstFace('uid-a'), 'stable');
    const faces = new Set(Array.from({ length: 40 }, (_, i) => JSON.stringify(firstFace(`uid-${i}`))));
    assert.equal(faces.size, 40, 'and varied');
  });

  test('never stores the phone number', () => {
    assert.ok(!JSON.stringify(newUserFields('uid-a')).includes('phone'));
  });

  test('hash is FNV-1a, so it never changes between app versions', () => {
    assert.equal(hashString(''), 0x811c9dc5);
    assert.equal(hashString('a'), 0xe40c292c);
  });

  test('round-trips, and repairs anything malformed rather than failing to sign in', () => {
    const user = userFromDoc('u', newUserFields('u'));
    assert.deepEqual(userFromDoc('u', userToFields(user)), user);
    const broken = userFromDoc('u', { displayName: 7, avatar: 'x', villages: ['v1', 3], textScale: 9 });
    assert.equal(broken.displayName, '');
    assert.deepEqual(broken.avatar, firstFace('u'));
    assert.deepEqual(broken.villages, ['v1']);
    assert.equal(broken.textScale, 2);
  });

  test('is created once, and found after that', async () => {
    let creates = 0;
    const docs = new Map<string, Record<string, unknown>>();
    const store: UserStore = {
      get: async (uid) => docs.get(uid) ?? null,
      create: async (uid, fields) => { creates++; docs.set(uid, { ...fields, createdAt: 1 }); },
      update: async (uid, fields) => { docs.set(uid, { ...docs.get(uid), ...fields }); },
    };
    const first = await ensureUser(store, 'u1');
    const again = await ensureUser(store, 'u1');
    assert.equal(first.created, true);
    assert.equal(again.created, false);
    assert.equal(creates, 1);
    assert.deepEqual(again.user, first.user);
  });
});

describe('a session, in preview', () => {
  const signIn = async (backend: ReturnType<typeof previewBackend>, phone: string) => {
    const pending = await backend.sendCode(phone);
    await pending.confirm(PREVIEW_CODE);
  };
  const latest = (backend: ReturnType<typeof previewBackend>) => new Promise<string | null>((resolve) => {
    const off = backend.subscribe((uid) => { off(); resolve(uid); });
  });

  test('signing in twice reuses the same user document; signing out returns to the start', async () => {
    const kv = memoryKeyValue();
    const backend = previewBackend(kv);
    assert.equal(await latest(backend), null, 'starts signed out');

    await signIn(backend, '+16505553434');
    const uid = await latest(backend);
    assert.equal(uid, previewUid('+16505553434'));
    const first = await ensureUser(backend.users, uid!);
    assert.equal(first.created, true);

    await backend.signOut();
    assert.equal(await latest(backend), null, 'back to the start');

    await signIn(backend, '+16505553434');
    const second = await ensureUser(backend.users, (await latest(backend))!);
    assert.equal(second.created, false);
    assert.deepEqual(second.user, first.user);
  });

  test('stays signed in across a restart', async () => {
    const kv = memoryKeyValue();
    await signIn(previewBackend(kv), '+16505553434');
    assert.equal(await latest(previewBackend(kv)), previewUid('+16505553434'));
  });

  test('a wrong code is refused with a code the screen can word', async () => {
    const pending = await previewBackend(memoryKeyValue()).sendCode('+16505553434');
    await assert.rejects(pending.confirm('000000'), { code: 'auth/invalid-verification-code' });
  });

  test('different numbers are different people', () => {
    assert.notEqual(previewUid('+16505553434'), previewUid('+16505553435'));
  });
});
