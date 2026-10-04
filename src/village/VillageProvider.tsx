// Tahan — the current village, and its scene theming the app.
//
// Which village is current: the one last chosen on this phone, if the person
// is still in it, otherwise the newest (pickVillage in src/data/village.ts).
// The village document is watched; whenever its scene changes — starting a
// village, an admin choosing a new scene, switching villages (T3.6) — the
// whole app retints to it over 420ms through SceneProvider.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { deviceKeyValue, useSession } from '../auth/SessionProvider.tsx';
import { pickVillage, type Village } from '../data/village.ts';
import { sceneByKey } from '../theme/palettes.ts';
import { useScene } from '../theme/SceneProvider.tsx';

interface VillageContextValue {
  /** The current village's id, or null in none (or while the phone's choice is read). */
  readonly id: string | null;
  /** The current village, once it has been read. */
  readonly village: Village | null;
  /** Makes a village current, and remembers it on this phone. */
  choose(id: string): void;
}

const VillageContext = createContext<VillageContextValue | null>(null);
const NONE: readonly string[] = [];
const chosenKey = (uid: string) => `tahan.village.current.${uid}`;

export function VillageProvider({ children }: { children: ReactNode }) {
  const { session, villageStore } = useSession();
  const user = session.status === 'signedIn' ? session.user : null;
  const uid = user?.uid ?? null;
  const list = user?.villages ?? NONE;
  const kv = useMemo(deviceKeyValue, []);

  // The village last chosen on this phone, read once per person.
  const [chosen, setChosen] = useState<{ uid: string; id: string | null } | null>(null);
  useEffect(() => {
    if (!uid) return;
    let live = true;
    kv.getItem(chosenKey(uid)).then(
      (id) => { if (live) setChosen({ uid, id }); },
      () => { if (live) setChosen({ uid, id: null }); },
    );
    return () => { live = false; };
  }, [uid, kv]);

  const ready = !!uid && chosen?.uid === uid;
  const id = ready ? pickVillage(list, chosen.id) : null;

  const [village, setVillage] = useState<Village | null>(null);
  useEffect(() => {
    setVillage(null);
    if (!id) return;
    return villageStore.watch(id, setVillage);
  }, [id, villageStore]);

  // The village's scene themes the app. Only when the village's scene
  // changes — a review screen trying other scenes isn't fought.
  const { palette, setPalette } = useScene();
  const paletteKey = useRef(palette.key);
  paletteKey.current = palette.key;
  const sceneKey = village?.sceneKey;
  useEffect(() => {
    if (sceneKey && sceneKey !== paletteKey.current) setPalette(sceneByKey(sceneKey));
  }, [sceneKey, id, setPalette]);

  const choose = useCallback((next: string) => {
    if (!uid) return;
    setChosen({ uid, id: next });
    kv.setItem(chosenKey(uid), next).catch(() => undefined);
  }, [uid, kv]);

  const value = useMemo(() => ({ id, village: village?.id === id ? village : null, choose }), [id, village, choose]);
  return <VillageContext.Provider value={value}>{children}</VillageContext.Provider>;
}

export function useVillage(): VillageContextValue {
  const value = useContext(VillageContext);
  if (!value) throw new Error('useVillage() outside <VillageProvider>');
  return value;
}
