# Database Migrations

This directory contains Supabase database migrations for the biomarker tracking application.

## Migration File

### `20260131_complete_database_setup.sql`

**Comprehensive database setup migration** that creates everything needed from scratch:

#### Tables Created (7 total)
1. **profiles** - User demographics and information
2. **reference_ranges** - Age/sex-specific biomarker reference ranges
3. **biomarker_results** - User biomarker test results
4. **appointments** - Scheduled appointments with conflict prevention
5. **biomarkers** - Biomarker definitions with current values
6. **biomarker_readings** - Historical biomarker readings
7. **range_bands** - Custom range bands for biomarker visualization

#### Functions & Triggers
- `update_updated_at_column()` - Generic trigger function for updated_at columns
- `update_appointments_updated_at()` - Appointments-specific trigger function
- 3 triggers for auto-updating timestamp columns

#### Security & Performance Features
- **Row Level Security (RLS)** enabled on all tables
- **Optimized RLS policies** using `(SELECT auth.uid())` pattern
- **Secure functions** with `SECURITY DEFINER` and `SET search_path = ''`
- **Indexes** on foreign keys and frequently queried columns
- **UUID extension** enabled for ID generation

#### Warnings Resolved
This migration fixes **77 Supabase advisor warnings**:
- ✓ 2 function search_path mutability warnings
- ✓ 16 overly permissive RLS policy warnings
- ✓ 27 auth RLS initialization plan warnings (performance)
- ✓ 32 multiple permissive policies warnings (performance)

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `20260131_complete_database_setup.sql`
4. Paste into the SQL Editor
5. Click **Run**

### Option 2: Supabase CLI

```bash
# Install CLI if needed
npm install -g supabase

# Link your project (one-time setup)
supabase link --project-ref YOUR_PROJECT_REF

# Apply all pending migrations
supabase db push
```

### Option 3: Using the Helper Script

```bash
# From project root
./supabase/apply-migration.sh
```

## Migration Features

### Idempotent Design
The migration can be run multiple times safely:
- Uses `CREATE TABLE IF NOT EXISTS`
- Uses `CREATE EXTENSION IF NOT EXISTS`
- Uses `CREATE OR REPLACE FUNCTION`
- Drops policies before recreating them
- Drops triggers before recreating them

### Foreign Keys & Constraints
- Proper CASCADE deletes (e.g., deleting a profile deletes their appointments)
- CHECK constraints for enum-like fields (status, sex, age_group)
- UNIQUE constraints to prevent duplicates
- NOT NULL constraints on required fields

### Indexes for Performance
- Primary keys on all tables
- Foreign key indexes for JOIN performance
- Composite indexes for common queries
- Date/timestamp indexes for range queries

## After Migration

### Verify Setup

Check that all tables were created:
```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- appointments
- biomarker_readings
- biomarker_results
- biomarkers
- profiles
- range_bands
- reference_ranges

### Check RLS Policies

```sql
-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verify Functions

```sql
-- List all functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

## Adding Seed Data

The migration creates the schema but doesn't include seed data. To add sample data:

### Via Supabase Dashboard
1. Go to **Table Editor**
2. Select a table
3. Click **Insert** → **Insert row**
4. Fill in the data

### Via SQL
```sql
-- Example: Insert a sample profile
INSERT INTO profiles (id, full_name, sex, age, birthdate)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'John Doe',
    'male',
    35,
    '1990-01-01'
);

-- Example: Insert reference ranges
INSERT INTO reference_ranges (
    biomarker_name, unit, sex, age_group,
    optimal_low, optimal_high, inrange_low, inrange_high
) VALUES (
    'Cholesterol', 'mg/dL', 'male', '18-39',
    150, 200, 200, 240
);
```

### Via API
Use the application's API endpoints to create data programmatically.

## Rollback

If you need to rollback (⚠️ **DESTROYS ALL DATA**):

```sql
-- Drop all tables (cascades to all data)
DROP TABLE IF EXISTS public.range_bands CASCADE;
DROP TABLE IF EXISTS public.biomarker_readings CASCADE;
DROP TABLE IF EXISTS public.biomarkers CASCADE;
DROP TABLE IF EXISTS public.biomarker_results CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.reference_ranges CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_appointments_updated_at() CASCADE;
```

## Troubleshooting

### Error: "relation already exists"
- The migration is idempotent, so this shouldn't happen
- If it does, check for partial migration runs
- Solution: Run the migration again (it will skip existing objects)

### Error: "permission denied"
- You need to use the `service_role` key, not the `anon` key
- Supabase Dashboard uses service_role automatically
- For CLI: Make sure you're linked to the correct project

### Policies Not Working
- Ensure RLS is enabled: `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;`
- Check that auth.uid() is available (requires Supabase Auth setup)
- During development, you can temporarily disable RLS for testing:
  ```sql
  ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;
  ```
  ⚠️ **Never do this in production!**

## Next Steps

After applying the migration:

1. ✅ Verify all tables exist in Supabase Dashboard
2. ✅ Check that RLS policies are active (Security Advisor should show no warnings)
3. ✅ Add seed data (sample profiles, reference ranges, etc.)
4. ✅ Test API endpoints to ensure they work with the schema
5. ✅ Set up Supabase Auth for production use

## Migration Maintenance

### Adding New Migrations

When making schema changes:

1. Create a new migration file: `YYYYMMDD_description.sql`
2. Use idempotent patterns (IF NOT EXISTS, OR REPLACE, etc.)
3. Test on a development project first
4. Document the changes in this README
5. Apply to production via CLI or Dashboard

### Best Practices

- Never edit existing migration files after they've been applied
- Always use transactions for complex migrations
- Test migrations on a copy of production data first
- Keep migrations small and focused
- Document breaking changes clearly
