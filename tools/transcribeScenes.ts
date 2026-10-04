// Dev tool: transcribe the prototype's nine scenes into src/paint/scenes/.
//
//   node tools/transcribeScenes.ts
//
// Runs the prototype's own scenes() (design/Tahan.dc.html) and writes one
// file per scene using the primitives, so the transcription is mechanical:
// no reinterpretation. The only change is the parser's rule — the seven `T`
// segments become the exact `Q` they stand for. test/scenes.test.ts re-runs
// the prototype and fails if a file drifts from it.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expandSmoothQuads, prototypeScenes, type ProtoLayer } from './prototypeScenes.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/paint/scenes');
mkdirSync(out, { recursive: true });

const num = (n: number) => String(Math.round(n * 10000) / 10000);
const col = (c: string) => `'${c.toUpperCase()}'`;
const op = (o: number) => (o === 1 ? '' : `, ${num(o)}`);

function emit(l: ProtoLayer, key: string): string {
  if (l.isRect && String(l.f).startsWith('url(')) return `SKY(0, 0, SCENE_W, SCENE_H, sceneSkies.${key}.stops, sceneSkies.${key}.positions)`;
  if (l.isRect) return `R(${[l.x, l.y, l.w, l.h].map(num).join(', ')}, ${col(l.f)}, ${num(l.o)}, ${num(l.rx)})`;
  if (l.isCircle) return `C(${[l.cx, l.cy, l.r].map(num).join(', ')}, ${col(l.f)}${op(l.o)})`;
  if (l.isEllipse) {
    let rot = 'null';
    if (l.t) {
      const m = /^rotate\((-?[\d.]+) (-?[\d.]+) (-?[\d.]+)\)$/.exec(l.t);
      if (!m || Number(m[2]) !== l.cx || Number(m[3]) !== l.cy) throw new Error(`unexpected transform ${l.t}`);
      rot = num(Number(m[1]));
    }
    return `E(${[l.cx, l.cy, l.rx, l.ry].map(num).join(', ')}, ${rot}, ${col(l.f)}${op(l.o)})`;
  }
  if (l.isPath && l.f === 'none') return `PS('${expandSmoothQuads(l.d)}', ${col(l.s)}, ${num(l.sw)}${op(l.o)})`;
  if (l.isPath) return `P('${expandSmoothQuads(l.d)}', ${col(l.f)}${op(l.o)})`;
  throw new Error('unknown layer');
}

const scenes = prototypeScenes(readFileSync(join(root, 'design/Tahan.dc.html'), 'utf8'));
for (const s of scenes) {
  const used = new Set<string>(['SCENE_W', 'SCENE_H']);
  const lines = s.layers.map((l) => {
    const e = emit(l, s.key);
    used.add(e.slice(0, e.indexOf('(')));
    return `  ${e},`;
  });
  const prims = ['C', 'E', 'P', 'PS', 'R', 'SKY'].filter((p) => used.has(p));
  writeFileSync(join(out, `${s.key}.ts`), `// ${s.name} — transcribed from design/Tahan.dc.html by tools/transcribeScenes.ts.
// Authored in the 402 × 216 scene box. Regenerate rather than edit by hand.

import { ${prims.join(', ')}, type Layer } from '../primitives.ts';
import { sceneSkies } from '../../theme/palettes.ts';
import { SCENE_H, SCENE_W } from './box.ts';

/** What shows below the scene on a screen taller than it: its ground colour. */
export const floor = ${col(s.floor)};

export const layers: readonly Layer[] = [
${lines.join('\n')}
];
`);
  console.log(`${s.key}: ${s.layers.length} layers`);
}
