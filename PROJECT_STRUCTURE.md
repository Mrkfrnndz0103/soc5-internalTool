# Project Structure

## Overview
```
OutboudInternalTool/
├── docs/                           # Documentation files
│   ├── BACKEND_INTEGRATION.md      # Backend API integration guide
│   ├── BACKEND_UPDATE_SUMMARY.md   # Backend update history
│   ├── CHANGELOG.md                # Version history
│   ├── DEPLOYMENT_CHECKLIST.md     # Production deployment steps
│   ├── DEVELOPMENT.md              # Development guidelines
│   ├── ENHANCEMENTS.md             # Feature enhancements log
│   ├── QUICKSTART.md               # Quick start guide
│   ├── SUPABASE_SETUP.md           # Database setup instructions
│   └── Implementation Summary.md   # Implementation details
│
├── src/                            # Source code
│   ├── components/                 # React components
│   │   ├── ui/                     # Reusable UI primitives
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
│   │   ├── chat-popup.tsx          # Chat widget component
│   │   ├── layout.tsx              # Main layout wrapper
│   │   ├── login-illustration.tsx  # Login page graphics
│   │   ├── sidebar.tsx             # Navigation sidebar
│   │   ├── spx-logo.tsx            # Company logo component
│   │   ├── theme-preset-selector.tsx # Theme switcher
│   │   ├── theme-provider.tsx      # Theme context provider
│   │   └── theme-toggle.tsx        # Dark/Light mode toggle
│   │
│   ├── contexts/                   # React Context providers
│   │   └── auth-context.tsx        # Authentication state management
│   │
│   ├── lib/                        # Utility libraries
│   │   ├── api.ts                  # API service layer (Supabase)
│   │   ├── mock-api.ts             # Mock API for development
│   │   ├── mockup-data.ts          # Sample data for testing
│   │   ├── supabase.ts             # Supabase client configuration
│   │   └── utils.ts                # Helper functions
│   │
│   ├── pages/                      # Page components (routes)
│   │   ├── dashboard.tsx           # Main dashboard
│   │   ├── dispatch-report.tsx     # Dispatch report form
│   │   ├── login.tsx               # Authentication page
│   │   └── prealert.tsx            # Prealert database view
│   │
│   ├── theme/                      # Theme configuration
│   │   └── presets/                # Color scheme presets
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
│   ├── App.tsx                     # Root component with routing
│   ├── index.css                   # Global styles & CSS variables
│   ├── main.tsx                    # React entry point
│   └── vite-env.d.ts               # TypeScript declarations
│
├── supabase/                       # Backend integration scripts
│   ├── google-sheets-sync.gs       # Apps Script: Sync data to Supabase
│   ├── webhook-receiver.gs         # Apps Script: Receive webhooks
│   └── webhook-setup.sql           # SQL: Configure database webhooks
│
├── .env                            # Environment variables (local)
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── index.html                      # HTML entry point
├── package.json                    # Dependencies & scripts
├── package-lock.json               # Locked dependency versions
├── postcss.config.js               # PostCSS configuration
├── README.md                       # Main project documentation
├── tailwind.config.js              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.node.json              # TypeScript config for Node
└── vite.config.ts                  # Vite build configuration
```

## Directory Descriptions

### `/docs`
Consolidated documentation for setup, deployment, and development guidelines.

### `/src/components`
- **`/ui`**: Atomic design system components (buttons, inputs, cards)
- **Root level**: Composite components (layout, sidebar, theme controls)

### `/src/contexts`
React Context API providers for global state management (auth, theme, etc.)

### `/src/lib`
- **`api.ts`**: Production API calls to Supabase
- **`mock-api.ts`**: Development mock API
- **`supabase.ts`**: Supabase client initialization
- **`utils.ts`**: Shared utility functions (cn, formatters, validators)

### `/src/pages`
Top-level route components mapped to URLs in App.tsx

### `/src/theme`
Theme configuration and color presets for the design system

### `/supabase`
Backend integration scripts for Google Sheets sync and webhooks

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main routing and app structure |
| `src/main.tsx` | React DOM rendering entry point |
| `src/index.css` | Global styles, CSS variables, Tailwind directives |
| `vite.config.ts` | Build tool configuration |
| `tailwind.config.js` | Utility-first CSS framework config |
| `tsconfig.json` | TypeScript compiler options |
| `.env` | Environment variables (not committed) |
| `package.json` | Project metadata and dependencies |

## Component Architecture

```
App (Router)
└── Layout
    ├── Sidebar (Navigation)
    ├── Header (Theme Toggle, User Menu)
    └── Main Content
        └── Page Component
            ├── UI Components
            └── Business Logic
```

## Data Flow

```
User Action
    ↓
Page Component
    ↓
API Service (lib/api.ts)
    ↓
Supabase Client (lib/supabase.ts)
    ↓
PostgreSQL Database
    ↓ (webhook)
Google Sheets
```

## Naming Conventions

- **Components**: PascalCase (e.g., `Button.tsx`, `DispatchReport.tsx`)
- **Utilities**: camelCase (e.g., `formatDate`, `validateInput`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types/Interfaces**: PascalCase with descriptive names (e.g., `UserProfile`, `DispatchRow`)

## Import Order

1. React and external libraries
2. Internal components
3. Contexts and hooks
4. Utilities and helpers
5. Types and interfaces
6. Styles

Example:
```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';

import { useAuth } from '@/contexts/auth-context';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import type { User } from '@/types';
```

## Adding New Features

### New Page
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add menu item in `src/components/sidebar.tsx`
4. Add API methods in `src/lib/api.ts` if needed

### New Component
1. Create in `src/components/ui/` (if reusable) or `src/components/` (if specific)
2. Export from component file
3. Import where needed

### New API Endpoint
1. Add method in `src/lib/api.ts`
2. Add TypeScript types
3. Handle errors appropriately
4. Update mock API if needed

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes (for FTE login) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Best Practices

1. **Type Safety**: Use TypeScript for all new code
2. **Component Size**: Keep components under 300 lines
3. **Reusability**: Extract common patterns to `/components/ui`
4. **State Management**: Use Context for global state, local state for component-specific
5. **Error Handling**: Always handle API errors gracefully
6. **Accessibility**: Follow WCAG 2.1 AA standards
7. **Performance**: Lazy load routes and heavy components
8. **Testing**: Write tests for critical business logic

## Future Improvements

- [ ] Move documentation to `/docs` folder
- [ ] Add `/types` folder for shared TypeScript interfaces
- [ ] Add `/hooks` folder for custom React hooks
- [ ] Add `/constants` folder for app-wide constants
- [ ] Add `/services` folder for business logic
- [ ] Implement proper error boundaries
- [ ] Add unit tests with Vitest
- [ ] Add E2E tests with Playwright
