# Tahan — repo constraints

Flutter app, iOS + Android from one codebase. Read `README.md` for the design, `tickets.md` for the
build order, `backend.md` for the data model. Work one ticket at a time, in order, and stop when its
definition of done is met.

## Non-negotiables

- **Path data is absolute only** — `M L Q C Z`. No arcs, no relative `h`/`v`. The geometry scaler
  offsets every number as an absolute x,y pair. The parser THROWS on anything else; do not "add
  support" for more commands.
- **Four reactions**: heart, thanks-hands, smile, star. Not five. No reaction picker.
- **Routines are self-reported.** Never write, schedule or send a missed-dose alert. Tahan is not a
  medical reminder and the copy says so.
- **Ambient drift draws zero particles** when `MediaQuery.disableAnimationsOf(context)` is true or the
  app's Ambient motion setting is off — not slowed particles. Pause when backgrounded or off-screen.
- **No `Random()` in drawing.** Particle phase and duration come from a hash of index and scene key,
  so the pattern is stable across rebuilds.
- **Avatars are six integers.** No photo upload, no crop, no image hosting. Do not add photo avatars.
- **A village is the permission boundary.** Everything that is not a user's own document lives under
  `/villages/{villageId}/`. Rules are written against membership.
- **One document per person wherever two people can act at once** — event bring-rows, reactions,
  notes, routine check-ins. Never an array field. Firestore merges at field level and last write
  wins; arrays lose claims made offline.
- **Deletions are deletions.** When Tahan says a post or photo was removed, no copy is kept. Same
  promise for leaving a village.
- **Never cap `textScaler`.** Every screen must survive 150% text: layouts go vertical, reaction rows
  collapse, hit targets stay at 56px minimum.
- **No month grid.** An event is a pinned post, not a calendar entry.
- **Push stays rare.** Exactly three senders: notes/thank-yous, event creation, and the scheduled
  Sunday digest plus evening-before reminder. Claims, votes and statuses never notify.

## Style

- Colours, type, spacing and radii come from the theme, never hard-coded. Ramps generated in OKLCH.
- Caprasimo for display and titles only; Figtree for everything else.
- Radius 16 for containers, 999 for buttons, chips, inputs and avatars.
- Icons: Lucide, stroke-width 2.75.
- Platform-native only for modal sheets and the invite share action. Everything else is drawn by the
  app and should look identical on both platforms — including the tab bar.

## Workflow

- One commit per ticket, message `T1.4 avatar painter`.
- Every ticket ends with a build that runs on a real device.
- Tickets marked ◆ are load-bearing: pause and let the owner review before moving on.
- Add no dependency that is not already in the package list without asking.
