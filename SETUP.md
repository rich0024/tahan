# Where the build is

Tahan is now a React Native app: Expo (development builds), TypeScript, Skia for
the drawing, Reanimated for motion, React Native Firebase. The Flutter version
is on the `flutter` branch, untouched.

| Ticket | State |
| --- | --- |
| T1.1 Scaffold and Firebase wiring | config written; **you** run the bootstrap, add the Firebase files, make the device builds |
| T1.2 Theme and type | written; pure parts tested |
| T1.3 ◆ Primitives and path parser | written; tested |
| T1.4 ◆ Avatar geometry | written; tested shape-for-shape against the prototype, and rendered |
| T1.5 Avatar component and picture cache | written; not yet run on a device |
| T1.6 – T1.8 | not started |

## Avatars: the detailed kit

People are drawn with the detailed, recolourable kit designed in the avatar lab
(`design/avatar-lab.html` — open it in a browser to try combinations). A face
is a style per part plus a few colours: 16 hairstyles, 3 eye styles, 4 mouths,
5 facial-hair options, 5 glasses, 5 tops, 6 extras, with skin and hair on
natural sliders and every other colour free. Shading is derived from each base
colour, so any colour shades correctly.

- **Checked against the lab, pixel by pixel**, when it was ported: 112 faces
  (every option of every part at full and feed size, plus a sample village),
  mean difference 0.16/255 per pixel, worst case 3 pixels at 44pt where round
  frames are drawn as curves. Mutating the geometry made the comparison fail,
  so the match is real.
- **Under 44pt** a face drops teeth, blush, lashes, earrings, buttons, temple
  arms and hair highlights, and its lines thicken.
- **Companions** (dog, cat, baby) are in the same kit: fur on a natural slider
  or any colour, three ear shapes for dogs, short or fluffy cats, markings
  (eye patch, blaze, spots; tabby, patch, tuxedo) in any colour, eye colour,
  a collar, bandana or bow; babies get the skin slider, four hair options, any
  onesie colour, and a bow, beanie or pacifier. Checked against the lab the
  same way: 78 cases, mean difference 0.003/255 per pixel.
- **The in-app creator** (T1.8) should not show the small size previews the lab
  has; those are for checking the art, not for making a face.

## What was verified, and what was not

- **Type-checked against the real libraries.** `npm run typecheck` passes with
  TypeScript 6 against the actual React Native 0.86, Expo SDK 57, Skia and
  Reanimated 4 types — app code, tests, tools and config.
- **84 tests pass** (`npm test`):
  - **Avatars.** Every path of every option parses; no hairstyle or extra
    leaves the frame; shadows are darker and highlights lighter than their base
    at the same hue; small faces drop their detail; a spec read back from the
    database is repaired rather than failing to draw.
  - **Companions** get the same checks: every path of every kind and option
    parses, nothing leaves the frame, every option draws something different,
    and a companion read back from the database is repaired to fit its kind.
  - **Parser.** Accepts absolute `M L Q C Z` with implicit repetition; throws on
    every relative command, both arc forms, `H V S T`, and malformed input.
  - **Palettes and skies** re-read `design/tahan_palettes.dart` and the prototype
    and fail on any drift.
  - **Ramps.** 500 is the token exactly; lightness is monotonic; hue holds
    within 8° across every step of all eighteen ramps.
  - **Guards** for the non-negotiables a grep can enforce (no capped text, no
    `Math.random`, no colour literals in UI code, no photo avatars, no month grid).
- **Rendered.** `npm run sheet` draws the whole kit from the same layer lists and
  through the parser; every face, companion and ramp was looked at.

**Not yet verified:** the app running — Skia actually painting, the picture
cache, the retint, the fonts, the screens on a device. That is the next step.

## Installing

Dependency versions are pinned in `package.json` and `package-lock.json` — a
matched Expo SDK 57 set. On a fresh clone:

```sh
npm install
npm run check
```

`npm run bootstrap` is only for moving to a new Expo SDK. **Never run
`npm audit fix`** (with or without `--force`): it moves packages one at a time,
ignoring that Expo pins them as a set, and breaks the install. To update
packages, use `npx expo install --fix`.

---

## See it on your phone (five minutes, no Xcode)

From this folder, on your Mac:

```sh
npx expo start --go   # scan the QR code with Expo Go
```

`--go` matters: because `expo-dev-client` is installed (for Firebase later),
plain `npx expo start` targets a Tahan development build, which isn't on your
phone until T1.1's device build. Install Expo Go from the App Store or Google
Play first.

Expo Go already includes Skia and Reanimated, so the milestone-1 review screen
runs in it. That screen has: the nine scenes as chips (tap one — the screen
should retint over 420ms with no flash), a type specimen, both ramps, the themed
controls, 24 faces at 96/44/26pt, every hairstyle, all sixteen
glasses-and-beard pairs, the companions, and a 200-avatar scroll test behind a
button. Set the phone to its largest text size and look again.

## T1.1 — the rest

1. **Bundle identifier.** Replace `com.yourdomain.tahan` in `app.config.ts`.
2. **Firebase.** In the Firebase console, add an iOS app and an Android app with
   that identifier. Download `GoogleService-Info.plist` and
   `google-services.json` into the project root. (Both are gitignored.
   `app.config.ts` wires Firebase in only when both are present, so everything
   above works before this step.)
3. **Firebase packages:**
   ```sh
   npx expo install @react-native-firebase/app @react-native-firebase/auth \
     @react-native-firebase/firestore @react-native-firebase/storage \
     @react-native-firebase/messaging @react-native-firebase/functions
   ```
4. **Emulator suite**, for every backend ticket:
   ```sh
   npm i -g firebase-tools
   firebase init emulators   # auth, firestore, storage, functions
   ```
5. **Dev builds on real devices** (needs Xcode for iOS):
   ```sh
   npx expo run:ios --device
   npx expo run:android --device
   ```
   React Native Firebase does not run in Expo Go — from here on, use the dev build.

**Done when** a dev build runs on a real iPhone and a real Android device and
logs a successful Firebase init.

---

## Five things to decide

### 1. Cream on accent fails contrast in eight of nine scenes

The filled button — *I'm coming*, *Join the village*, *Send me a code* — puts
cream text on the scene accent. Measured against WCAG AA for normal text (4.5:1):

| Scene | cream on 500 (the token) | cream on 600 |
| --- | --- | --- |
| Night | 3.38 | 4.57 |
| Forest | 4.07 | 5.26 |
| Tropical | 3.32 | 4.53 |
| Desert | **2.74** | 3.81 |
| Rice terraces | 3.25 | 4.40 |
| Savanna | 3.63 | 4.84 |
| Coast | 5.11 | 6.37 |
| Winter | 3.80 | 4.99 |
| Blossom | 3.36 | 4.54 |

Only Coast passes; Desert fails even the 3:1 large-text bar. For a family app
whose users include grandparents, I'd fix it. The code ships as designed because
the tokens are final. The options are: fill buttons with ramp 600 (seven of
nine pass), use ink labels on the accent, or bold the label to 18pt so the 3:1
threshold applies. It's one line in `src/components/themed.tsx` either way.

### 2. Black hair disappears into the night sky

The top of the Night sky is `#2E2B25`; the darkest hair is `#2E2318`. Contrast:
1.09. On the contact sheet, a black-haired face on Night loses the top of its
head. Night is the first village's scene. A hairline highlight, or lifting the
sky's top stop slightly, would fix it.

### 3. The scene data uses `T`, which the parser is forbidden to accept

Of the 62 layer paths in the prototype, 55 parse clean and exactly 7 use `T`
(smooth quadratic) — every one a rolling hill or water line. They will throw the
moment T2.1 transcribes them. Do not relax the parser; convert each `T` to an
exact `Q` — the control point of `T` is the reflection of the previous one, so
`Q cx cy x y  T x2 y2` becomes `Q cx cy x y  Q (2x−cx) (2y−cy) x2 y2`. All seven,
already converted and checked curve-identical (each pair is original, then
replacement):

```
M0 150 Q120 138 220 152 T402 146 L402 168 0 172Z
M0 150 Q120 138 220 152 Q320 166 402 146 L402 168 0 172Z

M0 150 Q90 118 176 148 T402 138 L402 216 0 216Z
M0 150 Q90 118 176 148 Q262 178 402 138 L402 216 0 216Z

M0 162 Q120 148 240 166 T402 158 L402 216 0 216Z
M0 162 Q120 148 240 166 Q360 184 402 158 L402 216 0 216Z

M0 170 Q140 156 244 174 T402 166 L402 186 0 192Z
M0 170 Q140 156 244 174 Q348 192 402 166 L402 186 0 192Z

M0 178 Q120 150 220 180 T402 168 L402 216 0 216Z
M0 178 Q120 150 220 180 Q320 210 402 168 L402 216 0 216Z

M0 190 Q120 178 236 194 T402 186 L402 206 0 212Z
M0 190 Q120 178 236 194 Q352 210 402 186 L402 206 0 212Z

M0 200 Q140 182 262 202 T402 196 L402 216 0 216Z
M0 200 Q140 182 262 202 Q384 222 402 196 L402 216 0 216Z
```

The avatar geometry is clean. The Lucide icon paths in the prototype use arcs
freely, but icons never go through this parser.

### 4. Ramp step 500 is pinned to the token

The README asks for a "shared lightness scale" with "500 as base". Read strictly
those conflict — `#C67139` sits at OKLCH L ≈ 0.62, and a nominal lightness at 500
would move the accent. So every step rides one shared normalised curve and 500
is the token exactly (tested for all nine scenes). The curve is nine numbers at
the top of `src/theme/oklch.ts` if you'd rather have it the other way.

### 5. Drift particle counts disagree

Not needed until T2.4: the README says 18–26 shapes; the prototype uses 6 for
breeze, 14 for fireflies, and 16 or 26 otherwise.

---

## Small choices made along the way

- **Faces move to the new sky at once during a retint** rather than fading with
  the rest of the screen. Fading would re-record every visible face on every
  frame of the 420ms. Worth a look on device; a crossfade is possible if the
  snap reads badly.
- **Avatars sit on their village's real sky** — the prototype's own gradient
  plus the soft accent-2 hill behind the shoulders — not a generic wash. The
  nine skies were lifted from the prototype by script and are tested against it.
- **Chips are drawn 40pt tall with their hit area extended to 56** by `hitSlop`.
  The brief's minimum is about where a thumb lands.
- **The picture cache never disposes pictures**: a mounted canvas may still hold
  one, and Skia frees them when nothing references them.
- **`package.json` has no dependency versions.** The bootstrap installs the
  current Expo SDK and lets `expo install` choose every other version to match,
  so nothing was guessed from here.
