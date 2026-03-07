# Testing Guide for StackIt

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- PostgreSQL running (Docker container: `stackit-postgres`)
- Dependencies installed (`npm install`)
- Prisma client generated (`npx prisma generate`)

### Run All Tests

```powershell
# Using the test runner script (recommended)
./run-tests.ps1

# Or using npm
npm test
```

### Run Specific Test Files

```powershell
# Authentication tests
npm test src/lib/auth.test.ts

# Questions tests
npm test src/lib/questions.test.ts

# Answers and voting tests
npm test src/lib/answers-voting.test.ts

# Reputation tests
npm test src/lib/reputation.test.ts

# Features tests (bookmarks, notifications, tags, follow)
npm test src/lib/features.test.ts

# API integration tests
npm test src/lib/api-integration.test.ts

# E2E workflow tests
npm test src/lib/e2e-workflows.test.ts

# Existing tests
npm test src/lib/comments.test.ts
npm test src/lib/follow.test.ts
```

## 📁 Test Files Overview

| File | Description | Test Count |
|------|-------------|------------|
| `auth.test.ts` | Authentication & security | 18 tests |
| `questions.test.ts` | Questions CRUD operations | 25 tests |
| `answers-voting.test.ts` | Answers & voting system | 30 tests |
| `reputation.test.ts` | Reputation & leaderboard | 22 tests |
| `features.test.ts` | Bookmarks, notifications, tags, follow | 45 tests |
| `comments.test.ts` | Comments system | 3 tests |
| `follow.test.ts` | Follow validation | existing |
| `api-integration.test.ts` | API routes integration | 30 tests |
| `e2e-workflows.test.ts` | End-to-end user workflows | 6 workflows |

## 🎯 Test Categories

### Unit Tests (60%)
Testing individual functions and services in isolation:
- Authentication logic
- Question validation
- Answer logic
- Reputation calculations
- Vote handling
- Comment processing

### Integration Tests (30%)
Testing API routes and database interactions:
- Question API endpoints
- Answer API endpoints
- Vote API endpoints
- User API endpoints
- Bookmark API endpoints
- Search functionality

### E2E Tests (10%)
Testing complete user workflows:
- Question lifecycle (post → answer → vote → accept)
- Discussion workflow (comment → mention → reply)
- Follow and discover workflow
- Bookmark organization workflow
- Reputation tracking workflow
- Search and discovery workflow

## 🛠 Test Database Setup

The tests use a separate test database (`stack_it_test`) to avoid affecting development data.

### Automatic Setup (via script)
The `run-tests.ps1` script automatically:
1. Checks PostgreSQL connection
2. Creates test database if needed
3. Runs migrations
4. Executes tests
5. Generates summary report

### Manual Setup
```powershell
# Set test database URL
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/stack_it_test"

# Create test database
docker exec stackit-postgres psql -U postgres -c "CREATE DATABASE stack_it_test"

# Run migrations
npx prisma db push

# Generate Prisma client
npx prisma generate

# Run tests
npm test
```

## 📊 Understanding Test Output

### Successful Test
```
✅ should create user with valid data
   Duration: 0.12s
```

### Failed Test
```
❌ should reject invalid password
   Error: Expected false but got true
   Duration: 0.08s
```

### Test Summary
```
📊 Test Summary
================================

Total Test Suites: 9
Passed: 9
Failed: 0
Success Rate: 100%
```

## 🔍 Debugging Failed Tests

### View Detailed Error Messages
Tests use Node.js native test runner which provides detailed stack traces.

### Common Issues

#### Database Connection Failed
```
Error: Cannot connect to database
```
**Solution**: Ensure PostgreSQL is running
```powershell
docker ps | Select-String stackit-postgres
```

#### Prisma Client Not Generated
```
Error: @prisma/client not found
```
**Solution**: Generate Prisma client
```powershell
npx prisma generate
```

#### Test Database Locked
```
Error: Database is locked
```
**Solution**: Close other connections or restart
```powershell
docker restart stackit-postgres
```

## 🎨 Writing New Tests

### Test Template
```typescript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initTestDb,
  cleanupTestDb,
  createTestUser,
  // other helpers
} from './test-utils';

describe('Feature Name', () => {
  const prisma = initTestDb();

  beforeEach(async () => {
    await cleanupTestDb();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  describe('Specific Functionality', () => {
    it('should do something', async () => {
      // Arrange
      const user = await createTestUser();

      // Act
      const result = await someFunction(user.id);

      // Assert
      assert.strictEqual(result, expectedValue);
    });
  });
});
```

### Best Practices
1. ✅ Use descriptive test names
2. ✅ Follow AAA pattern (Arrange-Act-Assert)
3. ✅ Clean up test data (use beforeEach/afterEach)
4. ✅ Use test helpers from `test-utils.ts`
5. ✅ Test both happy path and edge cases
6. ✅ Keep tests independent (no shared state)
7. ✅ Make tests deterministic (no random failures)

## 📈 Code Coverage

### Generate Coverage Report
```powershell
# Install coverage tool (if not installed)
npm install --save-dev c8

# Run tests with coverage
npx c8 npm test

# View detailed HTML report
npx c8 --reporter=html npm test
# Open coverage/index.html in browser
```

### Coverage Goals
- Overall: 80%+
- Critical paths: 100%
- Branch coverage: 90%+

## 🔄 CI/CD Integration

### GitHub Actions
Create `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Generate Prisma Client
        run: npx prisma generate
      
      - name: Setup test database
        run: |
          npx prisma db push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/stack_it_test
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/stack_it_test
          NODE_ENV: test
```

## 🆘 Troubleshooting

### Tests Running Slow?
- Run specific test files instead of all tests
- Optimize database queries
- Use test database with indexes
- Run tests in parallel (if supported)

### Tests Failing Intermittently?
- Check for race conditions
- Ensure test data cleanup
- Verify no shared state between tests
- Check for timing-dependent assertions

### Database Issues?
- Verify PostgreSQL is running
- Check connection string
- Ensure test database exists
- Run migrations

## 📚 Additional Resources

- [Node.js Test Runner Documentation](https://nodejs.org/api/test.html)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Testing Best Practices](https://testingjavascript.com/)

## ✅ Checklist Before Committing

- [ ] All tests pass locally
- [ ] New features have tests
- [ ] Bug fixes have regression tests
- [ ] Test coverage maintained or improved
- [ ] No console.log or debugging code
- [ ] Test database cleaned up

---

**Happy Testing! 🚀**

For questions or issues, please refer to `TEST_PLAN.md` and `TEST_SUMMARY.md`.
