# HomeKeep Mobile App

A React Native mobile application built with Expo and TypeScript, featuring Supabase authentication and a modern UI.

## Features

- 🔐 **Supabase Authentication** - Secure email/password authentication
- 🌙 **Dark/Light Theme** - Toggle between themes
- 📱 **Responsive Design** - Works on various screen sizes
- 🎨 **Modern UI** - Beautiful gradient components and animations
- ⚡ **TypeScript** - Full type safety

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd homekeep-mobile
```

2. Install dependencies:

```bash
npm install
```

3. Set up Supabase authentication:

   - Follow the instructions in `SUPABASE_SETUP.md`
   - Create a `.env` file with your Supabase credentials

4. Start the development server:

```bash
npm start
```

5. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your device

## Supabase Setup

This app uses Supabase for authentication. To get started:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the API settings
3. Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

4. Follow the detailed setup instructions in `SUPABASE_SETUP.md`

## Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React Context providers
├── navigation/         # Navigation configuration
├── screens/            # Screen components
│   └── auth/          # Authentication screens
├── services/           # API and external services
├── theme/              # Theme configuration
└── utils/              # Utility functions
```

## Authentication Flow

- **Unauthenticated users** see the welcome screen with options to sign up or sign in
- **Authenticated users** see a personalized welcome message and can sign out
- The app automatically handles authentication state changes
- User profiles are created automatically when signing up

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
