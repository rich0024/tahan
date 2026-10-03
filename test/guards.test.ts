// The non-negotiables in CLAUDE.md that a grep can enforce.
//
// Cheap, blunt and deliberately strict. If one of these fails, the fix is
// almost always to change the code, not the test — read CLAUDE.md first.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function files(dir: string, exts = ['.ts', '.tsx']): string[] {
  const out: string[] = [];
  for (const name of readdirSync(join(root, dir))) {
    const p = join(root, dir, name);
    if (statSync(p).isDirectory()) out.push(...files(relative(root, p), exts));
    else if (exts.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}

const appCode = [...files('app'), ...files('src')];
/** Code with its comments removed, so the rules can be explained in comments. */
const code = (p: string) =>
  readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function offenders(pattern: RegExp, among = appCode): string[] {
  return among.filter((p) => pattern.test(code(p))).map((p) => relative(root, p));
}

test('text scaling is never capped', () => {
  assert.deepEqual(offenders(/allowFontScaling\s*=\s*\{\s*false\s*\}|maxFontSizeMultiplier/), []);
});

test('no Math.random() anywhere in the app — drawing must be stable across renders', () => {
  assert.deepEqual(offenders(/Math\.random\s*\(/), []);
});

test('no colour literals in screens or components — colours come from the theme', () => {
  const ui = [...files('app'), ...files('src/components'), ...files('src/widgets')];
  assert.deepEqual(offenders(/#[0-9A-Fa-f]{6}\b|rgba?\(/, ui), []);
});

test('no photo avatars — an avatar is six integers', () => {
  assert.deepEqual(offenders(/expo-image-picker|launchImageLibrary|avatarUrl|photoURL/), []);
});

test('no month grid — an event is a post, not a calendar', () => {
  assert.deepEqual(offenders(/react-native-calendars|CalendarList|MonthView/), []);
});

test('reactions are exactly four, if and when they are defined', () => {
  for (const p of appCode) {
    const m = /export const reactions\s*=\s*\[([^\]]*)\]/.exec(code(p));
    if (m) assert.equal(m[1].split(',').filter((s) => s.trim()).length, 4, relative(root, p));
  }
});
