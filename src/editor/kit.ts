// Tahan — the face editor's model.
//
// Pure. What the editor shows, in the order the avatar lab settled on
// (design/avatar-lab.html), and how each control changes a spec. Styles are
// picked from drawn thumbnails; colours from a natural range (skin, hair,
// fur), from quick swatches, or from "any colour" — no colour is ever a
// separate piece of art.

import {
  alongStops, hexToOklch, oklabDistance, oklabLightness, oklchToHex,
} from '../theme/oklch.ts';
import {
  AvatarKit, CompanionKit, defaultCompanion, fitCompanion,
  type AvatarSpec, type CompanionSpec,
} from '../theme/palettes.ts';
import { hashString } from '../data/user.ts';

// ---------------------------------------------------------------------------
// Controls

/** A colour chosen by sliding along a natural range. */
export interface RangeControl {
  readonly type: 'range';
  readonly label: string;
  readonly stops: readonly string[];
  /** The field it sets. `skin` holds the position itself; the others a colour. */
  readonly field: string;
  readonly holds: 'position' | 'colour';
  /** Offer "any colour" too — hair can be blue. */
  readonly anyColour: boolean;
}

/** A colour chosen from quick picks, or any colour. */
export interface SwatchControl {
  readonly type: 'swatches';
  readonly label: string;
  readonly field: string;
  readonly list: readonly string[];
}

export type ColourControl = RangeControl | SwatchControl;

export interface Part {
  readonly key: string;
  readonly title: string;
  /** Style names, when the part has styles. The field is `key`. */
  readonly options?: readonly string[];
  readonly colour?: ColourControl;
  /** The second eye, for an odd-eyed companion. */
  readonly colour2?: SwatchControl;
  /** Shows the "different colours for each eye" switch. */
  readonly oddToggle?: boolean;
  readonly hint?: string;
}

const range = (label: string, stops: readonly string[], field: string, holds: RangeControl['holds'], anyColour = false): RangeControl =>
  ({ type: 'range', label, stops, field, holds, anyColour });
const swatches = (label: string, field: string, list: readonly string[]): SwatchControl =>
  ({ type: 'swatches', label, field, list });

/** A person's parts, in the lab's order. */
export function personParts(): Part[] {
  const K = AvatarKit;
  return [
    { key: 'skin', title: 'Skin', colour: range('Tone', K.skinRange, 'skin', 'position'),
      hint: 'One slider through natural skin tones. Shadows and highlights follow.' },
    { key: 'hair', title: 'Hair', options: K.hairStyles, colour: range('Colour', K.hairRange, 'hairColor', 'colour', true) },
    { key: 'eyes', title: 'Eyes', options: K.eyeStyles, colour: swatches('Colour', 'eyeColor', K.eyeSwatches) },
    { key: 'glasses', title: 'Glasses', options: K.glasses, colour: swatches('Frames', 'glassesColor', K.frameSwatches) },
    { key: 'mouth', title: 'Mouth', options: K.mouths },
    { key: 'facial', title: 'Facial hair', options: K.facialHair, hint: 'Takes the hair colour.' },
    { key: 'extra', title: 'Extras', options: K.extras, colour: swatches('Colour', 'extraColor', K.extraSwatches) },
    { key: 'top', title: 'Clothes', options: K.tops, colour: swatches('Colour', 'topColor', K.clothSwatches) },
  ];
}

/** A companion's parts. They depend on the kind; a baby has skin and hair, a pet fur. */
export function companionParts(pet: CompanionSpec, oddEyes: boolean): Part[] {
  const C = CompanionKit;
  const k = pet.kind;
  const parts: Part[] = [{
    key: 'kind', title: 'Companion', options: C.kinds,
    hint: 'A companion belongs to you, not to a village. You post as yourself; the update wears their face.',
  }];
  if (k === 2) {
    parts.push(
      { key: 'skin', title: 'Skin', colour: range('Tone', AvatarKit.skinRange, 'skin', 'position') },
      { key: 'style', title: 'Hair', options: C.styles[2], colour: range('Colour', AvatarKit.hairRange, 'hairColor', 'colour', true) },
      { key: 'onesie', title: 'Onesie', colour: swatches('Colour', 'mainColor', C.onesieSwatches) },
      { key: 'accessory', title: 'Extras', options: C.accessories[2], colour: swatches('Colour', 'accessoryColor', AvatarKit.extraSwatches) },
    );
  } else {
    parts.push(
      { key: 'fur', title: 'Fur', colour: range('Colour', C.furRange, 'mainColor', 'colour', true),
        hint: 'White, cream, gold, ginger, brown, chocolate, grey, black — or any colour.' },
      { key: 'style', title: k === 0 ? 'Ears' : 'Coat', options: C.styles[k] },
      { key: 'markings', title: 'Markings', options: C.markings[k], colour: swatches('Colour', 'markingColor', C.markingSwatches) },
      { key: 'eyes', title: 'Eyes', colour: swatches(oddEyes ? 'Left eye' : 'Colour', 'eyeColor', C.eyeSwatches),
        colour2: oddEyes ? swatches('Right eye', 'eyeColor2', C.eyeSwatches) : undefined, oddToggle: true,
        hint: oddEyes ? 'Left and right as you look at them.' : undefined },
      { key: 'accessory', title: 'Extras', options: C.accessories[k], colour: swatches('Colour', 'accessoryColor', AvatarKit.extraSwatches) },
    );
  }
  return parts;
}

// ---------------------------------------------------------------------------
// Changing a spec

type Spec = AvatarSpec | CompanionSpec;

/** Pick a style. For a companion's kind, the other styles are refitted to it. */
export function withOption<S extends Spec>(spec: S, key: string, index: number): S {
  const next = { ...spec, [key]: index } as S;
  return 'kind' in next ? (fitCompanion(next as CompanionSpec) as S) : next;
}

/**
 * Set a colour field. A companion with matching eyes keeps them matching: the
 * first eye's colour is both eyes' colour until the switch is on.
 */
export function withColour<S extends Spec>(spec: S, field: string, value: string | number, oddEyes = false): S {
  const next = { ...spec, [field]: value } as S;
  if ('eyeColor2' in next && field === 'eyeColor' && !oddEyes) return { ...next, eyeColor2: value } as S;
  return next;
}

/** Whether a companion's eyes differ. */
export const hasOddEyes = (pet: CompanionSpec): boolean => pet.eyeColor.toUpperCase() !== pet.eyeColor2.toUpperCase();

/** Turning the switch off makes the right eye match the left. */
export const withOddEyes = <P extends CompanionSpec>(pet: P, on: boolean): P => (on ? pet : { ...pet, eyeColor2: pet.eyeColor });

/** A spec's value for a field, as the controls read it. */
export const valueOf = (spec: Spec, field: string): string | number => (spec as unknown as Record<string, string | number>)[field];

// ---------------------------------------------------------------------------
// Positions and colours

/** The colour at a position along a range. */
export const colourAt = (stops: readonly string[], t: number): string => alongStops(stops, t);

/**
 * Where along a range a colour sits — the nearest point, so a slider shows
 * the right place for a colour saved earlier, or one picked as "any colour".
 */
export function positionOf(stops: readonly string[], hex: string, samples = 240): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const d = oklabDistance(alongStops(stops, t), hex);
    if (d < bestD) { bestD = d; best = t; }
  }
  return best;
}

/** Whether a colour is on a range at all, or was picked as "any colour". */
export const isOnRange = (stops: readonly string[], hex: string): boolean =>
  oklabDistance(alongStops(stops, positionOf(stops, hex)), hex) < 0.02;

/** "Any colour": a slider round the hue wheel at a friendly lightness and strength. */
export const HUE_LIGHTNESS = 0.66;
export const HUE_CHROMA = 0.13;
export const hueColour = (hue: number): string => oklchToHex({ l: HUE_LIGHTNESS, c: HUE_CHROMA, h: ((hue % 360) + 360) % 360 });
export const hueOf = (hex: string): number => hexToOklch(hex).h;
/** Stops for drawing the hue slider's track. */
export const hueStops = (n = 13): string[] => Array.from({ length: n }, (_, i) => hueColour((i / (n - 1)) * 360));

/**
 * A plain name for a colour, so a screen reader can say "dark brown" rather
 * than "#5C3D27". Rough on purpose: names are for telling swatches apart.
 */
export function colourName(hex: string): string {
  const { l, c, h } = hexToOklch(hex);
  const L = oklabLightness(hex);
  const shade = L > 0.7 ? 'light ' : L < 0.42 ? 'dark ' : '';
  if (c < 0.02) {
    if (L > 0.93) return 'white';
    if (L < 0.3) return 'black';
    return `${shade}grey`;
  }
  let name: string;
  if (h < 20 || h >= 345) name = l < 0.55 ? 'red' : 'pink';
  else if (h < 45) name = 'red';
  else if (h < 75) name = l < 0.58 ? 'brown' : 'orange';
  else if (h < 105) name = l < 0.6 ? 'brown' : 'gold';
  else if (h < 140) name = 'olive';
  else if (h < 175) name = 'green';
  else if (h < 215) name = 'teal';
  else if (h < 275) name = 'blue';
  else if (h < 315) name = 'purple';
  else name = 'pink';
  if (name === 'brown' && L > 0.75) return 'tan';
  return `${shade}${name}`;
}

// ---------------------------------------------------------------------------
// Surprise me

/** The nth surprise companion of a kind: a sequence from the uid, never Math.random(). */
export function surpriseCompanion(uid: string, n: number, kind: number): CompanionSpec {
  let h = hashString(`${uid}~pet~${kind}~${n}`) || 1;
  const next = (m: number) => {
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
    h = (h ^ (h >>> 12)) >>> 0;
    return h % m;
  };
  const pick = <T,>(list: readonly T[]): T => list[next(list.length)];
  const C = CompanionKit;
  const eyeColor = pick(C.eyeSwatches);
  const odd = kind !== 2 && next(100) < 15;
  return fitCompanion({
    ...defaultCompanion,
    kind,
    mainColor: kind === 2 ? pick(C.onesieSwatches) : alongStops(C.furRange, next(1001) / 1000),
    skin: next(1001) / 1000,
    hairColor: alongStops(AvatarKit.hairRange, next(1001) / 1000),
    style: next(C.styles[kind].length),
    markings: next(C.markings[kind].length),
    markingColor: pick(C.markingSwatches),
    eyeColor,
    eyeColor2: odd ? pick(C.eyeSwatches.filter((e) => e !== eyeColor)) : eyeColor,
    accessory: next(C.accessories[kind].length),
    accessoryColor: pick(AvatarKit.extraSwatches),
  });
}
