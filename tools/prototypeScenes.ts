// Reads the nine scenes straight out of the prototype by running its own
// scenes() method. Shared by tools/transcribeScenes.ts and the scene tests.

export interface ProtoLayer {
  isRect?: 1; isCircle?: 1; isEllipse?: 1; isPath?: 1;
  x: number; y: number; w: number; h: number; rx: number; ry: number;
  cx: number; cy: number; r: number; t: string | null;
  d: string; f: string; s: string; sw: number; o: number;
}

export interface ProtoScene {
  key: string; name: string; floor: string; layers: ProtoLayer[];
}

export function prototypeScenes(html: string): ProtoScene[] {
  const start = html.indexOf('  scenes() {');
  const end = html.indexOf('  book() {', start);
  if (start < 0 || end < 0) throw new Error('scenes() not found in the prototype');
  const method = html.slice(start, end).trim().replace(/^scenes\(\)\s*\{/, '').replace(/\}\s*$/, '');
  const run = new Function(method) as (this: { _sc?: ProtoScene[] }) => ProtoScene[];
  return run.call({});
}

/**
 * `T` is the smooth quadratic: its control point is the previous Q's,
 * reflected through the current point. The parser refuses `T`, so each one
 * becomes the exact `Q` it stands for. Handles only the shape the scene data
 * uses — `Q cx cy x y T x2 y2` — and throws on anything else.
 */
export function expandSmoothQuads(d: string): string {
  if (!/T/.test(d)) return d;
  const out = d.replace(/Q(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) T(-?[\d.]+) (-?[\d.]+)/g, (_m, cx, cy, x, y, x2, y2) => {
    const [a, b, c, e] = [cx, cy, x, y].map(Number);
    return `Q${a} ${b} ${c} ${e} Q${2 * c - a} ${2 * e - b} ${x2} ${y2}`;
  });
  if (/T/.test(out)) throw new Error(`a T the converter doesn't handle: ${d}`);
  return out;
}
