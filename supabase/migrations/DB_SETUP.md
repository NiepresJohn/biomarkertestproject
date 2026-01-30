# Database Setup Guide

Complete guide for setting up and managing the Supabase database for the biomarker tracking application.

---

## Quick Start (Fix Live Site Errors)

If your live site is showing errors, follow these steps:

### Step 1: Enable Anonymous Access (Required for MVP)

The database has Row Level Security (RLS) policies that block anonymous access. Run this migration first:

**Run in Supabase SQL Editor:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **SQL Editor**
3. Copy contents of `20260131_enable_anon_access.sql`
4. Paste and click **Run**

Or copy/paste this SQL:

```sql
-- Enable anonymous access for MVP
DROP POLICY IF EXISTS "Allow anonymous access to profiles" ON public.profiles;
CREATE POLICY "Allow anonymous access to profiles"
    ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous access to appointments" ON public.appointments;
CREATE POLICY "Allow anonymous access to appointments"
    ON public.appointments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous access to biomarker_results" ON public.biomarker_results;
CREATE POLICY "Allow anonymous access to biomarker_results"
    ON public.biomarker_results FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read access to reference_ranges" ON public.reference_ranges;
CREATE POLICY "Allow anonymous read access to reference_ranges"
    ON public.reference_ranges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous write access to reference_ranges" ON public.reference_ranges;
CREATE POLICY "Allow anonymous write access to reference_ranges"
    ON public.reference_ranges FOR ALL USING (true) WITH CHECK (true);
```

⚠️ **Important:** These policies are for MVP/testing only. For production, implement authentication and use the secure policies from the main migration.

### Step 2: Seed the Database

Add sample data to test the application:

**Option A: Use API Endpoint**
```bash
curl -X POST https://biomarkertestproject.vercel.app/api/setup-database
```

**Option B: Run SQL Manually**
1. Open `../seed.sql`
2. Copy all contents
3. Paste in Supabase SQL Editor
4. Click **Run**

### Step 3: Verify

Visit your site and verify:
- ✅ Profile information appears (John Doe)
- ✅ 3 biomarkers show data
- ✅ No console errors

---

## Folder Structure

```
supabase/
├── migrations/
│   ├── 20260131_complete_database_setup.sql    # Main schema migration
│   ├── 20260131_enable_anon_access.sql         # Anonymous access (MVP only)
│   └── DB_SETUP.md                             # This file
└── seed.sql                                     # Sample data
```

---

## Complete Migration Guide

### Migration: `20260131_complete_database_setup.sql`

Comprehensive database setup that creates everything from scratch.

#### Tables Created (7 total)

1. **profiles** - User demographics and information
2. **reference_ranges** - Age/sex-specific biomarker reference ranges
3. **biomarker_results** - User biomarker test results
4. **appointments** - Scheduled appointments with conflict prevention
5. **biomarkers** - Biomarker definitions with current values
6. **biomarker_readings** - Historical biomarker readings
7. **range_bands** - Custom range bands for biomarker visualization

#### Functions & Triggers

- `update_updated_at_column()` - Generic trigger function
- `update_appointments_updated_at()` - Appointments-specific trigger
- 3 automatic timestamp update triggers

#### Security & Performance

- **Row Level Security (RLS)** enabled on all tables
- **Optimized RLS policies** using `(SELECT auth.uid())` pattern
- **Secure functions** with `SECURITY DEFINER` and `SET search_path = ''`
- **Indexes** on foreign keys and frequently queried columns
- **UUID extension** for ID generation

#### Warnings Resolved

Fixes **77 Supabase advisor warnings**:
- ✓ 2 function search_path mutability warnings
- ✓ 16 overly permissive RLS policy warnings
- ✓ 27 auth RLS initialization plan warnings
- ✓ 32 multiple permissive policies warnings

### How to Apply Migrations

#### Option 1: Supabase Dashboard (Recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Copy migration file contents
4. Paste and click **Run**

#### Option 2: Supabase CLI

```bash
# Install CLI
npm install -g supabase

# Link project (one-time)
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

### Migration Features

**Idempotent Design** - Safe to run multiple times:
- `CREATE TABLE IF NOT EXISTS`
- `CREATE EXTENSION IF NOT EXISTS`
- `CREATE OR REPLACE FUNCTION`
- Drops policies/triggers before recreating

**Foreign Keys & Constraints:**
- CASCADE deletes (profile deletion cascades to appointments)
- CHECK constraints for enums (status, sex, age_group)
- UNIQUE constraints to prevent duplicates
- NOT NULL on required fields

**Performance Indexes:**
- Primary keys on all tables
- Foreign key indexes for JOINs
- Composite indexes for common queries
- Date/timestamp indexes for ranges

---

## After Migration

### Verify Setup

Check all tables exist:

```sql
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
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verify Functions

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

---

## Production Deployment

### Environment Variables

Ensure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

### Security Checklist

- [ ] Remove anonymous access policies
- [ ] Implement Supabase Auth or NextAuth
- [ ] Update RLS policies to use `auth.uid()`
- [ ] Enable MFA for Supabase dashboard access
- [ ] Review and test all RLS policies
- [ ] Set up database backups

---

## Troubleshooting

### Common Errors

**"No profile found" error**
- Run Step 1 (Enable Anonymous Access)
- Run Step 2 (Seed the Database)

**"Failed to load biomarkers" error**
- Verify Step 1 is complete
- Check that reference ranges exist in database

**"relation already exists"**
- Migration is idempotent, this shouldn't happen
- Safe to run again (it will skip existing objects)

**"permission denied"**
- Use `service_role` key, not `anon` key
- Dashboard uses service_role automatically
- For CLI: ensure correct project link

**Policies not working**
- Check RLS is enabled: `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;`
- Verify `auth.uid()` is available (requires Supabase Auth)
- For testing only: Temporarily disable RLS (⚠️ never in production)

**Environment variables not working**
- Check Vercel dashboard → Settings → Environment Variables
- Redeploy after changing variables
- Verify variable names match exactly

---

## Rollback

⚠️ **WARNING: Destroys all data**

```sql
-- Drop all tables
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

---

## Migration Maintenance

### Adding New Migrations

1. Create file: `YYYYMMDD_description.sql`
2. Use idempotent patterns
3. Test on development project first
4. Document changes in this file
5. Apply to production

### Best Practices

- Never edit applied migrations
- Use transactions for complex migrations
- Test on production data copy first
- Keep migrations small and focused
- Document breaking changes clearly

---

## Next Steps

After setup is complete:

1. ✅ Verify all tables exist
2. ✅ Check RLS policies are active
3. ✅ Add seed data
4. ✅ Test API endpoints
5. ✅ Set up authentication for production
6. ✅ Remove anonymous access policies
7. ✅ Configure database backups

---

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Project migrations: `supabase/migrations/`
- Seed data: `supabase/seed.sql`
- API endpoint: `/api/setup-database`
