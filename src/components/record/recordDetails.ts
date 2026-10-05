import * as ImageManipulator from "expo-image-manipulator";
import { EquipmentManualService } from "../../services/EquipmentManualService";
import { parseMoneyInput } from "../../utils/formatMoney";

export type LaborType = "diy" | "hired";

export interface RecordDetailsValue {
  notes: string;
  /** Raw text from the cost field; parse with `parseCost`. */
  cost: string;
  labor: LaborType | null;
  contactId: string | null;
  /** Local file URI for a newly picked photo. */
  photoUri: string | null;
}

export const EMPTY_RECORD_DETAILS: RecordDetailsValue = {
  notes: "",
  cost: "",
  labor: null,
  contactId: null,
  photoUri: null,
};

export function parseCost(raw: string): number | null {
  return parseMoneyInput(raw);
}

export function hasRecordDetails(value: RecordDetailsValue): boolean {
  return Boolean(
    value.notes.trim() ||
      value.cost.trim() ||
      value.labor ||
      value.contactId ||
      value.photoUri
  );
}

const MAX_PHOTO_EDGE = 1600;

/** Downscale and JPEG-compress before upload; falls back to the original URI. */
export async function compressRecordPhoto(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_PHOTO_EDGE } }],
      { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    return uri;
  }
}

/**
 * Upload a completion/repair photo to `{userId}/completions/{key}.jpg`.
 * Returns the storage path, or null when the upload fails.
 */
export async function uploadRecordPhoto(
  userId: string,
  key: string,
  uri: string
): Promise<string | null> {
  const prepared = await compressRecordPhoto(uri);
  const path = `${userId}/completions/${key}.jpg`;
  const uploaded = await EquipmentManualService.uploadFromUriPublic(
    path,
    prepared,
    "image/jpeg"
  );
  return uploaded.path ?? null;
}

/** Shape accepted by completeInstance / logRepair. */
export function recordDetailsToExtras(
  value: RecordDetailsValue,
  photoStoragePath: string | null
) {
  return {
    notes: value.notes.trim() || undefined,
    cost_amount: parseCost(value.cost),
    labor_type: value.labor,
    contact_id: value.labor === "hired" ? value.contactId : null,
    photo_storage_path: photoStoragePath,
  };
}
