import { useEffect, useRef } from "react";
import { useTasks } from "../context/TasksContext";
import { refreshRecordData } from "../hooks/useRecordData";
import { refreshHomeContacts } from "../hooks/useHomeContacts";
import { refreshHomeDocuments } from "../hooks/useHomeDocuments";
import { refreshEquipmentIndex } from "../hooks/useEquipmentIndex";
import { refreshEquipmentRecalls } from "../hooks/useEquipmentRecalls";
import { refreshRoutines } from "../components/all-reminders/useReminderRoutines";

/**
 * Warms the Record and Plan tabs once Home has loaded, so switching tabs
 * shows real content immediately instead of placeholders popping in.
 */
export function usePrefetchTabs() {
  const { loading } = useTasks();
  const started = useRef(false);

  useEffect(() => {
    if (loading || started.current) return;
    const handle = requestIdleCallback(
      () => {
        started.current = true;
        void Promise.all([
          refreshRecordData(),
          refreshHomeContacts(),
          refreshHomeDocuments(),
          refreshEquipmentIndex(),
          refreshEquipmentRecalls(),
          refreshRoutines(),
        ]);
      },
      { timeout: 1500 }
    );
    return () => cancelIdleCallback(handle);
  }, [loading]);
}
