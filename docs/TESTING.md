# Testing Guide

This guide covers testing strategies and procedures for the e-BizCard platform.

## Testing Strategy

### 1. Unit Tests
- **Web App**: React components, hooks, and utilities
- **Mobile App**: React Native components, screens, and services
- **API**: Edge functions and business logic

### 2. Integration Tests
- Authentication flow
- Database operations
- API integrations
- Component interactions

### 3. End-to-End (E2E) Tests
- User journeys
- Cross-browser compatibility
- Mobile app flows

### 4. Performance Tests
- Load testing
- Memory usage
- Bundle size analysis

## Running Tests

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Quick Start
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:web
npm run test:mobile
npm run test:e2e
```

### Individual Test Commands

#### Web App Tests
```bash
cd apps/web

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test CardView.test.tsx
```

#### Mobile App Tests
```bash
cd apps/mobile

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test DashboardScreen.test.tsx
```

#### E2E Tests
```bash
cd apps/web

# Install Cypress (if not already installed)
npm install --save-dev cypress

# Run E2E tests in headless mode
npx cypress run

# Run E2E tests in interactive mode
npx cypress open
```

## Test Structure

### Web App Tests
```
apps/web/src/__tests__/
├── components/
│   ├── CardView.test.tsx
│   ├── QRCodeGenerator.test.tsx
│   └── ...
├── pages/
│   ├── auth/
│   │   ├── login.test.tsx
│   │   └── register.test.tsx
│   └── dashboard.test.tsx
├── integration/
│   ├── auth-flow.test.tsx
│   └── business-card-flow.test.tsx
└── utils/
    ├── qrCode.test.ts
    └── vCard.test.ts
```

### Mobile App Tests
```
apps/mobile/src/__tests__/
├── screens/
│   ├── DashboardScreen.test.tsx
│   ├── CardEditorScreen.test.tsx
│   └── ...
├── components/
│   └── ...
├── services/
│   ├── supabase.test.ts
│   └── ...
└── utils/
    ├── qrCode.test.ts
    └── vCard.test.ts
```

### E2E Tests
```
apps/web/cypress/
├── e2e/
│   ├── auth.cy.ts
│   ├── business-card.cy.ts
│   └── ...
├── fixtures/
│   └── ...
└── support/
    ├── commands.ts
    └── e2e.ts
```

## Test Configuration

### Jest Configuration
- **Web App**: `apps/web/jest.config.js`
- **Mobile App**: `apps/mobile/jest.config.js`

### Cypress Configuration
- **E2E Tests**: `apps/web/cypress.config.ts`

### Test Setup Files
- **Web App**: `apps/web/jest.setup.js`
- **Mobile App**: `apps/mobile/jest.setup.js`

## Writing Tests

### Unit Test Example
```typescript
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CardView } from '@/components/card/CardView'

describe('CardView Component', () => {
  it('renders card information correctly', () => {
    const mockCard = {
      id: '1',
      name: 'John Doe',
      job_title: 'Software Engineer',
      company: 'Tech Corp',
    }

    render(<CardView card={mockCard} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
  })
})
```

### Integration Test Example
```typescript
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth-context'
import LoginPage from '@/app/auth/login/page'

describe('Authentication Flow', () => {
  it('handles successful login', async () => {
    // Mock Supabase
    const mockSignIn = jest.fn()
    jest.mock('@/lib/supabase/client', () => ({
      supabase: {
        auth: {
          signInWithPassword: mockSignIn,
        },
      },
    }))

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </QueryClientProvider>
    )

    // Test login flow
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    })
    fireEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })
})
```

### E2E Test Example
```typescript
describe('Business Card Management', () => {
  it('should create a new business card', () => {
    cy.visit('/dashboard')
    
    cy.get('button').contains('Create New Card').click()
    cy.url().should('include', '/card-editor')
    
    cy.get('input[name="name"]').type('John Doe')
    cy.get('input[name="job_title"]').type('Software Engineer')
    cy.get('input[name="company"]').type('Tech Corp')
    
    cy.get('button[type="submit"]').click()
    
    cy.url().should('include', '/dashboard')
    cy.get('h3').should('contain', 'John Doe')
  })
})
```

## Test Data Management

### Mock Data
- Use consistent mock data across tests
- Create reusable mock functions
- Keep mock data up-to-date with schema changes

### Test Database
- Use in-memory database for tests
- Reset database state between tests
- Use transactions for test isolation

## Coverage Requirements

### Minimum Coverage
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Continuous Integration

### GitHub Actions
- Run tests on every push
- Run tests on pull requests
- Generate coverage reports
- Upload test results

### Test Environments
- **Development**: Local testing
- **Staging**: Pre-production testing
- **Production**: Smoke tests only

## Debugging Tests

### Common Issues
1. **Async operations**: Use `waitFor` and `act`
2. **Mocking**: Ensure mocks are properly configured
3. **Timing**: Use appropriate timeouts
4. **State**: Reset state between tests

### Debug Commands
```bash
# Run tests in debug mode
npm test -- --debug

# Run specific test with verbose output
npm test -- --verbose CardView.test.tsx

# Run tests with coverage and watch
npm run test:coverage -- --watch
```

## Best Practices

### 1. Test Structure
- Use descriptive test names
- Group related tests with `describe`
- Use `beforeEach` and `afterEach` for setup/cleanup

### 2. Assertions
- Use specific assertions
- Test behavior, not implementation
- Test edge cases and error conditions

### 3. Mocking
- Mock external dependencies
- Use realistic mock data
- Keep mocks simple and focused

### 4. Performance
- Keep tests fast
- Use parallel execution
- Avoid unnecessary setup

## Troubleshooting

### Common Problems
1. **Tests failing**: Check mock configurations
2. **Slow tests**: Optimize async operations
3. **Flaky tests**: Add proper waits and assertions
4. **Coverage issues**: Add missing test cases

### Getting Help
- Check test logs for errors
- Use debugging tools
- Review test documentation
- Ask team for assistance

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Cypress Documentation](https://docs.cypress.io/guides/overview/why-cypress)

### Tools
- [Jest](https://jestjs.io/) - JavaScript testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) - React component testing
- [Cypress](https://www.cypress.io/) - E2E testing framework
- [MSW](https://mswjs.io/) - API mocking library

---

For questions or issues with testing, please open an issue in the GitHub repository.
