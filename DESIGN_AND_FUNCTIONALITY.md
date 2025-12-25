# Outbound Internal Tool - Design & Functionality Documentation

## Table of Contents
1. [Overview](#overview)
2. [Design System](#design-system)
3. [Architecture](#architecture)
4. [Core Features](#core-features)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Page-by-Page Functionality](#page-by-page-functionality)
7. [Component Library](#component-library)
8. [Data Flow](#data-flow)
9. [State Management](#state-management)
10. [API Integration](#api-integration)
11. [Security Features](#security-features)
12. [Performance Optimizations](#performance-optimizations)

---

## Overview

**Outbound Internal Tool** is an enterprise-grade web application designed for managing outbound dispatch operations, KPI tracking, and team administration at SOC (Sorting Operations Center). Built with modern web technologies, it provides a comprehensive solution for logistics operations management.

### Key Objectives
- Streamline dispatch reporting and monitoring
- Centralize KPI tracking and compliance metrics
- Provide role-based access control for different user types
- Enable real-time data synchronization with Google Sheets
- Offer intuitive UI/UX for both desktop and mobile users

---

## Design System

### Color Palette

#### Light Mode
```css
Background:     HSL(30, 25%, 96%)   /* Warm beige/cream */
Foreground:     HSL(20, 14%, 20%)   /* Dark brown */
Primary:        HSL(25, 95%, 53%)   /* Vibrant orange */
Secondary:      HSL(30, 20%, 92%)   /* Light warm gray */
Muted:          HSL(30, 15%, 94%)   /* Very light warm gray */
Border:         HSL(30, 15%, 88%)   /* Light warm border */
Card:           HSL(0, 0%, 100%)    /* Pure white */
```

#### Dark Mode
```css
Background:     HSL(20, 14%, 12%)   /* Deep charcoal brown */
Foreground:     HSL(30, 15%, 95%)   /* Warm off-white */
Primary:        HSL(25, 95%, 53%)   /* Vibrant orange (consistent) */
Secondary:      HSL(20, 14%, 20%)   /* Dark warm gray */
Muted:          HSL(20, 14%, 20%)   /* Dark warm gray */
Border:         HSL(20, 14%, 20%)   /* Dark border */
Card:           HSL(20, 14%, 16%)   /* Slightly lighter charcoal */
```

#### Sidebar Colors
```css
Light Mode Sidebar:
  Background:   HSL(20, 14%, 12%)   /* Dark charcoal */
  Foreground:   HSL(30, 15%, 85%)   /* Light warm gray */
  Active:       HSL(45, 100%, 51%)  /* Bright yellow/gold */

Dark Mode Sidebar:
  Background:   HSL(20, 14%, 8%)    /* Even darker charcoal */
  Foreground:   HSL(30, 15%, 75%)   /* Medium warm gray */
  Active:       HSL(45, 100%, 51%)  /* Bright yellow/gold */
```

#### Brand Colors (11-step scale)
```css
brand-50:  #F5F1F0  /* Lightest */
brand-100: #E9DDDB
brand-200: #D6BEBB
brand-300: #B78F8A
brand-400: #94635E
brand-500: #6A4040  /* Base */
brand-600: #5B3535
brand-700: #4C2D2D
brand-800: #3E2525
brand-900: #2E1C1C
brand-950: #1C1010  /* Darkest */
```

### Typography

**Font Families:**
- **Primary (Body)**: Inter (sans-serif)
- **Headings**: Inter (sans-serif, weight: 600)
- **Fallback**: -apple-system, BlinkMacSystemFont, Segoe UI

**Font Weights:**
- Light: 300
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
- Extrabold: 800

**Type Scale:**
- Headings: 2xl (1.5rem), 3xl (1.875rem)
- Body: sm (0.875rem), base (1rem)
- Labels: xs (0.75rem)

### Spacing & Layout

**Border Radius:**
- Default: 0.75rem (12px)
- Large: 1rem (16px)
- Extra Large: 1.5rem (24px)
- Cards: 0.5rem (8px) to 1rem (16px)

**Shadows:**
- Card Shadow: `0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)`
- Card Shadow Large: `0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)`

**Transitions:**
- Standard: 200ms ease-out
- Sidebar: 300ms ease
- Hover effects: 200ms ease

### Accessibility

- **WCAG 2.1 Level AA** compliant color contrast
- **Keyboard navigation** fully supported
- **Screen reader** compatible (Radix UI primitives)
- **Focus indicators** visible on all interactive elements
- **ARIA labels** on all icons and buttons

---

## Architecture

### Technology Stack

**Frontend:**
- React 18.2.0 (UI library)
- TypeScript 5.3.3 (type safety)
- Vite 7.3.0 (build tool)
- React Router v6.21.3 (routing)

**Backend:**
- Supabase (PostgreSQL database)
- Supabase Auth (authentication)
- Google Sheets API (data sync)

**UI Framework:**
- Tailwind CSS 3.4.1 (styling)
- Radix UI (accessible primitives)
- Lucide React (icons)

**State Management:**
- React Context API (auth, theme)
- React Hook Form (forms)
- Local Storage (drafts, preferences)

**Validation:**
- Zod 3.22.4 (schema validation)

**Animation:**
- GSAP 3.14.2 (advanced animations)
- CSS transitions (standard animations)

**Testing:**
- Vitest 2.1.8 (unit tests)
- Testing Library (component tests)

### Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── layout.tsx             # Main layout wrapper
│   ├── sidebar.tsx            # Navigation sidebar
│   ├── theme-provider.tsx     # Theme context
│   ├── theme-toggle.tsx       # Dark/light mode toggle
│   ├── theme-preset-selector.tsx
│   ├── chat-popup.tsx         # Help chat widget
│   ├── login-illustration.tsx # Login page graphics
│   └── spx-logo.tsx           # Company logo
├── contexts/
│   └── auth-context.tsx       # Authentication state
├── lib/
│   ├── api.ts                 # API service layer
│   ├── supabase.ts            # Supabase client
│   ├── utils.ts               # Utility functions
│   ├── mock-api.ts            # Mock data for testing
│   └── mockup-data.ts         # Sample data
├── pages/
│   ├── login.tsx              # Login page
│   ├── dashboard.tsx          # Main dashboard
│   ├── dispatch-report.tsx    # Dispatch entry form
│   └── prealert.tsx           # Prealert database view
├── theme/
│   └── presets/               # Theme preset configurations
├── test/                      # Test files
├── App.tsx                    # Root component with routing
├── main.tsx                   # React entry point
└── index.css                  # Global styles
```

### Design Patterns

**Component Composition:**
- Atomic design principles (atoms → molecules → organisms)
- Compound components for complex UI (e.g., Select, Dialog)
- Render props for flexible composition

**State Management:**
- Context API for global state (auth, theme)
- Local state for component-specific data
- Session/Local Storage for persistence

**Data Fetching:**
- Service layer abstraction (api.ts)
- Async/await with error handling
- Loading states and error boundaries

**Form Handling:**
- React Hook Form for performance
- Zod schemas for validation
- Controlled components with real-time validation

---

## Core Features

### 1. Dual Authentication System

**Backroom Users:**
- Login with Ops ID + Password
- First-time password change required
- Default password: `SOC5-Outbound`
- Auto-populate name on Ops ID entry

**FTE Users:**
- Google OAuth 2.0 integration
- Company email verification
- Single sign-on (SSO)

**Security:**
- JWT token-based authentication
- Password hashing (bcrypt)
- Session management
- Auto-logout on inactivity

### 2. Theme System

**Modes:**
- Light mode (default)
- Dark mode
- System preference detection

**Presets:**
- Default (warm neutrals)
- Custom presets (extensible)

**Persistence:**
- LocalStorage for user preference
- Instant theme switching
- No page reload required

### 3. Responsive Sidebar

**Features:**
- Collapsible (280px → 70px)
- Nested menu support (2 levels)
- Active state highlighting
- Hover expansion for collapsed state
- Smooth animations (300ms)

**Menu Structure:**
- Dashboard
- Outbound (6 sub-items + Admin section)
- KPI & Compliance (4 sub-items)
- Midmile (1 sub-item)
- Notifications, Help, Settings

### 4. Dispatch Report System

**Capabilities:**
- Add up to 10 rows per session
- 15 editable columns per row
- Auto-complete for clusters
- Auto-fill station, region, dock number
- Multi-hub cluster auto-split
- Real-time validation
- Draft auto-save (10-second intervals)
- Column visibility toggle (LH Trip, Plate #, Fleet Size)

**Validation Rules:**
- Required fields: Cluster, Station, Region, Dock, Times, Processor, Ops ID
- Dock confirmation required
- Depart time must be after docked time
- LH Trip must start with "LT"
- Ops ID auto-lookup for name

**Data Persistence:**
- LocalStorage draft storage
- Session-based draft keys
- Draft recovery on page reload
- Clear draft on successful submission

### 5. Prealert Database

**Features:**
- Consolidated view of all dispatch reports
- Advanced filtering (Region, Status, Date range)
- Pagination support
- Export to CSV
- Real-time data sync

### 6. KPI & Compliance Tracking

**Metrics:**
- MDT (Must Depart Time) compliance
- Workstation utilization
- Productivity metrics
- Intraday performance

**Data Source:**
- Google Sheets sync (hourly)
- Supabase tables (kpi_mdt, kpi_workstation, etc.)
- Real-time dashboard updates

### 7. Admin Tools

**Modules:**
- Attendance tracking
- Masterfile management
- Attendance history
- Breaktime management
- Leave management
- Workstation allocation

---

## User Roles & Permissions

### Role Hierarchy

```
Admin
  ├── Full system access
  ├── User management
  ├── Configuration settings
  └── All module access

Data Team
  ├── Verify dispatch reports
  ├── Export data
  ├── View all KPIs
  └── Read-only admin tools

FTE (Full-Time Employee)
  ├── Submit dispatch reports
  ├── View own submissions
  ├── View KPIs
  └── Limited admin access

Backroom
  ├── Submit dispatch reports
  ├── View own submissions
  └── Basic dashboard access
```

### Permission Matrix

| Feature | Admin | Data Team | FTE | Backroom |
|---------|-------|-----------|-----|----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Dispatch Report | ✅ | ✅ | ✅ | ✅ |
| Prealert View | ✅ | ✅ | ✅ | ❌ |
| Verify Reports | ✅ | ✅ | ❌ | ❌ |
| KPI Access | ✅ | ✅ | ✅ | ❌ |
| Admin Tools | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |

---

## Page-by-Page Functionality

### Login Page (`/login`)

**Layout:**
- Split screen design
- Left: Login form
- Right: Illustration/branding

**Features:**
- Role toggle (Backroom / FTE)
- Conditional form fields
- Google OAuth button (FTE only)
- Password visibility toggle
- Remember me checkbox
- Error handling with toast notifications

**Validation:**
- Ops ID format check
- Password strength requirements
- Email format validation (FTE)

**Flow:**
```
User selects role
  ↓
Backroom: Enter Ops ID → Auto-fill name → Enter password
  ↓
FTE: Click "Sign in with Google" → OAuth flow
  ↓
First-time user: Change password prompt
  ↓
Redirect to Dashboard
```

### Dashboard (`/dashboard`)

**Layout:**
- 4-column stat cards (responsive)
- 2-column content area
- Recent activity feed
- Quick actions grid

**Stat Cards:**
- Total Dispatches (with % change)
- Active Routes (with % change)
- Team Members (with count change)
- Avg. Processing Time (with % improvement)

**Recent Activity:**
- Last 4 dispatch completions
- Timestamp display
- Icon indicators

**Quick Actions:**
- New Dispatch
- View Reports
- Team Status
- Analytics

### Dispatch Report (`/outbound/dispatch-report`)

**Layout:**
- Header with title and description
- Control panel (column toggles, save draft)
- Editable table (horizontal scroll)
- Footer with add row and submit buttons

**Table Columns:**
1. # (sequence)
2. Cluster (autocomplete)
3. Station (auto-fill)
4. Region (auto-fill)
5. TO Count (number input)
6. OID Loaded (number input)
7. Docked Time (datetime-local)
8. Dock # (text + confirm button)
9. Depart Time (datetime-local)
10. Processor (text input)
11. LH Trip (text, optional, toggleable)
12. Plate # (text, optional, toggleable)
13. Fleet Size (select, toggleable)
14. Ops ID (text + auto-lookup)
15. Actions (delete button)

**Interactions:**
- Type 3+ characters in Cluster → Show suggestions
- Select cluster → Auto-fill Station, Region, Dock
- Enter Ops ID → Auto-lookup name
- Click dock confirm → Toggle checkmark
- Click column toggle → Show/hide column
- Click save draft → Manual save
- Click add row → Add new empty row (max 10)
- Click submit → Validate and submit all rows

**Auto-save:**
- Triggers every 10 seconds
- Saves to LocalStorage with session key
- Shows toast on draft load

### Prealert Database (`/outbound/prealert`)

**Layout:**
- Filter panel (top)
- Data table (main)
- Pagination controls (bottom)

**Filters:**
- Region (select)
- Status (select: Pending/Ongoing/Completed)
- Date range (start/end date pickers)
- Search (text input)

**Table Columns:**
- Batch ID
- Cluster Name
- Station
- Region
- Status
- Docked Time
- Depart Time
- Processor
- Submitted By
- Actions (view details)

**Actions:**
- Export to CSV
- Refresh data
- View row details (modal)

---

## Component Library

### Core UI Components

**Button** (`components/ui/button.tsx`)
- Variants: default, destructive, outline, secondary, ghost, link
- Sizes: default, sm, lg, icon
- States: default, hover, active, disabled, loading

**Input** (`components/ui/input.tsx`)
- Types: text, number, email, password, datetime-local
- States: default, focus, error, disabled, readonly
- Features: placeholder, auto-complete, validation

**Card** (`components/ui/card.tsx`)
- Parts: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- Variants: default, elevated (with shadow)

**Select** (`components/ui/select.tsx`)
- Radix UI primitive
- Features: keyboard navigation, search, groups
- Parts: Trigger, Content, Item, Separator

**Dialog** (`components/ui/dialog.tsx`)
- Modal overlay
- Parts: Trigger, Content, Header, Title, Description, Footer
- Features: close on escape, focus trap

**Toast** (`components/ui/toast.tsx`)
- Variants: default, destructive
- Auto-dismiss (configurable)
- Action buttons support
- Queue management

### Layout Components

**Layout** (`components/layout.tsx`)
- Main wrapper with sidebar and content area
- Header with user menu and theme toggle
- Responsive breakpoints

**Sidebar** (`components/sidebar.tsx`)
- Collapsible navigation
- Nested menu support
- Active state management
- Logo and branding

### Specialized Components

**Theme Toggle** (`components/theme-toggle.tsx`)
- Sun/Moon icon toggle
- Dropdown with Light/Dark/System options
- Instant theme switching

**Theme Preset Selector** (`components/theme-preset-selector.tsx`)
- Color palette preview
- Preset selection
- Live preview

**Chat Popup** (`components/chat-popup.tsx`)
- Help widget
- Floating action button
- Expandable chat interface

---

## Data Flow

### Authentication Flow

```
User Login
  ↓
[Auth Context] → Store user + token
  ↓
[LocalStorage] → Persist session
  ↓
[API Requests] → Include token in headers
  ↓
[Protected Routes] → Check authentication
```

### Dispatch Report Flow

```
User Input
  ↓
[Local State] → Update row data
  ↓
[Auto-save Timer] → Save to LocalStorage (every 10s)
  ↓
[Validation] → Check required fields
  ↓
[API Call] → Submit to Supabase
  ↓
[Webhook] → Sync to Google Sheets
  ↓
[Success] → Clear draft, show toast
```

### Google Sheets Sync Flow

```
Google Sheets (Master Data)
  ↓ [Hourly Trigger]
Apps Script → Fetch data
  ↓
Supabase API → Update tables
  ↓
Web App → Real-time data available

Web App → Submit dispatch
  ↓
Supabase → Insert record
  ↓ [Webhook Trigger]
Apps Script → Append to sheet
  ↓
Google Sheets (Dispatch Reports)
```

---

## State Management

### Global State (Context API)

**Auth Context:**
```typescript
interface AuthContextType {
  user: User | null
  token: string | null
  login: (userData: User, authToken: string) => void
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  isAuthenticated: boolean
}
```

**Theme Context:**
```typescript
interface ThemeProviderState {
  theme: "dark" | "light" | "system"
  setTheme: (theme: Theme) => void
  themePreset: ThemePreset
  setThemePreset: (preset: ThemePreset) => void
}
```

### Local State

**Component State:**
- Form inputs (React Hook Form)
- UI toggles (useState)
- Loading states (useState)
- Error states (useState)

**Persistent State:**
- Draft data (LocalStorage)
- User preferences (LocalStorage)
- Session data (SessionStorage)

---

## API Integration

### Supabase Client

**Configuration:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)
```

### API Service Layer

**Authentication:**
- `authApi.login(ops_id, password)` - Backroom login
- `authApi.googleLogin(id_token)` - FTE OAuth login
- `authApi.changePassword(ops_id, old_password, new_password)` - Password change

**Lookups:**
- `lookupApi.getUser(ops_id)` - User info lookup
- `lookupApi.getClusters(region?, query?)` - Cluster search
- `lookupApi.getHubs(cluster?)` - Hub lookup
- `lookupApi.getProcessors(query?)` - Processor search

**Dispatch Operations:**
- `dispatchApi.submitRows(rows, submitted_by_ops_id)` - Submit dispatch entries
- `dispatchApi.getDispatches(params)` - Fetch dispatch records with filters
- `dispatchApi.verifyRows(verifyData)` - Verify dispatch rows (Data Team)

**KPI Data:**
- `kpiApi.getMDT(params?)` - MDT compliance data
- `kpiApi.getWorkstation(params?)` - Workstation utilization
- `kpiApi.getProductivity(params?)` - Productivity metrics
- `kpiApi.getIntraday(date?)` - Intraday performance

### Error Handling

**Pattern:**
```typescript
const { data, error } = await supabase.from('table').select()
if (error) return { error: error.message }
return { data }
```

**User Feedback:**
- Toast notifications for errors
- Inline validation messages
- Loading states during API calls

---

## Security Features

### Authentication

- JWT token-based authentication
- Secure password hashing (bcrypt)
- Google OAuth 2.0 integration
- Session timeout (configurable)
- Auto-logout on inactivity

### Authorization

- Role-based access control (RBAC)
- Protected routes with auth guards
- API-level permission checks
- Row-level security (Supabase RLS)

### Data Protection

- HTTPS only (production)
- Environment variable protection
- No sensitive data in client code
- Secure token storage (httpOnly cookies recommended)
- CORS configuration

### Input Validation

- Client-side validation (Zod schemas)
- Server-side validation (Supabase functions)
- SQL injection prevention (parameterized queries)
- XSS prevention (React auto-escaping)

---

## Performance Optimizations

### Code Splitting

- Route-based code splitting (React.lazy)
- Dynamic imports for heavy components
- Vendor bundle separation

### Caching

- LocalStorage for drafts and preferences
- API response caching (where appropriate)
- Static asset caching (service worker)

### Rendering

- React.memo for expensive components
- useCallback for event handlers
- useMemo for computed values
- Virtual scrolling for large lists (future)

### Bundle Size

- Tree-shaking (Vite)
- Minification (production build)
- Compression (gzip/brotli)
- Lazy loading images

### Network

- Debounced search inputs
- Optimistic UI updates
- Request deduplication
- Pagination for large datasets

---

## Browser Support

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅
- Mobile browsers (iOS Safari, Chrome Mobile) ✅

---

## Accessibility Compliance

- WCAG 2.1 Level AA
- Keyboard navigation
- Screen reader support
- Focus management
- ARIA labels and roles
- Color contrast ratios
- Semantic HTML

---

## Future Enhancements

### Planned Features
- Real-time notifications (WebSocket)
- Advanced analytics dashboard
- Mobile app (React Native)
- Offline mode (PWA)
- Multi-language support (i18n)
- Advanced reporting (PDF export)
- Audit logs
- Bulk operations

### Technical Improvements
- GraphQL API layer
- Redis caching
- WebSocket integration
- Service worker for offline
- E2E testing (Playwright)
- Performance monitoring (Sentry)
- A/B testing framework

---

## Maintenance & Support

### Monitoring
- Error tracking (Sentry recommended)
- Performance monitoring (Web Vitals)
- User analytics (Google Analytics)
- API health checks

### Logging
- Client-side error logging
- API request/response logging
- User action tracking
- Performance metrics

### Updates
- Semantic versioning (SemVer)
- Changelog maintenance
- Migration guides
- Deprecation notices

---

## Contact & Resources

**Documentation:**
- [README.md](./README.md) - Project overview
- [QUICKSTART.md](./docs/QUICKSTART.md) - Getting started guide
- [DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Development guide
- [SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) - Backend setup

**Support:**
- System Administrator
- Development Team
- Internal Wiki (if available)

---

**Last Updated:** 2024
**Version:** 1.0.0
**License:** Internal use only - Proprietary
