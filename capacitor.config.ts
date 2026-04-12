import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.israel.logme',
  appName: 'NestAI.care',
  webDir: 'dist',
  server: {
    url: 'https://www.nestai.care',
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
