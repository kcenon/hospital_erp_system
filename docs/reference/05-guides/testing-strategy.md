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
                ╱        ╲        - Cypress
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

| Tool                            | Purpose                | Layer           |
| ------------------------------- | ---------------------- | --------------- |
| **Jest**                        | Unit/Integration tests | Backend, Shared |
| **Cypress**                     | E2E tests              | Frontend        |
| **Supertest**                   | API tests              | Backend         |
| ~~React Testing Library~~ (TBD) | Component tests        | Frontend        |
| ~~MSW~~ (TBD)                   | API mocking            | Frontend        |

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

### 4.1 Cypress Configuration

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    specPattern: 'cypress/e2e/**/*.cy.{ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    screenshotOnRunFailure: true,
    video: false,
  },
});
```

### 4.2 E2E Test Scenarios

```typescript
// cypress/e2e/patient-admission.cy.ts
describe('Patient Admission Process', () => {
  beforeEach(() => {
    // Login
    cy.visit('/login');
    cy.get('[data-testid="username"]').type('clerk001');
    cy.get('[data-testid="password"]').type('testpass123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('Complete process from new patient registration to admission', () => {
    // 1. Navigate to patient registration page
    cy.get('[data-testid="nav-patients"]').click();
    cy.get('[data-testid="add-patient-button"]').click();

    // 2. Enter patient information
    cy.get('[data-testid="patient-number"]').type('P2025999999');
    cy.get('[data-testid="patient-name"]').type('E2E Test Patient');
    cy.get('[data-testid="birth-date"]').type('1990-05-15');
    cy.get('[data-testid="gender"]').select('M');
    cy.get('[data-testid="phone"]').type('010-1234-5678');

    // 3. Save
    cy.get('[data-testid="save-patient-button"]').click();
    cy.get('[data-testid="toast-success"]').should('be.visible');

    // 4. Register admission
    cy.get('[data-testid="admit-patient-button"]').click();

    // 5. Select room
    cy.get('[data-testid="room-301"]').click();
    cy.get('[data-testid="bed-A"]').click();

    // 6. Enter admission information
    cy.get('[data-testid="diagnosis"]').type('E2E test diagnosis');
    cy.get('[data-testid="admission-type"]').select('SCHEDULED');
    cy.get('[data-testid="attending-doctor"]').select('doctor001');

    // 7. Confirm admission
    cy.get('[data-testid="confirm-admission-button"]').click();

    // 8. Verify result
    cy.get('[data-testid="admission-success-modal"]').should('be.visible');
    cy.get('[data-testid="admission-number"]')
      .invoke('text')
      .should('match', /A\d{10}/);

    // 9. Verify in room status
    cy.get('[data-testid="nav-rooms"]').click();
    cy.get('[data-testid="room-301-bed-A"]').should('have.class', 'occupied');
  });

  it('Vital signs input and retrieval', () => {
    // Navigate to patient detail page
    cy.visit('/patients/test-patient-id');

    // Click vitals tab
    cy.get('[data-testid="tab-vitals"]').click();

    // Enter new vital signs
    cy.get('[data-testid="add-vital-button"]').click();

    cy.get('[data-testid="temperature"]').type('36.5');
    cy.get('[data-testid="systolic-bp"]').type('120');
    cy.get('[data-testid="diastolic-bp"]').type('80');
    cy.get('[data-testid="pulse-rate"]').type('72');
    cy.get('[data-testid="respiratory-rate"]').type('18');
    cy.get('[data-testid="oxygen-saturation"]').type('98');

    cy.get('[data-testid="save-vital-button"]').click();

    // Verify save
    cy.get('[data-testid="toast-success"]').should('be.visible');

    // Verify in list
    cy.get('[data-testid="vital-list"]').should('contain', '36.5');
    cy.get('[data-testid="vital-list"]').should('contain', '120/80');
  });
});

describe('Mobile Rounding', () => {
  beforeEach(() => {
    cy.viewport('ipad-2');
  });

  it('Record rounding on tablet', () => {
    cy.visit('/login');
    cy.get('[data-testid="username"]').type('doctor001');
    cy.get('[data-testid="password"]').type('testpass123');
    cy.get('[data-testid="login-button"]').click();

    // Start rounding
    cy.get('[data-testid="start-round-button"]').click();

    // First patient
    cy.get('[data-testid="patient-item-0"]').click();

    // Select status
    cy.get('[data-testid="status-stable"]').click();

    // Enter observation
    cy.get('[data-testid="observation"]').type('Condition good, no abnormalities');

    // Save and next patient
    cy.get('[data-testid="save-next-button"]').click();

    // Verify next patient
    cy.get('[data-testid="current-patient"]').should('not.contain', 'First Patient');
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

      - name: Run E2E tests
        run: pnpm --filter @hospital-erp/frontend cypress:run:ci

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-screenshots
          path: apps/frontend/cypress/screenshots/
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
