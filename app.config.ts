// Expo config.
//
// Firebase is wired in only once both of its config files are present, so the
// app builds and runs — in Expo Go or a dev build — before Firebase is set up,
// signing in with the preview backend. Drop GoogleService-Info.plist and
// google-services.json into the project root (SETUP.md, "Firebase") and the
// next build signs in for real.

import { existsSync } from 'node:fs';
import type { ExpoConfig } from 'expo/config';

const IOS_FIREBASE = './GoogleService-Info.plist';
const ANDROID_FIREBASE = './google-services.json';
const firebase = existsSync(IOS_FIREBASE) && existsSync(ANDROID_FIREBASE);

// Registered with Firebase and, later, the stores. Don't change it.
const BUNDLE_ID = 'com.rich0024.tahan';

const plugins: NonNullable<ExpoConfig['plugins']> = ['expo-router'];
if (firebase) {
  plugins.push(
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    // React Native Firebase needs static frameworks on iOS.
    ['expo-build-properties', { ios: { useFrameworks: 'static' } }],
  );
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
  // Read by src/auth/SessionProvider.tsx: without Firebase the app signs in
  // with the on-phone preview backend instead.
  extra: { firebase },
  experiments: {
    typedRoutes: true,
  },
});
