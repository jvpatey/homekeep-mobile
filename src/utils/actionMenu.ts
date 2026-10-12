import { ActionSheetIOS, Alert, Platform } from "react-native";
import type { Ionicons } from "@expo/vector-icons";

export interface ActionMenuOption {
  label: string;
  onPress: () => void;
  /** Shown in the Android sheet; iOS action sheets are text-only. */
  icon?: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
  destructive?: boolean;
}

export interface ActionMenuRequest {
  title?: string;
  message?: string;
  options: ActionMenuOption[];
  /** Called when the menu closes without a choice. */
  onCancel?: () => void;
}

type MenuListener = (request: ActionMenuRequest) => void;
let hostListener: MenuListener | null = null;

/** Registered by `ActionMenuHost`; Android alerts cap at three buttons. */
export function registerActionMenuHost(listener: MenuListener) {
  hostListener = listener;
  return () => {
    if (hostListener === listener) hostListener = null;
  };
}

/** Native action sheet on iOS; a bottom sheet with the same rows on Android. */
export function showActionMenu(request: ActionMenuRequest) {
  const { title, message, options, onCancel } = request;
  if (Platform.OS === "ios") {
    const destructiveIndex = options.findIndex((option) => option.destructive);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: [...options.map((option) => option.label), "Cancel"],
        cancelButtonIndex: options.length,
        destructiveButtonIndex:
          destructiveIndex >= 0 ? destructiveIndex : undefined,
      },
      (index) => {
        if (index < options.length) options[index].onPress();
        else onCancel?.();
      }
    );
    return;
  }

  if (hostListener) {
    hostListener(request);
    return;
  }

  Alert.alert(title ?? "", message, [
    ...options.slice(0, 2).map((option) => ({
      text: option.label,
      onPress: option.onPress,
      style: option.destructive
        ? ("destructive" as const)
        : ("default" as const),
    })),
    { text: "Cancel", style: "cancel" as const, onPress: onCancel },
  ], { onDismiss: onCancel });
}
