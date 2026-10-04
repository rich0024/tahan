// Tahan — the time-of-day wash.
//
// Pure. One low-alpha gradient over the scene, tinted by the phone's clock:
// morning warms, afternoon is near neutral, evening goes amber, night goes
// deep. Values are the prototype's (design/Tahan.dc.html, dayFor()).
//
// One deliberate difference: the prototype calls every hour before 11
// "morning", so 2am got the morning wash. Here the small hours are night.

import { withAlpha } from '../theme/oklch.ts';

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export const dayParts: readonly DayPart[] = ['morning', 'afternoon', 'evening', 'night'];

/** The part of the day for an hour, 0–23. */
export function dayPartAt(hour: number): DayPart {
  if (hour < 5 || hour >= 20) return 'night';
  if (hour < 11) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export interface Wash {
  /** rgba() colours, top to bottom. */
  readonly colors: readonly string[];
  /** Where each colour sits, 0 (top) to 1 (bottom). */
  readonly positions: readonly number[];
}

const W = (hex: string, a: number) => withAlpha(hex, a);

export const washes: Readonly<Record<DayPart, Wash>> = {
  morning: { colors: [W('#FFECC7', 0.34), W('#FFFFFF', 0)], positions: [0, 0.62] },
  afternoon: { colors: [W('#FFFFFF', 0.12), W('#FFFFFF', 0)], positions: [0, 0.55] },
  evening: { colors: [W('#D67F48', 0.3), W('#8C491A', 0.22)], positions: [0, 0.7] },
  night: { colors: [W('#1B1712', 0.52), W('#2E2B25', 0.3)], positions: [0, 0.7] },
};

export const dayPartName: Readonly<Record<DayPart, string>> = {
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night',
};
