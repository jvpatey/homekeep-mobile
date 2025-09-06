import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../navigation/types";

export interface SettingsScreenProps {
  navigation: NativeStackNavigationProp<AppStackParamList, "Settings">;
}
