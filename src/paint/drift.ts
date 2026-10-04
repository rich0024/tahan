// Tahan — ambient drift: fireflies, leaves, breeze, dust, rain, snow, petals.
//
// Pure. Each scene carries one effect. Its particles are fixed per index and
// scene key — position, size, speed and phase all come from a hash, never a
// random number — so the pattern is the same on every render and every
// launch. All of them run off one clock (seconds since the room appeared);
// where a particle is at any moment is `particleAt(p, t)`, which also runs
// as a Reanimated worklet on the UI thread.
//
// Shapes, colours, counts and paths are the prototype's (design/Tahan.dc.html,
// particles() and the vfall/vrain/vglow/vdrift keyframes), measured in a
// 402 × 874 room and scaled to the real one. Counts follow the prototype
// (window backdrop): 26, except fireflies 14 and breeze 6 — the brief's
// "18–26" read too busy for those two.

import { hashString } from '../data/user.ts';
import type { Drift, SceneKey } from '../theme/palettes.ts';

export type Motion = 'fall' | 'rain' | 'glow' | 'drift';

export interface Particle {
  readonly motion: Motion;
  /** Start position, as a share of the room's width and height. */
  readonly x: number;
  readonly y: number;
  /** Size in points (before the room's scale). */
  readonly w: number;
  readonly h: number;
  /** Corner radius in points; a pill when it's half the short side. */
  readonly r: number;
  readonly color: string;
  readonly opacity: number;
  /** Seconds for one pass. */
  readonly duration: number;
  /** Where in its pass it starts, 0–1. */
  readonly phase: number;
}

const ROOM_W = 402;
const ROOM_H = 874;

const COLOURS: Readonly<Record<Drift, string>> = {
  snow: '#FFFFFF', petals: '#F0B8C0', leaves: '#56633F', rain: '#DFEAF0',
  fireflies: '#FFD9A0', dust: '#F7E0B8', breeze: '#FFFFFF',
};

export const particleCount = (drift: Drift): number => (drift === 'breeze' ? 6 : drift === 'fireflies' ? 14 : 26);

/** 0–1 from a hash of the scene, the particle and what it's for. */
const unit = (scene: SceneKey, i: number, salt: string): number => hashString(`${scene}#${i}#${salt}`) / 0x100000000;

/**
 * The particles for a scene. Empty when motion is off — reduced motion, or
 * the Ambient motion setting — so nothing is drawn at all, not slowed.
 */
export function driftParticles(scene: SceneKey, drift: Drift, motion = true): Particle[] {
  if (!motion) return [];
  const out: Particle[] = [];
  for (let i = 0; i < particleCount(drift); i++) {
    const u = (salt: string) => unit(scene, i, salt);
    const x = u('x');
    const phase = u('phase');
    const color = COLOURS[drift];
    switch (drift) {
      case 'snow': {
        const s = 3 + Math.round(u('size') * 3);
        out.push({ motion: 'fall', x, y: -0.06, w: s, h: s, r: s / 2, color, opacity: 0.8, duration: 13 + u('speed') * 9, phase });
        break;
      }
      case 'petals':
        out.push({ motion: 'fall', x, y: -0.06, w: 8, h: 5, r: 2.5, color, opacity: 0.85, duration: 12 + u('speed') * 8, phase });
        break;
      case 'leaves':
        out.push({ motion: 'fall', x, y: -0.06, w: 9, h: 5, r: 2.5, color, opacity: 0.75, duration: 13 + u('speed') * 8, phase });
        break;
      case 'rain':
        out.push({ motion: 'rain', x, y: -0.08, w: 1.5, h: 16, r: 1, color, opacity: 0.5, duration: 1.9 + u('speed') * 1.1, phase });
        break;
      case 'fireflies':
        out.push({ motion: 'glow', x, y: 0.1 + u('y') * 0.8, w: 5, h: 5, r: 2.5, color, opacity: 0.95, duration: 3 + u('speed') * 3, phase });
        break;
      case 'dust':
        out.push({ motion: 'drift', x: -0.06, y: 0.14 + u('y') * 0.76, w: 4, h: 4, r: 2, color, opacity: 0.55, duration: 9 + u('speed') * 8, phase });
        break;
      case 'breeze':
        out.push({ motion: 'drift', x: -0.18, y: 0.12 + u('y') * 0.78, w: 70, h: 3, r: 1.5, color, opacity: 0.3, duration: 11 + u('speed') * 7, phase });
        break;
    }
  }
  return out;
}

export interface ParticleFrame {
  /** Centre, in the room's points. */
  readonly x: number;
  readonly y: number;
  readonly rotate: number; // degrees
  readonly opacity: number;
  /** The room's scale against the 402 × 874 authoring room. */
  readonly scale: number;
}

/**
 * Where a particle is at `t` seconds, in a width × height room. Loops: the
 * frame at t and at t + duration is the same. A worklet, so the UI thread can
 * run it every frame.
 */
export function particleAt(p: Particle, t: number, width: number, height: number): ParticleFrame {
  'worklet';
  const scale = width / ROOM_W;
  const k = height / ROOM_H;
  let u = (t / p.duration + p.phase) % 1;
  if (u < 0) u += 1;
  const x0 = p.x * width + (p.w * scale) / 2;
  const y0 = p.y * height + (p.h * scale) / 2;
  switch (p.motion) {
    case 'fall': // vfallL: (0, −30) → (60, 920), turning 520°
      return { x: x0 + 60 * u * scale, y: y0 - 30 * k + 950 * u * k, rotate: 520 * u, opacity: p.opacity, scale };
    case 'rain': // vrainL: (0, −40) → (−52, 920)
      return { x: x0 - 52 * u * scale, y: y0 - 40 * k + 960 * u * k, rotate: 0, opacity: p.opacity, scale };
    case 'glow': { // vglow: rises and brightens, then sinks and fades, eased
      const e = (1 - Math.cos(u * 2 * Math.PI)) / 2; // 0 → 1 → 0
      return { x: x0, y: y0 + (4 - 14 * e) * scale, rotate: 0, opacity: 0.12 + (p.opacity - 0.12) * e, scale };
    }
    case 'drift': // vdrift: 470 across
    default:
      return { x: x0 + 470 * u * scale, y: y0, rotate: 0, opacity: p.opacity, scale };
  }
}
