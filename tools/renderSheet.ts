// Dev tool: render the avatar kit and the ramps to a static HTML contact sheet.
//
//   node tools/renderSheet.ts out.html
//
// Uses the same layer lists the app paints, serialised to SVG. Every path goes
// through the parser and back out (opsToString), so the sheet shows what the
// parser produced, not the raw strings. Useful for reviewing T1.4 without a
// device, and for diffing the kit after any geometry change.

import { writeFileSync } from 'node:fs';

import {
  AVATAR_BOX, AVATAR_GROUND, AVATAR_ORIGIN, SCENE_TO_AVATAR_BOX,
  avatarLayers, type AvatarKind,
} from '../src/paint/avatarGeometry.ts';
import { cachedOps, opsToString } from '../src/paint/pathParser.ts';
import type { Layer } from '../src/paint/primitives.ts';
import { makeRamp, rampSteps } from '../src/theme/oklch.ts';
import {
  AvatarKit, avatarSpec, sceneByKey, sceneSkies, specForIndex, tahanScenes,
  type AvatarSpec, type SceneKey,
} from '../src/theme/palettes.ts';

let gradientId = 0;

function layerSvg(l: Layer): string {
  const o = l.opacity === 1 ? '' : ` opacity="${l.opacity}"`;
  switch (l.kind) {
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
      return `<path d="${opsToString(cachedOps(l.d))}" fill="none" stroke="${l.stroke}" stroke-width="${l.width}" stroke-linecap="round"${o}/>`;
    case 'sky':
      throw new Error('sky is drawn by the avatar wrapper');
  }
}

function avatarSvg(
  spec: AvatarSpec, size: number, scene: SceneKey,
  kind: AvatarKind = 'person', coat = 0,
): string {
  const id = `g${gradientId++}`;
  const sky = sceneSkies[scene];
  const stops = sky.stops
    .map((c, i) => `<stop offset="${sky.positions[i]}" stop-color="${c}"/>`)
    .join('');
  const accent2 = sceneByKey(scene).accent2;
  const { scale, dx } = SCENE_TO_AVATAR_BOX;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${AVATAR_BOX} ${AVATAR_BOX}" style="border-radius:999px;display:block">
<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs>
<rect width="${AVATAR_BOX}" height="${AVATAR_BOX}" fill="url(#${id})"/>
<g transform="scale(${scale}) translate(${dx} 0)"><path d="${opsToString(cachedOps(AVATAR_GROUND.d))}" fill="${accent2}" opacity="${AVATAR_GROUND.opacity}"/></g>
<g transform="translate(${AVATAR_ORIGIN.x} ${AVATAR_ORIGIN.y})">${avatarLayers(spec, kind, coat).map(layerSvg).join('')}</g>
</svg>`;
}

const cell = (svg: string, label = '') =>
  `<figure>${svg}${label ? `<figcaption>${label}</figcaption>` : ''}</figure>`;

const section = (title: string, body: string) =>
  `<section><h2>${title}</h2><div class="row">${body}</div></section>`;

const parts: string[] = [];

parts.push(section('24 faces · 96 / 44 / 26 · night sky',
  [96, 44, 26].map((size) =>
    `<div class="row">${Array.from({ length: 24 }, (_, i) => cell(avatarSvg(specForIndex(i), size, 'night'))).join('')}</div>`,
  ).join('')));

parts.push(section('Every hairstyle',
  AvatarKit.hairNames.map((name, hair) =>
    cell(avatarSvg(avatarSpec({ skin: 1, hairColor: hair % 5, top: hair % 5, hair }), 96, 'forest'), name),
  ).join('')));

parts.push(section('Glasses × facial hair',
  [0, 1, 2, 3].flatMap((glasses) => [0, 1, 2, 3].map((face) =>
    cell(avatarSvg(avatarSpec({ skin: (glasses + face) % 5, hairColor: 4 - glasses, top: 1, hair: face === 0 ? 6 : 0, glasses, face }), 96, 'coast'),
      `${AvatarKit.glassesNames[glasses]} · ${AvatarKit.faceNames[face]}`),
  )).join('')));

parts.push(section('Companions',
  (['dog', 'cat', 'baby'] as const).flatMap((kind) => [0, 2, 4].map((coat) =>
    cell(avatarSvg(avatarSpec({ skin: 2, hairColor: 1, top: coat }), 96, 'blossom', kind, coat), `${kind} · coat ${coat}`),
  )).join('')));

parts.push(section('One face on all nine skies',
  tahanScenes.map((s) => cell(avatarSvg(avatarSpec({ skin: 3, hairColor: 0, top: 2, hair: 3, glasses: 1 }), 96, s.key), s.name)).join('')));

parts.push(section('OKLCH ramps · accent then accent-2 · 100 → 900 · ▲ marks the token',
  `<div class="ramps">${tahanScenes.map((s) => `<div class="ramp-row"><span>${s.name}</span>${[s.accent, s.accent2].map((base) => {
    const r = makeRamp(base);
    return `<div class="ramp">${rampSteps.map((st) => `<i style="background:${r[st]}">${st === 500 ? '▲' : ''}</i>`).join('')}</div>`;
  }).join('')}</div>`).join('')}</div>`));

const out = process.argv[2] ?? 'avatar-sheet.html';
writeFileSync(out, `<!doctype html><meta charset="utf-8"><title>Tahan · M1 contact sheet</title>
<style>
body{margin:0;padding:28px;background:#F5EAD8;color:#201E1D;font:13px/1.4 system-ui,sans-serif;width:1240px}
h2{font-size:15px;margin:22px 0 10px}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:10px}
figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:4px}
figcaption{font-size:11px;opacity:.75}
.ramps{display:flex;flex-direction:column;gap:6px;width:100%}
.ramp-row{display:flex;gap:12px;align-items:center}
.ramp-row span{width:110px;font-size:12px}
.ramp{display:flex;border-radius:10px;overflow:hidden}
.ramp i{width:46px;height:30px;display:flex;align-items:center;justify-content:center;color:#fff;font-style:normal;font-size:11px;text-shadow:0 0 2px #0008}
</style>${parts.join('')}`);
console.log(`wrote ${out}`);
