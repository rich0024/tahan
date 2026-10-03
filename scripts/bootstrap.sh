#!/bin/sh
# One-time setup, run on your Mac from the project root:  npm run bootstrap
#
# package.json ships with no dependency versions on purpose. This installs the
# current Expo SDK and lets `expo install` pick every other version to match
# it, so nothing here was guessed.
set -e
cd "$(dirname "$0")/.."

npm install expo@latest

npx expo install \
  expo-router expo-linking expo-constants expo-status-bar expo-splash-screen \
  expo-font expo-dev-client expo-build-properties \
  react-native-safe-area-context react-native-screens \
  @shopify/react-native-skia react-native-reanimated react-native-worklets \
  @expo-google-fonts/caprasimo @expo-google-fonts/figtree

npm install --save-dev typescript @types/react @types/node

# Align anything that drifted to what this SDK expects.
npx expo install --fix

echo
echo "Installed. Running the checks…"
npm run check
