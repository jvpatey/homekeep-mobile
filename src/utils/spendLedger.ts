import { MaintenanceCategory, MaintenanceTask, isRepairRoutine } from "../types/maintenance";

export interface SpendEntry {
  instanceId: string;
  routineId: string;
  title: string;
  category: MaintenanceCategory;
  amount: number;
  laborType: "diy" | "hired" | null;
  date: Date;
  isRepair: boolean;
  photoPath: string | null;
  notes: string | null;
  contactId: string | null;
  contactName: string | null;
  task: MaintenanceTask;
}

export interface SpendCategoryTotal {
  category: MaintenanceCategory;
  total: number;
  count: number;
  share: number;
}

export interface SpendYear {
  year: number;
  total: number;
  count: number;
  diyTotal: number;
  hiredTotal: number;
  /** Costs without a DIY/hired choice. */
  otherTotal: number;
  repairTotal: number;
  byCategory: SpendCategoryTotal[];
  entries: SpendEntry[];
}

export interface SpendLedger {
  years: SpendYear[];
  allTime: SpendYear;
  /** Jobs recorded (with or without cost). */
  jobCount: number;
  /** Earliest completion date in the record. */
  firstRecordedAt: Date | null;
  hasAnyCost: boolean;
}

function completionDate(task: MaintenanceTask): Date | null {
  const raw = task.completed_at || task.due_date;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toEntry(task: MaintenanceTask): SpendEntry | null {
  const amount = task.cost_amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  const date = completionDate(task);
  if (!date) return null;
  return {
    instanceId: task.instance_id,
    routineId: task.id,
    title: task.title,
    category: task.category,
    amount,
    laborType:
      task.labor_type === "diy" || task.labor_type === "hired"
        ? task.labor_type
        : null,
    date,
    isRepair: isRepairRoutine(task),
    photoPath: task.photo_storage_path ?? null,
    notes: task.notes?.trim() || null,
    contactId: task.contact_id ?? task.contact?.id ?? null,
    contactName: task.contact?.name ?? null,
    task,
  };
}

function summarize(year: number, entries: SpendEntry[]): SpendYear {
  let total = 0;
  let diyTotal = 0;
  let hiredTotal = 0;
  let otherTotal = 0;
  let repairTotal = 0;
  const byCategory = new Map<MaintenanceCategory, { total: number; count: number }>();

  for (const entry of entries) {
    total += entry.amount;
    if (entry.laborType === "diy") diyTotal += entry.amount;
    else if (entry.laborType === "hired") hiredTotal += entry.amount;
    else otherTotal += entry.amount;
    if (entry.isRepair) repairTotal += entry.amount;
    const bucket = byCategory.get(entry.category) ?? { total: 0, count: 0 };
    bucket.total += entry.amount;
    bucket.count += 1;
    byCategory.set(entry.category, bucket);
  }

  const categories = Array.from(byCategory.entries())
    .map(([category, bucket]) => ({
      category,
      total: bucket.total,
      count: bucket.count,
      share: total > 0 ? bucket.total / total : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    year,
    total,
    count: entries.length,
    diyTotal,
    hiredTotal,
    otherTotal,
    repairTotal,
    byCategory: categories,
    entries: [...entries].sort((a, b) => b.date.getTime() - a.date.getTime()),
  };
}

/** Spend by year and category from completed instances. Newest year first. */
export function computeSpendLedger(
  tasks: MaintenanceTask[],
  now: Date = new Date()
): SpendLedger {
  const entries: SpendEntry[] = [];
  let firstRecordedAt: Date | null = null;

  for (const task of tasks) {
    if (!task.is_completed) continue;
    const date = completionDate(task);
    if (date && (!firstRecordedAt || date < firstRecordedAt)) {
      firstRecordedAt = date;
    }
    const entry = toEntry(task);
    if (entry) entries.push(entry);
  }

  const byYear = new Map<number, SpendEntry[]>();
  for (const entry of entries) {
    const year = entry.date.getFullYear();
    const list = byYear.get(year) ?? [];
    list.push(entry);
    byYear.set(year, list);
  }
  if (!byYear.has(now.getFullYear())) byYear.set(now.getFullYear(), []);

  const years = Array.from(byYear.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, list]) => summarize(year, list));

  return {
    years,
    allTime: summarize(0, entries),
    jobCount: tasks.filter((t) => t.is_completed).length,
    firstRecordedAt,
    hasAnyCost: entries.length > 0,
  };
}

export function spendForYear(ledger: SpendLedger, year: number): SpendYear | null {
  return ledger.years.find((y) => y.year === year) ?? null;
}
