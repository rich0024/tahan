// Dev tool: render the avatar kit and the ramps to a static HTML contact sheet.
//
//   npm run sheet        (writes avatar-sheet.html)
//
// Uses the same layer lists the app paints, serialised to SVG through the
// parser. For reviewing geometry without a device, and for eyeballing the kit
// after any change to it. The interactive version is design/avatar-lab.html.

import { writeFileSync } from 'node:fs';

import { AVATAR_BOX, avatarBackdrop, avatarLayers } from '../src/paint/avatarGeometry.ts';
import { companionLayers } from '../src/paint/companionGeometry.ts';
import { makeRamp, rampSteps } from '../src/theme/oklch.ts';
import {
  AvatarKit, avatarSpec, sampleCompanions, sampleFaces, sceneByKey, sceneSkies, specForIndex, tahanScenes,
  type AvatarSpec, type CompanionSpec, type SceneKey,
} from '../src/theme/palettes.ts';
import { svgDocument } from './layersToSvg.ts';

function face(spec: AvatarSpec, size: number, scene: SceneKey): string {
  return svgDocument(
    [...avatarBackdrop(sceneSkies[scene], sceneByKey(scene).accent2), ...avatarLayers(spec, size <= 44)],
    AVATAR_BOX, size,
  );
}

function companion(spec: CompanionSpec, size: number, scene: SceneKey): string {
  return svgDocument(
    [...avatarBackdrop(sceneSkies[scene], sceneByKey(scene).accent2), ...companionLayers(spec, size <= 44)],
    AVATAR_BOX, size,
  );
}

const cell = (svg: string, label = '') => `<figure>${svg}${label ? `<figcaption>${label}</figcaption>` : ''}</figure>`;
const section = (title: string, body: string) => `<section><h2>${title}</h2><div class="row">${body}</div></section>`;

const parts: string[] = [];

parts.push(section('A village', sampleFaces.map(({ name, ...spec }, i) =>
  cell(face(spec, 96, (['night', 'coast', 'forest'] as const)[i % 3]), name)).join('')));

parts.push(section('24 faces · 96 / 44 / 34 / 26 · night sky',
  [96, 44, 34, 26].map((size) =>
    `<div class="row">${Array.from({ length: 24 }, (_, i) => cell(face(specForIndex(i), size, 'night'))).join('')}</div>`,
  ).join('')));

parts.push(section('Every hairstyle', AvatarKit.hairStyles.map((name, hair) =>
  cell(face(avatarSpec({ skin: (hair % 8) / 7, hair, hairColor: AvatarKit.hairRange[hair % 10], topColor: AvatarKit.clothSwatches[hair % 8] }), 96, 'forest'), name)).join('')));

parts.push(section('Glasses × facial hair', AvatarKit.glasses.flatMap((g, glasses) => AvatarKit.facialHair.map((f, facial) =>
  cell(face(avatarSpec({ skin: ((glasses + facial) % 8) / 7, hair: facial ? 0 : 7, glasses, facial }), 96, 'coast'), `${g} · ${f}`))).join('')));

parts.push(section('Every extra', AvatarKit.extras.map((name, extra) =>
  cell(face(avatarSpec({ hair: 3, extra, extraColor: AvatarKit.extraSwatches[extra % 6] }), 96, 'blossom'), name)).join('')));

parts.push(section('Companions', sampleCompanions.map(({ name, ...spec }, i) =>
  cell(companion(spec, 96, (['coast', 'night', 'blossom'] as const)[i % 3]), name)).join('')));

parts.push(section('OKLCH ramps · accent then accent-2 · 100 → 900 · ▲ marks the token',
  `<div class="ramps">${tahanScenes.map((s) => `<div class="ramp-row"><span>${s.name}</span>${[s.accent, s.accent2].map((base) => {
    const r = makeRamp(base);
    return `<div class="ramp">${rampSteps.map((st) => `<i style="background:${r[st]}">${st === 500 ? '▲' : ''}</i>`).join('')}</div>`;
  }).join('')}</div>`).join('')}</div>`));

const out = process.argv[2] ?? 'avatar-sheet.html';
writeFileSync(out, `<!doctype html><meta charset="utf-8"><title>Tahan · avatar kit</title>
<style>
body{margin:0;padding:28px;background:#F5EAD8;color:#201E1D;font:13px/1.4 system-ui,sans-serif;max-width:1240px}
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
