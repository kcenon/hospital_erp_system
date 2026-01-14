# Test Strategy Guide

## Document Information

| Item             | Content          |
| ---------------- | ---------------- |
| Document Version | 0.1.0.0          |
| Created Date     | 2025-12-29       |
| Status           | Draft            |
| Manager          | kcenon@naver.com |

---

## 1. Test Strategy Overview

### 1.1 Test Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲          5~10%
                 ╱──────╲         - Core user scenarios
                ╱        ╲        - Playwright/Cypress
               ╱Integration╲      20~30%
              ╱──────────────╲    - API tests
             ╱                ╲   - Module integration
            ╱    Unit Tests     ╲   60~70%
           ╱──────────────────────╲ - Business logic
          ╱                        ╲- Utility functions
         ╱__________________________ ╲
```

### 1.2 Test Goals

| Metric                | Target      | Measurement Method        |
| --------------------- | ----------- | ------------------------- |
| Code Coverage         | >= 80%      | Jest coverage             |
| Core Feature Coverage | 100%        | Checklist                 |
| Test Execution Time   | < 5 minutes | CI pipeline               |
| Bug Escape Rate       | < 5%        | Post-deployment bug count |

### 1.3 Test Tools

| Tool                      | Purpose                | Layer           |
| ------------------------- | ---------------------- | --------------- |
| **Jest**                  | Unit/Integration tests | Backend, Shared |
| **React Testing Library** | Component tests        | Frontend        |
| **Playwright**            | E2E tests              | Full stack      |
| **Supertest**             | API tests              | Backend         |
| **MSW**                   | API mocking            | Frontend        |

---

## 2. Unit Tests

### 2.1 Backend Unit Tests (NestJS)

**Service Test Example**

```typescript
// patient.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PatientService } from './patient.service';
import { PatientRepository } from './patient.repository';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';

describe('PatientService', () => {
  let service: PatientService;
  let repository: jest.Mocked<PatientRepository>;

  // Test fixtures
  const mockPatient = {
    id: 'uuid-1234',
    patientNumber: 'P2025001234',
    name: 'John Doe',
    birthDate: new Date('1990-05-15'),
    gender: 'M' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        {
          provide: PatientRepository,
          useValue: createMock<PatientRepository>(),
        },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
    repository = module.get(PatientRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should find patient by ID', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(mockPatient);

      // Act
      const result = await service.findOne('uuid-1234');

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1234' },
        relations: expect.any(Array),
      });
      expect(result.name).toBe('John Doe');
    });

    it('should throw NotFoundException for non-existent patient', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      patientNumber: 'P2025005678',
      name: 'Jane Doe',
      birthDate: '1985-03-20',
      gender: 'F' as const,
    };

    it('should create new patient', async () => {
      // Arrange
      repository.findByPatientNumber.mockResolvedValue(null);
      repository.create.mockReturnValue(mockPatient);
      repository.save.mockResolvedValue(mockPatient);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(repository.findByPatientNumber).toHaveBeenCalledWith('P2025005678');
      expect(repository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ConflictException for duplicate patient number', async () => {
      // Arrange
      repository.findByPatientNumber.mockResolvedValue(mockPatient);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('calculateAge', () => {
    it('should calculate age from birth date', () => {
      // Test based on current year
      const birthDate = new Date('1990-05-15');
      const expectedAge = new Date().getFullYear() - 1990;

      const result = service['calculateAge'](birthDate);

      expect(result).toBe(expectedAge);
    });
  });
});
```

### 2.2 Frontend Unit Tests (React)

**Component Test Example**

```typescript
// PatientCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientCard } from './PatientCard';

describe('PatientCard', () => {
  const mockPatient = {
    id: 'uuid-1234',
    patientNumber: 'P2025001234',
    name: 'John Doe',
    age: 34,
    gender: 'M',
    roomNumber: '301-A',
    status: 'stable' as const,
  };

  it('should display patient information', () => {
    render(<PatientCard patient={mockPatient} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('P2025001234')).toBeInTheDocument();
    expect(screen.getByText('34 years old')).toBeInTheDocument();
    expect(screen.getByText('301-A')).toBeInTheDocument();
  });

  it('should call onSelect callback when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(<PatientCard patient={mockPatient} onSelect={onSelect} />);

    await user.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith(mockPatient);
  });

  it('should display correct color badge based on status', () => {
    const { rerender } = render(<PatientCard patient={mockPatient} />);

    expect(screen.getByTestId('status-badge')).toHaveClass('bg-green-500');

    rerender(
      <PatientCard patient={{ ...mockPatient, status: 'critical' }} />
    );

    expect(screen.getByTestId('status-badge')).toHaveClass('bg-red-500');
  });
});
```

**Custom Hook Test**

```typescript
// usePatient.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePatient } from './usePatient';
import { patientApi } from '@/lib/api';

jest.mock('@/lib/api');

describe('usePatient', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient.clear();
  });

  it('should successfully fetch patient data', async () => {
    const mockPatient = { id: 'uuid-1234', name: 'John Doe' };
    (patientApi.getById as jest.Mock).mockResolvedValue(mockPatient);

    const { result } = renderHook(() => usePatient('uuid-1234'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPatient);
  });

  it('should return error state on failure', async () => {
    const error = new Error('Patient not found');
    (patientApi.getById as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => usePatient('invalid-id'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
```

---

## 3. Integration Tests

### 3.1 API Integration Tests

```typescript
// patient.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('PatientController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Login test user
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'testuser', password: 'testpass' });

    accessToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.patient.deleteMany({
      where: { patientNumber: { startsWith: 'TEST' } },
    });
    await app.close();
  });

  describe('POST /patients', () => {
    it('should create new patient', async () => {
      const createDto = {
        patientNumber: 'TEST001234',
        name: 'Test Patient',
        birthDate: '1990-01-15',
        gender: 'M',
      };

      const response = await request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Patient');
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 400 error for invalid data', async () => {
      const invalidDto = {
        patientNumber: 'INVALID', // Wrong format
        name: '', // Empty string
        birthDate: 'not-a-date', // Invalid date
      };

      const response = await request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BAD_REQUEST');
    });

    it('should return 401 error without authentication', async () => {
      await request(app.getHttpServer())
        .post('/patients')
        .send({ patientNumber: 'TEST002345', name: 'Test' })
        .expect(401);
    });
  });

  describe('GET /patients/:id', () => {
    let createdPatientId: string;

    beforeAll(async () => {
      // Create test patient
      const patient = await prisma.patient.create({
        data: {
          patientNumber: 'TEST999999',
          name: 'Query Test',
          birthDate: new Date('1985-06-20'),
          gender: 'F',
        },
      });
      createdPatientId = patient.id;
    });

    it('should retrieve patient details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/patients/${createdPatientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.name).toBe('Query Test');
      expect(response.body.data.patientNumber).toBe('TEST999999');
    });

    it('should return 404 error for non-existent patient', async () => {
      await request(app.getHttpServer())
        .get('/patients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
```

### 3.2 Database Integration Tests

```typescript
// patient.repository.integration.spec.ts
import { PrismaClient } from '@prisma/client';
import { PatientRepository } from './patient.repository';

describe('PatientRepository (Integration)', () => {
  let prisma: PrismaClient;
  let repository: PatientRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    repository = new PatientRepository(prisma);
  });

  afterAll(async () => {
    await prisma.patient.deleteMany({
      where: { patientNumber: { startsWith: 'REPO_TEST' } },
    });
    await prisma.$disconnect();
  });

  describe('findAndCount', () => {
    beforeAll(async () => {
      // Create test data
      await prisma.patient.createMany({
        data: [
          {
            patientNumber: 'REPO_TEST_001',
            name: 'Patient Kim',
            birthDate: new Date('1990-01-01'),
            gender: 'M',
          },
          {
            patientNumber: 'REPO_TEST_002',
            name: 'Patient Lee',
            birthDate: new Date('1985-06-15'),
            gender: 'F',
          },
          {
            patientNumber: 'REPO_TEST_003',
            name: 'Patient Park',
            birthDate: new Date('1970-12-25'),
            gender: 'M',
          },
        ],
      });
    });

    it('should return paginated list', async () => {
      const [patients, total] = await repository.findAndCount({
        where: { patientNumber: { startsWith: 'REPO_TEST' } },
        skip: 0,
        take: 2,
      });

      expect(patients).toHaveLength(2);
      expect(total).toBe(3);
    });

    it('should apply search filter', async () => {
      const [patients, total] = await repository.findAndCount({
        where: {
          patientNumber: { startsWith: 'REPO_TEST' },
          name: { contains: 'Kim' },
        },
      });

      expect(total).toBe(1);
      expect(patients[0].name).toBe('Patient Kim');
    });
  });
});
```

---

## 4. E2E Tests (End-to-End)

### 4.1 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 E2E Test Scenarios

```typescript
// e2e/patient-admission.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Patient Admission Process', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'clerk001');
    await page.fill('[data-testid="password"]', 'testpass123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('Complete process from new patient registration to admission', async ({ page }) => {
    // 1. Navigate to patient registration page
    await page.click('[data-testid="nav-patients"]');
    await page.click('[data-testid="add-patient-button"]');

    // 2. Enter patient information
    await page.fill('[data-testid="patient-number"]', 'P2025999999');
    await page.fill('[data-testid="patient-name"]', 'E2E Test Patient');
    await page.fill('[data-testid="birth-date"]', '1990-05-15');
    await page.selectOption('[data-testid="gender"]', 'M');
    await page.fill('[data-testid="phone"]', '010-1234-5678');

    // 3. Save
    await page.click('[data-testid="save-patient-button"]');
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();

    // 4. Register admission
    await page.click('[data-testid="admit-patient-button"]');

    // 5. Select room
    await page.click('[data-testid="room-301"]');
    await page.click('[data-testid="bed-A"]');

    // 6. Enter admission information
    await page.fill('[data-testid="diagnosis"]', 'E2E test diagnosis');
    await page.selectOption('[data-testid="admission-type"]', 'SCHEDULED');
    await page.selectOption('[data-testid="attending-doctor"]', 'doctor001');

    // 7. Confirm admission
    await page.click('[data-testid="confirm-admission-button"]');

    // 8. Verify result
    await expect(page.locator('[data-testid="admission-success-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="admission-number"]')).toHaveText(/A\d{10}/);

    // 9. Verify in room status
    await page.click('[data-testid="nav-rooms"]');
    await expect(page.locator('[data-testid="room-301-bed-A"]')).toHaveClass(/occupied/);
  });

  test('Vital signs input and retrieval', async ({ page }) => {
    // Navigate to patient detail page
    await page.goto('/patients/test-patient-id');

    // Click vitals tab
    await page.click('[data-testid="tab-vitals"]');

    // Enter new vital signs
    await page.click('[data-testid="add-vital-button"]');

    await page.fill('[data-testid="temperature"]', '36.5');
    await page.fill('[data-testid="systolic-bp"]', '120');
    await page.fill('[data-testid="diastolic-bp"]', '80');
    await page.fill('[data-testid="pulse-rate"]', '72');
    await page.fill('[data-testid="respiratory-rate"]', '18');
    await page.fill('[data-testid="oxygen-saturation"]', '98');

    await page.click('[data-testid="save-vital-button"]');

    // Verify save
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();

    // Verify in list
    await expect(page.locator('[data-testid="vital-list"]')).toContainText('36.5');
    await expect(page.locator('[data-testid="vital-list"]')).toContainText('120/80');
  });
});

test.describe('Mobile Rounding', () => {
  test.use({ ...devices['iPad Pro'] });

  test('Record rounding on tablet', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'doctor001');
    await page.fill('[data-testid="password"]', 'testpass123');
    await page.click('[data-testid="login-button"]');

    // Start rounding
    await page.click('[data-testid="start-round-button"]');

    // First patient
    await page.click('[data-testid="patient-item-0"]');

    // Select status
    await page.click('[data-testid="status-stable"]');

    // Enter observation
    await page.fill('[data-testid="observation"]', 'Condition good, no abnormalities');

    // Save and next patient
    await page.click('[data-testid="save-next-button"]');

    // Verify next patient
    await expect(page.locator('[data-testid="current-patient"]')).not.toHaveText('First Patient');
  });
});
```

---

## 5. Test Data Management

### 5.1 Test Fixtures

```typescript
// test/fixtures/patient.fixture.ts
import { Patient } from '@prisma/client';

export const createPatientFixture = (
  overrides?: Partial<Patient>,
): Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> => ({
  patientNumber: `P${Date.now()}`,
  name: 'Test Patient',
  birthDate: new Date('1990-01-15'),
  gender: 'M',
  bloodType: 'A+',
  phone: '010-1234-5678',
  emergencyContact: 'Guardian',
  emergencyPhone: '010-9876-5432',
  address: 'Seoul, Gangnam',
  legacyPatientId: null,
  legacySyncAt: null,
  isActive: true,
  deletedAt: null,
  ...overrides,
});

export const createAdmissionFixture = (
  patientId: string,
  bedId: string,
  overrides?: Partial<any>,
) => ({
  admissionNumber: `A${Date.now()}`,
  patientId,
  bedId,
  admissionDate: new Date(),
  admissionTime: new Date(),
  admissionType: 'SCHEDULED',
  diagnosis: 'Test diagnosis',
  status: 'ACTIVE',
  ...overrides,
});
```

### 5.2 Test Data Seeding

```typescript
// test/setup/seed-test-data.ts
import { PrismaClient } from '@prisma/client';
import { createPatientFixture } from '../fixtures/patient.fixture';

export async function seedTestData(prisma: PrismaClient) {
  // Test user
  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      employeeId: 'TEST001',
      username: 'testuser',
      passwordHash: await hashPassword('testpass'),
      name: 'Test User',
      department: 'Test Department',
      isActive: true,
    },
  });

  // Test patients
  const patients = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.patient.create({
        data: createPatientFixture({
          patientNumber: `SEED${String(i).padStart(6, '0')}`,
          name: `Seed Patient ${i + 1}`,
        }),
      }),
    ),
  );

  return { testUser, patients };
}

export async function cleanupTestData(prisma: PrismaClient) {
  await prisma.patient.deleteMany({
    where: { patientNumber: { startsWith: 'SEED' } },
  });
  await prisma.user.deleteMany({
    where: { username: 'testuser' },
  });
}
```

---

## 6. Test Coverage

### 6.1 Jest Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
```

### 6.2 Coverage Report

```bash
# Run coverage
pnpm test --coverage

# View results
open coverage/lcov-report/index.html
```

---

## 7. CI/CD Test Integration

### 7.1 GitHub Actions Test Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
    branches: [main, develop]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Run migrations
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 8. Checklist

### Test Writing Checklist

- [ ] Unit tests written for new features
- [ ] Edge cases covered (null, empty arrays, boundary values)
- [ ] Error cases tested
- [ ] API endpoint integration tests
- [ ] E2E tests for main user scenarios
- [ ] Coverage maintained at 80%+
- [ ] CI pipeline passing
