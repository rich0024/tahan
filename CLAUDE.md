# Tahan — repo constraints

React Native app, iOS + Android from one codebase, built with Expo (development
builds, continuous native generation) and TypeScript. The design brief in
`design/` was written for Flutter; the design, the tokens, the tickets and every
rule below still hold — only the platform changed. The original Flutter version
of this file is `design/CLAUDE.flutter.md`. When a ticket names a Flutter API,
use the translation table at the bottom.

Read `design/README.md` for the design, `design/tickets.md` for the build order,
`design/backend.md` for the data model. Work one ticket at a time, in order, and
stop when its definition of done is met.

## Non-negotiables

- **Path data is absolute only** — `M L Q C Z`. No arcs, no relative commands,
  no `H V S T`. The geometry scaler offsets every number as an absolute x,y pair.
  `src/paint/pathParser.ts` THROWS on anything else; do not "add support" for
  more commands. (The scenes are paintings now, so this governs the avatars,
  companions and onboarding artwork.)
- **Four reactions**: heart, thanks-hands, smile, star. Not five. No reaction picker.
- **Routines are self-reported.** Never write, schedule or send a missed-dose
  alert. Tahan is not a medical reminder and the copy says so.
- **Ambient drift draws zero particles** when Reanimated's `useReducedMotion()`
  is true or the app's Ambient motion setting is off — not slowed particles.
  Pause when backgrounded (`AppState`) or off-screen.
- **No `Math.random()` in the app.** Particle phase and duration come from a
  hash of index and scene key, so the pattern is stable across renders.
  `test/guards.test.ts` enforces it.
- **Avatars are a small spec, never a photo.** A style per part plus a few
  colours — `AvatarSpec`, thirteen fields (the brief's original "six integers"
  grew into this when the owner chose the detailed, recolourable kit). No photo
  upload, no crop, no image hosting; do not add photo avatars. Shadows and
  highlights are derived from each base colour, so never add colour variants as
  new art. Companions (dog, cat, baby) follow the same rule with
  `CompanionSpec`. The kit was designed in `design/avatar-lab.html`; the app's
  geometry is `src/paint/avatarGeometry.ts` and `companionGeometry.ts`, and
  those files are now the source of truth.
- **A village is the permission boundary.** Everything that is not a user's own
  document lives under `/villages/{villageId}/`. Rules are written against
  membership.
- **One document per person wherever two people can act at once** — event
  bring-rows, reactions, notes, routine check-ins. Never an array field.
  Firestore merges at field level and last write wins; arrays lose claims made
  offline.
- **Deletions are deletions.** When Tahan says a post or photo was removed, no
  copy is kept. Same promise for leaving a village.
- **Never cap text scaling.** Never `allowFontScaling={false}`, never
  `maxFontSizeMultiplier`. Every screen must survive 150% text: layouts go
  vertical, reaction rows collapse, rows use `minHeight` not `height`. Hit
  targets stay at 56pt minimum — a smaller visual may reach 56 with `hitSlop`.
- **No month grid.** An event is a pinned post, not a calendar entry.
- **Push stays rare.** Exactly three senders: notes/thank-yous, event creation,
  and the scheduled Sunday digest plus evening-before reminder. Claims, votes
  and statuses never notify.

## The pure / native split

Geometry, path parsing, colour, palettes and (later) data models are **pure
TypeScript** in `src/theme/` and `src/paint/`, using erasable syntax only (no
`enum`, no `namespace`, no constructor parameter properties) and importing each
other with explicit `.ts` extensions. That is what lets `npm test` run them with
plain Node — no simulator, no Jest, no native code. Only `src/paint/skiaPaint.ts`,
`src/auth/firebaseBackend.ts`, `src/auth/SessionProvider.tsx` and the
components touch native modules. Sign-in logic (`src/auth/phone.ts`,
`previewBackend.ts`) and the user document (`src/data/user.ts`) are pure. Keep it that way: when a ticket adds
logic, put the logic in a pure module and test it there.

## Style

- Colours, type, spacing and radii come from `src/theme/`, never hard-coded.
  No colour literals in `app/`, `src/components/` or `src/widgets/` — the
  guard test fails on them. Ramps are generated in OKLCH (`oklch.ts`).
- Caprasimo for display and titles only; Figtree for everything else. In React
  Native a weight is its own family: use `type.*` from `tokens.ts`, never
  `fontWeight`.
- Radius 16 for containers, 999 for buttons, chips, inputs and avatars.
- Icons: `lucide-react-native`, `strokeWidth={2.75}`, each imported from its own
  file (`import ChevronLeft from 'lucide-react-native/icons/chevron-left'`) — the
  package index pulls in every icon.
- Platform-native only for modal sheets (Expo Router `presentation: 'formSheet'`)
  and the invite share action (`Share`). Everything else is drawn by the app and
  looks identical on both platforms — including the tab bar (a custom `tabBar`)
  and headers (`headerShown: false` everywhere).
- **Scene backdrops are paintings** (`assets/scenes/<key>.webp`, the owner's
  call): generated in one style from the prototype's scenes, prompts in
  `design/scene-prompts.md`. Drift, wash and window glass stay in code on top.
  The drawn scenes were removed at the owner's request; while a painting
  loads, its ground colour (`src/paint/sceneArt.ts`) fills the rect. Avatars
  stay drawn in code.
- **No sill.** The prototype's warm ledge under the header was removed at the
  owner's request — it read as a stray bar. The header fades into the veil.
- Surfaces fade through the retint with `useSceneColor()`; text uses the
  destination colours from `useScene().colors`.

## Packages

The stack, replacing the Flutter package list in the README. Add nothing else
without asking.

| Need | Package |
| --- | --- |
| Framework, navigation, deep links | `expo`, `expo-router`, `expo-linking`, `expo-constants`, `expo-dev-client`, `expo-build-properties` |
| Drawing | `@shopify/react-native-skia` |
| Animation | `react-native-reanimated`, `react-native-worklets` |
| Fonts, splash, chrome | `expo-font`, `@expo-google-fonts/caprasimo`, `@expo-google-fonts/figtree`, `expo-splash-screen`, `expo-status-bar`, `react-native-safe-area-context`, `react-native-screens` |
| Firebase | `@react-native-firebase/app`, `auth`, `firestore`, `storage`, `messaging`, `functions` |
| Image compression (was flutter_image_compress) | `expo-image-manipulator` |
| Connectivity (was connectivity_plus) | `@react-native-community/netinfo` |
| Local storage and the upload outbox (was shared_preferences) | `expo-sqlite` |
| Icons | `lucide-react-native`, `react-native-svg` |

## Flutter → React Native, for reading the tickets

| The ticket says | Here it is |
| --- | --- |
| `ThemeExtension`, `villageTheme(palette)` | `SceneProvider`, `useScene()`, `useSceneColor()` |
| `CustomPainter`, `Canvas` | Skia, via `src/paint/skiaPaint.ts` |
| `ui.Picture` cache | `SkPicture` cache in `src/widgets/Avatar.tsx` |
| "six primitives" | the six, plus a `group` that can transform and clip its children (`src/paint/primitives.ts`) |
| `Semantics(label:)` | `accessibilityLabel` |
| `MediaQuery.disableAnimationsOf` | `useReducedMotion()` |
| `textScaler` | `allowFontScaling` / `maxFontSizeMultiplier` — never set either |
| `AnimationController` (drift) | a Reanimated shared value with `withRepeat` |
| `RepaintBoundary` | a Skia `<Canvas>` is already its own layer |
| `go_router` | Expo Router (`app/`) |
| `flutter test` | `npm test` for pure logic; the device for everything else |
| Firestore local cache | React Native Firebase — persistence is on by default |
| "runs on a real device" | a dev build: `npx expo run:ios --device` / `run:android --device` |

## Workflow

- One commit per ticket, message `T1.4 avatar geometry`.
- `npm run check` (type-check + tests) passes before every commit.
- After any change to avatar or scene geometry, `npm run sheet` and look at it.
- Every ticket ends with a build that runs on a real device.
- Tickets marked ◆ are load-bearing: pause and let the owner review before moving on.
