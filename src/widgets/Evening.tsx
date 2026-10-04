// Tahan — the evening artwork, drawn.
//
// Onboarding's fixed evening (src/paint/eveningScene.ts) on Skia canvases:
// the full-bleed welcome, the band over the number screen, and the first face
// on its sky. Each is recorded once as an SkPicture per size and replayed.
// All of it is decoration, hidden from screen readers; the screens say in
// words everything the pictures show.

import { useMemo } from 'react';
import { useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, Picture, Skia, type SkCanvas } from '@shopify/react-native-skia';

import {
  BAND_H, BAND_W, FIRST_FACE_FADE, bandLayers, firstFaceLayers, welcomeLayers, welcomePlacement,
} from '../paint/eveningScene.ts';
import { R, SKY, type Layer } from '../paint/primitives.ts';
import { paintLayers } from '../paint/skiaPaint.ts';
import { withAlpha } from '../theme/oklch.ts';
import { TahanEvening, type AvatarSpec } from '../theme/palettes.ts';

function useRecorded(width: number, height: number, draw: (canvas: SkCanvas) => void, deps: unknown[]) {
  return useMemo(() => {
    const recorder = Skia.PictureRecorder();
    draw(recorder.beginRecording(Skia.XYWHRect(0, 0, width, height)));
    return recorder.finishRecordingAsPicture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, ...deps]);
}

function Art({ width, height, style, draw, deps }: {
  width: number; height: number; style?: StyleProp<ViewStyle>;
  draw: (canvas: SkCanvas) => void; deps: unknown[];
}) {
  const picture = useRecorded(width, height, draw, deps);
  return (
    <View
      style={[{ width, height }, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Canvas style={{ width, height }}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
}

/** A vertical fade from clear to a colour, over the bottom `share` of a box. */
const fade = (w: number, h: number, color: string, share: number, alpha = 1): Layer =>
  SKY(0, h * (1 - share), w, h * share, [withAlpha(color, 0), withAlpha(color, alpha)]);

// ---------------------------------------------------------------------------

/**
 * The welcome, filling the screen behind its text. The house is placed so it
 * stands just above `textTop`, wherever large text pushes that.
 */
export function WelcomeArt({ height, textTop }: { height: number; textTop: number }) {
  const { width } = useWindowDimensions();
  return (
    <Art
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
      deps={[textTop]}
      draw={(canvas) => {
        paintLayers(canvas, [R(0, 0, width, height, TahanEvening.skyStops[0])]);
        const { scale, y } = welcomePlacement(width, textTop);
        canvas.save();
        canvas.translate(0, y);
        canvas.scale(scale, scale);
        paintLayers(canvas, welcomeLayers());
        canvas.restore();
      }}
    />
  );
}

/** The scrim's soft top edge: clear above, nearly opaque where the text begins. */
export function ScrimEdge({ height }: { height: number }) {
  const { width } = useWindowDimensions();
  return (
    <Art
      width={width}
      height={height}
      deps={[]}
      draw={(canvas) => paintLayers(canvas, [fade(width, height, TahanEvening.scrim, 1, SCRIM_ALPHA)])}
    />
  );
}

/** How opaque the scrim is behind the welcome's text: near-full, as the brief requires. */
export const SCRIM_ALPHA = 0.94;
export const scrimColor = withAlpha(TahanEvening.scrim, SCRIM_ALPHA);

/** Evening overhead, fading into the screen below. */
export function EveningBand({ height = BAND_H, fadeTo }: { height?: number; fadeTo: string }) {
  const { width } = useWindowDimensions();
  return (
    <Art
      width={width}
      height={height}
      deps={[fadeTo]}
      draw={(canvas) => {
        const scale = Math.max(width / BAND_W, height / BAND_H);
        canvas.save();
        canvas.translate((width - BAND_W * scale) / 2, height - BAND_H * scale);
        canvas.scale(scale, scale);
        paintLayers(canvas, bandLayers());
        canvas.restore();
        paintLayers(canvas, [fade(width, height, fadeTo, 0.62)]);
      }}
    />
  );
}

/** Your first face, large, on the evening sky, fading into the screen below. */
export function FirstFace({ spec, height, topInset, fadeTo }: {
  spec: AvatarSpec; height: number; topInset: number; fadeTo: string;
}) {
  const { width } = useWindowDimensions();
  return (
    <Art
      width={width}
      height={height}
      deps={[spec, topInset, fadeTo]}
      draw={(canvas) => paintLayers(canvas, [
        ...firstFaceLayers(spec, width, height, topInset),
        fade(width, height, fadeTo, FIRST_FACE_FADE),
      ])}
    />
  );
}
