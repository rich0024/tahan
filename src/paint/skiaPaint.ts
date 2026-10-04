// Tahan — paint layers onto a Skia canvas.
//
// The only file in src/paint that touches native code. Everything it draws is
// described by the pure modules beside it, which is why those can be tested
// with no device and this one stays small.

import {
  ClipOp,
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  vec,
  type SkCanvas,
  type SkPaint,
  type SkPath,
} from '@shopify/react-native-skia';

import { cachedOps, type PathOp } from './pathParser.ts';
import type { Layer } from './primitives.ts';

const skPathCache = new Map<string, SkPath>();

/** A Skia path for authored path data, built once and kept. */
export function skPath(d: string): SkPath {
  let path = skPathCache.get(d);
  if (!path) {
    path = buildPath(cachedOps(d));
    skPathCache.set(d, path);
  }
  return path;
}

function buildPath(ops: readonly PathOp[]): SkPath {
  const p = Skia.Path.Make();
  for (const o of ops) {
    switch (o.op) {
      case 'M': p.moveTo(o.x, o.y); break;
      case 'L': p.lineTo(o.x, o.y); break;
      case 'Q': p.quadTo(o.x1, o.y1, o.x, o.y); break;
      case 'C': p.cubicTo(o.x1, o.y1, o.x2, o.y2, o.x, o.y); break;
      case 'Z': p.close(); break;
    }
  }
  return p;
}

function fillPaint(color: string, opacity: number): SkPaint {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(color));
  // Every kit colour is opaque, so setting alpha to the layer opacity is exact.
  if (opacity < 1) paint.setAlphaf(opacity);
  return paint;
}

/** Paint `layers` in order. The canvas already carries the authoring transform. */
export function paintLayers(canvas: SkCanvas, layers: readonly Layer[]): void {
  for (const l of layers) {
    switch (l.kind) {
      case 'group': {
        canvas.save();
        if (l.transform) {
          const t = l.transform;
          canvas.translate(t.x, t.y);
          canvas.scale(t.scale, t.scale);
          canvas.translate(-t.ox, -t.oy);
        }
        if (l.clip) canvas.clipPath(skPath(l.clip), ClipOp.Intersect, true);
        paintLayers(canvas, l.layers);
        canvas.restore();
        break;
      }
      case 'rect': {
        const rect = Skia.XYWHRect(l.x, l.y, l.w, l.h);
        const paint = fillPaint(l.fill, l.opacity);
        if (l.r > 0) canvas.drawRRect(Skia.RRectXY(rect, l.r, l.r), paint);
        else canvas.drawRect(rect, paint);
        break;
      }
      case 'circle':
        canvas.drawCircle(l.cx, l.cy, l.r, fillPaint(l.fill, l.opacity));
        break;
      case 'ellipse': {
        const rect = Skia.XYWHRect(l.cx - l.rx, l.cy - l.ry, l.rx * 2, l.ry * 2);
        const paint = fillPaint(l.fill, l.opacity);
        if (!l.rotation) {
          canvas.drawOval(rect, paint);
          break;
        }
        canvas.save();
        canvas.rotate(l.rotation.deg, l.rotation.px ?? l.cx, l.rotation.py ?? l.cy);
        canvas.drawOval(rect, paint);
        canvas.restore();
        break;
      }
      case 'fillPath':
        canvas.drawPath(skPath(l.d), fillPaint(l.fill, l.opacity));
        break;
      case 'strokePath': {
        const paint = fillPaint(l.stroke, l.opacity);
        paint.setStyle(PaintStyle.Stroke);
        paint.setStrokeWidth(l.width);
        // Round caps and joins, as the prototype and the avatar lab draw them.
        paint.setStrokeCap(StrokeCap.Round);
        paint.setStrokeJoin(StrokeJoin.Round);
        canvas.drawPath(skPath(l.d), paint);
        break;
      }
      case 'sky': {
        const paint = Skia.Paint();
        paint.setShader(
          Skia.Shader.MakeLinearGradient(
            vec(l.x, l.y),
            vec(l.x, l.y + l.h),
            l.stops.map((c) => Skia.Color(c)),
            l.positions ? [...l.positions] : null,
            TileMode.Clamp,
          ),
        );
        if (l.opacity < 1) paint.setAlphaf(l.opacity);
        canvas.drawRect(Skia.XYWHRect(l.x, l.y, l.w, l.h), paint);
        break;
      }
    }
  }
}
