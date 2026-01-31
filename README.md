# Biomarker Health Tracker

A professional medical dashboard for tracking biomarker health metrics with intelligent appointment scheduling and comprehensive data visualization.

## Overview

Production-ready healthcare application built with Next.js and Supabase, featuring demographic-specific reference ranges, interactive visualizations, and conflict-free appointment booking. Designed for clinical accuracy and optimal user experience.

## Key Features

### Health Metrics & Visualization
- **Biomarker Tracking**: Real-time health metrics with intelligent status indicators (Optimal, In Range, Out of Range)
- **Profile-Based Ranges**: Automatic age and sex-specific reference range selection
- **Interactive Charts**: Detailed visualizations with zone highlighting and future projections
- **Creatinine-Specific Visualization**: Specialized 3-band layout (Optimal/Out of Range) with custom graph domain
- **Mini Range Indicators**: At-a-glance visual status for each biomarker
- **Professional PDF Export**: Clean, filtered biomarker reports with print optimization

### Appointment Management
- **Smart Scheduling**: Time-slot based booking
- **Conflict Prevention**: Real-time validation prevents double-booking
- **Calendar Highlighting**: Visual indicators for days with scheduled appointments
- **Multiple Booking Sources**: Schedule from calendar or biomarker modal
- **Appointment Tracking**: Full CRUD operations with status management

### User Interface
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Column Headers**: Clear labeling for biomarker data (Biomarker, Status, Result, Reference, Range)
- **Filter System**: Quick filtering by biomarker status
- **Toast Notifications**: Real-time feedback for all user actions
- **Dark Mode Ready**: Prepared for theme switching

## Technology Stack

**Frontend:**
- Next.js 16.1.6 (App Router) + React 19.2.3
- TypeScript 5 with strict type checking
- Tailwind CSS v4 for styling
- Material-UI (MUI) 7.3.7 for components
- MUI X Charts 8.26.0 for data visualization
- Lucide React + Tabler Icons for iconography

**Backend:**
- Supabase (PostgreSQL) with Row Level Security
- RESTful API routes with Next.js
- Serverless function deployment

**Additional Libraries:**
- MUI X Date Pickers 8.26.0 for calendar
- dayjs 1.11.19 for date handling
- Focus Trap React for accessibility

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

**Where to find these values:**
- Go to [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API
- Copy "Project URL" as `NEXT_PUBLIC_SUPABASE_URL`
- Copy "anon public" key as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Database Setup

**📖 Complete database setup, schema, and configuration:**
See **[`supabase/migrations/DB_SETUP.md`](supabase/migrations/DB_SETUP.md)** for detailed instructions.

**Quick Start:**
1. Run the complete database migration in Supabase SQL Editor
2. Enable anonymous access (for MVP testing)
3. Add sample data via API endpoint or SQL

The database setup creates:
- 7 tables with optimized indexes
- Secure RLS policies
- Automated triggers
- Sample reference ranges for Creatinine, Total Cholesterol, and Fasting Glucose

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
biomarkertestproject/
├── app/                              # Next.js App Router
│   ├── api/                         # API Routes
│   │   ├── biomarkers/             # Biomarker CRUD operations
│   │   ├── profile/                # User profile management
│   │   ├── appointments/           # Appointment scheduling
│   │   └── setup-database/         # Database initialization
│   ├── biomarkers/page.tsx         # Biomarkers list with filtering & PDF export
│   ├── schedule/page.tsx           # Appointment calendar
│   ├── profile/page.tsx            # User profile editor
│   └── page.tsx                    # Dashboard home
│
├── src/
│   ├── components/                 # React Components
│   │   ├── BiomarkerCard.tsx      # Biomarker display card
│   │   ├── BiomarkerModal.tsx     # Graph modal with visualizations
│   │   ├── CreatinineChartContent.tsx  # Creatinine-specific chart
│   │   ├── MiniIndicator.tsx      # Visual range indicator
│   │   ├── BookingModal.tsx       # Appointment booking interface
│   │   └── DashboardLayout.tsx    # Main layout with sidebar
│   ├── contexts/
│   │   └── NotificationContext.tsx # Toast notification system
│   ├── hooks/
│   │   ├── useAppointments.ts     # Appointment management
│   │   └── useCurrentProfile.ts   # Profile data access
│   ├── lib/
│   │   ├── rangeSelection.ts      # Demographic-based range logic
│   │   ├── biomarkerUtils.ts      # Utility functions
│   │   └── supabase.ts            # Supabase client
│   └── types/
│       ├── biomarker.ts           # Biomarker type definitions
│       └── appointment.ts         # Appointment type definitions
│
├── supabase/                       # Database Configuration
│   ├── migrations/                # Database migrations
│   │   ├── 20260131_complete_database_setup.sql
│   │   ├── 20260131_enable_anon_access.sql
│   │   └── DB_SETUP.md           # Complete database documentation
│   └── seed.sql                  # Sample data for testing
│
└── package.json                   # Project dependencies
```

## Key Features in Detail

### Biomarker-Specific Visualizations

**Creatinine (3-Band Layout):**
- Reference Range: Male 0.7-1.2 mg/dL, Female 0.5-1.1 mg/dL
- Optimal Range: Male 0.75-1.0 mg/dL, Female 0.6-0.9 mg/dL
- Graph Domain: 0.1-5.0 mg/dL
- No "in-range" (orange) band - only Optimal (green) and Out of Range (red)

**Metabolic Health Score (4-Band Layout):**
- Out of Range (high): Red
- In Range: Orange
- Optimal: Green (tallest band)
- Out of Range (low): Red

### PDF Export Features

**Professional Report Generation:**
- Filters section hidden in print view
- Range indicator column removed for clean layout
- Footer and navigation hidden
- Professional header with date and filter information
- Optimized for A4 paper size
- Black text for maximum readability

### Appointment Scheduling

**Business Hours:**
- Operating hours: 9:00 AM - 5:00 PM
- Time slot interval: 30 minutes
- 16 available slots per day

**Features:**
- Conflict detection with unique database constraints
- Past time slot validation
- Calendar date highlighting
- Optimistic UI updates
- Multiple booking sources (calendar or biomarker modal)

## API Endpoints

### Biomarkers
- `GET /api/biomarkers` - Fetch all biomarkers with profile-based ranges
- `GET /api/biomarkers/[id]` - Get specific biomarker details
- `POST /api/biomarkers` - Create new biomarker (legacy support)

### Profile
- `GET /api/profile` - Fetch current user profile
- `PATCH /api/profile` - Update user profile (triggers range recalculation)

### Appointments
- `GET /api/appointments` - List appointments with optional filters
- `POST /api/appointments` - Create new appointment
- `PATCH /api/appointments/[id]` - Update appointment status
- `GET /api/appointments/highlighted-days` - Get calendar badge data

### Database Setup
- `POST /api/setup-database` - Initialize database with sample data (development)

## Development

### Available Scripts
```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run ESLint checks
```

### Adding New Biomarkers

1. **Add reference ranges** to database (see `DB_SETUP.md`)
2. **Add biomarker result** for current profile
3. **(Optional)** Create custom visualization component
4. Application automatically detects and displays new biomarkers

### Testing Notifications

The application includes comprehensive toast notifications for:
- Appointment booking success/conflicts
- Profile update confirmations
- Data loading errors
- Network failures

## Production Deployment

### Vercel Deployment

1. **Connect repository** to Vercel
2. **Configure environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy** (automatic on git push)
4. **Initialize database** using migration files

### Security Checklist

Before going live:
- [ ] Remove anonymous access policies (see `DB_SETUP.md`)
- [ ] Implement user authentication (Supabase Auth recommended)
- [ ] Update RLS policies for authenticated users only
- [ ] Enable database backups in Supabase
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Review all API endpoints for security
- [ ] Enable MFA for Supabase dashboard access

### Environment Variables

**Required for production:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Optional:**
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations

## Troubleshooting

**No biomarkers displayed**
- Verify environment variables in `.env.local`
- Check database migration was applied successfully
- Ensure anonymous access is enabled (see `DB_SETUP.md`)
- Add sample data using seed file or API endpoint

**Wrong reference ranges shown**
- Verify user profile age and sex in `/profile` page
- Check reference_ranges table has data for demographic group
- Review browser console for range selection logs

**Appointment booking fails**
- Ensure time slot is not in the past
- Check for existing appointment at same time
- Verify RLS policies allow inserts

**PDF export includes unwanted elements**
- Clear browser cache
- Ensure using modern browser (Chrome, Edge, Firefox)
- Check print styles in `app/globals.css`

For database-related issues, see **[`supabase/migrations/DB_SETUP.md`](supabase/migrations/DB_SETUP.md)**

## Future Enhancements

- User authentication system
- Multi-user profile support
- Email/SMS appointment reminders
- Historical trend analysis
- Mobile application
- Lab system integration
- Advanced analytics dashboard
- Data export formats (CSV, Excel)

## License

MIT License - Free to use for personal or commercial purposes.

**What this means:**
- ✅ Free to use, modify, and distribute
- ✅ Can be used in commercial projects
- ✅ Must include original license and copyright notice
- ⚠️ Provided "as-is" without warranty

See [MIT License](https://opensource.org/licenses/MIT) for details.

## Support

For questions, issues, or feedback:
- **Email**: dev@niepresjohn.com
- **Documentation**: Review this README and `supabase/migrations/DB_SETUP.md`
- **Issues**: Open an issue in the GitHub repository

---

**Built with ❤️ by [Niepres John](https://niepresjohn.com)**
