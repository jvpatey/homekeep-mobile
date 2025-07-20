import { NavigatorScreenParams } from "@react-navigation/native";

// Root Stack Navigator Params
export type RootStackParamList = {
  App: NavigatorScreenParams<AppStackParamList>;
  Auth: NavigatorScreenParams<AuthStackParamList>;
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
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
