-- Simple setup script for HomeKeep Mobile App
-- This script checks what exists and only creates what's missing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if tables exist and create them if they don't
DO $$
BEGIN
    -- Create profiles table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE TABLE profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            avatar_url TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created profiles table';
    ELSE
        RAISE NOTICE 'Profiles table already exists';
    END IF;

    -- Create maintenance_routines table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'maintenance_routines') THEN
        CREATE TABLE maintenance_routines (
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
        RAISE NOTICE 'Created maintenance_routines table';
    ELSE
        RAISE NOTICE 'Maintenance_routines table already exists';
    END IF;

    -- Create routine_instances table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'routine_instances') THEN
        CREATE TABLE routine_instances (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            routine_id UUID NOT NULL REFERENCES maintenance_routines(id) ON DELETE CASCADE,
            due_date TIMESTAMPTZ NOT NULL,
            completed_at TIMESTAMPTZ,
            is_completed BOOLEAN DEFAULT false,
            is_overdue BOOLEAN DEFAULT false,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created routine_instances table';
    ELSE
        RAISE NOTICE 'Routine_instances table already exists';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_maintenance_routines_user_id ON maintenance_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_routines_category ON maintenance_routines(category);
CREATE INDEX IF NOT EXISTS idx_maintenance_routines_priority ON maintenance_routines(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_routines_is_active ON maintenance_routines(is_active);
CREATE INDEX IF NOT EXISTS idx_routine_instances_routine_id ON routine_instances(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_instances_due_date ON routine_instances(due_date);
CREATE INDEX IF NOT EXISTS idx_routine_instances_is_completed ON routine_instances(is_completed);
CREATE INDEX IF NOT EXISTS idx_routine_instances_is_overdue ON routine_instances(is_overdue);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_instances ENABLE ROW LEVEL SECURITY;

-- Create or replace functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION create_routine_instances()
RETURNS TRIGGER AS $$
DECLARE
    next_date TIMESTAMPTZ;
    instance_count INTEGER := 12;
BEGIN
    IF NEW.is_active = false THEN
        RETURN NEW;
    END IF;
    
    next_date := NEW.start_date;
    
    FOR i IN 1..instance_count LOOP
        INSERT INTO routine_instances (routine_id, due_date, is_overdue)
        VALUES (NEW.id, next_date, next_date < NOW())
        ON CONFLICT DO NOTHING;
        
        next_date := next_date + (NEW.interval_days || ' days')::INTERVAL;
    END LOOP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.due_date < NOW() AND NEW.is_completed = false THEN
        NEW.is_overdue = true;
    ELSE
        NEW.is_overdue = false;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION create_next_instance()
RETURNS TRIGGER AS $$
DECLARE
    routine_record maintenance_routines%ROWTYPE;
    next_due_date TIMESTAMPTZ;
BEGIN
    IF NEW.is_completed = true AND OLD.is_completed = false THEN
        SELECT * INTO routine_record FROM maintenance_routines WHERE id = NEW.routine_id;
        next_due_date := NEW.due_date + (routine_record.interval_days || ' days')::INTERVAL;
        
        INSERT INTO routine_instances (routine_id, due_date, is_overdue)
        VALUES (NEW.routine_id, next_due_date, next_due_date < NOW())
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS update_maintenance_routines_updated_at ON maintenance_routines;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS create_routine_instances_trigger ON maintenance_routines;
DROP TRIGGER IF EXISTS update_overdue_status_trigger ON routine_instances;
DROP TRIGGER IF EXISTS create_next_instance_trigger ON routine_instances;

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

-- Drop and recreate RLS policies
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

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own routines" ON maintenance_routines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routines" ON maintenance_routines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines" ON maintenance_routines
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines" ON maintenance_routines
    FOR DELETE USING (auth.uid() = user_id);

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

-- Verify setup
DO $$
BEGIN
    RAISE NOTICE 'Setup complete!';
    RAISE NOTICE 'Tables created: %', (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('maintenance_routines', 'routine_instances', 'profiles')
    );
    RAISE NOTICE 'Triggers created: %', (
        SELECT COUNT(*) FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
        AND event_object_table IN ('maintenance_routines', 'routine_instances', 'profiles')
    );
    RAISE NOTICE 'Functions created: %', (
        SELECT COUNT(*) FROM information_schema.routines 
        WHERE routine_schema = 'public'
        AND routine_name IN ('create_routine_instances', 'update_overdue_status', 'create_next_instance', 'update_updated_at_column')
    );
END $$;
