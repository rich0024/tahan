// T1.5's definition of done: two hundred avatars scrolling smoothly.
//
// Check it in a release-mode build (`npx expo run:ios --configuration Release`)
// with the performance monitor open; debug builds are not representative.
//
// Rows have a minimum height, not a fixed one: at 150% text a fixed row would
// clip its label, and nothing in Tahan is allowed to.

import { FlatList, View } from 'react-native';
import { router } from 'expo-router';

import { Button, Screen, T } from '../src/components/themed.tsx';
import { AvatarSize } from '../src/paint/avatarGeometry.ts';
import { specForIndex } from '../src/theme/palettes.ts';
import { Avatar } from '../src/widgets/Avatar.tsx';

const rows = Array.from({ length: 200 }, (_, i) => i);

export default function ScrollTest() {
  return (
    <Screen>
      <View style={{ paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Button label="Back" kind="text" onPress={() => router.back()} />
        <T variant="sectionHeading">200 avatars</T>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(i: number) => String(i)}
        renderItem={({ item }: { item: number }) => (
          <View style={{ minHeight: 44, paddingVertical: 6, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar spec={specForIndex(item)} size={AvatarSize.feedRow} name={`Face ${item}`} />
            <T variant="rowTitle">{`Face ${item}`}</T>
          </View>
        )}
      />
    </Screen>
  );
}
