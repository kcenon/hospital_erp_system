# 코딩 컨벤션 가이드

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 0.1.0.0 |
| 작성일 | 2025-12-29 |
| 상태 | 초안 |
| 관리자 | kcenon@naver.com |

---

## 1. 일반 원칙

### 1.1 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **명확성** | 코드는 자기 문서화되어야 함 |
| **일관성** | 프로젝트 전체에서 동일한 스타일 유지 |
| **단순성** | 불필요한 복잡성 제거 |
| **테스트 가능성** | 테스트하기 쉬운 구조로 작성 |

### 1.2 자동화 도구

```bash
# 린팅 (ESLint)
pnpm lint

# 포맷팅 (Prettier)
pnpm format

# 타입 체크
pnpm type-check
```

---

## 2. TypeScript 컨벤션

### 2.1 명명 규칙

```typescript
// ✅ 변수, 함수: camelCase
const patientName = 'Hong';
function getPatientById(id: string) {}

// ✅ 클래스, 인터페이스, 타입: PascalCase
class PatientService {}
interface Patient {}
type PatientStatus = 'admitted' | 'discharged';

// ✅ 상수: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = '/api/v1';

// ✅ 열거형: PascalCase (값도 PascalCase)
enum AdmissionType {
  Scheduled = 'SCHEDULED',
  Emergency = 'EMERGENCY',
  Transfer = 'TRANSFER',
}

// ✅ 파일명: kebab-case
// patient-service.ts, create-patient.dto.ts

// ✅ 컴포넌트 파일: PascalCase.tsx
// PatientCard.tsx, VitalSignsChart.tsx
```

### 2.2 타입 정의

```typescript
// ✅ interface: 객체 형태 정의 (확장 가능)
interface Patient {
  id: string;
  name: string;
  birthDate: Date;
  gender: 'M' | 'F';
}

// ✅ type: 유니온, 인터섹션, 유틸리티 타입
type PatientStatus = 'admitted' | 'discharged' | 'transferred';
type PatientWithRoom = Patient & { room: Room };
type PartialPatient = Partial<Patient>;

// ✅ 제네릭: 의미 있는 이름 사용
interface ApiResponse<TData> {
  success: boolean;
  data: TData;
  error?: string;
}

// ❌ 단일 문자 제네릭 (복잡한 경우)
interface Response<T, E> {}  // T, E가 무엇인지 불명확

// ✅ 명시적인 제네릭
interface Response<TData, TError = Error> {}
```

### 2.3 함수 작성

```typescript
// ✅ 화살표 함수 (간단한 경우)
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// ✅ function 선언 (호이스팅 필요 시, 복잡한 함수)
function calculateAge(birthDate: Date): number {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  return age;
}

// ✅ 매개변수 객체 패턴 (3개 이상)
interface CreatePatientParams {
  name: string;
  birthDate: Date;
  gender: 'M' | 'F';
  phone?: string;
}

function createPatient(params: CreatePatientParams): Patient {
  const { name, birthDate, gender, phone } = params;
  // ...
}

// ❌ 매개변수 나열 (많은 경우)
function createPatient(
  name: string,
  birthDate: Date,
  gender: string,
  phone: string,
  address: string,
  emergencyContact: string
) {}
```

### 2.4 타입 가드 및 Assertion

```typescript
// ✅ 타입 가드 함수
function isPatient(value: unknown): value is Patient {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

// ✅ 사용
if (isPatient(data)) {
  console.log(data.name); // 타입 추론됨
}

// ✅ as const 활용
const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

type Status = typeof STATUS[keyof typeof STATUS];

// ❌ 남용하면 안 되는 패턴
const data = response as Patient; // 런타임 오류 가능
```

### 2.5 Null 처리

```typescript
// ✅ 옵셔널 체이닝
const roomNumber = admission?.room?.number;

// ✅ Nullish 병합
const displayName = patient.nickname ?? patient.name;

// ✅ 명시적 null 체크
function getPatientName(patient: Patient | null): string {
  if (!patient) {
    return 'Unknown';
  }
  return patient.name;
}

// ❌ Non-null assertion 남용
const name = patient!.name; // 런타임 오류 위험
```

---

## 3. React/Next.js 컨벤션

### 3.1 컴포넌트 구조

```typescript
// ✅ 함수 컴포넌트 + TypeScript
interface PatientCardProps {
  patient: Patient;
  onSelect?: (patient: Patient) => void;
  className?: string;
}

export function PatientCard({
  patient,
  onSelect,
  className,
}: PatientCardProps) {
  // 1. hooks
  const [isExpanded, setIsExpanded] = useState(false);
  const { data, isLoading } = usePatientDetails(patient.id);

  // 2. derived state / memos
  const age = useMemo(() => calculateAge(patient.birthDate), [patient.birthDate]);

  // 3. handlers
  const handleClick = useCallback(() => {
    onSelect?.(patient);
  }, [onSelect, patient]);

  // 4. effects
  useEffect(() => {
    // side effects
  }, []);

  // 5. early returns
  if (isLoading) {
    return <PatientCardSkeleton />;
  }

  // 6. render
  return (
    <div className={cn('patient-card', className)} onClick={handleClick}>
      <h3>{patient.name}</h3>
      <span>{age}세</span>
    </div>
  );
}
```

### 3.2 파일 구조

```
src/
├── components/
│   ├── ui/                    # 기본 UI 컴포넌트
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── patient/               # 도메인 컴포넌트
│   │   ├── PatientCard.tsx
│   │   ├── PatientList.tsx
│   │   └── index.ts
│   │
│   └── layout/                # 레이아웃 컴포넌트
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── index.ts
│
├── hooks/                     # 커스텀 훅
│   ├── usePatient.ts
│   ├── useAuth.ts
│   └── index.ts
│
├── lib/                       # 유틸리티
│   ├── api.ts
│   ├── utils.ts
│   └── constants.ts
│
├── types/                     # 타입 정의
│   ├── patient.ts
│   ├── room.ts
│   └── index.ts
│
└── app/                       # Next.js App Router
    ├── (auth)/
    │   ├── login/
    │   └── layout.tsx
    ├── (dashboard)/
    │   ├── patients/
    │   ├── rooms/
    │   └── layout.tsx
    ├── layout.tsx
    └── page.tsx
```

### 3.3 Hooks 규칙

```typescript
// ✅ 커스텀 훅: use 접두사
function usePatient(patientId: string) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchPatient(patientId)
      .then(setPatient)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [patientId]);

  return { patient, isLoading, error };
}

// ✅ TanStack Query 사용 (권장)
function usePatient(patientId: string) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientApi.getById(patientId),
    staleTime: 5 * 60 * 1000, // 5분
  });
}

// ✅ 훅 조합
function usePatientWithRoom(patientId: string) {
  const patientQuery = usePatient(patientId);
  const roomQuery = useRoom(patientQuery.data?.roomId, {
    enabled: !!patientQuery.data?.roomId,
  });

  return {
    patient: patientQuery.data,
    room: roomQuery.data,
    isLoading: patientQuery.isLoading || roomQuery.isLoading,
  };
}
```

### 3.4 이벤트 핸들러

```typescript
// ✅ handle 접두사 + 이벤트/동작명
const handleSubmit = (e: FormEvent) => {};
const handlePatientSelect = (patient: Patient) => {};
const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {};

// ✅ Props로 전달 시: on 접두사
interface Props {
  onSubmit: (data: FormData) => void;
  onPatientSelect: (patient: Patient) => void;
  onChange: (value: string) => void;
}
```

### 3.5 조건부 렌더링

```typescript
// ✅ 간단한 조건: && 연산자
{isLoading && <Spinner />}
{error && <ErrorMessage message={error.message} />}

// ✅ 삼항 연산자 (두 가지 경우)
{isLoggedIn ? <Dashboard /> : <LoginPrompt />}

// ✅ 복잡한 조건: 얼리 리턴
function PatientDetails({ patientId }: Props) {
  const { data, isLoading, error } = usePatient(patientId);

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <NotFound />;

  return <PatientInfo patient={data} />;
}

// ❌ 중첩된 삼항 연산자
{isLoading ? <Spinner /> : error ? <Error /> : <Content />}
```

---

## 4. NestJS 컨벤션

### 4.1 모듈 구조

```
src/
├── modules/
│   ├── patient/
│   │   ├── patient.module.ts
│   │   ├── patient.controller.ts
│   │   ├── patient.service.ts
│   │   ├── patient.repository.ts
│   │   ├── dto/
│   │   │   ├── create-patient.dto.ts
│   │   │   ├── update-patient.dto.ts
│   │   │   └── patient-response.dto.ts
│   │   ├── entities/
│   │   │   └── patient.entity.ts
│   │   └── __tests__/
│   │       ├── patient.controller.spec.ts
│   │       └── patient.service.spec.ts
│   │
│   ├── auth/
│   ├── room/
│   └── report/
│
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
│
├── config/
│   ├── database.config.ts
│   └── jwt.config.ts
│
└── main.ts
```

### 4.2 컨트롤러

```typescript
// patient.controller.ts
@Controller('patients')
@ApiTags('환자 관리')
@UseGuards(JwtAuthGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  @ApiOperation({ summary: '환자 목록 조회' })
  @ApiResponse({ status: 200, type: PatientListResponseDto })
  async findAll(
    @Query() query: FindPatientsQueryDto,
  ): Promise<PatientListResponseDto> {
    return this.patientService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '환자 상세 조회' })
  @ApiParam({ name: 'id', description: '환자 ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PatientResponseDto> {
    return this.patientService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '환자 등록' })
  @RequirePermissions('patient:create')
  async create(@Body() dto: CreatePatientDto): Promise<PatientResponseDto> {
    return this.patientService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '환자 정보 수정' })
  @RequirePermissions('patient:update')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '환자 삭제 (비활성화)' })
  @RequirePermissions('patient:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.patientService.remove(id);
  }
}
```

### 4.3 서비스

```typescript
// patient.service.ts
@Injectable()
export class PatientService {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: FindPatientsQueryDto): Promise<PatientListResponseDto> {
    const { page = 1, limit = 20, search, status, floorId } = query;

    const [patients, total] = await this.patientRepository.findAndCount({
      where: this.buildWhereClause({ search, status, floorId }),
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: patients.map(this.toResponseDto),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<PatientResponseDto> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: ['currentAdmission', 'currentAdmission.room'],
    });

    if (!patient) {
      throw new NotFoundException(`환자를 찾을 수 없습니다: ${id}`);
    }

    return this.toResponseDto(patient);
  }

  async create(dto: CreatePatientDto): Promise<PatientResponseDto> {
    // 중복 체크
    const existing = await this.patientRepository.findByPatientNumber(dto.patientNumber);
    if (existing) {
      throw new ConflictException('이미 등록된 환자번호입니다.');
    }

    const patient = this.patientRepository.create(dto);
    const saved = await this.patientRepository.save(patient);

    // 이벤트 발행
    this.eventEmitter.emit('patient.created', new PatientCreatedEvent(saved));

    return this.toResponseDto(saved);
  }

  private toResponseDto(patient: Patient): PatientResponseDto {
    return {
      id: patient.id,
      patientNumber: patient.patientNumber,
      name: patient.name,
      birthDate: patient.birthDate,
      gender: patient.gender,
      age: this.calculateAge(patient.birthDate),
      // ...
    };
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    return today.getFullYear() - birthDate.getFullYear();
  }
}
```

### 4.4 DTO

```typescript
// dto/create-patient.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsEnum, IsOptional, Matches, Length } from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({ description: '환자번호', example: 'P2025001234' })
  @IsString()
  @Matches(/^P\d{10}$/, { message: '환자번호 형식이 올바르지 않습니다.' })
  patientNumber: string;

  @ApiProperty({ description: '이름', example: '홍길동' })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({ description: '생년월일', example: '1990-05-15' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ description: '성별', enum: ['M', 'F'] })
  @IsEnum(['M', 'F'])
  gender: 'M' | 'F';

  @ApiPropertyOptional({ description: '연락처', example: '010-1234-5678' })
  @IsOptional()
  @IsString()
  @Matches(/^01[0-9]-\d{3,4}-\d{4}$/)
  phone?: string;

  @ApiPropertyOptional({ description: '혈액형', example: 'A+' })
  @IsOptional()
  @IsString()
  bloodType?: string;
}

// dto/update-patient.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';

export class UpdatePatientDto extends PartialType(
  OmitType(CreatePatientDto, ['patientNumber'] as const),
) {}
```

### 4.5 예외 처리

```typescript
// common/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      success: false,
      error: {
        code: this.getErrorCode(exception),
        message: this.getMessage(exceptionResponse),
        details: this.getDetails(exceptionResponse),
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId: request.headers['x-request-id'],
      },
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCode(exception: HttpException): string {
    if (exception instanceof NotFoundException) return 'NOT_FOUND';
    if (exception instanceof ConflictException) return 'CONFLICT';
    if (exception instanceof UnauthorizedException) return 'UNAUTHORIZED';
    if (exception instanceof ForbiddenException) return 'FORBIDDEN';
    return 'BAD_REQUEST';
  }
}
```

---

## 5. API 설계 규칙

### 5.1 URL 규칙

```typescript
// ✅ 복수형 명사 사용
GET    /patients           // 목록
GET    /patients/:id       // 상세
POST   /patients           // 생성
PATCH  /patients/:id       // 부분 수정
DELETE /patients/:id       // 삭제

// ✅ 중첩 리소스
GET    /patients/:id/admissions      // 환자의 입원 목록
POST   /patients/:id/admissions      // 환자 입원 등록
GET    /admissions/:id/vitals        // 입원의 바이탈 목록

// ✅ 액션 (비 CRUD)
POST   /admissions/:id/discharge     // 퇴원 처리
POST   /admissions/:id/transfer      // 전실 처리
POST   /rounds/:id/start             // 라운딩 시작
POST   /rounds/:id/complete          // 라운딩 완료

// ❌ 동사 사용
GET    /getPatients
POST   /createPatient
```

### 5.2 쿼리 파라미터

```typescript
// 페이지네이션
GET /patients?page=1&limit=20

// 필터링
GET /patients?status=admitted&floorId=xxx

// 정렬
GET /patients?sortBy=name&sortOrder=asc

// 검색
GET /patients?search=홍길동

// 복합
GET /patients?page=1&limit=20&status=admitted&search=홍
```

---

## 6. 주석 및 문서화

### 6.1 JSDoc

```typescript
/**
 * 환자 정보를 조회합니다.
 *
 * @param patientId - 환자 고유 ID
 * @returns 환자 정보 또는 null
 * @throws {NotFoundException} 환자를 찾을 수 없는 경우
 *
 * @example
 * ```typescript
 * const patient = await patientService.findOne('uuid-xxx');
 * console.log(patient.name);
 * ```
 */
async findOne(patientId: string): Promise<Patient | null> {
  // ...
}
```

### 6.2 TODO 주석

```typescript
// TODO: 캐시 로직 추가 필요
// FIXME: 동시성 문제 해결 필요
// HACK: 임시 해결책, 추후 리팩토링 필요
// NOTE: 이 로직은 레거시 시스템 호환을 위함
```

---

## 7. ESLint & Prettier 설정

### 7.1 ESLint 설정

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',

    // Import 순서
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],

    // 일반
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

### 7.2 Prettier 설정

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## 8. 체크리스트

### 코드 리뷰 체크리스트

- [ ] 명명 규칙 준수
- [ ] 타입 안전성 확보 (any 사용 최소화)
- [ ] 에러 처리 적절함
- [ ] 불필요한 주석 없음
- [ ] 중복 코드 없음
- [ ] 테스트 코드 포함
- [ ] 린트/포맷 통과
