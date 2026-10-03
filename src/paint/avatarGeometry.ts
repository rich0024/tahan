// Tahan — avatar geometry.
//
// An avatar is six integers. There is no file, no upload, no crop, no image
// host: 5 skins × 5 hair colours × 8 styles × 4 beards × 4 glasses × 5 clothes
// is 16,000 faces out of about forty shapes.
//
// Straight transcription of `avatar(spec)` in Tahan.dc.html, using helpers
// with the same names and argument order, so it can be read against the
// prototype line for line. Do not reinterpret; if the prototype changes,
// re-transcribe.
//
// Authored in a 78-unit square. The coordinates below sit inside that square
// at an origin of (+7, +5) — the same offset the prototype's scaler applies —
// so the head lands on the box's centre line and a round crop takes head and
// shoulders. Painters apply AVATAR_ORIGIN; the numbers below are untouched.

import { AvatarKit, tahanInk, type AvatarSpec } from '../theme/palettes.ts';
import { cachedOps } from './pathParser.ts';
import { C, E, P, PS, R, type Layer } from './primitives.ts';

export const AVATAR_BOX = 78;
export const AVATAR_ORIGIN = { x: 7, y: 5 } as const;

/** Sizes in use, in points. */
export const AvatarSize = {
  feedRow: 26,
  statusRow: 34,
  header: 44,
  me: 96,
  editor: 216,
} as const;

/** A person, or one of the three companions. A companion belongs to the user. */
export type AvatarKind = 'person' | 'dog' | 'cat' | 'baby';

const ink = tahanInk;
const glint = '#F9F4ED';
const muzzle = '#F7F2E6';
const catNose = '#C96B7A';
const collarTag = '#F2D08A';
const babyCheek = '#E79A95';
const readerFrame = '#4A4038';

const mod = (n: number, m: number) => ((Math.trunc(n) % m) + m) % m;

/** The layer list for one avatar, in paint order. Pure geometry. */
export function avatarLayers(spec: AvatarSpec, kind: AvatarKind = 'person', coat = 0): Layer[] {
  const skin = AvatarKit.skins[mod(spec.skin, 5)];
  const hair = AvatarKit.hairColors[mod(spec.hairColor, 5)];
  const top = AvatarKit.clothes[mod(spec.top, 5)];
  const coatColor = AvatarKit.coats[mod(coat, 5)];
  const eyes = (y: number, r: number): Layer[] => [C(26, y, r, ink), C(38, y, r, ink)];

  if (kind === 'dog') {
    return [
      R(8, 54, 48, 14, coatColor, 1, 7),
      E(13, 24, 8, 15, -18, coatColor), E(51, 24, 8, 15, 18, coatColor),
      E(13, 27, 4.5, 9, -18, ink, 0.18), E(51, 27, 4.5, 9, 18, ink, 0.18),
      C(32, 32, 16, coatColor), E(32, 42, 11, 8.5, null, muzzle), C(32, 38, 3, ink),
      PS('M32 41 Q28 45 25 43', ink, 1.5), PS('M32 41 Q36 45 39 43', ink, 1.5),
      ...eyes(29, 2.1), C(27, 28, 0.8, glint, 0.8), C(39, 28, 0.8, glint, 0.8),
      E(32, 49, 14, 4.5, null, top), C(32, 53, 3, collarTag),
    ];
  }

  if (kind === 'cat') {
    return [
      P('M18 22 20 6 32 18Z', coatColor), P('M46 22 44 6 32 18Z', coatColor),
      R(8, 56, 48, 12, coatColor, 1, 6),
      C(32, 34, 15, coatColor), ...eyes(32, 2.2), P('M29 39 32 42 35 39Z', catNose),
      PS('M12 36 L22 38', ink, 1), PS('M52 36 L42 38', ink, 1),
      E(32, 51, 13, 4, null, top), C(32, 55, 2.8, collarTag),
    ];
  }

  if (kind === 'baby') {
    return [
      P('M10 66 C12 52 22 46 32 46 C42 46 52 52 54 66Z', top),
      C(32, 32, 15, skin), PS('M30 15 C32 10 36 11 36 15', hair, 3),
      ...eyes(31, 2), C(21, 36, 3.4, babyCheek, 0.55), C(43, 36, 3.4, babyCheek, 0.55),
      PS('M28 39 Q32 43 36 39', ink, 1.6),
    ];
  }

  // A person.
  const mass = C(32, 28, 15.4, hair);
  const back: Layer[] = [];
  const front: Layer[] = [];
  const style = mod(spec.hair, 8);

  if (style === 0) back.push(mass); // Short
  if (style === 1) back.push(R(15, 24, 8, 30, hair, 1, 4), R(41, 24, 8, 30, hair, 1, 4), mass); // Long
  if (style === 2) back.push(C(32, 13, 7.5, hair), mass); // Bun
  if (style === 3) back.push(C(20, 23, 8.5, hair), C(32, 17, 9.5, hair), C(44, 23, 8.5, hair), mass); // Curls
  if (style === 4) { back.push(mass); front.push(R(15, 21, 34, 8, top, 1, 4)); } // Wrap
  if (style === 5) back.push(R(14, 26, 7, 32, hair, 1, 3.5), R(43, 26, 7, 32, hair, 1, 3.5), // Braids
    C(17, 58, 4, hair), C(47, 58, 4, hair), mass);
  // style 6 is Bald: no hair layers at all.
  if (style === 7) { back.push(mass); front.push(P('M16 28 C15 12 49 12 48 28 L48 25 16 25Z', hair), R(13, 24, 38, 6, hair, 1, 3)); } // Cap

  const g = mod(spec.glasses, 4);
  const fc = mod(spec.face, 4);
  const acc: Layer[] = [];

  // Facial hair first, glasses over it.
  if (fc === 1) acc.push(P('M19 36 C19 52 26 57 32 57 C38 57 45 52 45 36 C41 43 38 45 32 45 C26 45 23 43 19 36Z', hair, 0.92)); // Beard
  if (fc === 2) acc.push(P('M24 44 C27 42 30 43 32 44 C34 43 37 42 40 44 C37 47 34 47 32 46 C30 47 27 47 24 44Z', hair)); // Moustache
  if (fc === 3) acc.push(P('M20 38 C21 51 26 56 32 56 C38 56 43 51 44 38 C41 44 38 46 32 46 C26 46 23 44 20 38Z', hair, 0.3)); // Stubble

  const frame = g === 3 ? readerFrame : ink;
  if (g === 1) acc.push(C(26, 33, 7, frame), C(26, 33, 5.4, skin), C(38, 33, 7, frame), C(38, 33, 5.4, skin), // Round
    R(31.4, 32.3, 1.2, 1.4, frame));
  if (g === 2) acc.push(R(20, 28, 12, 10, frame, 1, 3), R(21.5, 29.5, 9, 7, skin, 1, 2), // Square
    R(32, 28, 12, 10, frame, 1, 3), R(33.5, 29.5, 9, 7, skin, 1, 2), R(31.4, 32.3, 1.2, 1.4, frame));
  if (g === 3) acc.push(R(19.5, 29, 12.5, 9, frame, 1, 2), R(21, 30.4, 9.5, 6.2, skin, 1, 1.5), // Readers — temple
    R(31.5, 29, 12.5, 9, frame, 1, 2), R(33, 30.4, 9.5, 6.2, skin, 1, 1.5), //   arms, because that's
    R(31.2, 33, 1.6, 1.3, frame), PS('M19.5 31 L14 29', frame, 1.5), PS('M44 31 L49.5 29', frame, 1.5)); // what reads as a grandparent's pair
  // Eyes again over the lens fill, so they read through the glass.
  if (g > 0) acc.push(...eyes(33, 1.9));

  return [
    P('M6 66 C9 50 21 43 32 43 C43 43 55 50 58 66Z', top),
    C(19, 34, 3.4, skin), C(45, 34, 3.4, skin),
    ...back, C(32, 33, 14, skin), ...front,
    ...eyes(33, 1.9), PS('M27 40 Q32 44 37 40', ink, 1.6), ...acc,
  ];
}

/** Every combination's name, for labels and the editor. */
export function describeSpec(spec: AvatarSpec): string {
  return [
    AvatarKit.hairNames[mod(spec.hair, 8)],
    AvatarKit.glassesNames[mod(spec.glasses, 4)],
    AvatarKit.faceNames[mod(spec.face, 4)],
  ].join(' · ');
}

// ---------------------------------------------------------------------------
// The backdrop. A face is drawn on its village's sky, with a soft hill in
// accent-2 behind the shoulders — exactly as the prototype's `avFor()` does.
//
// The prototype authors the hill in scene space (402×216) and shows a round
// avatar as the centre 216×216 of that scene. So in the 78-unit box, scene
// space is reached by scaling 78/216 and shifting left by (402 − 216) / 2.
// Painters apply this transform rather than re-authoring the hill, so the
// path stays the prototype's own.

export const AVATAR_GROUND = {
  d: 'M0 216 Q201 150 402 206 L402 216Z',
  opacity: 0.5,
} as const;

export const SCENE_TO_AVATAR_BOX = {
  scale: AVATAR_BOX / 216,
  dx: -(402 - 216) / 2,
} as const;

/**
 * Parse every path an avatar can ever use, now. Called once at launch so a bad
 * path throws on the first run, where somebody is looking, rather than on the
 * frame that first draws a particular beard.
 */
export function warmAvatarPaths(): number {
  const seen = new Set<string>([AVATAR_GROUND.d]);
  const collect = (layers: Layer[]) => {
    for (const l of layers) if (l.kind === 'fillPath' || l.kind === 'strokePath') seen.add(l.d);
  };
  for (let hair = 0; hair < 8; hair++)
    for (let glasses = 0; glasses < 4; glasses++)
      for (let face = 0; face < 4; face++)
        collect(avatarLayers({ skin: 0, hairColor: 0, top: 0, hair, glasses, face }));
  for (const kind of ['dog', 'cat', 'baby'] as const) collect(avatarLayers(defaultFace, kind));
  for (const d of seen) cachedOps(d);
  return seen.size;
}

const defaultFace: AvatarSpec = { skin: 0, hairColor: 0, top: 0, hair: 0, glasses: 0, face: 0 };
