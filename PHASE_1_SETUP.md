# Phase 1: Project Setup & Configuration

## Overview
This phase covers the initial setup of Next.js 14, dependency installation, and basic configuration files. This is the foundation for the entire migration process.

## Prerequisites
- Node.js 18+ installed
- Git repository access
- Current Vite project backed up
- Supabase project credentials

---

## Step 1: Create New Next.js Project

### 1.1 Initialize Next.js Project
```bash
# Create new Next.js project with latest features and Turbopack
npx create-next-app@latest outbound-internal-tool-nextjs --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbo

# Navigate to project directory
cd outbound-internal-tool-nextjs
```

### 1.2 Install Modern Dependencies
```bash
# Core modern dependencies
npm install @supabase/supabase-js@latest @supabase/auth-helpers-nextjs@latest
npm install @radix-ui/react-dialog@latest @radix-ui/react-dropdown-menu@latest @radix-ui/react-command@latest
npm install zod@latest lucide-react@latest gsap@latest date-fns@latest
npm install class-variance-authority@latest clsx@latest tailwind-merge@latest tailwindcss-animate@latest
npm install next-themes@latest cmdk@latest vaul@latest

# Modern development dependencies
npm install -D @next/bundle-analyzer@latest @playwright/test@latest msw@latest
npm install -D @testing-library/react@latest @testing-library/jest-dom@latest
npm install -D jest@latest jest-environment-jsdom@latest
```

---

## Step 2: Configuration Files

### 2.1 Next.js 15 Configuration (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable latest experimental features
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Modern image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  
  // Redirects for old routes
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
  
  // Enhanced security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  
  // Bundle analyzer (optional)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      )
      return config
    },
  }),
}

module.exports = nextConfig
```

### 2.2 Modern TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/types/*": ["./types/*"],
      "@/app/*": ["./app/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2.3 Modern Package.json
```json
{
  "name": "outbound-internal-tool",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "analyze": "ANALYZE=true next build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  },
  "dependencies": {
    "next": "^15.0.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.45.4",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@radix-ui/react-accordion": "^1.2.1",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.2",
    "@radix-ui/react-command": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-tooltip": "^1.1.3",
    "@tanstack/react-table": "^8.20.5",
    "@hookform/resolvers": "^3.9.0",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.8",
    "tailwindcss": "^3.4.14",
    "lucide-react": "^0.451.0",
    "gsap": "^3.12.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    "date-fns": "^4.1.0",
    "next-themes": "^0.3.0",
    "cmdk": "^1.0.0",
    "vaul": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.7.9",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "typescript": "^5.6.3",
    "eslint": "^9.13.0",
    "eslint-config-next": "^15.0.3",
    "@next/bundle-analyzer": "^15.0.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@playwright/test": "^1.48.2",
    "msw": "^2.4.11"
  }
}
```

### 2.4 Tailwind Configuration (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 2.5 Environment Variables (`.env.local`)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Server-side only variables
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Custom API endpoints
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Optional: Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### 2.6 Environment Variables Template (`.env.example`)
```bash
# Copy this file to .env.local and fill in your values

# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server-side Supabase Key (Optional - for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Configuration (Optional)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Feature Flags (Optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true

# Google Sheets Integration (Optional)
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
```

---

## Step 3: Basic Directory Structure

### 3.1 Create Required Directories
```bash
# Create directory structure
mkdir -p app/(auth)/login
mkdir -p app/(dashboard)/dashboard
mkdir -p app/(dashboard)/dispatch-report
mkdir -p app/(dashboard)/prealert
mkdir -p app/api/auth/login
mkdir -p app/api/auth/logout
mkdir -p app/api/dispatch
mkdir -p app/api/lookups/clusters
mkdir -p app/api/lookups/processors
mkdir -p app/api/kpi
mkdir -p components/ui
mkdir -p components/layout
mkdir -p components/forms
mkdir -p components/tables
mkdir -p lib
mkdir -p hooks
mkdir -p types
```

### 3.2 Create Basic Files
```bash
# Create essential files
touch app/layout.tsx
touch app/page.tsx
touch app/loading.tsx
touch app/error.tsx
touch app/not-found.tsx
touch app/globals.css
touch middleware.ts
touch lib/utils.ts
touch lib/supabase.ts
touch types/index.ts
```

---

## Step 4: Global Styles Setup

### 4.1 Global CSS (`app/globals.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  @apply bg-muted;
}

::-webkit-scrollbar-thumb {
  @apply bg-border rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground;
}

/* Loading animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Focus styles */
.focus-visible {
  @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
}
```

---

## Step 5: Basic Utility Functions

### 5.1 Utility Functions (`lib/utils.ts`)
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string | number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}

export function truncate(str: string, length: number) {
  return str.length > length ? `${str.substring(0, length)}...` : str
}
```

### 5.2 Supabase Client (`lib/supabase.ts`)
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Client-side Supabase client
export const createClient = () => createClientComponentClient()

// Server-side Supabase client
export const createServerClient = () => createServerComponentClient({ cookies })

// Database types (to be expanded later)
export type Database = {
  public: {
    Tables: {
      dispatch_reports: {
        Row: {
          id: string
          created_at: string
          user_id: string
          cluster: string
          processor: string
          station: string
          region: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          cluster: string
          processor: string
          station: string
          region: string
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          cluster?: string
          processor?: string
          station?: string
          region?: string
          status?: string
        }
      }
    }
  }
}
```

---

## Step 6: Basic Type Definitions

### 6.1 Core Types (`types/index.ts`)
```typescript
export interface User {
  id: string
  email: string
  ops_id: string
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

export interface DispatchReport {
  id: string
  cluster: string
  processor: string
  station: string
  region: string
  dock_number: string
  status: 'pending' | 'ongoing' | 'completed'
  created_at: string
  updated_at: string
  user_id: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}
```

---

## Step 7: Verification & Testing

### 7.1 Start Development Server
```bash
# Start the development server
npm run dev

# The app should be available at http://localhost:3000
```

### 7.2 Verify Installation
```bash
# Check TypeScript compilation
npm run type-check

# Check linting
npm run lint

# Test build process
npm run build
```

### 7.3 Basic Health Check
Create a simple test page to verify everything is working:

```typescript
// app/test/page.tsx
export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Next.js Setup Complete!</h1>
      <p className="text-muted-foreground">
        Phase 1 configuration is working correctly.
      </p>
    </div>
  )
}
```

---

## Troubleshooting

### Common Issues

1. **TypeScript Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run dev
   ```

2. **Tailwind Not Working**
   ```bash
   # Verify Tailwind installation
   npm list tailwindcss
   # Restart development server
   ```

3. **Environment Variables Not Loading**
   - Ensure `.env.local` exists
   - Restart development server
   - Check variable names start with `NEXT_PUBLIC_` for client-side access

4. **Import Path Issues**
   - Verify `tsconfig.json` paths configuration
   - Restart TypeScript server in IDE

---

## Phase 1 Completion Checklist

- [ ] Next.js 14 project created
- [ ] All dependencies installed
- [ ] Configuration files created and configured
- [ ] Directory structure established
- [ ] Global styles implemented
- [ ] Basic utilities and types defined
- [ ] Development server running successfully
- [ ] TypeScript compilation working
- [ ] Linting configured and passing
- [ ] Environment variables configured

## Next Steps

Once Phase 1 is complete, proceed to **Phase 2: Authentication & Middleware** to set up user authentication and route protection.