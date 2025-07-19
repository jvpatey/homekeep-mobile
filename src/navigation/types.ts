import { NavigatorScreenParams } from "@react-navigation/native";

// Root Stack Navigator Params
export type RootStackParamList = {
  App: NavigatorScreenParams<AppStackParamList>;
};

// App Stack Navigator Params
export type AppStackParamList = {
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
  // Add more screens here as your app grows
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList {}
  }
}
