
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a83723e20aa84d079ce0ae16f3969326',
  appName: 'notes-bubble-chat',
  webDir: 'dist',
  server: {
    url: 'https://a83723e2-0aa8-4d07-9ce0-ae16f3969326.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
