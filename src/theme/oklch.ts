// Tahan — OKLCH colour ramps.
//
// Every role in the theme gets a 100–900 ramp, generated in OKLCH and never as
// RGB tints. An RGB tint of a warm accent drifts grey and muddy as it
// lightens, and warmth is the whole point of this app.
//
// Shape of the ramp:
//   * step 500 is the source token, EXACTLY. The tokens are final and must
//     survive the ramp untouched.
//   * every other step rides one normalised lightness curve shared by every
//     role, so a 200 is a 200 whichever role it came from.
//   * hue is preserved; chroma eases off at both ends, where the sRGB gamut is
//     tight, and is then gamut-clipped by bisection — never channel-clamped,
//     which would shift the hue and flatten the step.
//
// Pure TypeScript, hex strings in and out.

export const rampSteps = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export type RampStep = (typeof rampSteps)[number];

/**
 * Fraction of the way from the source lightness to the light anchor (below
 * 500) or the dark anchor (above it). Shared by every role.
 */
const lightnessCurve = [1.0, 0.78, 0.55, 0.29, 0.0, 0.2, 0.44, 0.7, 1.0];

/** Chroma relative to the source, per step. Eased off at the extremes. */
const chromaCurve = [0.34, 0.52, 0.72, 0.9, 1.0, 0.97, 0.88, 0.72, 0.55];

const L_MAX = 0.972;
const L_MIN = 0.268;

export type Ramp = Readonly<Record<RampStep, string>> & { readonly base: string };

const rampCache = new Map<string, Ramp>();

/** A 100–900 ramp whose 500 is `base`, unmodified. Cached per base colour. */
export function makeRamp(base: string): Ramp {
  const key = normaliseHex(base);
  const cached = rampCache.get(key);
  if (cached) return cached;

  const src = hexToOklch(key);
  const out: Record<string, string> = { base: key };
  rampSteps.forEach((step, i) => {
    if (step === 500) {
      out[step] = key;
      return;
    }
    const t = lightnessCurve[i];
    const l = step < 500 ? src.l + (L_MAX - src.l) * t : src.l + (L_MIN - src.l) * t;
    out[step] = oklchToHex({ l, c: src.c * chromaCurve[i], h: src.h });
  });

  const ramp = out as unknown as Ramp;
  rampCache.set(key, ramp);
  return ramp;
}

/** Nearest step; out-of-range steps clamp to the ends. */
export function shade(ramp: Ramp, step: number): string {
  const s = Math.min(9, Math.max(1, Math.round(step / 100))) * 100;
  return ramp[s as RampStep];
}

// ---------------------------------------------------------------------------
// Colour space conversion

export interface Oklch {
  readonly l: number;
  readonly c: number;
  /** Degrees, 0–360. */
  readonly h: number;
}

interface Oklab {
  readonly l: number;
  readonly a: number;
  readonly b: number;
}

export function normaliseHex(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`expected #RRGGBB, got '${hex}'`);
  return `#${m[1].toUpperCase()}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(normaliseHex(hex).slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function hexToOklch(hex: string): Oklch {
  const lab = rgbToOklab(hexToRgb(hex));
  const c = Math.hypot(lab.a, lab.b);
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: lab.l, c, h };
}

/** Back to sRGB hex, reducing chroma until the colour is in gamut. */
export function oklchToHex(lch: Oklch): string {
  if (inGamut(lch.l, lch.c, lch.h)) return labToHex(lchToLab(lch.l, lch.c, lch.h));
  let lo = 0;
  let hi = lch.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(lch.l, mid, lch.h)) lo = mid;
    else hi = mid;
  }
  return labToHex(lchToLab(lch.l, lo, lch.h));
}

/** Plain sRGB lerp between two hex colours. Used to capture a mid-retint colour. */
export function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const k = Math.min(1, Math.max(0, t));
  return rgbToHex(ar + (br - ar) * k, ag + (bg - ag) * k, ab + (bb - ab) * k);
}

/** WCAG relative luminance, 0–1. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => srgbToLinear(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, 1–21. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function lchToLab(l: number, c: number, h: number): Oklab {
  const rad = (h * Math.PI) / 180;
  return { l, a: c * Math.cos(rad), b: c * Math.sin(rad) };
}

function inGamut(l: number, c: number, h: number): boolean {
  const eps = 1e-4;
  return labToLinearRgb(lchToLab(l, c, h)).every((v) => v >= -eps && v <= 1 + eps);
}

function rgbToOklab([r8, g8, b8]: [number, number, number]): Oklab {
  const r = srgbToLinear(r8 / 255);
  const g = srgbToLinear(g8 / 255);
  const b = srgbToLinear(b8 / 255);

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    l: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

function labToLinearRgb({ l, a, b }: Oklab): [number, number, number] {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

function labToHex(lab: Oklab): string {
  const [r, g, b] = labToLinearRgb(lab).map(
    (v) => linearToSrgb(Math.min(1, Math.max(0, v))) * 255,
  );
  return rgbToHex(r, g, b);
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

// ---------------------------------------------------------------------------
// Shading helpers for the avatar kit.
//
// An avatar part has one base colour; its shadow and highlight are derived
// here, in OKLab, so any colour a person picks shades correctly without new
// art. These match the avatar lab (design/avatar-lab.html) exactly.

/** Shift a colour's OKLab lightness by `dl` and scale its chroma by `k`, keeping hue. */
export function tone(hex: string, dl: number, k = 1): string {
  const lab = rgbToOklab(hexToRgb(hex));
  const l = Math.min(0.98, Math.max(0.08, lab.l + dl));
  return labToHexUnclamped({ l, a: lab.a * k, b: lab.b * k });
}

/** OKLab lightness, 0–1. */
export function oklabLightness(hex: string): number {
  return rgbToOklab(hexToRgb(hex)).l;
}

/** Mix two colours in OKLab. */
export function mixOklab(a: string, b: string, t: number): string {
  const x = rgbToOklab(hexToRgb(a));
  const y = rgbToOklab(hexToRgb(b));
  return labToHexUnclamped({ l: x.l + (y.l - x.l) * t, a: x.a + (y.a - x.a) * t, b: x.b + (y.b - x.b) * t });
}

/** A colour at position `t` (0–1) along a list of stops, mixed in OKLab. */
export function alongStops(stops: readonly string[], t: number): string {
  const u = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(u));
  return mixOklab(stops[i], stops[i + 1], u - i);
}

/**
 * Like labToHex, but clamps each channel instead of bisecting chroma — the
 * lab's behaviour, kept identical so the app and the lab draw the same face.
 * Avatar tones stay well inside the gamut, so the difference never shows.
 */
function labToHexUnclamped(lab: Oklab): string {
  const [r, g, b] = labToLinearRgb(lab).map(
    (v) => Math.round(Math.min(1, Math.max(0, linearToSrgb(Math.min(1, Math.max(0, v))))) * 255),
  );
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}
