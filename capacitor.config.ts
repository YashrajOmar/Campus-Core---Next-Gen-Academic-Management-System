import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campuscore.app',
  appName: 'CampusCore',
  webDir: 'public',
  server: {
    url: 'https://campus-core-theta.vercel.app',
    cleartext: true
  }
};

export default config;
