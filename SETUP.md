# Where the build is

Milestone 1, tickets T1.2 – T1.5, written. T1.1 is not done and has to be done
by you — see below.

| Ticket | State |
| --- | --- |
| T1.1 Project scaffold and Firebase wiring | **yours** — needs Xcode, the FlutterFire CLI and two real devices |
| T1.2 Theme and type | written, unverified |
| T1.3 ◆ Paint primitives and the path parser | written with tests, unverified |
| T1.4 ◆ AvatarPainter | written with tests, unverified |
| T1.5 Avatar widget and picture cache | written with tests, unverified |
| T1.6 – T1.8 | not started |

**Unverified means unverified.** Flutter's SDK download host is blocked from
the machine this was written on, so none of this has been compiled, analysed or
run — not once. Treat the first `flutter analyze` as part of T1.2's definition
of done, not a formality. The code is written carefully and the geometry is
transcribed exactly, but expect to fix compile errors.

---

## T1.1 — what you run

From this folder, on your Mac:

```sh
# 1. Generate the platform projects around the code that is already here.
#    --project-name keeps the package name `tahan`, which every import uses.
flutter create --project-name tahan --org com.yourdomain \
  --platforms ios,android --overwrite .

# 2. Restore the pubspec. `flutter create --overwrite` rewrites pubspec.yaml,
#    so put ours back before pub get.
git checkout pubspec.yaml 2>/dev/null || true

# 3. The package list from the README.
flutter pub add firebase_core firebase_auth cloud_firestore firebase_storage \
  firebase_messaging cloud_functions flutter_image_compress connectivity_plus \
  shared_preferences

# 4. Register both apps with Firebase.
dart pub global activate flutterfire_cli
flutterfire configure

# 5. Emulator suite — you will use it for every backend ticket.
npm i -g firebase-tools
firebase init emulators   # auth, firestore, storage, functions
```

Then add the init to `lib/main.dart`, which currently has a comment marking the
spot:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
```

**Done when** a debug build runs on a real iPhone and a real Android device and
prints a successful Firebase init.

---

## Verifying T1.2 – T1.5

```sh
flutter analyze
flutter test
flutter run            # lands on the milestone-1 review screen
```

`lib/screens/debug_gallery.dart` is the throwaway screen the tickets ask for.
It carries, in order: the nine scenes as chips (tap one — the whole screen
should retint over 420ms with no flash of the previous accent), a type specimen
in Caprasimo and Figtree, both OKLCH ramps as strips, the themed controls, 24
faces at 96 / 44 / 26px, every hairstyle, all sixteen glasses-and-beard
combinations, the companions, and a 200-avatar scroll test behind a button.

For T1.5's 60fps: `flutter run --profile` and scroll that list with the
performance overlay on.

Delete the file when milestone 2 has a real feed.

---

## Three things to decide

### 1. The scene data uses `T`, which the parser is forbidden to accept

`CLAUDE.md` says absolute `M L Q C Z` only and that the parser must throw on
anything else. It does. But several scene paths in `Tahan.dc.html` use `T`
(smooth quadratic) — for example:

```
M0 178 Q120 150 220 180 T402 168 L402 216 0 216Z
M0 190 Q120 178 236 194 T402 186 L402 206 0 212Z
```

I checked all 62 layer paths in the prototype against the parser's grammar: 55
parse clean, and exactly 7 use `T` — every one of them a rolling hill or water
line in a scene. They will throw the moment T2.1 transcribes them.

Do not relax the parser. Convert each `T` to an explicit `Q` instead: a `T`'s
control point is the reflection of the previous control point about the current
point, so after `Q cx cy x y`, a following `T x2 y2` becomes
`Q (2x − cx) (2y − cy) x2 y2`. That is an exact rewrite, not an approximation.

Here are all seven, already converted and checked curve-identical at eleven
sample points along each segment. Paste these in at T2.1:

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

(Each pair is the original followed by its replacement.)

The avatar geometry is clean — no `T` anywhere in it, which is why T1.4 is
unaffected. The Lucide icon paths in the prototype markup use arcs and relative
commands freely, but those are icons drawn by the icon package, never fed
through this parser. There is a note to this effect at the top of
`lib/paint/path_parser.dart`.

### 2. Ramp step 500 is pinned to the token, not to the shared lightness scale

The README asks for ramps on a "shared lightness scale" with "500 as base". Read
strictly those conflict: `#C67139` sits at OKLCH L ≈ 0.62, so any fixed
scale that puts 500 at a nominal lightness would shift the accent, and the
tokens are final.

So: every step rides one shared, normalised lightness curve, and 500 is the
source colour exactly. A test asserts `shade(500) == palette.accent` for all
nine scenes. If you would rather have literal shared lightness at 500 and accept
the accent moving, the curve is nine numbers at the top of
`lib/theme/oklch.dart`.

### 3. Drift particle counts disagree between README and prototype

Not needed until T2.4, noted now so it is not a surprise: the README says 18–26
shapes, the prototype uses 6 for breeze, 14 for fireflies, and 16 or 26
otherwise. The prototype is the stated visual source of truth; the README is the
stated source for exact numbers. Worth settling before T2.4 rather than during.

---

## What is deliberately not here

- **No Firebase code.** Nothing imports it, nothing initialises it. T1.6 is the
  first ticket that needs it.
- **No `Random()` anywhere.** The debug grid derives its 24 specs from an index
  hash so the grid is identical on every rebuild and "that combination is wrong"
  is a reproducible report.
- **No `textScaler` cap.** There is a comment in `lib/app.dart` saying so, so
  nobody adds one later meaning well.
- **Companions are in the painter** (dog, cat, baby, five coats) because the
  geometry was in the same prototype function as the person. They are not wired
  to any screen and no ticket before Me needs them.
- **`google_fonts` is a development dependency in spirit.** Before release,
  vendor Caprasimo and Figtree into `assets/fonts` and switch `TahanText` over,
  so first paint is never unstyled. There is a note at the top of the pubspec.
