import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'care.nestai.app',
  appName: 'NestAI',
  webDir: 'dist',
  server: {
    url: 'https://www.nestai.care',
    cleartext: false,
  },
};

export default config;
