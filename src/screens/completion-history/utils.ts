import { MaintenanceTask } from "../../types/maintenance";

export interface GroupedRoutine {
  routineId: string;
  title: string;
  category: string;
  priority: string;
  estimatedDuration: number;
  intervalDays: number;
  completedInstances: MaintenanceTask[];
  totalInstances: number;
  completionRate: number;
  latestCompletion?: string;
  nextDueDate?: string;
}

// groupTasksByRoutine function to group completed tasks by routine
export const groupTasksByRoutine = (completedTasks: MaintenanceTask[]) => {
  const groups: { [key: string]: GroupedRoutine } = {};

  // Group completed tasks by routine
  completedTasks.forEach((task) => {
    const routineId = task.id;
    if (!groups[routineId]) {
      groups[routineId] = {
        routineId,
        title: task.title,
        category: task.category,
        priority: task.priority,
        estimatedDuration: task.estimated_duration_minutes,
        intervalDays: task.interval_days,
        completedInstances: [],
        totalInstances: 0,
        completionRate: 0,
      };
    }
    groups[routineId].completedInstances.push(task);
  });

  // Calculate statistics for each routine
  Object.values(groups).forEach((routine) => {
    // Sort instances by completion date (newest first)
    routine.completedInstances.sort(
      (a, b) =>
        new Date(b.completed_at || "").getTime() -
        new Date(a.completed_at || "").getTime()
    );

    // Calculate completion rate and find latest completion
    routine.totalInstances = routine.completedInstances.length;
    routine.completionRate = 100; // All instances are completed
    routine.latestCompletion = routine.completedInstances[0]?.completed_at;

    // Calculate next due date based on latest completion and interval
    if (routine.latestCompletion && routine.intervalDays > 0) {
      const lastCompletion = new Date(routine.latestCompletion);
      const nextDue = new Date(lastCompletion);
      nextDue.setDate(nextDue.getDate() + routine.intervalDays);
      routine.nextDueDate = nextDue.toISOString();
    }
  });

  return Object.values(groups);
};

// formatDate function to format the date
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
