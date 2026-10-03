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

/** The avatar kit. Six integers per avatar; these are the only colours. */
export const AvatarKit = {
  skins: ['#F4D3AE', '#E6B98C', '#CF9463', '#A86E44', '#7D4E2D'],
  hairColors: ['#2E2318', '#5A3A22', '#8A6A3A', '#C2A06A', '#C9C2B8'],
  clothes: ['#C67139', '#7A8A5E', '#3F6F8A', '#C96B7A', '#B0813F'],
  /** Companion coats — dog, cat. One extra integer on top of the six. */
  coats: ['#F2ECE2', '#D6B48A', '#A8764A', '#6B5647', '#3A3330'],
  hairNames: ['Short', 'Long', 'Bun', 'Curls', 'Wrap', 'Braids', 'Bald', 'Cap'],
  glassesNames: ['None', 'Round', 'Square', 'Readers'],
  faceNames: ['None', 'Beard', 'Moustache', 'Stubble'],
} as const;

/**
 * Six integers, and nothing else, is the whole of an avatar. This is the shape
 * that goes into `/users/{uid}` — no image, no file, no upload, no crop.
 */
export interface AvatarSpec {
  readonly skin: number; // 0–4
  readonly hairColor: number; // 0–4
  readonly top: number; // 0–4
  readonly hair: number; // 0–7
  readonly glasses: number; // 0–3
  readonly face: number; // 0–3
}

export const defaultSpec: AvatarSpec = {
  skin: 0, hairColor: 0, top: 0, hair: 0, glasses: 0, face: 0,
};

export function avatarSpec(partial: Partial<AvatarSpec> = {}): AvatarSpec {
  return { ...defaultSpec, ...partial };
}

/** Read a spec back from a Firestore document field, tolerating gaps. */
export function specFromMap(map: Record<string, unknown>): AvatarSpec {
  const int = (v: unknown): number =>
    typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : 0;
  return {
    skin: int(map.skin),
    hairColor: int(map.hairColor),
    top: int(map.top),
    hair: int(map.hair),
    glasses: int(map.glasses),
    face: int(map.face),
  };
}

export function specToMap(spec: AvatarSpec): Record<string, number> {
  return {
    skin: spec.skin,
    hairColor: spec.hairColor,
    top: spec.top,
    hair: spec.hair,
    glasses: spec.glasses,
    face: spec.face,
  };
}

/** A stable string key for caches. */
export function specKey(spec: AvatarSpec): string {
  return `${spec.skin}.${spec.hairColor}.${spec.top}.${spec.hair}.${spec.glasses}.${spec.face}`;
}

/**
 * A stable spec for index `i`, for debug grids and "Surprise me" previews.
 *
 * Deliberately not Math.random(): a grid has to look the same on every render,
 * or "that combination was wrong" is not a reproducible report.
 */
export function specForIndex(i: number): AvatarSpec {
  const h = Math.imul(0x9e3779b1, i + 1) >>> 0;
  const pick = (shift: number, mod: number) => ((h >>> shift) & 0xff) % mod;
  return {
    skin: pick(0, 5),
    hairColor: pick(5, 5),
    top: pick(10, 5),
    hair: pick(15, 8),
    glasses: pick(20, 4),
    face: pick(24, 4),
  };
}

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
