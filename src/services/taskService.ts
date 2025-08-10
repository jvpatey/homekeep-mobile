import { supabase } from "../context/AuthContext";
import {
  Task,
  TaskInstance,
  CreateTaskData,
  UpdateTaskData,
  TaskWithInstances,
  TaskFilters,
} from "../types/task";
import { addWeeks, addMonths, addYears, startOfDay, addDays } from "date-fns";

export class TaskService {
  // create a new task
  static async createTask(
    taskData: CreateTaskData
  ): Promise<{ data: Task | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Add user_id and default values to the task data
      const taskWithUserId = {
        ...taskData,
        user_id: user.id,
        is_completed: false, // Ensure new tasks start as incomplete
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert([taskWithUserId])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error creating task:", error);
      return { data: null, error };
    }
  }

  // get all tasks for the current user with optional filters
  static async getTasks(
    filters?: TaskFilters
  ): Promise<{ data: Task[] | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      let query = supabase
        .from("tasks")
        .select("*")
        .order("next_due_date", { ascending: true });

      // Apply filters
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }
      if (filters?.is_completed !== undefined) {
        query = query.eq("is_completed", filters.is_completed);
      }
      if (filters?.due_date_from) {
        query = query.gte("next_due_date", filters.due_date_from);
      }
      if (filters?.due_date_to) {
        query = query.lte("next_due_date", filters.due_date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return { data: null, error };
    }
  }

  // get upcoming tasks (not completed, includes overdue tasks and tasks due within specified time range)
  static async getUpcomingTasks(timeRange: number | "all" = 60): Promise<{
    data: Task[] | null;
    error: any;
  }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      // If "all" is selected, get all incomplete tasks
      if (timeRange === "all") {
        console.log("📋 TaskService: Fetching all incomplete tasks (no time limit)");
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("is_completed", false)
          .not("next_due_date", "is", null)
          .order("next_due_date", { ascending: true })
          .limit(200); // Higher limit for all tasks

        if (error) {
          console.error("❌ TaskService: Error fetching all incomplete tasks:", error);
          throw error;
        }

        console.log(`✅ TaskService: Found ${data?.length || 0} upcoming tasks (all time ranges)`);
        return { data, error: null };
      }

      // Ensure timeRange is a valid number for date calculations
      const timeRangeDays = timeRange as number;
      if (typeof timeRangeDays !== "number" || timeRangeDays < 0) {
        throw new Error(`Invalid time range: ${timeRange}`);
      }

      // For specific time ranges, get overdue + future tasks within range
      const now = new Date();
      const endDate = addDays(now, timeRangeDays);
      const startOfToday = startOfDay(now);

      // Get incomplete tasks in two categories:
      // 1. Overdue tasks (due before today)
      // 2. Future tasks (due from today up to the time range)

      const [overdueResult, futureResult] = await Promise.all([
        // Get overdue tasks (due before today)
        supabase
          .from("tasks")
          .select("*")
          .eq("is_completed", false)
          .lt("next_due_date", startOfToday.toISOString())
          .order("next_due_date", { ascending: true })
          .limit(50),

        // Get future tasks (due from today up to the time range)
        supabase
          .from("tasks")
          .select("*")
          .eq("is_completed", false)
          .gte("next_due_date", startOfToday.toISOString())
          .lte("next_due_date", endDate.toISOString())
          .order("next_due_date", { ascending: true })
          .limit(50),
      ]);

      if (overdueResult.error) throw overdueResult.error;
      if (futureResult.error) throw futureResult.error;

      // Combine and sort all tasks by due date
      const allTasks = [
        ...(overdueResult.data || []),
        ...(futureResult.data || []),
      ].sort(
        (a, b) =>
          new Date(a.next_due_date).getTime() -
          new Date(b.next_due_date).getTime()
      );

      return { data: allTasks, error: null };
    } catch (error) {
      console.error("Error fetching upcoming tasks:", error);
      return { data: null, error };
    }
  }

  // get a single task by ID
  static async getTaskById(
    taskId: string
  ): Promise<{ data: Task | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching task:", error);
      return { data: null, error };
    }
  }

  // get a task with its instances (for recurring tasks)
  static async getTaskWithInstances(
    taskId: string
  ): Promise<{ data: TaskWithInstances | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          instances:task_instances(*)
        `
        )
        .eq("id", taskId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching task with instances:", error);
      return { data: null, error };
    }
  }

  // update a task
  static async updateTask(
    taskId: string,
    updates: UpdateTaskData
  ): Promise<{ data: Task | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error updating task:", error);
      return { data: null, error };
    }
  }

  // mark a task as completed
  static async completeTask(
    taskId: string
  ): Promise<{ data: Task | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      // First, get the current task to check if it's recurring
      const { data: currentTask, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (fetchError) throw fetchError;

      const now = new Date().toISOString();
      let updates: any = {
        is_completed: true,
        completed_at: now,
        updated_at: now,
      };

      // For recurring tasks, we'll create a new instance after marking this one complete
      // Don't change the is_completed status here - let it stay completed

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;

      // If it's a recurring task, create a new instance for the next occurrence
      if (currentTask.is_recurring && currentTask.recurrence_type) {
        // For recurring tasks, calculate next due date from the current task's due date
        // This ensures proper spacing for recurring instances
        const nextDueDate = TaskService.calculateNextDueDate(
          currentTask.recurrence_type,
          currentTask.next_due_date
        );

        // Check if a task with this exact due date already exists for this user
        const { data: existingTask, error: queryError } = await supabase
          .from("tasks")
          .select("id, title, next_due_date, is_completed")
          .eq("user_id", currentTask.user_id)
          .eq("title", currentTask.title)
          .eq("next_due_date", nextDueDate)
          .eq("is_completed", false)
          .single();

        if (existingTask) {
          // Skip creation if duplicate exists
        } else {
          const newTaskData = {
            title: currentTask.title,
            description: currentTask.description,
            category: currentTask.category,
            priority: currentTask.priority,
            estimated_duration: currentTask.estimated_duration,
            is_recurring: currentTask.is_recurring,
            recurrence_type: currentTask.recurrence_type,
            next_due_date: nextDueDate,
            user_id: currentTask.user_id,
            is_completed: false,
            created_at: now,
            updated_at: now,
          };

          // Create the new instance
          const { error: createError } = await supabase
            .from("tasks")
            .insert([newTaskData]);

          if (createError) {
            console.error(
              "❌ Error creating next recurring task instance:",
              createError
            );
            // Don't fail the completion, just log the error
          } else {
          }
        }
      } else {
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error completing task:", error);
      return { data: null, error };
    }
  }

  // Calculate the next due date for recurring tasks using date-fns
  static calculateNextDueDate(
    recurrenceType: string,
    currentDueDate: string
  ): string {
    const currentDate = new Date(currentDueDate);

    switch (recurrenceType) {
      case "weekly":
        return addWeeks(currentDate, 1).toISOString();
      case "monthly":
        return addMonths(currentDate, 1).toISOString();
      case "quarterly":
        return addMonths(currentDate, 3).toISOString();
      case "yearly":
        return addYears(currentDate, 1).toISOString();
      default:
        // Default to weekly if unknown
        return addWeeks(currentDate, 1).toISOString();
    }
  }

  // mark a task as incomplete
  static async uncompleteTask(
    taskId: string
  ): Promise<{ data: Task | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          is_completed: false,
          completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error uncompleting task:", error);
      return { data: null, error };
    }
  }

  // get completed tasks
  static async getCompletedTasks(timeRange: number | "all" = 60): Promise<{
    data: Task[] | null;
    error: any;
  }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      // If "all" is selected, get all completed tasks
      if (timeRange === "all") {
        console.log("📋 TaskService: Fetching all completed tasks (no time limit)");
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("is_completed", true)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(200); // Higher limit for all tasks

        if (error) {
          console.error("❌ TaskService: Error fetching all completed tasks:", error);
          throw error;
        }

        console.log(`✅ TaskService: Found ${data?.length || 0} completed tasks (all time ranges)`);
        return { data, error: null };
      }

      // Ensure timeRange is a valid number for date calculations
      const timeRangeDays = timeRange as number;
      if (typeof timeRangeDays !== "number" || timeRangeDays < 0) {
        throw new Error(`Invalid time range: ${timeRange}`);
      }

      // For specific time ranges, look back in time
      const now = new Date();
      const startDate = addDays(now, -timeRangeDays); // Look back in time

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_completed", true)
        .gte("completed_at", startDate.toISOString())
        .lte("completed_at", now.toISOString())
        .order("completed_at", { ascending: false })
        .limit(50); // Increased limit for longer time ranges

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching completed tasks:", error);
      return { data: null, error };
    }
  }

  // delete a task
  static async deleteTask(taskId: string): Promise<{ error: any }> {
    if (!supabase) {
      return { error: { message: "Supabase not configured" } };
    }

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Error deleting task:", error);
      return { error };
    }
  }

  // get task statistics for dashboard
  static async getTaskStats(): Promise<{ data: any | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      // Get total tasks
      const { data: totalTasks, error: totalError } = await supabase
        .from("tasks")
        .select("id", { count: "exact" });

      if (totalError) throw totalError;

      // Get completed tasks
      const { data: completedTasks, error: completedError } = await supabase
        .from("tasks")
        .select("id", { count: "exact" })
        .eq("is_completed", true);

      if (completedError) throw completedError;

      // Get overdue tasks
      const { data: overdueTasks, error: overdueError } = await supabase
        .from("tasks")
        .select("id", { count: "exact" })
        .eq("is_completed", false)
        .lt("next_due_date", new Date().toISOString());

      if (overdueError) throw overdueError;

      // Get tasks due today
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);

      const { data: todayTasks, error: todayError } = await supabase
        .from("tasks")
        .select("id", { count: "exact" })
        .eq("is_completed", false)
        .gte("next_due_date", today.toISOString())
        .lt("next_due_date", tomorrow.toISOString());

      if (todayError) throw todayError;

      // Get tasks due this week (next 7 days)
      const nextWeek = addWeeks(today, 1);

      const { data: thisWeekTasks, error: thisWeekError } = await supabase
        .from("tasks")
        .select("id", { count: "exact" })
        .eq("is_completed", false)
        .gte("next_due_date", today.toISOString())
        .lt("next_due_date", nextWeek.toISOString());

      if (thisWeekError) throw thisWeekError;

      const stats = {
        total: totalTasks?.length || 0,
        completed: completedTasks?.length || 0,
        overdue: overdueTasks?.length || 0,
        dueToday: todayTasks?.length || 0,
        thisWeek: thisWeekTasks?.length || 0,
        completionRate: totalTasks?.length
          ? Math.round(
              ((completedTasks?.length || 0) / totalTasks.length) * 100
            )
          : 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error fetching task stats:", error);
      return { data: null, error };
    }
  }

  // bulk complete multiple tasks
  static async bulkCompleteTasks(
    taskIds: string[]
  ): Promise<{ data: Task[] | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    if (!taskIds.length) {
      return { data: [], error: null };
    }

    try {
      const now = new Date().toISOString();

      // First, get all the tasks to check which ones are recurring
      const { data: tasksToComplete, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .in("id", taskIds)
        .eq("is_completed", false);

      if (fetchError) throw fetchError;

      if (!tasksToComplete || tasksToComplete.length === 0) {
        return { data: [], error: null };
      }

      // Update all tasks to completed
      const { data: updatedTasks, error: updateError } = await supabase
        .from("tasks")
        .update({
          is_completed: true,
          completed_at: now,
          updated_at: now,
        })
        .in("id", taskIds)
        .eq("is_completed", false)
        .select();

      if (updateError) throw updateError;

      // Handle recurring tasks - create next instances
      const recurringTasks = tasksToComplete.filter(
        (task) => task.is_recurring && task.recurrence_type
      );

      if (recurringTasks.length > 0) {
        const newInstances = [];

        for (const task of recurringTasks) {
          const nextDueDate = TaskService.calculateNextDueDate(
            task.recurrence_type,
            task.next_due_date
          );

          // Check if a task with this exact due date already exists for this user
          const { data: existingTask } = await supabase
            .from("tasks")
            .select("id, title, next_due_date, is_completed")
            .eq("user_id", task.user_id)
            .eq("title", task.title)
            .eq("next_due_date", nextDueDate)
            .eq("is_completed", false)
            .single();

          if (!existingTask) {
            const newTaskData = {
              title: task.title,
              description: task.description,
              category: task.category,
              priority: task.priority,
              estimated_duration: task.estimated_duration,
              is_recurring: task.is_recurring,
              recurrence_type: task.recurrence_type,
              next_due_date: nextDueDate,
              user_id: task.user_id,
              is_completed: false,
              created_at: now,
              updated_at: now,
            };

            newInstances.push(newTaskData);
          }
        }

        // Create all new instances in a single batch if there are any
        if (newInstances.length > 0) {
          const { error: createError } = await supabase
            .from("tasks")
            .insert(newInstances);

          if (createError) {
            console.error(
              "Error creating recurring task instances:",
              createError
            );
            // Don't fail the bulk completion, just log the error
          }
        }
      }

      return { data: updatedTasks, error: null };
    } catch (error) {
      console.error("Error bulk completing tasks:", error);
      return { data: null, error };
    }
  }
}
