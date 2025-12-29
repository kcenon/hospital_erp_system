# Coding Conventions Guide

## Document Information

| Item | Content |
|------|------|
| Document Version | 0.1.0.0 |
| Created Date | 2025-12-29 |
| Status | Draft |
| Manager | kcenon@naver.com |

---

## 1. General Principles

### 1.1 Core Principles

| Principle | Description |
|------|------|
| **Clarity** | Code should be self-documenting |
| **Consistency** | Maintain the same style throughout the project |
| **Simplicity** | Remove unnecessary complexity |
| **Testability** | Write code that is easy to test |

### 1.2 Automation Tools

```bash
# Linting (ESLint)
pnpm lint

# Formatting (Prettier)
pnpm format

# Type checking
pnpm type-check
```

---

## 2. TypeScript Conventions

### 2.1 Naming Rules

```typescript
// ✅ Variables, functions: camelCase
const patientName = 'Hong';
function getPatientById(id: string) {}

// ✅ Classes, interfaces, types: PascalCase
class PatientService {}
interface Patient {}
type PatientStatus = 'admitted' | 'discharged';

// ✅ Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = '/api/v1';

// ✅ Enums: PascalCase (values also PascalCase)
enum AdmissionType {
  Scheduled = 'SCHEDULED',
  Emergency = 'EMERGENCY',
  Transfer = 'TRANSFER',
}

// ✅ File names: kebab-case
// patient-service.ts, create-patient.dto.ts

// ✅ Component files: PascalCase.tsx
// PatientCard.tsx, VitalSignsChart.tsx
```

### 2.2 Type Definitions

```typescript
// ✅ interface: Object shape definition (extensible)
interface Patient {
  id: string;
  name: string;
  birthDate: Date;
  gender: 'M' | 'F';
}

// ✅ type: Unions, intersections, utility types
type PatientStatus = 'admitted' | 'discharged' | 'transferred';
type PatientWithRoom = Patient & { room: Room };
type PartialPatient = Partial<Patient>;

// ✅ Generics: Use meaningful names
interface ApiResponse<TData> {
  success: boolean;
  data: TData;
  error?: string;
}

// ❌ Single character generics (for complex cases)
interface Response<T, E> {}  // T, E are unclear

// ✅ Explicit generics
interface Response<TData, TError = Error> {}
```

### 2.3 Function Writing

```typescript
// ✅ Arrow functions (for simple cases)
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// ✅ Function declaration (when hoisting needed, complex functions)
function calculateAge(birthDate: Date): number {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  return age;
}

// ✅ Parameter object pattern (3+ parameters)
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

// ❌ Parameter listing (for many parameters)
function createPatient(
  name: string,
  birthDate: Date,
  gender: string,
  phone: string,
  address: string,
  emergencyContact: string
) {}
```

### 2.4 Type Guards and Assertions

```typescript
// ✅ Type guard functions
function isPatient(value: unknown): value is Patient {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

// ✅ Usage
if (isPatient(data)) {
  console.log(data.name); // Type inferred
}

// ✅ Using as const
const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

type Status = typeof STATUS[keyof typeof STATUS];

// ❌ Pattern to avoid overusing
const data = response as Patient; // Runtime error possible
```

### 2.5 Null Handling

```typescript
// ✅ Optional chaining
const roomNumber = admission?.room?.number;

// ✅ Nullish coalescing
const displayName = patient.nickname ?? patient.name;

// ✅ Explicit null check
function getPatientName(patient: Patient | null): string {
  if (!patient) {
    return 'Unknown';
  }
  return patient.name;
}

// ❌ Non-null assertion overuse
const name = patient!.name; // Runtime error risk
```

---

## 3. React/Next.js Conventions

### 3.1 Component Structure

```typescript
// ✅ Function component + TypeScript
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
      <span>{age} years old</span>
    </div>
  );
}
```

### 3.2 File Structure

```
src/
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── patient/               # Domain components
│   │   ├── PatientCard.tsx
│   │   ├── PatientList.tsx
│   │   └── index.ts
│   │
│   └── layout/                # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── index.ts
│
├── hooks/                     # Custom hooks
│   ├── usePatient.ts
│   ├── useAuth.ts
│   └── index.ts
│
├── lib/                       # Utilities
│   ├── api.ts
│   ├── utils.ts
│   └── constants.ts
│
├── types/                     # Type definitions
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

### 3.3 Hooks Rules

```typescript
// ✅ Custom hooks: use prefix
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

// ✅ Using TanStack Query (recommended)
function usePatient(patientId: string) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientApi.getById(patientId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ✅ Composing hooks
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

### 3.4 Event Handlers

```typescript
// ✅ handle prefix + event/action name
const handleSubmit = (e: FormEvent) => {};
const handlePatientSelect = (patient: Patient) => {};
const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {};

// ✅ Props: on prefix
interface Props {
  onSubmit: (data: FormData) => void;
  onPatientSelect: (patient: Patient) => void;
  onChange: (value: string) => void;
}
```

### 3.5 Conditional Rendering

```typescript
// ✅ Simple conditions: && operator
{isLoading && <Spinner />}
{error && <ErrorMessage message={error.message} />}

// ✅ Ternary operator (two cases)
{isLoggedIn ? <Dashboard /> : <LoginPrompt />}

// ✅ Complex conditions: early returns
function PatientDetails({ patientId }: Props) {
  const { data, isLoading, error } = usePatient(patientId);

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <NotFound />;

  return <PatientInfo patient={data} />;
}

// ❌ Nested ternary operators
{isLoading ? <Spinner /> : error ? <Error /> : <Content />}
```

---

## 4. NestJS Conventions

### 4.1 Module Structure

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

### 4.2 Controllers

```typescript
// patient.controller.ts
@Controller('patients')
@ApiTags('Patient Management')
@UseGuards(JwtAuthGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  @ApiOperation({ summary: 'Get patient list' })
  @ApiResponse({ status: 200, type: PatientListResponseDto })
  async findAll(
    @Query() query: FindPatientsQueryDto,
  ): Promise<PatientListResponseDto> {
    return this.patientService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient details' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PatientResponseDto> {
    return this.patientService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register patient' })
  @RequirePermissions('patient:create')
  async create(@Body() dto: CreatePatientDto): Promise<PatientResponseDto> {
    return this.patientService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient information' })
  @RequirePermissions('patient:update')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete patient (deactivate)' })
  @RequirePermissions('patient:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.patientService.remove(id);
  }
}
```

### 4.3 Services

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
      throw new NotFoundException(`Patient not found: ${id}`);
    }

    return this.toResponseDto(patient);
  }

  async create(dto: CreatePatientDto): Promise<PatientResponseDto> {
    // Duplicate check
    const existing = await this.patientRepository.findByPatientNumber(dto.patientNumber);
    if (existing) {
      throw new ConflictException('Patient number already registered.');
    }

    const patient = this.patientRepository.create(dto);
    const saved = await this.patientRepository.save(patient);

    // Emit event
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

### 4.4 DTOs

```typescript
// dto/create-patient.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsEnum, IsOptional, Matches, Length } from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({ description: 'Patient number', example: 'P2025001234' })
  @IsString()
  @Matches(/^P\d{10}$/, { message: 'Invalid patient number format.' })
  patientNumber: string;

  @ApiProperty({ description: 'Name', example: 'John Doe' })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({ description: 'Birth date', example: '1990-05-15' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ description: 'Gender', enum: ['M', 'F'] })
  @IsEnum(['M', 'F'])
  gender: 'M' | 'F';

  @ApiPropertyOptional({ description: 'Phone number', example: '010-1234-5678' })
  @IsOptional()
  @IsString()
  @Matches(/^01[0-9]-\d{3,4}-\d{4}$/)
  phone?: string;

  @ApiPropertyOptional({ description: 'Blood type', example: 'A+' })
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

### 4.5 Exception Handling

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

## 5. API Design Rules

### 5.1 URL Rules

```typescript
// ✅ Use plural nouns
GET    /patients           // List
GET    /patients/:id       // Detail
POST   /patients           // Create
PATCH  /patients/:id       // Partial update
DELETE /patients/:id       // Delete

// ✅ Nested resources
GET    /patients/:id/admissions      // Patient's admission list
POST   /patients/:id/admissions      // Register patient admission
GET    /admissions/:id/vitals        // Admission's vital list

// ✅ Actions (non-CRUD)
POST   /admissions/:id/discharge     // Discharge processing
POST   /admissions/:id/transfer      // Transfer processing
POST   /rounds/:id/start             // Start rounding
POST   /rounds/:id/complete          // Complete rounding

// ❌ Using verbs
GET    /getPatients
POST   /createPatient
```

### 5.2 Query Parameters

```typescript
// Pagination
GET /patients?page=1&limit=20

// Filtering
GET /patients?status=admitted&floorId=xxx

// Sorting
GET /patients?sortBy=name&sortOrder=asc

// Search
GET /patients?search=John

// Combined
GET /patients?page=1&limit=20&status=admitted&search=John
```

---

## 6. Comments and Documentation

### 6.1 JSDoc

```typescript
/**
 * Retrieves patient information.
 *
 * @param patientId - Patient unique ID
 * @returns Patient information or null
 * @throws {NotFoundException} When patient is not found
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

### 6.2 TODO Comments

```typescript
// TODO: Add caching logic
// FIXME: Resolve concurrency issue
// HACK: Temporary workaround, refactor later
// NOTE: This logic is for legacy system compatibility
```

---

## 7. ESLint & Prettier Configuration

### 7.1 ESLint Configuration

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

    // Import order
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

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

### 7.2 Prettier Configuration

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

## 8. Checklist

### Code Review Checklist

- [ ] Naming conventions followed
- [ ] Type safety ensured (minimize `any` usage)
- [ ] Proper error handling
- [ ] No unnecessary comments
- [ ] No duplicate code
- [ ] Test code included
- [ ] Lint/format passed
