import { supabase } from "../lib/supabase";
import { MaintenanceTask } from "../types/maintenance";
import { AvatarStorageService } from "./AvatarStorageService";
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

  type CompleterRow = {
    id: string;
    full_name?: string | null;
    email?: string | null;
    avatar_style?: string | null;
    avatar_storage_path?: string | null;
  };

  let rows: CompleterRow[] | null = null;
  const full = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_style, avatar_storage_path")
    .in("id", ids);
  if (!full.error && full.data) {
    rows = full.data;
  } else {
    const fallback = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_style")
      .in("id", ids);
    if (fallback.error || !fallback.data) return tasks;
    rows = fallback.data;
  }

  const labels = new Map<
    string,
    {
      name: string | null;
      avatarStyle: string | null;
      avatarPath: string | null;
    }
  >();
  for (const row of rows) {
    const name = memberDisplayName({
      fullName: typeof row.full_name === "string" ? row.full_name : null,
      email: typeof row.email === "string" ? row.email : null,
    });
    labels.set(row.id, {
      name: name === "Household member" ? null : name,
      avatarStyle:
        typeof row.avatar_style === "string" ? row.avatar_style : null,
      avatarPath:
        typeof row.avatar_storage_path === "string"
          ? row.avatar_storage_path
          : null,
    });
  }

  const signedUrls = await AvatarStorageService.createSignedUrls(
    [...labels.values()]
      .map((info) => info.avatarPath)
      .filter((path): path is string => Boolean(path))
  );

  return tasks.map((task) => {
    if (!task.completed_by) return task;
    const info = labels.get(task.completed_by);
    if (!info) return task;
    return {
      ...task,
      completed_by_name: task.completed_by_name?.trim() || info.name,
      completed_by_avatar_style:
        task.completed_by_avatar_style ?? info.avatarStyle,
      completed_by_avatar_url: info.avatarPath
        ? signedUrls.get(info.avatarPath) ?? null
        : null,
    };
  });
}
