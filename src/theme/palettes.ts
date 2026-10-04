// Tahan — scene palettes and the avatar kit.
// Ported from lib/tahan_palettes.dart in the design handoff. Values are exact;
// do not adjust by eye.
//
// Pure TypeScript with erasable syntax only (no enums, no namespaces), so it
// runs under `node --test` with no build step as well as under Metro.

export type Drift =
  | 'fireflies'
  | 'leaves'
  | 'breeze'
  | 'dust'
  | 'rain'
  | 'snow'
  | 'petals';

export type SceneKey =
  | 'night'
  | 'forest'
  | 'tropical'
  | 'desert'
  | 'terrace'
  | 'savanna'
  | 'coast'
  | 'winter'
  | 'blossom';

export interface ScenePalette {
  readonly key: SceneKey;
  readonly name: string;
  readonly accent: string;
  readonly accent2: string;
  readonly bg: string;
  readonly surface: string;
  /** Dark sky → light ink in the header. */
  readonly dark: boolean;
  readonly drift: Drift;
}

export const tahanInk = '#201E1D';

/** Light ink for text sitting on a dark sky. */
export const tahanCream = '#FDF7EC';

export const tahanScenes: readonly ScenePalette[] = [
  {
    key: 'night', name: 'Night sky',
    accent: '#C67139', accent2: '#7A8A5E',
    bg: '#F5EAD8', surface: '#EBDDC5',
    dark: true, drift: 'fireflies',
  },
  {
    key: 'forest', name: 'Forest',
    accent: '#6F7F52', accent2: '#B06A3C',
    bg: '#F3EFDD', surface: '#E5E5C9',
    dark: false, drift: 'leaves',
  },
  {
    key: 'tropical', name: 'Tropical',
    accent: '#D9663F', accent2: '#3F8A7A',
    bg: '#FBF0DD', surface: '#F3DFC4',
    dark: false, drift: 'breeze',
  },
  {
    key: 'desert', name: 'Desert',
    accent: '#C98A3C', accent2: '#9C5A4A',
    bg: '#F8ECD8', surface: '#EFDCBA',
    dark: false, drift: 'dust',
  },
  {
    key: 'terrace', name: 'Rice terraces',
    accent: '#B0813F', accent2: '#5D8A6B',
    bg: '#F4F0E0', surface: '#E5E5CD',
    dark: false, drift: 'rain',
  },
  {
    key: 'savanna', name: 'Savanna',
    accent: '#C9662E', accent2: '#8A7A3E',
    bg: '#F7ECD4', surface: '#EEDDB6',
    dark: false, drift: 'dust',
  },
  {
    key: 'coast', name: 'Coast',
    accent: '#3F6F8A', accent2: '#C9834A',
    bg: '#F4F1E6', surface: '#E4E3D2',
    dark: false, drift: 'breeze',
  },
  {
    key: 'winter', name: 'Winter',
    accent: '#6F7F9A', accent2: '#8A6F5A',
    bg: '#F1F1EC', surface: '#E2E2DA',
    dark: false, drift: 'snow',
  },
  {
    key: 'blossom', name: 'Blossom',
    accent: '#C96B7A', accent2: '#7A8A5E',
    bg: '#F9EEE6', surface: '#F0DBD2',
    dark: false, drift: 'petals',
  },
];

export function sceneByKey(key: SceneKey): ScenePalette {
  const found = tahanScenes.find((s) => s.key === key);
  if (!found) throw new Error(`unknown scene '${key}'`);
  return found;
}

/** Fixed palette for onboarding — there is no village yet, so no scene. */
export const TahanEvening = {
  skyStops: ['#26241F', '#4A3C2E', '#A85F31', '#E0975C'],
  cream: '#F7ECD9',
  lampLight: '#F6D9A0',
  doorLight: '#F0BD72',
} as const;

/**
 * The avatar kit.
 *
 * An avatar is a style choice per part plus a handful of colours — about a
 * dozen small fields, and nothing else. No photo, no upload, no image host.
 * Colours are free: skin and hair move along natural ranges (with a free
 * picker for unnatural hair), everything else takes any colour. Shadows and
 * highlights are derived from each base colour, so no colour needs new art.
 */
export const AvatarKit = {
  /** Skin runs light to deep. `AvatarSpec.skin` is a position 0–1 along it. */
  skinRange: ['#FBE3CF', '#F4CDAC', '#E8B48C', '#D59A6C', '#BB7F52', '#9A643D', '#77492B', '#55321E'],
  /** Natural hair: black → browns → reds → blondes → grey → white. */
  hairRange: ['#1E1916', '#3A2A20', '#5C3D27', '#7E4C2B', '#A24F27', '#C8763A', '#D9AB60', '#EED595', '#B3ADA6', '#ECE8E2'],

  hairStyles: ['Short', 'Quiff', 'Long', 'Bob', 'Curls', 'Coils', 'Bun', 'Thinning', 'Buzz', 'Waves', 'Ponytail', 'Braids', 'Locs', 'Pixie', 'Puffs', 'Spiky'],
  eyeStyles: ['Open', 'Lashes', 'Smiling'],
  mouths: ['Grin', 'Smile', 'Laugh', 'Soft'],
  facialHair: ['None', 'Beard', 'Moustache', 'Stubble', 'Goatee'],
  glasses: ['None', 'Round', 'Bold', 'Cat-eye', 'Readers'],
  tops: ['Tee', 'Collar', 'Turtleneck', 'Cardigan', 'Hoodie'],
  extras: ['None', 'Hoops', 'Studs', 'Scarf', 'Beret', 'Headwrap'],

  /** Quick picks in the editor. Any colour is allowed; these are shortcuts. */
  eyeSwatches: ['#3A2A20', '#6B4A2E', '#8A6A3A', '#4E7A52', '#3E6E8E', '#7C8A92'],
  clothSwatches: ['#C67139', '#7A8A5E', '#3F6F8A', '#C96B7A', '#B0813F', '#F2ECE2', '#2E3440', '#D9663F'],
  frameSwatches: ['#1E1916', '#4A4038', '#7A2E3A', '#B0813F', '#C67139', '#C9C2B8'],
  extraSwatches: ['#D9A441', '#C9C2B8', '#C96B7A', '#3F6F8A', '#7A8A5E', '#F2ECE2'],

} as const;

/**
 * A person's face. This whole object is what goes into `/users/{uid}.avatar`.
 * Style fields are indices into the AvatarKit lists; colours are #RRGGBB.
 */
export interface AvatarSpec {
  readonly skin: number; // 0–1 along skinRange
  readonly hair: number;
  readonly hairColor: string;
  readonly eyes: number;
  readonly eyeColor: string;
  readonly mouth: number;
  readonly facial: number;
  readonly glasses: number;
  readonly glassesColor: string;
  readonly top: number;
  readonly topColor: string;
  readonly extra: number;
  readonly extraColor: string;
}

export const defaultSpec: AvatarSpec = {
  skin: 0.35, hair: 0, hairColor: '#5C3D27', eyes: 0, eyeColor: '#6B4A2E',
  mouth: 0, facial: 0, glasses: 0, glassesColor: '#1E1916',
  top: 0, topColor: '#C67139', extra: 0, extraColor: '#D9A441',
};

export function avatarSpec(partial: Partial<AvatarSpec> = {}): AvatarSpec {
  return { ...defaultSpec, ...partial };
}

const STYLE_COUNTS = {
  hair: AvatarKit.hairStyles.length,
  eyes: AvatarKit.eyeStyles.length,
  mouth: AvatarKit.mouths.length,
  facial: AvatarKit.facialHair.length,
  glasses: AvatarKit.glasses.length,
  top: AvatarKit.tops.length,
  extra: AvatarKit.extras.length,
} as const;

const HEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Read a spec back from a Firestore document, repairing anything malformed:
 * styles wrap into range, colours fall back to the default, skin clamps.
 * A face that was written by an older or newer build still draws.
 */
export function specFromMap(map: Record<string, unknown>): AvatarSpec {
  const style = (key: keyof typeof STYLE_COUNTS): number => {
    const v = map[key];
    const n = STYLE_COUNTS[key];
    return typeof v === 'number' && Number.isFinite(v) ? ((Math.trunc(v) % n) + n) % n : defaultSpec[key];
  };
  const colour = (key: 'hairColor' | 'eyeColor' | 'glassesColor' | 'topColor' | 'extraColor'): string => {
    const v = map[key];
    return typeof v === 'string' && HEX.test(v) ? v.toUpperCase() : defaultSpec[key];
  };
  const skin = typeof map.skin === 'number' && Number.isFinite(map.skin)
    ? Math.min(1, Math.max(0, map.skin))
    : defaultSpec.skin;
  return {
    skin,
    hair: style('hair'), hairColor: colour('hairColor'),
    eyes: style('eyes'), eyeColor: colour('eyeColor'),
    mouth: style('mouth'), facial: style('facial'),
    glasses: style('glasses'), glassesColor: colour('glassesColor'),
    top: style('top'), topColor: colour('topColor'),
    extra: style('extra'), extraColor: colour('extraColor'),
  };
}

/** Exactly the spec's fields, ready to write. */
export function specToMap(spec: AvatarSpec): Record<string, number | string> {
  return {
    skin: spec.skin,
    hair: spec.hair, hairColor: spec.hairColor,
    eyes: spec.eyes, eyeColor: spec.eyeColor,
    mouth: spec.mouth, facial: spec.facial,
    glasses: spec.glasses, glassesColor: spec.glassesColor,
    top: spec.top, topColor: spec.topColor,
    extra: spec.extra, extraColor: spec.extraColor,
  };
}

/** A stable string key for caches. */
export function specKey(spec: AvatarSpec): string {
  return [
    spec.skin.toFixed(3), spec.hair, spec.hairColor, spec.eyes, spec.eyeColor, spec.mouth, spec.facial,
    spec.glasses, spec.glassesColor, spec.top, spec.topColor, spec.extra, spec.extraColor,
  ].join('|');
}

/**
 * A stable, varied spec for index `i`, for debug grids and previews.
 *
 * Deliberately not Math.random(): a grid has to look the same on every render,
 * or "that combination was wrong" is not a reproducible report.
 */
export function specForIndex(i: number): AvatarSpec {
  let h = Math.imul(0x9e3779b1, i + 1) >>> 0;
  const next = (n: number): number => {
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
    h = (h ^ (h >>> 12)) >>> 0;
    return h % n;
  };
  const pick = <T,>(list: readonly T[]): T => list[next(list.length)];
  return {
    skin: next(1001) / 1000,
    hair: next(STYLE_COUNTS.hair),
    hairColor: pick(AvatarKit.hairRange),
    eyes: next(STYLE_COUNTS.eyes),
    eyeColor: pick(AvatarKit.eyeSwatches),
    mouth: next(STYLE_COUNTS.mouth),
    facial: next(3) === 0 ? 1 + next(STYLE_COUNTS.facial - 1) : 0,
    glasses: next(2) === 0 ? 1 + next(STYLE_COUNTS.glasses - 1) : 0,
    glassesColor: pick(AvatarKit.frameSwatches),
    top: next(STYLE_COUNTS.top),
    topColor: pick(AvatarKit.clothSwatches),
    extra: next(2) === 0 ? 1 + next(STYLE_COUNTS.extra - 1) : 0,
    extraColor: pick(AvatarKit.extraSwatches),
  };
}

/**
 * A village of made-up people, for the review screen and as fixtures. Never
 * real family members: the repo is public.
 */
export const sampleFaces: readonly (AvatarSpec & { readonly name: string })[] = [
  { name: 'Lola', skin: 0.35, hair: 6, hairColor: '#ECE8E2', eyes: 0, eyeColor: '#6B4A2E', mouth: 0, facial: 0, glasses: 1, glassesColor: '#7A2E3A', top: 3, topColor: '#7A8A5E', extra: 2, extraColor: '#D9A441' },
  { name: 'Ben', skin: 0.18, hair: 0, hairColor: '#5C3D27', eyes: 0, eyeColor: '#3E6E8E', mouth: 0, facial: 3, glasses: 0, glassesColor: '#2A1E19', top: 0, topColor: '#3F6F8A', extra: 0, extraColor: '#D9A441' },
  { name: 'Ama', skin: 0.86, hair: 5, hairColor: '#1E1916', eyes: 1, eyeColor: '#4A2E1E', mouth: 2, facial: 0, glasses: 0, glassesColor: '#2A1E19', top: 1, topColor: '#C96B7A', extra: 1, extraColor: '#D9A441' },
  { name: 'Tito', skin: 0.55, hair: 7, hairColor: '#B3ADA6', eyes: 2, eyeColor: '#4A2E1E', mouth: 0, facial: 2, glasses: 4, glassesColor: '#4A4038', top: 2, topColor: '#B0813F', extra: 0, extraColor: '#D9A441' },
  { name: 'Mei', skin: 0.12, hair: 3, hairColor: '#1E1916', eyes: 1, eyeColor: '#3A2A20', mouth: 1, facial: 0, glasses: 0, glassesColor: '#2A1E19', top: 4, topColor: '#6F7F9A', extra: 2, extraColor: '#F2ECE2' },
  { name: 'Rafa', skin: 0.48, hair: 1, hairColor: '#3A2A20', eyes: 0, eyeColor: '#5C3D27', mouth: 0, facial: 1, glasses: 2, glassesColor: '#1E1916', top: 1, topColor: '#F2ECE2', extra: 0, extraColor: '#D9A441' },
  { name: 'June', skin: 0.25, hair: 4, hairColor: '#C8763A', eyes: 1, eyeColor: '#4E7A52', mouth: 0, facial: 0, glasses: 3, glassesColor: '#C67139', top: 0, topColor: '#D9663F', extra: 4, extraColor: '#3F6F8A' },
  { name: 'Kofi', skin: 0.95, hair: 8, hairColor: '#1E1916', eyes: 0, eyeColor: '#3A2A20', mouth: 2, facial: 4, glasses: 0, glassesColor: '#2A1E19', top: 4, topColor: '#5D8A6B', extra: 0, extraColor: '#D9A441' },
  { name: 'Nina', skin: 0.62, hair: 11, hairColor: '#5C3D27', eyes: 1, eyeColor: '#5C3D27', mouth: 0, facial: 0, glasses: 0, glassesColor: '#2A1E19', top: 0, topColor: '#C9834A', extra: 5, extraColor: '#C96B7A' },
  { name: 'Dad', skin: 0.42, hair: 0, hairColor: '#B3ADA6', eyes: 0, eyeColor: '#5C3D27', mouth: 1, facial: 1, glasses: 2, glassesColor: '#4A4038', top: 3, topColor: '#8A6F5A', extra: 0, extraColor: '#D9A441' },
  { name: 'Ivy', skin: 0.05, hair: 10, hairColor: '#EED595', eyes: 0, eyeColor: '#3E6E8E', mouth: 0, facial: 0, glasses: 0, glassesColor: '#2A1E19', top: 2, topColor: '#9C5A4A', extra: 3, extraColor: '#F0B8C0' },
  { name: 'Sam', skin: 0.72, hair: 12, hairColor: '#3A2A20', eyes: 2, eyeColor: '#3A2A20', mouth: 0, facial: 0, glasses: 1, glassesColor: '#B0813F', top: 3, topColor: '#3F6F8A', extra: 1, extraColor: '#D9A441' },
];

/**
 * The companion kit: a dog, a cat or a baby, drawn in the same detailed style
 * as people. A companion belongs to its person, not to a village; you post as
 * yourself and the update wears their face.
 *
 * Each kind has its own lists. `style` is ears for a dog, coat for a cat and
 * hair for a baby; `mainColor` is fur for a pet and the onesie for a baby.
 */
export const CompanionKit = {
  kinds: ['Dog', 'Cat', 'Baby'],
  styles: [['Floppy ears', 'Pointy ears', 'Folded ears'], ['Short fur', 'Fluffy'], ['Tuft', 'Curls', 'Wisps', 'Bald']],
  markings: [['None', 'Eye patch', 'Blaze', 'Spots'], ['None', 'Tabby', 'Patch', 'Tuxedo'], ['None']],
  accessories: [['None', 'Collar', 'Bandana', 'Bow'], ['None', 'Collar', 'Bandana', 'Bow'], ['None', 'Bow', 'Beanie', 'Pacifier']],
  /** Fur: white, cream, gold, ginger, brown, chocolate, grey, black. */
  furRange: ['#F4EFE7', '#EBD9B8', '#D9A55C', '#B8692F', '#7A4E2E', '#4F3324', '#8E8A86', '#252220'],
  /** Includes a husky ice-blue. */
  eyeSwatches: ['#6B4A2E', '#3A2A20', '#C9822E', '#B9A23A', '#8DA34A', '#3E6E8E', '#7FB2D9'],
  markingSwatches: ['#F4EFE7', '#EBD9B8', '#D9A55C', '#B8692F', '#7A4E2E', '#8E8A86', '#252220'],
  onesieSwatches: ['#F0B8C0', '#BCD8E0', '#F2ECE2', '#D9A55C', '#7A8A5E', '#C96B7A'],
} as const;

export const COMPANION_DOG = 0;
export const COMPANION_CAT = 1;
export const COMPANION_BABY = 2;

/** A companion. This whole object is what goes into `/users/{uid}.companion`. */
export interface CompanionSpec {
  readonly kind: number; // 0 dog, 1 cat, 2 baby
  readonly mainColor: string; // fur, or a baby's onesie
  readonly skin: number; // baby: 0–1 along AvatarKit.skinRange
  readonly hairColor: string; // baby
  readonly style: number;
  readonly markings: number;
  readonly markingColor: string;
  /** The left eye as you look at the companion, or both eyes when they match. */
  readonly eyeColor: string;
  /** The right eye. Equal to eyeColor unless the companion is odd-eyed. */
  readonly eyeColor2: string;
  readonly accessory: number;
  readonly accessoryColor: string;
}

export const defaultCompanion: CompanionSpec = {
  kind: 0, mainColor: '#D9A55C', skin: 0.3, hairColor: '#3A2A20', style: 0, markings: 2,
  markingColor: '#F4EFE7', eyeColor: '#6B4A2E', eyeColor2: '#6B4A2E', accessory: 1, accessoryColor: '#C67139',
};

/** Keep a companion's style indices valid for its kind. */
export function fitCompanion(spec: CompanionSpec): CompanionSpec {
  const k = ((Math.trunc(spec.kind) % 3) + 3) % 3;
  const wrap = (v: number, n: number) => ((Math.trunc(v) % n) + n) % n;
  return {
    ...spec,
    kind: k,
    style: wrap(spec.style, CompanionKit.styles[k].length),
    markings: wrap(spec.markings, CompanionKit.markings[k].length),
    accessory: wrap(spec.accessory, CompanionKit.accessories[k].length),
  };
}

/** Read a companion back from a Firestore document, repairing anything malformed. */
export function companionFromMap(map: Record<string, unknown>): CompanionSpec {
  const int = (key: 'kind' | 'style' | 'markings' | 'accessory') => {
    const v = map[key];
    return typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : defaultCompanion[key];
  };
  const colour = (key: 'mainColor' | 'hairColor' | 'markingColor' | 'eyeColor' | 'accessoryColor') => {
    const v = map[key];
    return typeof v === 'string' && HEX.test(v) ? v.toUpperCase() : defaultCompanion[key];
  };
  const skin = typeof map.skin === 'number' && Number.isFinite(map.skin) ? Math.min(1, Math.max(0, map.skin)) : defaultCompanion.skin;
  const eyeColor = colour('eyeColor');
  // Companions saved before odd eyes existed have no second colour: match the first.
  const eyeColor2 = typeof map.eyeColor2 === 'string' && HEX.test(map.eyeColor2) ? map.eyeColor2.toUpperCase() : eyeColor;
  return fitCompanion({
    kind: int('kind'), mainColor: colour('mainColor'), skin, hairColor: colour('hairColor'),
    style: int('style'), markings: int('markings'), markingColor: colour('markingColor'),
    eyeColor, eyeColor2, accessory: int('accessory'), accessoryColor: colour('accessoryColor'),
  });
}

/** Exactly the companion's fields, ready to write. */
export function companionToMap(spec: CompanionSpec): Record<string, number | string> {
  return {
    kind: spec.kind, mainColor: spec.mainColor, skin: spec.skin, hairColor: spec.hairColor,
    style: spec.style, markings: spec.markings, markingColor: spec.markingColor,
    eyeColor: spec.eyeColor, eyeColor2: spec.eyeColor2, accessory: spec.accessory, accessoryColor: spec.accessoryColor,
  };
}

export function companionKey(spec: CompanionSpec): string {
  return [spec.kind, spec.mainColor, spec.skin.toFixed(3), spec.hairColor, spec.style, spec.markings,
    spec.markingColor, spec.eyeColor, spec.eyeColor2, spec.accessory, spec.accessoryColor].join('|');
}

/** Made-up companions, for the review screen and as fixtures. */
export const sampleCompanions: readonly (CompanionSpec & { readonly name: string })[] = [
  { name: 'Bandit', kind: 0, mainColor: '#D9A55C', skin: 0.3, hairColor: '#3A2A20', style: 0, markings: 2, markingColor: '#F4EFE7', eyeColor: '#6B4A2E', eyeColor2: '#6B4A2E', accessory: 1, accessoryColor: '#C67139' },
  { name: 'Kuya', kind: 0, mainColor: '#4F3324', skin: 0.3, hairColor: '#3A2A20', style: 1, markings: 0, markingColor: '#D9A55C', eyeColor: '#6B4A2E', eyeColor2: '#7FB2D9', accessory: 2, accessoryColor: '#3F6F8A' },
  { name: 'Pepper', kind: 0, mainColor: '#F4EFE7', skin: 0.3, hairColor: '#3A2A20', style: 2, markings: 1, markingColor: '#4F3324', eyeColor: '#3A2A20', eyeColor2: '#3A2A20', accessory: 3, accessoryColor: '#C96B7A' },
  { name: 'Miso', kind: 1, mainColor: '#B8692F', skin: 0.3, hairColor: '#3A2A20', style: 0, markings: 1, markingColor: '#7A4E2E', eyeColor: '#B9A23A', eyeColor2: '#B9A23A', accessory: 1, accessoryColor: '#3F6F8A' },
  { name: 'Luna', kind: 1, mainColor: '#252220', skin: 0.3, hairColor: '#3A2A20', style: 1, markings: 3, markingColor: '#F4EFE7', eyeColor: '#8DA34A', eyeColor2: '#8DA34A', accessory: 3, accessoryColor: '#C96B7A' },
  { name: 'Tofu', kind: 1, mainColor: '#F4EFE7', skin: 0.3, hairColor: '#3A2A20', style: 0, markings: 2, markingColor: '#8E8A86', eyeColor: '#3E6E8E', eyeColor2: '#3E6E8E', accessory: 0, accessoryColor: '#C67139' },
  { name: 'Baby Ana', kind: 2, mainColor: '#F0B8C0', skin: 0.45, hairColor: '#3A2A20', style: 0, markings: 0, markingColor: '#F4EFE7', eyeColor: '#3A2A20', eyeColor2: '#3A2A20', accessory: 1, accessoryColor: '#C96B7A' },
  { name: 'Baby Leo', kind: 2, mainColor: '#BCD8E0', skin: 0.15, hairColor: '#D9AB60', style: 1, markings: 0, markingColor: '#F4EFE7', eyeColor: '#3A2A20', eyeColor2: '#3A2A20', accessory: 3, accessoryColor: '#7A8A5E' },
  { name: 'Baby Kai', kind: 2, mainColor: '#D9A55C', skin: 0.8, hairColor: '#1E1916', style: 2, markings: 0, markingColor: '#F4EFE7', eyeColor: '#3A2A20', eyeColor2: '#3A2A20', accessory: 2, accessoryColor: '#5D8A6B' },
];

/**
 * Each scene's sky gradient, top to bottom. Lifted from the prototype's scene
 * definitions by script, not typed by hand; test/palettes.test.ts re-reads the
 * prototype and fails if these drift from it.
 *
 * Avatars are drawn on their village's sky, so these belong with the palette
 * rather than with the scene layers that arrive in T2.1.
 */
export interface SceneSky {
  readonly stops: readonly string[];
  readonly positions: readonly number[];
}

export const sceneSkies: Readonly<Record<SceneKey, SceneSky>> = {
  night: {
    stops: ['#2E2B25', '#474238', '#8C491A', '#D67F48'],
    positions: [0, 0.5, 0.82, 1],
  },
  forest: {
    stops: ['#CCDBB2', '#F0FAE1', '#E1EECC'],
    positions: [0, 0.6, 1],
  },
  tropical: {
    stops: ['#FFC6A5', '#FFF2EB', '#FFE1D0'],
    positions: [0, 0.62, 1],
  },
  desert: {
    stops: ['#E6A95F', '#F7DFAE', '#F3C58C'],
    positions: [0, 0.55, 1],
  },
  terrace: {
    stops: ['#CFE0D8', '#F7F1DE', '#F7E6C9'],
    positions: [0, 0.58, 1],
  },
  savanna: {
    stops: ['#E2A04A', '#F3C46F', '#D9663F'],
    positions: [0, 0.5, 1],
  },
  coast: {
    stops: ['#BCD8E0', '#E9F2EE', '#F3E7D2'],
    positions: [0, 0.55, 1],
  },
  winter: {
    stops: ['#C6D2DE', '#EEF2F6', '#E6E9EA'],
    positions: [0, 0.6, 1],
  },
  blossom: {
    stops: ['#F4D3CE', '#FDEEE6', '#F7E6D2'],
    positions: [0, 0.6, 1],
  },
};
