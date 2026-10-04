// Tahan — where everything lives in Firestore and Storage.
//
// Pure. One place for every path, so the boundary is visible at a glance:
// apart from a person's own document (and the recipes they lend out) and an
// invitation, everything is under /villages/{villageId}/ — which is what
// lets firestore.rules and storage.rules be written once, against
// membership. design/backend.md has the fields.

export const paths = {
  user: (uid: string) => `users/${uid}`,
  recipe: (uid: string, recipeId: string) => `users/${uid}/recipes/${recipeId}`,
  invite: (token: string) => `invites/${token}`,

  village: (vid: string) => `villages/${vid}`,
  members: (vid: string) => `villages/${vid}/members`,
  member: (vid: string, uid: string) => `villages/${vid}/members/${uid}`,
  posts: (vid: string) => `villages/${vid}/posts`,
  post: (vid: string, postId: string) => `villages/${vid}/posts/${postId}`,
  reaction: (vid: string, postId: string, uid: string) => `villages/${vid}/posts/${postId}/reactions/${uid}`,
  notes: (vid: string, postId: string) => `villages/${vid}/posts/${postId}/notes`,
  status: (vid: string, uid: string) => `villages/${vid}/statuses/${uid}`,
  routine: (vid: string, routineId: string) => `villages/${vid}/routines/${routineId}`,
  checkin: (vid: string, routineId: string, day: string) => `villages/${vid}/routines/${routineId}/checkins/${day}`,
  event: (vid: string, eventId: string) => `villages/${vid}/events/${eventId}`,
  rsvp: (vid: string, eventId: string, uid: string) => `villages/${vid}/events/${eventId}/rsvps/${uid}`,
  bringRow: (vid: string, eventId: string, rowId: string) => `villages/${vid}/events/${eventId}/bring/${rowId}`,
  idea: (vid: string, eventId: string, ideaId: string) => `villages/${vid}/events/${eventId}/ideas/${ideaId}`,
  imIn: (vid: string, eventId: string, ideaId: string, uid: string) => `villages/${vid}/events/${eventId}/ideas/${ideaId}/imIn/${uid}`,
  album: (vid: string, albumId: string) => `villages/${vid}/albums/${albumId}`,
  moderation: (vid: string, id: string) => `villages/${vid}/moderation/${id}`,

  /** A photo in Storage: inside the same village boundary as its post. */
  photo: (vid: string, postId: string, file: string) => `villages/${vid}/${postId}/${file}`,
  /** A person's own files (recipe photos), outside any village. */
  ownFile: (uid: string, file: string) => `users/${uid}/${file}`,
} as const;
