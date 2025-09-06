import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../navigation/types";

export interface AllTasksScreenProps {
  navigation: NativeStackNavigationProp<AppStackParamList, "AllTasks">;
}
