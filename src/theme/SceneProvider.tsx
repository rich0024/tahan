// Tahan — the current scene, and the 420ms retint.
//
// Changing village or scene retints the whole app, chrome included, over
// 420ms on an ease-out cubic, with no flash of the previous accent.
//
// How the "no flash" is guaranteed: the colours we are fading FROM, the
// colours we are fading TO, and the progress between them all live in shared
// values on the UI thread, and a scene change updates all three in one
// UI-thread step. If `from`/`to` lived in React state instead, there would be a
// frame where the new colours had committed but the progress had not reset —
// one frame of the wrong accent. That is the flash the brief forbids.
//
// A change that arrives mid-fade starts from wherever the fade had got to.

import {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from 'react';
import {
  Easing,
  interpolateColor,
  runOnUI,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type DerivedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { tahanScenes, type ScenePalette } from './palettes.ts';
import { sceneColors, type SceneColorRole, type SceneColors } from './sceneColors.ts';
import { retint } from './tokens.ts';

type ColorMap = Record<SceneColorRole, string>;

interface SceneContextValue {
  /** The destination scene. Read this for anything that should not fade. */
  palette: ScenePalette;
  /** The destination colours, static. Text and non-animated chrome use these. */
  colors: SceneColors;
  setPalette: (p: ScenePalette) => void;
  from: SharedValue<ColorMap>;
  to: SharedValue<ColorMap>;
  progress: SharedValue<number>;
}

const SceneContext = createContext<SceneContextValue | null>(null);

const roles = Object.keys(sceneColors(tahanScenes[0])) as SceneColorRole[];

export function SceneProvider({
  initial = tahanScenes[0],
  children,
}: {
  initial?: ScenePalette;
  children: ReactNode;
}) {
  const [palette, setPaletteState] = useState(initial);
  const colors = useMemo(() => sceneColors(palette), [palette]);

  const start = sceneColors(initial) as ColorMap;
  const from = useSharedValue<ColorMap>(start);
  const to = useSharedValue<ColorMap>(start);
  const progress = useSharedValue(1);

  const setPalette = useCallback(
    (next: ScenePalette) => {
      setPaletteState(next);
      const target = sceneColors(next) as ColorMap;
      runOnUI((nextColors: ColorMap, keys: SceneColorRole[]) => {
        'worklet';
        // Capture where we are now, so an interrupted fade does not jump.
        const t = progress.value;
        const mid = {} as ColorMap;
        for (const k of keys) {
          mid[k] = interpolateColor(t, [0, 1], [from.value[k], to.value[k]]) as string;
        }
        from.value = mid;
        to.value = nextColors;
        progress.value = 0;
        progress.value = withTiming(1, {
          duration: retint.durationMs,
          easing: Easing.out(Easing.cubic),
        });
      })(target, roles);
    },
    [from, to, progress],
  );

  const value = useMemo(
    () => ({ palette, colors, setPalette, from, to, progress }),
    [palette, colors, setPalette, from, to, progress],
  );

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}

export function useScene(): SceneContextValue {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene() outside <SceneProvider>');
  return ctx;
}

/**
 * One scene colour, animated through the retint. Use inside
 * `useAnimatedStyle(() => ({ backgroundColor: bg.value }))`.
 */
export function useSceneColor(role: SceneColorRole): DerivedValue<string> {
  const { from, to, progress } = useScene();
  return useDerivedValue(
    () => interpolateColor(progress.value, [0, 1], [from.value[role], to.value[role]]) as string,
  );
}
