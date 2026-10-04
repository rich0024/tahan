// The face editor — your face, and your companion's.
//
// The face you're editing stays pinned at the top while the parts scroll
// beneath it, in the avatar lab's order, with a row of chips to jump between
// them. Every change shows at once; it's saved a moment after you stop, and
// again on the way out, to the phone's copy of your document first — so a
// force-quit keeps it.
//
// No size previews here: those were for designing the kit, not for choosing
// a face.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { surpriseFace } from '../src/auth/onboarding.ts';
import { SignedIn, useSession, useUser } from '../src/auth/SessionProvider.tsx';
import { BackButton } from '../src/components/BackButton.tsx';
import { Row, Slider, Swatches, Thumbs } from '../src/components/editor/controls.tsx';
import { Button, Chip, Field, Screen, T } from '../src/components/themed.tsx';
import { MAX_COMPANION_NAME, type TahanCompanion, type UserChanges } from '../src/data/user.ts';
import {
  colourAt, colourName, companionParts, hasOddEyes, hueColour, hueOf, hueStops, personParts, positionOf,
  surpriseCompanion, valueOf, withColour, withOddEyes, withOption, type ColourControl, type Part,
} from '../src/editor/kit.ts';
import { CompanionKit, defaultCompanion, fitCompanion, specKey, type AvatarSpec, type CompanionSpec } from '../src/theme/palettes.ts';
import { useScene } from '../src/theme/SceneProvider.tsx';
import { hitTarget, radius } from '../src/theme/tokens.ts';
import { Avatar, CompanionAvatar } from '../src/widgets/Avatar.tsx';

const HERO = 152;
const SAVE_AFTER_MS = 400;

type Mode = 'person' | 'pet';

export default function EditorScreen() {
  return (
    <SignedIn>
      <Editor />
    </SignedIn>
  );
}

function Editor() {
  const user = useUser();
  const { updateUser } = useSession();
  const { colors } = useScene();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<Mode>(params.mode === 'companion' ? 'pet' : 'person');
  const [person, setPerson] = useState<AvatarSpec>(user.avatar);
  const [pet, setPet] = useState<TahanCompanion | null>(user.companion);
  const [odd, setOdd] = useState(user.companion ? hasOddEyes(user.companion) : false);
  const [anyOpen, setAnyOpen] = useState<string | null>(null);
  // While a slider is dragged the thumbnails hold still: redrawing sixty
  // small faces on every frame would make the drag stutter.
  const [frozen, setFrozen] = useState<{ person: AvatarSpec; pet: TahanCompanion | null } | null>(null);
  const presses = useRef({ person: 0, pet: 0 });

  // ------------------------------------------------------------- saving
  const saved = useRef({ avatar: specKey(user.avatar), companion: JSON.stringify(user.companion) });
  const pending = useRef<UserChanges | null>(null);
  const flushRef = useRef(() => {});
  flushRef.current = () => {
    if (!pending.current) return;
    updateUser(pending.current);
    pending.current = null;
  };

  useEffect(() => {
    const avatar = specKey(person);
    const companion = JSON.stringify(pet);
    const changes: UserChanges = {
      ...(avatar !== saved.current.avatar ? { avatar: person } : {}),
      ...(companion !== saved.current.companion ? { companion: pet } : {}),
    };
    if (Object.keys(changes).length === 0) return;
    pending.current = { ...pending.current, ...changes };
    saved.current = { avatar, companion };
    const id = setTimeout(() => flushRef.current(), SAVE_AFTER_MS);
    return () => clearTimeout(id);
  }, [person, pet]);

  useEffect(() => () => flushRef.current(), []);

  const done = () => {
    flushRef.current();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  // ------------------------------------------------------------- changes
  const spec: AvatarSpec | CompanionSpec | null = mode === 'person' ? person : pet;
  const thumbSpec = frozen ? (mode === 'person' ? frozen.person : frozen.pet) : spec;

  const setOption = (key: string, i: number) => {
    if (mode === 'person') setPerson((s) => withOption(s, key, i));
    else setPet((p) => (p ? withOption(p, key, i) : p));
  };
  const setColour = (field: string, value: string | number) => {
    if (mode === 'person') setPerson((s) => withColour(s, field, value));
    else setPet((p) => (p ? withColour(p, field, value, odd) : p));
  };
  const startDrag = () => setFrozen({ person, pet });
  const endDrag = () => setFrozen(null);

  const surprise = () => {
    if (mode === 'person') {
      presses.current.person += 1;
      setPerson(surpriseFace(user.uid, presses.current.person));
    } else if (pet) {
      presses.current.pet += 1;
      const next = { ...surpriseCompanion(user.uid, presses.current.pet, pet.kind), name: pet.name };
      setOdd(hasOddEyes(next));
      setPet(next);
    }
  };

  const addCompanion = (kind: number) => {
    setOdd(false);
    setPet({ ...fitCompanion({ ...defaultCompanion, kind }), name: '' });
  };

  const parts: Part[] = mode === 'person' ? personParts() : pet ? companionParts(pet, odd) : [];

  // ------------------------------------------------------------- jumping
  const scroll = useRef<ScrollView>(null);
  const sections = useRef(new Map<string, number>());
  const jump = (key: string) => {
    const y = sections.current.get(key);
    // Section offsets are measured inside the parts column, which starts right
    // under the pinned face — so scrolling by that offset puts the section
    // just below it.
    if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y), animated: true });
  };

  const draw = (s: AvatarSpec | CompanionSpec, size: number, label?: string) =>
    'kind' in s
      ? <CompanionAvatar spec={s} size={size} name={label} />
      : <Avatar spec={s} size={size} name={label} />;

  const companionLabel = pet?.name || (pet ? CompanionKit.kinds[pet.kind] : 'Companion');

  return (
    <Screen style={{ paddingTop: 0 }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} stickyHeaderIndices={[0]} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}>
          {/* The pinned face. */}
          <View
            style={{ backgroundColor: colors.bg, paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <BackButton onPress={done} label="Done" />
              <View style={{ flexDirection: 'row', gap: 6, flexGrow: 1 }} accessibilityRole="tablist">
                <Chip label="You" selected={mode === 'person'} onPress={() => setMode('person')} accessibilityRole="tab" />
                <Chip label={companionLabel} selected={mode === 'pet'} onPress={() => setMode('pet')} accessibilityRole="tab" />
              </View>
              {spec && (
                <Button
                  label="Surprise me"
                  kind="text"
                  onPress={surprise}
                  accessibilityHint={mode === 'person' ? 'Picks a new face' : 'Picks a new look for your companion'}
                />
              )}
            </View>
            <View style={{ alignItems: 'center' }}>
              {spec
                ? draw(spec, HERO, mode === 'person' ? `Your face${user.displayName ? `, ${user.displayName}` : ''}` : `Your companion${pet?.name ? `, ${pet.name}` : ''}`)
                : (
                  <View style={{ width: HERO, height: HERO, borderRadius: radius.pill, backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <T variant="rowTitle" color="accent700" style={{ textAlign: 'center' }}>No companion yet</T>
                  </View>
                )}
            </View>
            {parts.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 8 }}>
                {parts.map((p) => <Chip key={p.key} label={p.title} onPress={() => jump(p.key)} accessibilityHint={`Jumps to ${p.title}`} />)}
              </ScrollView>
            )}
          </View>

          <View style={{ paddingHorizontal: 20, gap: 28, paddingTop: 12 }}>
            {mode === 'pet' && !pet && (
              <Section title="Add a companion" hint="A dog, a cat or a baby — one, and it's yours, not a village's. You post as yourself; the update wears their face.">
                <Thumbs
                  title="Companion"
                  options={CompanionKit.kinds}
                  selected={-1}
                  onSelect={addCompanion}
                  draw={(i, size) => draw(fitCompanion({ ...defaultCompanion, kind: i }), size)}
                />
              </Section>
            )}

            {mode === 'pet' && pet && (
              <Section title="Name">
                <Field
                  value={pet.name}
                  onChangeText={(name) => setPet((p) => (p ? { ...p, name: name.slice(0, MAX_COMPANION_NAME) } : p))}
                  placeholder={pet.kind === 2 ? 'Their name' : 'Their name, like Kuya'}
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel="Your companion's name"
                />
              </Section>
            )}

            {spec && thumbSpec && parts.map((part) => (
              <View key={`${mode}-${part.key}`} onLayout={(e) => sections.current.set(part.key, e.nativeEvent.layout.y)}>
                <Section
                  title={part.title}
                  picked={part.options ? part.options[valueOf(spec, part.key) as number] : undefined}
                  hint={part.hint}
                >
                  {part.options && (
                    <Thumbs
                      title={part.title}
                      options={part.options}
                      selected={valueOf(spec, part.key) as number}
                      onSelect={(i) => setOption(part.key, i)}
                      draw={(i, size) => draw(
                        part.key === 'kind' ? fitCompanion({ ...(thumbSpec as CompanionSpec), kind: i }) : withOption(thumbSpec, part.key, i),
                        size,
                      )}
                    />
                  )}
                  {part.colour && (
                    <ColourRow
                      control={part.colour}
                      spec={spec}
                      anyOpen={anyOpen === part.key}
                      onAny={() => setAnyOpen((k) => (k === part.key ? null : part.key))}
                      onColour={setColour}
                      onStart={startDrag}
                      onEnd={endDrag}
                    />
                  )}
                  {part.oddToggle && pet && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel="Eye colours">
                      <Chip label="Both eyes the same" selected={!odd} onPress={() => { setOdd(false); setPet((p) => (p ? withOddEyes(p, false) : p)); }} />
                      <Chip label="Different colours" selected={odd} onPress={() => setOdd(true)} />
                    </View>
                  )}
                  {part.colour2 && (
                    <ColourRow
                      control={part.colour2}
                      spec={spec}
                      anyOpen={anyOpen === `${part.key}2`}
                      onAny={() => setAnyOpen((k) => (k === `${part.key}2` ? null : `${part.key}2`))}
                      onColour={setColour}
                      onStart={startDrag}
                      onEnd={endDrag}
                    />
                  )}
                </Section>
              </View>
            ))}

            {mode === 'pet' && pet && (
              <Button label={`Remove ${pet.name || 'companion'}`} kind="text" onPress={() => setPet(null)} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------

function Section({ title, picked, hint, children }: { title: string; picked?: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <T variant="sectionHeading" accessibilityRole="header">{title}</T>
        {picked && <T variant="meta" color="inkMuted">{picked}</T>}
      </View>
      {children}
      {hint && <T variant="meta" color="inkMuted">{hint}</T>}
    </View>
  );
}

function ColourRow({ control, spec, anyOpen, onAny, onColour, onStart, onEnd }: {
  control: ColourControl;
  spec: AvatarSpec | CompanionSpec;
  anyOpen: boolean;
  onAny: () => void;
  onColour: (field: string, value: string | number) => void;
  onStart: () => void;
  onEnd: () => void;
}) {
  const value = valueOf(spec, control.field);
  const hex = typeof value === 'string' ? value : colourAt(control.type === 'range' ? control.stops : [], value);

  const any = (
    <Slider
      label={`${control.label}, any colour`}
      stops={hueStops()}
      value={hueOf(hex) / 360}
      knob={hex}
      valueText={colourName(hex)}
      onChange={(t) => onColour(control.field, hueColour(t * 360))}
      onStart={onStart}
      onEnd={onEnd}
    />
  );

  if (control.type === 'swatches') {
    return (
      <Row label={control.label}>
        <Swatches label={control.label} list={control.list} value={hex} onPick={(c) => onColour(control.field, c)} anyOpen={anyOpen} onAny={onAny} />
        {anyOpen && any}
      </Row>
    );
  }

  const t = control.holds === 'position' ? (value as number) : positionOf(control.stops, hex);
  return (
    <Row label={control.label}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 4 }}>
        <Slider
          label={control.label}
          stops={control.stops}
          value={t}
          knob={control.holds === 'position' ? colourAt(control.stops, t) : hex}
          valueText={colourName(control.holds === 'position' ? colourAt(control.stops, t) : hex)}
          onChange={(u) => onColour(control.field, control.holds === 'position' ? u : colourAt(control.stops, u))}
          onStart={onStart}
          onEnd={onEnd}
        />
        {control.anyColour && (
          <View style={{ minHeight: hitTarget, justifyContent: 'center' }}>
            <Chip label={anyOpen ? 'Natural' : 'Any colour'} selected={anyOpen} onPress={onAny} />
          </View>
        )}
      </View>
      {control.anyColour && anyOpen && any}
    </Row>
  );
}
