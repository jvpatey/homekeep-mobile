import { NavigatorScreenParams } from "@react-navigation/native";

/**
 * Root Stack Navigator Params
 * Defines the top-level navigation structure for the entire app.
 * Handles switching between authenticated and unauthenticated user flows.
 */
export type RootStackParamList = {
  Auth: undefined; // Authentication flow for unauthenticated users
  App: NavigatorScreenParams<AppStackParamList> | undefined; // Main app flow for authenticated users
  EmailVerification: { url: string }; // Email verification screen with URL parameter
};

/**
 * App Stack (authenticated). Tabs sit at the root; full-screen flows that
 * should cover the tab bar are pushed above them.
 */
export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabsParamList> | undefined;
  Settings: undefined;
  NotificationPreferences: undefined;
  /** Plan bundle flow (questionnaire + task picker). */
  MaintenancePlans: { planId?: string } | undefined;
};

export type AppTabsParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  RecordTab: NavigatorScreenParams<RecordStackParamList> | undefined;
  PlanTab: NavigatorScreenParams<PlanStackParamList> | undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
};

export type RecordStackParamList = {
  RecordHome: undefined;
  CompletionHistory: undefined;
  SpendLedger: { year?: number } | undefined;
  HomeSummaryPreview: undefined;
  Pros: undefined;
  ProDetail: { contactId: string };
  EquipmentList: undefined;
  EquipmentDetail: { equipmentId: string };
  PaintColors: undefined;
  HouseNotes: undefined;
  EmergencyInfo: undefined;
};

export type PlanStackParamList = {
  PlanHome: { segment?: "library" | "reminders" } | undefined;
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
  CodeVerification: {
    email: string;
    purpose?: "signup" | "recovery";
  };
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
