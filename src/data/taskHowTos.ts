import { MAINTENANCE_PLANS } from "./maintenancePlans";
import {
  type TaskHowTo,
  findTaskHowTo,
} from "../../supabase/functions/_shared/taskHowToContent";

export type { TaskHowTo };

export function howToForTask(task: { title: string }): TaskHowTo | null {
  return findTaskHowTo(task.title);
}

/** Dev aid: library task titles that still need a how-to. */
export function missingHowTos(extraTitles: string[] = []): string[] {
  const titles = new Set<string>(extraTitles);
  for (const plan of MAINTENANCE_PLANS) {
    for (const item of plan.items) titles.add(item.title);
  }
  return Array.from(titles)
    .filter((title) => !findTaskHowTo(title))
    .sort();
}
