# Tahan build tickets — milestones 1–4

32 tickets from empty repository to v1 in your family's hands. Work them **in order**, one per
session. Each ends with a build that runs on a real device; if it doesn't run, it isn't done.
One commit per ticket (`T1.4 avatar painter`). Tickets marked **◆** are load-bearing — the owner
reviews them before you move on.

Reference: `README.md` (design, tokens, screens), `backend.md` (schema, rules), `Tahan.dc.html`
(the visual truth — when a ticket says "matches the prototype", compare against it).

---

## Milestone 1 · A face
Auth, a user document, and the avatar painter with its editor. No village, no feed. Ends with you
looking at your own drawn face on your own phone.

### T1.1 Project scaffold and Firebase wiring
Create the Flutter project, add the packages from the README, register iOS and Android apps, get
`firebase_core` initialising on both. Set up the Firebase emulator suite — you'll use it for every
backend ticket.
**Done when** a debug build runs on a real iPhone and a real Android device and prints a successful
Firebase init.

### T1.2 Theme and type
`ScenePalette`, the nine palettes (`lib/tahan_palettes.dart` is ready to drop in), the OKLCH ramp
generator, and `villageTheme(palette)`. Load Caprasimo and Figtree. Register the `VillageScene`
theme extension.
**Done when** a throwaway screen shows headings in Caprasimo and body in Figtree, and swapping the
palette constant retints buttons, cards and background.
**Watch for** ramps generated in RGB instead of OKLCH — they go muddy, and warmth is the point.

### T1.3 ◆ Paint primitives and the path parser
The six primitives (rect, circle, ellipse, filled path, stroked path, sky gradient) as a small sealed
model, plus a parser for absolute `M L Q C Z` only.
**Done when** unit tests cover each command and the parser *throws* on relative commands and arcs
rather than silently mis-drawing.
**Watch for** an agent adding `h`/`v`/`A` support — reject it; the scaler assumes every number is an
absolute coordinate pair.

### T1.4 ◆ AvatarPainter
Port the avatar geometry: 78-unit authoring box, kit colours, eight hairstyles, four facial-hair
options, four glasses, five clothes. Takes an `AvatarSpec` of six ints and a background palette.
**Done when** a debug grid of 24 random specs renders at 26, 44 and 96px with every combination
legible — no clipped hair, no floating glasses.
**Watch for** wrong z-order at small sizes.

### T1.5 Avatar widget and picture cache
`Avatar(spec, size)` caching by spec+size as a `ui.Picture`, with a `Semantics` label carrying the
person's name.
**Done when** a list of 200 avatars scrolls at 60fps in profile mode.

### T1.6 Sign in
Phone sign-in (decided): a six-digit code, no password, no email. Create `/users/{uid}` on first
sign-in with a randomised avatar spec and an empty display name.
**Done when** signing in twice on the same device reuses the same user document, and signing out
returns to the start.

### T1.7 Onboarding sequence
The four screens from the README: welcome (fixed evening palette), phone number, code, name and
first face. No tour. Permissions are not requested here.
**Done when** a cold start with no account walks the four screens and lands on the
start-a-village / wait fork, and an invitation link skips the welcome.
**Watch for** the welcome scrim — cream type over the lit windows fails contrast if the gradient
isn't near-opaque behind the text block.

### T1.8 Avatar editor screen
The Me-tab editor: large avatar on a scene sky, swatch rows for skin, hair colour and clothes,
segmented rows for hairstyle, glasses and facial hair, "Surprise me". Writes six ints to the user
document.
**Done when** changes render instantly, survive a force-quit, and every control is ≥56px tall.

---

## Milestone 2 · A room
The nine scenes, the drift, the window, the retint. Entirely drawing — this is what makes Tahan feel
like Tahan.

### T2.1 Scene data
Port all nine scenes' layer lists and sky gradients into `paint/scenes/`, one file each, using the
primitives from T1.3. Straight transcription; no reinterpretation.
**Done when** each scene's layer count and colours match the prototype exactly.

### T2.2 ◆ ScenePainter
Paint a scene into an arbitrary rect: authored at 402×216, uniform scale on width, anchored top,
bottom gradient stop stretched so the sky runs full height. Parse and cache paths once at startup.
**Done when** all nine render correctly at header height and at full screen height, on a short phone
and a tall one, with no stretched geometry.

### T2.3 Time-of-day wash
One low-alpha overlay tinted by the local clock: morning, afternoon, evening, night. Recompute on
resume, not only cold start.
**Done when** changing the device clock across the four bands visibly changes the wash after a
resume.

### T2.4 ◆ Ambient drift
Seven effects — fireflies, leaves, breeze, dust, rain, snow, petals — 18–26 shapes on a single
repeating controller, deterministic per-index phase from a hash of index and scene key.
**Done when** drift pauses on background and off-screen, and draws **zero** particles (not slowed
ones) when `MediaQuery.disableAnimationsOf` is true or Ambient motion is off.
**Watch for** `Random()` — the pattern must be stable across rebuilds.

### T2.5 Glass, sill and parallax
Diagonal sheen, edge vignette, warm ledge, and the backdrop translating at one sixth of scroll
offset, clamped so the sky never lifts off the top. All inside a `RepaintBoundary`.
**Done when** scrolling a long dummy list stays at 60fps on the oldest device you support.

### T2.6 Scene switching retints the app
Changing the scene swaps the palette for the whole app over 420ms, ease-out, chrome included.
**Done when** cycling all nine shows no flash of the old accent and no unthemed widget.

---

## Milestone 3 · A village
The privacy boundary, made real. Rules and the invite flow come before any content — retrofitting
them is the one mistake you cannot cheaply undo.

### T3.1 ◆ Firestore, rules and rule tests
Create the collections from `backend.md`, write `firestore.rules` and `storage.rules`, enable offline
persistence with an unlimited cache.
**Done when** the emulator rules suite proves a non-member cannot read a village's posts, a member
cannot appoint an admin, and a member cannot edit another member's post. Those three tests are the
product's whole promise.

### T3.2 Create a village
Name, scene picker, creator becomes admin, member document written with a copy of their display name
and avatar.
**Done when** the new village's scene immediately themes the app.

### T3.3 Invite mint and redeem functions
Two callables. Mint writes `/invites/{token}` with an expiry; redeem validates, writes the member
document, marks the token used. Clients never write either collection.
**Done when** a token works exactly once, an expired token fails cleanly, and the share sheet is the
platform's own.

### T3.4 The invitation screen
The pre-join deep-link target: the village's own scene, the host's name, who is inside, the two
reassurance rows, "Join the village".
**Done when** a cold-start deep link lands here and joining goes straight into the feed.

### T3.5 Members and admin
The members list, admin-gated: appoint and remove admins, remove members. The creator is admin and
cannot be the last admin removed.
**Done when** a non-admin sees the list but no controls, enforced in rules as well as UI.

### T3.6 Village switcher
The header avatar opens the switcher: villages as lit doors, each in its own scene, plus the scene
picker for the current village.
**Done when** switching villages retints the app and the feed reloads from cache first.

### T3.7 "Who sees me?"
One screen, reached from the invitation screen, the Me tab and the members list. Faces first, then
the four statements, then the two adjustable settings, with "Leave this village" at the bottom.
**Done when** all three routes reach the identical screen.

### T3.8 ◆ leaveVillage function
The deletion table from `backend.md` as one callable, with the keep-or-leave-behind recipe choice
stubbed until milestone 5. Admin removal calls the same function.
**Done when** an emulator test seeds a member with posts, photos, notes and reactions, calls the
function, and asserts every one is gone — including the Storage objects.

---

## Milestone 4 · The feed — this is v1
Updates, photos, four reactions, notes, the daily status line. When this is done, the family goes on
it. Nothing here is optional; nothing above milestone 4 ships with it.

### T4.1 App shell
The four-tab bar — Home · Village · + · Me — drawn by the app rather than the platform, accent
following the scene. The `+` opens a native modal sheet.
**Done when** the bar looks identical on both platforms and every target is ≥56px.

### T4.2 Post model and repository
The post document, a paginated feed query by `createdAt`, and a repository that serves cache first.
One card widget with a type variant — not five widgets.
**Done when** the feed renders from disk in airplane mode with no spinner.

### T4.3 Compose an update
Text update posting into the feed, in the composer sheet from the prototype.
**Done when** a post written offline appears immediately in a "sending" state and settles when
signal returns.

### T4.4 ◆ Photos and the upload outbox
Client-side resize to a 1600px long edge plus a 400px thumbnail, upload to
`/villages/{vid}/{postId}/`, and a persistent outbox that retries on connectivity. Never upload the
camera original.
**Done when** three photos queued in airplane mode all arrive after a force-quit and a reconnect.

### T4.5 Reactions
Four and only four. One document per user plus a transactional count on the post. No picker.
**Done when** two devices reacting simultaneously both land, and changing your reaction moves the
count rather than adding one.

### T4.6 Notes
One threaded widget used on every content type, in the app's voice ("3 notes", never "comments").
Author or admin can delete.
**Done when** the same widget opens from a post and from a photo with no per-type branches.

### T4.7 The daily status line
The face row at the top of the feed, one line each, TTL policy on `expiresAt`. Never notifies.
**Done when** a status disappears on its own overnight without a cleanup job.

### T4.8 Actionable push
FCM plus the Firestore trigger for notes and thank-yous, with reply and thank actions on the
notification itself. The only two senders in v1.
**Done when** replying from the lock screen posts a note without opening the app.

### T4.9 Moderation take-down
The admin sheet (reason, who's told, deletion stated plainly), the author's notice with "Answer
Rosa" into the ordinary notes thread, and the admin-only record.
**Done when** a take-down deletes the post and its photos, notifies only the author and any admins
selected, and writes one moderation record.

### T4.10 Day one
The two-member empty state: the house carries it, three gentle prompts, no invented activity.
**Done when** a brand-new village shows it and it doesn't look like an error.

### T4.11 ◆ The 150% pass
Every v1 screen at 150% text: layouts vertical, reaction rows collapsed behind one button, targets
at 56px, nothing truncated. Never cap `textScaler`.
**Done when** screenshots of every screen at 100% and 150% sit side by side and you'd hand either to
your grandmother.

### T4.12 Ship it to the family
TestFlight and an Android internal track, scheduled Firestore exports on, a billing alert set, and
one real invitation sent to a real person.
**Done when** someone who did not build it posts something you did not ask them to post.

---

## After v1
Don't start milestone 5 for two weeks. Watch what the family actually does — which of recipes,
routines and events they ask for first should decide the order, and one of the three may turn out not
to matter at all.
