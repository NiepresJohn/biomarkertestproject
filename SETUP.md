# Database Setup Instructions

## Quick Fix for Live Site Errors

Your live site is experiencing errors because:
1. The database has Row Level Security (RLS) policies that block anonymous access
2. The database has no seed data

## Supabase Folder Structure

```
supabase/
├── migrations/
│   ├── 20260131_complete_database_setup.sql    # Creates all tables and RLS policies
│   ├── 20260131_enable_anon_access.sql         # Enables anonymous access for MVP
│   └── README.md                                # Migration documentation
└── seed.sql                                     # Sample data for testing
```

### Step 1: Enable Anonymous Access (Required)

**Option A: Run the migration file (Recommended)**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Open and copy the contents of `supabase/migrations/20260131_enable_anon_access.sql`
5. Paste into the SQL Editor
6. Click "Run" or press Cmd/Ctrl + Enter

**Option B: Run SQL directly**

Copy and run this SQL in your Supabase SQL Editor:

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

### Step 2: Seed the Database

**Option A: Use the API endpoint**
1. After deploying, visit: https://biomarkertestproject.vercel.app/api/setup-database
2. Make a POST request (you can use curl, Postman, or browser console):
```bash
curl -X POST https://biomarkertestproject.vercel.app/api/setup-database
```

**Option B: Run SQL manually**

Copy and run the contents of `supabase/seed.sql` in your Supabase SQL Editor.

### Step 3: Verify

1. Visit https://biomarkertestproject.vercel.app
2. You should see:
   - Profile information for John Doe
   - 3 biomarkers with data
   - No errors in the console

---

## For Production: Add Authentication

**Important:** The anonymous access policies above are for MVP/testing only. For production, you should:

1. Implement authentication (Supabase Auth, NextAuth, etc.)
2. Remove the anonymous access policies
3. Use the proper auth-based policies from the original migration

---

## Files Created

- `supabase/migrations/20260131_complete_database_setup.sql` - Complete database schema
- `supabase/migrations/20260131_enable_anon_access.sql` - Enables anonymous access
- `supabase/seed.sql` - Sample data for testing
- `app/api/setup-database/route.ts` - API endpoint for database initialization

---

## Troubleshooting

### "No profile found" error
- Run Step 1 (Enable Anonymous Access)
- Run Step 2 (Seed the Database)

### "Failed to load biomarkers" error
- Make sure Step 1 is complete
- Check that reference ranges and biomarker results were created

### Still seeing errors?
- Check browser console for detailed error messages
- Verify environment variables in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
