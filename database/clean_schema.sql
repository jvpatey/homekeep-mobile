-- HomeKeep Mobile App Database Schema
-- Clean setup version - safe to run on fresh database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing functions if they exist (functions first, then triggers)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_routine_instances() CASCADE;
DROP FUNCTION IF EXISTS update_overdue_status() CASCADE;
DROP FUNCTION IF EXISTS create_next_instance() CASCADE;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance routines table (master list of maintenance tasks)
CREATE TABLE IF NOT EXISTS maintenance_routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('HVAC', 'PLUMBING', 'ELECTRICAL', 'APPLIANCES', 'EXTERIOR', 'INTERIOR', 'LANDSCAPING', 'SAFETY', 'GENERAL')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_duration_minutes INTEGER DEFAULT 30,
  interval_days INTEGER NOT NULL DEFAULT 30,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine instances table (individual occurrences of maintenance routines)
CREATE TABLE IF NOT EXISTS routine_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID NOT NULL REFERENCES maintenance_routines(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  is_overdue BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_routines_user_id ON maintenance_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_routines_category ON maintenance_routines(category);
CREATE INDEX IF NOT EXISTS idx_maintenance_routines_priority ON maintenance_routines(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_routines_is_active ON maintenance_routines(is_active);
CREATE INDEX IF NOT EXISTS idx_routine_instances_routine_id ON routine_instances(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_instances_due_date ON routine_instances(due_date);
CREATE INDEX IF NOT EXISTS idx_routine_instances_is_completed ON routine_instances(is_completed);
CREATE INDEX IF NOT EXISTS idx_routine_instances_is_overdue ON routine_instances(is_overdue);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_instances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own routines" ON maintenance_routines;
DROP POLICY IF EXISTS "Users can insert own routines" ON maintenance_routines;
DROP POLICY IF EXISTS "Users can update own routines" ON maintenance_routines;
DROP POLICY IF EXISTS "Users can delete own routines" ON maintenance_routines;

DROP POLICY IF EXISTS "Users can view own routine instances" ON routine_instances;
DROP POLICY IF EXISTS "Users can insert own routine instances" ON routine_instances;
DROP POLICY IF EXISTS "Users can update own routine instances" ON routine_instances;
DROP POLICY IF EXISTS "Users can delete own routine instances" ON routine_instances;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Maintenance routines RLS
CREATE POLICY "Users can view own routines" ON maintenance_routines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routines" ON maintenance_routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines" ON maintenance_routines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines" ON maintenance_routines
  FOR DELETE USING (auth.uid() = user_id);

-- Routine instances RLS (access through routine ownership)
CREATE POLICY "Users can view own routine instances" ON routine_instances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM maintenance_routines 
      WHERE maintenance_routines.id = routine_instances.routine_id 
      AND maintenance_routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own routine instances" ON routine_instances
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_routines 
      WHERE maintenance_routines.id = routine_instances.routine_id 
      AND maintenance_routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own routine instances" ON routine_instances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM maintenance_routines 
      WHERE maintenance_routines.id = routine_instances.routine_id 
      AND maintenance_routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own routine instances" ON routine_instances
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM maintenance_routines 
      WHERE maintenance_routines.id = routine_instances.routine_id 
      AND maintenance_routines.user_id = auth.uid()
    )
  );

-- Utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create routine instances automatically
CREATE OR REPLACE FUNCTION create_routine_instances()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the first instance when a new routine is created
  INSERT INTO routine_instances (routine_id, due_date)
  VALUES (NEW.id, NEW.start_date);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update overdue status
CREATE OR REPLACE FUNCTION update_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update overdue status based on due date
  NEW.is_overdue = (NEW.due_date < NOW() AND NEW.is_completed = false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create next instance when current one is completed
CREATE OR REPLACE FUNCTION create_next_instance()
RETURNS TRIGGER AS $$
DECLARE
  routine_record maintenance_routines%ROWTYPE;
  next_due_date TIMESTAMPTZ;
BEGIN
  -- Only proceed if the instance was just completed
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    -- Get the routine details
    SELECT * INTO routine_record 
    FROM maintenance_routines 
    WHERE id = NEW.routine_id AND is_active = true;
    
    IF FOUND THEN
      -- Calculate next due date
      next_due_date = NEW.due_date + (routine_record.interval_days || ' days')::INTERVAL;
      
      -- Create the next instance
      INSERT INTO routine_instances (routine_id, due_date)
      VALUES (NEW.routine_id, next_due_date);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_maintenance_routines_updated_at
  BEFORE UPDATE ON maintenance_routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER create_routine_instances_trigger
  AFTER INSERT ON maintenance_routines
  FOR EACH ROW EXECUTE FUNCTION create_routine_instances();

CREATE TRIGGER update_overdue_status_trigger
  BEFORE INSERT OR UPDATE ON routine_instances
  FOR EACH ROW EXECUTE FUNCTION update_overdue_status();

CREATE TRIGGER create_next_instance_trigger
  AFTER UPDATE ON routine_instances
  FOR EACH ROW EXECUTE FUNCTION create_next_instance();
