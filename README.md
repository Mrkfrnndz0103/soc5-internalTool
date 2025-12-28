# Outbound Internal Tool

Enterprise-grade web application built with the Backstage Design System for managing outbound dispatch operations, KPI tracking, and team administration.

## Features

### Core Functionality
- **Dashboard** - Real-time overview of operations with key metrics
- **Dispatch Report** - Advanced editable table with 15 columns, auto-complete, validation, and draft persistence
- **Prealert Database** - Consolidated view of all dispatch reports with filtering
- **KPI & Compliance** - Performance tracking with data from Google Sheets
- **Admin Tools** - Attendance, masterfile, breaktime, and leave management
- **Midmile Operations** - Truck request management

### Key Features
- ✅ Dual authentication (Backroom with Email + FTE with SeaTalk QR)
- ✅ SeaTalk mobile app QR code authentication
- ✅ Dark/Light theme support
- ✅ Collapsible sidebar with nested menus
- ✅ Real-time form validation
- ✅ Auto-save draft functionality (10-second intervals)
- ✅ Auto-complete for clusters and processors
- ✅ Multi-hub cluster auto-split
- ✅ Responsive design for mobile and desktop
- ✅ Role-based access control
- ✅ Type-safe API integration

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: Supabase (PostgreSQL)
- **UI Components**: Radix UI Primitives
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context API
- **Animation**: GSAP
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Integration**: Google Sheets (Master Data Sync)

## Project Structure

```
src/
├── components/
│   ├── ui/               # Core UI components (Button, Input, Card, etc.)
│   ├── layout.tsx        # Main layout with sidebar and header
│   ├── sidebar.tsx       # Collapsible sidebar with nested menus
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── contexts/
│   └── auth-context.tsx  # Authentication context and provider
├── lib/
│   ├── api.ts            # API service layer for Supabase
│   └── utils.ts          # Utility functions
├── pages/
│   ├── login.tsx         # Login page with role toggle
│   ├── dashboard.tsx     # Main dashboard
│   ├── dispatch-report.tsx  # Dispatch report editable table
│   └── prealert.tsx      # Prealert database view
├── App.tsx               # Main app with routing
├── main.tsx              # React entry point
└── index.css             # Global styles and theme variables
```

## Backend Integration

### Supabase Setup

This application uses Supabase as the backend database with direct client integration.

1. **Create Supabase Project**
   - Visit https://supabase.com and create a new project
   - Copy your project URL and anon key

2. **Setup Database**
   - Follow instructions in `SUPABASE_SETUP.md`
   - Run all SQL scripts to create tables and functions
   - Create initial admin user

3. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Setup SeaTalk Authentication**
   - Follow instructions in `docs/SEATALK_AUTH_SETUP.md`
   - Deploy SeaTalk webhook handler
   - Register deep link with SeaTalk platform

5. **Google Sheets Integration**
   - Setup Google Sheets with tabs: Users, Outbound Map, Dispatch Reports
   - Deploy `supabase/google-sheets-sync.gs` as Apps Script
   - Deploy `supabase/webhook-receiver.gs` as Web App
   - Run `supabase/webhook-setup.sql` in Supabase SQL Editor

### Data Flow

```
Google Sheets (Master Data)
    ↓ (Hourly Sync)
Supabase Database
    ↓ (Real-time)
Web Application
    ↓ (On Submit)
Supabase Database
    ↓ (Webhook)
Google Sheets (Dispatch Reports)
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Backend API running (or configure API endpoint)

### Installation

1. **Clone the repository**
   ```bash
   cd OutboudInternalTool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `VITE_API_BASE_URL` - Your backend API URL
   - `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID (for FTE login)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Login

**Backroom Users:**
1. Select "Backroom" role
2. Enter your email (@shopeemobile-external.com)
3. Click "Continue"

**FTE Users:**
1. Open SeaTalk mobile app on your phone
2. Scan the QR code displayed on login page
3. Automatically logged in with your SeaTalk email account

### Dispatch Report

1. Navigate to Outbound → Dispatch Report
2. Fill in dispatch information (max 10 rows per session)
3. Key features:
   - **Cluster autocomplete**: Type 3+ characters to search
   - **Multi-hub auto-split**: Automatically creates rows for multi-hub clusters
   - **Auto-fill**: Station, region, and dock number populate automatically
   - **Validation**: Real-time client-side validation
   - **Draft persistence**: Auto-saves every 10 seconds
   - **Hide/Show columns**: Toggle visibility of LH Trip, Plate #, Fleet Size
   - **Dock confirmation**: Required before submission

4. Click "Submit All Rows" when ready

### Prealert Database

1. Navigate to Outbound → Prealert
2. Use filters to search:
   - Region
   - Status (Pending/Ongoing/Completed)
   - Date range
3. Export to CSV for reporting

## API Integration

The application expects the following API endpoints:

### Authentication
- `POST /api/auth/oauth-login` - Backroom login or Google OAuth
- `POST /api/auth/change-password` - Change user password
- `GET /api/lookups/user?ops_id={id}` - Lookup user info

### Dispatch Operations
- `POST /api/submit-rows` - Submit dispatch rows
- `GET /api/dispatches` - Get dispatch entries with filters
- `POST /api/verify-rows` - Verify dispatch rows (Data Team)

### Lookups
- `GET /api/lookups/clusters?region=&q=` - Search clusters
- `GET /api/lookups/hubs?cluster=` - Get hubs for cluster
- `GET /api/lookups/processors?q=` - Search processors

### KPI & Compliance
- `GET /api/kpi/mdt` - MDT data from Google Sheets
- `GET /api/kpi/workstation` - Workstation data
- `GET /api/kpi/productivity` - Productivity metrics
- `GET /api/kpi/intraday` - Intraday data

See `src/lib/api.ts` for complete API documentation.

## Design System

This application uses the Backstage Design System with:

### Color Palette
- **Light Mode**: Warm neutrals with high contrast
- **Dark Mode**: Deep backgrounds with accessible foregrounds
- **Brand Colors**: 11-step scale from 050 to 950

### Typography
- **Headings**: Instrument Serif (serif)
- **Body Text**: Poppins (sans-serif)

### Components
All UI components follow Radix UI accessibility standards and are fully keyboard-navigable.

## Development

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add menu item in `src/components/sidebar.tsx` (if needed)

### Customizing Theme

Edit CSS variables in `src/index.css`:
```css
:root {
  --background: 48 33% 98%;
  --foreground: 0 25% 33%;
  /* ... other variables */
}
```

### Creating New Components

Use the existing component patterns in `src/components/ui/` as templates.

## Deployment

### Environment Variables (Production)
- Set `VITE_SUPABASE_URL` to your production Supabase URL
- Set `VITE_SUPABASE_ANON_KEY` to your production Supabase anon key
- Deploy SeaTalk webhook with production credentials
- Register production domain with SeaTalk platform

### Hosting Options
- **Vercel/Netlify**: Connect your Git repository for automatic deployments
- **AWS S3 + CloudFront**: Static hosting with CDN
- **Docker**: Build container with Nginx to serve static files

## Troubleshooting

### Draft Not Saving
- Check browser localStorage is enabled
- Clear old drafts: Look for keys starting with `drafts:` in localStorage

### API Errors
- Verify `VITE_API_BASE_URL` in `.env`
- Check network tab in browser DevTools
- Ensure backend is running and CORS is configured

### Google OAuth Not Working
- Verify SeaTalk webhook is deployed and accessible
- Check deep link is registered with SeaTalk platform
- Ensure user's SeaTalk email matches database email
- Check `seatalk_sessions` table for session records

## Documentation

For detailed documentation, see the [docs](./docs) folder:

- **Getting Started**: [QUICKSTART.md](./docs/QUICKSTART.md)
- **Development**: [DEVELOPMENT.md](./docs/DEVELOPMENT.md)
- **Setup**: [SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)
- **SeaTalk Auth**: [SEATALK_AUTH_SETUP.md](./docs/SEATALK_AUTH_SETUP.md)
- **SeaTalk Flow**: [SEATALK_FLOW_DIAGRAM.md](./docs/SEATALK_FLOW_DIAGRAM.md)
- **SeaTalk Quick Ref**: [SEATALK_QUICK_REFERENCE.md](./docs/SEATALK_QUICK_REFERENCE.md)
- **Deployment**: [DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md)
- **Project Structure**: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- **Changelog**: [CHANGELOG.md](./docs/CHANGELOG.md)

## License

Internal use only - Proprietary

## Support

For issues or questions, contact your system administrator or development team.
