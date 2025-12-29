# Phase 6: Testing & Deployment

## Overview
This final phase covers comprehensive testing, performance optimization, security hardening, and deployment to production. It includes testing strategies, deployment configurations, monitoring setup, and post-deployment verification.

## Prerequisites
- Phase 1-5 completed successfully
- All features implemented and working
- Database properly configured
- Environment variables set up

---

## Step 1: Testing Strategy

### 1.1 Testing Dependencies
```bash
# Install testing dependencies
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jest jest-environment-jsdom
npm install -D @types/jest
npm install -D msw # Mock Service Worker for API mocking
npm install -D playwright # E2E testing
```

### 1.2 Jest Configuration (`jest.config.js`)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

### 1.3 Jest Setup (`jest.setup.js`)
```javascript
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/dashboard'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
  }),
}))

// Mock GSAP
jest.mock('gsap', () => ({
  to: jest.fn(),
  from: jest.fn(),
  set: jest.fn(),
  timeline: jest.fn(() => ({
    to: jest.fn(),
    from: jest.fn(),
  })),
}))
```

---

## Step 2: Unit Tests

### 2.1 Utility Functions Test (`__tests__/lib/utils.test.ts`)
```typescript
import { cn, formatDate, formatDateTime, truncate } from '@/lib/utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2')
      expect(cn('px-4', 'px-2')).toBe('px-2') // Tailwind merge
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toBe('January 15, 2024')
    })

    it('should handle string dates', () => {
      expect(formatDate('2024-01-15')).toBe('January 15, 2024')
    })
  })

  describe('formatDateTime', () => {
    it('should format datetime correctly', () => {
      const date = new Date('2024-01-15T10:30:00')
      const formatted = formatDateTime(date)
      expect(formatted).toContain('Jan 15, 2024')
      expect(formatted).toContain('10:30')
    })
  })

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('This is a long string', 10)).toBe('This is a ...')
    })

    it('should not truncate short strings', () => {
      expect(truncate('Short', 10)).toBe('Short')
    })
  })
})
```

### 2.2 Component Tests (`__tests__/components/ui/button.test.tsx`)
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### 2.3 Hook Tests (`__tests__/hooks/use-local-storage.test.ts`)
```typescript
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/use-local-storage'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
  })

  it('should return initial value when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    expect(result.current[0]).toBe('initial')
  })

  it('should return stored value from localStorage', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'))
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    expect(result.current[0]).toBe('stored-value')
  })

  it('should update localStorage when value changes', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    act(() => {
      result.current[1]('new-value')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify('new-value')
    )
  })
})
```

---

## Step 3: Integration Tests

### 3.1 API Route Tests (`__tests__/api/dispatch.test.ts`)
```typescript
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/dispatch/route'

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } }
      })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            cluster: 'Test Cluster',
            processor: 'Test Processor',
            station: 'Test Station',
            region: 'North',
            dock_number: '1',
            status: 'pending',
            created_at: '2024-01-15T10:00:00Z'
          }
        ],
        error: null
      })
    }))
  })
}))

describe('/api/dispatch', () => {
  describe('GET', () => {
    it('should return dispatch reports', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/dispatch',
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].cluster).toBe('Test Cluster')
    })

    it('should handle filters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/dispatch?region=North&status=pending',
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.region).toBe('North')
      expect(data.filters.status).toBe('pending')
    })
  })

  describe('POST', () => {
    it('should create dispatch reports', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          rows: [
            {
              cluster: 'New Cluster',
              processor: 'New Processor',
              station: 'New Station',
              region: 'South',
              dock_number: '2'
            }
          ]
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toContain('created successfully')
    })

    it('should validate input data', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          rows: [
            {
              // Missing required fields
              cluster: '',
              processor: ''
            }
          ]
        }
      })

      const response = await POST(req as any)
      
      expect(response.status).toBe(400)
    })
  })
})
```

---

## Step 4: End-to-End Tests

### 4.1 Playwright Configuration (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 4.2 E2E Test Example (`e2e/auth.spec.ts`)
```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login')
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Click user menu and logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Log out')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})
```

### 4.3 Dispatch Report E2E Test (`e2e/dispatch-report.spec.ts`)
```typescript
import { test, expect } from '@playwright/test'

test.describe('Dispatch Report', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create dispatch report', async ({ page }) => {
    await page.goto('/dispatch-report')
    
    // Fill form
    await page.click('[data-testid="cluster-select"]')
    await page.click('text=Test Cluster')
    
    await page.click('[data-testid="processor-select"]')
    await page.click('text=Test Processor')
    
    await page.fill('input[name="rows.0.station"]', 'Test Station')
    await page.fill('input[name="rows.0.dock_number"]', '1')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text=created successfully')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/dispatch-report')
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Cluster is required')).toBeVisible()
    await expect(page.locator('text=Processor is required')).toBeVisible()
  })

  test('should add and remove rows', async ({ page }) => {
    await page.goto('/dispatch-report')
    
    // Should start with 1 row
    await expect(page.locator('[data-testid="dispatch-row"]')).toHaveCount(1)
    
    // Add row
    await page.click('text=Add Row')
    await expect(page.locator('[data-testid="dispatch-row"]')).toHaveCount(2)
    
    // Remove row
    await page.click('[data-testid="remove-row"]:last-child')
    await expect(page.locator('[data-testid="dispatch-row"]')).toHaveCount(1)
  })
})
```

---

## Step 5: Performance Testing

### 5.1 Lighthouse CI Configuration (`.lighthouserc.js`)
```javascript
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/login',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/dispatch-report',
        'http://localhost:3000/prealert',
      ],
      startServerCommand: 'npm run start',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

### 5.2 Performance Test Script (`scripts/performance-test.js`)
```javascript
const { chromium } = require('playwright')

async function performanceTest() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  // Enable performance metrics
  await page.goto('http://localhost:3000/dashboard')
  
  // Measure page load time
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0]
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    }
  })
  
  console.log('Performance Metrics:', performanceMetrics)
  
  // Test form interaction performance
  await page.goto('http://localhost:3000/dispatch-report')
  
  const startTime = Date.now()
  await page.fill('input[name="rows.0.station"]', 'Performance Test Station')
  const endTime = Date.now()
  
  console.log(`Form interaction time: ${endTime - startTime}ms`)
  
  await browser.close()
}

performanceTest().catch(console.error)
```

---

## Step 6: Security Testing

### 6.1 Security Headers Test (`__tests__/security.test.ts`)
```typescript
import { createMocks } from 'node-mocks-http'

describe('Security Headers', () => {
  it('should include security headers', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      url: '/',
    })

    // This would test your middleware or API routes
    // Implementation depends on your security header setup
    
    expect(res.getHeaders()).toMatchObject({
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
    })
  })
})
```

### 6.2 Input Validation Test (`__tests__/validation.test.ts`)
```typescript
import { dispatchReportSchema, bulkDispatchSchema } from '@/lib/validations'

describe('Input Validation', () => {
  describe('dispatchReportSchema', () => {
    it('should validate correct data', () => {
      const validData = {
        cluster: 'Test Cluster',
        processor: 'Test Processor',
        station: 'Test Station',
        region: 'North',
        dock_number: '1',
      }
      
      expect(() => dispatchReportSchema.parse(validData)).not.toThrow()
    })

    it('should reject invalid data', () => {
      const invalidData = {
        cluster: '', // Empty required field
        processor: 'Test Processor',
        station: 'Test Station',
        region: 'North',
        dock_number: '1',
      }
      
      expect(() => dispatchReportSchema.parse(invalidData)).toThrow()
    })

    it('should sanitize optional fields', () => {
      const dataWithOptionals = {
        cluster: 'Test Cluster',
        processor: 'Test Processor',
        station: 'Test Station',
        region: 'North',
        dock_number: '1',
        fleet_size: 150, // Should be rejected (max 100)
      }
      
      expect(() => dispatchReportSchema.parse(dataWithOptionals)).toThrow()
    })
  })

  describe('bulkDispatchSchema', () => {
    it('should limit array size', () => {
      const tooManyRows = Array(15).fill({
        cluster: 'Test Cluster',
        processor: 'Test Processor',
        station: 'Test Station',
        region: 'North',
        dock_number: '1',
      })
      
      expect(() => bulkDispatchSchema.parse(tooManyRows)).toThrow()
    })
  })
})
```

---

## Step 7: Deployment Configuration

### 7.1 Production Environment Variables (`.env.production`)
```bash
# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key

# Production Google Sheets
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/your-prod-script-id/exec
GOOGLE_SHEETS_WEBHOOK_SECRET=your-prod-webhook-secret
GOOGLE_SHEETS_WEBHOOK_URL=https://your-prod-domain.com/api/webhooks/google-sheets

# Production Settings
NEXT_PUBLIC_APP_URL=https://your-prod-domain.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_LOG_LEVEL=error
NEXT_PUBLIC_CACHE_TTL=600

# Security
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-prod-domain.com
```

### 7.2 Docker Configuration (`Dockerfile`)
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 7.3 Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### 7.4 Nginx Configuration (`nginx.conf`)
```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## Step 8: CI/CD Pipeline

### 8.1 GitHub Actions Workflow (`.github/workflows/ci-cd.yml`)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run linting
      run: npm run lint
    
    - name: Run unit tests
      run: npm test -- --coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
    
    - name: Build application
      run: npm run build
    
    - name: Run E2E tests
      run: |
        npm run build
        npm start &
        npx wait-on http://localhost:3000
        npx playwright test
        
  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to production
      run: |
        # Add your deployment script here
        echo "Deploying to production..."
        
    - name: Run smoke tests
      run: |
        # Add smoke tests for production
        curl -f https://your-domain.com/api/health
```

---

## Step 9: Monitoring and Logging

### 9.1 Health Check API (`app/api/health/route.ts`)
```typescript
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Test database connection
    const { error } = await supabase.from('users').select('id').limit(1)
    
    if (error) {
      throw new Error('Database connection failed')
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      database: 'connected'
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
```

### 9.2 Error Monitoring (`lib/monitoring.ts`)
```typescript
interface ErrorReport {
  message: string
  stack?: string
  url: string
  userAgent: string
  userId?: string
  timestamp: string
  level: 'error' | 'warn' | 'info'
}

export function reportError(error: Error, context?: Record<string, any>) {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
    timestamp: new Date().toISOString(),
    level: 'error',
    ...context
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Report:', report)
  }

  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/monitoring/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    }).catch(console.error)
  }
}

export function reportPerformance(metric: string, value: number, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/monitoring/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric,
        value,
        timestamp: new Date().toISOString(),
        ...context
      })
    }).catch(console.error)
  }
}
```

---

## Step 10: Post-Deployment Verification

### 10.1 Smoke Tests (`scripts/smoke-tests.js`)
```javascript
const https = require('https')

const tests = [
  {
    name: 'Health Check',
    url: 'https://your-domain.com/api/health',
    expectedStatus: 200
  },
  {
    name: 'Login Page',
    url: 'https://your-domain.com/login',
    expectedStatus: 200
  },
  {
    name: 'Dashboard (should redirect to login)',
    url: 'https://your-domain.com/dashboard',
    expectedStatus: 302
  }
]

async function runSmokeTests() {
  console.log('Running smoke tests...')
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url)
      const success = response.status === test.expectedStatus
      
      console.log(`${success ? '✅' : '❌'} ${test.name}: ${response.status}`)
      
      if (!success) {
        process.exit(1)
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`)
      process.exit(1)
    }
  }
  
  console.log('All smoke tests passed! 🎉')
}

runSmokeTests()
```

### 10.2 Performance Monitoring Script (`scripts/monitor-performance.js`)
```javascript
const { chromium } = require('playwright')

async function monitorPerformance() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  // Monitor key pages
  const pages = [
    '/login',
    '/dashboard',
    '/dispatch-report',
    '/prealert'
  ]
  
  for (const pagePath of pages) {
    console.log(`Testing ${pagePath}...`)
    
    const startTime = Date.now()
    await page.goto(`https://your-domain.com${pagePath}`)
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      }
    })
    
    console.log(`${pagePath} - Load Time: ${loadTime}ms`)
    console.log(`${pagePath} - Metrics:`, metrics)
    
    // Alert if performance is poor
    if (loadTime > 3000) {
      console.warn(`⚠️  ${pagePath} is loading slowly (${loadTime}ms)`)
    }
  }
  
  await browser.close()
}

monitorPerformance().catch(console.error)
```

---

## Phase 6 Completion Checklist

- [ ] Unit tests implemented and passing
- [ ] Integration tests for API routes
- [ ] End-to-end tests with Playwright
- [ ] Performance testing configured
- [ ] Security testing implemented
- [ ] Docker configuration created
- [ ] CI/CD pipeline set up
- [ ] Production environment configured
- [ ] Monitoring and logging implemented
- [ ] Health checks working
- [ ] Smoke tests passing
- [ ] Performance monitoring active
- [ ] Error reporting configured
- [ ] SSL certificates configured
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] Backup strategy implemented
- [ ] Documentation updated

## Final Deployment Steps

1. **Pre-deployment**:
   - Run all tests locally
   - Verify environment variables
   - Test database migrations
   - Backup current production data

2. **Deployment**:
   - Deploy to staging first
   - Run smoke tests on staging
   - Deploy to production
   - Run post-deployment verification

3. **Post-deployment**:
   - Monitor application performance
   - Check error logs
   - Verify all features working
   - Monitor user feedback

## Success Metrics

- **Performance**: Page load times < 2 seconds
- **Availability**: 99.9% uptime
- **Security**: No critical vulnerabilities
- **User Experience**: Positive user feedback
- **Reliability**: Error rate < 0.1%

The migration from Vite + React to Next.js 14 is now complete with a production-ready application that includes comprehensive testing, monitoring, and deployment infrastructure.