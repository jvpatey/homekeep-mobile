import {
  MaintenanceTask,
  RoutineInstance,
  MaintenanceRoutine,
  InstanceWithRoutine,
} from "../types/maintenance";

export class MaintenanceDataMapper {
  // Maps a routine instance with its routine data to a MaintenanceTask
  static mapInstanceToTask(instance: InstanceWithRoutine): MaintenanceTask {
    return {
      id: instance.routine.id,
      instance_id: instance.id,
      user_id: instance.routine.user_id,
      title: instance.routine.title,
      description: instance.routine.description,
      category: instance.routine.category,
      priority: instance.routine.priority,
      estimated_duration_minutes: instance.routine.estimated_duration_minutes,
      interval_days: instance.routine.interval_days,
      start_date: instance.routine.start_date,
      due_date: instance.due_date,
      is_completed: instance.is_completed,
      is_overdue: instance.is_overdue,
      completed_at: instance.completed_at,
      notes: instance.notes,
      created_at: instance.routine.created_at,
      updated_at: instance.routine.updated_at,
      is_active: instance.routine.is_active,
      source_plan_id: instance.routine.source_plan_id ?? null,
      equipment_id: instance.routine.equipment_id ?? null,
      cost_amount: instance.cost_amount ?? null,
      labor_type: instance.labor_type ?? null,
      photo_storage_path: instance.photo_storage_path ?? null,
      completed_by: instance.completed_by ?? null,
      completed_by_name: instance.completed_by_name ?? null,
      completed_by_avatar_style: instance.completed_by_avatar_style ?? null,
    };
  }

  // Maps multiple instances to tasks
  static mapInstancesToTasks(
    instances: Array<InstanceWithRoutine | { routine?: MaintenanceRoutine | null }>
  ): MaintenanceTask[] {
    return (instances || []).filter(this.hasRoutine).map((instance) =>
      this.mapInstanceToTask(instance)
    );
  }

  /**
   * PostgREST embed filters like `routine.is_active=eq.true` leave the parent
   * instance row with `routine: null` instead of omitting it. Skip those.
   */
  private static hasRoutine(
    instance: InstanceWithRoutine | { routine?: MaintenanceRoutine | null }
  ): instance is InstanceWithRoutine {
    return instance.routine != null && instance.routine.id != null;
  }
}
