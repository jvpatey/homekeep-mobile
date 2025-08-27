# HomeKeep Mobile App

A React Native mobile application built with Expo and TypeScript, featuring Supabase authentication, task management, and a modern UI designed for home maintenance tracking.

## Features

- 🔐 **Supabase Authentication** - Secure email/password authentication with OAuth support
- 📋 **Task Management** - Create, track, and manage home maintenance tasks
- 🎯 **Priority System** - Set task priorities and due dates
- 📅 **Timeline View** - Visual task scheduling and organization
- 🎨 **Modern UI** - Beautiful gradient components, animations, and haptic feedback
- 🌙 **Theme Support** - Dynamic theming and user preferences
- ⚡ **TypeScript** - Full type safety and better development experience
- 📱 **Responsive Design** - Works on various screen sizes and orientations

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

   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from the API settings
   - Create a `.env` file with your Supabase credentials

4. Start the development server:

```bash
npm start
```

5. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your device

## Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ActionButtons/  # Action button components
│   ├── AvatarCustomizationModal/ # Avatar customization
│   ├── Dashboard/      # Dashboard and task management
│   ├── FeaturesSection/ # App features showcase
│   ├── GradientDivider/ # UI dividers
│   ├── GradientPicker/ # Color picker components
│   ├── LogoSection/    # Logo and branding
│   ├── OAuthButtons/   # OAuth authentication
│   └── WelcomeText/    # Welcome messaging
├── context/            # React Context providers
│   ├── AuthContext.tsx # Authentication state
│   ├── TasksContext.tsx # Task management state
│   ├── ThemeContext.tsx # Theme management
│   └── UserPreferencesContext.tsx # User preferences
├── hooks/              # Custom React hooks
├── navigation/         # Navigation configuration
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── DashboardScreen.tsx # Main dashboard
│   ├── HomeScreen.tsx # Welcome screen
│   └── CompletionHistoryScreen.tsx # Task history
├── services/           # API and external services
├── theme/              # Theme configuration
└── types/              # TypeScript type definitions
```

## Task Management Features

- **Create Tasks** - Add new maintenance tasks with categories, priorities, and due dates
- **Task Categories** - Organize tasks by type (HVAC, Plumbing, Electrical, etc.)
- **Priority Levels** - Set task importance and urgency
- **Due Date Tracking** - Monitor upcoming and overdue tasks
- **Completion History** - Track completed tasks and maintenance history
- **Timeline View** - Visual task scheduling and organization

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run build:ios` - Build iOS app for production
- `npm run submit:ios` - Submit iOS app to App Store

## Development

### Testing with Expo Go

- Install Expo Go app on your device
- Scan QR code from development server
- Test app functionality in real-time
- Perfect for demos and quick testing

### Building for Production

- Use `npm run build:ios` to create production build
- App will be built in Expo's cloud service
- Handles code signing and iOS requirements automatically

## Deployment

### Prerequisites for App Store

- Apple Developer Account ($99/year)
- App Store Connect access
- Proper app icons and splash screens

### Deployment Steps

1. **Build**: `npm run build:ios`
2. **Submit**: `npm run submit:ios`
3. **Review**: Wait for Apple's review (1-3 days)
4. **Live**: App appears on App Store

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
