// Tahan — where the onboarding goes next.
//
// Pure. Four screens, then you're in: welcome → number → code → name and
// first face. An invitation link skips the welcome and, once the face is
// made, comes back to the invitation. Arriving with no invitation ends on the
// fork: start a village, or wait for someone to send a link. No tour, no
// browse, no "find friends", and no permission is asked for along the way.

import { hashString, firstFace, type TahanUser } from '../data/user.ts';
import { specForIndex, type AvatarSpec } from '../theme/palettes.ts';

/** Someone has finished onboarding once they've given a name. */
export const isOnboarded = (user: TahanUser): boolean => user.displayName.trim().length > 0;

/**
 * The screen the app opens on. `invite` is an invitation code that arrived by
 * link and hasn't been dealt with yet.
 */
export function startRoute(user: TahanUser | null, invite: string | null): string {
  if (!user) return invite ? '/phone' : '/welcome';
  if (!isOnboarded(user)) return '/face';
  if (invite) return `/invite/${invite}`;
  // Milestone 3 adds villages and milestone 4 the feed: someone with a
  // village will go there. Until then, everyone lands on the fork.
  return '/fork';
}

export const MAX_NAME = 40;

/** A name as it will be shown to the family: trimmed, single-spaced, not too long. */
export function cleanName(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME).trim();
}

const CODE = /^[A-Za-z0-9_-]{6,64}$/;

export const isInviteCode = (code: string): boolean => CODE.test(code);

/**
 * The invitation code in whatever was pasted: a tahan:// link, a web link
 * ending /invite/<code>, or a whole message with the link somewhere in it.
 * Null if there's no link — a bare word is not taken as a code.
 */
export function parseInviteLink(text: string): string | null {
  const m = /(?:tahan:\/\/|https?:\/\/[^\s/]+\/)invite\/([A-Za-z0-9_-]{6,64})(?![A-Za-z0-9_-])/.exec(text);
  return m ? m[1] : null;
}

/**
 * The face "Surprise me" shows on its nth press. A sequence from the uid
 * rather than a random number: the app never calls Math.random(), and the
 * same presses give the same faces.
 */
export function surpriseFace(uid: string, n: number): AvatarSpec {
  return n <= 0 ? firstFace(uid) : specForIndex(hashString(`${uid}#${n}`));
}
