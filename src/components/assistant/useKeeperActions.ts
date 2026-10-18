import { useCallback, useRef } from "react";
import type { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { addDays, format } from "date-fns";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { useProfile } from "../../context/ProfileContext";
import { useTasks } from "../../context/TasksContext";
import { useCurrency } from "../../hooks/useCurrency";
import { AssistantAction } from "../../services/AiService";
import { MaintenanceInstanceService } from "../../services/MaintenanceInstanceService";
import { EquipmentManualService } from "../../services/EquipmentManualService";
import { HomeContactService } from "../../services/HomeContactService";
import { DocumentService } from "../../services/DocumentService";
import { EquipmentRecallService } from "../../services/EquipmentRecallService";
import {
  upsertEquipmentInIndex,
  useEquipmentIndex,
} from "../../hooks/useEquipmentIndex";
import { upsertHomeContact } from "../../hooks/useHomeContacts";
import { upsertHomeDocument } from "../../hooks/useHomeDocuments";
import { refreshEquipmentRecalls } from "../../hooks/useEquipmentRecalls";
import { refreshRecordData } from "../../hooks/useRecordData";
import { DOCUMENT_KIND_LABELS } from "../../types/homeDocument";
import { buildRoutinePayloadsFromItems } from "../../data/maintenancePlans";
import { formatRoutineInterval } from "../all-reminders/groupRoutines";
import {
  EquipmentConsumable,
  equipmentTypeIcon,
} from "../../types/equipmentManual";
import { PAINT_FINISH_LABELS } from "../../types/homeNotes";
import { CONTACT_TRADE_META } from "../../types/homeContact";
import {
  HomeEmergencyFacts,
  MAX_CUSTOM_EMERGENCY_SPOTS,
  createCustomEmergencySpot,
} from "../../types/homeEmergency";
import { AppTabsParamList, RecordStackParamList } from "../../navigation/types";

export interface KeeperActionView {
  icon: keyof typeof Ionicons.glyphMap;
  /** Short label for what tapping does, e.g. "Add pro". */
  kind: string;
  title: string;
  detail: string | null;
  swatch?: string | null;
}

export interface KeeperActionResult {
  error: string | null;
  /** Opens the saved item; set once the action succeeds. */
  view?: () => void;
}

const SPOT_LABELS = {
  waterShutoff: "Main water shutoff",
  waterHeater: "Water heater",
  breakerPanel: "Breaker panel",
  gasShutoff: "Gas shutoff",
} as const;

function noonInDays(days: number): Date {
  const date = addDays(new Date(), days);
  date.setHours(12, 0, 0, 0);
  return date;
}

function relativeDay(days: number, past: boolean): string {
  if (days === 0) return "today";
  if (days === 1) return past ? "yesterday" : "tomorrow";
  return format(noonInDays(past ? -days : days), "EEE, MMM d");
}

function join(parts: (string | null | undefined | false)[]): string | null {
  const text = parts.filter(Boolean).join(" · ");
  return text || null;
}

function toConsumables(
  parts: { label: string; size: string | null; part_number: string | null }[],
): EquipmentConsumable[] {
  return parts.map((part) => ({
    id: Crypto.randomUUID(),
    label: part.label,
    size: part.size,
    partNumber: part.part_number,
  }));
}

/**
 * Turns Keeper's suggested actions into button copy and saves them through the
 * same services the regular forms use, refreshing whichever screen shows them.
 */
export function useKeeperActions({
  equipmentId,
  onLeave,
}: {
  /** Equipment the conversation is scoped to; new tasks attach to it. */
  equipmentId: string | null;
  /** Called before navigating away to a saved item. */
  onLeave: () => void;
}) {
  const navigation = useNavigation<NavigationProp<AppTabsParamList>>();
  const { profile, homeNotes, updateHomeNotes, updateHomeEmergency } =
    useProfile();
  const { createTask, refreshTasks } = useTasks();
  const { format: formatMoney } = useCurrency();
  const equipment = useEquipmentIndex({ refreshOnFocus: false });

  // Taps can land before the context re-renders, so chained edits to the
  // profile JSON read from these refs rather than a stale closure.
  const notesRef = useRef(homeNotes);
  notesRef.current = homeNotes;
  const emergencyRef = useRef<HomeEmergencyFacts>(
    profile?.home_emergency ?? {},
  );
  emergencyRef.current = profile?.home_emergency ?? emergencyRef.current;

  const open = useCallback(
    <S extends keyof RecordStackParamList>(
      screen: S,
      params?: RecordStackParamList[S],
    ) =>
      () => {
        onLeave();
        navigation.navigate("RecordTab", { screen, params } as never);
      },
    [navigation, onLeave],
  );

  const equipmentName = useCallback(
    (id: string) => equipment.items.find((item) => item.id === id)?.name,
    [equipment.items],
  );

  const describe = useCallback(
    (action: AssistantAction): KeeperActionView => {
      switch (action.type) {
        case "create_routine":
          return {
            icon: "repeat",
            kind: "Add reminder",
            title: action.title,
            detail: formatRoutineInterval(action.interval_days),
          };
        case "create_task":
          return {
            icon: "calendar-outline",
            kind: "Add task",
            title: action.title,
            detail: `Due ${relativeDay(action.due_in_days, false)}`,
          };
        case "log_repair":
          return {
            icon: "hammer-outline",
            kind: "Log repair",
            title: action.title,
            detail: join([
              `Done ${relativeDay(action.days_ago, true)}`,
              action.cost != null && formatMoney(action.cost),
              action.labor === "diy"
                ? "DIY"
                : action.labor === "hired" && "Hired",
            ]),
          };
        case "add_equipment":
          return {
            icon: equipmentTypeIcon(action.equipment_type),
            kind: "Add equipment",
            title: action.name,
            detail: join([
              action.manufacturer,
              action.model_number,
              action.parts.length > 0 &&
                action.parts.map((p) => join([p.label, p.size])).join(", "),
            ]),
          };
        case "update_equipment":
          return {
            icon: "create-outline",
            kind: "Update equipment",
            title:
              equipmentName(action.equipment_id) ??
              action.equipment_name ??
              "Equipment",
            detail: join([
              action.manufacturer,
              action.model_number && `Model ${action.model_number}`,
              action.serial_number && `Serial ${action.serial_number}`,
              action.purchase_date && `Bought ${action.purchase_date}`,
              action.warranty_expires_on &&
                `Warranty to ${action.warranty_expires_on}`,
              action.parts.length > 0 &&
                `+ ${action.parts.map((p) => join([p.label, p.size])).join(", ")}`,
            ]),
          };
        case "add_paint":
          return {
            icon: "color-palette-outline",
            kind: "Add paint colour",
            title: action.room,
            detail: join([
              action.brand,
              action.color_name,
              action.color_code,
              action.finish && PAINT_FINISH_LABELS[action.finish],
            ]),
            swatch: action.hex,
          };
        case "add_note":
          return {
            icon: "document-text-outline",
            kind: "Add house note",
            title: action.title,
            detail: action.body.replace(/\s+/g, " ").slice(0, 90),
          };
        case "add_pro":
          return {
            icon: "call-outline",
            kind: "Add pro",
            title: action.name,
            detail: join([
              action.trade && CONTACT_TRADE_META[action.trade].label,
              action.company,
              action.phone,
            ]),
          };
        case "set_emergency_spot":
          return {
            icon: "flash-outline",
            kind: "Save emergency info",
            title:
              action.spot === "custom"
                ? (action.label ?? "Emergency spot")
                : SPOT_LABELS[action.spot],
            detail: action.where ?? action.howto,
          };
        case "open_emergency":
          return {
            icon: "alert-circle-outline",
            kind: "Emergency info",
            title: `Open ${action.label}`,
            detail: null,
          };
        case "add_document":
          return {
            icon: "folder-outline",
            kind: "Add document",
            title: action.title,
            detail: join([
              DOCUMENT_KIND_LABELS[action.kind],
              action.equipment_name ??
                (action.equipment_id
                  ? equipmentName(action.equipment_id)
                  : null),
              action.expires_on && `Expires ${action.expires_on}`,
            ]),
          };
        case "open_documents":
          return {
            icon: "folder-open-outline",
            kind: "Documents",
            title: action.title ? `Open ${action.title}` : "Open documents",
            detail: null,
          };
        case "open_spend":
          return {
            icon: "wallet-outline",
            kind: "Spend ledger",
            title: action.year
              ? `Open spend for ${action.year}`
              : "Open spend ledger",
            detail: null,
          };
        case "open_equipment":
          return {
            icon: "hardware-chip-outline",
            kind: "Equipment",
            title: action.equipment_name
              ? `Open ${action.equipment_name}`
              : "Open equipment",
            detail: null,
          };
        case "dismiss_recall":
          return {
            icon: "checkmark-done-outline",
            kind: "Dismiss recall",
            title: action.title,
            detail: action.equipment_name,
          };
      }
    },
    [formatMoney, equipmentName],
  );

  const run = useCallback(
    async (action: AssistantAction): Promise<KeeperActionResult> => {
      switch (action.type) {
        case "open_emergency":
          open("EmergencyInfo")();
          return { error: null };

        case "open_documents":
          open("DocumentVault")();
          return { error: null };

        case "open_spend":
          open(
            "SpendLedger",
            action.year != null ? { year: action.year } : undefined,
          )();
          return { error: null };

        case "open_equipment":
          if (action.equipment_id) {
            open("EquipmentDetail", { equipmentId: action.equipment_id })();
          } else {
            open("EquipmentList")();
          }
          return { error: null };

        case "dismiss_recall": {
          const { error } = await EquipmentRecallService.dismiss(
            action.recall_id,
          );
          if (error) {
            return { error: error.message };
          }
          await refreshEquipmentRecalls();
          return {
            error: null,
            view: action.equipment_id
              ? open("EquipmentDetail", {
                  equipmentId: action.equipment_id,
                })
              : open("EquipmentList"),
          };
        }

        case "add_document": {
          const { data, error } = await DocumentService.create({
            title: action.title,
            kind: action.kind,
            notes: action.notes,
            equipment_id: action.equipment_id,
            issued_on: action.issued_on,
            expires_on: action.expires_on,
          });
          if (error || !data) {
            return {
              error: error?.message ?? "Couldn't save this document.",
            };
          }
          upsertHomeDocument(data);
          return { error: null, view: open("DocumentVault") };
        }

        case "create_routine": {
          const [payload] = buildRoutinePayloadsFromItems([
            {
              title: action.title,
              description: action.description ?? undefined,
              category: action.category,
              priority: "medium",
              estimated_duration_minutes: 30,
              interval_days: action.interval_days,
            },
          ]);
          const result = await createTask({
            ...payload,
            equipment_id: equipmentId,
          });
          return result.success
            ? { error: null }
            : { error: result.error ?? "Please try again." };
        }

        case "create_task": {
          const { error } = await MaintenanceInstanceService.scheduleRepair({
            title: action.title,
            category: action.category,
            dueDate: noonInDays(action.due_in_days),
            description: action.description ?? undefined,
            equipmentId,
            priority: "medium",
          });
          if (error) return { error: error.message };
          await refreshTasks();
          return { error: null };
        }

        case "log_repair": {
          const { error } = await MaintenanceInstanceService.logRepair({
            title: action.title,
            category: action.category,
            completedOn: noonInDays(-action.days_ago),
            equipmentId,
            extras: {
              notes: action.notes ?? undefined,
              cost_amount: action.cost,
              labor_type: action.labor,
            },
          });
          if (error) return { error: error.message };
          await Promise.all([refreshTasks(), refreshRecordData()]);
          return { error: null, view: open("CompletionHistory") };
        }

        case "add_equipment": {
          const { data, error } =
            await EquipmentManualService.createEquipmentManual({
              name: action.name,
              equipment_type: action.equipment_type,
              manufacturer: action.manufacturer,
              model_number: action.model_number,
              serial_number: action.serial_number,
              purchase_date: action.purchase_date,
              warranty_expires_on: action.warranty_expires_on,
              consumables: toConsumables(action.parts),
            });
          if (error || !data) {
            return { error: error?.message ?? "Couldn't save the equipment." };
          }
          upsertEquipmentInIndex(data);
          return {
            error: null,
            view: open("EquipmentDetail", { equipmentId: data.id }),
          };
        }

        case "update_equipment": {
          const fetched = await EquipmentManualService.getEquipmentManualById(
            action.equipment_id,
          );
          if (fetched.error || !fetched.data) {
            return {
              error: "Couldn't find that equipment. Refresh and try again.",
            };
          }
          const existing = fetched.data.consumables ?? [];
          const seen = new Set(
            existing.map((p) => `${p.label}|${p.size ?? ""}`.toLowerCase()),
          );
          const added = toConsumables(action.parts).filter(
            (p) => !seen.has(`${p.label}|${p.size ?? ""}`.toLowerCase()),
          );
          const { data, error } =
            await EquipmentManualService.updateEquipmentManual(
              action.equipment_id,
              {
                ...(action.manufacturer && {
                  manufacturer: action.manufacturer,
                }),
                ...(action.model_number && {
                  model_number: action.model_number,
                }),
                ...(action.serial_number && {
                  serial_number: action.serial_number,
                }),
                ...(action.purchase_date && {
                  purchase_date: action.purchase_date,
                }),
                ...(action.warranty_expires_on && {
                  warranty_expires_on: action.warranty_expires_on,
                }),
                ...(added.length > 0 && {
                  consumables: [...existing, ...added],
                }),
              },
            );
          if (error || !data) {
            return {
              error: error?.message ?? "Couldn't update the equipment.",
            };
          }
          upsertEquipmentInIndex(data);
          return {
            error: null,
            view: open("EquipmentDetail", { equipmentId: data.id }),
          };
        }

        case "add_paint": {
          const next = {
            ...notesRef.current,
            paints: [
              ...notesRef.current.paints,
              {
                id: Crypto.randomUUID(),
                room: action.room,
                brand: action.brand,
                colorName: action.color_name,
                colorCode: action.color_code,
                finish: action.finish,
                hex: action.hex,
              },
            ],
          };
          const result = await updateHomeNotes(next);
          if (!result.success) {
            return { error: result.error ?? "Couldn't save the paint colour." };
          }
          notesRef.current = next;
          return { error: null, view: open("PaintColors") };
        }

        case "add_note": {
          const next = {
            ...notesRef.current,
            notes: [
              {
                id: Crypto.randomUUID(),
                title: action.title,
                body: action.body,
                kind: action.kind,
                updatedAt: new Date().toISOString(),
              },
              ...notesRef.current.notes,
            ],
          };
          const result = await updateHomeNotes(next);
          if (!result.success) {
            return { error: result.error ?? "Couldn't save the note." };
          }
          notesRef.current = next;
          return { error: null, view: open("HouseNotes") };
        }

        case "add_pro": {
          const { data, error } = await HomeContactService.create({
            name: action.name,
            company: action.company,
            trade: action.trade,
            phone: action.phone,
            email: action.email,
            website: action.website,
            notes: action.notes,
          });
          if (error || !data) {
            return { error: error?.message ?? "Couldn't save this pro." };
          }
          upsertHomeContact(data);
          return { error: null, view: open("Pros") };
        }

        case "set_emergency_spot": {
          const facts: HomeEmergencyFacts = { ...emergencyRef.current };
          const patch = {
            ...(action.where && { note: action.where }),
            ...(action.howto && { howto: action.howto }),
          };
          if (action.spot === "custom") {
            const label = action.label ?? "Emergency spot";
            const custom = [...(facts.custom ?? [])];
            const index = custom.findIndex(
              (spot) => spot.label.trim().toLowerCase() === label.toLowerCase(),
            );
            if (index >= 0) {
              custom[index] = { ...custom[index], ...patch };
            } else if (custom.length >= MAX_CUSTOM_EMERGENCY_SPOTS) {
              return {
                error: `You already have ${MAX_CUSTOM_EMERGENCY_SPOTS} custom spots. Remove one in Emergency info first.`,
              };
            } else {
              custom.push({ ...createCustomEmergencySpot(), label, ...patch });
            }
            facts.custom = custom;
          } else {
            facts[action.spot] = { ...(facts[action.spot] ?? {}), ...patch };
          }
          const result = await updateHomeEmergency(facts);
          if (!result.success) {
            return { error: result.error ?? "Couldn't save emergency info." };
          }
          emergencyRef.current = facts;
          return { error: null, view: open("EmergencyInfo") };
        }
      }
    },
    [
      open,
      createTask,
      refreshTasks,
      equipmentId,
      updateHomeNotes,
      updateHomeEmergency,
    ],
  );

  return { describe, run };
}
