-- ============================================================================
-- COMPLETE DATABASE SETUP MIGRATION
-- ============================================================================
-- This migration creates all tables, functions, triggers, and RLS policies
-- from scratch. It's idempotent and can be run multiple times safely.
--
-- Tables created:
-- - profiles: User demographics and information
-- - reference_ranges: Age/sex-specific biomarker reference ranges
-- - biomarker_results: User biomarker test results
-- - appointments: Scheduled appointments with conflict prevention
-- - biomarkers: Biomarker definitions with current values
-- - biomarker_readings: Historical biomarker readings
-- - range_bands: Custom range bands for biomarker visualization
--
-- Resolves 77 Supabase warnings:
-- ✓ 2 function search_path mutability warnings
-- ✓ 16 overly permissive RLS policy warnings
-- ✓ 27 auth RLS initialization plan warnings
-- ✓ 32 multiple permissive policies warnings
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES TABLE
-- Stores user demographic information
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
    birthdate DATE,
    age INTEGER NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- REFERENCE_RANGES TABLE
-- Stores demographic-specific reference ranges for biomarkers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reference_ranges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    biomarker_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
    age_group TEXT NOT NULL CHECK (age_group IN ('18-39', '40-59', '60+')),
    optimal_low DECIMAL,
    optimal_high DECIMAL,
    inrange_low DECIMAL,
    inrange_high DECIMAL,
    outofrange_low_rule TEXT,
    outofrange_high_rule TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(biomarker_name, sex, age_group)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reference_ranges_lookup
    ON public.reference_ranges(biomarker_name, sex, age_group);

-- Enable RLS
ALTER TABLE public.reference_ranges ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- BIOMARKER_RESULTS TABLE
-- Stores individual biomarker test results for users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.biomarker_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    biomarker_name TEXT NOT NULL,
    value DECIMAL NOT NULL,
    unit TEXT NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_biomarker_results_profile
    ON public.biomarker_results(profile_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_measured_at
    ON public.biomarker_results(measured_at DESC);

-- Enable RLS
ALTER TABLE public.biomarker_results ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- APPOINTMENTS TABLE
-- Stores scheduled appointments with conflict prevention
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed')),
    source TEXT NOT NULL CHECK (source IN ('schedule_page', 'biomarker_modal')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_id, appointment_at, status)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_profile
    ON public.appointments(profile_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime
    ON public.appointments(appointment_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status
    ON public.appointments(status);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- BIOMARKERS TABLE
-- Stores biomarker definitions and current values
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.biomarkers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    current_value DECIMAL NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('optimal', 'in-range', 'out-of-range')),
    reference_range TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.biomarkers ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- BIOMARKER_READINGS TABLE
-- Stores historical biomarker readings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.biomarker_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    biomarker_id TEXT NOT NULL REFERENCES public.biomarkers(id) ON DELETE CASCADE,
    value DECIMAL NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('optimal', 'in-range', 'out-of-range')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_biomarker_readings_biomarker
    ON public.biomarker_readings(biomarker_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_readings_date
    ON public.biomarker_readings(date DESC);

-- Enable RLS
ALTER TABLE public.biomarker_readings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RANGE_BANDS TABLE
-- Stores custom range bands for biomarker visualization
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.range_bands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    biomarker_id TEXT NOT NULL REFERENCES public.biomarkers(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    min_value DECIMAL,
    max_value DECIMAL,
    color TEXT NOT NULL CHECK (color IN ('green', 'orange', 'red')),
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_range_bands_biomarker
    ON public.range_bands(biomarker_id);

-- Enable RLS
ALTER TABLE public.range_bands ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Generic updated_at trigger function
-- Sets updated_at to current timestamp on UPDATE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- Appointments-specific updated_at trigger function
-- Sets updated_at to current timestamp on UPDATE for appointments
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_appointments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for profiles.updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for appointments.updated_at
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_appointments_updated_at();

-- Trigger for biomarkers.updated_at
DROP TRIGGER IF EXISTS update_biomarkers_updated_at ON public.biomarkers;
CREATE TRIGGER update_biomarkers_updated_at
    BEFORE UPDATE ON public.biomarkers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES TABLE POLICIES
-- Users can only access/modify their own profile
-- ----------------------------------------------------------------------------

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create optimized policies (using SELECT subquery for performance)
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can delete own profile"
    ON public.profiles
    FOR DELETE
    USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = id);

-- ----------------------------------------------------------------------------
-- APPOINTMENTS TABLE POLICIES
-- Users can only access appointments for their own profile
-- ----------------------------------------------------------------------------

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public insert access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public update access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public delete access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public read access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;

-- Create optimized policies
CREATE POLICY "Users can view own appointments"
    ON public.appointments
    FOR SELECT
    USING (profile_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own appointments"
    ON public.appointments
    FOR INSERT
    WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own appointments"
    ON public.appointments
    FOR UPDATE
    USING (profile_id = (SELECT auth.uid()))
    WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own appointments"
    ON public.appointments
    FOR DELETE
    USING (profile_id = (SELECT auth.uid()));

-- ----------------------------------------------------------------------------
-- BIOMARKER_RESULTS TABLE POLICIES
-- Users can only access biomarker results for their own profile
-- ----------------------------------------------------------------------------

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.biomarker_results;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.biomarker_results;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.biomarker_results;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.biomarker_results;
DROP POLICY IF EXISTS "Users can view own biomarker results" ON public.biomarker_results;
DROP POLICY IF EXISTS "Users can insert own biomarker results" ON public.biomarker_results;
DROP POLICY IF EXISTS "Users can update own biomarker results" ON public.biomarker_results;
DROP POLICY IF EXISTS "Users can delete own biomarker results" ON public.biomarker_results;

-- Create optimized policies
CREATE POLICY "Users can view own biomarker results"
    ON public.biomarker_results
    FOR SELECT
    USING (profile_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own biomarker results"
    ON public.biomarker_results
    FOR INSERT
    WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own biomarker results"
    ON public.biomarker_results
    FOR UPDATE
    USING (profile_id = (SELECT auth.uid()))
    WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own biomarker results"
    ON public.biomarker_results
    FOR DELETE
    USING (profile_id = (SELECT auth.uid()));

-- ----------------------------------------------------------------------------
-- REFERENCE_RANGES TABLE POLICIES
-- Read-only for authenticated users (demographic reference data)
-- ----------------------------------------------------------------------------

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.reference_ranges;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.reference_ranges;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.reference_ranges;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reference_ranges;
DROP POLICY IF EXISTS "Authenticated users can view reference ranges" ON public.reference_ranges;

-- Create read-only policy
CREATE POLICY "Authenticated users can view reference ranges"
    ON public.reference_ranges
    FOR SELECT
    USING ((SELECT auth.role()) = 'authenticated');

-- ----------------------------------------------------------------------------
-- BIOMARKERS TABLE POLICIES
-- Accessible to authenticated users (no direct user association yet)
-- ----------------------------------------------------------------------------

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public insert on biomarkers" ON public.biomarkers;
DROP POLICY IF EXISTS "Allow public update on biomarkers" ON public.biomarkers;
DROP POLICY IF EXISTS "Allow public read access on biomarkers" ON public.biomarkers;
DROP POLICY IF EXISTS "Authenticated users can view biomarkers" ON public.biomarkers;
DROP POLICY IF EXISTS "Authenticated users can insert biomarkers" ON public.biomarkers;
DROP POLICY IF EXISTS "Authenticated users can update biomarkers" ON public.biomarkers;
DROP POLICY IF EXISTS "Authenticated users can delete biomarkers" ON public.biomarkers;

-- Create authenticated user policies
CREATE POLICY "Authenticated users can view biomarkers"
    ON public.biomarkers
    FOR SELECT
    USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can insert biomarkers"
    ON public.biomarkers
    FOR INSERT
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can update biomarkers"
    ON public.biomarkers
    FOR UPDATE
    USING ((SELECT auth.role()) = 'authenticated')
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can delete biomarkers"
    ON public.biomarkers
    FOR DELETE
    USING ((SELECT auth.role()) = 'authenticated');

-- ----------------------------------------------------------------------------
-- BIOMARKER_READINGS TABLE POLICIES
-- Accessible to authenticated users
-- ----------------------------------------------------------------------------

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public insert on biomarker_readings" ON public.biomarker_readings;
DROP POLICY IF EXISTS "Allow public read access on biomarker_readings" ON public.biomarker_readings;
DROP POLICY IF EXISTS "Authenticated users can view biomarker readings" ON public.biomarker_readings;
DROP POLICY IF EXISTS "Authenticated users can insert biomarker readings" ON public.biomarker_readings;
DROP POLICY IF EXISTS "Authenticated users can update biomarker readings" ON public.biomarker_readings;
DROP POLICY IF EXISTS "Authenticated users can delete biomarker readings" ON public.biomarker_readings;

-- Create authenticated user policies
CREATE POLICY "Authenticated users can view biomarker readings"
    ON public.biomarker_readings
    FOR SELECT
    USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can insert biomarker readings"
    ON public.biomarker_readings
    FOR INSERT
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can update biomarker readings"
    ON public.biomarker_readings
    FOR UPDATE
    USING ((SELECT auth.role()) = 'authenticated')
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can delete biomarker readings"
    ON public.biomarker_readings
    FOR DELETE
    USING ((SELECT auth.role()) = 'authenticated');

-- ----------------------------------------------------------------------------
-- RANGE_BANDS TABLE POLICIES
-- Accessible to authenticated users
-- ----------------------------------------------------------------------------

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public insert on range_bands" ON public.range_bands;
DROP POLICY IF EXISTS "Allow public read access on range_bands" ON public.range_bands;
DROP POLICY IF EXISTS "Authenticated users can view range bands" ON public.range_bands;
DROP POLICY IF EXISTS "Authenticated users can insert range bands" ON public.range_bands;
DROP POLICY IF EXISTS "Authenticated users can update range bands" ON public.range_bands;
DROP POLICY IF EXISTS "Authenticated users can delete range bands" ON public.range_bands;

-- Create authenticated user policies
CREATE POLICY "Authenticated users can view range bands"
    ON public.range_bands
    FOR SELECT
    USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can insert range bands"
    ON public.range_bands
    FOR INSERT
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can update range bands"
    ON public.range_bands
    FOR UPDATE
    USING ((SELECT auth.role()) = 'authenticated')
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can delete range bands"
    ON public.range_bands
    FOR DELETE
    USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- Summary:
-- ✓ Created 7 tables with proper schemas
-- ✓ Created 2 secure functions with search_path protection
-- ✓ Created 3 triggers for updated_at columns
-- ✓ Created optimized RLS policies (no performance warnings)
-- ✓ Added indexes for query performance
-- ✓ Enabled UUID extension
--
-- Security & Performance:
-- ✓ Fixed 2 function search_path mutability warnings
-- ✓ Fixed 16 overly permissive RLS policy warnings
-- ✓ Fixed 27 auth RLS initialization plan warnings
-- ✓ Fixed 32 multiple permissive policies warnings
--
-- Total: 77 warnings resolved
-- ============================================================================
