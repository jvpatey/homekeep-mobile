import { supabase } from "../lib/supabase";
import { getViewerHouseholdId } from "./householdScope";
import {
  HomeDocument,
  HomeDocumentInput,
  isDocumentKind,
} from "../types/homeDocument";
import { logServiceFailure } from "../utils/serviceError";
import {
  deleteStoredFile,
  sanitizeFileName,
  uploadFileFromUri,
} from "./storageFiles";

type Result<T> = { data: T | null; error: { message: string } | null };

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toRow(input: HomeDocumentInput) {
  return {
    kind: input.kind,
    title: input.title.trim(),
    notes: clean(input.notes),
    equipment_id: input.equipment_id ?? null,
    issued_on: input.issued_on ?? null,
    expires_on: input.expires_on ?? null,
  };
}

function normalize(row: Record<string, unknown>): HomeDocument {
  const doc = row as unknown as HomeDocument;
  return { ...doc, kind: isDocumentKind(doc.kind) ? doc.kind : "other" };
}

function isMissingTable(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    (/documents/i.test(error?.message ?? "") &&
      /does not exist|could not find/i.test(error?.message ?? ""))
  );
}

const MISSING_MESSAGE =
  "Documents aren't available yet. The app's database needs an update.";

/** Household document vault; files share the equipment bucket. */
export class DocumentService {
  static buildObjectPath(
    userId: string,
    documentId: string,
    fileName: string
  ): string {
    return `${userId}/documents/${documentId}/${sanitizeFileName(
      fileName,
      "document"
    )}`;
  }

  static async list(): Promise<Result<HomeDocument[]>> {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not signed in" } };

    const householdId = await getViewerHouseholdId();
    let query = supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    query = householdId
      ? query.eq("household_id", householdId)
      : query.eq("user_id", user.id);

    const { data, error } = await query;
    if (error) {
      if (isMissingTable(error)) return { data: [], error: null };
      logServiceFailure("Error listing documents:", error);
      return { data: null, error: { message: "Couldn't load your documents" } };
    }
    return { data: (data ?? []).map(normalize), error: null };
  }

  static async create(input: HomeDocumentInput): Promise<Result<HomeDocument>> {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not signed in" } };

    const householdId = await getViewerHouseholdId();
    const { data, error } = await supabase
      .from("documents")
      .insert({ ...toRow(input), user_id: user.id, household_id: householdId })
      .select("*")
      .single();
    if (error) {
      logServiceFailure("Error creating document:", error);
      return {
        data: null,
        error: {
          message: isMissingTable(error)
            ? MISSING_MESSAGE
            : "Couldn't save this document",
        },
      };
    }
    return { data: normalize(data), error: null };
  }

  static async update(
    id: string,
    input: Partial<HomeDocumentInput> & {
      storage_path?: string | null;
      mime_type?: string | null;
    }
  ): Promise<Result<HomeDocument>> {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const updates: Record<string, unknown> = {};
    if (input.kind !== undefined) updates.kind = input.kind;
    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.notes !== undefined) updates.notes = clean(input.notes);
    if (input.equipment_id !== undefined) {
      updates.equipment_id = input.equipment_id;
    }
    if (input.issued_on !== undefined) updates.issued_on = input.issued_on;
    if (input.expires_on !== undefined) updates.expires_on = input.expires_on;
    if (input.storage_path !== undefined) {
      updates.storage_path = input.storage_path;
    }
    if (input.mime_type !== undefined) updates.mime_type = input.mime_type;

    const { data, error } = await supabase
      .from("documents")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      logServiceFailure("Error updating document:", error);
      return { data: null, error: { message: "Couldn't save changes" } };
    }
    return { data: normalize(data), error: null };
  }

  /** Uploads under the current user's folder and links the file to the row. */
  static async attachFile(
    document: HomeDocument,
    localUri: string,
    mimeType: string,
    fileName: string
  ): Promise<Result<HomeDocument>> {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not signed in" } };

    const objectPath = this.buildObjectPath(user.id, document.id, fileName);
    const upload = await uploadFileFromUri(objectPath, localUri, mimeType);
    if (upload.error || !upload.path) {
      return {
        data: null,
        error: upload.error ?? { message: "Couldn't upload this file" },
      };
    }

    const result = await this.update(document.id, {
      storage_path: upload.path,
      mime_type: mimeType,
    });
    if (
      result.data &&
      document.storage_path &&
      document.storage_path !== upload.path
    ) {
      const { error } = await deleteStoredFile(document.storage_path);
      if (error) console.warn("Replaced document file not removed:", error);
    }
    return result;
  }

  static async remove(
    document: HomeDocument
  ): Promise<{ error: { message: string } | null }> {
    if (!supabase) return { error: { message: "Supabase not configured" } };
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", document.id);
    if (error) {
      logServiceFailure("Error deleting document:", error);
      return { error: { message: "Couldn't delete this document" } };
    }
    if (document.storage_path) {
      const { error: storageError } = await deleteStoredFile(
        document.storage_path
      );
      if (storageError) {
        console.warn("Document file not removed:", storageError);
      }
    }
    return { error: null };
  }
}
