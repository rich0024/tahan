// Dev tool: serialise layers to SVG, so geometry can be looked at, diffed and
// compared with the avatar lab without a device. Every path goes through the
// parser and back out, so what you see is what the parser produced.

import { cachedOps, opsToString } from '../src/paint/pathParser.ts';
import type { Layer } from '../src/paint/primitives.ts';

let uid = 0;

export function layersToSvg(layers: readonly Layer[]): string {
  return layers.map(layerSvg).join('');
}

function layerSvg(l: Layer): string {
  const o = l.kind !== 'group' && l.opacity !== 1 ? ` opacity="${l.opacity}"` : '';
  switch (l.kind) {
    case 'group': {
      let defs = '';
      let clip = '';
      if (l.clip) {
        const id = `c${uid++}`;
        defs = `<defs><clipPath id="${id}"><path d="${opsToString(cachedOps(l.clip))}"/></clipPath></defs>`;
        clip = ` clip-path="url(#${id})"`;
      }
      const t = l.transform;
      const transform = t ? ` transform="translate(${t.x} ${t.y}) scale(${t.scale}) translate(${-t.ox} ${-t.oy})"` : '';
      // The clip is in the group's own coordinates, so it sits inside the transform.
      return `<g${transform}>${defs}<g${clip}>${layersToSvg(l.layers)}</g></g>`;
    }
    case 'rect':
      return `<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="${l.r}" fill="${l.fill}"${o}/>`;
    case 'circle':
      return `<circle cx="${l.cx}" cy="${l.cy}" r="${l.r}" fill="${l.fill}"${o}/>`;
    case 'ellipse': {
      const t = l.rotation
        ? ` transform="rotate(${l.rotation.deg} ${l.rotation.px ?? l.cx} ${l.rotation.py ?? l.cy})"`
        : '';
      return `<ellipse cx="${l.cx}" cy="${l.cy}" rx="${l.rx}" ry="${l.ry}" fill="${l.fill}"${t}${o}/>`;
    }
    case 'fillPath':
      return `<path d="${opsToString(cachedOps(l.d))}" fill="${l.fill}"${o}/>`;
    case 'strokePath':
      return `<path d="${opsToString(cachedOps(l.d))}" fill="none" stroke="${l.stroke}" stroke-width="${l.width}" stroke-linecap="round" stroke-linejoin="round"${o}/>`;
    case 'sky': {
      const id = `s${uid++}`;
      const stops = l.stops
        .map((c, i) => `<stop offset="${l.positions ? l.positions[i] : i / Math.max(1, l.stops.length - 1)}" stop-color="${c}"/>`)
        .join('');
      return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs>`
        + `<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" fill="url(#${id})"${o}/>`;
    }
  }
}

/** A whole round avatar as an SVG document. */
export function svgDocument(layers: readonly Layer[], box: number, size: number, label = 'Avatar'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" width="${size}" height="${size}" role="img" aria-label="${label}" style="display:block;border-radius:50%">${layersToSvg(layers)}</svg>`;
}
