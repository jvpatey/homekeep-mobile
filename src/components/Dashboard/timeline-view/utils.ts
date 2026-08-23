import { MaintenanceTask } from "../../../types/maintenance";
import { formatTaskSectionHeading } from "../../../utils/formatTaskDates";

// groupTasksByDate function to group the tasks by date
export const groupTasksByDate = (tasks: MaintenanceTask[]) => {
  const groups: { [key: string]: MaintenanceTask[] } = {};

  tasks.forEach((task) => {
    const date = new Date(task.due_date);
    const dateKey = date.toDateString();

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(task);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([dateKey, tasks]) => ({
      date: new Date(dateKey),
      tasks: tasks.sort((a, b) => {
        // Sort by priority first, then by due time
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }),
    }));
};

// formatDate function to format the date (section headings)
export const formatDate = (date: Date) => formatTaskSectionHeading(date);

// formatTime function to format the time
export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

import { getPriorityColor as hearthPriorityColor } from "../../ui/PriorityMark";

// getPriorityColor — Hearth semantic mapping (copper / warning / sage)
export const getPriorityColor = hearthPriorityColor;
