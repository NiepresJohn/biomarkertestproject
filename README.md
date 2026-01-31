# Medical Dashboard - Biomarker Tracking & Appointment Scheduling

## Overview
Production-ready medical dashboard for tracking biomarker health metrics with appointment scheduling. Features profile-based reference ranges, interactive visualizations, and conflict-free appointment booking.

## Features
- **Biomarker Tracking**: Display health metrics with status indicators (Optimal, In Range, Out of Range)
- **Profile-Based Ranges**: Age and sex-specific reference ranges automatically applied
- **Interactive Graphs**: Click biomarker cards to view detailed visualizations with MUI Charts
- **Appointment Scheduling**: Time-slot based booking (9 AM - 5 PM, 30-minute intervals)
- **Conflict Detection**: Prevents double-booking with real-time validation
- **Calendar Highlighting**: Visual indicators for days with appointments
- **CSV Import**: Flexible CSV parsing for biomarker data with multiple range formats

## Technology Stack
- **Framework**: Next.js 16.1.6 (App Router) + React 19.2.3
- **Language**: TypeScript 5 with strict type checking
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **UI Libraries**: Material-UI (MUI) 7.3.7, Tailwind CSS v4
- **Charts**: MUI X Charts 8.26.0
- **Date Handling**: dayjs 1.11.19, MUI X Date Pickers 8.26.0
- **CSV Parsing**: PapaParse 5.5.3
- **Icons**: Lucide React, Tabler Icons React
- **Deployment**: Vercel-ready

## Prerequisites
- Node.js 18+ (LTS recommended)
- npm, yarn, or pnpm
- Supabase account (free tier sufficient)

## Getting Started

### 1. Clone Repository
```bash
git clone <repository-url>
cd biomarkertestproject
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create `.env.local` in the project root:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to get values:**
- Supabase Dashboard → Settings → API
- Copy "Project URL" and "anon public" key

### 4. Database Setup

**📖 Complete setup guide:** See `supabase/migrations/DB_SETUP.md` for detailed instructions.

**Quick Start:**

1. **Run the main migration** to create all tables and security policies:
   - Go to Supabase Dashboard → **SQL Editor**
   - Copy contents of `supabase/migrations/20260131_complete_database_setup.sql`
   - Paste and click **Run**

2. **Enable anonymous access** (for MVP - required for app to work):
   - Copy contents of `supabase/migrations/20260131_enable_anon_access.sql`
   - Paste in SQL Editor and click **Run**
   - ⚠️ Note: For production, implement authentication and remove this policy

3. **Add sample data** (choose one):
   - **Via API:** `curl -X POST https://your-site.vercel.app/api/setup-database`
   - **Via SQL:** Copy contents of `supabase/seed.sql` and run in SQL Editor

**What gets created:**
- **7 tables**: profiles, reference_ranges, biomarker_results, appointments, biomarkers, biomarker_readings, range_bands
- **2 secure functions**: update_updated_at_column(), update_appointments_updated_at()
- **3 triggers**: Automatic timestamp updates
- **Optimized RLS policies**: Secure, performant row-level security (77 warnings resolved)
- **Performance indexes**: Foreign keys and frequently queried columns

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
biomarkertestproject/
├── app/                              # Next.js App Router
│   ├── api/                         # API endpoints
│   │   ├── biomarkers/route.ts     # GET/POST biomarkers
│   │   ├── profile/route.ts        # GET/PATCH profile
│   │   ├── appointments/           # Appointment CRUD
│   │   └── setup-database/route.ts # Database initialization endpoint
│   ├── biomarkers/page.tsx         # Biomarkers list with filtering
│   ├── schedule/page.tsx           # Appointment calendar
│   ├── profile/page.tsx            # User profile management
│   ├── layout.tsx                  # Root layout with sidebar
│   └── page.tsx                    # Dashboard home
│
├── src/
│   ├── components/                 # React components
│   │   ├── BiomarkerCard.tsx      # Status card component
│   │   ├── BiomarkerModal.tsx     # Graph modal dialog
│   │   ├── BookingModal.tsx       # Appointment booking UI
│   │   ├── ScheduleCalendar.tsx   # MUI calendar with badges
│   │   └── [other components]
│   ├── contexts/
│   │   └── NotificationContext.tsx # Toast notification system
│   ├── hooks/
│   │   ├── useAppointments.ts     # Appointment CRUD hook
│   │   └── useCurrentProfile.ts   # Profile management hook
│   ├── lib/
│   │   ├── parseCSV.ts            # CSV parsing logic
│   │   ├── rangeSelection.ts      # Profile-based range selection
│   │   ├── biomarkerUtils.ts      # Range parsing utilities
│   │   └── supabase.ts            # Supabase client
│   ├── types/
│   │   ├── biomarker.ts           # Biomarker interfaces
│   │   └── appointment.ts         # Appointment interfaces
│   └── data/
│       └── biomarkers.csv         # Sample biomarker data
│
├── supabase/                       # Database configuration
│   ├── migrations/                # Database migrations
│   │   ├── 20260131_complete_database_setup.sql  # Full schema setup
│   │   ├── 20260131_enable_anon_access.sql       # Anonymous access (MVP)
│   │   └── DB_SETUP.md            # Complete database setup guide
│   └── seed.sql                   # Sample data for testing
│
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── tailwind.config.js              # Tailwind CSS config
└── next.config.js                  # Next.js config
```

## Database Schema

### Tables

**profiles** - User demographics
```sql
id UUID PRIMARY KEY
full_name TEXT
sex TEXT (male/female)
age INTEGER
birthdate DATE
email, phone, address (optional)
created_at TIMESTAMP
```

**reference_ranges** - Demographic-specific biomarker ranges
```sql
id UUID PRIMARY KEY
biomarker_name TEXT
unit TEXT
sex TEXT (male/female)
age_group TEXT (18-39/40-59/60+)
optimal_low, optimal_high NUMERIC
inrange_low, inrange_high NUMERIC
outofrange_low_rule, outofrange_high_rule TEXT
UNIQUE(biomarker_name, sex, age_group)
```

**biomarker_results** - User test measurements
```sql
id UUID PRIMARY KEY
profile_id UUID (FK → profiles)
biomarker_name TEXT
value NUMERIC
unit TEXT
measured_at DATE
created_at TIMESTAMP
```

**appointments** - Scheduled appointments
```sql
id UUID PRIMARY KEY
profile_id UUID (FK → profiles)
appointment_at TIMESTAMP (UTC)
status TEXT (booked/cancelled/completed)
source TEXT (schedule_page/biomarker_modal)
notes TEXT
UNIQUE(profile_id, appointment_at)
```

### Profile-Based Range Selection

The system automatically selects appropriate biomarker ranges based on user demographics:

1. **Age Group Calculation** (from `src/lib/rangeSelection.ts`):
   - 18-39 years → "18-39"
   - 40-59 years → "40-59"
   - 60+ years → "60+"

2. **Range Query**:
   ```sql
   SELECT * FROM reference_ranges
   WHERE biomarker_name = ?
   AND sex = ?
   AND age_group = ?
   ```

3. **Status Calculation**:
   - Value in optimal range → "optimal" (green badge)
   - Value in in-range band → "in-range" (orange badge)
   - Value in out-of-range → "out-of-range" (red badge)

## CSV Import Format

The application parses CSV files with flexible range formats:

**CSV Structure:**
```csv
Biomarker_Name,Unit,Male_18-39_Optimal,Male_18-39_InRange,Male_18-39_OutOfRange,...
Metabolic Health Score,score,75-100,60-75,<60,...
Metabolic Health Score Graph Value: 78
```

**Supported Range Formats:**
- `75-100` → min: 75, max: 100
- `<60` → min: null, max: 60
- `>100` or `≥100` → min: 100, max: null
- Single number → exact value

**Parsing Logic** (from `src/lib/parseCSV.ts`):
1. Parse CSV with PapaParse
2. Find rows with "Graph Value:"
3. Match to biomarker definition
4. Extract demographic-specific ranges
5. Convert to normalized range bands

## Key Features

### Appointment Scheduling

**Business Hours Configuration** (from `src/config/appointments.ts`):
- Start: 9:00 AM
- End: 5:00 PM
- Interval: 30 minutes
- Slots per day: 16

**Booking Flow:**
1. Select date from calendar or biomarker modal
2. Choose available time slot
3. Add optional notes
4. Conflict detection prevents double-booking
5. Optimistic UI updates for instant feedback

**Conflict Prevention:**
- Database unique constraint: `(profile_id, appointment_at)`
- API returns 409 Conflict for duplicate bookings
- Frontend disables past time slots automatically

**Calendar Highlighting:**
- Blue dots indicate days with appointments
- Fetched via `/api/appointments/highlighted-days`

### Biomarker Visualization

**Graph Components:**
- Vertical range bands (color-coded zones)
- Latest result marker (black dot)
- Future appointment marker (blue triangle)
- Hover tooltips for detailed values
- Responsive MUI Charts implementation

**Range Band Ordering:**
- Out of range (low): order 1, red
- Optimal: order 2, green
- In range: order 3, orange
- Out of range (high): order 4, red

## API Routes

### POST /api/setup-database
Initializes database with sample data (profiles, reference ranges, biomarker results).

**Response:**
```json
{
  "success": true,
  "successes": [
    "Profile created successfully",
    "Created 18 reference ranges",
    "Created biomarker results",
    "Created sample appointments"
  ]
}
```

**Usage:**
```bash
curl -X POST https://your-site.vercel.app/api/setup-database
```

### GET /api/biomarkers
Fetches biomarkers with profile-based ranges.

**Response:**
```json
{
  "biomarkers": [
    {
      "id": "uuid",
      "name": "Metabolic Health Score",
      "unit": "score",
      "currentValue": 78,
      "date": "2025-01-15",
      "status": "optimal",
      "ranges": [...],
      "referenceRange": "75-100"
    }
  ]
}
```

### GET /api/profile
Fetches current user profile.

### PATCH /api/profile
Updates user profile (triggers range recalculation).

### GET /api/appointments
Fetches appointments with optional filters.

**Query Parameters:**
- `profile_id` - Filter by profile
- `date` - Filter by specific date
- `start_date`, `end_date` - Date range
- `status` - Filter by status (booked/cancelled/completed)

### POST /api/appointments
Creates new appointment.

**Request Body:**
```json
{
  "profile_id": "uuid",
  "appointment_at": "2025-02-15T14:30:00Z",
  "source": "schedule_page",
  "notes": "Optional notes"
}
```

**Responses:**
- 201 Created - Appointment created
- 409 Conflict - Time slot already booked
- 400 Bad Request - Invalid input

### PATCH /api/appointments/[id]
Updates appointment status.

**Request Body:**
```json
{
  "status": "cancelled"
}
```

### GET /api/appointments/highlighted-days
Returns days with appointments for calendar badges.

## Development

### Scripts
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Biomarkers

1. **Add to CSV** (`src/data/biomarkers.csv`):
   ```csv
   New Biomarker,mg/dL,70-100,60-70,<60,...
   New Biomarker Graph Value: 85
   ```

2. **Add reference ranges** to database:
   ```sql
   INSERT INTO reference_ranges (biomarker_name, sex, age_group, ...)
   VALUES ('New Biomarker', 'male', '18-39', ...);
   ```

3. **Add result** to database:
   ```sql
   INSERT INTO biomarker_results (profile_id, biomarker_name, value, unit, measured_at)
   VALUES ('profile-uuid', 'New Biomarker', 85, 'mg/dL', '2025-01-15');
   ```

4. **Optional**: Create custom chart component in `src/components/`

### Testing Error Scenarios

**Toast Notifications:**
- Network failures → Error toast appears
- Appointment booking conflicts → "Time slot already booked" error
- Profile update success → Success toast
- Appointment cancellation → Success toast

**Verify in DevTools Console:**
- No debug logs should appear
- Only critical error logs in API routes (server-side)

## Production Deployment

### Build Process
```bash
npm run build
```

**Build Output:**
- Static pages pre-rendered at build time
- API routes deployed as serverless functions
- Optimized bundles with tree-shaking

### Vercel Deployment

1. **Connect Repository** to Vercel
2. **Set Environment Variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` (required)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
   - `SUPABASE_SERVICE_ROLE_KEY` (optional, for admin operations)
3. **Deploy** (automatic on git push)
4. **Initialize Database** after first deployment:
   - Navigate to `https://your-site.vercel.app/api/setup-database`
   - Send POST request to create sample data
   - Or manually run SQL migrations (see `supabase/migrations/DB_SETUP.md`)

**Production Considerations:**
- ⚠️ **Security:** Remove anonymous access policies before going live
- Implement user authentication (Supabase Auth or NextAuth.js)
- Enable proper RLS policies based on authenticated users
- Set up error monitoring (Sentry, LogRocket, etc.)
- Configure database backups in Supabase Dashboard
- Review and test all API endpoints for security vulnerabilities

### Environment Variables in Production

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (safe to expose)

**Note:** Database migrations should be applied via Supabase Dashboard or CLI, not through the application.

## Troubleshooting

**Issue: No biomarkers displayed**
- Check browser console for API errors
- Verify environment variables in `.env.local` are set correctly
- Verify database migration was applied: Supabase Dashboard → Table Editor
- Check that anonymous access policy is enabled (see `supabase/migrations/DB_SETUP.md`)
- Add sample data using `/api/setup-database` endpoint or run `supabase/seed.sql`

**Issue: Wrong reference ranges shown**
- Check user profile age and sex in `/profile` page
- Verify reference_ranges table has data for that demographic
- Check browser console for range selection logs (in development)

**Issue: Appointment booking fails**
- Verify time slot is not in the past
- Check for existing appointment at same time
- Ensure profile_id is valid
- Check Supabase RLS policies allow inserts

**Issue: Calendar not highlighting days**
- Check `/api/appointments/highlighted-days` response
- Verify appointments exist in database
- Clear browser cache and reload

## Future Enhancements

- User authentication with Supabase Auth
- Multiple user profiles support
- Email/SMS appointment reminders
- PDF report generation
- Historical trend analysis
- Mobile app (React Native)
- Integration with lab systems for automatic data import
- Advanced filtering and search
- Data export (CSV, PDF)

## Questions & Support

For questions, issues, or feedback about this project, please contact:
- **Email**: dev@niepresjohn.com

You can also:
- Open an issue in the GitHub repository
- Check the documentation in this README
- Review the database setup guide in `supabase/migrations/DB_SETUP.md`

## License

MIT License - Feel free to use this project for personal or commercial purposes.

**What this means:**
- ✅ Free to use, modify, and distribute
- ✅ Can be used in commercial projects
- ✅ Must include the original license and copyright notice
- ⚠️ Provided "as-is" without warranty

See [MIT License](https://opensource.org/licenses/MIT) for full details.
