-- ============================================================================
-- ENABLE ANONYMOUS ACCESS FOR MVP
-- ============================================================================
-- This migration updates RLS policies to allow anonymous access for MVP.
-- Once authentication is implemented, these should be updated to require auth.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES TABLE - Allow anonymous read/write for MVP
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anonymous access to profiles" ON public.profiles;
CREATE POLICY "Allow anonymous access to profiles"
    ON public.profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- APPOINTMENTS TABLE - Allow anonymous read/write for MVP
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anonymous access to appointments" ON public.appointments;
CREATE POLICY "Allow anonymous access to appointments"
    ON public.appointments
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- BIOMARKER_RESULTS TABLE - Allow anonymous read/write for MVP
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anonymous access to biomarker_results" ON public.biomarker_results;
CREATE POLICY "Allow anonymous access to biomarker_results"
    ON public.biomarker_results
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- REFERENCE_RANGES TABLE - Allow anonymous read for MVP
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anonymous read access to reference_ranges" ON public.reference_ranges;
CREATE POLICY "Allow anonymous read access to reference_ranges"
    ON public.reference_ranges
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow anonymous write access to reference_ranges" ON public.reference_ranges;
CREATE POLICY "Allow anonymous write access to reference_ranges"
    ON public.reference_ranges
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
