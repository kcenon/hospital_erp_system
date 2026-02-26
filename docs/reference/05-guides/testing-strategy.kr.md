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
                ╱        ╲        - Cypress
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

| 도구                            | 용도             | 레이어          |
| ------------------------------- | ---------------- | --------------- |
| **Jest**                        | 단위/통합 테스트 | Backend, Shared |
| **Cypress**                     | E2E 테스트       | Frontend        |
| **Supertest**                   | API 테스트       | Backend         |
| ~~React Testing Library~~ (TBD) | 컴포넌트 테스트  | Frontend        |
| ~~MSW~~ (TBD)                   | API 모킹         | Frontend        |

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

### 4.1 Cypress 설정

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

### 4.2 E2E 테스트 시나리오

```typescript
// cypress/e2e/patient-admission.cy.ts
describe('환자 입원 프로세스', () => {
  beforeEach(() => {
    // 로그인
    cy.visit('/login');
    cy.get('[data-testid="username"]').type('clerk001');
    cy.get('[data-testid="password"]').type('testpass123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('새 환자 등록부터 입원까지 전체 프로세스', () => {
    // 1. 환자 등록 페이지로 이동
    cy.get('[data-testid="nav-patients"]').click();
    cy.get('[data-testid="add-patient-button"]').click();

    // 2. 환자 정보 입력
    cy.get('[data-testid="patient-number"]').type('P2025999999');
    cy.get('[data-testid="patient-name"]').type('E2E테스트환자');
    cy.get('[data-testid="birth-date"]').type('1990-05-15');
    cy.get('[data-testid="gender"]').select('M');
    cy.get('[data-testid="phone"]').type('010-1234-5678');

    // 3. 저장
    cy.get('[data-testid="save-patient-button"]').click();
    cy.get('[data-testid="toast-success"]').should('be.visible');

    // 4. 입원 등록
    cy.get('[data-testid="admit-patient-button"]').click();

    // 5. 병실 선택
    cy.get('[data-testid="room-301"]').click();
    cy.get('[data-testid="bed-A"]').click();

    // 6. 입원 정보 입력
    cy.get('[data-testid="diagnosis"]').type('E2E 테스트 진단');
    cy.get('[data-testid="admission-type"]').select('SCHEDULED');
    cy.get('[data-testid="attending-doctor"]').select('doctor001');

    // 7. 입원 확정
    cy.get('[data-testid="confirm-admission-button"]').click();

    // 8. 결과 확인
    cy.get('[data-testid="admission-success-modal"]').should('be.visible');
    cy.get('[data-testid="admission-number"]')
      .invoke('text')
      .should('match', /A\d{10}/);

    // 9. 병실 현황에서 확인
    cy.get('[data-testid="nav-rooms"]').click();
    cy.get('[data-testid="room-301-bed-A"]').should('have.class', 'occupied');
  });

  it('바이탈 입력 및 조회', () => {
    // 환자 상세 페이지로 이동
    cy.visit('/patients/test-patient-id');

    // 바이탈 탭 클릭
    cy.get('[data-testid="tab-vitals"]').click();

    // 새 바이탈 입력
    cy.get('[data-testid="add-vital-button"]').click();

    cy.get('[data-testid="temperature"]').type('36.5');
    cy.get('[data-testid="systolic-bp"]').type('120');
    cy.get('[data-testid="diastolic-bp"]').type('80');
    cy.get('[data-testid="pulse-rate"]').type('72');
    cy.get('[data-testid="respiratory-rate"]').type('18');
    cy.get('[data-testid="oxygen-saturation"]').type('98');

    cy.get('[data-testid="save-vital-button"]').click();

    // 저장 확인
    cy.get('[data-testid="toast-success"]').should('be.visible');

    // 목록에서 확인
    cy.get('[data-testid="vital-list"]').should('contain', '36.5');
    cy.get('[data-testid="vital-list"]').should('contain', '120/80');
  });
});

describe('모바일 라운딩', () => {
  beforeEach(() => {
    cy.viewport('ipad-2');
  });

  it('태블릿에서 라운딩 기록', () => {
    cy.visit('/login');
    cy.get('[data-testid="username"]').type('doctor001');
    cy.get('[data-testid="password"]').type('testpass123');
    cy.get('[data-testid="login-button"]').click();

    // 라운딩 시작
    cy.get('[data-testid="start-round-button"]').click();

    // 첫 번째 환자
    cy.get('[data-testid="patient-item-0"]').click();

    // 상태 선택
    cy.get('[data-testid="status-stable"]').click();

    // 관찰 소견 입력
    cy.get('[data-testid="observation"]').type('상태 양호, 특이사항 없음');

    // 저장 및 다음 환자
    cy.get('[data-testid="save-next-button"]').click();

    // 다음 환자 확인
    cy.get('[data-testid="current-patient"]').should('not.contain', '첫번째환자');
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

## 8. 체크리스트

### 테스트 작성 체크리스트

- [ ] 새 기능에 대한 단위 테스트 작성
- [ ] 엣지 케이스 커버 (null, 빈 배열, 경계값)
- [ ] 에러 케이스 테스트
- [ ] API 엔드포인트 통합 테스트
- [ ] 주요 사용자 시나리오 E2E 테스트
- [ ] 커버리지 80% 이상 유지
- [ ] CI 파이프라인 통과
