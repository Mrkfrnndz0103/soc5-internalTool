# Organized Project Structure

```
OutboudInternalTool/
│
├── 📁 docs/                                    # All documentation
│   ├── README.md                               # Documentation index
│   ├── QUICKSTART.md                           # Quick start guide
│   ├── DEVELOPMENT.md                          # Development guidelines
│   ├── SUPABASE_SETUP.md                       # Database setup
│   ├── BACKEND_INTEGRATION.md                  # API integration
│   ├── DEPLOYMENT_CHECKLIST.md                 # Deployment steps
│   ├── CHANGELOG.md                            # Version history
│   ├── ENHANCEMENTS.md                         # Feature log
│   ├── BACKEND_UPDATE_SUMMARY.md               # Backend updates
│   └── Implementation Summary.md               # Implementation details
│
├── 📁 src/                                     # Source code
│   │
│   ├── 📁 components/                          # React components
│   │   ├── 📁 ui/                              # Reusable UI primitives
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── use-toast.ts
│   │   │
│   │   ├── chat-popup.tsx                      # Chat widget
│   │   ├── layout.tsx                          # Main layout
│   │   ├── login-illustration.tsx              # Login graphics
│   │   ├── sidebar.tsx                         # Navigation
│   │   ├── spx-logo.tsx                        # Logo component
│   │   ├── theme-preset-selector.tsx           # Theme switcher
│   │   ├── theme-provider.tsx                  # Theme context
│   │   └── theme-toggle.tsx                    # Dark/Light toggle
│   │
│   ├── 📁 contexts/                            # Global state
│   │   └── auth-context.tsx                    # Authentication
│   │
│   ├── 📁 lib/                                 # Utilities
│   │   ├── api.ts                              # API service (Supabase)
│   │   ├── mock-api.ts                         # Mock API
│   │   ├── mockup-data.ts                      # Sample data
│   │   ├── supabase.ts                         # Supabase client
│   │   └── utils.ts                            # Helper functions
│   │
│   ├── 📁 pages/                               # Route components
│   │   ├── dashboard.tsx                       # Dashboard
│   │   ├── dispatch-report.tsx                 # Dispatch form
│   │   ├── login.tsx                           # Login page
│   │   └── prealert.tsx                        # Prealert view
│   │
│   ├── 📁 theme/                               # Theme config
│   │   └── 📁 presets/                         # Color schemes
│   │       ├── aura.html
│   │       ├── cosmic.html
│   │       ├── default.ts
│   │       ├── Eclipse.html
│   │       ├── forest.ts
│   │       ├── index.ts
│   │       ├── ocean.ts
│   │       ├── purple.ts
│   │       ├── rose.ts
│   │       ├── solar.html
│   │       ├── sunset.ts
│   │       └── zenith.html
│   │
│   ├── App.tsx                                 # Root component
│   ├── main.tsx                                # Entry point
│   ├── index.css                               # Global styles
│   └── vite-env.d.ts                           # Type declarations
│
├── 📁 supabase/                                # Backend scripts
│   ├── google-sheets-sync.gs                   # Sync to Supabase
│   ├── webhook-receiver.gs                     # Webhook handler
│   └── webhook-setup.sql                       # Database triggers
│
├── 📄 .env                                     # Environment variables (local)
├── 📄 .env.example                             # Environment template
├── 📄 .gitignore                               # Git ignore rules
├── 📄 index.html                               # HTML entry
├── 📄 package.json                             # Dependencies
├── 📄 package-lock.json                        # Locked versions
├── 📄 postcss.config.js                        # PostCSS config
├── 📄 PROJECT_STRUCTURE.md                     # This file
├── 📄 README.md                                # Main documentation
├── 📄 tailwind.config.js                       # Tailwind config
├── 📄 tsconfig.json                            # TypeScript config
├── 📄 tsconfig.node.json                       # TS Node config
└── 📄 vite.config.ts                           # Vite config
```

## Key Improvements

✅ **Organized Documentation** - All docs moved to `/docs` folder  
✅ **Clear Separation** - Source code, docs, and backend scripts separated  
✅ **Easy Navigation** - Documentation index in `/docs/README.md`  
✅ **Scalable Structure** - Ready for future additions (hooks, types, services)  
✅ **Clean Root** - Only essential config files at root level  

## Quick Navigation

| Need | Go To |
|------|-------|
| Start developing | [docs/QUICKSTART.md](docs/QUICKSTART.md) |
| Setup database | [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) |
| Deploy to production | [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) |
| Add new feature | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| View changes | [docs/CHANGELOG.md](docs/CHANGELOG.md) |
| Understand structure | [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) |

## Component Hierarchy

```
App (Router)
│
└── ThemeProvider
    │
    └── AuthProvider
        │
        └── Layout
            │
            ├── Sidebar (Navigation)
            │   └── Menu Items
            │
            ├── Header
            │   ├── ThemeToggle
            │   └── UserMenu
            │
            └── Main Content
                │
                └── Page Component
                    │
                    ├── UI Components
                    │   ├── Button
                    │   ├── Input
                    │   ├── Card
                    │   └── ...
                    │
                    └── Business Logic
                        ├── API Calls
                        ├── State Management
                        └── Validation
```

## Data Flow Architecture

```
┌─────────────────┐
│  Google Sheets  │ (Master Data)
│  - Users        │
│  - Outbound Map │
└────────┬────────┘
         │ Hourly Sync (Apps Script)
         ↓
┌─────────────────┐
│    Supabase     │ (PostgreSQL)
│  - users        │
│  - clusters     │
│  - dispatches   │
└────────┬────────┘
         │ Real-time API
         ↓
┌─────────────────┐
│  Web App (React)│
│  - Dashboard    │
│  - Dispatch     │
│  - Prealert     │
└────────┬────────┘
         │ Submit Data
         ↓
┌─────────────────┐
│    Supabase     │
│  (Insert/Update)│
└────────┬────────┘
         │ Webhook Trigger
         ↓
┌─────────────────┐
│  Google Sheets  │ (Dispatch Reports)
│  - Auto-append  │
└─────────────────┘
```

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `DispatchReport.tsx` |
| Pages | kebab-case | `dispatch-report.tsx` |
| Utilities | camelCase | `formatDate()` |
| Constants | UPPER_SNAKE | `API_BASE_URL` |
| Types | PascalCase | `UserProfile` |
| CSS Classes | kebab-case | `.btn-primary` |

## Import Path Aliases

Configure in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/pages/*": ["./src/pages/*"]
    }
  }
}
```

Usage:
```typescript
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
```
