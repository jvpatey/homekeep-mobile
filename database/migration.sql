-- Migration script to transition from old task system to new maintenance routine system
-- Run this after creating the new schema

-- Step 1: Create the new tables (if not already created)
-- (The schema.sql file should be run first)

-- Step 2: Migrate existing data (if you have any)
-- This section is optional and only needed if you have existing task data

-- Example migration for existing tasks (uncomment and modify if needed):
/*
-- Migrate existing tasks to maintenance_routines
INSERT INTO maintenance_routines (
  id,
  user_id,
  title,
  description,
  category,
  priority,
  estimated_duration_minutes,
  interval_days,
  start_date,
  is_active,
  created_at,
  updated_at
)
SELECT 
  id,
  user_id,
  title,
  description,
  COALESCE(category, 'GENERAL'),
  COALESCE(priority, 'medium'),
  COALESCE(estimated_duration, 30),
  CASE 
    WHEN recurrence_type = 'weekly' THEN 7
    WHEN recurrence_type = 'monthly' THEN 30
    WHEN recurrence_type = 'quarterly' THEN 90
    WHEN recurrence_type = 'yearly' THEN 365
    ELSE 30
  END,
  COALESCE(next_due_date, created_at),
  true,
  created_at,
  updated_at
FROM tasks
WHERE id NOT IN (SELECT id FROM maintenance_routines);

-- Migrate existing task instances to routine_instances
INSERT INTO routine_instances (
  id,
  routine_id,
  due_date,
  completed_at,
  is_completed,
  is_overdue,
  notes,
  created_at
)
SELECT 
  ti.id,
  ti.task_id,
  ti.due_date,
  ti.completed_at,
  ti.is_completed,
  ti.due_date < NOW() AND ti.is_completed = false,
  NULL,
  ti.created_at
FROM task_instances ti
WHERE ti.id NOT IN (SELECT id FROM routine_instances);
*/

-- Step 3: Update any existing RLS policies if needed
-- (The schema.sql file should handle this, but you can verify)

-- Step 4: Create indexes for better performance (if not already created)
-- (The schema.sql file should handle this, but you can verify)

-- Step 5: Verify the migration
-- Run these queries to verify the migration was successful:

/*
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('maintenance_routines', 'routine_instances', 'profiles');

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('maintenance_routines', 'routine_instances', 'profiles');

-- Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('maintenance_routines', 'routine_instances', 'profiles');

-- Check if functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('create_routine_instances', 'update_overdue_status', 'create_next_instance');
*/

-- Step 6: Clean up old tables (ONLY after verifying migration success)
-- WARNING: This will permanently delete old data
-- Uncomment these lines ONLY after you've verified everything works:

/*
-- Drop old tables (be very careful!)
-- DROP TABLE IF EXISTS task_instances CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;

-- Drop old functions if they exist
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
*/

-- Step 7: Update your application
-- After running this migration:
-- 1. Update your service imports to use MaintenanceService instead of TaskService
-- 2. Update your type imports to use maintenance types instead of task types
-- 3. Update your component props and state to use the new interfaces
-- 4. Test thoroughly before deploying to production

-- Notes:
-- - The new system automatically creates routine instances when routines are created
-- - The new system automatically handles overdue status
-- - The new system automatically creates next instances when current ones are completed
-- - All timestamps are automatically managed
-- - Row Level Security ensures users can only access their own data
