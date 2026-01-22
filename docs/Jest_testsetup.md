# Jest_testsetup

This guide explains the Jest configuration and usage for the Next.js project.

## Configuration

- Config: `jest.config.cjs`
- Setup: `jest.setup.ts`
- Test environment: jsdom

## Running Tests

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

## Writing Tests

- Place tests under `src/test` or alongside components.
- Use `@testing-library/react` for UI tests.
- Prefer user-centric assertions.

## Example

```tsx
import { render, screen } from "@testing-library/react"

it("renders heading", () => {
  render(<h1>Test</h1>)
  expect(screen.getByText("Test")).toBeInTheDocument()
})
```

## Common Pitfalls

- Missing jsdom environment.
- Missing moduleNameMapper for alias `@/`.
- Not mocking browser-only APIs.

Last Updated: 2026-01-22
