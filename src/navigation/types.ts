import { NavigatorScreenParams } from "@react-navigation/native";

// Root Stack Navigator Params
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  EmailVerification: { url: string }; // Add email verification screen
};

// App Stack Navigator Params (for authenticated users)
export type AppStackParamList = {
  Home: undefined;
  // Add more authenticated screens here as app grows
};

// Auth Stack Navigator Params (for unauthenticated users)
export type AuthStackParamList = {
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
  EmailVerification: { url: string }; // Add to auth stack as well
  CodeVerification: { email: string }; // Add code verification screen
  EmailEntry: undefined; // Add email entry screen
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
