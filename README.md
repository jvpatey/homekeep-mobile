# HomeKeep Mobile

A React Native app built with Expo for home management.

## Features

- 🏠 Home management interface
- 🔐 Authentication with Supabase
- 🌙 Dark/Light theme support
- 📱 Cross-platform (iOS/Android)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Supabase (Optional)**

   If you want to enable authentication:

   - Create a project at [supabase.com](https://supabase.com)
   - Get your Project URL and anon key from Settings > API
   - Create a `.env` file in the project root:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Run the app**
   ```bash
   npm start
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React contexts (Theme, Auth)
├── navigation/         # Navigation setup and types
├── screens/           # App screens
├── theme/             # Theme colors and styling
└── utils/             # Utility functions
```

## Authentication Flow

- **Without Supabase**: App works normally, auth screens show setup instructions
- **With Supabase**: Full authentication flow with persistent sessions
- **Navigation**: Home screen serves as welcome page, navigation to auth screens
- **Session persistence**: Users stay logged in between app restarts

## Technologies

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for routing
- **Supabase** for authentication
- **React Native Paper** for UI components
- **React Native Reanimated** for animations
