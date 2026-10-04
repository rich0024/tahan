// The face editor's model: what it offers, in what order, and what each
// control does to a spec. T1.8 is done when changes render instantly,
// survive a force-quit and every control is at least 56pt — the first and
// last are proven on a device; what's provable here is that every change
// lands in the spec that gets saved, and the spec survives the round trip.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  colourAt, colourName, companionParts, hasOddEyes, hueColour, hueOf, isOnRange, personParts,
  positionOf, surpriseCompanion, valueOf, withColour, withOddEyes, withOption,
} from '../src/editor/kit.ts';
import { surpriseFace } from '../src/auth/onboarding.ts';
import { changesToFields, userFromDoc, userToFields, type TahanCompanion } from '../src/data/user.ts';
import { avatarLayers } from '../src/paint/avatarGeometry.ts';
import { companionLayers } from '../src/paint/companionGeometry.ts';
import {
  AvatarKit, CompanionKit, defaultCompanion, defaultSpec, sampleCompanions, specFromMap, specToMap,
} from '../src/theme/palettes.ts';

describe('what the editor offers', () => {
  test('a person in the lab\'s order, with every style and colour field the spec has', () => {
    const parts = personParts();
    assert.deepEqual(parts.map((p) => p.key), ['skin', 'hair', 'eyes', 'glasses', 'mouth', 'facial', 'extra', 'top']);
    const fields = new Set(parts.flatMap((p) => [p.options ? p.key : null, p.colour?.field].filter(Boolean)));
    assert.deepEqual([...fields].sort(), Object.keys(defaultSpec).sort(), 'every field of a face has a control');
  });

  test('a pet gets fur, ears or coat, markings, eyes and extras; a baby skin, hair and a onesie', () => {
    assert.deepEqual(companionParts({ ...defaultCompanion, kind: 0 }, false).map((p) => p.title),
      ['Companion', 'Fur', 'Ears', 'Markings', 'Eyes', 'Extras']);
    assert.deepEqual(companionParts({ ...defaultCompanion, kind: 1 }, false).map((p) => p.title),
      ['Companion', 'Fur', 'Coat', 'Markings', 'Eyes', 'Extras']);
    assert.deepEqual(companionParts({ ...defaultCompanion, kind: 2 }, false).map((p) => p.title),
      ['Companion', 'Skin', 'Hair', 'Onesie', 'Extras']);
  });

  test('the second eye appears only with the switch on', () => {
    const eyes = (odd: boolean) => companionParts(defaultCompanion, odd).find((p) => p.key === 'eyes')!;
    assert.equal(eyes(false).colour2, undefined);
    assert.equal(eyes(true).colour2?.field, 'eyeColor2');
    assert.equal(eyes(true).colour?.label, 'Left eye');
  });

  test('every style option draws something different from where it starts', () => {
    for (const part of personParts().filter((p) => p.options)) {
      const seen = new Set(part.options!.map((_, i) => JSON.stringify(avatarLayers(withOption(defaultSpec, part.key, i)))));
      assert.equal(seen.size, part.options!.length, part.key);
    }
  });
});

describe('changing a face', () => {
  test('a style, a swatch, a slider position and any colour each land in the spec', () => {
    let s = withOption(defaultSpec, 'hair', 4);
    s = withColour(s, 'topColor', AvatarKit.clothSwatches[2]);
    s = withColour(s, 'skin', 0.8);
    s = withColour(s, 'hairColor', hueColour(250));
    assert.equal(s.hair, 4);
    assert.equal(s.topColor, AvatarKit.clothSwatches[2]);
    assert.equal(s.skin, 0.8);
    assert.equal(valueOf(s, 'hairColor'), hueColour(250));
    assert.deepEqual(specFromMap(specToMap(s)), s, 'and survive the round trip to the database');
  });

  test('a companion\'s kind change keeps its styles valid', () => {
    const cat = withOption({ ...defaultCompanion, style: 2, markings: 3 }, 'kind', 1);
    assert.ok(cat.style < CompanionKit.styles[1].length);
    const baby = withOption(cat, 'kind', 2);
    assert.equal(baby.markings, 0);
    assert.doesNotThrow(() => companionLayers(baby));
  });

  test('matching eyes stay matching; with the switch on each eye is its own', () => {
    const one = withColour(defaultCompanion, 'eyeColor', '#7FB2D9');
    assert.equal(one.eyeColor2, '#7FB2D9');
    assert.ok(!hasOddEyes(one));
    const odd = withColour(withColour(one, 'eyeColor', '#6B4A2E', true), 'eyeColor2', '#7FB2D9', true);
    assert.ok(hasOddEyes(odd));
    assert.equal(withOddEyes(odd, false).eyeColor2, '#6B4A2E', 'switching off matches the right eye to the left');
  });
});

describe('colours', () => {
  test('a slider finds where a saved colour sits on its range', () => {
    for (const t of [0, 0.13, 0.5, 0.77, 1]) {
      const hex = colourAt(AvatarKit.hairRange, t);
      assert.ok(Math.abs(positionOf(AvatarKit.hairRange, hex) - t) < 0.02, `t=${t}`);
      assert.ok(isOnRange(AvatarKit.hairRange, hex));
    }
    assert.ok(!isOnRange(AvatarKit.hairRange, hueColour(250)), 'blue hair is "any colour", not on the natural range');
  });

  test('any colour goes all the way round, and reads back its hue', () => {
    const hues = new Set([0, 60, 120, 180, 240, 300].map((h) => hueColour(h)));
    assert.equal(hues.size, 6);
    for (const h of [30, 150, 250]) assert.ok(Math.abs(hueOf(hueColour(h)) - h) < 4, `hue ${h}`);
  });

  test('every swatch has a plain name, and swatches in a row are told apart', () => {
    const rows = [AvatarKit.eyeSwatches, AvatarKit.clothSwatches, AvatarKit.frameSwatches, AvatarKit.extraSwatches,
      CompanionKit.eyeSwatches, CompanionKit.markingSwatches, CompanionKit.onesieSwatches];
    for (const row of rows) for (const hex of row) assert.match(colourName(hex), /^[a-z ]+$/, hex);
    assert.equal(colourName('#FFFFFF'), 'white');
    assert.equal(colourName('#000000'), 'black');
    assert.equal(colourName('#7FB2D9'), 'light blue');
    assert.match(colourName('#5C3D27'), /brown/);
  });
});

describe('surprise me', () => {
  test('people and companions: a stable sequence, different each press, always drawable', () => {
    const faces = new Set(Array.from({ length: 20 }, (_, n) => JSON.stringify(surpriseFace('u', n))));
    assert.equal(faces.size, 20);
    for (let kind = 0; kind < 3; kind++) {
      const pets = Array.from({ length: 20 }, (_, n) => surpriseCompanion('u', n, kind));
      assert.equal(new Set(pets.map((p) => JSON.stringify(p))).size, 20, CompanionKit.kinds[kind]);
      assert.deepEqual(surpriseCompanion('u', 3, kind), pets[3]);
      for (const p of pets) {
        assert.equal(p.kind, kind);
        assert.doesNotThrow(() => companionLayers(p));
        if (kind === 2) assert.ok(!hasOddEyes(p), 'babies are never surprised with odd eyes');
      }
    }
    const odd = Array.from({ length: 200 }, (_, n) => surpriseCompanion('u', n, 0)).filter(hasOddEyes).length;
    assert.ok(odd > 10 && odd < 60, `about one in seven dogs is odd-eyed: ${odd}`);
  });
});

describe('a companion in the user document', () => {
  test('keeps its name, and the whole thing round-trips', () => {
    const { name: _sample, ...spec } = sampleCompanions[1];
    const kuya: TahanCompanion = { ...spec, name: 'Kuya' };
    const user = { ...userFromDoc('u', {}), displayName: 'Richard', companion: kuya };
    assert.deepEqual(userFromDoc('u', userToFields(user)), user);
    assert.deepEqual(changesToFields({ companion: null }), { companion: null }, 'removing one writes null');
  });

  test('a stored name too long, or not a name, is repaired', () => {
    const u = userFromDoc('u', { companion: { ...defaultCompanion, name: 'x'.repeat(80) } });
    assert.equal(u.companion?.name.length, 30);
    assert.equal(userFromDoc('u', { companion: { kind: 1, name: 5 } }).companion?.name, '');
  });
});
