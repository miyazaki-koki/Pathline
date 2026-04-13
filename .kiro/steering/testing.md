# Testing Standards & Strategy

## Testing Philosophy

We follow these core testing principles:

1. **Behavior-Driven Testing**: Test what users experience, not implementation details
2. **Fast Execution**: Tests should complete in seconds
3. **Reliable Tests**: Tests are deterministic and don't flake
4. **Comprehensive Coverage**: Cover happy paths, edge cases, and error scenarios
5. **Maintainability**: Tests are easy to write, read, and update

## Test Framework & Tools

### Testing Framework
- **Framework**: {{TEST_FRAMEWORK}}
- **Assertion Library**: {{ASSERTION_LIBRARY}}
- **Test Runner**: {{TEST_RUNNER}}
- **Coverage Tool**: {{COVERAGE_TOOL}}

### Mocking & Fixtures
- **Mocking Library**: {{MOCKING_LIBRARY}}
- **Fixture Management**: {{FIXTURE_TOOL}}
- **Factory Library**: {{FACTORY_LIBRARY}}

### Integration Testing
- **API Testing**: {{API_TEST_TOOL}}
- **Database Testing**: {{DB_TEST_TOOL}}
- **Service Mocking**: {{SERVICE_MOCK_TOOL}}

### End-to-End Testing
- **E2E Framework**: {{E2E_FRAMEWORK}}
- **Browser Automation**: {{BROWSER_AUTOMATION}}
- **Visual Regression**: {{VISUAL_REGRESSION_TOOL}}

## Test Organization

### Directory Structure

```
tests/
├── unit/
│   ├── {{domain}}/
│   │   ├── services/
│   │   ├── utils/
│   │   └── components/
│   └── shared/
│
├── integration/
│   ├── api/
│   ├── {{domain}}/
│   └── database/
│
├── e2e/
│   ├── user-flows/
│   ├── critical-paths/
│   └── accessibility/
│
└── fixtures/
    ├── mocks/
    ├── factories/
    └── data/
```

### Test File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Unit tests | `*.test.{{EXT}}` or `*.spec.{{EXT}}` | `userService.test.ts` |
| Integration tests | `*.integration.{{EXT}}` | `userAPI.integration.ts` |
| E2E tests | `*.e2e.{{EXT}}` | `loginFlow.e2e.ts` |

## Test Development Standards

### AAA Pattern (Arrange-Act-Assert)

All tests should follow the AAA pattern:

```{{LANGUAGE}}
describe('UserService', () => {
  it('should create user with valid data', () => {
    // Arrange: Set up test data and dependencies
    const userData = { name: 'John', email: 'john@example.com' };
    const userService = new UserService(mockRepository);

    // Act: Execute the functionality being tested
    const result = userService.create(userData);

    // Assert: Verify the results
    expect(result).toHaveProperty('id');
    expect(result.name).toBe('John');
  });
});
```

### Test Naming

- Test names should describe **what** is being tested and **what** should happen
- Format: `should [expected behavior] when [condition]`
- Be specific and descriptive

**Good Examples**:
```
should return user with generated ID when valid data provided
should throw ValidationError when email is missing
should retry request up to 3 times when network error occurs
```

**Bad Examples**:
```
test user creation
should work
test error handling
```

### Mocking Patterns

#### Service Mocking

<!-- TODO: Define service mocking approach -->

```{{LANGUAGE}}
// Mock entire service
jest.mock('@/services/UserService');
const mockUserService = UserService as jest.Mocked<typeof UserService>;

// Mock specific method
mockUserService.create.mockResolvedValue(mockUser);

// Verify calls
expect(mockUserService.create).toHaveBeenCalledWith(userData);
```

#### API Mocking

<!-- TODO: Define API mocking strategy -->

```{{LANGUAGE}}
// Mock HTTP requests
jest.mock('fetch');
(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: async () => mockData,
});
```

#### Database Mocking

<!-- TODO: Define database mocking approach -->

```{{LANGUAGE}}
// Mock database operations
jest.mock('@/db/repository');
const mockRepository = {
  find: jest.fn(),
  save: jest.fn(),
};
```

### Test Fixtures & Factories

**Factory Pattern for Test Data**:

```{{LANGUAGE}}
// Create reusable test data factories
const createUser = (overrides = {}) => ({
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
});

// Usage in tests
const user = createUser({ name: 'Custom Name' });
```

## Test Coverage Requirements

### Coverage Targets

| Category | Target | Rule |
|----------|--------|------|
| **Statements** | `{{STATEMENT_COVERAGE}}%` | All code paths executed |
| **Branches** | `{{BRANCH_COVERAGE}}%` | All conditions tested |
| **Functions** | `{{FUNCTION_COVERAGE}}%` | All functions called |
| **Lines** | `{{LINE_COVERAGE}}%` | All lines executed |

### Coverage Measurement

```bash
{{TEST_COMMAND}} --coverage
```

### What NOT to Test

- Third-party library internals
- Generated code
- Simple getters/setters
- Configuration files
- Test utilities themselves

### What TO Test

- Business logic and rules
- Error handling and edge cases
- Integration between components
- User-facing behavior
- Async operations and timing

## Unit Tests

### Scope

Unit tests verify individual functions, methods, or components in isolation.

### Test Scenarios Required

**Every unit test should include**:
- ✓ Happy path (expected successful behavior)
- ✓ Edge cases (boundaries, empty values, limits)
- ✓ Error cases (invalid input, failures)

### Example Unit Test

```{{LANGUAGE}}
describe('formatCurrency', () => {
  // Happy path
  it('should format USD currency correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
  });

  // Edge cases
  it('should handle zero amount', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('should handle negative amounts', () => {
    expect(formatCurrency(-50, 'USD')).toBe('-$50.00');
  });

  // Error cases
  it('should throw error for invalid currency code', () => {
    expect(() => formatCurrency(100, 'INVALID')).toThrow();
  });
});
```

## Integration Tests

### Scope

Integration tests verify multiple components working together, typically across API boundaries or database operations.

### Scenarios

- API endpoint integration with service layer
- Service layer with database/repository layer
- Multiple services working together
- Third-party service integration

### Example Integration Test

```{{LANGUAGE}}
describe('User API Integration', () => {
  it('should create user and return with ID', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@example.com' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('John');
  });

  it('should persist user to database', async () => {
    await request(app)
      .post('/api/users')
      .send({ name: 'Jane', email: 'jane@example.com' });

    const user = await repository.findByEmail('jane@example.com');
    expect(user).toBeDefined();
  });
});
```

## E2E Tests

### Scope

E2E tests verify complete user workflows from end-to-end.

### Test Scenarios

- User registration and login flow
- Critical user journeys
- Multi-step workflows
- Form submissions and validations
- Navigation and state management

### Example E2E Test

```{{LANGUAGE}}
describe('User Registration Flow', () => {
  it('should complete full registration', async () => {
    // Visit registration page
    await page.goto('/register');

    // Fill form
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirm"]', 'SecurePass123!');

    // Submit form
    await page.click('button:has-text("Register")');

    // Verify success
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});
```

## Manual Testing

### Scenarios Requiring Manual Testing

- Visual layout and design
- Accessibility (screen reader, keyboard navigation)
- Cross-browser compatibility
- Touch interactions on mobile
- Performance and responsiveness

### Test Checklist

- [ ] Visual design matches specification
- [ ] All interactive elements respond correctly
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces content properly
- [ ] Mobile layout is responsive
- [ ] Loading states are visible
- [ ] Error messages are clear

## Commands

### Running Tests

```bash
# Run all tests
{{TEST_COMMAND}}

# Run tests in watch mode
{{TEST_COMMAND}} --watch

# Run specific test file
{{TEST_COMMAND}} -- userService.test.ts

# Run tests matching pattern
{{TEST_COMMAND}} -- --testNamePattern="should create"
```

### Coverage Reports

```bash
# Generate coverage report
{{TEST_COMMAND}} --coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Debugging Tests

```bash
# Run tests with debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Run single test
{{TEST_COMMAND}} -- --testNamePattern="specific test name"
```

## Testing Best Practices

### DO

- ✅ Write tests as you write code (TDD)
- ✅ Keep tests simple and focused
- ✅ Use descriptive test names
- ✅ Test behavior, not implementation
- ✅ Keep test data realistic
- ✅ Clean up after tests (reset state)
- ✅ Test error paths
- ✅ Make tests independent (no dependencies between tests)

### DON'T

- ❌ Test implementation details
- ❌ Create interdependent tests
- ❌ Use hard-coded delays (use proper async waiting)
- ❌ Test third-party libraries
- ❌ Ignore flaky tests
- ❌ Have overly broad mocks
- ❌ Skip error case testing
- ❌ Test UI component internals

## Performance Testing

<!-- TODO: Define performance testing approach if applicable -->

- Load testing tool: {{LOAD_TEST_TOOL}}
- Target response time: {{TARGET_RESPONSE_TIME}}
- Acceptable error rate: {{ACCEPTABLE_ERROR_RATE}}
- Load test scenarios: {{LOAD_SCENARIOS}}

## Continuous Integration

### Test Execution in CI

```yaml
# Tests must pass before merge
- Run: {{TEST_COMMAND}}
- Coverage: {{COVERAGE_TARGET}}% minimum
- No flaky tests allowed
- All test types required (unit, integration, e2e)
```

### Coverage Enforcement

- Minimum coverage: {{COVERAGE_TARGET}}%
- Coverage must not decrease
- New code must maintain coverage standards
