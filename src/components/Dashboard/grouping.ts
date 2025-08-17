import { Task } from "../../types/task";

function normalizeTitle(title: string): string {
  return (title || "").trim().toLowerCase();
}

export function makeGroupKey(task: Task): string {
  const title = normalizeTitle(task.title);
  const category = (task.category || "").toLowerCase();
  const recurrence = task.is_recurring
    ? task.recurrence_type || "recurring"
    : "one-off";
  return `${title}|${category}|${recurrence}`;
}

export function groupTasksByKey(
  tasks: Task[]
): { key: string; items: Task[]; nextDueDate: string }[] {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    const key = makeGroupKey(t);
    const arr = map.get(key) || [];
    arr.push(t);
    map.set(key, arr);
  }
  const groups = Array.from(map.entries()).map(([key, items]) => {
    const next = items
      .slice()
      .sort(
        (a, b) =>
          new Date(a.next_due_date).getTime() -
          new Date(b.next_due_date).getTime()
      )[0];
    return {
      key,
      items,
      nextDueDate: next?.next_due_date || new Date().toISOString(),
    };
  });
  // Sort groups by earliest next due date
  return groups.sort(
    (a, b) =>
      new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
  );
}
