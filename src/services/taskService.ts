import { supabase } from "../context/AuthContext";
import {
  Task,
  TaskInstance,
  CreateTaskData,
  UpdateTaskData,
  TaskWithInstances,
  TaskFilters,
} from "../types/task";

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

      // Add user_id to the task data
      const taskWithUserId = {
        ...taskData,
        user_id: user.id,
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

  // get upcoming tasks (not completed, due within next 30 days)
  static async getUpcomingTasks(): Promise<{
    data: Task[] | null;
    error: any;
  }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_completed", false)
        .gte("next_due_date", new Date().toISOString())
        .lte("next_due_date", thirtyDaysFromNow.toISOString())
        .order("next_due_date", { ascending: true })
        .limit(10);

      if (error) throw error;

      return { data, error: null };
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
        last_completed_date: now,
      };

      // If it's a recurring task, calculate the next due date
      if (currentTask.is_recurring && currentTask.recurrence_type) {
        const nextDueDate = TaskService.calculateNextDueDate(
          currentTask.recurrence_type,
          currentTask.next_due_date
        );

        updates = {
          ...updates,
          next_due_date: nextDueDate,
          next_instance_date: nextDueDate,
          is_completed: false, // Recurring tasks should be marked as incomplete for the next instance
        };
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error completing task:", error);
      return { data: null, error };
    }
  }

  // Calculate the next due date for recurring tasks
  static calculateNextDueDate(
    recurrenceType: string,
    currentDueDate: string
  ): string {
    const currentDate = new Date(currentDueDate);
    const nextDate = new Date(currentDate);

    switch (recurrenceType) {
      case "weekly":
        nextDate.setDate(currentDate.getDate() + 7);
        break;
      case "monthly":
        nextDate.setMonth(currentDate.getMonth() + 1);
        break;
      case "quarterly":
        nextDate.setMonth(currentDate.getMonth() + 3);
        break;
      case "yearly":
        nextDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        // Default to weekly if unknown
        nextDate.setDate(currentDate.getDate() + 7);
    }

    return nextDate.toISOString();
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
  static async getCompletedTasks(): Promise<{
    data: Task[] | null;
    error: any;
  }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_completed", true)
        .order("completed_at", { ascending: false })
        .limit(20);

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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayTasks, error: todayError } = await supabase
        .from("tasks")
        .select("id", { count: "exact" })
        .eq("is_completed", false)
        .gte("next_due_date", today.toISOString())
        .lt("next_due_date", tomorrow.toISOString());

      if (todayError) throw todayError;

      // Get tasks due this week (next 7 days)
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

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
}
