import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { useTasks } from "./TasksContext";
import { useHaptics } from "../hooks";
import {
  isPlusRequiredError,
  useRequirePlusOrFreeAction,
} from "../hooks/useRequirePlus";
import { useSubscription } from "./SubscriptionContext";
import { refreshRecordData } from "../hooks/useRecordData";
import { MaintenanceInstanceService } from "../services/MaintenanceInstanceService";
import { RootStackParamList, RecordStackParamList } from "../navigation/types";
import {
  LogRepairDraft,
  LogRepairSheet,
  ScheduleRepairDraft,
} from "../components/modals/log-repair/LogRepairSheet";
import { CreateTaskModal } from "../components/Dashboard/modals";
import { ProPicker } from "../components/pros/ProPicker";
import { useCurrency } from "../hooks/useCurrency";

interface LogRepairOptions {
  equipmentId?: string | null;
}

interface CreateTaskOptions {
  equipmentId?: string | null;
}

interface QuickActionsValue {
  /** Opens the repair sheet from any tab (counts as a free create). */
  openLogRepair: (options?: LogRepairOptions) => Promise<void>;
  /** Opens the repair sheet to add a one-off fix to the schedule. */
  openScheduleRepair: (options?: LogRepairOptions) => Promise<void>;
  /** Opens the new-reminder form from any tab, optionally linked to equipment. */
  openCreateTask: (options?: CreateTaskOptions) => Promise<void>;
}

const QuickActionsContext = createContext<QuickActionsValue | null>(null);

/**
 * Root-level sheets that several tabs present. Mounted inside the app
 * navigator so it can reach the tab routes.
 */
export function QuickActionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { refreshTasks } = useTasks();
  const { triggerSuccess, triggerError } = useHaptics();
  const { requireAccess, sync } = useRequirePlusOrFreeAction();
  const { presentPaywall } = useSubscription();
  const { format: formatMoney } = useCurrency();

  const [repairVisible, setRepairVisible] = useState(false);
  const [repairMode, setRepairMode] = useState<"log" | "schedule">("log");
  const [repairEquipmentId, setRepairEquipmentId] = useState<string | null>(
    null
  );
  const [createOptions, setCreateOptions] = useState<CreateTaskOptions | null>(
    null
  );
  const afterDismissRef = useRef<(() => void) | null>(null);

  const openRecordScreen = useCallback(
    <K extends keyof RecordStackParamList>(
      screen: K,
      params?: RecordStackParamList[K]
    ) => {
      navigation.navigate("App", {
        screen: "Tabs",
        params: {
          screen: "RecordTab",
          params: { screen, params, initial: false } as never,
        },
      });
    },
    [navigation]
  );

  const openLogRepair = useCallback(
    async (options?: LogRepairOptions) => {
      if (!(await requireAccess())) return;
      setRepairMode("log");
      setRepairEquipmentId(options?.equipmentId ?? null);
      setRepairVisible(true);
    },
    [requireAccess]
  );

  const openScheduleRepair = useCallback(
    async (options?: LogRepairOptions) => {
      if (!(await requireAccess())) return;
      setRepairMode("schedule");
      setRepairEquipmentId(options?.equipmentId ?? null);
      setRepairVisible(true);
    },
    [requireAccess]
  );

  const submitSchedule = useCallback(
    async (draft: ScheduleRepairDraft) => {
      const { error } = await MaintenanceInstanceService.scheduleRepair({
        title: draft.title,
        category: draft.category,
        dueDate: draft.dueDate,
        description: draft.description,
        equipmentId: draft.equipmentId,
        priority: draft.priority,
      });
      if (error) {
        await triggerError();
        if (isPlusRequiredError(error)) {
          await presentPaywall({ force: true, reason: "free_exhausted" });
          return false;
        }
        Alert.alert("Couldn't schedule the repair", error.message);
        return false;
      }
      await sync();
      await refreshTasks();
      await triggerSuccess();
      setRepairVisible(false);
      return true;
    },
    [presentPaywall, refreshTasks, sync, triggerError, triggerSuccess]
  );

  const openCreateTask = useCallback(
    async (options?: CreateTaskOptions) => {
      if (!(await requireAccess())) return;
      setCreateOptions(options ?? {});
    },
    [requireAccess]
  );

  const submitRepair = useCallback(
    async (draft: LogRepairDraft) => {
      const { error } = await MaintenanceInstanceService.logRepair({
        title: draft.title,
        category: draft.category,
        completedOn: draft.completedOn,
        equipmentId: draft.equipmentId,
        extras: draft.extras,
      });
      if (error) {
        await triggerError();
        if (isPlusRequiredError(error)) {
          await presentPaywall({ force: true, reason: "free_exhausted" });
          return false;
        }
        Alert.alert("Couldn't save the repair", error.message);
        return false;
      }
      await sync();
      await Promise.all([refreshTasks(), refreshRecordData()]);
      await triggerSuccess();

      const cost = draft.extras.cost_amount;
      const year = draft.completedOn.getFullYear();
      afterDismissRef.current = () => {
        Alert.alert(
          "Repair saved",
          cost
            ? `${draft.title} · ${formatMoney(cost)} is in your home record.`
            : `${draft.title} is in your home record.`,
          [
            { text: "Done", style: "cancel" },
            cost
              ? {
                  text: "View in ledger",
                  onPress: () => openRecordScreen("SpendLedger", { year }),
                }
              : {
                  text: "View history",
                  onPress: () => openRecordScreen("CompletionHistory"),
                },
          ]
        );
      };
      setRepairVisible(false);
      return true;
    },
    [
      formatMoney,
      openRecordScreen,
      presentPaywall,
      refreshTasks,
      sync,
      triggerError,
      triggerSuccess,
    ]
  );

  const value = useMemo(
    () => ({ openLogRepair, openScheduleRepair, openCreateTask }),
    [openCreateTask, openLogRepair, openScheduleRepair]
  );

  return (
    <QuickActionsContext.Provider value={value}>
      {children}
      <LogRepairSheet
        visible={repairVisible}
        mode={repairMode}
        initialEquipmentId={repairEquipmentId}
        onSchedule={submitSchedule}
        onClose={() => setRepairVisible(false)}
        onDismissed={() => {
          const next = afterDismissRef.current;
          afterDismissRef.current = null;
          next?.();
        }}
        onSubmit={submitRepair}
        renderProSlot={(details, onChange) => (
          <ProPicker
            value={details.contactId}
            onChange={(contactId) => onChange({ ...details, contactId })}
          />
        )}
      />
      {createOptions ? (
        <CreateTaskModal
          onClose={() => setCreateOptions(null)}
          onTaskCreated={() => {
            setCreateOptions(null);
            void refreshTasks();
          }}
          initialValues={
            createOptions.equipmentId
              ? { equipment_id: createOptions.equipmentId }
              : undefined
          }
        />
      ) : null}
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions(): QuickActionsValue {
  const value = useContext(QuickActionsContext);
  if (!value) {
    throw new Error("useQuickActions must be used inside QuickActionsProvider");
  }
  return value;
}
