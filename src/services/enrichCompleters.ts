import { supabase } from "../lib/supabase";
import { MaintenanceTask } from "../types/maintenance";
import { memberDisplayName } from "./HouseholdService";

/**
 * Fill completer name and avatar from profiles. Needed when the snapshot
 * name is empty or PostgREST omitted the new columns until schema reload.
 */
export async function enrichTasksWithCompleters(
  tasks: MaintenanceTask[]
): Promise<MaintenanceTask[]> {
  if (!supabase || tasks.length === 0) return tasks;

  const ids = [
    ...new Set(
      tasks
        .map((task) => task.completed_by)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  if (ids.length === 0) return tasks;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_style")
    .in("id", ids);
  if (error || !data) return tasks;

  const labels = new Map<
    string,
    { name: string | null; avatarStyle: string | null }
  >();
  for (const row of data) {
    const name = memberDisplayName({
      fullName: typeof row.full_name === "string" ? row.full_name : null,
      email: typeof row.email === "string" ? row.email : null,
    });
    labels.set(row.id, {
      name: name === "Household member" ? null : name,
      avatarStyle:
        typeof row.avatar_style === "string" ? row.avatar_style : null,
    });
  }

  return tasks.map((task) => {
    if (!task.completed_by) return task;
    const info = labels.get(task.completed_by);
    if (!info) return task;
    return {
      ...task,
      completed_by_name: task.completed_by_name?.trim() || info.name,
      completed_by_avatar_style:
        task.completed_by_avatar_style ?? info.avatarStyle,
    };
  });
}
