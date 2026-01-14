# 테스트 전략 가이드

## 문서 정보

| 항목      | 내용             |
| --------- | ---------------- |
| 문서 버전 | 0.1.0.0          |
| 작성일    | 2025-12-29       |
| 상태      | 초안             |
| 관리자    | kcenon@naver.com |

---

## 1. 테스트 전략 개요

### 1.1 테스트 피라미드

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲          5~10%
                 ╱──────╲         - 핵심 사용자 시나리오
                ╱        ╲        - Playwright/Cypress
               ╱ 통합 테스트╲      20~30%
              ╱──────────────╲    - API 테스트
             ╱                ╲   - 모듈 간 연동
            ╱    단위 테스트     ╲   60~70%
           ╱──────────────────────╲ - 비즈니스 로직
          ╱                        ╲- 유틸리티 함수
         ╱__________________________ ╲
```

### 1.2 테스트 목표

| 메트릭             | 목표  | 측정 방법       |
| ------------------ | ----- | --------------- |
| 코드 커버리지      | ≥ 80% | Jest coverage   |
| 주요 기능 커버리지 | 100%  | 체크리스트      |
| 테스트 실행 시간   | < 5분 | CI 파이프라인   |
| 버그 탈출률        | < 5%  | 배포 후 버그 수 |

### 1.3 테스트 도구

| 도구                      | 용도             | 레이어          |
| ------------------------- | ---------------- | --------------- |
| **Jest**                  | 단위/통합 테스트 | Backend, Shared |
| **React Testing Library** | 컴포넌트 테스트  | Frontend        |
| **Playwright**            | E2E 테스트       | 전체            |
| **Supertest**             | API 테스트       | Backend         |
| **MSW**                   | API 모킹         | Frontend        |

---

## 2. 단위 테스트 (Unit Tests)

### 2.1 Backend 단위 테스트 (NestJS)

**서비스 테스트 예시**

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

  // 테스트용 픽스처
  const mockPatient = {
    id: 'uuid-1234',
    patientNumber: 'P2025001234',
    name: '홍길동',
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
    it('환자 ID로 환자를 조회해야 한다', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(mockPatient);

      // Act
      const result = await service.findOne('uuid-1234');

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1234' },
        relations: expect.any(Array),
      });
      expect(result.name).toBe('홍길동');
    });

    it('존재하지 않는 환자는 NotFoundException을 던져야 한다', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      patientNumber: 'P2025005678',
      name: '김환자',
      birthDate: '1985-03-20',
      gender: 'F' as const,
    };

    it('새 환자를 생성해야 한다', async () => {
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

    it('중복된 환자번호는 ConflictException을 던져야 한다', async () => {
      // Arrange
      repository.findByPatientNumber.mockResolvedValue(mockPatient);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('calculateAge', () => {
    it('생년월일로 나이를 계산해야 한다', () => {
      // 현재 연도 기준으로 테스트
      const birthDate = new Date('1990-05-15');
      const expectedAge = new Date().getFullYear() - 1990;

      const result = service['calculateAge'](birthDate);

      expect(result).toBe(expectedAge);
    });
  });
});
```

### 2.2 Frontend 단위 테스트 (React)

**컴포넌트 테스트 예시**

```typescript
// PatientCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientCard } from './PatientCard';

describe('PatientCard', () => {
  const mockPatient = {
    id: 'uuid-1234',
    patientNumber: 'P2025001234',
    name: '홍길동',
    age: 34,
    gender: 'M',
    roomNumber: '301-A',
    status: 'stable' as const,
  };

  it('환자 정보를 표시해야 한다', () => {
    render(<PatientCard patient={mockPatient} />);

    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('P2025001234')).toBeInTheDocument();
    expect(screen.getByText('34세')).toBeInTheDocument();
    expect(screen.getByText('301-A')).toBeInTheDocument();
  });

  it('클릭 시 onSelect 콜백을 호출해야 한다', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(<PatientCard patient={mockPatient} onSelect={onSelect} />);

    await user.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith(mockPatient);
  });

  it('상태에 따라 올바른 색상 뱃지를 표시해야 한다', () => {
    const { rerender } = render(<PatientCard patient={mockPatient} />);

    expect(screen.getByTestId('status-badge')).toHaveClass('bg-green-500');

    rerender(
      <PatientCard patient={{ ...mockPatient, status: 'critical' }} />
    );

    expect(screen.getByTestId('status-badge')).toHaveClass('bg-red-500');
  });
});
```

**커스텀 훅 테스트**

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

  it('환자 데이터를 성공적으로 가져와야 한다', async () => {
    const mockPatient = { id: 'uuid-1234', name: '홍길동' };
    (patientApi.getById as jest.Mock).mockResolvedValue(mockPatient);

    const { result } = renderHook(() => usePatient('uuid-1234'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPatient);
  });

  it('에러 발생 시 에러 상태를 반환해야 한다', async () => {
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

## 3. 통합 테스트 (Integration Tests)

### 3.1 API 통합 테스트

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

    // 테스트 사용자 로그인
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'testuser', password: 'testpass' });

    accessToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.patient.deleteMany({
      where: { patientNumber: { startsWith: 'TEST' } },
    });
    await app.close();
  });

  describe('POST /patients', () => {
    it('새 환자를 생성해야 한다', async () => {
      const createDto = {
        patientNumber: 'TEST001234',
        name: '테스트환자',
        birthDate: '1990-01-15',
        gender: 'M',
      };

      const response = await request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('테스트환자');
      expect(response.body.data.id).toBeDefined();
    });

    it('유효하지 않은 데이터는 400 에러를 반환해야 한다', async () => {
      const invalidDto = {
        patientNumber: 'INVALID', // 잘못된 형식
        name: '', // 빈 문자열
        birthDate: 'not-a-date', // 잘못된 날짜
      };

      const response = await request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BAD_REQUEST');
    });

    it('인증 없이 요청하면 401 에러를 반환해야 한다', async () => {
      await request(app.getHttpServer())
        .post('/patients')
        .send({ patientNumber: 'TEST002345', name: '테스트' })
        .expect(401);
    });
  });

  describe('GET /patients/:id', () => {
    let createdPatientId: string;

    beforeAll(async () => {
      // 테스트용 환자 생성
      const patient = await prisma.patient.create({
        data: {
          patientNumber: 'TEST999999',
          name: '조회테스트',
          birthDate: new Date('1985-06-20'),
          gender: 'F',
        },
      });
      createdPatientId = patient.id;
    });

    it('환자 상세 정보를 조회해야 한다', async () => {
      const response = await request(app.getHttpServer())
        .get(`/patients/${createdPatientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.name).toBe('조회테스트');
      expect(response.body.data.patientNumber).toBe('TEST999999');
    });

    it('존재하지 않는 환자는 404 에러를 반환해야 한다', async () => {
      await request(app.getHttpServer())
        .get('/patients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
```

### 3.2 데이터베이스 통합 테스트

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
      // 테스트 데이터 생성
      await prisma.patient.createMany({
        data: [
          {
            patientNumber: 'REPO_TEST_001',
            name: '김환자',
            birthDate: new Date('1990-01-01'),
            gender: 'M',
          },
          {
            patientNumber: 'REPO_TEST_002',
            name: '이환자',
            birthDate: new Date('1985-06-15'),
            gender: 'F',
          },
          {
            patientNumber: 'REPO_TEST_003',
            name: '박환자',
            birthDate: new Date('1970-12-25'),
            gender: 'M',
          },
        ],
      });
    });

    it('페이지네이션이 적용된 목록을 반환해야 한다', async () => {
      const [patients, total] = await repository.findAndCount({
        where: { patientNumber: { startsWith: 'REPO_TEST' } },
        skip: 0,
        take: 2,
      });

      expect(patients).toHaveLength(2);
      expect(total).toBe(3);
    });

    it('검색 필터가 적용되어야 한다', async () => {
      const [patients, total] = await repository.findAndCount({
        where: {
          patientNumber: { startsWith: 'REPO_TEST' },
          name: { contains: '김' },
        },
      });

      expect(total).toBe(1);
      expect(patients[0].name).toBe('김환자');
    });
  });
});
```

---

## 4. E2E 테스트 (End-to-End)

### 4.1 Playwright 설정

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

### 4.2 E2E 테스트 시나리오

```typescript
// e2e/patient-admission.spec.ts
import { test, expect } from '@playwright/test';

test.describe('환자 입원 프로세스', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'clerk001');
    await page.fill('[data-testid="password"]', 'testpass123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('새 환자 등록부터 입원까지 전체 프로세스', async ({ page }) => {
    // 1. 환자 등록 페이지로 이동
    await page.click('[data-testid="nav-patients"]');
    await page.click('[data-testid="add-patient-button"]');

    // 2. 환자 정보 입력
    await page.fill('[data-testid="patient-number"]', 'P2025999999');
    await page.fill('[data-testid="patient-name"]', 'E2E테스트환자');
    await page.fill('[data-testid="birth-date"]', '1990-05-15');
    await page.selectOption('[data-testid="gender"]', 'M');
    await page.fill('[data-testid="phone"]', '010-1234-5678');

    // 3. 저장
    await page.click('[data-testid="save-patient-button"]');
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();

    // 4. 입원 등록
    await page.click('[data-testid="admit-patient-button"]');

    // 5. 병실 선택
    await page.click('[data-testid="room-301"]');
    await page.click('[data-testid="bed-A"]');

    // 6. 입원 정보 입력
    await page.fill('[data-testid="diagnosis"]', 'E2E 테스트 진단');
    await page.selectOption('[data-testid="admission-type"]', 'SCHEDULED');
    await page.selectOption('[data-testid="attending-doctor"]', 'doctor001');

    // 7. 입원 확정
    await page.click('[data-testid="confirm-admission-button"]');

    // 8. 결과 확인
    await expect(page.locator('[data-testid="admission-success-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="admission-number"]')).toHaveText(/A\d{10}/);

    // 9. 병실 현황에서 확인
    await page.click('[data-testid="nav-rooms"]');
    await expect(page.locator('[data-testid="room-301-bed-A"]')).toHaveClass(/occupied/);
  });

  test('바이탈 입력 및 조회', async ({ page }) => {
    // 환자 상세 페이지로 이동
    await page.goto('/patients/test-patient-id');

    // 바이탈 탭 클릭
    await page.click('[data-testid="tab-vitals"]');

    // 새 바이탈 입력
    await page.click('[data-testid="add-vital-button"]');

    await page.fill('[data-testid="temperature"]', '36.5');
    await page.fill('[data-testid="systolic-bp"]', '120');
    await page.fill('[data-testid="diastolic-bp"]', '80');
    await page.fill('[data-testid="pulse-rate"]', '72');
    await page.fill('[data-testid="respiratory-rate"]', '18');
    await page.fill('[data-testid="oxygen-saturation"]', '98');

    await page.click('[data-testid="save-vital-button"]');

    // 저장 확인
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();

    // 목록에서 확인
    await expect(page.locator('[data-testid="vital-list"]')).toContainText('36.5');
    await expect(page.locator('[data-testid="vital-list"]')).toContainText('120/80');
  });
});

test.describe('모바일 라운딩', () => {
  test.use({ ...devices['iPad Pro'] });

  test('태블릿에서 라운딩 기록', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'doctor001');
    await page.fill('[data-testid="password"]', 'testpass123');
    await page.click('[data-testid="login-button"]');

    // 라운딩 시작
    await page.click('[data-testid="start-round-button"]');

    // 첫 번째 환자
    await page.click('[data-testid="patient-item-0"]');

    // 상태 선택
    await page.click('[data-testid="status-stable"]');

    // 관찰 소견 입력
    await page.fill('[data-testid="observation"]', '상태 양호, 특이사항 없음');

    // 저장 및 다음 환자
    await page.click('[data-testid="save-next-button"]');

    // 다음 환자 확인
    await expect(page.locator('[data-testid="current-patient"]')).not.toHaveText('첫번째환자');
  });
});
```

---

## 5. 테스트 데이터 관리

### 5.1 테스트 픽스처

```typescript
// test/fixtures/patient.fixture.ts
import { Patient } from '@prisma/client';

export const createPatientFixture = (
  overrides?: Partial<Patient>,
): Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> => ({
  patientNumber: `P${Date.now()}`,
  name: '테스트환자',
  birthDate: new Date('1990-01-15'),
  gender: 'M',
  bloodType: 'A+',
  phone: '010-1234-5678',
  emergencyContact: '보호자',
  emergencyPhone: '010-9876-5432',
  address: '서울시 강남구',
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
  diagnosis: '테스트 진단',
  status: 'ACTIVE',
  ...overrides,
});
```

### 5.2 테스트 데이터 시딩

```typescript
// test/setup/seed-test-data.ts
import { PrismaClient } from '@prisma/client';
import { createPatientFixture } from '../fixtures/patient.fixture';

export async function seedTestData(prisma: PrismaClient) {
  // 테스트 사용자
  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      employeeId: 'TEST001',
      username: 'testuser',
      passwordHash: await hashPassword('testpass'),
      name: '테스트사용자',
      department: '테스트부서',
      isActive: true,
    },
  });

  // 테스트 환자
  const patients = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.patient.create({
        data: createPatientFixture({
          patientNumber: `SEED${String(i).padStart(6, '0')}`,
          name: `시드환자${i + 1}`,
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

## 6. 테스트 커버리지

### 6.1 Jest 커버리지 설정

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

### 6.2 커버리지 리포트

```bash
# 커버리지 실행
pnpm test --coverage

# 결과 확인
open coverage/lcov-report/index.html
```

---

## 7. CI/CD 테스트 통합

### 7.1 GitHub Actions 테스트 워크플로우

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

## 8. 체크리스트

### 테스트 작성 체크리스트

- [ ] 새 기능에 대한 단위 테스트 작성
- [ ] 엣지 케이스 커버 (null, 빈 배열, 경계값)
- [ ] 에러 케이스 테스트
- [ ] API 엔드포인트 통합 테스트
- [ ] 주요 사용자 시나리오 E2E 테스트
- [ ] 커버리지 80% 이상 유지
- [ ] CI 파이프라인 통과
