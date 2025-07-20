import { NavigatorScreenParams } from "@react-navigation/native";

/**
 * Root Stack Navigator Params
 * Defines the top-level navigation structure for the entire app.
 * Handles switching between authenticated and unauthenticated user flows.
 */
export type RootStackParamList = {
  Auth: undefined; // Authentication flow for unauthenticated users
  App: undefined; // Main app flow for authenticated users
  EmailVerification: { url: string }; // Email verification screen with URL parameter
};

/**
 * App Stack Navigator Params (for authenticated users)
 * Contains all screens that require user authentication.
 * This is the main navigation structure for the app's core functionality.
 */
export type AppStackParamList = {
  Home: undefined; // Main home screen for authenticated users
  // Add more authenticated screens here as app grows
};

/**
 * Auth Stack Navigator Params (for unauthenticated users)
 * Contains all screens related to user authentication and onboarding.
 * Handles the complete authentication flow from landing to verification.
 */
export type AuthStackParamList = {
  Home: undefined; // Landing page - first screen users see
  Login: undefined; // User login screen
  SignUp: undefined; // User registration screen
  EmailVerification: { url: string }; // Email verification with URL parameter
  CodeVerification: { email: string }; // Code verification with email parameter
  EmailEntry: undefined; // Email entry for password reset flow
};

/**
 * Global type declaration for React Navigation
 * Extends the root param list to provide type safety across the app
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
