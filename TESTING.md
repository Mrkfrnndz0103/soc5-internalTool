# Testing Guide

## Overview

This project uses **Vitest** (TestSprite) for unit and integration testing with React Testing Library.

## Setup

Testing dependencies are already installed:
- `vitest` - Fast unit test framework
- `@vitest/ui` - Visual test UI
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom matchers for DOM
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM implementation for Node.js

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

## Test Structure

```
src/
└── test/
    ├── setup.ts           # Test configuration and mocks
    ├── utils.test.ts      # Utility function tests
    ├── api.test.ts        # API integration tests
    └── login.test.tsx     # Component tests
```

## Writing Tests

### Basic Test Example

```typescript
import { describe, it, expect } from 'vitest'

describe('Feature Name', () => {
  it('should do something', () => {
    expect(1 + 1).toBe(2)
  })
})
```

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MyComponent from '../components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(
      <BrowserRouter>
        <MyComponent />
      </BrowserRouter>
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Mocking Example

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('API Calls', () => {
  it('should fetch data', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: 'test' })
    global.fetch = mockFetch
    
    // Your test code here
    expect(mockFetch).toHaveBeenCalled()
  })
})
```

## Test Coverage

To add coverage reporting, update `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

Then run:
```bash
npm test -- --coverage
```

## Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **Isolation**: Each test should be independent and not rely on other tests
4. **Mocking**: Mock external dependencies (API calls, localStorage, etc.)
5. **Coverage**: Aim for high coverage but focus on critical paths

## Current Test Suite

### ✅ Utils Tests
- Tests utility functions like `cn` (className merger)

### ✅ API Tests
- Validates API configuration
- Checks environment variables

### ✅ Login Tests
- Tests basic rendering functionality

## Adding More Tests

### Priority Areas to Test

1. **Authentication Flow**
   - Login with Backroom credentials
   - Login with Google OAuth
   - Password change functionality

2. **Dispatch Report**
   - Form validation
   - Auto-complete functionality
   - Draft persistence
   - Row submission

3. **Prealert Database**
   - Filtering functionality
   - Data display
   - Export to CSV

4. **API Integration**
   - Mock API responses
   - Error handling
   - Data transformation

## Troubleshooting

### Tests Not Running
- Ensure `vitest` is installed: `npm install -D vitest`
- Check `vitest.config.ts` exists and is properly configured

### Component Import Errors
- Verify component exports are correct
- Check file paths in imports
- Ensure all dependencies are mocked

### localStorage Errors
- localStorage is mocked in `src/test/setup.ts`
- Add additional mocks as needed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
