// Expo config.
//
// Firebase is wired in only once both of its config files are present, so the
// app builds and runs — in Expo Go or a dev build — before T1.1's Firebase
// registration is done. Drop GoogleService-Info.plist and google-services.json
// into the project root and the next prebuild picks them up.

import { existsSync } from 'node:fs';
import type { ExpoConfig } from 'expo/config';

const IOS_FIREBASE = './GoogleService-Info.plist';
const ANDROID_FIREBASE = './google-services.json';
const firebase = existsSync(IOS_FIREBASE) && existsSync(ANDROID_FIREBASE);

// Replace with your own reverse-domain identifier before the first build.
const BUNDLE_ID = 'com.yourdomain.tahan';

const plugins: NonNullable<ExpoConfig['plugins']> = [
  'expo-router',
  'expo-font',
  'expo-splash-screen',
  'expo-status-bar',
  // React Native Firebase needs static frameworks on iOS. Until Firebase is
  // wired in, the plugin runs with its defaults.
  ['expo-build-properties', firebase ? { ios: { useFrameworks: 'static' } } : {}],
];
if (firebase) {
  plugins.push('@react-native-firebase/app', '@react-native-firebase/auth');
}

export default (): ExpoConfig => ({
  name: 'Tahan',
  slug: 'tahan',
  scheme: 'tahan', // invitation links: tahan://invite/…
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    ...(firebase ? { googleServicesFile: IOS_FIREBASE } : {}),
  },
  android: {
    package: BUNDLE_ID,
    ...(firebase ? { googleServicesFile: ANDROID_FIREBASE } : {}),
  },
  plugins,
  experiments: {
    typedRoutes: true,
  },
});
