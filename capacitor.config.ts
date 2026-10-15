import type { CapacitorConfig } from '@capacitor/cli';

// GAM Church — MOBILE-ONLY native runtime.
// Fully bundled: web assets ship inside the binary (webDir 'out').
// No server.url — the app never loads remote web content.

const config: CapacitorConfig = {
  appId: 'com.gam.app',
  appName: 'GAM Church',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#f5f0e8',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#f5f0e8',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'ionic',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
