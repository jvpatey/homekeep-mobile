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
  private static async ensureInstancesForRange(
    startISO: string,
    endISO: string,
    includeCompleted: boolean
  ) {
    if (!supabase) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch tasks in range for this user
      let tasksQuery = supabase
        .from("tasks")
        .select("id, user_id, next_due_date, is_completed, completed_at")
        .eq("user_id", user.id)
        .gte("next_due_date", startISO)
        .lte("next_due_date", endISO);
      if (!includeCompleted) {
        tasksQuery = tasksQuery.eq("is_completed", false);
      }
      const { data: tasksInRange, error: tasksErr } = await tasksQuery;
      if (tasksErr || !tasksInRange || tasksInRange.length === 0) return;

      const taskIds = tasksInRange.map((t: any) => t.id);
      const { data: existingInstances } = await supabase
        .from("task_instances")
        .select("task_id, due_date")
        .in("task_id", taskIds)
        .gte("due_date", startISO)
        .lte("due_date", endISO);

      const existingKey = new Set(
        (existingInstances || []).map(
          (i: any) => `${i.task_id}|${new Date(i.due_date).toISOString()}`
        )
      );

      const toInsert = tasksInRange
        .filter((t: any) => {
          const key = `${t.id}|${new Date(t.next_due_date).toISOString()}`;
          return !existingKey.has(key);
        })
        .map((t: any) => ({
          task_id: t.id,
          due_date: t.next_due_date,
          is_completed: t.is_completed,
          completed_at: t.completed_at || null,
        }));

      if (toInsert.length > 0) {
        await supabase.from("task_instances").insert(toInsert);
      }
    } catch (e) {
      console.error("ensureInstancesForRange error", e);
    }
  }
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

  // get upcoming tasks (not completed, due from start of today forward within specified time range)
  static async getUpcomingTasks(timeRange: number | "all" = 60): Promise<{
    data: Task[] | null;
    error: any;
  }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      // If "all" is selected, get all incomplete tasks due today or later (exclude overdue)
      if (timeRange === "all") {
        console.log(
          "📋 TaskService: Fetching all upcoming incomplete tasks (no time limit)"
        );
        const start = startOfDay(new Date());
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("is_completed", false)
          .gte("next_due_date", start.toISOString())
          .not("next_due_date", "is", null)
          .order("next_due_date", { ascending: true })
          .limit(200); // Higher limit for all tasks

        if (error) {
          console.error(
            "❌ TaskService: Error fetching all incomplete tasks:",
            error
          );
          throw error;
        }

        console.log(
          `✅ TaskService: Found ${
            data?.length || 0
          } upcoming tasks (all time ranges)`
        );
        return { data, error: null };
      }

      // Ensure timeRange is a valid number for date calculations
      const timeRangeDays = timeRange as number;
      if (typeof timeRangeDays !== "number" || timeRangeDays < 0) {
        throw new Error(`Invalid time range: ${timeRange}`);
      }

      // For specific time ranges, get future tasks within range (today to end date)
      const now = new Date();
      const endDate = addDays(now, timeRangeDays);
      const startOfToday = startOfDay(now);

      // Get future tasks (due from today up to the time range)
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_completed", false)
        .gte("next_due_date", startOfToday.toISOString())
        .lte("next_due_date", endDate.toISOString())
        .order("next_due_date", { ascending: true })
        .limit(100);

      if (error) throw error;
      // Project virtual future occurrences for recurring tasks up to endDate
      // This shows forthcoming instances without creating real DB rows
      const { data: recurringSeeds } = await supabase
        .from("tasks")
        .select(
          "id, title, description, category, priority, estimated_duration, is_recurring, recurrence_type, next_due_date, user_id, is_completed"
        )
        .eq("is_recurring", true);

      const existingKey = new Set(
        (data || []).map(
          (t: any) =>
            `${t.user_id}|${t.title}|${new Date(t.next_due_date).toISOString()}`
        )
      );

      const virtuals: any[] = [];
      if (recurringSeeds && Array.isArray(recurringSeeds)) {
        for (const seed of recurringSeeds) {
          if (!seed.recurrence_type || !seed.next_due_date) continue;
          // Start projecting from the next occurrence after the seed's next_due_date
          let projectionDate = new Date(
            TaskService.calculateNextDueDate(
              seed.recurrence_type,
              seed.next_due_date
            )
          );

          // Generate until endDate (respect timeRange window)
          while (projectionDate <= endDate) {
            const key = `${seed.user_id}|${
              seed.title
            }|${projectionDate.toISOString()}`;
            if (!existingKey.has(key)) {
              existingKey.add(key);
              virtuals.push({
                id: `virtual-${seed.id}-${projectionDate.toISOString()}`,
                user_id: seed.user_id,
                title: seed.title,
                description: seed.description,
                category: seed.category,
                priority: seed.priority,
                estimated_duration: seed.estimated_duration,
                is_recurring: true,
                recurrence_type: seed.recurrence_type,
                next_due_date: projectionDate.toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_completed: false,
                completed_at: null,
                last_completed_date: null,
                next_instance_date: null,
                is_virtual: true,
              });
            }

            // Step forward
            projectionDate = new Date(
              TaskService.calculateNextDueDate(
                seed.recurrence_type,
                projectionDate.toISOString()
              )
            );
          }
        }
      }

      const combined = [...(data || []), ...virtuals].sort(
        (a, b) =>
          new Date(a.next_due_date).getTime() -
          new Date(b.next_due_date).getTime()
      );

      return { data: combined, error: null };
    } catch (error) {
      console.error("Error fetching upcoming tasks:", error);
      return { data: null, error };
    }
  }

  // Instance-based upcoming fetch (preferred for recurring support)
  static async getUpcomingInstances(timeRange: number | "all" = 60): Promise<{
    data: Task[] | null;
    error: any;
  }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const start = startOfDay(new Date());
      let query = supabase
        .from("task_instances")
        .select(
          `*, task:tasks(id, user_id, title, description, category, priority, estimated_duration, is_recurring, recurrence_type, created_at, updated_at)`
        )
        .eq("is_completed", false)
        .gte("due_date", start.toISOString())
        .order("due_date", { ascending: true });

      let end = undefined as string | undefined;
      if (timeRange !== "all") {
        const e = addDays(new Date(), timeRange as number);
        end = e.toISOString();
        query = query.lte("due_date", end);
      }

      // Backfill instances for tasks in range so lists/calendar see them
      await TaskService.ensureInstancesForRange(
        start.toISOString(),
        end || addDays(new Date(), 365).toISOString(),
        false
      );

      const { data, error } = await query.limit(500);
      if (error) throw error;

      const seen = new Set<string>();
      const unique = (data || []).filter((i: any) => {
        const key = `${i.task_id}|${new Date(i.due_date).toISOString()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const mapped: Task[] = unique.map((i: any) => ({
        id: i.task?.id,
        instance_id: i.id,
        user_id: i.task?.user_id,
        title: i.task?.title,
        description: i.task?.description,
        category: i.task?.category,
        priority: i.task?.priority,
        estimated_duration: i.task?.estimated_duration,
        is_recurring: !!i.task?.is_recurring,
        recurrence_type: i.task?.recurrence_type,
        next_due_date: i.due_date,
        created_at: i.task?.created_at || i.created_at,
        updated_at: i.task?.updated_at || i.created_at,
        is_completed: i.is_completed,
        completed_at: i.completed_at,
      }));

      return { data: mapped, error: null };
    } catch (error) {
      console.error("Error fetching upcoming instances:", error);
      return { data: null, error };
    }
  }

  static async getCompletedInstances(
    lookbackDays: number | "all" = 14
  ): Promise<{
    data: Task[] | null;
    error: any;
  }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }
    try {
      const now = new Date();
      let query = supabase
        .from("task_instances")
        .select(
          `*, task:tasks(id, user_id, title, description, category, priority, estimated_duration, is_recurring, recurrence_type, created_at, updated_at)`
        )
        .eq("is_completed", true)
        .order("completed_at", { ascending: false });
      if (lookbackDays !== "all") {
        const from = addDays(now, -(lookbackDays as number));
        query = query.gte("completed_at", from.toISOString());
      }
      const { data, error } = await query.limit(500);
      if (error) throw error;
      const mapped: Task[] = (data || []).map((i: any) => ({
        id: i.task?.id,
        instance_id: i.id,
        user_id: i.task?.user_id,
        title: i.task?.title,
        description: i.task?.description,
        category: i.task?.category,
        priority: i.task?.priority,
        estimated_duration: i.task?.estimated_duration,
        is_recurring: !!i.task?.is_recurring,
        recurrence_type: i.task?.recurrence_type,
        next_due_date: i.due_date,
        created_at: i.task?.created_at || i.created_at,
        updated_at: i.task?.updated_at || i.created_at,
        is_completed: i.is_completed,
        completed_at: i.completed_at,
      }));
      return { data: mapped, error: null };
    } catch (error) {
      console.error("Error fetching completed instances:", error);
      return { data: null, error };
    }
  }

  static async getOverdueInstances(lookbackDays: number | "all" = 14): Promise<{
    data: Task[] | null;
    error: any;
  }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }
    try {
      const start = startOfDay(new Date());
      let query = supabase
        .from("task_instances")
        .select(
          `*, task:tasks(id, user_id, title, description, category, priority, estimated_duration, is_recurring, recurrence_type, created_at, updated_at)`
        )
        .eq("is_completed", false)
        .lt("due_date", start.toISOString())
        .order("due_date", { ascending: true });
      if (lookbackDays !== "all") {
        const from = addDays(start, -(lookbackDays as number));
        query = query.gte("due_date", from.toISOString());
      }
      const { data, error } = await query.limit(500);
      if (error) throw error;
      const mapped: Task[] = (data || []).map((i: any) => ({
        id: i.task?.id,
        instance_id: i.id,
        user_id: i.task?.user_id,
        title: i.task?.title,
        description: i.task?.description,
        category: i.task?.category,
        priority: i.task?.priority,
        estimated_duration: i.task?.estimated_duration,
        is_recurring: !!i.task?.is_recurring,
        recurrence_type: i.task?.recurrence_type,
        next_due_date: i.due_date,
        created_at: i.task?.created_at || i.created_at,
        updated_at: i.task?.updated_at || i.created_at,
        is_completed: i.is_completed,
        completed_at: i.completed_at,
      }));
      return { data: mapped, error: null };
    } catch (error) {
      console.error("Error fetching overdue instances:", error);
      return { data: null, error };
    }
  }

  static async getInstancesInRange(
    startISO: string,
    endISO: string,
    includeCompleted: boolean = true
  ): Promise<{ data: Task[] | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }
    try {
      // Backfill instances for tasks in range
      await TaskService.ensureInstancesForRange(
        startISO,
        endISO,
        includeCompleted
      );

      let query = supabase
        .from("task_instances")
        .select(
          `*, task:tasks(id, user_id, title, description, category, priority, estimated_duration, is_recurring, recurrence_type, created_at, updated_at)`
        )
        .gte("due_date", startISO)
        .lte("due_date", endISO)
        .order("due_date", { ascending: true });
      if (!includeCompleted) {
        query = query.eq("is_completed", false);
      }
      const { data, error } = await query.limit(1000);
      if (error) throw error;
      // De-duplicate by (task_id, due_date)
      const seen = new Set<string>();
      const unique = (data || []).filter((i: any) => {
        const key = `${i.task_id}|${new Date(i.due_date).toISOString()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const mapped: Task[] = unique.map((i: any) => ({
        id: i.task?.id,
        instance_id: i.id,
        user_id: i.task?.user_id,
        title: i.task?.title,
        description: i.task?.description,
        category: i.task?.category,
        priority: i.task?.priority,
        estimated_duration: i.task?.estimated_duration,
        is_recurring: !!i.task?.is_recurring,
        recurrence_type: i.task?.recurrence_type,
        next_due_date: i.due_date,
        created_at: i.task?.created_at || i.created_at,
        updated_at: i.task?.updated_at || i.created_at,
        is_completed: i.is_completed,
        completed_at: i.completed_at,
      }));
      return { data: mapped, error: null };
    } catch (error) {
      console.error("Error fetching instances in range:", error);
      return { data: null, error };
    }
  }

  static async getInstanceById(
    instanceId: string
  ): Promise<{ data: Task | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }
    try {
      const { data, error } = await supabase
        .from("task_instances")
        .select(
          `*, task:tasks(id, user_id, title, description, category, priority, estimated_duration, is_recurring, recurrence_type, created_at, updated_at)`
        )
        .eq("id", instanceId)
        .single();
      if (error) throw error;
      const mapped: Task = {
        id: data.task?.id,
        instance_id: data.id,
        user_id: data.task?.user_id,
        title: data.task?.title,
        description: data.task?.description,
        category: data.task?.category,
        priority: data.task?.priority,
        estimated_duration: data.task?.estimated_duration,
        is_recurring: !!data.task?.is_recurring,
        recurrence_type: data.task?.recurrence_type,
        next_due_date: data.due_date,
        created_at: data.task?.created_at || data.created_at,
        updated_at: data.task?.updated_at || data.created_at,
        is_completed: data.is_completed,
        completed_at: data.completed_at,
      } as Task;
      return { data: mapped, error: null };
    } catch (error) {
      console.error("Error fetching instance by id:", error);
      return { data: null, error };
    }
  }

  static async completeInstance(instanceId: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("task_instances")
        .update({ is_completed: true, completed_at: now })
        .eq("id", instanceId)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error completing instance:", error);
      return { data: null, error };
    }
  }

  static async uncompleteInstance(instanceId: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    try {
      const { data, error } = await supabase
        .from("task_instances")
        .update({ is_completed: false, completed_at: null })
        .eq("id", instanceId)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error uncompleting instance:", error);
      return { data: null, error };
    }
  }

  static async updateInstanceDueDate(instanceId: string, newDueISO: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    try {
      const { data, error } = await supabase
        .from("task_instances")
        .update({ due_date: newDueISO })
        .eq("id", instanceId)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error updating instance due date:", error);
      return { data: null, error };
    }
  }

  static async deleteInstance(instanceId: string): Promise<{ error: any }> {
    if (!supabase) return { error: { message: "Supabase not configured" } };
    try {
      const { error } = await supabase
        .from("task_instances")
        .delete()
        .eq("id", instanceId);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error deleting instance:", error);
      return { error };
    }
  }

  static async shiftFutureInstances(
    taskId: string,
    fromDueDateISO: string,
    deltaMs: number
  ) {
    if (!supabase) return { error: { message: "Supabase not configured" } };
    try {
      const { data: instances, error } = await supabase
        .from("task_instances")
        .select("id, due_date")
        .eq("task_id", taskId)
        .gte("due_date", fromDueDateISO)
        .order("due_date", { ascending: true });
      if (error) throw error;
      if (!instances || instances.length === 0) return { error: null };
      // Perform per-row updates to avoid accidental inserts under RLS
      for (const i of instances) {
        const newDue = new Date(
          new Date(i.due_date).getTime() + deltaMs
        ).toISOString();
        const { error: updErr } = await supabase
          .from("task_instances")
          .update({ due_date: newDue })
          .eq("id", i.id);
        if (updErr) throw updErr;
      }
      return { error: null };
    } catch (e) {
      console.error("Error shifting future instances:", e);
      return { error: e };
    }
  }

  // get overdue tasks (not completed, due before the start of today)
  // If lookbackDays is a number, only include tasks with next_due_date >= startOfToday - lookbackDays
  static async getOverdueTasks(
    lookbackDays: number | "all" = 14
  ): Promise<{ data: Task[] | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const start = startOfDay(new Date());
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("is_completed", false)
        .lt("next_due_date", start.toISOString())
        .order("next_due_date", { ascending: true });

      if (lookbackDays !== "all") {
        const from = addDays(start, -lookbackDays);
        query = query.gte("next_due_date", from.toISOString());
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching overdue tasks:", error);
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
        console.log(
          "📋 TaskService: Fetching all completed tasks (no time limit)"
        );
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("is_completed", true)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(200); // Higher limit for all tasks

        if (error) {
          console.error(
            "❌ TaskService: Error fetching all completed tasks:",
            error
          );
          throw error;
        }

        console.log(
          `✅ TaskService: Found ${
            data?.length || 0
          } completed tasks (all time ranges)`
        );
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

  // get completed tasks with lookback window separate from upcoming filter
  static async getCompletedTasksLookback(
    lookbackDays: number | "all" = 14
  ): Promise<{ data: Task[] | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      if (lookbackDays === "all") {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("is_completed", true)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(500);
        if (error) throw error;
        return { data, error: null };
      }

      const now = new Date();
      const from = addDays(now, -lookbackDays);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_completed", true)
        .gte("completed_at", from.toISOString())
        .lte("completed_at", now.toISOString())
        .order("completed_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching completed tasks (lookback):", error);
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

  static async deleteAllTasks(): Promise<{
    error: any;
    tasksDeleted?: number;
    instancesDeleted?: number;
  }> {
    if (!supabase) {
      return { error: { message: "Supabase not configured" } };
    }
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error("Not authenticated");

      // Fetch user's task ids to scope child deletions under RLS
      const { data: userTasks, error: fetchErr } = await supabase
        .from("tasks")
        .select("id")
        .eq("user_id", user.id);
      if (fetchErr) throw fetchErr;

      const taskIds = (userTasks || []).map((t: any) => t.id);
      const tasksCount = taskIds.length;
      let instancesCount = 0;

      if (taskIds.length > 0) {
        // Count instances first
        const { count: instCount, error: instCountErr } = await supabase
          .from("task_instances")
          .select("id", { count: "exact", head: true })
          .in("task_id", taskIds);
        if (instCountErr) throw instCountErr;
        instancesCount = instCount || 0;

        // Delete instances first
        const { error: instErr } = await supabase
          .from("task_instances")
          .delete()
          .in("task_id", taskIds);
        if (instErr) throw instErr;
      }

      // Delete all tasks for this user
      const { error: tasksErr } = await supabase
        .from("tasks")
        .delete()
        .eq("user_id", user.id);
      if (tasksErr) throw tasksErr;

      return {
        error: null,
        tasksDeleted: tasksCount,
        instancesDeleted: instancesCount,
      };
    } catch (error) {
      console.error("Error deleting all tasks:", error);
      return { error };
    }
  }

  // get task statistics for dashboard
  static async getTaskStats(): Promise<{ data: any | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      // Get total tasks (series templates)
      const { count: totalTasksCount, error: totalError } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true });
      if (totalError) throw totalError;

      // Use task_instances for dynamic stats so they reflect instance changes immediately
      const start = startOfDay(new Date());
      const today = start;
      const tomorrow = addDays(today, 1);
      const nextWeek = addWeeks(today, 1);

      // Completed instances
      const { count: completedInstancesCount, error: completedInstancesError } =
        await supabase
          .from("task_instances")
          .select("id", { count: "exact", head: true })
          .eq("is_completed", true);
      if (completedInstancesError) throw completedInstancesError;

      // Total instances (all occurrences regardless of status or filters)
      const { count: totalInstancesCount, error: totalInstancesError } =
        await supabase
          .from("task_instances")
          .select("id", { count: "exact", head: true });
      if (totalInstancesError) throw totalInstancesError;

      // Overdue instances (incomplete and due before today)
      const { count: overdueInstancesCount, error: overdueInstancesError } =
        await supabase
          .from("task_instances")
          .select("id", { count: "exact", head: true })
          .eq("is_completed", false)
          .lt("due_date", today.toISOString());
      if (overdueInstancesError) throw overdueInstancesError;

      // Due today instances (incomplete)
      const { count: todayInstancesCount, error: todayInstancesError } =
        await supabase
          .from("task_instances")
          .select("id", { count: "exact", head: true })
          .eq("is_completed", false)
          .gte("due_date", today.toISOString())
          .lt("due_date", tomorrow.toISOString());
      if (todayInstancesError) throw todayInstancesError;

      // Due this week instances (incomplete)
      const { count: thisWeekInstancesCount, error: thisWeekInstancesError } =
        await supabase
          .from("task_instances")
          .select("id", { count: "exact", head: true })
          .eq("is_completed", false)
          .gte("due_date", today.toISOString())
          .lt("due_date", nextWeek.toISOString());
      if (thisWeekInstancesError) throw thisWeekInstancesError;

      const stats = {
        total: totalTasksCount || 0,
        completed: completedInstancesCount || 0,
        overdue: overdueInstancesCount || 0,
        dueToday: todayInstancesCount || 0,
        thisWeek: thisWeekInstancesCount || 0,
        completionRate: totalTasksCount
          ? Math.round(((completedInstancesCount || 0) / totalTasksCount) * 100)
          : 0,
      };

      // Log overall totals regardless of current UI filters
      console.log(
        `📊 Task totals — occurrences: ${
          totalInstancesCount || 0
        }, templates: ${totalTasksCount || 0}`
      );

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
