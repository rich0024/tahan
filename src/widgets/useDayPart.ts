// The part of the day, from the phone's clock — recomputed whenever the app
// comes back to the foreground (and once a minute while it's open), not only
// at launch, so the wash is right after the phone's been in a pocket all
// afternoon.

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { dayPartAt, type DayPart } from '../paint/wash.ts';

const now = (): DayPart => dayPartAt(new Date().getHours());

export function useDayPart(override: DayPart | 'auto' = 'auto'): DayPart {
  const [part, setPart] = useState<DayPart>(now);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setPart(now());
    });
    const id = setInterval(() => setPart(now()), 60_000);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, []);

  return override === 'auto' ? part : override;
}

/** Whether the app is in the foreground. Drift stops when it isn't. */
export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}
