# 보안 요구사항 명세서

## 문서 정보

| 항목      | 내용             |
| --------- | ---------------- |
| 문서 버전 | 0.1.0.0          |
| 작성일    | 2025-12-29       |
| 상태      | 초안             |
| 관리자    | kcenon@naver.com |
| 보안 등급 | 내부용           |

---

## 1. 보안 개요

### 1.1 보안 목표

```
┌─────────────────────────────────────────────────────────────────┐
│                       보안 3대 원칙 (CIA)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────┐                                          │
│   │  Confidentiality │  기밀성: 인가된 사용자만 정보 접근          │
│   └──────────────────┘                                          │
│                                                                  │
│   ┌──────────────────┐                                          │
│   │    Integrity     │  무결성: 정보의 정확성과 완전성 보장         │
│   └──────────────────┘                                          │
│                                                                  │
│   ┌──────────────────┐                                          │
│   │   Availability   │  가용성: 필요시 정보 접근 가능 보장          │
│   └──────────────────┘                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 관련 법규 및 규정

| 법규/규정          | 적용 범위          | 주요 요구사항                |
| ------------------ | ------------------ | ---------------------------- |
| **개인정보보호법** | 환자 개인정보 전체 | 암호화, 접근 통제, 동의 관리 |
| **의료법**         | 의무기록           | 5년 보관, 열람 통제          |
| **전자문서법**     | 전자 기록          | 무결성, 진본성               |
| **정보통신망법**   | 시스템 전체        | 보안 조치, 침해 대응         |

### 1.3 보안 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Security Architecture                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────── Perimeter Security ────────────────────────┐ │
│  │  WAF │ DDoS Protection │ SSL/TLS Termination │ Rate Limiting          │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│  ┌───────────────────────────────────┼───────────────────────────────────┐ │
│  │                           Application Security                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │ │
│  │  │Authentication│  │Authorization │  │ Input Valid. │                │ │
│  │  │   (JWT/MFA)  │  │   (RBAC)     │  │  (Sanitize)  │                │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│  ┌───────────────────────────────────┼───────────────────────────────────┐ │
│  │                             Data Security                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │ │
│  │  │  Encryption  │  │    Masking   │  │  Audit Log   │                │ │
│  │  │ (AES-256/TLS)│  │(SSN, Medical)│  │ (All Access) │                │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 인증 보안

### 2.1 인증 요구사항

| 요구사항             | 상세                                  | 우선순위 |
| -------------------- | ------------------------------------- | -------- |
| **강력한 비밀번호**  | 8자 이상, 대소문자/숫자/특수문자 조합 | 필수     |
| **비밀번호 해싱**    | bcrypt (cost factor 12 이상)          | 필수     |
| **MFA 지원**         | TOTP (Google Authenticator 등)        | 권장     |
| **세션 관리**        | 30분 유휴 타임아웃                    | 필수     |
| **동시 세션 제한**   | 사용자당 최대 3개 세션                | 필수     |
| **로그인 시도 제한** | 5회 실패 시 15분 잠금                 | 필수     |

### 2.2 비밀번호 정책

```typescript
// 비밀번호 정책 구현 예시
const passwordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  preventCommon: true, // 흔한 비밀번호 차단
  preventUserInfo: true, // 사용자 정보 포함 차단
  historyCount: 5, // 최근 5개 비밀번호 재사용 금지
  maxAge: 90, // 90일마다 변경 필요 (일)
  warnBefore: 14, // 만료 14일 전 경고
};

// 비밀번호 강도 검증
function validatePassword(password: string, user: User): ValidationResult {
  const errors: string[] = [];

  if (password.length < passwordPolicy.minLength) {
    errors.push('비밀번호는 8자 이상이어야 합니다.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다.');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다.');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다.');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('특수문자를 포함해야 합니다.');
  }

  // 사용자 정보 포함 여부 검사
  if (password.toLowerCase().includes(user.username.toLowerCase())) {
    errors.push('사용자 ID를 포함할 수 없습니다.');
  }

  return { isValid: errors.length === 0, errors };
}
```

### 2.3 JWT 토큰 관리

```typescript
// JWT 설정
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '1h', // 1시간
    algorithm: 'HS256',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d', // 7일
    algorithm: 'HS256',
  },
};

// 토큰 페이로드
interface TokenPayload {
  sub: string; // 사용자 ID
  username: string;
  roles: string[];
  permissions: string[];
  iat: number; // 발급 시간
  exp: number; // 만료 시간
  jti: string; // 토큰 고유 ID (revocation용)
}
```

### 2.4 세션 관리

```typescript
// Redis 세션 저장
interface SessionData {
  userId: string;
  tokenJti: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

// 세션 정책
const sessionPolicy = {
  maxConcurrentSessions: 3, // 최대 동시 세션
  idleTimeout: 30 * 60, // 30분 (초)
  absoluteTimeout: 8 * 60 * 60, // 8시간 (초)
  renewThreshold: 5 * 60, // 5분 남으면 갱신
};
```

---

## 3. 인가 보안

### 3.1 역할 기반 접근 제어 (RBAC)

```
┌─────────────────────────────────────────────────────────────────┐
│                        RBAC 구조                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Users                                 │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │  │
│  │  │ 홍길동  │  │ 김의사  │  │ 박간호  │  │ 이원무  │          │  │
│  │  └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘          │  │
│  └───────┼───────────┼───────────┼───────────┼───────────────┘  │
│          │           │           │           │                   │
│  ┌───────┼───────────┼───────────┼───────────┼───────────────┐  │
│  │       ▼           ▼           ▼           ▼               │  │
│  │                      Roles                                 │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │  │
│  │  │ ADMIN  │  │ DOCTOR │  │ NURSE  │  │ CLERK  │          │  │
│  │  └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘          │  │
│  └───────┼───────────┼───────────┼───────────┼───────────────┘  │
│          │           │           │           │                   │
│  ┌───────┼───────────┼───────────┼───────────┼───────────────┐  │
│  │       ▼           ▼           ▼           ▼               │  │
│  │                   Permissions                              │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │ patient:read  patient:write  room:read  room:write │    │  │
│  │  │ report:read   report:write   admin:*    audit:read │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 권한 매트릭스

| 리소스          | ADMIN | DOCTOR         | HEAD_NURSE | NURSE     | CLERK |
| --------------- | ----- | -------------- | ---------- | --------- | ----- |
| **환자 정보**   |
| - 조회          | ✅    | ✅             | ✅         | ✅ (담당) | ✅    |
| - 등록          | ✅    | ❌             | ❌         | ❌        | ✅    |
| - 수정          | ✅    | ✅ (본인 환자) | ✅         | ❌        | ✅    |
| - 삭제          | ✅    | ❌             | ❌         | ❌        | ❌    |
| **병실 관리**   |
| - 조회          | ✅    | ✅             | ✅         | ✅        | ✅    |
| - 배정          | ✅    | ❌             | ✅         | ❌        | ✅    |
| - 설정          | ✅    | ❌             | ❌         | ❌        | ❌    |
| **보고서**      |
| - 조회          | ✅    | ✅             | ✅         | ✅ (담당) | ❌    |
| - 작성          | ✅    | ✅             | ✅         | ✅        | ❌    |
| - 수정          | ✅    | ✅ (본인)      | ✅         | ✅ (본인) | ❌    |
| **감사 로그**   |
| - 조회          | ✅    | ❌             | ❌         | ❌        | ❌    |
| **사용자 관리** |
| - 전체          | ✅    | ❌             | ❌         | ❌        | ❌    |

### 3.3 권한 검증 구현

```typescript
// 권한 가드 (NestJS)
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredPermissions.every((permission) => user.permissions.includes(permission));
  }
}

// 사용 예시
@Controller('patients')
export class PatientController {
  @Get(':id')
  @RequirePermissions('patient:read')
  async getPatient(@Param('id') id: string) {
    // ...
  }

  @Post()
  @RequirePermissions('patient:create')
  async createPatient(@Body() dto: CreatePatientDto) {
    // ...
  }
}
```

---

## 4. 데이터 보안

### 4.1 암호화 요구사항

| 데이터 유형   | 저장 시 암호화 | 전송 시 암호화 | 방식            |
| ------------- | -------------- | -------------- | --------------- |
| 비밀번호      | ✅             | ✅             | bcrypt (단방향) |
| 주민등록번호  | ✅             | ✅             | AES-256-GCM     |
| 의료 기록     | ✅             | ✅             | AES-256-GCM     |
| 진단 정보     | ✅             | ✅             | AES-256-GCM     |
| 보험 정보     | ✅             | ✅             | AES-256-GCM     |
| 일반 개인정보 | ❌             | ✅             | TLS 1.3         |
| API 통신      | N/A            | ✅             | TLS 1.3         |

### 4.2 암호화 구현

```typescript
// 암호화 서비스
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly authTagLength = 16;

  constructor(@Inject('ENCRYPTION_KEY') private readonly key: Buffer) {}

  encrypt(plaintext: string): EncryptedData {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      data: encrypted,
      authTag: authTag.toString('base64'),
    };
  }

  decrypt(encrypted: EncryptedData): string {
    const iv = Buffer.from(encrypted.iv, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// 민감 정보 필드 데코레이터
function Encrypted() {
  return function (target: any, propertyKey: string) {
    // 자동 암호화/복호화 처리
  };
}

// 사용 예시
class PatientDetails {
  @Encrypted()
  ssn: string; // 주민등록번호

  @Encrypted()
  medicalHistory: string; // 병력
}
```

### 4.3 PostgreSQL 암호화

```sql
-- pgcrypto 확장 설치
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 암호화 함수
CREATE OR REPLACE FUNCTION encrypt_sensitive(data TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(
    data,
    current_setting('app.encryption_key'),
    'compress-algo=1, cipher-algo=aes256'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 복호화 함수
CREATE OR REPLACE FUNCTION decrypt_sensitive(data BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    data,
    current_setting('app.encryption_key')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용 예시
INSERT INTO patient_details (patient_id, ssn_encrypted)
VALUES (
  'patient-uuid',
  encrypt_sensitive('901234-1234567')
);

SELECT decrypt_sensitive(ssn_encrypted) AS ssn
FROM patient_details
WHERE patient_id = 'patient-uuid';
```

### 4.4 데이터 마스킹

```typescript
// 마스킹 유틸리티
const maskingRules = {
  ssn: (value: string) => {
    // 901234-1234567 -> 901234-1******
    return value.replace(/(\d{6})-(\d)(\d{6})/, '$1-$2******');
  },

  phone: (value: string) => {
    // 010-1234-5678 -> 010-****-5678
    return value.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3');
  },

  name: (value: string) => {
    // 홍길동 -> 홍*동
    if (value.length <= 2) return value[0] + '*';
    return value[0] + '*'.repeat(value.length - 2) + value.slice(-1);
  },

  email: (value: string) => {
    // test@example.com -> t***@example.com
    const [local, domain] = value.split('@');
    return local[0] + '***@' + domain;
  },
};

// 응답 필터링 (권한에 따른 마스킹)
function applyMasking(data: any, userPermissions: string[]): any {
  if (!userPermissions.includes('patient:read:sensitive')) {
    return {
      ...data,
      ssn: maskingRules.ssn(data.ssn),
      phone: maskingRules.phone(data.phone),
    };
  }
  return data;
}
```

---

## 5. 감사 및 로깅

### 5.1 감사 로그 요구사항

| 이벤트 유형          | 기록 항목                       | 보관 기간 |
| -------------------- | ------------------------------- | --------- |
| 로그인/로그아웃      | 사용자, 시간, IP, 결과          | 2년       |
| 환자 정보 조회       | 사용자, 시간, 환자ID, 조회 항목 | 2년       |
| 환자 정보 수정       | 사용자, 시간, 변경 전/후 값     | 영구      |
| 보고서 작성/수정     | 사용자, 시간, 문서ID, 내용      | 5년       |
| 권한 변경            | 관리자, 시간, 대상, 변경 내역   | 영구      |
| 데이터 출력/다운로드 | 사용자, 시간, 데이터 범위       | 2년       |

### 5.2 감사 로그 구조

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;

  // 주체 정보
  userId: string;
  username: string;
  userRole: string;
  ipAddress: string;
  userAgent: string;

  // 행위 정보
  action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'LOGIN' | 'LOGOUT';
  resourceType: string;
  resourceId: string;

  // 상세 정보
  requestPath: string;
  requestMethod: string;
  requestBody?: object; // 민감정보 제외

  // 결과
  success: boolean;
  errorCode?: string;
  errorMessage?: string;

  // 변경 이력 (UPDATE 시)
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
```

### 5.3 자동 감사 로깅

```typescript
// 감사 로그 인터셉터
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.auditService.log({
            userId: user?.id,
            username: user?.username,
            action: this.mapHttpMethodToAction(request.method),
            resourceType: this.extractResourceType(request.path),
            resourceId: request.params.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            requestPath: request.path,
            requestMethod: request.method,
            success: true,
            duration: Date.now() - startTime,
          });
        },
        error: (error) => {
          this.auditService.log({
            userId: user?.id,
            username: user?.username,
            action: this.mapHttpMethodToAction(request.method),
            resourceType: this.extractResourceType(request.path),
            resourceId: request.params.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            requestPath: request.path,
            requestMethod: request.method,
            success: false,
            errorCode: error.code,
            errorMessage: error.message,
            duration: Date.now() - startTime,
          });
        },
      }),
    );
  }
}
```

### 5.4 환자 정보 접근 로그 (특수)

```sql
-- 환자 정보 접근 전용 로그 테이블
CREATE TABLE audit.patient_access_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accessed_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 접근자 정보
    user_id         UUID NOT NULL,
    user_name       VARCHAR(100) NOT NULL,
    user_role       VARCHAR(50) NOT NULL,
    user_department VARCHAR(100),

    -- 환자 정보
    patient_id      UUID NOT NULL,
    patient_number  VARCHAR(20) NOT NULL,
    patient_name    VARCHAR(100) NOT NULL,

    -- 접근 상세
    access_type     VARCHAR(50) NOT NULL,  -- VIEW, UPDATE, EXPORT
    accessed_fields TEXT[],                 -- 접근한 필드 목록
    access_reason   TEXT,                   -- 접근 사유 (선택)

    -- 클라이언트 정보
    ip_address      INET,
    device_type     VARCHAR(50),

    -- 인덱스
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patient.patients(id)
);

-- 월별 파티셔닝
CREATE INDEX idx_patient_access_date ON audit.patient_access_logs(accessed_at);
CREATE INDEX idx_patient_access_user ON audit.patient_access_logs(user_id);
CREATE INDEX idx_patient_access_patient ON audit.patient_access_logs(patient_id);
```

---

## 6. 네트워크 보안

### 6.1 TLS 설정

```nginx
# nginx TLS 설정
server {
    listen 443 ssl http2;
    server_name api.hospital-erp.com;

    # TLS 버전 (1.2, 1.3만 허용)
    ssl_protocols TLSv1.2 TLSv1.3;

    # 강력한 암호화 스위트
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 인증서
    ssl_certificate /etc/ssl/certs/hospital-erp.crt;
    ssl_certificate_key /etc/ssl/private/hospital-erp.key;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 기타 보안 헤더
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'" always;
}
```

### 6.2 WAF 규칙

| 규칙           | 설명                 | 조치        |
| -------------- | -------------------- | ----------- |
| SQL Injection  | SQL 인젝션 패턴 탐지 | 차단        |
| XSS            | 스크립트 삽입 시도   | 차단        |
| Path Traversal | 경로 조작 시도       | 차단        |
| Rate Limit     | 분당 1000 요청 초과  | 임시 차단   |
| Bot Detection  | 알려진 악성 봇       | 차단        |
| GeoIP          | 허용 국가 외 접근    | 차단 (선택) |

### 6.3 Rate Limiting

```typescript
// Rate Limiting 설정
const rateLimitConfig = {
  // 일반 API
  default: {
    windowMs: 60 * 1000, // 1분
    max: 100, // 100 요청
  },

  // 로그인 API (브루트포스 방지)
  login: {
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 5회
  },

  // 민감 정보 API
  sensitive: {
    windowMs: 60 * 1000, // 1분
    max: 20, // 20 요청
  },

  // 데이터 내보내기
  export: {
    windowMs: 60 * 60 * 1000, // 1시간
    max: 10, // 10회
  },
};
```

---

## 7. 입력 유효성 검증

### 7.1 유효성 검증 규칙

```typescript
// 공통 유효성 검증 데코레이터
class CreatePatientDto {
  @IsString()
  @Length(2, 50)
  @Matches(/^[가-힣a-zA-Z\s]+$/, {
    message: '이름은 한글, 영문, 공백만 허용됩니다.',
  })
  name: string;

  @IsString()
  @Matches(/^P\d{10}$/, {
    message: '환자번호 형식이 올바르지 않습니다. (예: P2025001234)',
  })
  patientNumber: string;

  @IsDateString()
  @MaxDate(new Date())
  birthDate: string;

  @IsEnum(['M', 'F'])
  gender: string;

  @IsOptional()
  @IsString()
  @Matches(/^01[0-9]-\d{3,4}-\d{4}$/, {
    message: '전화번호 형식이 올바르지 않습니다.',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => sanitizeHtml(value)) // XSS 방지
  notes?: string;
}
```

### 7.2 SQL Injection 방지

```typescript
// Prisma ORM 사용 (파라미터 바인딩 자동)
const patient = await prisma.patient.findFirst({
  where: {
    patientNumber: userInput, // 자동으로 이스케이프됨
  },
});

// Raw 쿼리 시 파라미터 바인딩 필수
const results = await prisma.$queryRaw`
  SELECT * FROM patients
  WHERE name LIKE ${`%${searchTerm}%`}
`;

// ❌ 절대 금지: 문자열 결합
// const results = await prisma.$queryRawUnsafe(
//   `SELECT * FROM patients WHERE name LIKE '%${searchTerm}%'`
// );
```

### 7.3 XSS 방지

```typescript
import DOMPurify from 'isomorphic-dompurify';

// 입력 정화
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // 모든 태그 제거
    ALLOWED_ATTR: [], // 모든 속성 제거
  });
}

// HTML 허용 필드 (간호 일지 등)
function sanitizeRichText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}
```

---

## 8. 보안 모니터링

### 8.1 보안 이벤트 정의

| 이벤트                    | 심각도   | 알림              |
| ------------------------- | -------- | ----------------- |
| 다중 로그인 실패          | HIGH     | 즉시 (Slack, SMS) |
| 비정상 시간대 접근        | MEDIUM   | 15분 내           |
| 대량 데이터 조회          | HIGH     | 즉시              |
| 권한 상승 시도            | CRITICAL | 즉시 (전체 팀)    |
| 민감 정보 대량 접근       | CRITICAL | 즉시              |
| 새로운 IP에서 관리자 접근 | HIGH     | 즉시              |

### 8.2 이상 탐지 규칙

```typescript
// 이상 행위 탐지 규칙
const anomalyRules = {
  // 비정상 시간대 접근
  unusualHours: {
    condition: (event) => {
      const hour = event.timestamp.getHours();
      return hour < 6 || hour > 22; // 오전 6시 ~ 오후 10시 외
    },
    severity: 'MEDIUM',
  },

  // 대량 조회
  bulkAccess: {
    condition: (events) => {
      const recentEvents = events.filter(
        (e) =>
          e.action === 'VIEW' &&
          e.resourceType === 'patient' &&
          Date.now() - e.timestamp < 5 * 60 * 1000, // 5분
      );
      return recentEvents.length > 50; // 5분 내 50건 이상
    },
    severity: 'HIGH',
  },

  // 권한 없는 접근 시도
  unauthorizedAccess: {
    condition: (event) => {
      return event.success === false && event.errorCode === 'FORBIDDEN';
    },
    severity: 'HIGH',
  },
};
```

### 8.3 보안 대시보드 메트릭

| 메트릭              | 설명                     | 임계값           |
| ------------------- | ------------------------ | ---------------- |
| 로그인 실패율       | 전체 로그인 중 실패 비율 | > 10%            |
| 비정상 접근 시도    | 권한 없는 리소스 접근    | > 5건/시간       |
| 민감 정보 접근 빈도 | 주민번호 등 조회 횟수    | 기준치 대비 200% |
| 세션 하이재킹 의심  | IP/기기 급변 세션        | > 0              |
| API 오류율          | 4xx/5xx 응답 비율        | > 5%             |

---

## 9. 취약점 관리

### 9.1 정기 보안 점검

| 점검 유형             | 주기         | 담당      |
| --------------------- | ------------ | --------- |
| 의존성 취약점 스캔    | 매일 (CI/CD) | 자동화    |
| 정적 코드 분석 (SAST) | 매 PR        | 자동화    |
| 동적 분석 (DAST)      | 주간         | 보안팀    |
| 침투 테스트           | 분기         | 외부 업체 |
| 보안 코드 리뷰        | 매 릴리즈    | 개발팀    |

### 9.2 취약점 대응 SLA

| 심각도   | 대응 시간 | 해결 시간 |
| -------- | --------- | --------- |
| CRITICAL | 1시간     | 24시간    |
| HIGH     | 4시간     | 72시간    |
| MEDIUM   | 24시간    | 7일       |
| LOW      | 72시간    | 30일      |

### 9.3 의존성 보안

```yaml
# GitHub Actions - 의존성 스캔
name: Security Scan

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 9 * * *' # 매일 오전 9시

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk
        uses: snyk/actions/node@master
        with:
          args: --severity-threshold=high

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
```

---

## 10. 사고 대응 계획

### 10.1 보안 사고 분류

| 등급          | 정의                            | 예시              |
| ------------- | ------------------------------- | ----------------- |
| P1 (Critical) | 환자 데이터 유출, 시스템 장악   | 랜섬웨어, DB 유출 |
| P2 (High)     | 부분적 데이터 접근, 서비스 중단 | 계정 탈취, DDoS   |
| P3 (Medium)   | 제한적 영향, 즉각 대응 가능     | 취약점 발견       |
| P4 (Low)      | 경미한 영향                     | 정책 위반 시도    |

### 10.2 대응 절차

```
┌─────────────────────────────────────────────────────────────────┐
│                    보안 사고 대응 프로세스                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 탐지 (Detection)                                            │
│     └── 모니터링 시스템, 사용자 신고, 외부 제보                     │
│                    │                                             │
│                    ▼                                             │
│  2. 분류 (Triage)                                               │
│     └── 심각도 평가, 영향 범위 파악                                │
│                    │                                             │
│                    ▼                                             │
│  3. 봉쇄 (Containment)                                          │
│     └── 피해 확산 방지, 증거 보존                                  │
│                    │                                             │
│                    ▼                                             │
│  4. 제거 (Eradication)                                          │
│     └── 위협 요소 제거, 취약점 패치                                │
│                    │                                             │
│                    ▼                                             │
│  5. 복구 (Recovery)                                             │
│     └── 서비스 복원, 모니터링 강화                                 │
│                    │                                             │
│                    ▼                                             │
│  6. 교훈 (Lessons Learned)                                      │
│     └── 사후 분석, 재발 방지 대책                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 연락 체계

| 단계 | 담당자                 | 연락처                | 역할      |
| ---- | ---------------------- | --------------------- | --------- |
| 1차  | 보안 담당자            | security@hospital.com | 초기 대응 |
| 2차  | IT 책임자              | -                     | 의사결정  |
| 3차  | 경영진                 | -                     | 대외 대응 |
| 외부 | 침해사고 대응팀 (CERT) | -                     | 법적 신고 |
| 외부 | 경찰청 사이버수사대    | 182                   | 수사 협조 |

---

## 부록: 보안 체크리스트

### 개발 단계

- [ ] 모든 입력값 유효성 검증
- [ ] SQL Injection 방지 (ORM/파라미터 바인딩)
- [ ] XSS 방지 (출력 인코딩)
- [ ] CSRF 토큰 적용
- [ ] 민감 정보 암호화
- [ ] 에러 메시지에 상세 정보 노출 금지
- [ ] 로깅에 민감 정보 제외
- [ ] 의존성 취약점 검사

### 배포 단계

- [ ] TLS 1.2 이상 적용
- [ ] 보안 헤더 설정
- [ ] 관리자 페이지 접근 제한
- [ ] 기본 계정/비밀번호 변경
- [ ] 불필요한 포트/서비스 차단
- [ ] 로그 수집 및 모니터링 설정

### 운영 단계

- [ ] 정기 보안 점검 수행
- [ ] 접근 로그 모니터링
- [ ] 취약점 패치 적용
- [ ] 백업 및 복구 테스트
- [ ] 보안 교육 실시
