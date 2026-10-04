// Links the operating system hands the app, before the router sees them.
//
// On iOS without push (a free Apple ID, or push turned off), Firebase proves
// the app is genuine with a web check that returns to the app through a link
// like app-1-…://firebaseauth/link. Firebase consumes that link itself; the
// router must not try to open it as a screen. Returning null drops it, and
// the person stays where they were.

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string | null {
  if (path.includes('firebaseauth')) return null;
  return path;
}
