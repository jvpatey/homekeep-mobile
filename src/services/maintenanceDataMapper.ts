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
    };
  }

  // Maps multiple instances to tasks
  static mapInstancesToTasks(
    instances: InstanceWithRoutine[]
  ): MaintenanceTask[] {
    return (instances || []).map(this.mapInstanceToTask);
  }
}
