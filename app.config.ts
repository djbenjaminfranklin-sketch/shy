import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "SHY",
  slug: "shy",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  scheme: "shy",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "eu.shydating.app",
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "SHY utilise votre position pour vous montrer des personnes à proximité.",
      NSLocationAlwaysUsageDescription: "SHY utilise votre position pour vous montrer des personnes à proximité.",
      NSPhotoLibraryUsageDescription: "SHY a besoin d'accéder à vos photos pour votre profil.",
      NSCameraUsageDescription: "SHY a besoin d'accéder à votre caméra pour prendre des photos de profil et la vérification faciale.",
      NSFaceIDUsageDescription: "SHY utilise la reconnaissance faciale pour vérifier votre identité.",
      NSUserTrackingUsageDescription: "SHY utilise ces données pour améliorer votre expérience et vous proposer des profils pertinents.",
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    package: "eu.shydating.app",
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID
      }
    },
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000"
    },
    edgeToEdgeEnabled: true,
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.RECORD_AUDIO"
    ]
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro"
  },
  plugins: [
    "expo-router",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "SHY utilise votre position pour vous montrer des personnes à proximité."
      }
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "SHY a besoin d'accéder à vos photos pour votre profil.",
        cameraPermission: "SHY a besoin d'accéder à votre caméra pour prendre des photos de profil."
      }
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#FF00FF",
        sounds: []
      }
    ],
    "expo-localization"
  ],
  extra: {
    eas: {
      projectId: "e04ee6f5-149e-4de0-bf8c-92b062ddc44b"
    }
  },
  experiments: {
    typedRoutes: true
  }
});
