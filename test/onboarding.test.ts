// Onboarding: the four screens, the fork, and the invitation that skips the
// welcome. T1.7 is done when a cold start with no account walks welcome →
// number → code → name and face and lands on the fork, and an invitation
// link skips the welcome.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  cleanName, isInviteCode, isOnboarded, parseInviteLink, startRoute, surpriseFace,
} from '../src/auth/onboarding.ts';
import { PREVIEW_CODE, memoryKeyValue, previewBackend } from '../src/auth/previewBackend.ts';
import { changesToFields, ensureUser, firstFace, userFromDoc, type TahanUser } from '../src/data/user.ts';
import { specToMap } from '../src/theme/palettes.ts';
import { contrast, withAlpha } from '../src/theme/oklch.ts';
import { TahanEvening } from '../src/theme/palettes.ts';

const fresh = (uid = 'u1'): TahanUser => userFromDoc(uid, {});
const named = (uid = 'u1'): TahanUser => ({ ...fresh(uid), displayName: 'Mateo' });

describe('where the app opens', () => {
  test('a cold start with no account walks the four screens and lands on the fork', () => {
    assert.equal(startRoute(null, null), '/welcome');
    assert.equal(startRoute(fresh(), null), '/face', 'after the code: name and first face');
    assert.equal(startRoute(named(), null), '/fork', 'then the fork');
  });

  test('someone in a village opens on it; an invitation still comes first', () => {
    const villager = { ...named(), villages: ['v1'] };
    assert.equal(startRoute(villager, null), '/village');
    assert.equal(startRoute(villager, 'abc123'), '/invite/abc123');
  });

  test('an invitation link skips the welcome, and comes back after the face', () => {
    assert.equal(startRoute(null, 'abc123'), '/phone');
    assert.equal(startRoute(fresh(), 'abc123'), '/face');
    assert.equal(startRoute(named(), 'abc123'), '/invite/abc123');
  });

  test('a name is what finishes onboarding — spaces are not a name', () => {
    assert.ok(!isOnboarded(fresh()));
    assert.ok(!isOnboarded({ ...fresh(), displayName: '   ' }));
    assert.ok(isOnboarded(named()));
  });
});

describe('names', () => {
  test('trimmed, single-spaced, and kept to forty characters', () => {
    assert.equal(cleanName('  Lola   Rosa \n'), 'Lola Rosa');
    assert.equal(cleanName(''), '');
    assert.equal(cleanName('x'.repeat(60)).length, 40);
    assert.equal(cleanName(`${'a'.repeat(39)} b`), 'a'.repeat(39));
  });
});

describe('invitation links', () => {
  test('finds the code in a link, or in a whole pasted message', () => {
    assert.equal(parseInviteLink('tahan://invite/AbC123'), 'AbC123');
    assert.equal(parseInviteLink('https://tahan.app/invite/x_y-z12'), 'x_y-z12');
    assert.equal(parseInviteLink('Rosa invited you to Tahan: https://tahan.app/invite/abc123def — see you there'), 'abc123def');
  });

  test('a bare word, a short code or another link is not an invitation', () => {
    for (const text of ['abc123', 'tahan://invite/abc', 'https://example.com/join/abc123', 'tahan://invite/abc123!x', '']) {
      assert.equal(parseInviteLink(text), text === 'tahan://invite/abc123!x' ? 'abc123' : null, text);
    }
    assert.ok(isInviteCode('abc123'));
    assert.ok(!isInviteCode('abc'));
    assert.ok(!isInviteCode('../etc'));
  });
});

describe('surprise me', () => {
  test('starts from the first face and gives a different face each press, the same every time', () => {
    assert.deepEqual(surpriseFace('u1', 0), firstFace('u1'));
    const faces = Array.from({ length: 30 }, (_, n) => JSON.stringify(surpriseFace('u1', n)));
    assert.equal(new Set(faces).size, 30);
    assert.deepEqual(surpriseFace('u1', 7), surpriseFace('u1', 7));
    assert.notDeepEqual(surpriseFace('u1', 7), surpriseFace('u2', 7));
  });
});

describe('coming in', () => {
  test('the name and face are saved, and the next sign-in finds them', async () => {
    const backend = previewBackend(memoryKeyValue());
    await (await backend.sendCode('+16505553434')).confirm(PREVIEW_CODE);
    const uid = await new Promise<string>((r) => { const off = backend.subscribe((u) => { if (u) { off(); r(u); } }); });
    const { user } = await ensureUser(backend.users, uid);
    const avatar = surpriseFace(uid, 3);
    await backend.users.update(uid, changesToFields({ displayName: 'Mateo', avatar }));
    const again = await ensureUser(backend.users, uid);
    assert.equal(again.created, false);
    assert.equal(again.user.displayName, 'Mateo');
    assert.deepEqual(again.user.avatar, avatar);
    assert.deepEqual(again.user.villages, user.villages);
    assert.equal(startRoute(again.user, null), '/fork');
  });

  test('only the changed fields are written', () => {
    assert.deepEqual(changesToFields({ displayName: 'Mateo' }), { displayName: 'Mateo' });
    assert.deepEqual(changesToFields({ avatar: firstFace('u') }), { avatar: specToMap(firstFace('u')) });
  });
});

describe('the welcome', () => {
  test('cream type over the scrim passes AA with room to spare, even at 70% for the footnote', () => {
    assert.ok(contrast(TahanEvening.cream, TahanEvening.scrim) > 12);
    // The footnote is cream at 70% over the scrim: still well past 4.5.
    const footnote = '#' + [0, 1, 2].map((i) => {
      const c = parseInt(TahanEvening.cream.slice(1 + 2 * i, 3 + 2 * i), 16);
      const b = parseInt(TahanEvening.scrim.slice(1 + 2 * i, 3 + 2 * i), 16);
      return Math.round(0.7 * c + 0.3 * b).toString(16).padStart(2, '0');
    }).join('');
    assert.ok(contrast(footnote, TahanEvening.scrim) > 7, footnote);
  });

  test('withAlpha gives an rgba() both React Native and Skia read', () => {
    assert.equal(withAlpha('#1C1814', 0.94), 'rgba(28, 24, 20, 0.94)');
    assert.equal(withAlpha('#FFFFFF', 2), 'rgba(255, 255, 255, 1)');
  });
});

describe('the evening artwork', () => {
  test('every path parses, and nothing is drawn outside its box', async () => {
    const { welcomeLayers, bandLayers, firstFaceLayers, WELCOME_W, WELCOME_H, BAND_W, BAND_H } = await import('../src/paint/eveningScene.ts');
    const { allPaths, layerBounds } = await import('../src/paint/primitives.ts');
    const { parsePath } = await import('../src/paint/pathParser.ts');
    for (const [layers, w, h] of [[welcomeLayers(), WELCOME_W, WELCOME_H], [bandLayers(), BAND_W, BAND_H]] as const) {
      for (const d of allPaths(layers)) assert.doesNotThrow(() => parsePath(d), d);
      const b = layerBounds(layers);
      assert.ok(b.left >= 0 && b.top >= 0 && b.right <= w && b.bottom <= h);
    }
    for (const inset of [0, 24, 59]) {
      for (let n = 0; n < 40; n++) {
        const layers = firstFaceLayers(surpriseFace('u', n), 402, 340, inset);
        const figure = layerBounds([layers[1]]);
        assert.ok(figure.top >= inset - 0.5, `hair under the status bar: ${figure.top}`);
        assert.ok(figure.bottom >= 340, 'the figure reaches the bottom of the sky');
      }
    }
  });

  test('the house stays just above the text, however tall the text grows', async () => {
    const { welcomePlacement, WELCOME_TEXT_TOP } = await import('../src/paint/eveningScene.ts');
    for (const textTop of [300, 480, 620]) {
      const { scale, y } = welcomePlacement(390, textTop);
      assert.equal(Math.round(y + WELCOME_TEXT_TOP * scale), textTop);
      assert.ok(y + 522 * scale < textTop, 'the house sits above the text');
    }
  });
});
