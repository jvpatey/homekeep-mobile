import { Platform } from "react-native";
import { ExtensionStorage } from "@bacons/apple-targets";
import { format } from "date-fns";
import { MaintenanceTask } from "../types/maintenance";
import type { ZoneHealthGrade } from "../utils/zoneHealth";

/** Must match the App Group in app.json and targets/widget. */
export const WIDGET_APP_GROUP = "group.com.homekeep.mobile";
const SNAPSHOT_KEY = "homeSnapshot";
const MAX_TASKS = 30;

/** Decoded by HomeSnapshot in targets/widget/index.swift; bump `version` on breaking changes. */
export interface WidgetSnapshot {
  version: 1;
  signedIn: boolean;
  health: { score: number; grade: ZoneHealthGrade } | null;
  /** Open tasks, soonest first. `due` is the local calendar date (yyyy-MM-dd). */
  tasks: { id: string; title: string; due: string }[];
}

let storage: ExtensionStorage | null = null;
let lastWritten: string | null = null;

function write(snapshot: WidgetSnapshot) {
  if (Platform.OS !== "ios") return;
  const json = JSON.stringify(snapshot);
  if (json === lastWritten) return;
  storage ??= new ExtensionStorage(WIDGET_APP_GROUP);
  storage.set(SNAPSHOT_KEY, json);
  lastWritten = json;
  ExtensionStorage.reloadWidget();
}

export function buildWidgetSnapshot(input: {
  overdue: MaintenanceTask[];
  upcoming: MaintenanceTask[];
  health: WidgetSnapshot["health"];
}): WidgetSnapshot {
  const seen = new Set<string>();
  const tasks = [...input.overdue, ...input.upcoming]
    .filter((t) => {
      if (t.is_completed || seen.has(t.instance_id)) return false;
      seen.add(t.instance_id);
      return true;
    })
    .map((t) => ({ task: t, at: new Date(t.due_date) }))
    .filter(({ at }) => !Number.isNaN(at.getTime()))
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_TASKS)
    .map(({ task, at }) => ({
      id: task.instance_id,
      title: task.title,
      due: format(at, "yyyy-MM-dd"),
    }));
  return { version: 1, signedIn: true, health: input.health, tasks };
}

export function writeWidgetSnapshot(snapshot: WidgetSnapshot) {
  write(snapshot);
}

/** On sign-out, so the next person to pick up the phone doesn't see this home's tasks. */
export function clearWidgetSnapshot() {
  write({ version: 1, signedIn: false, health: null, tasks: [] });
}

const WIDGET_TASK_PREFIX = "homekeep://widget/task/";

/** Widget taps: `homekeep://widget` or `homekeep://widget/task/<instanceId>`. */
export function isWidgetUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith("homekeep://widget");
}

export function widgetTaskInstanceId(url: string): string | null {
  if (!url.startsWith(WIDGET_TASK_PREFIX)) return null;
  const id = decodeURIComponent(url.slice(WIDGET_TASK_PREFIX.length)).split(/[/?#]/)[0];
  return id || null;
}
