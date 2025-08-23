# HomeKeep Mobile Database Migration Guide

## Overview

This guide explains the migration from the old task-based system to the new maintenance routine system that better aligns with your dashboard features.

## What Changed

### Old System (Tasks)

- `tasks` table with individual task records
- `task_instances` table for recurring occurrences
- Simple task management

### New System (Maintenance Routines)

- `maintenance_routines` table for defining maintenance schedules
- `routine_instances` table for individual occurrences
- `profiles` table for extended user information
- Automatic instance generation and management
- Better category and priority management
- Enhanced filtering and statistics

## Database Schema

### Tables

#### `maintenance_routines`

- **id**: UUID (Primary Key)
- **user_id**: UUID (References auth.users)
- **title**: Text (Required)
- **description**: Text (Optional)
- **category**: Text (HVAC, PLUMBING, ELECTRICAL, etc.)
- **priority**: Text (low, medium, high, urgent)
- **estimated_duration_minutes**: Integer (Default: 30)
- **interval_days**: Integer (Required, default: 30)
- **start_date**: Timestamp (Required)
- **is_active**: Boolean (Default: true)
- **created_at**: Timestamp
- **updated_at**: Timestamp

#### `routine_instances`

- **id**: UUID (Primary Key)
- **routine_id**: UUID (References maintenance_routines)
- **due_date**: Timestamp (Required)
- **completed_at**: Timestamp (Optional)
- **is_completed**: Boolean (Default: false)
- **is_overdue**: Boolean (Default: false)
- **notes**: Text (Optional)
- **created_at**: Timestamp

#### `profiles`

- **id**: UUID (Primary Key, References auth.users)
- **email**: Text (Unique)
- **full_name**: Text
- **avatar_url**: Text
- **created_at**: Timestamp
- **updated_at**: Timestamp

### Key Features

1. **Automatic Instance Generation**: When you create a maintenance routine, the system automatically creates instances for the next year
2. **Overdue Management**: Automatic detection and flagging of overdue instances
3. **Recurring Logic**: When an instance is completed, the next one is automatically created
4. **Row Level Security**: Users can only access their own data
5. **Performance Indexes**: Optimized queries for common operations

## Implementation Steps

### 1. Database Setup

1. **Run the schema file** in your Supabase SQL editor:

   ```sql
   -- Copy and paste the contents of schema.sql
   ```

2. **Verify the setup** by running these queries:
   ```sql
   -- Check if tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('maintenance_routines', 'routine_instances', 'profiles');
   ```

### 2. Update Your Application

1. **Replace the old service**:

   - Remove `src/services/taskService.ts`
   - Use `src/services/maintenanceService.ts` instead

2. **Update types**:

   - Remove `src/types/task.ts`
   - Use `src/types/maintenance.ts` instead

3. **Update imports** throughout your codebase:

   ```typescript
   // Old
   import { TaskService } from "../services/taskService";
   import { Task } from "../types/task";

   // New
   import { MaintenanceService } from "../services/maintenanceService";
   import { MaintenanceTask } from "../types/maintenance";
   ```

### 3. Update Components

#### Dashboard Component

```typescript
// Old
interface NewDashboardProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
  // ...
}

// New
interface NewDashboardProps {
  tasks: MaintenanceTask[];
  onCompleteTask: (instanceId: string) => void;
  // ...
}
```

#### Create Task Modal

```typescript
// Old
interface TaskSeriesForm {
  title: string;
  category: string;
  interval: "weekly" | "monthly" | "yearly" | "custom";
  // ...
}

// New
interface MaintenanceRoutineForm {
  title: string;
  category: MaintenanceCategory;
  interval_days: number;
  // ...
}
```

### 4. Update Context and Hooks

#### TasksContext

```typescript
// Old
import { Task, CreateTaskData, UpdateTaskData } from "../types/task";

// New
import {
  MaintenanceTask,
  CreateMaintenanceRoutineData,
  UpdateMaintenanceRoutineData,
} from "../types/maintenance";
```

#### useTasks Hook

```typescript
// Old
const { data: tasks, error } = await TaskService.getTasks();

// New
const { data: tasks, error } = await MaintenanceService.getMaintenanceTasks();
```

## API Methods

### Creating Maintenance Routines

```typescript
const { data, error } = await MaintenanceService.createMaintenanceRoutine({
  title: "Change HVAC Filter",
  description: "Replace the air filter in the HVAC system",
  category: "HVAC",
  priority: "medium",
  estimated_duration_minutes: 15,
  interval_days: 90,
  start_date: new Date().toISOString(),
});
```

### Getting Tasks

```typescript
// All tasks
const { data: allTasks } = await MaintenanceService.getMaintenanceTasks();

// Upcoming tasks
const { data: upcomingTasks } = await MaintenanceService.getUpcomingTasks(30);

// Overdue tasks
const { data: overdueTasks } = await MaintenanceService.getOverdueTasks();

// By category
const { data: hvacTasks } = await MaintenanceService.getTasksByCategory("HVAC");
```

### Completing Tasks

```typescript
// Complete an instance
const { data, error } = await MaintenanceService.completeInstance(
  instanceId,
  "Filter changed successfully"
);

// Uncomplete an instance
const { data, error } = await MaintenanceService.uncompleteInstance(instanceId);
```

### Statistics

```typescript
const { data: stats } = await MaintenanceService.getMaintenanceStats();
console.log(`You have ${stats.dueToday} tasks due today`);
```

## Benefits of the New System

1. **Better Performance**: Optimized queries and indexes
2. **Automatic Management**: Less manual work for recurring tasks
3. **Enhanced Features**: Better filtering, statistics, and user experience
4. **Scalability**: Designed to handle large numbers of maintenance routines
5. **Data Integrity**: Automatic triggers and constraints
6. **Security**: Row Level Security ensures data isolation

## Testing

After implementation:

1. **Create a test maintenance routine**
2. **Verify instances are automatically generated**
3. **Test completion and next instance creation**
4. **Verify overdue detection works**
5. **Test filtering and statistics**
6. **Verify RLS policies work correctly**

## Rollback Plan

If you need to rollback:

1. **Keep the old service file** until you're confident
2. **Test thoroughly** in a development environment
3. **Have a backup** of your current database
4. **Gradually migrate** components one by one

## Support

If you encounter issues:

1. Check the Supabase logs for SQL errors
2. Verify RLS policies are correctly applied
3. Ensure all required fields are provided when creating routines
4. Check that the database schema matches exactly

## Next Steps

1. **Run the schema.sql** in your Supabase project
2. **Update your service imports** to use MaintenanceService
3. **Update your type imports** to use maintenance types
4. **Test the basic functionality** (create, read, complete)
5. **Gradually update components** to use the new system
6. **Remove old code** once everything is working

The new system provides a much more robust foundation for your maintenance dashboard and will make it easier to add new features in the future.
