# Outbound Internal Tool

Enterprise-grade web application for managing outbound dispatch operations, KPI tracking, and team administration at SOC5.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev

# Open browser
http://localhost:5173
```

## 📋 Overview

A modern React-based internal tool designed for SOC5 Outbound Operations team to streamline dispatch reporting, monitor KPIs, and manage team resources efficiently.

### Key Features

- ✅ **Dual Authentication** - Backroom (Email) + FTE (SeaTalk QR)
- ✅ **Dispatch Report** - Editable table with auto-complete, validation, and draft persistence
- ✅ **Prealert Database** - Consolidated view with advanced filtering
- ✅ **KPI Dashboard** - Real-time performance metrics from Google Sheets
- ✅ **Admin Tools** - Attendance, masterfile, breaktime, leave management
- ✅ **Theme System** - Dark/Light mode with 7 preset themes
- ✅ **Responsive Design** - Mobile and desktop optimized
- ✅ **Type-Safe** - Full TypeScript implementation

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router v6
- **UI Components**: Radix UI Primitives
- **Styling**: Tailwind CSS + CSS Variables
- **Forms**: React Hook Form + Zod validation
- **State**: React Context API
- **Animation**: GSAP + Framer Motion
- **Icons**: Lucide React

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + SeaTalk OAuth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **Integration**: Google Sheets API

### Testing
- **Framework**: Vitest
- **Testing Library**: React Testing Library
- **Coverage**: Built-in Vitest coverage

## 📁 Project Structure

```
OutboudInternalTool/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── layout.tsx       # Main layout wrapper
│   │   ├── sidebar.tsx      # Navigation sidebar
│   │   └── theme-*.tsx      # Theme components
│   ├── contexts/
│   │   └── auth-context.tsx # Authentication state
│   ├── lib/
│   │   ├── api.ts           # API service layer
│   │   ├── supabase.ts      # Supabase client
│   │   └── utils.ts         # Utility functions
│   ├── pages/
│   │   ├── login.tsx        # Login page
│   │   ├── dashboard.tsx    # Main dashboard
│   │   ├── dispatch-report.tsx
│   │   ├── dispatch-monitoring.tsx
│   │   └── prealert.tsx
│   ├── theme/
│   │   └── presets/         # Theme presets
│   ├── test/                # Test files
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── supabase/
│   ├── migrations/          # Database migrations
│   ├── functions/           # Edge functions
│   ├── google-sheets-sync.gs
│   └── webhook-receiver.gs
├── docs/                    # Documentation
├── .env.example             # Environment template
└── package.json
```

## 🔧 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google Sheets (for data sync)

### Step 1: Clone and Install
```bash
cd OutboudInternalTool
npm install
```

### Step 2: Environment Setup
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Step 3: Database Setup
See [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) for complete Supabase configuration.

### Step 4: Run Development Server
```bash
npm run dev
```

## 🔐 Authentication

### Backroom Users
1. Select "Backroom" role
2. Enter email (@shopeemobile-external.com)
3. Enter password (default: `SOC5-Outbound`)

### FTE Users
1. Open SeaTalk mobile app
2. Scan QR code on login page
3. Automatically authenticated

See [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) for details.

## 📊 Features

### Dispatch Report
- Max 10 rows per session
- Auto-complete for clusters and processors
- Multi-hub cluster auto-split
- Real-time validation
- Auto-save every 10 seconds
- Column visibility toggle

### Prealert Database
- Filter by region, status, date range
- Export to CSV
- Pagination support
- Real-time updates

### KPI Dashboard
- MDT (Mean Dispatch Time)
- Workstation metrics
- Productivity tracking
- Intraday monitoring

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run
```

## 🏗️ Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## 📚 Documentation

- [Getting Started](docs/GETTING_STARTED.md)
- [Database Setup](docs/DATABASE_SETUP.md)
- [API Reference](docs/API_REFERENCE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Project Analysis](docs/PROJECT_ANALYSIS.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Auto-Update System](docs/AUTO_UPDATE.md) - Documentation automation

### 🤖 Auto-Documentation

Documentation automatically updates when code changes:
```bash
# Watch mode (development)
npm run docs:watch

# Manual update
npm run docs:update

# Auto-updates on git commit (via pre-commit hook)
```

## 🎨 Theme System

7 built-in themes:
- Default (Warm neutrals)
- Ocean (Blue tones)
- Forest (Green tones)
- Sunset (Orange/Pink)
- Purple (Purple/Violet)
- Rose (Pink/Red)
- Cosmic (Deep space)

## 🔄 Data Flow

```
Google Sheets (Master Data)
    ↓ Hourly Sync
Supabase Database
    ↓ Real-time
Web Application
    ↓ On Submit
Supabase Database
    ↓ Webhook
Google Sheets (Reports)
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

Internal project - contact development team for contribution guidelines.

## 📝 License

Proprietary - Internal use only

## 🆘 Support

For issues or questions:
- Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- Contact: SOC5 Development Team

## 📈 Version

Current Version: **1.0.0**

---

Built with ❤️ by SOC5 Development Team
