// Shown on the sign-in screens and home whenever the preview backend is in
// use, so nobody mistakes it for the real thing.

import { useSession } from '../auth/SessionProvider.tsx';
import { PREVIEW_CODE } from '../auth/previewBackend.ts';
import { Card, T } from './themed.tsx';

export function PreviewNote() {
  const { backend } = useSession();
  if (backend !== 'preview') return null;
  return (
    <Card style={{ gap: 4 }}>
      <T variant="kicker" color="accent700">Preview</T>
      <T variant="bodyTight">
        Firebase isn't connected in this build, so no text is sent. Any number works, and the code
        is always {PREVIEW_CODE}. Everything stays on this phone.
      </T>
    </Card>
  );
}
