# E2E Tests - FLE Expert

This directory contains End-to-End tests using Playwright to verify critical user flows.

## Prerequisites

Before running tests, ensure:
1. **Backend is running** on `http://localhost:3003`
2. **Frontend is running** on `http://localhost:5173`
3. **Database has seed data** with test users:
   - Candidate: `candidat@test.com` / `password123`
   - Admin/Coach: `admin@test.com` / `password123`

## Running Tests

### Headless Mode (CI/CD)
```bash
npm run test:e2e
```

### UI Mode (Development)
```bash
npx playwright test --ui
```

### Debug Mode
```bash
npx playwright test --debug
```

### Run Specific Test
```bash
npx playwright test auth.spec.ts
```

## Test Suites

### 1. Authentication (`auth.spec.ts`)
- ✅ Login with valid credentials
- ✅ Error handling for invalid credentials

### 2. Exam Flow (`exam.spec.ts`)
- ✅ Complete exam session from start to finish
- ✅ Answer questions
- ✅ View results and certificate

### 3. Logbook (`logbook.spec.ts`)
- ✅ Student submits proof
- ✅ Coach validates proof

## Troubleshooting

### Tests fail with "Connection refused"
- Ensure both backend (3003) and frontend (5173) are running
- Check `docker ps` if using Docker

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if backend is responding slowly

### Database issues
- Run `npx prisma db seed` to populate test data
- Ensure test users exist in the database

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run E2E Tests
  run: |
    npm run dev &
    cd client && npm run dev &
    sleep 10
    cd client && npm run test:e2e
```
