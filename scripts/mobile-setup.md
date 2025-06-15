
# Mobile App Setup Instructions

Your Capacitor mobile app has been configured! Here's how to run it on a physical device or emulator:

## Prerequisites
- For iOS: Mac with Xcode installed
- For Android: Android Studio installed

## Setup Steps

1. **Export to Github and clone locally**
   - Click "Export to Github" button in Lovable
   - Git clone the project to your local machine
   - Run `npm install` to install dependencies

2. **Add mobile platforms**
   ```bash
   npx cap add ios      # For iOS
   npx cap add android  # For Android (or both)
   ```

3. **Build and sync**
   ```bash
   npm run build
   npx cap sync
   ```

4. **Run on device/emulator**
   ```bash
   npx cap run ios      # Opens Xcode
   npx cap run android  # Opens Android Studio
   ```

## Hot Reload Development
The app is configured to connect to your Lovable preview URL for hot reloading during development. This means you can make changes in Lovable and see them instantly on your mobile device!

## Production Build
When ready for production, remove the `server` configuration from `capacitor.config.ts` and the app will use the built files instead of the preview URL.

