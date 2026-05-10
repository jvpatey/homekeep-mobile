# HomeKeep Mobile App

A React Native mobile application built with Expo and TypeScript, featuring Supabase authentication, comprehensive home maintenance task management, guided seasonal maintenance plans, optional equipment manual storage, home-address capture with optional autocomplete, and current weather on the dashboard—plus a modern UI for tracking and organizing household maintenance activities.

## 🚀 Features

### 🔐 Authentication & User Management

- **Supabase Authentication** - Secure email/password authentication
- **Google OAuth Integration** - Sign in with Google account
- **Email Verification** - Secure email verification flow
- **User Profile Management** - Customizable user profiles and preferences

### 📋 Task Management System

- **Create & Edit Tasks** - Add new maintenance tasks with detailed information
- **Task Categories** - Organize by type (HVAC, Plumbing, Electrical, Appliances, Exterior, Interior, Landscaping, Safety, General)
- **Priority System** - Set task importance (Low, Medium, High, Urgent)
- **Due Date Tracking** - Monitor upcoming, overdue, and completed tasks
- **Recurring Tasks** - Set up maintenance routines with custom intervals
- **Task Completion** - Mark tasks as complete with timestamps

### 🎯 Dashboard & Organization

- **Hero Carousel** - Featured tasks with swipe navigation
- **Timeline View** - Visual task scheduling and organization
- **Task Statistics** - Track completion rates, streaks, and maintenance history
- **Priority Filtering** - Filter tasks by priority level
- **Category Filtering** - Organize tasks by maintenance category
- **Date Range Filtering** - View tasks within specific time periods
- **Current Weather** - Local conditions on the dashboard when a home address is saved (Open-Meteo; no extra API key)
- **Home Address** - Store and edit your address from Settings; used for weather and location context
- **Equipment Manuals** - Open the manuals library from the dashboard to list PDFs and attach new ones

### 🧭 Guided Maintenance Plans

Seasonal and starter **maintenance plans** walk through short questionnaires (where applicable), let you pick which suggested routines to add, and batch-apply them to your task list:

- **Spring refresh** — Lawn, exterior, and HVAC tasks tailored to your home
- **Cold-weather prep** — Fall exterior, freeze protection, and heating-specific items
- **Year-round safety** — Smoke/CO, electrical, dryer vent, HVAC clearance, and related checks (pick what applies)
- **Pool & spa care** — Water testing, filtration, and seasonal routines based on what you own
- **New homeowner starter** — First-owner chores filtered by equipment (HRV/ERV, softener, septic, etc.)

Access plans from **Settings → Maintenance plans**.

### 🎨 Modern UI/UX

- **Gradient Components** - Beautiful gradient backgrounds and buttons
- **Haptic Feedback** - Tactile responses for better user experience
- **Smooth Animations** - React Native Reanimated for fluid interactions
- **Responsive Design** - Works on various screen sizes and orientations
- **Dark/Light Theme Support** - Dynamic theming system
- **Custom Gradients** - User-selectable gradient themes

### 📱 Advanced Features

- **Push Notifications** - Reminders for due tasks and maintenance alerts
- **Notification Preferences** - Customizable notification settings by category
- **Completion History** - Detailed history of completed maintenance tasks
- **Avatar Customization** - Personalized user avatars
- **Streak Tracking** - Monitor consecutive task completion streaks
- **Motivational Messages** - Encouraging messages based on progress
- **Address Autocomplete (optional)** - Mapbox-powered suggestions when entering your home address; geocoding and weather use Open-Meteo and do not require separate keys

## 🛠 Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript for type safety
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Authentication**: Supabase Auth with Google OAuth
- **UI Components**: React Native Paper, Custom components
- **Animations**: React Native Reanimated
- **Navigation**: React Navigation v7
- **State Management**: React Context API
- **Date Handling**: date-fns
- **Icons**: Expo Vector Icons
- **Gradients**: Expo Linear Gradient
- **Haptics**: Expo Haptics
- **Address search (optional)**: Mapbox Search Box API via public token
- **Geocoding & weather**: Open-Meteo (no API key)

## 📁 Project Structure

```
src/
├── data/
│   └── maintenancePlans/          # Guided plan definitions & questionnaires
├── components/                    # Reusable UI components
│   ├── auth/                     # Authentication components
│   │   ├── OAuthButtons.tsx      # Google OAuth sign-in
│   │   └── styles.ts             # Auth component styles
│   ├── dashboard/                # Main dashboard components
│   │   ├── Dashboard.tsx         # Main dashboard container
│   │   ├── DashboardHeader.tsx   # Dashboard header with stats
│   │   ├── HeroCarousel.tsx      # Featured tasks carousel
│   │   ├── FloatingActionButton.tsx # FAB for creating tasks
│   │   ├── tasks/                # Task-related components
│   │   │   ├── TaskCard.tsx      # Individual task cards
│   │   │   └── PriorityBadge.tsx # Priority indicators
│   │   ├── timeline-view/        # Timeline visualization
│   │   ├── profile/              # User profile components
│   │   │   ├── ProfileButton.tsx # Profile button
│   │   │   └── ProfileMenu.tsx   # Profile menu modal
│   │   ├── popups/               # Notification popups
│   │   │   ├── CompletionCelebration.tsx
│   │   │   ├── DueSoonPopup.tsx
│   │   │   └── StreakPopup.tsx
│   │   └── modals/               # Modal components
│   │       ├── create-task-modal/ # Task creation modal
│   │       │   ├── CreateTaskModal.tsx
│   │       │   ├── CategorySelector.tsx
│   │       │   ├── PrioritySelector.tsx
│   │       │   ├── IntervalSelector.tsx
│   │       │   ├── StartDateSelector.tsx
│   │       │   └── styles.ts
│   │       └── simple-task-detail-modal/ # Task detail modal
│   │           ├── SimpleTaskDetailModal.tsx
│   │           └── styles.ts
│   ├── onboarding/               # Onboarding components
│   │   ├── FeaturesSection.tsx   # App features showcase
│   │   ├── LogoSection.tsx       # Logo and branding
│   │   └── WelcomeText.tsx       # Welcome messaging
│   ├── ui/                       # Reusable UI components
│   │   ├── action-buttons/       # Action button components
│   │   ├── gradient-divider/     # UI dividers
│   │   ├── gradient-picker/      # Color picker components
│   │   └── NotificationPermissionRequest.tsx
│   └── modals/                   # Global modals
│       ├── avatar-customization-modal/ # Avatar customization
│       ├── equipment-manuals-modal/    # PDF equipment manuals (list / add / open)
│       └── home-address-onboarding/    # Home address form & Mapbox autocomplete
├── context/                      # React Context providers
│   ├── AuthContext.tsx           # Authentication state
│   ├── TasksContext.tsx          # Task management state
│   ├── ThemeContext.tsx          # Theme management
│   ├── UserPreferencesContext.tsx # User preferences
│   └── NotificationContext.tsx   # Notification state
├── hooks/                        # Custom React hooks
│   ├── useAnimations.ts          # Animation utilities
│   ├── useDynamicSpacing.ts      # Responsive spacing
│   ├── useGradients.ts           # Gradient management
│   ├── useHaptics.ts             # Haptic feedback
│   └── useTasks.ts               # Task management logic
├── navigation/                   # Navigation configuration
│   ├── AppNavigator.tsx          # Main app navigation
│   ├── AuthNavigator.tsx         # Authentication flow
│   └── RootNavigator.tsx         # Root navigation setup
├── screens/                      # Screen components
│   ├── settings/                 # Settings (profile, address, maintenance plans link)
│   ├── maintenance-plans/      # Guided maintenance plans & questionnaires
│   ├── all-tasks/                # Full task list view
│   ├── auth/                     # Authentication screens
│   │   ├── LoginScreen.tsx       # Login screen
│   │   ├── SignUpScreen.tsx      # Sign up screen
│   │   ├── EmailVerificationScreen.tsx
│   │   ├── CodeVerificationScreen.tsx
│   │   └── EmailEntryScreen.tsx
│   ├── DashboardScreen.tsx       # Main dashboard screen
│   ├── HomeScreen.tsx            # Welcome/home screen
│   ├── completion-history/       # Task completion history
│   │   └── CompletionHistoryScreen.tsx
│   └── notification-preferences/ # Notification settings
│       └── NotificationPreferencesScreen.tsx
├── services/                     # API and external services
│   ├── MaintenanceService.ts     # Main service orchestrator
│   ├── MaintenanceRoutineService.ts # Routine management
│   ├── MaintenanceInstanceService.ts # Instance management
│   ├── MaintenanceTaskService.ts # Task queries
│   ├── MaintenanceStatsService.ts # Statistics and analytics
│   ├── EquipmentManualService.ts # Equipment PDF manuals (Supabase storage)
│   ├── MapboxSearchService.ts    # Optional address autocomplete
│   ├── GeocodingService.ts       # Open-Meteo geocoding for lat/lng
│   ├── WeatherService.ts         # Open-Meteo current weather for dashboard
│   ├── maintenanceDataMapper.ts  # Data transformation
│   └── index.ts                  # Service exports
├── theme/                        # Theme configuration
│   ├── colors.ts                 # Color definitions
│   └── designSystem.ts           # Design system tokens
└── types/                        # TypeScript type definitions
    ├── maintenance.ts            # Maintenance-related types
    ├── equipmentManual.ts        # Equipment manual records
    └── navigation.ts             # Navigation types
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Clone the repository:**

```bash
git clone <your-repo-url>
cd homekeep-mobile
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up Supabase:**

   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from the API settings
   - Create a `.env` file with your Supabase credentials
   - For equipment manuals, create a Supabase Storage bucket named **`equipment-manuals`** (see `EQUIPMENT_MANUALS_BUCKET` in `EquipmentManualService`) with policies that let authenticated users manage their own objects, and create an **`equipment_manuals`** table aligned with the app types (`types/equipmentManual.ts`) and service queries

4. **Start the development server:**

```bash
npm start
```

5. **Run on your preferred platform:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your device

## 🔧 Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: enables address autocomplete in the home address onboarding sheet.
# Sign up at https://account.mapbox.com/ — public token starts with `pk.`
# Free tier covers ~50k Search Box sessions/month.
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token_here
```

## 📊 Database Schema

The app uses Supabase with the following main tables:

- **maintenance_routines** - Recurring maintenance tasks
- **routine_instances** - Individual task instances
- **user_preferences** - User settings and preferences
- **notification_settings** - Notification preferences by category
- **equipment_manuals** - Metadata for uploaded equipment manual PDFs (files live in Supabase Storage)

## 🎯 Key Features in Detail

### Task Management

- **Create Tasks**: Add new maintenance tasks with categories, priorities, estimated duration, and due dates
- **Task Categories**: HVAC, Plumbing, Electrical, Appliances, Exterior, Interior, Landscaping, Safety, General
- **Priority Levels**: Low, Medium, High, Urgent with color-coded indicators
- **Recurring Tasks**: Set up maintenance routines with custom intervals (daily, weekly, monthly, quarterly, yearly)
- **Task Completion**: Mark tasks as complete with timestamps and completion history

### Dashboard Features

- **Hero Carousel**: Swipeable carousel of upcoming tasks with pagination
- **Statistics**: Active routines, total instances, completion rates, overdue tasks
- **Timeline View**: Visual representation of task scheduling
- **Quick Actions**: Floating action button for creating new tasks
- **Profile Management**: User profile with avatar customization
- **Weather & library**: Current weather for your saved address; equipment manuals shortcut in the header

### Notifications

- **Due Soon Reminders**: Notifications for tasks due soon
- **Overdue Alerts**: Reminders for overdue tasks
- **Daily Digest**: Summary of daily tasks
- **Weekly Summary**: Weekly maintenance overview
- **Category-based Settings**: Customize notifications by maintenance category

### Home address, weather, and manuals

- **Home address**: Set or update under **Settings → Home Address**. With `EXPO_PUBLIC_MAPBOX_TOKEN` set, the form can suggest addresses as you type; coordinates for weather come from Open-Meteo geocoding when city/country are available.
- **Weather**: The dashboard shows current conditions for your saved location (temperature unit follows country conventions when possible).
- **Equipment manuals**: From the dashboard header, open **Equipment manuals** to upload PDFs to Supabase Storage, rename entries, and open files in the in-app viewer.

### Guided maintenance plans

Open **Settings → Maintenance plans** to browse plans. Plans that include a questionnaire filter the suggested tasks; you then choose which items to add before they are applied as routines in your task list.

## 📱 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run build:ios` - Build iOS app for production
- `npm run submit:ios` - Submit iOS app to App Store

## 🧪 Development

### Testing with Expo Go

- Install Expo Go app on your device
- Scan QR code from development server
- Test app functionality in real-time
- Perfect for demos and quick testing

### TypeScript

- Full TypeScript implementation for type safety
- Comprehensive type definitions for all components
- Service layer with proper error handling and response types

### Code Quality

- Consistent code formatting and structure
- Separated concerns (components, services, types)
- Reusable components and hooks
- Proper error handling throughout the app
