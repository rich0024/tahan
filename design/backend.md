# Tahan — data model and backend

Twelve people per village, private, photo-heavy, used on bad rural wifi. No feed to rank, no
discovery to index, no scale problem — but a hard privacy boundary and a real offline requirement.

## Recommendation
**Firebase** — Firestore, Storage, Auth, Cloud Functions, FCM. Chosen for offline behaviour: local
persistence means the feed opens instantly from disk, writes queue on disk and replay when signal
returns, and you never write a sync layer. At twelve users the bill is storage and egress, not
reads; set a billing alert and forget it.

Supabase is the honest alternative — real SQL, readable row-level security — but its Flutter offline
story is yours to build. Pick it only if you'd rather own the sync.

## The one thing to get right up front
A village is the permission boundary, so **every document that isn't a user's own lives under
`/villages/{villageId}/`**. Rules are then written once against membership. Retrofitting this means
rewriting every query in the app.

## Collections

```
/users/{uid}
  displayName        string
  avatar             { skin, hairColor, top, hair, glasses, face }   // six ints
  companion          { kind: 'dog'|'cat'|'baby', name, coat, ...spec } | null
  villages           [villageId]
  textScale          number
  createdAt          timestamp

/users/{uid}/recipes/{recipeId}         // RECIPES BELONG TO THE PERSON
  title, story, ingredients[], method[], cookedCount, photoPath
  sharedWith         [villageId]        // unshare = remove the id; nothing is deleted

/villages/{villageId}
  name, sceneKey                        // one of the nine scenes
  createdBy          uid
  memberCount        int                // maintained by a function
  createdAt          timestamp

/villages/{villageId}/members/{uid}
  role               'admin' | 'member'
  displayName, avatar                   // copied at join, refreshed by a function
  joinedAt, lastSeenAt

/villages/{villageId}/posts/{postId}
  type               'update'|'photo'|'recipe'|'milestone'|'routine'|'event'
  authorId           uid
  body               string
  photoPaths         [string]
  recipeRef          path | null
  pinnedUntil        timestamp | null   // events pin until the day after
  reactionCounts     { heart, hands, smile, star }
  noteCount          int
  createdAt          timestamp

/villages/{villageId}/posts/{postId}/reactions/{uid}
  kind               'heart'|'hands'|'smile'|'star'

/villages/{villageId}/posts/{postId}/notes/{noteId}
  authorId, body, createdAt

/villages/{villageId}/statuses/{uid}    // daily line; never notifies
  text, expiresAt                       // TTL policy deletes it

/villages/{villageId}/routines/{routineId}
  title, ownerId, forCompanion bool, schedule, visibility 'private'|'streaks'
/villages/{villageId}/routines/{routineId}/checkins/{yyyy-mm-dd}
  byUid, at                             // SELF-REPORTED. no missed-dose write, ever

/villages/{villageId}/events/{eventId}
  title, startsAt, where, hostId, postId
  comingUids [uid], cantUids [uid]

/villages/{villageId}/events/{eventId}/bring/{rowId}     // ONE DOC PER ROW
  group 'eat'|'drink'|'help'
  title, askedBy uid | null, claimedBy uid | null, note

/villages/{villageId}/events/{eventId}/ideas/{ideaId}
  title, byUid, inUids [uid]            // "I'm in" only; no downvote field exists

/villages/{villageId}/albums/{albumId}
  title, coverPath, photoPaths[]

/villages/{villageId}/moderation/{id}   // admin-visible record
  actorUid, authorUid, postType, reason, at

/invites/{token}                        // top-level: readable before you're a member
  villageId, createdBy, expiresAt, usedAt | null
```

Notes on the shape:
- **Recipes are the deliberate exception** to village ownership — a recipe is yours and gets lent to a
  village. `sharedWith` is the whole sharing mechanism; a post of type `recipe` only points at it.
- **Reaction counts are denormalised** onto the post so the feed is one query. Write the count and the
  per-user doc in one transaction.
- **Statuses expire** via a TTL policy on `expiresAt`, not a cleanup job.
- **No user reads in the feed.** Name and avatar are copied into the member doc; a function refreshes
  them when a user edits their avatar.

## Security rules (shape)

```
function member(vid) {
  return exists(/databases/$(db)/documents/villages/$(vid)/members/$(request.auth.uid));
}
function admin(vid) {
  return get(/databases/$(db)/documents/villages/$(vid)/members/$(request.auth.uid))
           .data.role == 'admin';
}
```

- `/users/{uid}` — read/write only your own. Recipes readable if yours or `sharedWith` intersects your
  villages; writable only by the author.
- `/villages/{vid}` — read if member; update if admin; never delete.
- `members` — read if member; create only via `redeemInvite()`; delete if admin or yourself; update if
  admin.
- `posts` — read if member; create if member and `authorId == auth.uid`; update if author, or if the
  change is only `reactionCounts`/`noteCount`; delete if author or admin (moderation).
- `reactions/{uid}` — write only your own. `notes` — create if member; delete if author or admin.
- `events/.../bring/{rid}` — a member may claim a row only when `claimedBy == null` and they set it to
  themselves, or release a row they hold. Nobody takes another person's row.
- `/invites/{token}` — `get` is public (a newcomer must see who's inside); all writes are functions
  only. This is the only document outside the boundary, and it exposes exactly what the invitation
  screen shows: village name, member count, host name.

`member()` costs one document read per evaluation. Worth it for rules you can read.

## Offline, and why boards are documents
Turn on Firestore persistence with an unlimited cache and the read path is solved. What you design
around is the conflict model: Firestore merges at field level, last write wins.

That is why a bring-row is its own document rather than an array element — two people claiming
different rows from two kitchens with no signal is the normal case, and an array would silently drop
one claim on reconnect. Same for reactions, notes and check-ins. **Anywhere two people can act at
once, give each person their own document.**

- Claiming an already-claimed row is the one race the rules reject — show "Nina got there first".
- Photos don't queue in Firestore. Keep an outbox with local file paths, retry on connectivity, show
  a soft "sending" state.
- Cache the last ~200 feed items and their thumbnails deliberately; don't rely on the OS image cache.

## Leaving, removing, deleting
One callable function, never client-side. The design promise is literal: *your updates and photos
leave with you; recipes are yours to keep or leave behind.*

| What | On leaving / being removed |
| --- | --- |
| Posts you authored | Deleted, with notes and reactions subcollections |
| Photos you uploaded | Storage objects deleted, including inside albums |
| Notes you left elsewhere | Deleted; parent `noteCount` decremented |
| Reactions you gave | Deleted; counts decremented |
| Recipes | Your choice: *keep* removes the village from `sharedWith`; *leave behind* copies it to the village under your name and keeps yours |
| Routines you owned | Deleted with check-ins; routines others check for you reassign to the host |
| Event rows you claimed | Released back to open, so the host sees the gap reappear |
| Your membership | Deleted; `memberCount` decremented; village id removed from your user doc |

Admin removal runs the same function with `keepRecipes: true`. Account deletion runs it per village,
then deletes `/users/{uid}`. Neither is undoable and both must say so before running.

**Moderation take-down** writes a `moderation` record (actor, author, time, post type, reason) and
notifies the author. It is a deletion, not a shadow-hide.

## Photos
Storage path `/villages/{vid}/{postId}/{uuid}.jpg`, mirroring the Firestore boundary so one
membership rule protects both. Resize on the client — 1600px long edge for viewing, 400px thumbnail.
Signed URLs unnecessary; rules cover it.

## Notifications — three senders, resist a fourth
| Trigger | Function | Body |
| --- | --- | --- |
| A note on your post, or a thank-you | Firestore trigger on `notes` / `reactions` | Actionable: reply and thank from the notification |
| An event is created | Trigger on `events` | Once. Claims and votes never notify |
| Sunday digest · evening before an event | Scheduled | The digest letter — three numbers, two moments, who has gone quiet. The reminder carries *your own row* |

## Still open
- **Search** — nothing here supports it. At twelve people, client-side filtering over the cache is
  genuinely enough; decide that consciously rather than reaching for an index later.
- **Multi-village users** — the schema supports it; the notification budget assumes one. Decide what
  a person in four villages gets on a Sunday.
- **Export** — "your photos leave with you" implies a download. A function that zips a user's posts
  and photos is a day's work; do it before the first person leaves.
- **Backups** — turn on scheduled Firestore exports on day one. This is a family's photographs.
