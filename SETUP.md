# Where the build is

Tahan is now a React Native app: Expo (development builds), TypeScript, Skia for
the drawing, Reanimated for motion, React Native Firebase. The Flutter version
is on the `flutter` branch, untouched.

| Ticket | State |
| --- | --- |
| T1.1 Scaffold and Firebase wiring | config written; **you** create the Firebase project and make the device build (below) |
| T1.2 Theme and type | written; pure parts tested |
| T1.3 ◆ Primitives and path parser | written; tested |
| T1.4 ◆ Avatar geometry | written; tested shape-for-shape against the prototype, and rendered |
| T1.5 Avatar component and picture cache | written; not yet run on a device |
| T1.6 Sign in | written; tested in preview; **you** check it with Firebase on the iPhone (below) |
| T1.7 Onboarding | written; runs in Expo Go (preview sign-in) |
| T1.8 Avatar editor | written; your face and your companion's, runs in Expo Go |
| T2.1 Scene data | done, then replaced: the scenes are paintings (`assets/scenes/`) and the drawn versions are removed |
| T2.2 ◆ ScenePainter | written for the paintings (Higgsfield, FLUX 3) — Fork → *The nine scenes* |
| T2.3 Time-of-day wash | written; recomputed on resume — full-screen scene view lets you force each part of the day |
| T2.4 ◆ Ambient drift | written; reviewed by the owner |
| T2.5 Glass and parallax | written — Fork → *The window*; the sill was removed at the owner's request; check 60fps in a release build |
| T2.6 Scene switching retints the app | written — the scene chips on *The window* |
| T3.1 ◆ Firestore, rules and rule tests | rules suite passes 29/29 on the emulators; **owner review** |

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
- **145 tests pass** (`npm test`), plus the rules suite (`npm run test:rules`, below):
  - **Avatars.** Every path of every option parses; no hairstyle or extra
    leaves the frame; shadows are darker and highlights lighter than their base
    at the same hue; small faces drop their detail; a spec read back from the
    database is repaired rather than failing to draw.
  - **Companions** get the same checks: every path of every kind and option
    parses, nothing leaves the frame, every option draws something different,
    and a companion read back from the database is repaired to fit its kind.
  - **Sign-in.** Typed, pasted and autofilled numbers; codes; the stated
    resend wait; a first face drawn from the uid; the phone number never
    stored; signing in twice finds the same document and signing out returns
    to the start.
  - **Onboarding.** A cold start walks welcome → number → code → name and
    face and lands on the fork; an invitation link skips the welcome and comes
    back after the face; Surprise me is a stable sequence; the welcome's cream
    type clears 12:1 on its scrim; the evening artwork parses and stays in
    frame, and the first face never tucks under the status bar.
  - **Editor.** Every field of a face has a control, in the lab's order; a
    style, a swatch, a slider position and "any colour" each land in the saved
    spec and survive the round trip; matching eyes stay matching until the
    switch is on; sliders find where a saved colour sits; every swatch has a
    spoken name; a companion keeps its name in the user document.
  - **Scenes.** One painting per scene, a real WebP, under 1 MB for all
    nine; painted into any rect it scales on width only, and its ground
    colour carries it to the bottom.
  - **The room.** Four parts of the day (the small hours are night — the
    prototype called 2am morning); each wash is low-alpha and distinct. Drift:
    each scene's effect and count, zero particles when motion is off, the
    same pattern on every build (a hash of index and scene key), and every
    particle loops and stays in the room.
  - **The window.** The scene moves at a sixth of the scroll, never below
    zero (a pull-down can't lift the sky off the top) and never past the
    extra its 6% scale gives it; the sheen stays faint; colours keep their
    scene through a mid-retint alpha.
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

`--go` matters: because `expo-dev-client` is installed (for Firebase),
plain `npx expo start` targets a Tahan development build, which isn't on your
phone until you make one (below). In Expo Go, sign-in runs in preview. Install Expo Go from the App Store or Google
Play first.

Expo Go already includes Skia and Reanimated, so the app runs in it. Walk the
onboarding — welcome, any number, code `123456`, a name and a face — and on the
last screen tap *Milestone 1 review*. That screen has: the nine scenes as chips (tap one — the screen
should retint over 420ms with no flash), a type specimen, both ramps, the themed
controls, 24 faces at 96/44/26pt, every hairstyle, all sixteen
glasses-and-beard pairs, the companions, and a 200-avatar scroll test behind a
button. Set the phone to its largest text size and look again.

## Firebase and your iPhone (T1.1, T1.6)

Sign-in works before any of this: without Firebase the app uses a **preview**
backend that keeps everything on the phone (any number, code `123456`, and a
"Preview" card on screen). It is what runs in Expo Go. These steps switch it
to real Firebase in a development build. About 45 minutes the first time,
most of it waiting for Xcode.

### 1. Create the Firebase project (console.firebase.google.com)

1. **Create a project**, name it *Tahan*. Turn Google Analytics **off** — Tahan
   doesn't use it.
2. **Add an iOS app** (Project overview → Add app → Apple). Bundle ID
   `com.rich0024.tahan`, nickname *Tahan iOS*. Register, then **download
   `GoogleService-Info.plist`** into `~/Developer/tahan`. Skip the remaining
   SDK steps (Next → Next → Continue to console).
3. **Add an Android app**. Package name `com.rich0024.tahan`. Register, then
   **download `google-services.json`** into `~/Developer/tahan`. Leave SHA-1
   blank for now; it's needed only when you build for Android.
4. **Turn on phone sign-in**: Build → Authentication → Get started →
   Sign-in method → Phone → Enable → Save. Then open *Phone numbers for
   testing* and add `+1 650-555-3434` with code `123456`. A test number sends
   no text and works on the free plan.
5. **Create the database**: Build → Firestore Database → Create database.
   Pick the location closest to the family (it can't be changed later) and
   **production mode**. Then open the **Rules** tab, replace everything with
   the contents of `firestore.rules` from this repo, and **Publish**.

Both downloaded files are gitignored. `app.config.ts` switches Firebase on
only when both are in the project root.

Texts to real numbers need the pay-as-you-go **Blaze** plan. Test numbers
don't, so leave this until the family starts using it, and set a budget alert
when you do.

### 2. Get a development build onto your iPhone (free Apple ID)

1. Install **Xcode** from the Mac App Store, open it once, and let it install
   its components (including iOS).
2. Xcode → Settings → Accounts → **+** → Apple ID. This gives you a free
   *Personal Team*.
3. On the iPhone: Settings → Privacy & Security → **Developer Mode** → On
   (it restarts). Plug it into the Mac and tap **Trust**.
4. In Terminal:
   ```sh
   cd ~/Developer/tahan
   npx expo run:ios --device
   ```
   Pick your iPhone. The first build takes 10–20 minutes. If it stops on
   signing: open `ios/Tahan.xcworkspace` in Xcode, select the *Tahan* target →
   Signing & Capabilities, tick *Automatically manage signing*, choose your
   Personal Team, close Xcode and run the command again.
5. The first launch says *Untrusted Developer*: Settings → General → VPN &
   Device Management → your Apple ID → **Trust**.

With a free Apple ID the build stops opening after **7 days**. Run step 4
again to reinstall. From now on start the dev server with `npx expo start`
(not `--go`) and the Tahan app on your phone connects to it.

### 3. Check T1.6 – T1.8

1. The app opens on the evening welcome. Tap *Start on my own*, enter
   `(650) 555-3434` and tap
   *Send me a code*. A web page may flash up to check you're not a robot:
   a free Apple ID can't use the silent push Firebase prefers, so it falls
   back to that check.
2. Enter `123456`. You land on *And this is you* with **your first face**,
   picked from your account ID. Try *Surprise me*, type your name, *Come in*:
   you're on the fork (start a village, or wait for an invitation).
3. In the Firebase console, Firestore shows `users/<your id>` with your name,
   your face as numbers, and **no phone number**.
4. **Sign out** (bottom of the fork): you're back at the welcome. Sign in again
   with the same number: **the same face and name** (the same document;
   nothing new is created), straight to the fork.
5. Force-quit and reopen: still signed in.
6. *Change my face*: change the hair, the colour, anything — the face at the
   top changes as you touch. Close with the ✕ and it asks whether to discard;
   tap *Save* instead, force-quit, reopen: the change is still there. Do the
   same under your companion.

### Later

- **Android**: run `npx expo run:android --device`, then add the debug SHA-1
  and SHA-256 to the Android app in Firebase (`cd android && ./gradlew
  signingReport`) and download `google-services.json` again.
- **Storage, messaging and functions** are added by the tickets that need them.
  Push notifications need a paid Apple Developer account; with a free one,
  adding messaging stops iOS builds from signing.
- **Emulator suite**: `firebase.json` is ready. `npx firebase-tools
  emulators:start` (needs Java), then start a build with
  `EXPO_PUBLIC_EMULATOR_HOST=<your Mac's Wi-Fi IP>` and Auth and Firestore use
  the emulators — codes appear in the emulator UI at localhost:4000.

---

## The security rules (T3.1)

`firestore.rules` and `storage.rules` cover every collection in
`design/backend.md`. `test-rules/` proves them against the Firebase
emulators, starting with the three tests the ticket calls the product's whole
promise: **a non-member cannot read a village's posts, a member cannot appoint
an admin, a member cannot edit another member's post.**

The emulators run on your Mac for a demo project (`demo-tahan`), so no
Firebase project or login is needed. Once:

```sh
brew install openjdk@21            # the Firestore emulator needs Java
cd ~/Developer/tahan
npm install --save-dev firebase-tools @firebase/rules-unit-testing
```

(No Homebrew? Install Java 21 from adoptium.net instead.) Then, any time:

```sh
npm run test:rules
```

It starts the emulators, runs both suites one after the other, and stops them.

Where the rules are stricter than `backend.md`, on purpose:

- **Nobody deletes a membership directly** — not even an admin. Leaving and
  removal go through `leaveVillage()` (T3.8), because a bare delete would
  leave the person's posts and photos behind, breaking "your updates leave
  with you".
- **RSVPs and "I'm in" are a document per person** (`events/{id}/rsvps/{uid}`,
  `ideas/{id}/imIn/{uid}`), not the `comingUids` / `inUids` arrays in the
  brief — CLAUDE.md's rule: arrays lose answers given offline.
- **You can't edit the `villages` list on your own user document.** Only
  functions write it; otherwise anyone could add a village to it.
- **The founder is always an admin.** An admin can step other admins down,
  never the person who started the village, so a village always has one.
- **Counts move by one at a time.** Any member may change a post's reaction
  or note count — that's how reacting works — but only by one, and nothing
  else on the post.

Starting a village (T3.2) is a single write of the village and the founder's
own admin membership together; the rules allow exactly that and nothing
else, so it works offline without a function.

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

### 3. The scene data uses `T`, which the parser is forbidden to accept — moot: the scenes are paintings now

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

### 5. Drift particle counts disagree — settled in T2.4

The README says 18–26 shapes; the prototype uses 6 for breeze, 14 for
fireflies, and 26 otherwise in the window backdrop. T2.4 follows the
prototype: 18 fireflies or 18 breeze streaks read as busy. One line in
`src/paint/drift.ts` (`particleCount`) if you'd rather the brief's range.

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
