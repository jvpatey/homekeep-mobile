import { File as ExpoFile } from "expo-file-system";
import { supabase } from "../lib/supabase";
import {
  EquipmentManual,
  CreateEquipmentManualData,
  UpdateEquipmentManualData,
  EquipmentManualResponse,
  EquipmentManualsResponse,
  EquipmentManualSignedUrlResponse,
} from "../types/equipmentManual";

export const EQUIPMENT_MANUALS_BUCKET = "equipment-manuals";

function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() || "manual";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "manual";
}

async function readUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.arrayBuffer();
  } catch {
    const file = new ExpoFile(uri);
    return await file.arrayBuffer();
  }
}

export class EquipmentManualService {
  static buildManualObjectPath(
    userId: string,
    equipmentId: string,
    fileName: string
  ): string {
    const safe = sanitizeFileName(fileName);
    return `${userId}/${equipmentId}/${safe}`;
  }

  static buildReceiptObjectPath(
    userId: string,
    equipmentId: string,
    fileName: string
  ): string {
    const safe = sanitizeFileName(fileName);
    return `${userId}/${equipmentId}/receipts/${safe}`;
  }

  private static async uploadFromUri(
    objectPath: string,
    localUri: string,
    mimeType: string
  ): Promise<{ path: string | null; error: { message: string } | null }> {
    if (!supabase) {
      return { path: null, error: { message: "Supabase not configured" } };
    }

    try {
      const buffer = await readUriAsArrayBuffer(localUri);

      const { error: uploadError } = await supabase.storage
        .from(EQUIPMENT_MANUALS_BUCKET)
        .upload(objectPath, buffer, {
          contentType: mimeType || "application/octet-stream",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      return { path: objectPath, error: null };
    } catch (error) {
      console.error("Error uploading equipment file:", error);
      return {
        path: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown upload error",
        },
      };
    }
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

      const { data, error } = await supabase
        .from("equipment_manuals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { data: data ?? [], error: null };
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
      const row = {
        user_id: user.id,
        name: payload.name.trim(),
        model_number: payload.model_number?.trim() || null,
        purchase_date: payload.purchase_date ?? null,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from("equipment_manuals")
        .insert([row])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
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

      const { data, error } = await supabase
        .from("equipment_manuals")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
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

  static async deleteStorageObject(path: string): Promise<{ error: Error | null }> {
    if (!supabase) {
      return { error: new Error("Supabase not configured") };
    }

    const { error } = await supabase.storage
      .from(EQUIPMENT_MANUALS_BUCKET)
      .remove([path]);

    return { error: error ? new Error(error.message) : null };
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

  static async getManualSignedUrl(
    storagePath: string,
    expiresInSeconds = 3600
  ): Promise<EquipmentManualSignedUrlResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const { data, error } = await supabase.storage
        .from(EQUIPMENT_MANUALS_BUCKET)
        .createSignedUrl(storagePath, expiresInSeconds);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error("No signed URL returned");

      return { data: data.signedUrl, error: null };
    } catch (error) {
      console.error("Error creating signed URL:", error);
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
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      return { data: data ?? null, error: null };
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
        .eq("id", id)
        .eq("user_id", user.id);

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
