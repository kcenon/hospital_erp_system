# Security Requirements Specification

## Document Information

| Item | Content |
|------|------|
| Document Version | 0.1.0.0 |
| Created Date | 2025-12-29 |
| Status | Draft |
| Manager | kcenon@naver.com |
| Security Classification | Internal Use |

---

## 1. Security Overview

### 1.1 Security Objectives

```
┌─────────────────────────────────────────────────────────────────┐
│                       CIA Security Triad                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────┐                                          │
│   │  Confidentiality │  Confidentiality: Only authorized users  │
│   └──────────────────┘  can access information                  │
│                                                                  │
│   ┌──────────────────┐                                          │
│   │    Integrity     │  Integrity: Ensure accuracy and          │
│   └──────────────────┘  completeness of information             │
│                                                                  │
│   ┌──────────────────┐                                          │
│   │   Availability   │  Availability: Ensure information        │
│   └──────────────────┘  access when needed                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Related Laws and Regulations

| Law/Regulation | Scope | Key Requirements |
|----------|----------|--------------|
| **Personal Information Protection Act** | All patient personal information | Encryption, access control, consent management |
| **Medical Service Act** | Medical records | 5-year retention, access control |
| **Electronic Documents Act** | Electronic records | Integrity, authenticity |
| **Information and Communications Network Act** | Entire system | Security measures, incident response |

### 1.3 Security Architecture Overview

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

## 2. Authentication Security

### 2.1 Authentication Requirements

| Requirement | Details | Priority |
|----------|------|----------|
| **Strong Password** | 8+ characters, combination of uppercase/lowercase/numbers/special characters | Required |
| **Password Hashing** | bcrypt (cost factor 12 or higher) | Required |
| **MFA Support** | TOTP (Google Authenticator, etc.) | Recommended |
| **Session Management** | 30-minute idle timeout | Required |
| **Concurrent Session Limit** | Maximum 3 sessions per user | Required |
| **Login Attempt Limit** | 15-minute lockout after 5 failed attempts | Required |

### 2.2 Password Policy

```typescript
// Password policy implementation example
const passwordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  preventCommon: true,        // Block common passwords
  preventUserInfo: true,      // Block passwords containing user info
  historyCount: 5,            // Prevent reuse of last 5 passwords
  maxAge: 90,                 // Password change required every 90 days
  warnBefore: 14              // Warning 14 days before expiration
};

// Password strength validation
function validatePassword(password: string, user: User): ValidationResult {
  const errors: string[] = [];

  if (password.length < passwordPolicy.minLength) {
    errors.push('Password must be at least 8 characters.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Must include uppercase letter.');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Must include lowercase letter.');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Must include number.');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Must include special character.');
  }

  // Check for user info in password
  if (password.toLowerCase().includes(user.username.toLowerCase())) {
    errors.push('Cannot include user ID.');
  }

  return { isValid: errors.length === 0, errors };
}
```

### 2.3 JWT Token Management

```typescript
// JWT configuration
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '1h',          // 1 hour
    algorithm: 'HS256'
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',          // 7 days
    algorithm: 'HS256'
  }
};

// Token payload
interface TokenPayload {
  sub: string;                // User ID
  username: string;
  roles: string[];
  permissions: string[];
  iat: number;                // Issued at
  exp: number;                // Expiration time
  jti: string;                // Token unique ID (for revocation)
}
```

### 2.4 Session Management

```typescript
// Redis session storage
interface SessionData {
  userId: string;
  tokenJti: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

// Session policy
const sessionPolicy = {
  maxConcurrentSessions: 3,   // Maximum concurrent sessions
  idleTimeout: 30 * 60,       // 30 minutes (seconds)
  absoluteTimeout: 8 * 60 * 60, // 8 hours (seconds)
  renewThreshold: 5 * 60      // Renew when 5 minutes remaining
};
```

---

## 3. Authorization Security

### 3.1 Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────────────────┐
│                        RBAC Structure                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Users                                 │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │  │
│  │  │ Hong   │  │ Dr.Kim │  │ Nurse  │  │ Clerk  │          │  │
│  │  │        │  │        │  │  Park  │  │  Lee   │          │  │
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

### 3.2 Permission Matrix

| Resource | ADMIN | DOCTOR | HEAD_NURSE | NURSE | CLERK |
|--------|-------|--------|------------|-------|-------|
| **Patient Information** |
| - View | ✅ | ✅ | ✅ | ✅ (assigned) | ✅ |
| - Create | ✅ | ❌ | ❌ | ❌ | ✅ |
| - Update | ✅ | ✅ (own patients) | ✅ | ❌ | ✅ |
| - Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Room Management** |
| - View | ✅ | ✅ | ✅ | ✅ | ✅ |
| - Assign | ✅ | ❌ | ✅ | ❌ | ✅ |
| - Configure | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Reports** |
| - View | ✅ | ✅ | ✅ | ✅ (assigned) | ❌ |
| - Create | ✅ | ✅ | ✅ | ✅ | ❌ |
| - Update | ✅ | ✅ (own) | ✅ | ✅ (own) | ❌ |
| **Audit Logs** |
| - View | ✅ | ❌ | ❌ | ❌ | ❌ |
| **User Management** |
| - Full Access | ✅ | ❌ | ❌ | ❌ | ❌ |

### 3.3 Permission Verification Implementation

```typescript
// Permission guard (NestJS)
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredPermissions.every(permission =>
      user.permissions.includes(permission)
    );
  }
}

// Usage example
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

## 4. Data Security

### 4.1 Encryption Requirements

| Data Type | At-Rest Encryption | In-Transit Encryption | Method |
|------------|--------------|--------------|------|
| Password | ✅ | ✅ | bcrypt (one-way) |
| Social Security Number | ✅ | ✅ | AES-256-GCM |
| Medical Records | ✅ | ✅ | AES-256-GCM |
| Diagnosis Information | ✅ | ✅ | AES-256-GCM |
| Insurance Information | ✅ | ✅ | AES-256-GCM |
| General Personal Information | ❌ | ✅ | TLS 1.3 |
| API Communication | N/A | ✅ | TLS 1.3 |

### 4.2 Encryption Implementation

```typescript
// Encryption service
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly authTagLength = 16;

  constructor(
    @Inject('ENCRYPTION_KEY') private readonly key: Buffer
  ) {}

  encrypt(plaintext: string): EncryptedData {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      data: encrypted,
      authTag: authTag.toString('base64')
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

// Sensitive field decorator
function Encrypted() {
  return function(target: any, propertyKey: string) {
    // Automatic encryption/decryption handling
  };
}

// Usage example
class PatientDetails {
  @Encrypted()
  ssn: string;  // Social Security Number

  @Encrypted()
  medicalHistory: string;  // Medical history
}
```

### 4.3 PostgreSQL Encryption

```sql
-- Install pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encryption function
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

-- Decryption function
CREATE OR REPLACE FUNCTION decrypt_sensitive(data BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    data,
    current_setting('app.encryption_key')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage example
INSERT INTO patient_details (patient_id, ssn_encrypted)
VALUES (
  'patient-uuid',
  encrypt_sensitive('901234-1234567')
);

SELECT decrypt_sensitive(ssn_encrypted) AS ssn
FROM patient_details
WHERE patient_id = 'patient-uuid';
```

### 4.4 Data Masking

```typescript
// Masking utility
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
    // Hong -> H*ng (for 3+ character names)
    if (value.length <= 2) return value[0] + '*';
    return value[0] + '*'.repeat(value.length - 2) + value.slice(-1);
  },

  email: (value: string) => {
    // test@example.com -> t***@example.com
    const [local, domain] = value.split('@');
    return local[0] + '***@' + domain;
  }
};

// Response filtering (masking based on permissions)
function applyMasking(data: any, userPermissions: string[]): any {
  if (!userPermissions.includes('patient:read:sensitive')) {
    return {
      ...data,
      ssn: maskingRules.ssn(data.ssn),
      phone: maskingRules.phone(data.phone)
    };
  }
  return data;
}
```

---

## 5. Audit and Logging

### 5.1 Audit Log Requirements

| Event Type | Logged Items | Retention Period |
|------------|----------|----------|
| Login/Logout | User, time, IP, result | 2 years |
| Patient Information View | User, time, patient ID, viewed fields | 2 years |
| Patient Information Update | User, time, before/after values | Permanent |
| Report Create/Update | User, time, document ID, content | 5 years |
| Permission Changes | Admin, time, target, change details | Permanent |
| Data Export/Download | User, time, data scope | 2 years |

### 5.2 Audit Log Structure

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;

  // Subject information
  userId: string;
  username: string;
  userRole: string;
  ipAddress: string;
  userAgent: string;

  // Action information
  action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'LOGIN' | 'LOGOUT';
  resourceType: string;
  resourceId: string;

  // Detail information
  requestPath: string;
  requestMethod: string;
  requestBody?: object;       // Excluding sensitive info

  // Result
  success: boolean;
  errorCode?: string;
  errorMessage?: string;

  // Change history (for UPDATE)
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
```

### 5.3 Automatic Audit Logging

```typescript
// Audit log interceptor
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
            duration: Date.now() - startTime
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
            duration: Date.now() - startTime
          });
        }
      })
    );
  }
}
```

### 5.4 Patient Information Access Log (Special)

```sql
-- Dedicated patient information access log table
CREATE TABLE audit.patient_access_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accessed_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Accessor information
    user_id         UUID NOT NULL,
    user_name       VARCHAR(100) NOT NULL,
    user_role       VARCHAR(50) NOT NULL,
    user_department VARCHAR(100),

    -- Patient information
    patient_id      UUID NOT NULL,
    patient_number  VARCHAR(20) NOT NULL,
    patient_name    VARCHAR(100) NOT NULL,

    -- Access details
    access_type     VARCHAR(50) NOT NULL,  -- VIEW, UPDATE, EXPORT
    accessed_fields TEXT[],                 -- List of accessed fields
    access_reason   TEXT,                   -- Access reason (optional)

    -- Client information
    ip_address      INET,
    device_type     VARCHAR(50),

    -- Indexes
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patient.patients(id)
);

-- Monthly partitioning
CREATE INDEX idx_patient_access_date ON audit.patient_access_logs(accessed_at);
CREATE INDEX idx_patient_access_user ON audit.patient_access_logs(user_id);
CREATE INDEX idx_patient_access_patient ON audit.patient_access_logs(patient_id);
```

---

## 6. Network Security

### 6.1 TLS Configuration

```nginx
# nginx TLS configuration
server {
    listen 443 ssl http2;
    server_name api.hospital-erp.com;

    # TLS version (allow only 1.2, 1.3)
    ssl_protocols TLSv1.2 TLSv1.3;

    # Strong cipher suites
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Certificates
    ssl_certificate /etc/ssl/certs/hospital-erp.crt;
    ssl_certificate_key /etc/ssl/private/hospital-erp.key;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Other security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'" always;
}
```

### 6.2 WAF Rules

| Rule | Description | Action |
|------|------|------|
| SQL Injection | SQL injection pattern detection | Block |
| XSS | Script injection attempt | Block |
| Path Traversal | Path manipulation attempt | Block |
| Rate Limit | Exceeding 1000 requests per minute | Temporary block |
| Bot Detection | Known malicious bots | Block |
| GeoIP | Access from non-allowed countries | Block (optional) |

### 6.3 Rate Limiting

```typescript
// Rate Limiting configuration
const rateLimitConfig = {
  // General API
  default: {
    windowMs: 60 * 1000,  // 1 minute
    max: 100              // 100 requests
  },

  // Login API (brute force prevention)
  login: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5                      // 5 attempts
  },

  // Sensitive information API
  sensitive: {
    windowMs: 60 * 1000,  // 1 minute
    max: 20               // 20 requests
  },

  // Data export
  export: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 10                     // 10 times
  }
};
```

---

## 7. Input Validation

### 7.1 Validation Rules

```typescript
// Common validation decorators
class CreatePatientDto {
  @IsString()
  @Length(2, 50)
  @Matches(/^[가-힣a-zA-Z\s]+$/, {
    message: 'Name can only contain Korean, English, and spaces.'
  })
  name: string;

  @IsString()
  @Matches(/^P\d{10}$/, {
    message: 'Invalid patient number format. (e.g., P2025001234)'
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
    message: 'Invalid phone number format.'
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => sanitizeHtml(value))  // XSS prevention
  notes?: string;
}
```

### 7.2 SQL Injection Prevention

```typescript
// Using Prisma ORM (automatic parameter binding)
const patient = await prisma.patient.findFirst({
  where: {
    patientNumber: userInput  // Automatically escaped
  }
});

// Required parameter binding for raw queries
const results = await prisma.$queryRaw`
  SELECT * FROM patients
  WHERE name LIKE ${`%${searchTerm}%`}
`;

// ❌ Never do this: string concatenation
// const results = await prisma.$queryRawUnsafe(
//   `SELECT * FROM patients WHERE name LIKE '%${searchTerm}%'`
// );
```

### 7.3 XSS Prevention

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Input sanitization
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],  // Remove all tags
    ALLOWED_ATTR: []   // Remove all attributes
  });
}

// HTML-allowed fields (nursing notes, etc.)
function sanitizeRichText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
}
```

---

## 8. Security Monitoring

### 8.1 Security Event Definitions

| Event | Severity | Alert |
|--------|--------|------|
| Multiple login failures | HIGH | Immediate (Slack, SMS) |
| Access during unusual hours | MEDIUM | Within 15 minutes |
| Bulk data query | HIGH | Immediate |
| Privilege escalation attempt | CRITICAL | Immediate (entire team) |
| Bulk sensitive information access | CRITICAL | Immediate |
| Admin access from new IP | HIGH | Immediate |

### 8.2 Anomaly Detection Rules

```typescript
// Anomaly behavior detection rules
const anomalyRules = {
  // Access during unusual hours
  unusualHours: {
    condition: (event) => {
      const hour = event.timestamp.getHours();
      return hour < 6 || hour > 22;  // Outside 6 AM - 10 PM
    },
    severity: 'MEDIUM'
  },

  // Bulk access
  bulkAccess: {
    condition: (events) => {
      const recentEvents = events.filter(
        e => e.action === 'VIEW' &&
        e.resourceType === 'patient' &&
        Date.now() - e.timestamp < 5 * 60 * 1000  // 5 minutes
      );
      return recentEvents.length > 50;  // More than 50 within 5 minutes
    },
    severity: 'HIGH'
  },

  // Unauthorized access attempt
  unauthorizedAccess: {
    condition: (event) => {
      return event.success === false &&
             event.errorCode === 'FORBIDDEN';
    },
    severity: 'HIGH'
  }
};
```

### 8.3 Security Dashboard Metrics

| Metric | Description | Threshold |
|--------|------|--------|
| Login failure rate | Failure ratio of total logins | > 10% |
| Abnormal access attempts | Unauthorized resource access | > 5/hour |
| Sensitive information access frequency | SSN queries, etc. | 200% of baseline |
| Suspected session hijacking | Sessions with sudden IP/device change | > 0 |
| API error rate | 4xx/5xx response ratio | > 5% |

---

## 9. Vulnerability Management

### 9.1 Regular Security Checks

| Check Type | Frequency | Responsible |
|----------|------|------|
| Dependency vulnerability scan | Daily (CI/CD) | Automated |
| Static code analysis (SAST) | Per PR | Automated |
| Dynamic analysis (DAST) | Weekly | Security team |
| Penetration testing | Quarterly | External vendor |
| Security code review | Per release | Development team |

### 9.2 Vulnerability Response SLA

| Severity | Response Time | Resolution Time |
|--------|----------|----------|
| CRITICAL | 1 hour | 24 hours |
| HIGH | 4 hours | 72 hours |
| MEDIUM | 24 hours | 7 days |
| LOW | 72 hours | 30 days |

### 9.3 Dependency Security

```yaml
# GitHub Actions - Dependency scan
name: Security Scan

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM

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

## 10. Incident Response Plan

### 10.1 Security Incident Classification

| Level | Definition | Examples |
|------|------|------|
| P1 (Critical) | Patient data breach, system compromise | Ransomware, DB leak |
| P2 (High) | Partial data access, service outage | Account takeover, DDoS |
| P3 (Medium) | Limited impact, immediate response possible | Vulnerability discovered |
| P4 (Low) | Minor impact | Policy violation attempt |

### 10.2 Response Procedure

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Incident Response Process            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Detection                                                    │
│     └── Monitoring system, user reports, external tips           │
│                    │                                             │
│                    ▼                                             │
│  2. Triage                                                       │
│     └── Severity assessment, scope determination                 │
│                    │                                             │
│                    ▼                                             │
│  3. Containment                                                  │
│     └── Prevent spread, preserve evidence                        │
│                    │                                             │
│                    ▼                                             │
│  4. Eradication                                                  │
│     └── Remove threat elements, patch vulnerabilities            │
│                    │                                             │
│                    ▼                                             │
│  5. Recovery                                                     │
│     └── Restore service, enhance monitoring                      │
│                    │                                             │
│                    ▼                                             │
│  6. Lessons Learned                                              │
│     └── Post-incident analysis, prevention measures              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Contact Chain

| Level | Contact | Contact Info | Role |
|------|--------|--------|------|
| Primary | Security Manager | security@hospital.com | Initial response |
| Secondary | IT Director | - | Decision making |
| Tertiary | Executive | - | External response |
| External | CERT Team | - | Legal reporting |
| External | Cyber Police | 182 | Investigation cooperation |

---

## Appendix: Security Checklist

### Development Phase

- [ ] All input validation
- [ ] SQL Injection prevention (ORM/parameter binding)
- [ ] XSS prevention (output encoding)
- [ ] CSRF token applied
- [ ] Sensitive information encrypted
- [ ] No detailed information in error messages
- [ ] Sensitive information excluded from logging
- [ ] Dependency vulnerability check

### Deployment Phase

- [ ] TLS 1.2 or higher applied
- [ ] Security headers configured
- [ ] Admin page access restricted
- [ ] Default account/password changed
- [ ] Unnecessary ports/services blocked
- [ ] Logging and monitoring configured

### Operations Phase

- [ ] Regular security checks performed
- [ ] Access log monitoring
- [ ] Vulnerability patches applied
- [ ] Backup and recovery testing
- [ ] Security training conducted
