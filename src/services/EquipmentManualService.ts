import { supabase } from "../lib/supabase";
import { getViewerHouseholdId } from "./householdScope";
import {
  HOME_FILES_BUCKET,
  createSignedFileUrl,
  createSignedFileUrls,
  deleteStoredFile,
  sanitizeFileName,
  uploadFileFromUri,
} from "./storageFiles";
import {
  EquipmentManual,
  CreateEquipmentManualData,
  UpdateEquipmentManualData,
  EquipmentManualResponse,
  EquipmentManualsResponse,
  EquipmentManualSignedUrlResponse,
  parseConsumables,
  LEGACY_EQUIPMENT_TYPES,
} from "../types/equipmentManual";

type PgError = { code?: string; message?: string } | null;

/** Columns added by the equipment-details migration. */
const DETAIL_COLUMNS = ["manufacturer", "serial_number", "consumables"] as const;

function isMissingDetailColumn(error: PgError) {
  const message = error?.message ?? "";
  return (
    DETAIL_COLUMNS.some((column) => message.includes(column)) &&
    /column|schema|could not find/i.test(message)
  );
}

function isTypeCheckViolation(error: PgError) {
  return error?.code === "23514" && /equipment_type/i.test(error?.message ?? "");
}

/**
 * Before the migration, drop the new columns and fold the new types into
 * "other" so saves still succeed.
 */
function legacyRow(row: Record<string, unknown>): Record<string, unknown> {
  const next = { ...row };
  for (const column of DETAIL_COLUMNS) delete next[column];
  const type = next.equipment_type as string | null | undefined;
  if (type && !(LEGACY_EQUIPMENT_TYPES as readonly string[]).includes(type)) {
    next.equipment_type = "other";
  }
  return next;
}

function normalizeEquipment<T extends Record<string, unknown> | null>(row: T): T {
  if (!row) return row;
  return { ...row, consumables: parseConsumables(row.consumables) };
}

export const EQUIPMENT_MANUALS_BUCKET = HOME_FILES_BUCKET;

export class EquipmentManualService {
  static buildManualObjectPath(
    userId: string,
    equipmentId: string,
    fileName: string
  ): string {
    const safe = sanitizeFileName(fileName, "manual");
    return `${userId}/${equipmentId}/${safe}`;
  }

  static buildReceiptObjectPath(
    userId: string,
    equipmentId: string,
    fileName: string
  ): string {
    const safe = sanitizeFileName(fileName, "manual");
    return `${userId}/${equipmentId}/receipts/${safe}`;
  }

  private static uploadFromUri(
    objectPath: string,
    localUri: string,
    mimeType: string
  ): Promise<{ path: string | null; error: { message: string } | null }> {
    return uploadFileFromUri(objectPath, localUri, mimeType);
  }

  static uploadFromUriPublic(
    objectPath: string,
    localUri: string,
    mimeType: string
  ) {
    return this.uploadFromUri(objectPath, localUri, mimeType);
  }

  static async listEquipmentManuals(): Promise<EquipmentManualsResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const householdId = await getViewerHouseholdId();
      let query = supabase
        .from("equipment_manuals")
        .select("*")
        .order("created_at", { ascending: false });
      if (householdId) {
        query = query.eq("household_id", householdId);
      } else {
        query = query.eq("user_id", user.id);
      }
      const { data, error } = await query;

      if (error) throw error;

      return {
        data: (data ?? []).map((row) => normalizeEquipment(row)),
        error: null,
      };
    } catch (error) {
      console.error("Error listing equipment manuals:", error);
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: String(error),
        },
      };
    }
  }

  static async createEquipmentManual(
    payload: CreateEquipmentManualData
  ): Promise<EquipmentManualResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const now = new Date().toISOString();
      const householdId = await getViewerHouseholdId();
      const row: Record<string, unknown> = {
        user_id: user.id,
        household_id: householdId,
        name: payload.name.trim(),
        model_number: payload.model_number?.trim() || null,
        purchase_date: payload.purchase_date ?? null,
        warranty_expires_on: payload.warranty_expires_on ?? null,
        equipment_type: payload.equipment_type ?? null,
        created_at: now,
        updated_at: now,
      };
      if (payload.manufacturer !== undefined) {
        row.manufacturer = payload.manufacturer?.trim() || null;
      }
      if (payload.serial_number !== undefined) {
        row.serial_number = payload.serial_number?.trim() || null;
      }
      if (payload.consumables !== undefined) {
        row.consumables = payload.consumables;
      }

      const client = supabase;
      const insert = (values: Record<string, unknown>) =>
        client.from("equipment_manuals").insert([values]).select().single();

      let { data, error } = await insert(row);
      if (error && (isMissingDetailColumn(error) || isTypeCheckViolation(error))) {
        ({ data, error } = await insert(legacyRow(row)));
      }

      if (error) throw error;

      return { data: normalizeEquipment(data), error: null };
    } catch (error) {
      console.error("Error creating equipment manual:", error);
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: String(error),
        },
      };
    }
  }

  static async updateEquipmentManual(
    id: string,
    payload: UpdateEquipmentManualData
  ): Promise<EquipmentManualResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.name !== undefined) {
        updates.name = payload.name.trim();
      }
      if (payload.model_number !== undefined) {
        updates.model_number = payload.model_number?.trim() || null;
      }
      if (payload.purchase_date !== undefined) {
        updates.purchase_date = payload.purchase_date;
      }
      if (payload.warranty_expires_on !== undefined) {
        updates.warranty_expires_on = payload.warranty_expires_on;
      }
      if (payload.equipment_type !== undefined) {
        updates.equipment_type = payload.equipment_type;
      }
      if (payload.manual_storage_path !== undefined) {
        updates.manual_storage_path = payload.manual_storage_path;
      }
      if (payload.manual_mime_type !== undefined) {
        updates.manual_mime_type = payload.manual_mime_type;
      }
      if (payload.receipt_storage_path !== undefined) {
        updates.receipt_storage_path = payload.receipt_storage_path;
      }
      if (payload.receipt_mime_type !== undefined) {
        updates.receipt_mime_type = payload.receipt_mime_type;
      }
      if (payload.manufacturer !== undefined) {
        updates.manufacturer = payload.manufacturer?.trim() || null;
      }
      if (payload.serial_number !== undefined) {
        updates.serial_number = payload.serial_number?.trim() || null;
      }
      if (payload.consumables !== undefined) {
        updates.consumables = payload.consumables;
      }

      const client = supabase;
      const update = (values: Record<string, unknown>) =>
        client
          .from("equipment_manuals")
          .update(values)
          .eq("id", id)
          .select()
          .single();

      let { data, error } = await update(updates);
      if (error && (isMissingDetailColumn(error) || isTypeCheckViolation(error))) {
        ({ data, error } = await update(legacyRow(updates)));
      }

      if (error) throw error;

      return { data: normalizeEquipment(data), error: null };
    } catch (error) {
      console.error("Error updating equipment manual:", error);
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: String(error),
        },
      };
    }
  }

  static deleteStorageObject(path: string): Promise<{ error: Error | null }> {
    return deleteStoredFile(path);
  }

  static async uploadManualFromUri(
    equipmentId: string,
    localUri: string,
    mimeType: string,
    suggestedFileName: string
  ): Promise<{ path: string | null; error: { message: string } | null }> {
    if (!supabase) {
      return { path: null, error: { message: "Supabase not configured" } };
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const objectPath = this.buildManualObjectPath(
        user.id,
        equipmentId,
        suggestedFileName
      );

      return this.uploadFromUri(objectPath, localUri, mimeType);
    } catch (error) {
      console.error("Error uploading manual:", error);
      return {
        path: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown upload error",
        },
      };
    }
  }

  static async uploadReceiptFromUri(
    equipmentId: string,
    localUri: string,
    mimeType: string,
    suggestedFileName: string
  ): Promise<{ path: string | null; error: { message: string } | null }> {
    if (!supabase) {
      return { path: null, error: { message: "Supabase not configured" } };
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const objectPath = this.buildReceiptObjectPath(
        user.id,
        equipmentId,
        suggestedFileName
      );

      return this.uploadFromUri(objectPath, localUri, mimeType);
    } catch (error) {
      console.error("Error uploading receipt:", error);
      return {
        path: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown upload error",
        },
      };
    }
  }

  static getManualSignedUrl(
    storagePath: string,
    expiresInSeconds = 3600
  ): Promise<EquipmentManualSignedUrlResponse> {
    return createSignedFileUrl(storagePath, expiresInSeconds);
  }

  /** Batch-sign storage paths. Missing or failed paths are omitted from the map. */
  static createSignedUrls(
    storagePaths: string[],
    expiresInSeconds = 3600
  ): Promise<Map<string, string>> {
    return createSignedFileUrls(storagePaths, expiresInSeconds);
  }

  static async getEquipmentManualById(
    id: string
  ): Promise<EquipmentManualResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("equipment_manuals")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      return { data: normalizeEquipment(data ?? null), error: null };
    } catch (error) {
      console.error("Error fetching equipment manual:", error);
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: String(error),
        },
      };
    }
  }

  static async deleteEquipmentManual(id: string): Promise<{
    error: { message: string } | null;
  }> {
    if (!supabase) {
      return { error: { message: "Supabase not configured" } };
    }

    try {
      const { data: row, error: fetchError } =
        await this.getEquipmentManualById(id);

      if (fetchError) throw new Error(fetchError.message);
      if (!row) throw new Error("Equipment manual not found");

      if (row.manual_storage_path) {
        const { error: storageErr } = await this.deleteStorageObject(
          row.manual_storage_path
        );
        if (storageErr) {
          console.warn("Storage delete warning:", storageErr);
        }
      }

      if (row.receipt_storage_path) {
        const { error: storageErr } = await this.deleteStorageObject(
          row.receipt_storage_path
        );
        if (storageErr) {
          console.warn("Receipt storage delete warning:", storageErr);
        }
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("equipment_manuals")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Error deleting equipment manual:", error);
      return {
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      };
    }
  }
}
