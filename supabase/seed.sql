-- ============================================================================
-- SEED DATA FOR BIOMARKER TRACKER MVP
-- ============================================================================
-- This script populates the database with sample data for testing.
-- Run this after running the migrations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SAMPLE PROFILE
-- ----------------------------------------------------------------------------
INSERT INTO public.profiles (id, full_name, sex, birthdate, age, email, phone, address)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'John Doe',
    'male',
    '1985-06-15',
    38,
    'john.doe@example.com',
    '+1 (555) 123-4567',
    '123 Main St, San Francisco, CA 94102'
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    sex = EXCLUDED.sex,
    birthdate = EXCLUDED.birthdate,
    age = EXCLUDED.age,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address;

-- ----------------------------------------------------------------------------
-- REFERENCE RANGES - CREATININE
-- ----------------------------------------------------------------------------
-- Note: Creatinine uses ONLY optimal and out-of-range bands (no orange in-range band)
-- Standard Reference Range Male: 0.7-1.2, Female: 0.5-1.1 (informational only)
-- Graph Range: 0.1-5.0

-- Male, 18-39
INSERT INTO public.reference_ranges (biomarker_name, unit, sex, age_group, optimal_low, optimal_high, inrange_low, inrange_high, outofrange_low_rule, outofrange_high_rule)
VALUES ('Creatinine', 'mg/dL', 'male', '18-39', 0.75, 1.0, NULL, NULL, '< 0.75', '> 1.0')
ON CONFLICT (biomarker_name, sex, age_group) DO UPDATE SET
    optimal_low = EXCLUDED.optimal_low,
    optimal_high = EXCLUDED.optimal_high,
    inrange_low = EXCLUDED.inrange_low,
    inrange_high = EXCLUDED.inrange_high,
    outofrange_low_rule = EXCLUDED.outofrange_low_rule,
    outofrange_high_rule = EXCLUDED.outofrange_high_rule;

-- Male, 40-59
INSERT INTO public.reference_ranges (biomarker_name, unit, sex, age_group, optimal_low, optimal_high, inrange_low, inrange_high, outofrange_low_rule, outofrange_high_rule)
VALUES ('Creatinine', 'mg/dL', 'male', '40-59', 0.75, 1.0, NULL, NULL, '< 0.75', '> 1.0')
ON CONFLICT (biomarker_name, sex, age_group) DO UPDATE SET
    optimal_low = EXCLUDED.optimal_low,
    optimal_high = EXCLUDED.optimal_high,
    inrange_low = EXCLUDED.inrange_low,
    inrange_high = EXCLUDED.inrange_high,
    outofrange_low_rule = EXCLUDED.outofrange_low_rule,
    outofrange_high_rule = EXCLUDED.outofrange_high_rule;

-- Male, 60+
INSERT INTO public.reference_ranges (biomarker_name, unit, sex, age_group, optimal_low, optimal_high, inrange_low, inrange_high, outofrange_low_rule, outofrange_high_rule)
VALUES ('Creatinine', 'mg/dL', 'male', '60+', 0.75, 1.0, NULL, NULL, '< 0.75', '> 1.0')
ON CONFLICT (biomarker_name, sex, age_group) DO UPDATE SET
    optimal_low = EXCLUDED.optimal_low,
    optimal_high = EXCLUDED.optimal_high,
    inrange_low = EXCLUDED.inrange_low,
    inrange_high = EXCLUDED.inrange_high,
    outofrange_low_rule = EXCLUDED.outofrange_low_rule,
    outofrange_high_rule = EXCLUDED.outofrange_high_rule;

-- Female, 18-39
INSERT INTO public.reference_ranges (biomarker_name, unit, sex, age_group, optimal_low, optimal_high, inrange_low, inrange_high, outofrange_low_rule, outofrange_high_rule)
VALUES ('Creatinine', 'mg/dL', 'female', '18-39', 0.6, 0.9, NULL, NULL, '< 0.6', '> 0.9')
ON CONFLICT (biomarker_name, sex, age_group) DO UPDATE SET
    optimal_low = EXCLUDED.optimal_low,
    optimal_high = EXCLUDED.optimal_high,
    inrange_low = EXCLUDED.inrange_low,
    inrange_high = EXCLUDED.inrange_high,
    outofrange_low_rule = EXCLUDED.outofrange_low_rule,
    outofrange_high_rule = EXCLUDED.outofrange_high_rule;

-- Female, 40-59
INSERT INTO public.reference_ranges (biomarker_name, unit, sex, age_group, optimal_low, optimal_high, inrange_low, inrange_high, outofrange_low_rule, outofrange_high_rule)
VALUES ('Creatinine', 'mg/dL', 'female', '40-59', 0.6, 0.9, NULL, NULL, '< 0.6', '> 0.9')
ON CONFLICT (biomarker_name, sex, age_group) DO UPDATE SET
    optimal_low = EXCLUDED.optimal_low,
    optimal_high = EXCLUDED.optimal_high,
    inrange_low = EXCLUDED.inrange_low,
    inrange_high = EXCLUDED.inrange_high,
    outofrange_low_rule = EXCLUDED.outofrange_low_rule,
    outofrange_high_rule = EXCLUDED.outofrange_high_rule;

-- Female, 60+
INSERT INTO public.reference_ranges (biomarker_name, unit, sex, age_group, optimal_low, optimal_high, inrange_low, inrange_high, outofrange_low_rule, outofrange_high_rule)
VALUES ('Creatinine', 'mg/dL', 'female', '60+', 0.6, 0.9, NULL, NULL, '< 0.6', '> 0.9')
ON CONFLICT (biomarker_name, sex, age_group) DO UPDATE SET
    optimal_low = EXCLUDED.optimal_low,
    optimal_high = EXCLUDED.optimal_high,
    inrange_low = EXCLUDED.inrange_low,
    inrange_high = EXCLUDED.inrange_high,
    outofrange_low_rule = EXCLUDED.outofrange_low_rule,
    outofrange_high_rule = EXCLUDED.outofrange_high_rule;

-- ----------------------------------------------------------------------------
-- REFERENCE RANGES - CHOLESTEROL
-- ----------------------------------------------------------------------------
-- All demographics (same ranges)
INSERT INTO public.reference_ranges (biomarker_name, unit, sex, age_group, optimal_low, optimal_high, inrange_low, inrange_high, outofrange_low_rule, outofrange_high_rule)
VALUES
    ('Total Cholesterol', 'mg/dL', 'male', '18-39', 125, 170, 120, 200, '< 120', '> 200'),
    ('Total Cholesterol', 'mg/dL', 'male', '40-59', 125, 170, 120, 200, '< 120', '> 200'),
    ('Total Cholesterol', 'mg/dL', 'male', '60+', 125, 170, 120, 200, '< 120', '> 200'),
    ('Total Cholesterol', 'mg/dL', 'female', '18-39', 125, 170, 120, 200, '< 120', '> 200'),
    ('Total Cholesterol', 'mg/dL', 'female', '40-59', 125, 170, 120, 200, '< 120', '> 200'),
    ('Total Cholesterol', 'mg/dL', 'female', '60+', 125, 170, 120, 200, '< 120', '> 200')
ON CONFLICT (biomarker_name, sex, age_group) DO UPDATE SET
    optimal_low = EXCLUDED.optimal_low,
    optimal_high = EXCLUDED.optimal_high,
    inrange_low = EXCLUDED.inrange_low,
    inrange_high = EXCLUDED.inrange_high;

-- ----------------------------------------------------------------------------
-- REFERENCE RANGES - GLUCOSE
-- ----------------------------------------------------------------------------
INSERT INTO public.reference_ranges (biomarker_name, unit, sex, age_group, optimal_low, optimal_high, inrange_low, inrange_high, outofrange_low_rule, outofrange_high_rule)
VALUES
    ('Fasting Glucose', 'mg/dL', 'male', '18-39', 70, 85, 65, 99, '< 65', '> 99'),
    ('Fasting Glucose', 'mg/dL', 'male', '40-59', 70, 85, 65, 99, '< 65', '> 99'),
    ('Fasting Glucose', 'mg/dL', 'male', '60+', 70, 85, 65, 99, '< 65', '> 99'),
    ('Fasting Glucose', 'mg/dL', 'female', '18-39', 70, 85, 65, 99, '< 65', '> 99'),
    ('Fasting Glucose', 'mg/dL', 'female', '40-59', 70, 85, 65, 99, '< 65', '> 99'),
    ('Fasting Glucose', 'mg/dL', 'female', '60+', 70, 85, 65, 99, '< 65', '> 99')
ON CONFLICT (biomarker_name, sex, age_group) DO UPDATE SET
    optimal_low = EXCLUDED.optimal_low,
    optimal_high = EXCLUDED.optimal_high,
    inrange_low = EXCLUDED.inrange_low,
    inrange_high = EXCLUDED.inrange_high;

-- ----------------------------------------------------------------------------
-- BIOMARKER RESULTS FOR SAMPLE PROFILE
-- ----------------------------------------------------------------------------
INSERT INTO public.biomarker_results (profile_id, biomarker_name, value, unit, measured_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Creatinine', 0.9, 'mg/dL', NOW() - INTERVAL '7 days'),
    ('00000000-0000-0000-0000-000000000001', 'Total Cholesterol', 185, 'mg/dL', NOW() - INTERVAL '7 days'),
    ('00000000-0000-0000-0000-000000000001', 'Fasting Glucose', 92, 'mg/dL', NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- SAMPLE APPOINTMENTS
-- ----------------------------------------------------------------------------
INSERT INTO public.appointments (profile_id, appointment_at, status, source, notes)
VALUES
    ('00000000-0000-0000-0000-000000000001', NOW() + INTERVAL '14 days', 'booked', 'schedule_page', 'Routine checkup'),
    ('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days', 'completed', 'schedule_page', 'Annual physical')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED COMPLETE
-- ============================================================================
