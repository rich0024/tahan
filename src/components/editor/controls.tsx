// Tahan — the face editor's controls.
//
// Every one is at least 56pt where a thumb lands: style thumbnails, colour
// swatches, and sliders. Sliders are drawn by the app (a Skia gradient track
// and a knob in the colour it's set to) and are "adjustable" to a screen
// reader — swipe up or down to move them.

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import { Canvas, Circle, LinearGradient, RoundedRect, SweepGradient, vec } from '@shopify/react-native-skia';

import { colourName, hueStops } from '../../editor/kit.ts';
import { useScene } from '../../theme/SceneProvider.tsx';
import { hitTarget, radius } from '../../theme/tokens.ts';
import { T } from '../themed.tsx';

const clamp = (t: number) => Math.min(1, Math.max(0, t));

// ---------------------------------------------------------------------------
// Style thumbnails

export function Thumbs({ title, options, selected, onSelect, draw }: {
  title: string;
  options: readonly string[];
  selected: number;
  onSelect: (index: number) => void;
  /** The thumbnail for option i: the face or companion as it would look. */
  draw: (index: number, size: number) => ReactNode;
}) {
  const { colors } = useScene();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={`${title} style`}>
      {options.map((name, i) => {
        const on = i === selected;
        return (
          <Pressable
            key={name}
            onPress={() => onSelect(i)}
            accessibilityRole="radio"
            accessibilityLabel={name}
            accessibilityState={{ selected: on, checked: on }}
            style={{ alignItems: 'center', width: 72, gap: 4 }}
          >
            <View
              style={{
                width: 64, height: 64, borderRadius: radius.pill, padding: 2, borderWidth: 2.5,
                borderColor: on ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {draw(i, 54)}
            </View>
            <T variant="metaSmall" color={on ? 'accent700' : 'inkMuted'} style={{ textAlign: 'center' }} numberOfLines={2}>
              {name}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Swatches

const SWATCH = 40;

function Dot({ colour, on }: { colour: string; on: boolean }) {
  const { colors } = useScene();
  return (
    <View
      style={{
        width: SWATCH + 8, height: SWATCH + 8, borderRadius: radius.pill, borderWidth: 2.5,
        borderColor: on ? colors.ink : 'transparent', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <View style={{ width: SWATCH, height: SWATCH, borderRadius: radius.pill, backgroundColor: colour, borderWidth: 1, borderColor: colors.accent300 }} />
    </View>
  );
}

/** A rainbow dot: "any colour". */
function Rainbow({ on }: { on: boolean }) {
  const { colors } = useScene();
  const stops = useMemo(() => hueStops(), []);
  const r = SWATCH / 2;
  return (
    <View
      style={{
        width: SWATCH + 8, height: SWATCH + 8, borderRadius: radius.pill, borderWidth: 2.5,
        borderColor: on ? colors.ink : 'transparent', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Canvas style={{ width: SWATCH, height: SWATCH }}>
        <Circle cx={r} cy={r} r={r}>
          <SweepGradient c={vec(r, r)} colors={stops} />
        </Circle>
      </Canvas>
    </View>
  );
}

/**
 * Quick-pick swatches, then a rainbow for any colour. `custom` is true when
 * the current colour isn't one of the swatches.
 */
export function Swatches({ label, list, value, onPick, anyOpen, onAny }: {
  label: string;
  list: readonly string[];
  value: string;
  onPick: (hex: string) => void;
  anyOpen: boolean;
  onAny: () => void;
}) {
  const current = value.toUpperCase();
  const custom = !list.some((c) => c.toUpperCase() === current);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {list.map((c) => {
        const on = c.toUpperCase() === current;
        return (
          <Pressable
            key={c}
            onPress={() => onPick(c)}
            accessibilityRole="radio"
            accessibilityLabel={colourName(c)}
            accessibilityState={{ selected: on, checked: on }}
            style={{ width: hitTarget, height: hitTarget, alignItems: 'center', justifyContent: 'center' }}
          >
            <Dot colour={c} on={on} />
          </Pressable>
        );
      })}
      <Pressable
        onPress={onAny}
        accessibilityRole="button"
        accessibilityLabel={custom ? `Any colour, now ${colourName(value)}` : 'Any colour'}
        accessibilityState={{ expanded: anyOpen, selected: custom }}
        style={{ width: hitTarget, height: hitTarget, alignItems: 'center', justifyContent: 'center' }}
      >
        <Rainbow on={custom || anyOpen} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sliders

const KNOB = 34;
const TRACK = 26;

export interface SliderProps {
  label: string;
  /** The track's colours, left to right. */
  stops: readonly string[];
  /** 0–1. */
  value: number;
  /** The knob's fill: the colour the slider is set to. */
  knob: string;
  /** What a screen reader says the value is. */
  valueText: string;
  onChange: (t: number) => void;
  /** A drag began: the editor holds its thumbnails still until it ends. */
  onStart?: () => void;
  onEnd?: (t: number) => void;
}

export function Slider({ label, stops, value, knob, valueText, onChange, onStart, onEnd }: SliderProps) {
  const { colors } = useScene();
  const [width, setWidth] = useState(0);
  const view = useRef<View>(null);
  const left = useRef(0);
  const last = useRef(value);
  const handlers = useRef({ onChange, onStart, onEnd });
  handlers.current = { onChange, onStart, onEnd };

  const responder = useMemo(() => {
    const at = (pageX: number) => clamp((pageX - left.current - KNOB / 2) / Math.max(1, width - KNOB));
    const move = (pageX: number) => {
      last.current = at(pageX);
      handlers.current.onChange(last.current);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // A drag that turns out to be mostly up or down was a scroll that
      // started on the slider: let the page have it.
      onPanResponderTerminationRequest: (_e, g) => Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderGrant: (e) => {
        const { pageX } = e.nativeEvent;
        handlers.current.onStart?.();
        view.current?.measureInWindow((x) => {
          left.current = x;
          move(pageX);
        });
      },
      onPanResponderMove: (e) => move(e.nativeEvent.pageX),
      onPanResponderRelease: () => handlers.current.onEnd?.(last.current),
      onPanResponderTerminate: () => handlers.current.onEnd?.(last.current),
    });
  }, [width]);

  const step = (d: number) => {
    const t = clamp(value + d);
    onChange(t);
    onEnd?.(t);
  };

  return (
    <View
      ref={view}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: valueText }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 0.05 : -0.05)}
      style={{ height: hitTarget, justifyContent: 'center', flexGrow: 1, flexBasis: 200 }}
      {...responder.panHandlers}
    >
      {width > 0 && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height: hitTarget }}>
          <Canvas style={{ width, height: hitTarget }}>
            <RoundedRect x={KNOB / 2 - TRACK / 2} y={(hitTarget - TRACK) / 2} width={width - KNOB + TRACK} height={TRACK} r={TRACK / 2}>
              <LinearGradient start={vec(KNOB / 2, 0)} end={vec(width - KNOB / 2, 0)} colors={[...stops]} />
            </RoundedRect>
          </Canvas>
          <View
            style={{
              position: 'absolute', top: (hitTarget - KNOB) / 2, left: value * (width - KNOB),
              width: KNOB, height: KNOB, borderRadius: radius.pill,
              backgroundColor: knob, borderWidth: 3, borderColor: colors.surface,
              shadowColor: colors.ink, shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
              elevation: 3,
            }}
          />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------

/** A labelled row: the label above, the control below. Goes vertical by nature. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 2 }}>
      <T variant="rowTitleTight" color="inkMuted">{label}</T>
      {children}
    </View>
  );
}
