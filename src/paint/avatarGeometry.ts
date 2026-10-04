// Tahan — avatar geometry (the detailed kit).
//
// A face is a style per part plus a few colours (AvatarSpec in palettes.ts).
// No photo, no upload, no crop, no image host. Each part has one base colour;
// shadows and highlights are derived in OKLab, so any colour a person picks
// shades correctly without new art.
//
// Ported from the avatar lab (design/avatar-lab.html), which is where this
// kit was designed and approved. Geometry is authored in a 200×200 box; every
// path is absolute M L Q C Z, as the parser requires. The figure is drawn 10%
// larger than authored and nudged down so the head fills the circle — that,
// and the face shading clipped to the head, are the two groups below.
//
// Under 44pt the fine detail (teeth, blush, lashes, earrings, buttons, temple
// arms, hair highlights) drops away and lines thicken, so a face stays a face
// in a feed row instead of turning to noise.

import { alongStops, oklabLightness, tone } from '../theme/oklch.ts';
import { AvatarKit, type AvatarSpec } from '../theme/palettes.ts';
import { cachedOps } from './pathParser.ts';
import { C, E, G, P, PS, RING, SKY, allPaths, type GroupTransform, type Layer } from './primitives.ts';

export const AVATAR_BOX = 200;

/** Sizes in use, in points. */
export const AvatarSize = {
  feedRow: 26,
  statusRow: 34,
  header: 44,
  me: 96,
  editor: 216,
} as const;

/** At or below this size the face drops its fine detail. */
export const SMALL_AVATAR = 44;

/** Scale the figure 10% about the box centre and nudge it down 5. */
export const FIGURE_TRANSFORM: GroupTransform = { x: 100, y: 105, scale: 1.1, ox: 100, oy: 100 };

export const HEAD = 'M62 92 C62 62 79 46 100 46 C121 46 138 62 138 92 C138 118 122 139 100 139 C78 139 62 118 62 92 Z';
const SHOULDERS = 'M10 200 C14 166 50 150 100 150 C150 150 186 166 190 200 Z';
const JAW = 'M62 94 C62 112 66 125 73 133 C81 144 90 150 100 150 C110 150 119 144 127 133 C134 125 138 112 138 94 C134 104 131 112 125 117 C116 113 108 111 100 111 C92 111 84 113 75 117 C69 112 66 104 62 94 Z';
const GROUND = 'M0 200 L0 172 C50 160 130 158 200 168 L200 200 Z';

const INK = '#2A1E19';
const WHITE = '#FFFFFF';
const BLUSH = '#E8735F';
const LIP = '#7A2E28';
const TONGUE = '#E07A6A';
const UNDERSHIRT = '#F2ECE2';

/** Hairstyles long enough to hide the ears. */
const COVERS_EARS = new Set([2, 3, 4, 5, 9, 11, 12]);
/** Hairstyles that cast a shadow on the forehead. */
const castsShadow = (hair: number) => hair !== 7 && hair !== 8;

// ---------------------------------------------------------------------------
// Path helpers

/** Reflect a path about the vertical centre line x = 100. */
export function mirror(d: string): string {
  return d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${+(200 - +x).toFixed(2)} ${y}`);
}

/** The same part on both sides. */
const both = (d: string, fn: (d: string) => Layer[]): Layer[] => [...fn(d), ...fn(mirror(d))];

/** One plait, as stacked overlapping lobes, hanging from y0. */
function braid(x: number, y0: number, n: number, c: string, sh: string, li: string, small: boolean): Layer[] {
  const out: Layer[] = [];
  for (let i = 0; i < n; i++) {
    const y = y0 + i * 8.5;
    const dx = i % 2 ? 1.6 : -1.6;
    out.push(E(x + dx, y, 7.2 - i * 0.25, 6, null, c));
    if (!small) {
      out.push(PS(`M${x + dx - 5} ${y + 2} C${x + dx - 1} ${y + 5} ${x + dx + 2} ${y + 5} ${x + dx + 5.5} ${y + 1.5}`, sh, 1.3, 0.8));
    }
  }
  const end = y0 + n * 8.5;
  out.push(P(`M${x - 3} ${end - 3} L${x + 3} ${end - 3} L${x + 4} ${end + 7} C${x + 1} ${end + 9} ${x - 1} ${end + 9} ${x - 4} ${end + 7} Z`, c));
  if (!small) out.push(E(x, end - 3, 4, 2.2, null, li));
  return out;
}

// ---------------------------------------------------------------------------
// The face

export interface AvatarColours {
  readonly skin: string;
  readonly skinShade: string;
  readonly skinLight: string;
  readonly lineSkin: string;
  readonly hair: string;
  readonly hairShade: string;
  readonly hairLight: string;
  readonly brow: string;
  readonly top: string;
  readonly topShade: string;
  readonly topLight: string;
  readonly extra: string;
  readonly extraShade: string;
  readonly frame: string;
  readonly eye: string;
}

/** Every colour a face uses, derived from the spec's base colours. */
export function avatarColours(spec: AvatarSpec): AvatarColours {
  const skin = alongStops(AvatarKit.skinRange, spec.skin);
  const hair = spec.hairColor;
  const hl = oklabLightness(hair);
  return {
    skin,
    skinShade: tone(skin, -0.075, 1.15),
    skinLight: tone(skin, 0.045, 0.9),
    lineSkin: tone(skin, -0.32, 1.1),
    hair,
    hairShade: tone(hair, hl > 0.3 ? -0.11 : -0.05, 1.05),
    hairLight: tone(hair, hl > 0.3 ? 0.09 : 0.13, 1),
    brow: tone(hair, hl > 0.55 ? -0.18 : -0.03, 1),
    top: spec.topColor,
    topShade: tone(spec.topColor, -0.09, 1.05),
    topLight: tone(spec.topColor, 0.07, 0.95),
    extra: spec.extraColor,
    extraShade: tone(spec.extraColor, -0.1, 1.05),
    frame: spec.glassesColor,
    eye: spec.eyeColor,
  };
}

/**
 * The layer list for one face, in paint order, in the 200-unit box. No sky:
 * see avatarBackdrop. Pure geometry — the painter scales it.
 */
export function avatarLayers(spec: AvatarSpec, small = false): Layer[] {
  const c = avatarColours(spec);
  const k = small ? 1.45 : 1; // thicker lines when tiny
  const coversEars = COVERS_EARS.has(spec.hair);
  const fig: Layer[] = [];

  // Hair behind the head.
  fig.push(...hairBack(spec.hair, c.hair, c.hairShade, c.hairLight));

  // Clothes and neck.
  if (spec.top === 4) fig.push(P('M66 164 C60 146 76 134 100 134 C124 134 140 146 134 164 Z', c.topShade)); // hood
  fig.push(P(SHOULDERS, c.top));
  fig.push(...both('M10 200 C13 183 23 170 37 161 C35 175 35 189 37 200 Z', (d) => [P(d, c.topShade)]));
  fig.push(P('M86 124 L114 124 L115 156 C108 162 92 162 85 156 Z', c.skin));
  fig.push(P('M86 126 C92 140 108 140 114 126 L114.6 140 C108 149 92 149 85.4 140 Z', c.skinShade));
  fig.push(...topDetail(spec.top, c, small));

  // Ears.
  if (!coversEars) {
    fig.push(...both('M64 90 C56 86 51 93 53 101 C55 109 61 112 66 108 Z', (d) => [P(d, c.skin)]));
    if (!small) fig.push(...both('M62 95 C58 94 57 99 59 103 C60 106 63 106 64 104 Z', (d) => [P(d, c.skinShade)]));
  }

  // The head, and shading kept inside it.
  fig.push(P(HEAD, c.skin));
  const shading: Layer[] = [P('M126 58 C140 76 142 112 120 140 L146 140 L146 58 Z', c.skinShade, 0.55)];
  if (castsShadow(spec.hair)) shading.push(P('M60 40 L140 40 L140 74 C120 66 80 66 60 74 Z', c.skinShade, 0.7));
  if (spec.hair === 7) shading.push(E(86, 58, 12, 6, null, c.skinLight, 0.9)); // shine on a thinning crown
  fig.push(G(shading, { clip: HEAD }));

  // Blush.
  if (!small) fig.push(E(76, 113, 8, 4.6, null, BLUSH, 0.22), E(124, 113, 8, 4.6, null, BLUSH, 0.22));

  // Facial hair under the mouth.
  if (spec.facial === 1) {
    fig.push(P(JAW, c.hair), P('M75 117 C84 113 92 111 100 111 C108 111 116 113 125 117 C122 124 116 128 100 128 C84 128 78 124 75 117 Z', c.hairShade, 0.5));
  }
  if (spec.facial === 3) fig.push(P(JAW, c.hair, 0.26));
  if (spec.facial === 4) fig.push(P('M90 127 C94 131 106 131 110 127 C111 137 106 143 100 143 C94 143 89 137 90 127 Z', c.hair));

  // Nose.
  fig.push(PS('M100 99 C97.5 105 96.5 109 98.5 111 C100 112 102.5 111.8 104 110.4', c.lineSkin, 2.2 * k, 0.55));

  // Mouth.
  fig.push(...mouth(spec.mouth, small, k, c.skinShade));

  // Moustache, over the mouth.
  if (spec.facial === 1 || spec.facial === 2 || spec.facial === 4) {
    fig.push(P('M84 115 C90 109 97 109 100 112 C103 109 110 109 116 115 C111 119 105 118 100 116.5 C95 118 89 119 84 115 Z', spec.facial === 1 ? c.hairShade : c.hair));
  }

  // Eyes, brows, glasses.
  fig.push(...eyes(spec.eyes, c.eye, small, k));
  fig.push(...both('M75 84 C80 79.5 88 79 94 81.5', (d) => [PS(d, c.brow, 3.4 * k)]));
  fig.push(...glasses(spec.glasses, c.frame, small, k));

  // Hair in front, then extras.
  fig.push(...hairFront(spec.hair, c.hair, c.hairShade, c.hairLight, small));
  fig.push(...extras(spec.extra, c.extra, c.extraShade, small));

  return [G(fig, { transform: FIGURE_TRANSFORM })];
}

/** The village's sky behind a face, with a soft hill in accent-2. */
export function avatarBackdrop(sky: { stops: readonly string[]; positions: readonly number[] }, ground: string): Layer[] {
  return [SKY(0, 0, AVATAR_BOX, AVATAR_BOX, sky.stops, sky.positions), P(GROUND, ground, 0.45)];
}

// ---------------------------------------------------------------------------
// Hair behind the head

function hairBack(h: number, c: string, sh: string, li: string): Layer[] {
  switch (h) {
    case 2: // Long
      return [
        P('M58 92 C52 52 76 32 100 32 C124 32 148 52 142 92 C140 118 146 150 154 172 C140 182 124 178 117 168 L116 124 L84 124 L83 168 C76 178 60 182 46 172 C54 150 60 118 58 92 Z', c),
        P('M58 96 C56 120 52 150 47 170 C52 174 58 175 63 174 C64 150 64 120 64 98 Z', sh, 0.6),
        P('M136 98 C136 120 136 150 137 174 C142 175 148 174 153 170 C148 150 144 120 142 96 Z', sh, 0.6),
      ];
    case 3: // Bob
      return [
        P('M56 94 C52 54 76 34 100 34 C124 34 148 54 144 94 C143 110 145 124 149 136 C138 143 125 141 120 134 L80 134 C75 141 62 143 51 136 C55 124 57 110 56 94 Z', c),
        P('M52 134 C62 141 74 141 80 134 L80 128 C72 132 62 132 54 128 Z', sh, 0.7),
        P('M148 134 C138 141 126 141 120 134 L120 128 C128 132 138 132 146 128 Z', sh, 0.7),
      ];
    case 4: { // Curls
      const curls: [number, number, number][] = [[62, 74, 17], [76, 54, 18], [100, 44, 20], [124, 54, 18], [138, 74, 17], [58, 98, 15], [142, 98, 15], [60, 120, 13], [140, 120, 13], [66, 138, 10], [134, 138, 10]];
      return [...curls.map(([x, y, r]) => C(x, y, r + 1.5, sh)), ...curls.map(([x, y, r]) => C(x, y, r, c))];
    }
    case 5: // Coils
      return [
        C(100, 60, 46, sh), C(100, 58, 44, c), C(64, 82, 26, c), C(136, 82, 26, c), C(62, 108, 18, c), C(138, 108, 18, c),
        ...[[78, 30], [100, 22], [122, 30], [56, 56], [144, 56], [48, 86], [152, 86]].map(([x, y]) => C(x, y, 3.2, sh, 0.7)),
      ];
    case 6: // Bun
      return [C(100, 30, 17, sh), C(100, 29, 15.5, c), P('M90 22 C96 18 104 18 108 21 C102 21 96 22 92 25 Z', li, 0.8)];
    case 9: // Waves
      return [
        P('M56 94 C50 54 76 32 100 32 C124 32 150 54 144 94 C148 112 152 132 148 150 C142 160 130 160 124 152 C126 140 122 128 118 120 L82 120 C78 128 74 140 76 152 C70 160 58 160 52 150 C48 132 52 112 56 94 Z', c),
        PS('M58 108 C54 120 60 132 54 146', sh, 3, 0.7), PS('M142 108 C146 120 140 132 146 146', sh, 3, 0.7),
      ];
    case 10: // Ponytail — the tail shows past the right side of the head
      return [
        P('M124 58 C150 58 160 82 157 108 C155 128 149 142 141 152 C144 132 144 114 140 98 C137 84 133 72 122 64 Z', c),
        P('M141 152 C149 142 155 128 157 108 C158 120 156 134 150 146 Z', sh, 0.6),
        E(130, 60, 5.5, 4.5, null, sh),
      ];
    case 11: // Braids — hair behind the head; the plaits hang in front
      return [P('M58 94 C52 54 76 34 100 34 C124 34 148 54 142 94 L142 112 L58 112 Z', c)];
    case 12: { // Locs — soft, slightly curved strands with round ends
      const strands = ['M56 70 C51 96 55 124 52 150', 'M63 62 C59 92 63 126 60 160', 'M70 58 C67 88 71 118 68 144'];
      const all = strands.flatMap((d) => [d, mirror(d)]);
      const offset = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${+x + 1.8} ${+y + 4}`);
      return [
        P('M58 92 C52 54 76 36 100 36 C124 36 148 54 142 92 L142 108 L58 108 Z', c),
        ...all.map((d) => PS(d, c, 9)),
        ...all.map((d) => PS(offset(d), sh, 2.4, 0.45)),
      ];
    }
    case 14: // Puffs
      return [C(64, 44, 21, sh), C(64, 43, 19.5, c), C(136, 44, 21, sh), C(136, 43, 19.5, c)];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Hair in front of the head

function hairFront(h: number, c: string, sh: string, li: string, small: boolean): Layer[] {
  const hl = (d: string): Layer[] => (small ? [] : [P(d, li, 0.85)]);
  switch (h) {
    case 0: // Short, side part
      return [
        P('M60 92 C56 60 74 39 100 39 C127 39 145 58 140 92 C139 82 136 74 131 69 C121 73 104 72 92 65 C86 71 76 73 68 72 C63 77 61 84 60 92 Z', c),
        ...both('M61 88 L66 88 L67 102 L62 100 Z', (d) => [P(d, c)]),
        P('M92 65 C104 72 121 73 131 69 C126 66 116 66 106 63 C100 62 95 63 92 65 Z', sh, 0.6),
        ...hl('M84 47 C96 42 112 43 122 49 C111 48 97 49 86 53 Z'),
      ];
    case 1: // Quiff
      return [
        P('M60 92 C55 62 69 43 88 38 C93 28 112 25 126 31 C120 33 116 36 113 39 C131 44 145 62 140 92 C137 81 133 73 127 68 C116 72 98 70 86 63 C78 69 70 72 66 74 C62 79 61 85 60 92 Z', c),
        ...both('M61 88 L66 88 L67 101 L62 99 Z', (d) => [P(d, c)]),
        ...hl('M92 38 C99 31 110 30 118 33 C108 35 100 38 95 43 Z'),
      ];
    case 2: // Long — curtain fringe
      return [
        P('M61 96 C58 60 78 43 100 43 C122 43 142 60 139 96 C134 80 124 69 108 64 C103 70 91 77 75 81 C69 85 64 90 61 96 Z', c),
        P('M139 96 C141 112 141 126 138 138 L133 138 C135 124 135 110 134 96 Z', c),
        P('M61 96 C59 112 59 126 62 138 L67 138 C65 124 65 110 66 96 Z', c),
        ...hl('M110 50 C121 52 131 60 135 72 C128 64 120 58 108 55 Z'),
      ];
    case 3: // Bob — blunt bangs
      return [
        P('M61 92 C58 58 79 41 100 41 C121 41 142 58 139 92 L139 79 C127 76 114 75 100 77 C86 75 73 76 61 79 Z', c),
        P('M61 79 C73 76 86 75 100 77 C114 75 127 76 139 79 L139 82 C126 80 114 79 100 81 C86 79 74 80 61 82 Z', sh, 0.55),
        ...hl('M80 50 C92 45 108 45 120 50 C108 50 92 50 82 54 Z'),
      ];
    case 4: // Curls — curls over the forehead
      return [
        ...[[74, 66, 11], [90, 60, 12], [106, 59, 12], [122, 64, 11], [134, 74, 9], [66, 76, 9]].map(([x, y, r]) => C(x, y, r, c)),
        ...(small ? [] : [[87, 55], [104, 54], [72, 62], [119, 59], [100, 38], [76, 48], [124, 48]].map(([x, y]) => C(x, y, 3.2, li, 0.8))),
      ];
    case 5: // Coils — hairline
      return [
        P('M64 86 C66 66 82 56 100 56 C118 56 134 66 136 86 C128 74 114 68 100 68 C86 68 72 74 64 86 Z', c),
        ...(small ? [] : [[86, 40], [104, 34], [120, 42], [70, 58], [130, 60]].map(([x, y]) => C(x, y, 3, li, 0.55))),
      ];
    case 6: // Bun — slicked back
      return [
        P('M61 92 C58 60 76 42 100 42 C124 42 142 60 139 92 C136 78 128 68 116 64 C106 61 94 61 84 64 C72 68 64 78 61 92 Z', c),
        ...(small ? [] : [PS('M80 52 C90 48 110 48 120 52', li, 2.2, 0.7), PS('M74 60 C88 55 112 55 126 60', li, 2.2, 0.5)]),
      ];
    case 7: // Thinning — tufts at the sides
      return [
        P('M61 98 C57 82 61 70 70 64 C67 75 67 86 69 99 Z', c), P('M139 98 C143 82 139 70 130 64 C133 75 133 86 131 99 Z', c),
        P('M66 98 C64 86 66 76 70 68 L69 99 Z', sh, 0.6), P('M134 98 C136 86 134 76 130 68 L131 99 Z', sh, 0.6),
      ];
    case 8: // Buzz
      return [
        P('M61.5 90 C58 58 78 43 100 43 C122 43 142 58 138.5 90 C136 80 132 72 126 67 C114 64 86 64 74 67 C68 72 64 80 61.5 90 Z', c, 0.9),
        ...(small ? [] : [[84, 52], [96, 49], [108, 49], [120, 53], [76, 59], [128, 60], [90, 58], [112, 58]].map(([x, y]) => C(x, y, 1.1, sh, 0.6))),
      ];
    case 9: // Waves — centre part
      return [
        P('M61 94 C58 58 78 41 100 41 C122 41 142 58 139 94 C136 78 126 66 104 60 L100 50 L96 60 C74 66 64 78 61 94 Z', c),
        PS('M100 44 L100 58', sh, 2, 0.7),
        ...hl('M72 64 C78 54 88 48 96 47 C88 52 80 58 76 68 Z'),
      ];
    case 10: // Ponytail — pulled back, side part
      return [
        P('M61 92 C58 60 76 42 100 42 C124 42 142 60 139 92 C136 78 128 68 116 64 C106 61 94 61 84 64 C72 68 64 78 61 92 Z', c),
        ...(small ? [] : [PS('M88 44 C92 52 92 58 90 64', sh, 2, 0.7)]),
        ...hl('M96 47 C108 46 122 52 128 60 C118 55 108 52 98 52 Z'),
      ];
    case 11: // Braids — centre part; the plaits hang over the shoulders
      return [
        P('M61 94 C58 58 78 42 100 42 C122 42 142 58 139 94 C137 82 132 72 124 66 C114 62 106 60 100 54 C94 60 86 62 76 66 C68 72 63 82 61 94 Z', c),
        PS('M100 43 L100 54', sh, 2, 0.7),
        P('M61 94 C59 100 60 106 62 110 L68 110 C66 104 65 98 66 94 Z', c), P('M139 94 C141 100 140 106 138 110 L132 110 C134 104 135 98 134 94 Z', c),
        ...braid(64, 112, 7, c, sh, li, small), ...braid(136, 112, 7, c, sh, li, small),
        ...hl('M80 50 C88 46 96 45 98 47 C92 50 86 54 82 58 Z'),
      ];
    case 12: // Locs — crown, with two locs falling past the temples
      return [
        P('M61 92 C58 58 78 42 100 42 C122 42 142 58 139 92 C136 80 130 72 122 68 C112 66 88 66 78 68 C70 72 64 80 61 92 Z', c),
        ...both('M70 70 C65 82 64 94 63 106', (d) => [PS(d, c, 8)]),
        ...(small ? [] : both('M72 76 C68 86 67 96 66 104', (d) => [PS(d, sh, 2.2, 0.45)])),
        ...(small ? [] : [[84, 50], [100, 46], [116, 50], [92, 58], [108, 58]].map(([x, y]) => PS(`M${x} ${y} L${x} ${y + 6}`, sh, 2, 0.45))),
      ];
    case 13: // Pixie — short, with a side-swept fringe
      return [
        P('M60 92 C56 60 76 40 102 40 C128 40 144 58 140 90 C138 80 134 72 128 68 C122 72 112 76 98 76 C86 78 76 82 68 86 C64 88 62 90 60 92 Z', c),
        P('M66 74 C78 62 98 56 122 58 C112 64 98 70 82 76 C76 78 70 80 66 82 Z', sh, 0.5),
        ...both('M61 88 L66 88 L66.5 98 L62 97 Z', (d) => [P(d, c)]),
        ...hl('M88 47 C102 43 118 45 128 53 C116 50 102 50 90 53 Z'),
      ];
    case 14: // Puffs — slicked, centre part
      return [
        P('M61 92 C58 60 76 42 100 42 C124 42 142 60 139 92 C136 78 128 68 116 64 C106 61 94 61 84 64 C72 68 64 78 61 92 Z', c),
        PS('M100 43 L100 60', sh, 2, 0.7),
        E(76, 56, 4, 3, null, sh), E(124, 56, 4, 3, null, sh),
        ...(small ? [] : [[58, 34], [70, 30], [130, 30], [142, 34], [60, 50], [140, 50]].map(([x, y]) => C(x, y, 2.6, li, 0.6))),
      ];
    case 15: // Spiky
      return [
        P('M60 92 C57 72 62 58 71 51 L66 37 L80 44 L84 29 L95 41 L102 26 L110 40 L120 30 L122 44 L135 38 L131 53 C139 61 142 75 140 92 C138 82 134 74 128 70 C114 72 96 70 84 66 C76 70 68 74 64 80 C62 84 61 88 60 92 Z', c),
        ...both('M61 88 L66 88 L66.5 99 L62 97 Z', (d) => [P(d, c)]),
        P('M84 66 C96 70 114 72 128 70 C122 66 112 65 102 62 C94 62 88 63 84 66 Z', sh, 0.6),
        ...hl('M86 34 L94 44 L101 30 L106 42 C98 44 90 46 84 48 Z'),
      ];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Eyes

function eyes(style: number, iris: string, small: boolean, k: number): Layer[] {
  if (style === 2) return both('M77 99 C80.5 92.5 88.5 92.5 92 99', (d) => [PS(d, INK, 2.6 * k)]); // smiling, closed

  const one = (cx: number): Layer[] => small
    ? [C(cx, 96.5, 4.2, INK), C(cx + 1.4, 95, 1.3, WHITE)]
    : [
        E(cx, 96.5, 8, 7, null, WHITE),
        C(cx + 0.6, 97, 5.1, iris),
        C(cx + 0.6, 97, 2.6, INK),
        C(cx + 2.4, 94.9, 1.5, WHITE),
        C(cx - 1.4, 99.2, 0.7, WHITE, 0.8),
        PS(`M${cx - 8.5} 95 C${cx - 5} 88.5 ${cx + 5} 88.5 ${cx + 8.5} 94.5`, INK, 2.6), // upper lid
      ];

  const out = [...one(84), ...one(116)];
  if (style === 1 && !small) {
    out.push(PS('M76 94.5 L72.6 92', INK, 2.2), PS('M77.3 92.4 L74.6 89.4', INK, 2));
    out.push(PS('M124 94.5 L127.4 92', INK, 2.2), PS('M122.7 92.4 L125.4 89.4', INK, 2));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Mouth

function mouth(style: number, small: boolean, k: number, skinShade: string): Layer[] {
  if (small || style === 3) return [PS('M90 120 C96 125.5 104 125.5 110 120', LIP, 2.6 * k)];
  if (style === 1) return [PS('M88 119 C94 126.5 106 126.5 112 119', LIP, 2.6), PS('M96 128.6 C99 129.6 101 129.6 104 128.6', skinShade, 1.6, 0.8)];
  const big = style === 2;
  return big
    ? [
        P('M84 116 C92 118.5 108 118.5 116 116 C115 131 108 137 100 137 C92 137 85 131 84 116 Z', LIP),
        P('M86.5 117.6 C94 119.6 106 119.6 113.5 117.6 L112.8 122 C105 123.8 95 123.8 87.2 122 Z', WHITE),
        P('M92 133 C96 129 104 129 108 133 C105 136 95 136 92 133 Z', TONGUE),
      ]
    : [
        P('M86 117 C93 119 107 119 114 117 C113 128 107 133 100 133 C93 133 87 128 86 117 Z', LIP),
        P('M88 118 C94 119.8 106 119.8 112 118 L111.4 121.6 C104.5 123 95.5 123 88.6 121.6 Z', WHITE),
        P('M93 130.4 C96.5 127.4 103.5 127.4 107 130.4 C104 132.4 96 132.4 93 130.4 Z', TONGUE),
      ];
}

// ---------------------------------------------------------------------------
// Glasses

function glasses(style: number, f: string, small: boolean, k: number): Layer[] {
  if (!style) return [];
  const temples: Layer[] = small ? [] : [PS('M72.5 93 L62 90', f, 2.4), PS('M127.5 93 L138 90', f, 2.4)];
  const glint = (d: string): Layer[] => (small ? [] : both(d, (x) => [PS(x, WHITE, 1.6, 0.7)]));

  if (style === 1) { // round
    return [
      C(84, 96, 11.5, WHITE, 0.16), C(116, 96, 11.5, WHITE, 0.16),
      RING(84, 96, 11.5, f, 2.6 * k), RING(116, 96, 11.5, f, 2.6 * k),
      PS('M95.5 95 C98 92.4 102 92.4 104.5 95', f, 2.4 * k), ...temples,
      ...glint('M77 91 L81 87.6'),
    ];
  }
  if (style === 2) { // bold
    return [
      ...both('M71 89 C71 86.5 72.5 85.5 75 85.5 L94 85.5 C96.5 85.5 97.5 86.5 97.5 89 L97 101 C96.8 104 95 105.5 92 105.5 L77 105.5 C74 105.5 72 104 71.6 101 Z',
        (d) => [P(d, WHITE, 0.16), PS(d, f, 3.8 * k)]),
      PS('M97.5 93 L102.5 93', f, 3 * k), ...temples,
      ...glint('M77 91 L81.5 87.8'),
    ];
  }
  if (style === 3) { // cat-eye
    return [
      ...both('M70 88 C78 85 92 86 97 89 C97.5 98 94 105 85 105 C76 105 72 98 70 88 Z', (d) => [P(d, WHITE, 0.16), PS(d, f, 2.8 * k)]),
      ...both('M70 88 L66 84', (d) => [PS(d, f, 3 * k)]),
      PS('M97 91 C99 89.6 101 89.6 103 91', f, 2.4 * k), ...temples,
    ];
  }
  return [ // readers — half rims
    ...both('M72 97 C72 103 77 106 84 106 C91 106 96 103 96 97', (d) => [PS(d, f, 2.6 * k)]),
    ...both('M72 97 L96 97', (d) => [PS(d, f, 1.6 * k, 0.85)]),
    PS('M96 97 C98 95.4 102 95.4 104 97', f, 2 * k), ...temples,
  ];
}

// ---------------------------------------------------------------------------
// Clothes

function topDetail(t: number, c: AvatarColours, small: boolean): Layer[] {
  switch (t) {
    case 0: // Tee
      return [P('M84 152 C88 163 112 163 116 152 C110 156 90 156 84 152 Z', c.skinShade), PS('M83 152 C88 164 112 164 117 152', c.topShade, 3.2)];
    case 1: // Collar shirt
      return [
        P('M88 152 L100 172 L112 152 Z', c.skin),
        P('M100 172 L88 152 L86 160 Z', c.skinShade, 0.5),
        ...both('M84 149 L100 171 L91 177 L79 158 Z', (d) => [P(d, c.topLight), PS(d, c.topShade, 1.2, 0.5)]),
        ...(small ? [] : [C(100, 182, 1.8, c.topShade), C(100, 193, 1.8, c.topShade)]),
      ];
    case 2: // Turtleneck
      return [
        P('M82 134 C82 130 118 130 118 134 L120 158 C112 164 88 164 80 158 Z', c.top),
        ...(small ? [] : [88, 94, 100, 106, 112].map((x) => PS(`M${x} 138 L${x} 158`, c.topShade, 1.4, 0.6))),
        PS('M80 158 C88 164 112 164 120 158', c.topShade, 2.4),
      ];
    case 3: // Cardigan over a tee
      return [
        P('M80 152 L100 200 L120 152 C112 156 88 156 80 152 Z', UNDERSHIRT),
        P('M84 152 C88 160 112 160 116 152 C110 155 90 155 84 152 Z', c.skinShade),
        PS('M80 152 L100 200', c.topShade, 3), PS('M120 152 L100 200', c.topShade, 3),
        ...(small ? [] : [C(104, 182, 2, c.topShade), C(107, 172, 2, c.topShade)]),
      ];
    case 4: // Hoodie
      return [
        P('M84 152 C88 162 112 162 116 152 C110 156 90 156 84 152 Z', c.skinShade),
        PS('M82 152 C88 164 112 164 118 152', c.topShade, 3),
        ...(small ? [] : [PS('M94 161 L93 182', c.topLight, 2.2), PS('M106 161 L107 182', c.topLight, 2.2), C(93, 183, 2, c.topLight), C(107, 183, 2, c.topLight)]),
      ];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Extras

function extras(x: number, c: string, sh: string, small: boolean): Layer[] {
  switch (x) {
    case 1: // Hoops
      return small ? [] : [RING(58, 114, 5.5, c, 2.2), RING(142, 114, 5.5, c, 2.2)];
    case 2: // Studs
      return small ? [] : [C(58, 109, 2.6, c), C(142, 109, 2.6, c)];
    case 3: // Scarf
      return [
        P('M72 148 C84 160 116 160 128 148 L132 160 C118 174 82 174 68 160 Z', c),
        P('M106 166 L122 198 L109 200 L98 170 Z', sh),
        ...(small ? [] : [PS('M74 156 C86 166 114 166 126 156', sh, 1.6, 0.6)]),
      ];
    case 4: // Beret
      return [
        P('M56 64 C56 42 86 28 114 31 C140 34 152 50 146 64 C128 70 78 71 56 64 Z', c),
        P('M56 64 C78 71 128 70 146 64 L146 67 C128 74 78 75 56 67 Z', sh),
        P('M104 31 L106 24 L110 24 L110 31 Z', sh),
      ];
    case 5: // Headwrap
      return [
        P('M60 72 C76 61 124 61 140 72 L140 84 C124 73 76 73 60 84 Z', c),
        P('M60 79 C76 69 124 69 140 79 L140 84 C124 73 76 73 60 84 Z', sh, 0.5),
        E(132, 58, 9, 6, -30, c), E(144, 62, 8, 5, 20, c), C(136, 64, 4, sh),
      ];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------

/**
 * Parse every path a face can use, now. Parts are independent of one another
 * and of colour, so sweeping each part's options (at both detail levels)
 * covers every path. Called at launch: a bad path throws on the first run,
 * where somebody is looking.
 */
export function warmAvatarPaths(): number {
  const seen = new Set<string>([HEAD, GROUND]);
  const base = { skin: 0.4, hairColor: '#5C3D27', eyeColor: '#3A2A20', glassesColor: '#1E1916', topColor: '#C67139', extraColor: '#D9A441' };
  const zero = { hair: 0, eyes: 0, mouth: 0, facial: 0, glasses: 0, top: 0, extra: 0 };
  const counts = {
    hair: AvatarKit.hairStyles.length, eyes: AvatarKit.eyeStyles.length, mouth: AvatarKit.mouths.length,
    facial: AvatarKit.facialHair.length, glasses: AvatarKit.glasses.length, top: AvatarKit.tops.length, extra: AvatarKit.extras.length,
  };
  for (const [part, n] of Object.entries(counts)) {
    for (let i = 0; i < n; i++) {
      for (const small of [false, true]) {
        for (const d of allPaths(avatarLayers({ ...base, ...zero, [part]: i }, small))) seen.add(d);
      }
    }
  }
  for (const d of seen) cachedOps(d);
  return seen.size;
}

