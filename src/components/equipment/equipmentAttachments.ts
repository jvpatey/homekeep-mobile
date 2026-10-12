import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { EquipmentManualService } from "../../services/EquipmentManualService";
import { EquipmentManual } from "../../types/equipmentManual";
import { showActionMenu } from "../../utils/actionMenu";

export type AttachmentKind = "manual" | "receipt";
/** Anything the picker can attach, including vault documents. */
export type PickerKind = AttachmentKind | "document";

export interface PickedFile {
  uri: string;
  mime: string;
  fileName: string;
}

const KIND_LABEL: Record<PickerKind, string> = {
  manual: "manual",
  receipt: "receipt",
  document: "document",
};

const PROMPT_TITLE: Record<PickerKind, string> = {
  manual: "Attach manual",
  receipt: "Attach receipt",
  document: "Attach document",
};

async function pickDocument(kind: PickerKind): Promise<PickedFile | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: ["application/pdf", "image/*"],
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      mime: asset.mimeType ?? "application/octet-stream",
      fileName: asset.name ?? kind,
    };
  } catch {
    Alert.alert("Couldn't open Files", "Please try again.");
    return null;
  }
}

async function pickImage(
  kind: PickerKind,
  source: "library" | "camera"
): Promise<PickedFile | null> {
  try {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        source === "camera"
          ? `Allow camera access to photograph a ${KIND_LABEL[kind]}.`
          : "Allow photo library access to attach images."
      );
      return null;
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.85,
          });
    if (result.canceled) return null;
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      mime: asset.mimeType ?? "image/jpeg",
      fileName: asset.fileName ?? `${kind}-${Date.now()}.jpg`,
    };
  } catch {
    Alert.alert(source === "camera" ? "Camera" : "Photos", "Please try again.");
    return null;
  }
}

/** Ask for a PDF or photo; resolves null when the user backs out. */
export function promptForAttachment(
  kind: PickerKind
): Promise<PickedFile | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (file: PickedFile | null) => {
      if (settled) return;
      settled = true;
      resolve(file);
    };
    showActionMenu({
      title: PROMPT_TITLE[kind],
      message: "PDF or photo",
      onCancel: () => finish(null),
      options: [
        {
          label: "Choose file",
          icon: "folder-outline",
          onPress: () => void pickDocument(kind).then(finish),
        },
        {
          label: "Photo library",
          icon: "images-outline",
          onPress: () => void pickImage(kind, "library").then(finish),
        },
        {
          label: "Take photo",
          icon: "camera-outline",
          onPress: () => void pickImage(kind, "camera").then(finish),
        },
      ],
    });
  });
}

/**
 * Upload a file, link it to the equipment, and remove any file it replaces.
 * Returns the updated row.
 */
export async function attachFile(
  equipment: Pick<
    EquipmentManual,
    "id" | "manual_storage_path" | "receipt_storage_path"
  >,
  kind: AttachmentKind,
  file: PickedFile
): Promise<EquipmentManual> {
  const upload =
    kind === "manual"
      ? EquipmentManualService.uploadManualFromUri
      : EquipmentManualService.uploadReceiptFromUri;
  const { path, error: uploadError } = await upload.call(
    EquipmentManualService,
    equipment.id,
    file.uri,
    file.mime,
    file.fileName
  );
  if (uploadError || !path) {
    throw new Error(uploadError?.message ?? "Upload failed.");
  }
  const { data, error } = await EquipmentManualService.updateEquipmentManual(
    equipment.id,
    kind === "manual"
      ? { manual_storage_path: path, manual_mime_type: file.mime }
      : { receipt_storage_path: path, receipt_mime_type: file.mime }
  );
  if (error || !data) throw new Error(error?.message ?? "Couldn't save.");

  const prior =
    kind === "manual"
      ? equipment.manual_storage_path
      : equipment.receipt_storage_path;
  if (prior && prior !== path) {
    void EquipmentManualService.deleteStorageObject(prior);
  }
  return data;
}

export async function removeFile(
  equipment: EquipmentManual,
  kind: AttachmentKind
): Promise<EquipmentManual> {
  const path =
    kind === "manual"
      ? equipment.manual_storage_path
      : equipment.receipt_storage_path;
  if (path) {
    const { error } = await EquipmentManualService.deleteStorageObject(path);
    if (error) throw error;
  }
  const { data, error } = await EquipmentManualService.updateEquipmentManual(
    equipment.id,
    kind === "manual"
      ? { manual_storage_path: null, manual_mime_type: null }
      : { receipt_storage_path: null, receipt_mime_type: null }
  );
  if (error || !data) throw new Error(error?.message ?? "Couldn't save.");
  return data;
}

export async function openStoredFile(
  path: string | null | undefined,
  kind: PickerKind
) {
  if (!path) return;
  const { data: url, error } =
    await EquipmentManualService.getManualSignedUrl(path);
  if (error || !url) {
    Alert.alert(
      `Couldn't open the ${KIND_LABEL[kind]}`,
      error?.message ?? "Try again."
    );
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}
