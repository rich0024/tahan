// Tahan — companion geometry: dog, cat and baby, in the detailed kit.
//
// Same rules as people (avatarGeometry.ts): a 200×200 box, absolute M L Q C Z
// paths only, one base colour per part with shading derived in OKLab, the
// figure drawn 10% larger than authored, shading clipped to the head, and
// fine detail dropped under 44pt.
//
// Ported from the avatar lab (design/avatar-lab.html), where the companions
// were designed and approved.

import { alongStops, tone } from '../theme/oklch.ts';
import {
  AvatarKit, COMPANION_BABY, COMPANION_CAT, COMPANION_DOG, fitCompanion, type CompanionSpec,
} from '../theme/palettes.ts';
import { FIGURE_TRANSFORM, mirror } from './avatarGeometry.ts';
import { cachedOps } from './pathParser.ts';
import { C, E, G, OVAL_RING, P, PS, RING, allPaths, type Layer } from './primitives.ts';

const INK = '#2A1E19';
const WHITE = '#FFFFFF';
const PINK = '#E8A9A0';
const TONGUE = '#E07A6A';
const BLUSH = '#E8735F';
const GOLD = '#E3B04B';
const LIP = '#7A2E28';

export const DOG_HEAD = 'M58 100 C58 66 78 50 100 50 C122 50 142 66 142 100 C142 128 124 146 100 146 C76 146 58 128 58 100 Z';
export const CAT_HEAD = 'M60 106 C58 76 76 58 100 58 C124 58 142 76 140 106 C140 130 122 146 100 146 C78 146 60 130 60 106 Z';
export const BABY_HEAD = 'M60 102 C60 68 78 52 100 52 C122 52 140 68 140 102 C140 130 122 146 100 146 C78 146 60 130 60 102 Z';
const CHEST = 'M28 200 C32 168 60 150 100 150 C140 150 168 168 172 200 Z';
const CHEST_SIDE = 'M28 200 C31 184 40 172 52 164 C50 178 50 190 52 200 Z';

const both = (d: string, fn: (d: string) => Layer[]): Layer[] => [...fn(d), ...fn(mirror(d))];

interface Fur {
  readonly main: string;
  readonly shade: string;
  readonly deep: string;
  readonly light: string;
  readonly muzzle: string;
}

function furTones(main: string): Fur {
  return {
    main,
    shade: tone(main, -0.09, 1.05),
    deep: tone(main, -0.17, 1.1),
    light: tone(main, 0.08, 0.85),
    muzzle: tone(main, 0.12, 0.6),
  };
}

/** The layer list for one companion, in paint order, in the 200-unit box. */
export function companionLayers(input: CompanionSpec, small = false): Layer[] {
  const spec = fitCompanion(input);
  const k = small ? 1.45 : 1;
  const body = spec.kind === COMPANION_DOG ? dog(spec, small, k)
    : spec.kind === COMPANION_CAT ? cat(spec, small, k)
      : baby(spec, small, k);
  return [G(body, { transform: FIGURE_TRANSFORM })];
}

// ---------------------------------------------------------------------------

function dog(s: CompanionSpec, small: boolean, k: number): Layer[] {
  const f = furTones(s.mainColor);
  const m = s.markingColor;
  const o: Layer[] = [];

  o.push(P(CHEST, f.main), ...both(CHEST_SIDE, (d) => [P(d, f.shade)]));
  o.push(P('M74 146 C82 158 118 158 126 146 L128 152 C118 164 82 164 72 152 Z', f.shade, 0.7));
  if (s.markings === 3) o.push(C(66, 182, 7, m), C(138, 176, 5, m), C(124, 194, 6, m));
  if (s.markings === 2) o.push(P('M84 152 C90 168 110 168 116 152 C110 160 90 160 84 152 Z', m)); // blaze runs onto the chest
  if (s.style === 0) o.push(...both('M66 64 C50 62 40 82 41 106 C42 122 50 132 61 128 C66 112 68 92 72 70 Z', (d) => [P(d, f.shade)])); // floppy, behind

  o.push(P(DOG_HEAD, f.main));
  const inside: Layer[] = [P('M128 60 C144 80 146 116 120 146 L150 146 L150 60 Z', f.shade, 0.5)];
  if (s.markings === 1) inside.push(E(83, 92, 15, 13, null, m));
  if (s.markings === 2) inside.push(P('M93 46 C95 62 96 78 92 96 L108 96 C104 78 105 62 107 46 Z', m));
  if (s.markings === 3) inside.push(C(122, 66, 8, m), C(70, 118, 6, m));
  o.push(G(inside, { clip: DOG_HEAD }));

  if (s.style === 1) { // pointy
    o.push(...both('M70 72 L62 30 C74 34 86 46 92 56 Z', (d) => [P(d, f.main)]));
    if (!small) o.push(...both('M72 64 L67 40 C75 44 83 52 86 57 Z', (d) => [P(d, PINK, 0.55)]));
  }
  if (s.style === 2) o.push(...both('M64 66 C58 48 70 38 86 44 C90 52 86 60 80 64 C74 68 68 68 64 66 Z', (d) => [P(d, f.shade)])); // folded

  o.push(E(100, 118, 25, 19, null, s.markings === 2 ? m : f.muzzle));
  o.push(E(100, 128, 18, 9, null, f.shade, 0.25));
  o.push(...roundEyes(84, 116, 92, s.eyeColor, s.eyeColor2, small));
  if (!small) o.push(...both('M77 82 C80 79 85 79 88 81', (d) => [PS(d, f.deep, 3, 0.6)]));

  o.push(P('M89 108 C89 101 111 101 111 108 C111 115 104 118 100 118 C96 118 89 115 89 108 Z', INK));
  if (!small) o.push(E(95, 105, 4, 2, null, WHITE, 0.6));
  o.push(PS('M100 118 L100 124', INK, 2.2 * k), ...both('M100 124 C96 130 89 130 86 125', (d) => [PS(d, INK, 2.2 * k)]));
  if (!small) o.push(P('M94 127 C94 136 106 136 106 127 C103 129 97 129 94 127 Z', TONGUE));
  o.push(...petAccessory(s, small));
  return o;
}

function cat(s: CompanionSpec, small: boolean, k: number): Layer[] {
  const f = furTones(s.mainColor);
  const m = s.markingColor;
  const o: Layer[] = [];

  o.push(P(CHEST, f.main), ...both(CHEST_SIDE, (d) => [P(d, f.shade)]));
  if (s.style === 1 && !small) o.push(P('M70 150 L78 162 L84 154 L92 168 L100 156 L108 168 L116 154 L122 162 L130 150 C118 158 82 158 70 150 Z', f.light)); // chest fluff
  if (s.markings === 3) o.push(P('M80 152 C86 176 92 192 100 200 C108 192 114 176 120 152 C112 158 88 158 80 152 Z', m)); // tuxedo bib

  o.push(...both('M66 90 L62 40 C76 44 90 56 94 64 Z', (d) => [P(d, f.main)]));
  if (!small) o.push(...both('M70 82 L68 52 C76 56 84 62 87 66 Z', (d) => [P(d, PINK, 0.75)]));
  if (s.style === 1 && !small) o.push(...both('M64 44 L60 34 L67 40 Z', (d) => [P(d, f.main)])); // ear tufts

  o.push(P(CAT_HEAD, f.main));
  if (s.style === 1) o.push(...both('M62 112 L50 118 L60 122 L52 132 L64 132 L60 140 L72 138 Z', (d) => [P(d, f.main)])); // cheek ruff
  const inside: Layer[] = [P('M128 66 C144 86 146 118 120 146 L150 146 L150 66 Z', f.shade, 0.5)];
  if (s.markings === 1) { // tabby
    inside.push(PS('M100 62 L100 78', m, 3.4 * k), PS('M90 64 L92 77', m, 3 * k), PS('M110 64 L108 77', m, 3 * k));
    inside.push(...both('M60 104 L72 106', (d) => [PS(d, m, 3 * k)]), ...both('M61 114 L71 114', (d) => [PS(d, m, 3 * k)]));
  }
  if (s.markings === 2) inside.push(P('M58 58 L104 58 C100 72 92 84 80 92 C70 96 62 96 58 94 Z', m));
  if (s.markings === 3) inside.push(P('M86 146 C86 126 92 116 100 116 C108 116 114 126 114 146 Z', m));
  o.push(G(inside, { clip: CAT_HEAD }));

  // Almond eyes with a slit pupil, each its own colour.
  const almond = 'M74 100 C78 92 90 92 94 100 C90 108 78 108 74 100 Z';
  o.push(P(almond, small ? INK : s.eyeColor), P(mirror(almond), small ? INK : s.eyeColor2));
  if (!small) {
    o.push(E(84, 100, 1.9, 5.6, null, INK), E(116, 100, 1.9, 5.6, null, INK));
    o.push(C(87, 97.5, 1.4, WHITE), C(119, 97.5, 1.4, WHITE));
    o.push(...both('M74 100 C78 92 90 92 94 100', (d) => [PS(d, INK, 2)]));
  }

  o.push(P('M95 113 C95 111 105 111 105 113 C104 116 102 118 100 118 C98 118 96 116 95 113 Z', PINK));
  o.push(PS('M100 118 L100 122', INK, 1.8 * k), ...both('M100 122 C97 126 92 126 90 123', (d) => [PS(d, INK, 1.8 * k)]));
  if (!small) {
    o.push(...both('M84 118 L60 114', (d) => [PS(d, INK, 1.1, 0.45)]), ...both('M84 122 L60 124', (d) => [PS(d, INK, 1.1, 0.45)]));
  }
  o.push(...petAccessory(s, small));
  return o;
}

function baby(s: CompanionSpec, small: boolean, k: number): Layer[] {
  const skin = alongStops(AvatarKit.skinRange, s.skin);
  const shade = tone(skin, -0.075, 1.15);
  const light = tone(skin, 0.045, 0.9);
  const hair = s.hairColor;
  const hairLight = tone(hair, 0.1);
  const top = s.mainColor;
  const topShade = tone(top, -0.09, 1.05);
  const topLight = tone(top, 0.07, 0.95);
  const o: Layer[] = [];

  // Onesie and neck.
  o.push(P('M34 200 C38 174 64 158 100 158 C136 158 162 174 166 200 Z', top), ...both('M34 200 C37 186 45 176 56 170 C54 182 54 192 56 200 Z', (d) => [P(d, topShade)]));
  o.push(P('M84 158 C88 168 112 168 116 158 C110 162 90 162 84 158 Z', shade));
  o.push(PS('M82 158 C88 170 112 170 118 158', topLight, 3.2));
  if (!small) o.push(C(100, 182, 2.4, topLight), C(100, 194, 2.4, topLight));
  o.push(P('M88 138 L112 138 L112 160 C106 164 94 164 88 160 Z', skin));
  o.push(...both('M62 98 C55 95 51 101 53 108 C55 114 61 116 65 112 Z', (d) => [P(d, skin)]));

  o.push(P(BABY_HEAD, skin));
  o.push(G([P('M126 62 C140 80 142 116 120 146 L146 146 L146 62 Z', shade, 0.5), E(84, 64, 12, 6, null, light, 0.7)], { clip: BABY_HEAD }));

  // Hair.
  if (s.style === 0) o.push(PS('M96 54 C90 42 104 34 110 42 C114 48 106 54 102 50', hair, 4.6 * k)); // tuft
  if (s.style === 1) {
    o.push(...[[84, 58, 7], [96, 53, 8], [108, 53, 8], [120, 58, 7]].map(([x, y, r]) => C(x, y, r, hair)));
    if (!small) o.push(...[[94, 50], [107, 50]].map(([x, y]) => C(x, y, 2.4, hairLight, 0.8)));
  }
  if (s.style === 2) o.push(...['M88 56 C88 48 92 44 96 42', 'M100 54 C100 46 102 42 106 40', 'M112 56 C112 48 114 46 118 44'].map((d) => PS(d, hair, 2.6 * k)));

  // Cheeks, eyes, brows.
  if (!small) o.push(E(76, 120, 9, 5.5, null, BLUSH, 0.28), E(124, 120, 9, 5.5, null, BLUSH, 0.28));
  o.push(C(84, 104, small ? 5.2 : 6.2, INK), C(116, 104, small ? 5.2 : 6.2, INK));
  o.push(C(86.4, 101.4, small ? 1.6 : 2.2, WHITE), C(118.4, 101.4, small ? 1.6 : 2.2, WHITE));
  if (!small) o.push(C(82, 106.5, 0.9, WHITE, 0.8), C(114, 106.5, 0.9, WHITE, 0.8));
  if (!small) o.push(...both('M77 92 C81 89 87 89 90 91', (d) => [PS(d, hairLight, 2.4, 0.7)]));

  // Nose and mouth — the pacifier covers the mouth.
  o.push(PS('M98 113 C99 115 101 115 102 113', tone(skin, -0.3, 1.1), 2 * k, 0.6));
  if (s.accessory !== 3) {
    if (small) o.push(PS('M93 123 C97 128 103 128 107 123', LIP, 2.4 * k));
    else {
      o.push(P('M92 122 C96 124 104 124 108 122 C107 129 103 132 100 132 C97 132 93 129 92 122 Z', LIP));
      o.push(P('M95 128.5 C97.5 126.5 102.5 126.5 105 128.5 C103 130.6 97 130.6 95 128.5 Z', TONGUE));
    }
  }
  o.push(...babyAccessory(s, small));
  return o;
}

// ---------------------------------------------------------------------------

function roundEyes(xl: number, xr: number, y: number, irisL: string, irisR: string, small: boolean): Layer[] {
  if (small) return [C(xl, y, 5, INK), C(xr, y, 5, INK), C(xl + 1.5, y - 1.6, 1.4, WHITE), C(xr + 1.5, y - 1.6, 1.4, WHITE)];
  return ([[xl, irisL], [xr, irisR]] as const).flatMap(([x, iris]) => [
    C(x, y, 7, iris), C(x, y, 4.2, INK), C(x + 2.3, y - 2.4, 2, WHITE), C(x - 2, y + 2.4, 0.9, WHITE, 0.8),
    PS(`M${x - 7.5} ${y - 2} C${x - 4} ${y - 8} ${x + 4} ${y - 8} ${x + 7.5} ${y - 2}`, INK, 2.2),
  ]);
}

function bow(x: number, y: number, c: string, sh: string, small: boolean): Layer[] {
  return [
    P(`M${x} ${y} C${x - 10} ${y - 14} ${x - 22} ${y - 6} ${x - 18} ${y + 4} C${x - 14} ${y + 12} ${x - 4} ${y + 6} ${x} ${y} Z`, c),
    P(`M${x} ${y} C${x + 10} ${y - 14} ${x + 22} ${y - 6} ${x + 18} ${y + 4} C${x + 14} ${y + 12} ${x + 4} ${y + 6} ${x} ${y} Z`, c),
    ...(small ? [] : [P(`M${x} ${y} C${x - 8} ${y - 6} ${x - 14} ${y - 2} ${x - 14} ${y + 2} C${x - 10} ${y} ${x - 4} ${y + 2} ${x} ${y} Z`, sh, 0.6)]),
    C(x, y, 4.2, sh),
  ];
}

function petAccessory(s: CompanionSpec, small: boolean): Layer[] {
  const c = s.accessoryColor;
  const sh = tone(c, -0.1, 1.05);
  switch (s.accessory) {
    case 1: // collar with a tag
      return [
        P('M66 146 C80 157 120 157 134 146 L136 155 C120 168 80 168 64 155 Z', c),
        P('M64 155 C80 168 120 168 136 155 L136 152 C120 164 80 164 64 152 Z', sh, 0.6),
        C(100, 170, 6, GOLD),
        ...(small ? [] : [C(98, 168, 1.6, WHITE, 0.7)]),
      ];
    case 2: // bandana
      return [
        P('M64 148 C80 160 120 160 136 148 L138 158 C126 166 112 170 100 190 C88 170 74 166 62 158 Z', c),
        P('M100 190 C108 176 118 168 132 162 C122 168 110 176 100 190 Z', sh, 0.6),
        ...(small ? [] : [[86, 166], [100, 176], [114, 166], [94, 158], [108, 158]].map(([x, y]) => C(x, y, 1.8, WHITE, 0.8))),
      ];
    case 3:
      return bow(122, 58, c, sh, small);
    default:
      return [];
  }
}

function babyAccessory(s: CompanionSpec, small: boolean): Layer[] {
  const c = s.accessoryColor;
  const sh = tone(c, -0.1, 1.05);
  switch (s.accessory) {
    case 1: // bow on a headband
      return [PS('M64 82 C70 60 130 60 136 82', c, 4.2), ...bow(118, 60, c, sh, small)];
    case 2: // beanie
      return [
        P('M58 86 C56 54 78 38 100 38 C122 38 144 54 142 86 C126 80 74 80 58 86 Z', c),
        P('M56 86 C74 78 126 78 144 86 L144 96 C126 88 74 88 56 96 Z', sh),
        ...(small ? [] : [70, 82, 94, 106, 118, 130].map((x) => PS(`M${x} 84 L${x} 92`, tone(c, -0.18), 1.6, 0.5))),
        C(100, 34, 9, tone(c, 0.12, 0.9)),
      ];
    case 3: // pacifier
      return [
        E(100, 126, 15, 9, null, c),
        OVAL_RING(100, 126, 15, 9, sh, 1.6),
        C(100, 126, 4, tone(c, 0.15, 0.9)),
        RING(100, 136, 6, sh, 2.4),
      ];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------

/** Parse every path a companion can use, now — every kind, option and detail level. */
export function warmCompanionPaths(): number {
  const seen = new Set<string>([DOG_HEAD, CAT_HEAD, BABY_HEAD]);
  const base: CompanionSpec = {
    kind: 0, mainColor: '#D9A55C', skin: 0.3, hairColor: '#3A2A20', style: 0, markings: 0,
    markingColor: '#F4EFE7', eyeColor: '#6B4A2E', eyeColor2: '#6B4A2E', accessory: 0, accessoryColor: '#C67139',
  };
  for (const kind of [COMPANION_DOG, COMPANION_CAT, COMPANION_BABY]) {
    for (let style = 0; style < 4; style++) {
      for (let markings = 0; markings < 4; markings++) {
        for (let accessory = 0; accessory < 4; accessory++) {
          for (const small of [false, true]) {
            for (const d of allPaths(companionLayers({ ...base, kind, style, markings, accessory }, small))) seen.add(d);
          }
        }
      }
    }
  }
  for (const d of seen) cachedOps(d);
  return seen.size;
}
