import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export const DOCUMENT_KINDS = [
  "insurance",
  "inspection",
  "closing",
  "permit",
  "warranty",
  "other",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  insurance: "Insurance",
  inspection: "Inspection",
  closing: "Closing & deed",
  permit: "Permit",
  warranty: "Warranty",
  other: "Other",
};

export const DOCUMENT_KIND_ICONS: Record<
  DocumentKind,
  ComponentProps<typeof Ionicons>["name"]
> = {
  insurance: "shield-checkmark",
  inspection: "search",
  closing: "key",
  permit: "clipboard",
  warranty: "ribbon",
  other: "document",
};

export interface HomeDocument {
  id: string;
  user_id: string;
  household_id: string | null;
  home_id: string | null;
  equipment_id: string | null;
  kind: DocumentKind;
  title: string;
  notes: string | null;
  storage_path: string | null;
  mime_type: string | null;
  issued_on: string | null;
  expires_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface HomeDocumentInput {
  kind: DocumentKind;
  title: string;
  notes?: string | null;
  equipment_id?: string | null;
  issued_on?: string | null;
  expires_on?: string | null;
}

export function isDocumentKind(value: unknown): value is DocumentKind {
  return (
    typeof value === "string" &&
    (DOCUMENT_KINDS as readonly string[]).includes(value)
  );
}
