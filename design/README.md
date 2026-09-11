# Handoff: Tahan (Flutter, iOS + Android)

## Overview
Tahan is a private, invitation-only app for a small group — twelve people, typically an extended
family — to share life updates, photos, recipes, self-reported routines, gatherings and milestones.
Tagalog *tahan*: to find solace; *tahanan*: home. There is no public profile, no discovery, no
ranking. The product's whole feeling comes from two pieces of custom drawing: nine layered vector
**scenes** (one per village, each with its own palette that retints the entire app) and flat vector
**avatars** built from six small integers.

Target: one Flutter codebase for iOS and Android. Build team: the project owner plus a coding agent.
First village is the owner's own family, so v1 can be cut hard.

## About the design files
The `.dc.html` files in this bundle are **design references created in HTML** — prototypes showing
intended look and behaviour. They are not production code and nothing should be ported from them
line-by-line. The task is to **recreate these designs in Flutter**, using the values documented here
and in the two spec documents. `Tahan.dc.html` is the interactive prototype and the visual source of
truth: when this README and the prototype disagree about spacing or copy, the prototype wins.

## Fidelity
**High fidelity.** Colours, type, spacing, copy and interaction behaviour are final. Recreate the UI
faithfully. The exception is platform chrome: modal sheets and the share action stay native.

## Read these first
| File | What it carries |
| --- | --- |
| `tickets.md` | 32 numbered build tickets, milestones 1–4, each with a definition of done. Work them in order. |
| `backend.md` | Firestore collections, security rules, offline conflict model, deletion rules, notifications. |
| `lib/tahan_palettes.dart` | The nine scene palettes and the avatar kit colours, ready to drop in. |
| `CLAUDE.md` | Repo constraints. Copy to the repo root — it is written to be read by the agent every session. |
| `Tahan Flutter Handoff.dc.html` | The full design-side handoff: painter specs, screen inventory, accessibility. |
| `Tahan Backend Spec.dc.html` / `Tahan Build Tickets.dc.html` | Printable versions of the two docs above. |
| `Tahan.dc.html` | The interactive prototype. Open in a browser; every screen below exists in it. |

## Architecture
```
lib/
  app.dart                  MaterialApp, theme wiring, routes (go_router)
  theme/                    tahan_palettes.dart · village_theme.dart · scene_extension.dart
  paint/                    primitives.dart · path_parser.dart
                            avatar_painter.dart · scene_painter.dart
                            scenes/ (nine data files) · drift.dart · window.dart
  models/                   user · village · member · post · note · reaction · status · event
  data/                     firestore refs, repositories, upload outbox
  screens/                  onboarding · avatar_editor · feed · village · me · invitation · event
  widgets/                  avatar.dart · post_card.dart · reaction_row.dart · scene_backdrop.dart
functions/                  invites · leave_village · notifications
firestore.rules · storage.rules · firestore.indexes.json
```
Packages: firebase_core, firebase_auth, cloud_firestore, firebase_storage, firebase_messaging,
cloud_functions, google_fonts (dev only — vendor for release), flutter_image_compress,
connectivity_plus, shared_preferences, go_router. Nothing else without a reason.

## Design tokens

### Base (Organic)
| Token | Value | Role |
| --- | --- | --- |
| text | `#201E1D` | all body copy, `onSurface` |
| bg | `#F5EAD8` | `scaffoldBackgroundColor` |
| accent | `#C67139` | `primary` — fills, active tab |
| accent-2 | `#7A8A5E` | `secondary` — routines, done states |
| heading font | Caprasimo | display and titles only |
| body font | Figtree | everything else, 400 / 600 |
| radius | 16 / 999 | containers / buttons, chips, inputs, avatars |

Every role needs a 100–900 ramp generated in **OKLCH** on a shared lightness scale — not RGB tints,
which go muddy. Light steps 100–300 for tinted fills and hovers, 500 as base, 700–900 for text on
tinted fills and pressed states.

### Type scale (as used in the prototype, logical px)
| Use | Font | Size |
| --- | --- | --- |
| Onboarding wordmark | Caprasimo | 52 |
| Screen title | Caprasimo | 28–30 |
| Section heading | Caprasimo | 15–19 |
| Body | Figtree 400 | 13.5–14 |
| Row title | Figtree 600 | 13.5–14 |
| Secondary / meta | Figtree 400 | 11.5–12.5 |
| Kicker (uppercase, .12em) | Figtree | 11 |

Minimum hit target 56px everywhere. Never cap `textScaler`; every screen is tested at 150%.

### The nine scenes
See `lib/tahan_palettes.dart` for exact values. Each scene carries accent, accent-2, bg, surface, a
`dark` flag (dark sky → light ink in the header) and one ambient drift effect:
night/fireflies, forest/leaves, tropical/breeze, desert/dust, terrace/rain, savanna/dust,
coast/breeze, winter/snow, blossom/petals.

## The two painters

### Scenes
Authored in a **402 × 216** box; painted into the real rect with a uniform scale on width, anchored
top, with the last gradient stop stretched so the sky runs the full height of the app. Layer types:
rect, circle, ellipse, filled path, stroked path, sky gradient.

Path data uses **absolute commands only** — `M L Q C Z`. No arcs, no relative `h`/`v`. This is a hard
constraint: the geometry scaler offsets every number as an absolute x,y pair, so a relative command
is scaled as if it were a point. The parser must *throw* on anything else rather than guess.

Over the scene: a time-of-day wash (one low-alpha rect — morning warms, afternoon neutral, evening
amber, night deep; recomputed on resume), then the drift, then the window treatment (diagonal sheen,
edge vignette, warm sill). The backdrop translates at **one sixth** of the feed's scroll offset,
clamped so the sky never lifts off the top, inside a `RepaintBoundary`.

Drift: 18–26 shapes on a **single** repeating `AnimationController`, phase and duration derived from
a hash of index and scene key (never `Random()` — the pattern must be stable across rebuilds).
Draws **zero** particles when `MediaQuery.disableAnimationsOf` is true or the app's Ambient motion
setting is off; pauses when backgrounded or off-screen.

### Avatars
Six integers, no files: `skin` 0–4, `hairColor` 0–4, `top` 0–4, `hair` 0–7 (Short, Long, Bun, Curls,
Wrap, Braids, Bald, Cap), `glasses` 0–3 (None, Round, Square, Readers), `face` 0–3 (None, Beard,
Moustache, Stubble). Authored in a **78-unit** square, painted at any size by uniform scale, drawn on
the current village's sky. Sizes in use: 26 (feed row), 34 (status row), 44 (header/switcher),
96 (Me), 216 (editor). Cache each spec+size as a `ui.Picture`. Every avatar carries a `Semantics`
label with the person's name.

A user may add **one companion** — dog, cat or baby — same six integers plus a coat index. It belongs
to the user, not a village.

## Screens

### Onboarding (four screens, fixed evening palette — no village yet, so no scene)
1. **Welcome** — full-bleed evening sky with a lit house, wordmark at 52px, one value line, two
   buttons: *I have an invitation* (primary) then *Start on my own* (outlined, light-on-dark).
   Footnote: "Your phone number, and nothing else." The scrim behind the text must reach near-full
   opacity — cream type over the lit windows fails contrast otherwise.
2. **Phone number** — evening band at the top (236px) fading into cream, title *What's your number?*,
   `+1` chip plus the number field, primary *Send me a code*, and a sage reassurance card: the number
   signs you in, nobody in a village sees it, it is never used to find contacts.
3. **Code** — six 54px fields at 16px radius, the destination number visible with an inline *change*,
   and a resend that states the wait ("in 0:24") rather than greying out. Autofill means most users
   never dwell here.
4. **Name and first face** — the avatar drawn large on an evening sky, a name field, *Change my face*
   / *Surprise me*, and *Come in*. If they arrived by invitation, the footnote names the host.

Phone sign-in only: no password, no email. An invitation link skips the welcome and returns to the
invitation screen after the face is made. No tour; notification and photo permissions are requested
at first use. Arriving with no invitation forks to start-a-village or wait — no browse, no
suggestions, no "find friends".

### Invitation (pre-join, deep-link target)
The inviting village's own scene with the host's people standing out front, the village name, member
count, two reassurance rows (only these people ever see it; what's inside), *Join the village* and
*Who sees me?*. Renders before the user has an account.

### Home — the feed
Scene backdrop full height. A horizontally scrolling **status row** of faces, each with one line
(daily, expires, never notifies). A "Today in the village" routine strip. Then posts in time order:
updates, photos, recipes, milestones, events — **one card widget with a type variant, not five
widgets**. Pinned event cards sit at the top until the day after.

Reactions: exactly **four** — heart, thanks-hands, smile, star. One per person, changeable, no picker
and no sixth option. Notes (never "comments") thread on every content type through one widget.

### Events
An event is a **post, not a calendar** — there is no month grid anywhere in Tahan. Detail screen:
lit-house scene header, when/where/who's coming, then two boards.
- **Bringing** — rows grouped *to eat / to drink / to help with*. Claimed rows show a face; open rows
  are drawn dashed with a single *Bring this* pill. Gaps are stated in words at the top.
- **Doing** — ideas anyone can add; the only input on someone else's is *I'm in*. No downvotes, no
  score, no closing date. The host still picks.
RSVP copy is *I'm coming* / *Can't this time*. One notes thread on the event.

### Village
Members (admin-gated: appoint/remove admins, remove members), invitations, albums, the cookbook,
lists. Recipes belong to the **user** and are shared per village; "Print this card" produces a
6 × 4in two-sided card.

### Routines
Self-reported check-offs and streaks. **No missed-dose alert, ever** — the sheet says so in copy.
Visibility is private or village-sees-streaks.

### Me
Avatar editor, companion, your villages, notification settings, text size.

### Who sees me?
Reached from the invitation screen, the Me tab and the members list — the same screen every time.
Answers in faces first (twelve of them), then four plain statements each naming its own exception:
no public profile, admins can remove but not read, leaving deletes your updates and photos, recipes
are yours. Only two things are adjustable. *Leave this village* sits at the bottom of this screen.

### Moderation take-down
Admin sheet: the post shown small, a free-text reason the author will read (no violation
categories, no queue), a who's-told list (author always, other admins optional, nobody else), and a
statement that photos are deleted rather than hidden. The author's notice is the admin's face and
words with *Answer Rosa* into the ordinary notes thread. An admin-only record keeps who removed
what, when, and why.

## Interactions & behaviour
- **Scene switch** (changing village or scene): the whole app retints over **420ms**,
  `Curves.easeOutCubic`, chrome included. No flash of the previous accent.
- **Scroll parallax**: backdrop at 1/6 of the feed offset, clamped.
- **Reactions**: optimistic; one doc per user plus a transactional count on the post.
- **Claiming an event row**: optimistic, but rejected by rules if already claimed — show "Nina got
  there first", not a generic error.
- **Offline**: the feed renders from disk with no spinner. Posts written offline appear immediately
  in a soft "sending" state. Photos queue in a persistent outbox and retry on connectivity.
- **Push**: rare and actionable — a note or thank-you can be answered from the notification. One
  notification when an event is created; one the evening before carrying your own row; the Sunday
  digest, written as a letter. Claims, votes and statuses never notify.

## State
Per session: signed-in user, current village, current scene palette (in a `ThemeExtension`), feed
page cursor, upload outbox, RSVP and claim state per event, per-post reaction state. Everything
persists through Firestore's local cache; the outbox needs its own on-disk table.

## Assets
None to copy. Scenes and avatars are drawn in code; there are no photographic scene assets and no
avatar images. Icons are Lucide at stroke-width 2.75. Fonts: Caprasimo (display) and Figtree (body)
— vendor both for release so first paint is never unstyled. Any photograph in a design mock is a
placeholder for user content.

## Files in this bundle
- `README.md` — this document
- `CLAUDE.md` — repo constraints, copy to the repo root
- `tickets.md`, `backend.md` — the build plan and the data model in markdown
- `lib/tahan_palettes.dart` — palettes and avatar kit
- `Tahan.dc.html` — the interactive prototype (design reference)
- `Tahan Flutter Handoff.dc.html`, `Tahan Backend Spec.dc.html`, `Tahan Build Tickets.dc.html`,
  `Tahan Recipe Card.dc.html` — the printable specs
- `screenshots/` — 2× captures of the ten key screens, in build order:
  01 welcome · 02 first face · 03 invitation · 04 the feed (interactive prototype) · 05 event ·
  06 bring board · 07 activity board · 08 who sees me? · 09 moderation take-down · 10 day one
- `support.js`, `doc-page.js`, `ios-frame.jsx`, `android-frame.jsx` — runtime for the HTML references

The HTML references expect a design-system stylesheet that is **not** bundled here; they will render
unstyled outside the original project. Every value they carry is documented above — treat them as
layout and behaviour references, and use this README for exact numbers.
