import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { EquipmentManualService } from "../../services/EquipmentManualService";

export type PhotoSource = "camera" | "library";

/** Local URI of the chosen photo, or null if cancelled or not permitted. */
export async function pickEmergencyPhoto(
  source: PhotoSource
): Promise<string | null> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera access is off",
        "Allow camera access in Settings to photograph your shutoffs.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => void Linking.openSettings() },
        ]
      );
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    return result.canceled ? null : (result.assets[0]?.uri ?? null);
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.7,
  });
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

/**
 * Uploads under the owner's emergency folder with a fresh file name, so
 * cached signed URLs never show the previous photo.
 */
export async function uploadEmergencyPhoto(
  userId: string,
  storageKey: string,
  localUri: string
): Promise<{ path: string | null; error: string | null }> {
  let uploadUri = localUri;
  try {
    const prepared = await ImageManipulator.manipulateAsync(localUri, [], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    uploadUri = prepared.uri;
  } catch {
    // Fall back to the picker URI if it can't be re-encoded.
  }
  const path = `${userId}/emergency/${storageKey}_${Date.now().toString(36)}.jpg`;
  const uploaded = await EquipmentManualService.uploadFromUriPublic(
    path,
    uploadUri,
    "image/jpeg"
  );
  return {
    path: uploaded.path,
    error: uploaded.path ? null : (uploaded.error?.message ?? "Upload failed"),
  };
}

/** Best-effort cleanup of a replaced or removed photo in the owner's folder. */
export function deleteEmergencyPhoto(userId: string, path: string | null) {
  if (!path || !path.startsWith(`${userId}/emergency/`)) return;
  void EquipmentManualService.deleteStorageObject(path);
}
