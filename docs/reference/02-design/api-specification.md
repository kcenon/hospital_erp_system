# API Specification

## Document Information

| Item             | Content                               |
| ---------------- | ------------------------------------- |
| Document Version | 0.5.0.0                               |
| Created Date     | 2025-12-29                            |
| Last Updated     | 2026-02-26                            |
| Owner            | kcenon@naver.com                      |
| API Version      | 1.0                                   |
| Base URL         | `https://api.hospital-erp.com/api/v1` |

---

## 1. API Overview

### 1.1 Design Principles

| Principle         | Description                                             |
| ----------------- | ------------------------------------------------------- |
| **RESTful**       | Resource-centric design, HTTP method utilization        |
| **JSON**          | Request/response body in JSON format                    |
| **Versioning**    | URI versioning with `/api/v1/` prefix (see Section 1.5) |
| **Consistency**   | Unified naming conventions and response format          |
| **Documentation** | Auto-generated OpenAPI 3.0 (Swagger)                    |

### 1.2 Common Headers

```http
# Request Headers
Content-Type: application/json
Accept: application/json
Authorization: Bearer <access_token>
X-Request-ID: <uuid>           # Request tracking
X-Client-Version: 1.0.0        # Client version

# Response Headers
Content-Type: application/json
X-Request-ID: <uuid>
```

> **Note**: `X-RateLimit-*` response headers are **not implemented**. When a rate limit is exceeded, the API returns HTTP 429 with the body below (see Section 1.6).

### 1.3 Common Response Format

> **Note**: The API follows NestJS conventions and returns DTO objects directly without wrapper envelopes. This approach simplifies client integration and aligns with standard RESTful practices.

#### Success Response (Single Resource)

Returns the DTO object directly:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "patientNumber": "P2025001234",
  "name": "John Doe",
  "birthDate": "1990-05-15",
  "gender": "MALE",
  "createdAt": "2025-12-29T10:30:00Z",
  "updatedAt": "2025-12-29T10:30:00Z"
}
```

#### List Response (Pagination)

Returns paginated results with metadata:

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "patientNumber": "P2025001234",
      "name": "John Doe",
      ...
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Error Response

Error responses follow a consistent format handled by `HttpExceptionFilter`:

```json
{
  "statusCode": 404,
  "timestamp": "2025-12-29T10:30:00Z",
  "path": "/api/v1/patients/invalid-uuid",
  "method": "GET",
  "message": "Patient not found"
}
```

For validation errors (HTTP 400/422), the message may be an array:

```json
{
  "statusCode": 400,
  "timestamp": "2025-12-29T10:30:00Z",
  "path": "/api/v1/patients",
  "method": "POST",
  "message": ["patientNumber must be a string", "name should not be empty"]
}
```

### 1.4 HTTP Status Codes

| Code | Meaning           | Usage                      |
| ---- | ----------------- | -------------------------- |
| 200  | OK                | Success (read, update)     |
| 201  | Created           | Resource creation success  |
| 204  | No Content        | Deletion success           |
| 400  | Bad Request       | Invalid request            |
| 401  | Unauthorized      | Authentication required    |
| 403  | Forbidden         | Permission denied          |
| 404  | Not Found         | Resource not found         |
| 409  | Conflict          | Conflict (duplicate, etc.) |
| 422  | Unprocessable     | Validation failed          |
| 429  | Too Many Requests | Rate limit exceeded        |
| 500  | Internal Error    | Server error               |

### 1.5 API Versioning Strategy

#### Current Approach

This API uses **URI-based versioning** with a global `/api` prefix. All endpoints (except health checks) are accessed via the `/api/v1/` prefix:

```
https://api.hospital-erp.com/api/v1/patients
https://api.hospital-erp.com/api/v1/admissions
https://api.hospital-erp.com/api/v1/rounds
```

Health check endpoints are excluded from the versioning prefix:

```
https://api.hospital-erp.com/health
https://api.hospital-erp.com/health/live
https://api.hospital-erp.com/health/ready
```

#### Implementation

The versioning is configured in `main.ts` using NestJS built-in versioning support:

```typescript
app.setGlobalPrefix('api', {
  exclude: ['health', 'health/live', 'health/ready'],
});

app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
```

| Configuration       | Value                | Effect                                         |
| ------------------- | -------------------- | ---------------------------------------------- |
| **Global Prefix**   | `api`                | All routes prefixed with `/api`                |
| **Versioning Type** | `URI`                | Version embedded in URL path                   |
| **Default Version** | `1`                  | Routes default to `/api/v1/` unless overridden |
| **Excluded Routes** | `health`, `health/*` | Health checks accessible without prefix        |

#### Future Versioning Plan

When breaking changes become necessary, new versions can be introduced alongside existing ones:

```typescript
// Controller-level version override
@Controller({ version: '2' })
export class PatientsV2Controller { ... }
// Accessible at /api/v2/patients while /api/v1/patients remains available
```

| Strategy            | Status          | Notes                                       |
| ------------------- | --------------- | ------------------------------------------- |
| **URI Versioning**  | **Active (v1)** | Clear, cacheable, easy to route and test    |
| **v2 Introduction** | Planned         | Per-controller version override when needed |

#### Breaking Change Policy

Changes that constitute breaking changes:

- Removing an endpoint or HTTP method
- Removing or renaming a required field
- Changing field data types
- Modifying authentication requirements
- Changing error response structure

Non-breaking changes (allowed without versioning):

- Adding new endpoints
- Adding optional fields to requests/responses
- Adding new enum values (with client guidance)
- Performance improvements
- Bug fixes

#### Deprecation Guidelines

When deprecating features:

1. **Announcement**: Document deprecation at least 30 days before removal
2. **Warning Header**: Add `Deprecation` header to affected endpoints
3. **Migration Guide**: Provide documentation for transitioning to new API
4. **Sunset Date**: Clearly communicate the removal date

Example deprecation header:

```http
Deprecation: true
Sunset: Sat, 01 Mar 2026 00:00:00 GMT
Link: <https://docs.hospital-erp.com/migration/v2>; rel="successor-version"
```

### 1.6 Rate Limiting

The API uses a **3-tier throttling strategy** powered by `@nestjs/throttler` with Redis-backed distributed storage (`ThrottlerRedisStorageService`). All three tiers are enforced simultaneously — a request is rejected when **any** tier limit is exceeded.

| Tier       | Window | Limit | Effective Rate      |
| ---------- | ------ | ----- | ------------------- |
| **short**  | 1 sec  | 3     | 3 requests/second   |
| **medium** | 10 sec | 20    | 20 requests/10 sec  |
| **long**   | 60 sec | 100   | 100 requests/minute |

**Redis Storage**: Rate limit counters are stored in Redis, ensuring consistent enforcement across multiple backend replicas.

**429 Error Response**

When a limit is exceeded, the API responds with HTTP `429 Too Many Requests`:

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again later."
}
```

> **Note**: `X-RateLimit-*` response headers are not implemented. Clients must handle 429 responses with appropriate retry logic (e.g., exponential backoff).

---

## 2. Authentication API

### 2.1 Login

```http
POST /api/v1/auth/login
```

**Request**

```json
{
  "username": "nurse001",
  "password": "SecureP@ss123"
}
```

**Response (200 OK)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "nurse001",
    "name": "Kim Nurse",
    "department": "Internal Medicine Ward",
    "roles": ["NURSE"]
  }
}
```

### 2.2 Token Refresh

```http
POST /api/v1/auth/refresh
```

**Request**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.3 Logout

```http
POST /api/v1/auth/logout
```

**Request**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.4 Change Password

```http
POST /api/v1/auth/change-password
```

**Request**

```json
{
  "currentPassword": "OldP@ss123",
  "newPassword": "NewSecureP@ss456"
}
```

**Password Requirements**

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Response (200 OK)**

```json
{
  "message": "Password changed successfully"
}
```

**Error Responses**

| HTTP | Code                     | Description                         |
| ---- | ------------------------ | ----------------------------------- |
| 401  | AUTH_INVALID_CREDENTIALS | Current password is incorrect       |
| 403  | AUTH_SAME_PASSWORD       | New password must be different      |
| 422  | VALIDATION_FAILED        | Password does not meet requirements |

---

## 3. Patient Management API

### 3.1 List Patients

```http
GET /api/v1/patients
```

**Query Parameters**

| Parameter | Type    | Description                          | Default |
| --------- | ------- | ------------------------------------ | ------- |
| page      | integer | Page number                          | 1       |
| limit     | integer | Items per page                       | 20      |
| search    | string  | Name/patient number search           | -       |
| status    | string  | Status filter (ADMITTED, DISCHARGED) | -       |
| floorId   | uuid    | Floor filter                         | -       |
| sortBy    | string  | Sort field                           | name    |
| sortOrder | string  | Sort direction (asc, desc)           | asc     |

**Response (200 OK)**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "patientNumber": "P2025001234",
      "name": "John Doe",
      "birthDate": "1990-05-15",
      "gender": "MALE",
      "age": 34,
      "phone": "010-1234-5678",
      "currentAdmission": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "admissionDate": "2025-12-25",
        "roomNumber": "301",
        "bedNumber": "A",
        "diagnosis": "Pneumonia",
        "attendingDoctor": "Dr. Lee"
      }
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 3.2 Get Patient Details

```http
GET /api/v1/patients/{patientId}
```

**Response (200 OK)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "patientNumber": "P2025001234",
  "name": "John Doe",
  "birthDate": "1990-05-15",
  "gender": "MALE",
  "bloodType": "A+",
  "phone": "010-1234-5678",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "010-9876-5432",
  "emergencyContactRelation": "Spouse",
  "address": "123 Teheran-ro, Gangnam-gu, Seoul",
  "detail": {
    "allergies": "Penicillin",
    "medicalHistory": null,
    "insuranceType": null,
    "insuranceNumber": null,
    "insuranceCompany": null,
    "notes": null
  },
  "currentAdmission": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "admissionNumber": "A2025123456",
    "admissionDate": "2025-12-25",
    "admissionTime": "14:30",
    "diagnosis": "Pneumonia",
    "room": {
      "id": "room-uuid",
      "number": "301",
      "floor": "3rd Floor Internal Medicine"
    },
    "bed": {
      "id": "bed-uuid",
      "number": "A"
    },
    "attendingDoctor": {
      "id": "doctor-uuid",
      "name": "Dr. Lee"
    },
    "primaryNurse": {
      "id": "nurse-uuid",
      "name": "Nurse Kim"
    }
  },
  "admissionHistory": [
    {
      "id": "prev-admission-uuid",
      "admissionDate": "2024-06-10",
      "dischargeDate": "2024-06-20",
      "diagnosis": "Acute Gastroenteritis"
    }
  ]
}
```

### 3.3 Register Patient

```http
POST /api/v1/patients
```

**Request**

```json
{
  "name": "John Doe",
  "birthDate": "1990-05-15",
  "gender": "MALE",
  "bloodType": "A+",
  "phone": "010-1234-5678",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "010-9876-5432",
  "emergencyContactRelation": "Spouse",
  "address": "123 Teheran-ro, Gangnam-gu, Seoul"
}
```

### 3.4 Update Patient Information

```http
PATCH /api/v1/patients/{patientId}
```

**Request**

```json
{
  "phone": "010-1111-2222",
  "emergencyPhone": "010-3333-4444"
}
```

### 3.5 Legacy System Integration

#### 3.5.1 Search Patients in Legacy System

```http
GET /api/v1/patients/legacy/search
```

**Query Parameters**

| Parameter | Type   | Description  | Required |
| --------- | ------ | ------------ | -------- |
| q         | string | Search query | Yes      |

**Response (200 OK)**

```json
[
  {
    "legacyId": "L2020001234",
    "name": "John Doe",
    "birthDate": "1990-05-15",
    "gender": "MALE",
    "ssn": "900515-1******",
    "phone": "010-****-5678",
    "bloodType": "A+",
    "insuranceType": "NATIONAL"
  }
]
```

#### 3.5.2 Get Legacy Patient Details

```http
GET /api/v1/patients/legacy/{legacyId}
```

**Response (200 OK)**

```json
{
  "legacyId": "L2020001234",
  "name": "John Doe",
  "birthDate": "1990-05-15",
  "gender": "MALE",
  "ssn": "900515-1******",
  "phone": "010-****-5678",
  "address": "*** Teheran-ro, Gangnam-gu, Seoul",
  "bloodType": "A+",
  "insuranceType": "NATIONAL",
  "insuranceNumber": "12345*****"
}
```

#### 3.5.3 Get Medical History from Legacy

```http
GET /api/v1/patients/legacy/{legacyId}/medical-history
```

**Response (200 OK)**

```json
{
  "legacyId": "L2020001234",
  "diagnoses": [
    {
      "code": "J18.9",
      "name": "Pneumonia",
      "diagnosedAt": "2024-06-10",
      "status": "RESOLVED"
    }
  ],
  "medications": [
    {
      "name": "Aspirin",
      "dosage": "100mg",
      "frequency": "QD",
      "startDate": "2024-01-01"
    }
  ],
  "allergies": ["Penicillin"],
  "surgeries": [
    {
      "name": "Appendectomy",
      "performedAt": "2020-03-15",
      "hospital": "Seoul General Hospital"
    }
  ],
  "lastVisitDate": "2024-12-01"
}
```

#### 3.5.4 Import Patient from Legacy System

```http
POST /api/v1/patients/legacy/{legacyId}/import
```

**Response (201 Created)**

```json
{
  "id": "new-patient-uuid",
  "patientNumber": "P2025001234",
  "name": "John Doe",
  "birthDate": "1990-05-15",
  "gender": "MALE",
  "legacyPatientId": "L2020001234"
}
```

**Error Responses**

| HTTP | Code                      | Description                          |
| ---- | ------------------------- | ------------------------------------ |
| 404  | LEGACY_PATIENT_NOT_FOUND  | Patient not found in legacy system   |
| 409  | PATIENT_ALREADY_IMPORTED  | Patient already imported from legacy |
| 503  | LEGACY_SYSTEM_UNAVAILABLE | Legacy system connection failed      |

#### 3.5.5 Check Legacy System Connection

```http
GET /api/v1/patients/legacy/health
```

**Response (200 OK)**

```json
{
  "connected": true
}
```

---

## 4. Room Management API

### 4.1 Get Room Status

```http
GET /api/v1/rooms
```

**Query Parameters**

| Parameter  | Type    | Description                                     |
| ---------- | ------- | ----------------------------------------------- |
| buildingId | uuid    | Building filter                                 |
| floorId    | uuid    | Floor filter                                    |
| status     | string  | Status (EMPTY, OCCUPIED, RESERVED, MAINTENANCE) |
| hasVacancy | boolean | Has vacant beds                                 |

**Response (200 OK)**

```json
[
  {
    "id": "room-uuid-1",
    "number": "301",
    "floor": {
      "id": "floor-uuid",
      "number": 3,
      "name": "3rd Floor Internal Medicine"
    },
    "roomType": "WARD",
    "capacity": 2,
    "currentCount": 1,
    "status": "EMPTY",
    "beds": [
      {
        "id": "bed-uuid-1",
        "number": "A",
        "status": "OCCUPIED",
        "patient": {
          "id": "patient-uuid",
          "name": "John Doe",
          "patientNumber": "P2025001234"
        }
      },
      {
        "id": "bed-uuid-2",
        "number": "B",
        "status": "EMPTY",
        "patient": null
      }
    ]
  }
]
```

### 4.2 Floor Room Dashboard

```http
GET /api/v1/rooms/dashboard/floor/{floorId}
```

**Response (200 OK)**

```json
{
  "floor": {
    "id": "floor-uuid",
    "number": 3,
    "name": "3rd Floor Internal Medicine",
    "building": "Main Building"
  },
  "summary": {
    "totalBeds": 30,
    "occupiedBeds": 22,
    "emptyBeds": 6,
    "maintenanceBeds": 2,
    "occupancyRate": 73.3
  },
  "rooms": [
    {
      "id": "room-uuid",
      "number": "301",
      "status": "EMPTY",
      "beds": [...]
    }
  ],
  "updatedAt": "2025-12-29T10:30:00Z"
}
```

### 4.3 Get Available Beds

```http
GET /api/v1/rooms/beds/available
```

**Query Parameters**

| Parameter | Type   | Description                                                                                            |
| --------- | ------ | ------------------------------------------------------------------------------------------------------ |
| floorId   | uuid   | Floor filter                                                                                           |
| roomType  | string | Room type (WARD, ICU, ISOLATION, VIP, EMERGENCY, RECOVERY, NICU, PEDIATRIC, LABOR_DELIVERY, OPERATING) |

---

## 5. Admission Management API

### 5.1 Register Admission

```http
POST /api/v1/admissions
```

**Request**

```json
{
  "patientId": "patient-uuid",
  "bedId": "bed-uuid",
  "admissionDate": "2025-12-29",
  "admissionTime": "14:30",
  "admissionType": "SCHEDULED",
  "admissionReason": "Pneumonia treatment",
  "diagnosis": "Pneumonia",
  "expectedDischarge": "2026-01-05",
  "attendingDoctorId": "doctor-uuid",
  "primaryNurseId": "nurse-uuid"
}
```

**Response (201 Created)**

```json
{
  "id": "admission-uuid",
  "admissionNumber": "A2025123456",
  "patient": { ... },
  "bed": { ... },
  "status": "ACTIVE",
  "createdAt": "2025-12-29T14:30:00Z"
}
```

### 5.2 Get Admission Details

```http
GET /api/v1/admissions/{admissionId}
```

### 5.3 List Admissions

```http
GET /api/v1/admissions
```

**Query Parameters**

| Parameter | Type   | Description             |
| --------- | ------ | ----------------------- |
| status    | string | ACTIVE, DISCHARGED      |
| floorId   | uuid   | Floor filter            |
| doctorId  | uuid   | Attending doctor filter |
| nurseId   | uuid   | Primary nurse filter    |
| fromDate  | date   | Admission date start    |
| toDate    | date   | Admission date end      |

### 5.4 Process Transfer

```http
POST /api/v1/admissions/{admissionId}/transfer
```

**Request**

```json
{
  "toBedId": "new-bed-uuid",
  "transferDate": "2025-12-29",
  "transferTime": "10:00",
  "reason": "Room upgrade request"
}
```

### 5.5 Process Discharge

```http
POST /api/v1/admissions/{admissionId}/discharge
```

**Request**

```json
{
  "dischargeDate": "2025-12-29",
  "dischargeTime": "11:00",
  "dischargeType": "NORMAL",
  "dischargeSummary": "Treatment completed, condition improved",
  "followUpPlan": "Outpatient visit in 1 week"
}
```

### 5.6 Get Admission by Number

```http
GET /api/v1/admissions/by-number/{admissionNumber}
```

**Response (200 OK)**

```json
{
  "id": "admission-uuid",
  "admissionNumber": "A2025123456",
  "patient": { ... },
  "bed": { ... },
  "status": "ACTIVE",
  "transfers": [ ... ],
  "discharge": null
}
```

### 5.7 Get Active Admission by Patient

```http
GET /api/v1/admissions/patient/{patientId}/active
```

Returns the currently active admission for a specific patient, or null if not admitted.

### 5.8 Get Admissions by Floor

```http
GET /api/v1/admissions/floor/{floorId}
```

**Query Parameters**

| Parameter | Type   | Description                |
| --------- | ------ | -------------------------- |
| status    | string | Filter by admission status |

### 5.9 Get Transfer History

```http
GET /api/v1/admissions/{admissionId}/transfers
```

**Response (200 OK)**

```json
[
  {
    "id": "transfer-uuid",
    "admissionId": "admission-uuid",
    "fromBedId": "old-bed-uuid",
    "toBedId": "new-bed-uuid",
    "transferDate": "2025-12-29",
    "transferTime": "10:00",
    "reason": "Room upgrade request",
    "transferredBy": "user-uuid",
    "createdAt": "2025-12-29T10:00:00Z"
  }
]
```

---

## 6. Reports and Logs API

This section covers APIs for patient reports and logs. All endpoints in this section use **nested routes under admissions** following the RESTful parent-child resource pattern.

### Nested Route Structure

All clinical data (vitals, medications, I/O, nursing notes, daily reports) are accessed through the admission resource:

```
/admissions/{admissionId}/vitals          - Vital signs
/admissions/{admissionId}/medications     - Medication records
/admissions/{admissionId}/io              - Intake/Output records
/admissions/{admissionId}/notes           - Nursing notes
/admissions/{admissionId}/daily-reports   - Daily aggregated reports
```

**Design Rationale**:

| Aspect              | Benefit                                                |
| ------------------- | ------------------------------------------------------ |
| **Ownership**       | Clear parent-child relationship (Admission owns data)  |
| **Access Control**  | Validates admission exists before accessing child data |
| **Query Scope**     | Natural filtering by admission context                 |
| **URL Consistency** | Uniform pattern across all clinical data endpoints     |

> **Note**: Frontend UI routes (e.g., `/vitals/input`) differ from API endpoints. See [SRS.md](../../SRS.md) Section 3.1.3 for the complete UI-to-API mapping.

### 6.1 Record Vital Signs

```http
POST /api/v1/admissions/{admissionId}/vitals
```

**Request**

```json
{
  "measuredAt": "2025-12-29T08:00:00Z",
  "temperature": 36.5,
  "systolicBp": 120,
  "diastolicBp": 80,
  "pulseRate": 72,
  "respiratoryRate": 18,
  "oxygenSaturation": 98,
  "bloodGlucose": 100,
  "tempSite": "AXILLARY",
  "bpPosition": "SITTING",
  "notes": ""
}
```

### 6.2 Get Vital Signs

```http
GET /api/v1/admissions/{admissionId}/vitals
```

**Query Parameters**

| Parameter | Type     | Description      |
| --------- | -------- | ---------------- |
| fromDate  | datetime | Start datetime   |
| toDate    | datetime | End datetime     |
| limit     | integer  | Recent N records |

**Response (200 OK)**

```json
[
  {
    "id": "vital-uuid",
    "measuredAt": "2025-12-29T08:00:00Z",
    "temperature": 36.5,
    "systolicBp": 120,
    "diastolicBp": 80,
    "pulseRate": 72,
    "respiratoryRate": 18,
    "oxygenSaturation": 98,
    "recordedBy": {
      "id": "nurse-uuid",
      "name": "Nurse Kim"
    }
  }
]
```

### 6.3 Daily Report API (Aggregated Reports)

#### 6.3.1 Get Daily Report

```http
GET /api/v1/admissions/{admissionId}/daily-reports/{date}
```

**Path Parameters**

| Parameter   | Type   | Description              |
| ----------- | ------ | ------------------------ |
| admissionId | uuid   | Admission ID             |
| date        | string | Report date (YYYY-MM-DD) |

**Response (200 OK)**

```json
{
  "id": "report-uuid",
  "admissionId": "admission-uuid",
  "reportDate": "2025-12-29",
  "vitalsSummary": {
    "measurementCount": 6,
    "temperature": { "min": 36.2, "max": 37.0, "avg": 36.5, "count": 6 },
    "bloodPressure": {
      "systolic": { "min": 110, "max": 130, "avg": 120, "count": 6 },
      "diastolic": { "min": 70, "max": 85, "avg": 78, "count": 6 }
    },
    "pulseRate": { "min": 68, "max": 82, "avg": 74, "count": 6 },
    "respiratoryRate": { "min": 14, "max": 18, "avg": 16, "count": 6 },
    "oxygenSaturation": { "min": 96, "max": 99, "avg": 98, "count": 6 },
    "alertCount": 0
  },
  "totalIntake": 2300,
  "totalOutput": 1900,
  "ioBalance": 400,
  "medicationsGiven": 8,
  "medicationsHeld": 1,
  "patientStatus": "STABLE",
  "summary": null,
  "alerts": [],
  "generatedAt": "2025-12-30T00:01:00Z",
  "generatedBy": null
}
```

#### 6.3.2 Generate Daily Report

```http
POST /api/v1/admissions/{admissionId}/daily-reports/{date}/generate
```

Generates or regenerates the daily report for the specified date by aggregating all available data.

**Response (201 Created)**

Same as Get Daily Report response.

#### 6.3.3 Get Live Daily Summary (Without Saving)

```http
GET /api/v1/admissions/{admissionId}/daily-reports/{date}/summary
```

Returns a real-time aggregated summary without persisting to database.

**Response (200 OK)**

```json
{
  "admissionId": "admission-uuid",
  "date": "2025-12-29",
  "vitalsSummary": { ... },
  "ioBalance": {
    "intake": {
      "oral": 800,
      "iv": 1500,
      "tubeFeeding": 0,
      "other": 0,
      "total": 2300
    },
    "output": {
      "urine": 1800,
      "stool": 100,
      "vomit": 0,
      "drainage": 0,
      "other": 0,
      "total": 1900
    },
    "balance": 400,
    "status": "NORMAL"
  },
  "medicationCompliance": {
    "scheduled": 10,
    "administered": 8,
    "held": 1,
    "refused": 0,
    "missed": 1,
    "complianceRate": 80
  },
  "significantNotes": [
    {
      "id": "note-uuid",
      "noteType": "ASSESSMENT",
      "summary": "Patient condition stable",
      "recordedAt": "2025-12-29T08:00:00Z"
    }
  ],
  "alerts": [],
  "patientStatus": "STABLE"
}
```

**Patient Status Values**

| Status    | Description              |
| --------- | ------------------------ |
| STABLE    | Condition stable         |
| IMPROVING | Condition improving      |
| DECLINING | Condition declining      |
| CRITICAL  | Critical alerts detected |

**I/O Balance Status Values**

| Status   | Description                     |
| -------- | ------------------------------- |
| NORMAL   | Balance within ±500ml threshold |
| POSITIVE | Intake exceeds output by >500ml |
| NEGATIVE | Output exceeds intake by >500ml |

### 6.4 List Daily Reports

```http
GET /api/v1/admissions/{admissionId}/daily-reports
```

**Query Parameters**

| Parameter | Type   | Description       | Default |
| --------- | ------ | ----------------- | ------- |
| startDate | date   | Start date filter | -       |
| endDate   | date   | End date filter   | -       |
| page      | number | Page number       | 1       |
| limit     | number | Items per page    | 20      |

**Response (200 OK)**

```json
{
  "data": [
    {
      "id": "report-uuid-1",
      "admissionId": "admission-uuid",
      "reportDate": "2025-12-29",
      "vitalsSummary": { ... },
      "totalIntake": 2300,
      "totalOutput": 1900,
      "ioBalance": 400,
      "medicationsGiven": 8,
      "medicationsHeld": 1,
      "patientStatus": "STABLE",
      "alerts": [],
      "generatedAt": "2025-12-30T00:01:00Z"
    },
    {
      "id": "report-uuid-2",
      "admissionId": "admission-uuid",
      "reportDate": "2025-12-28",
      ...
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 6.5 Intake/Output API

#### 6.5.1 Record I/O

```http
POST /api/v1/admissions/{admissionId}/io
```

**Request**

```json
{
  "recordDate": "2025-12-29",
  "recordTime": "2025-12-29T08:00:00Z",
  "oralIntake": 200,
  "ivIntake": 500,
  "tubeFeeding": 0,
  "otherIntake": 0,
  "urineOutput": 300,
  "stoolOutput": 0,
  "vomitOutput": 0,
  "drainageOutput": 0,
  "otherOutput": 0,
  "notes": "Morning intake"
}
```

**Response**

```json
{
  "id": "io-uuid",
  "admissionId": "admission-uuid",
  "recordDate": "2025-12-29",
  "recordTime": "2025-12-29T08:00:00Z",
  "oralIntake": 200,
  "ivIntake": 500,
  "tubeFeeding": 0,
  "otherIntake": 0,
  "totalIntake": 700,
  "urineOutput": 300,
  "stoolOutput": 0,
  "vomitOutput": 0,
  "drainageOutput": 0,
  "otherOutput": 0,
  "totalOutput": 300,
  "balance": 400,
  "recordedBy": "user-uuid",
  "notes": "Morning intake",
  "createdAt": "2025-12-29T08:05:00Z"
}
```

#### 6.5.2 Get I/O History

```http
GET /api/v1/admissions/{admissionId}/io
```

**Query Parameters**

| Parameter | Type   | Description       |
| --------- | ------ | ----------------- |
| startDate | date   | Start date filter |
| endDate   | date   | End date filter   |
| page      | number | Page number       |
| limit     | number | Items per page    |

#### 6.5.3 Get Daily I/O Summary

```http
GET /api/v1/admissions/{admissionId}/io/daily/{date}
```

**Response**

```json
{
  "date": "2025-12-29",
  "intake": {
    "oral": 800,
    "iv": 1500,
    "tubeFeeding": 0,
    "other": 0,
    "total": 2300
  },
  "output": {
    "urine": 1800,
    "stool": 100,
    "vomit": 0,
    "drainage": 0,
    "other": 0,
    "total": 1900
  },
  "balance": 400,
  "status": "NORMAL"
}
```

#### 6.5.4 Get I/O Balance History

```http
GET /api/v1/admissions/{admissionId}/io/balance
```

**Query Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| startDate | date | Start date  |
| endDate   | date | End date    |

### 6.6 Medication API

#### 6.6.1 Schedule Medication

```http
POST /api/v1/admissions/{admissionId}/medications
```

**Request**

```json
{
  "medicationName": "Ceftriaxone",
  "dosage": "1g",
  "route": "IV",
  "frequency": "BID",
  "scheduledTime": "2025-12-29T08:00:00Z",
  "notes": "Antibiotic therapy"
}
```

**Medication Routes**

| Route | Description   |
| ----- | ------------- |
| PO    | Oral          |
| IV    | Intravenous   |
| IM    | Intramuscular |
| SC    | Subcutaneous  |
| SL    | Sublingual    |
| TOP   | Topical       |
| INH   | Inhalation    |
| PR    | Per rectum    |
| OTHER | Other         |

#### 6.6.2 Administer Medication

```http
POST /api/v1/admissions/{admissionId}/medications/{medicationId}/administer
```

**Request**

```json
{
  "administeredAt": "2025-12-29T08:05:00Z",
  "notes": "Administered without issues"
}
```

#### 6.6.3 Hold Medication

```http
POST /api/v1/admissions/{admissionId}/medications/{medicationId}/hold
```

**Request**

```json
{
  "reason": "Patient NPO for procedure"
}
```

#### 6.6.4 Refuse Medication

```http
POST /api/v1/admissions/{admissionId}/medications/{medicationId}/refuse
```

**Request**

```json
{
  "reason": "Patient refused due to nausea"
}
```

#### 6.6.5 Get Scheduled Medications

```http
GET /api/v1/admissions/{admissionId}/medications/scheduled/{date}
```

#### 6.6.6 Get Medication History

```http
GET /api/v1/admissions/{admissionId}/medications
```

**Query Parameters**

| Parameter | Type   | Description                                    |
| --------- | ------ | ---------------------------------------------- |
| startDate | date   | Start date filter                              |
| endDate   | date   | End date filter                                |
| status    | string | SCHEDULED, ADMINISTERED, HELD, REFUSED, MISSED |
| page      | number | Page number                                    |
| limit     | number | Items per page                                 |

### 6.7 Nursing Note API

#### 6.7.1 Create Nursing Note

```http
POST /api/v1/admissions/{admissionId}/notes
```

**Request**

```json
{
  "noteType": "ASSESSMENT",
  "subjective": "Patient complains of mild headache",
  "objective": "V/S stable, conscious and alert, no focal neurological deficit",
  "assessment": "Mild tension headache, possibly stress-related",
  "plan": "Continue observation, PRN analgesic if needed",
  "isSignificant": false
}
```

**Note Types**

| Type       | Description                |
| ---------- | -------------------------- |
| ASSESSMENT | Initial/ongoing assessment |
| PROGRESS   | Progress note              |
| PROCEDURE  | Procedure documentation    |
| INCIDENT   | Incident report            |
| HANDOFF    | Shift handoff note         |

#### 6.7.2 List Nursing Notes

```http
GET /api/v1/admissions/{admissionId}/notes
```

**Query Parameters**

| Parameter     | Type    | Description             |
| ------------- | ------- | ----------------------- |
| noteType      | string  | Filter by note type     |
| isSignificant | boolean | Filter significant only |
| page          | number  | Page number             |
| limit         | number  | Items per page          |

#### 6.7.3 Get Significant Notes

```http
GET /api/v1/admissions/{admissionId}/notes/significant
```

#### 6.7.4 Get Latest Note

```http
GET /api/v1/admissions/{admissionId}/notes/latest
```

---

## 7. Rounding API

### 7.1 Create Rounding Session

```http
POST /api/v1/rounds
```

**Request**

```json
{
  "floorId": "floor-uuid",
  "roundType": "MORNING",
  "scheduledDate": "2025-12-29",
  "scheduledTime": "09:00",
  "leadDoctorId": "doctor-uuid",
  "notes": "Optional notes"
}
```

**Response (201 Created)**

```json
{
  "id": "round-uuid",
  "roundNumber": "R2025122901",
  "floorId": "floor-uuid",
  "roundType": "MORNING",
  "scheduledDate": "2025-12-29",
  "scheduledTime": "09:00:00",
  "status": "PLANNED",
  "leadDoctorId": "doctor-uuid",
  "validTransitions": ["IN_PROGRESS", "CANCELLED"]
}
```

### 7.2 List Rounding Sessions

```http
GET /api/v1/rounds
```

**Query Parameters**

| Parameter         | Type   | Description                                        |
| ----------------- | ------ | -------------------------------------------------- |
| floorId           | uuid   | Filter by floor                                    |
| leadDoctorId      | uuid   | Filter by lead doctor                              |
| status            | string | PLANNED, IN_PROGRESS, PAUSED, COMPLETED, CANCELLED |
| roundType         | string | MORNING, AFTERNOON, EVENING, NIGHT                 |
| scheduledDateFrom | date   | Start date filter                                  |
| scheduledDateTo   | date   | End date filter                                    |
| page              | number | Page number (default: 1)                           |
| limit             | number | Items per page (default: 20, max: 100)             |

### 7.2.1 Get Round by Round Number

```http
GET /api/v1/rounds/by-number/{roundNumber}
```

**Path Parameters**

| Parameter   | Type   | Description                             |
| ----------- | ------ | --------------------------------------- |
| roundNumber | string | Round number (e.g., `RND-20240101-001`) |

**Response (200 OK)**: Single round object (same shape as 7.3 Get Round Detail response).

**Error Responses**

| HTTP | Code            | Description                           |
| ---- | --------------- | ------------------------------------- |
| 404  | ROUND_NOT_FOUND | Round with specified number not found |

### 7.3 Get Round Detail

```http
GET /api/v1/rounds/{roundId}
```

**Response (200 OK)**

```json
{
  "id": "round-uuid",
  "roundNumber": "R2025122901",
  "floorId": "floor-uuid",
  "roundType": "MORNING",
  "scheduledDate": "2025-12-29",
  "scheduledTime": "09:00:00",
  "startedAt": "2025-12-29T09:05:00Z",
  "completedAt": null,
  "pausedAt": null,
  "status": "IN_PROGRESS",
  "leadDoctorId": "doctor-uuid",
  "records": [],
  "validTransitions": ["PAUSED", "COMPLETED"]
}
```

### 7.4 Start Rounding

```http
POST /api/v1/rounds/{roundId}/start
```

**State Transition**: PLANNED → IN_PROGRESS

Initiates a rounding session that was previously created in PLANNED status. Sets the `startedAt` timestamp.

**Path Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| roundId   | uuid | Round UUID  |

**Response (200 OK)**

```json
{
  "id": "round-uuid",
  "roundNumber": "R2025122901",
  "floorId": "floor-uuid",
  "roundType": "MORNING",
  "scheduledDate": "2025-12-29",
  "scheduledTime": "09:00:00",
  "status": "IN_PROGRESS",
  "startedAt": "2025-12-29T09:05:00Z",
  "completedAt": null,
  "pausedAt": null,
  "leadDoctorId": "doctor-uuid",
  "validTransitions": ["PAUSED", "COMPLETED"]
}
```

**Error Responses**

| HTTP | Code                     | Description                       |
| ---- | ------------------------ | --------------------------------- |
| 400  | INVALID_STATE_TRANSITION | Round is not in PLANNED status    |
| 404  | ROUND_NOT_FOUND          | Round with specified ID not found |

### 7.5 Pause Rounding

```http
POST /api/v1/rounds/{roundId}/pause
```

**State Transition**: IN_PROGRESS → PAUSED

Temporarily pauses an active rounding session. Useful for emergency interruptions or breaks. Sets the `pausedAt` timestamp.

**Path Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| roundId   | uuid | Round UUID  |

**Response (200 OK)**

```json
{
  "id": "round-uuid",
  "roundNumber": "R2025122901",
  "floorId": "floor-uuid",
  "roundType": "MORNING",
  "scheduledDate": "2025-12-29",
  "scheduledTime": "09:00:00",
  "status": "PAUSED",
  "startedAt": "2025-12-29T09:05:00Z",
  "completedAt": null,
  "pausedAt": "2025-12-29T09:30:00Z",
  "leadDoctorId": "doctor-uuid",
  "validTransitions": ["IN_PROGRESS", "COMPLETED", "CANCELLED"]
}
```

**Error Responses**

| HTTP | Code                     | Description                        |
| ---- | ------------------------ | ---------------------------------- |
| 400  | INVALID_STATE_TRANSITION | Round is not in IN_PROGRESS status |
| 404  | ROUND_NOT_FOUND          | Round with specified ID not found  |

### 7.6 Resume Rounding

```http
POST /api/v1/rounds/{roundId}/resume
```

**State Transition**: PAUSED → IN_PROGRESS

Resumes a paused rounding session. Clears the `pausedAt` timestamp.

**Path Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| roundId   | uuid | Round UUID  |

**Response (200 OK)**

```json
{
  "id": "round-uuid",
  "roundNumber": "R2025122901",
  "floorId": "floor-uuid",
  "roundType": "MORNING",
  "scheduledDate": "2025-12-29",
  "scheduledTime": "09:00:00",
  "status": "IN_PROGRESS",
  "startedAt": "2025-12-29T09:05:00Z",
  "completedAt": null,
  "pausedAt": null,
  "leadDoctorId": "doctor-uuid",
  "validTransitions": ["PAUSED", "COMPLETED"]
}
```

**Error Responses**

| HTTP | Code                     | Description                       |
| ---- | ------------------------ | --------------------------------- |
| 400  | INVALID_STATE_TRANSITION | Round is not in PAUSED status     |
| 404  | ROUND_NOT_FOUND          | Round with specified ID not found |

### 7.7 Complete Rounding

```http
POST /api/v1/rounds/{roundId}/complete
```

**State Transition**: IN_PROGRESS/PAUSED → COMPLETED

Marks the rounding session as successfully completed. This is a terminal state - no further transitions are allowed. Sets the `completedAt` timestamp.

**Path Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| roundId   | uuid | Round UUID  |

**Response (200 OK)**

```json
{
  "id": "round-uuid",
  "roundNumber": "R2025122901",
  "floorId": "floor-uuid",
  "roundType": "MORNING",
  "scheduledDate": "2025-12-29",
  "scheduledTime": "09:00:00",
  "status": "COMPLETED",
  "startedAt": "2025-12-29T09:05:00Z",
  "completedAt": "2025-12-29T10:30:00Z",
  "pausedAt": null,
  "leadDoctorId": "doctor-uuid",
  "validTransitions": []
}
```

**Error Responses**

| HTTP | Code                     | Description                                  |
| ---- | ------------------------ | -------------------------------------------- |
| 400  | INVALID_STATE_TRANSITION | Round is not in IN_PROGRESS or PAUSED status |
| 404  | ROUND_NOT_FOUND          | Round with specified ID not found            |

### 7.8 Cancel Rounding

```http
POST /api/v1/rounds/{roundId}/cancel
```

**State Transition**: PLANNED/PAUSED → CANCELLED

Cancels a rounding session that has not yet been completed. Can only be performed from PLANNED or PAUSED states. This is a terminal state - no further transitions are allowed.

**Path Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| roundId   | uuid | Round UUID  |

**Response (200 OK)**

```json
{
  "id": "round-uuid",
  "roundNumber": "R2025122901",
  "floorId": "floor-uuid",
  "roundType": "MORNING",
  "scheduledDate": "2025-12-29",
  "scheduledTime": "09:00:00",
  "status": "CANCELLED",
  "startedAt": null,
  "completedAt": null,
  "pausedAt": null,
  "leadDoctorId": "doctor-uuid",
  "validTransitions": []
}
```

**Error Responses**

| HTTP | Code                     | Description                                      |
| ---- | ------------------------ | ------------------------------------------------ |
| 400  | INVALID_STATE_TRANSITION | Round is not in PLANNED or PAUSED status         |
| 400  | INVALID_STATE_TRANSITION | Cannot cancel an IN_PROGRESS round (pause first) |
| 404  | ROUND_NOT_FOUND          | Round with specified ID not found                |

### 7.9 Get Rounding Patient List (Tablet-Optimized)

```http
GET /api/v1/rounds/{roundId}/patients
```

**Response (200 OK)**

```json
{
  "roundId": "round-uuid",
  "roundNumber": "R2025122901",
  "patients": [
    {
      "admissionId": "admission-uuid",
      "patient": {
        "id": "patient-uuid",
        "patientNumber": "P2025000001",
        "name": "Hong Gildong",
        "age": 65,
        "gender": "MALE",
        "birthDate": "1960-05-15"
      },
      "bed": {
        "id": "bed-uuid",
        "roomNumber": "301",
        "bedNumber": "A",
        "roomName": "Internal Medicine 301"
      },
      "admission": {
        "diagnosis": "Pneumonia",
        "admissionDate": "2025-12-25",
        "admissionDays": 4
      },
      "latestVitals": {
        "temperature": 36.8,
        "bloodPressure": "120/80",
        "pulseRate": 72,
        "oxygenSaturation": 98,
        "hasAlert": false,
        "measuredAt": "2025-12-29T08:00:00Z"
      },
      "previousRoundNote": "Patient improving",
      "existingRecordId": null,
      "isVisited": false
    }
  ],
  "totalPatients": 12,
  "visitedCount": 5,
  "progress": 42
}
```

### 7.10 Add Rounding Record

```http
POST /api/v1/rounds/{roundId}/records
```

**Request**

```json
{
  "admissionId": "admission-uuid",
  "patientStatus": "STABLE",
  "chiefComplaint": "No specific complaints",
  "observation": "V/S stable, meal intake good",
  "assessment": "Improving",
  "plan": "Continue current treatment",
  "orders": "Vital check QID"
}
```

**Response (201 Created)**

```json
{
  "id": "record-uuid",
  "roundId": "round-uuid",
  "admissionId": "admission-uuid",
  "visitOrder": 1,
  "patientStatus": "STABLE",
  "observation": "V/S stable, meal intake good",
  "visitedAt": "2025-12-29T09:15:00Z",
  "recordedBy": "doctor-uuid"
}
```

### 7.11 Update Rounding Record

```http
PATCH /api/v1/rounds/{roundId}/records/{recordId}
```

**Request**

```json
{
  "patientStatus": "IMPROVING",
  "plan": "Updated treatment plan"
}
```

### 7.12 State Machine

#### State Definitions

| State       | Description                                            | Terminal |
| ----------- | ------------------------------------------------------ | -------- |
| PLANNED     | Session created and scheduled but not yet started      | No       |
| IN_PROGRESS | Session is actively in progress                        | No       |
| PAUSED      | Session temporarily paused (e.g., emergency interrupt) | No       |
| COMPLETED   | Session finished successfully                          | Yes      |
| CANCELLED   | Session cancelled before completion                    | Yes      |

#### State Transition Diagram

```
                     ┌──────────────────────────────────────────────────────────────┐
                     │                                                               │
    ┌────────────┐   │  start        ┌─────────────┐                               │
    │  PLANNED   │───┼──────────────>│ IN_PROGRESS │                               │
    └─────┬──────┘   │               └──────┬──────┘                               │
          │          │                      │                                       │
          │ cancel   │    ┌─────────────────┼─────────────────┐                    │
          │          │    │ pause           │ complete        │                    │
          │          │    ▼                 │                 │                    │
          │          │  ┌──────────┐        │                 │                    │
          │          │  │  PAUSED  │        │                 │                    │
          │          │  └────┬─────┘        │                 │                    │
          │          │       │              │                 │                    │
          │          │       ├── resume ────┘                 │                    │
          │          │       │                                │                    │
          │          │       │ complete                       │                    │
          │          │       │                                │                    │
          ▼          │       │ cancel                         ▼                    │
    ┌────────────┐   │       │                          ┌───────────┐             │
    │ CANCELLED  │<──┼───────┘                          │ COMPLETED │             │
    └────────────┘   │                                  └───────────┘             │
                     │                                                             │
                     └─────────────────────────────────────────────────────────────┘
```

#### Transition Matrix

| From / To   | PLANNED | IN_PROGRESS | PAUSED | COMPLETED | CANCELLED |
| ----------- | ------- | ----------- | ------ | --------- | --------- |
| PLANNED     | -       | start       | -      | -         | cancel    |
| IN_PROGRESS | -       | -           | pause  | complete  | -         |
| PAUSED      | -       | resume      | -      | complete  | cancel    |
| COMPLETED   | -       | -           | -      | -         | -         |
| CANCELLED   | -       | -           | -      | -         | -         |

#### Timestamp Behavior

| Transition            | Timestamp Updated            |
| --------------------- | ---------------------------- |
| PLANNED → IN_PROGRESS | `startedAt` = current time   |
| IN_PROGRESS → PAUSED  | `pausedAt` = current time    |
| PAUSED → IN_PROGRESS  | `pausedAt` = null            |
| \* → COMPLETED        | `completedAt` = current time |
| \* → CANCELLED        | No timestamp change          |

#### WebSocket Events

State transitions emit WebSocket events for real-time updates:

| Event             | Trigger           | Payload                            |
| ----------------- | ----------------- | ---------------------------------- |
| `round:started`   | start transition  | `{ roundId, status, startedAt }`   |
| `round:paused`    | pause transition  | `{ roundId, status, pausedAt }`    |
| `round:resumed`   | resume transition | `{ roundId, status }`              |
| `round:completed` | complete          | `{ roundId, status, completedAt }` |
| `round:cancelled` | cancel            | `{ roundId, status }`              |

---

## 8. Admin API

### 8.1 User Management

#### 8.1.1 List Users

```http
GET /api/v1/admin/users
```

**Query Parameters**

| Parameter  | Type    | Required | Description                            |
| ---------- | ------- | -------- | -------------------------------------- |
| search     | string  | No       | Search by name, username, employee ID  |
| department | string  | No       | Filter by department                   |
| isActive   | boolean | No       | Filter by active status                |
| roleId     | uuid    | No       | Filter by role ID                      |
| page       | number  | No       | Page number (default: 1)               |
| limit      | number  | No       | Items per page (default: 20, max: 100) |
| sortBy     | string  | No       | Sort field (name, username, createdAt) |
| sortOrder  | string  | No       | Sort order (asc, desc)                 |

**Response**

```json
{
  "data": [
    {
      "id": "user-uuid",
      "employeeId": "EMP2025001",
      "username": "nurse002",
      "name": "Park Nurse",
      "email": "nurse002@hospital.com",
      "phone": "010-1234-5678",
      "department": "Internal Medicine Ward",
      "position": "Nurse",
      "isActive": true,
      "lastLoginAt": "2025-01-15T10:30:00Z",
      "createdAt": "2025-01-01T09:00:00Z",
      "roles": [{ "id": "role-uuid", "code": "NURSE", "name": "Nurse" }]
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### 8.1.2 Get User

```http
GET /api/v1/admin/users/{userId}
```

#### 8.1.3 Create User

```http
POST /api/v1/admin/users
```

**Request**

```json
{
  "employeeId": "EMP2025001",
  "username": "nurse002",
  "name": "Park Nurse",
  "email": "nurse002@hospital.com",
  "phone": "010-1234-5678",
  "department": "Internal Medicine Ward",
  "position": "Nurse",
  "roleIds": ["role-uuid-1", "role-uuid-2"]
}
```

**Response** (includes temporary password)

```json
{
  "id": "user-uuid",
  "employeeId": "EMP2025001",
  "username": "nurse002",
  "name": "Park Nurse",
  "temporaryPassword": "T3mpP@ss123!",
  "roles": [{ "id": "role-uuid-1", "code": "NURSE", "name": "Nurse" }]
}
```

#### 8.1.4 Update User

```http
PATCH /api/v1/admin/users/{userId}
```

**Request**

```json
{
  "name": "Updated Name",
  "email": "updated@hospital.com",
  "department": "New Department",
  "isActive": true
}
```

#### 8.1.5 Deactivate User

```http
DELETE /api/v1/admin/users/{userId}
```

**Note**: This deactivates the user and destroys all their sessions.

#### 8.1.6 Reset User Password

```http
POST /api/v1/admin/users/{userId}/reset-password
```

**Response**

```json
{
  "temporaryPassword": "N3wT3mpP@ss!",
  "message": "Password has been reset. User must change password on next login."
}
```

#### 8.1.7 Assign Role to User

```http
POST /api/v1/admin/users/{userId}/roles
```

**Request**

```json
{
  "roleId": "role-uuid"
}
```

#### 8.1.8 Remove Role from User

```http
DELETE /api/v1/admin/users/{userId}/roles/{roleId}
```

### 8.2 Role Management

> **Required permission**: `ADMIN` role for all role management endpoints.

#### 8.2.1 List Roles

```http
GET /api/v1/admin/roles
```

**Response**

```json
[
  {
    "id": "role-uuid",
    "code": "ADMIN",
    "name": "Administrator",
    "description": "Full system access",
    "level": 1,
    "isActive": true
  },
  {
    "id": "role-uuid-2",
    "code": "DOCTOR",
    "name": "Doctor",
    "description": "Medical staff with patient access",
    "level": 3,
    "isActive": true
  }
]
```

#### 8.2.2 Get Role

```http
GET /api/v1/admin/roles/{roleId}
```

**Path Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| roleId    | uuid | Role ID     |

**Response**: Same shape as a single item in 8.2.1.

**Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Role not found`

#### 8.2.3 Create Role

```http
POST /api/v1/admin/roles
```

**Request**

```json
{
  "code": "PHARMACIST",
  "name": "Pharmacist",
  "description": "Pharmacy staff with medication access",
  "level": 4
}
```

| Field       | Type   | Required | Constraints                               |
| ----------- | ------ | -------- | ----------------------------------------- |
| code        | string | Yes      | Uppercase letters and underscores, max 50 |
| name        | string | Yes      | Display name, max 100 characters          |
| description | string | No       | Optional description                      |
| level       | number | No       | Hierarchy level 0–100 (default: 0)        |

**Response** `201 Created`

```json
{
  "id": "new-role-uuid",
  "code": "PHARMACIST",
  "name": "Pharmacist",
  "description": "Pharmacy staff with medication access",
  "level": 4,
  "isActive": true
}
```

**Error Responses**: `401 Unauthorized`, `403 Forbidden`, `409 Role code already exists`

#### 8.2.4 Update Role

```http
PATCH /api/v1/admin/roles/{roleId}
```

**Path Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| roleId    | uuid | Role ID     |

**Request** (all fields optional)

```json
{
  "name": "Senior Pharmacist",
  "description": "Updated description",
  "level": 3
}
```

**Response** `200 OK`: Updated role object (same shape as 8.2.1 item).

**Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Role not found`

#### 8.2.5 Delete Role

```http
DELETE /api/v1/admin/roles/{roleId}
```

**Path Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| roleId    | uuid | Role ID     |

**Response** `200 OK`

```json
{ "message": "Role deleted successfully" }
```

**Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Role not found`, `409 Role has assigned users`

#### 8.2.6 Get Role with Permissions

```http
GET /api/v1/admin/roles/{roleId}/permissions
```

**Path Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| roleId    | uuid | Role ID     |

**Response**

```json
{
  "id": "role-uuid",
  "code": "DOCTOR",
  "name": "Doctor",
  "description": "Medical staff with patient access",
  "level": 3,
  "isActive": true,
  "permissions": [
    {
      "id": "perm-uuid",
      "code": "patient:read",
      "resource": "patient",
      "action": "read",
      "description": "Read patient records"
    },
    {
      "id": "perm-uuid-2",
      "code": "patient:update",
      "resource": "patient",
      "action": "update",
      "description": "Update patient records"
    }
  ]
}
```

**Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Role not found`

#### 8.2.7 Add Permission to Role

```http
POST /api/v1/admin/roles/{roleId}/permissions
```

**Path Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| roleId    | uuid | Role ID     |

**Request**

```json
{ "permissionId": "perm-uuid" }
```

**Response** `201 Created`: Updated role with permissions (same shape as 8.2.6).

**Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Role or permission not found`, `409 Role already has this permission`

#### 8.2.8 Remove Permission from Role

```http
DELETE /api/v1/admin/roles/{roleId}/permissions/{permId}
```

**Path Parameters**

| Parameter | Type | Description   |
| --------- | ---- | ------------- |
| roleId    | uuid | Role ID       |
| permId    | uuid | Permission ID |

**Response** `200 OK`: Updated role with permissions (same shape as 8.2.6).

**Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Role or permission not found`

### 8.3 Audit Logs

> **Required permission**: `admin:audit` for all audit endpoints.

#### 8.3.1 Get Access Logs

```http
GET /api/v1/admin/audit/access-logs
```

**Query Parameters**

| Parameter    | Type     | Required | Description                                      |
| ------------ | -------- | -------- | ------------------------------------------------ |
| userId       | uuid     | No       | Filter by user ID                                |
| patientId    | uuid     | No       | Filter by patient ID                             |
| resourceType | string   | No       | Filter by resource type (e.g. `patient`, `room`) |
| resourceId   | uuid     | No       | Filter by specific resource ID                   |
| action       | string   | No       | `CREATE`, `READ`, `UPDATE`, or `DELETE`          |
| startDate    | datetime | No       | Start of date range (ISO 8601)                   |
| endDate      | datetime | No       | End of date range (ISO 8601)                     |
| page         | number   | No       | Page number (default: 1)                         |
| limit        | number   | No       | Items per page (default: 20, max: 100)           |

**Response**

```json
{
  "data": [
    {
      "id": "log-uuid",
      "userId": "user-uuid",
      "username": "dr.kim",
      "userRole": "DOCTOR",
      "ipAddress": "192.168.1.10",
      "resourceType": "patient",
      "resourceId": "patient-uuid",
      "action": "READ",
      "requestPath": "/api/v1/patients/patient-uuid",
      "requestMethod": "GET",
      "patientId": "patient-uuid",
      "accessedFields": ["name", "birthDate", "medicalHistory"],
      "success": true,
      "errorCode": null,
      "errorMessage": null,
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20,
  "totalPages": 25
}
```

#### 8.3.2 Get Login History

```http
GET /api/v1/admin/audit/login-history
```

**Query Parameters**

| Parameter | Type     | Required | Description                              |
| --------- | -------- | -------- | ---------------------------------------- |
| userId    | uuid     | No       | Filter by user ID                        |
| username  | string   | No       | Filter by username                       |
| ipAddress | string   | No       | Filter by IP address                     |
| success   | boolean  | No       | Filter by login success (`true`/`false`) |
| startDate | datetime | No       | Start of date range (ISO 8601)           |
| endDate   | datetime | No       | End of date range (ISO 8601)             |
| page      | number   | No       | Page number (default: 1)                 |
| limit     | number   | No       | Items per page (default: 20, max: 100)   |

**Response**

```json
{
  "data": [
    {
      "id": "login-uuid",
      "userId": "user-uuid",
      "username": "dr.kim",
      "ipAddress": "192.168.1.10",
      "userAgent": "Mozilla/5.0 ...",
      "deviceType": "PC",
      "browser": "Chrome",
      "os": "Windows",
      "loginAt": "2026-01-15T09:00:00Z",
      "logoutAt": "2026-01-15T17:00:00Z",
      "sessionId": "session-uuid",
      "success": true,
      "failureReason": null
    }
  ],
  "total": 1000,
  "page": 1,
  "limit": 20,
  "totalPages": 50
}
```

#### 8.3.3 Get Change Logs

```http
GET /api/v1/admin/audit/change-logs
```

**Query Parameters**

| Parameter   | Type     | Required | Description                             |
| ----------- | -------- | -------- | --------------------------------------- |
| userId      | uuid     | No       | Filter by user ID                       |
| tableSchema | string   | No       | Filter by database schema               |
| tableName   | string   | No       | Filter by table name                    |
| recordId    | uuid     | No       | Filter by specific record ID            |
| action      | string   | No       | `CREATE`, `READ`, `UPDATE`, or `DELETE` |
| startDate   | datetime | No       | Start of date range (ISO 8601)          |
| endDate     | datetime | No       | End of date range (ISO 8601)            |
| page        | number   | No       | Page number (default: 1)                |
| limit       | number   | No       | Items per page (default: 20, max: 100)  |

**Response**

```json
{
  "data": [
    {
      "id": "change-uuid",
      "userId": "user-uuid",
      "username": "admin",
      "ipAddress": "192.168.1.1",
      "tableSchema": "patient",
      "tableName": "patients",
      "recordId": "patient-uuid",
      "action": "UPDATE",
      "oldValues": { "name": "Old Name" },
      "newValues": { "name": "New Name" },
      "changedFields": ["name"],
      "changeReason": null,
      "createdAt": "2026-01-15T11:00:00Z"
    }
  ],
  "total": 200,
  "page": 1,
  "limit": 20,
  "totalPages": 10
}
```

#### 8.3.4 Get Patient Access Report

```http
GET /api/v1/admin/audit/patients/{patientId}/access-report
```

**Path Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| patientId | uuid | Patient ID  |

**Query Parameters**

| Parameter | Type     | Required | Description                    |
| --------- | -------- | -------- | ------------------------------ |
| startDate | datetime | Yes      | Start of date range (ISO 8601) |
| endDate   | datetime | Yes      | End of date range (ISO 8601)   |

**Response**

```json
{
  "patientId": "patient-uuid",
  "dateRange": {
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2026-01-31T23:59:59Z"
  },
  "totalAccess": 42,
  "accessByUser": [
    { "userId": "user-uuid-1", "username": "dr.kim", "accessCount": 20 },
    { "userId": "user-uuid-2", "username": "nurse.park", "accessCount": 22 }
  ],
  "accessByType": [
    { "action": "READ", "count": 38 },
    { "action": "UPDATE", "count": 4 }
  ],
  "timeline": [
    {
      "userId": "user-uuid-1",
      "username": "dr.kim",
      "action": "READ",
      "accessedFields": ["name", "medicalHistory"],
      "timestamp": "2026-01-15T10:30:00Z"
    }
  ]
}
```

**Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Patient not found`

#### 8.3.5 Get User Activity Report

```http
GET /api/v1/admin/audit/users/{userId}/activity-report
```

**Path Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| userId    | uuid | User ID     |

**Query Parameters**

| Parameter | Type     | Required | Description                    |
| --------- | -------- | -------- | ------------------------------ |
| startDate | datetime | Yes      | Start of date range (ISO 8601) |
| endDate   | datetime | Yes      | End of date range (ISO 8601)   |

**Response**: Aggregated activity summary for the user over the specified date range (resource access counts, action breakdown, and timeline).

**Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 User not found`

#### 8.3.6 Get Suspicious Activity

```http
GET /api/v1/admin/audit/security/suspicious-activity
```

Returns IP addresses with multiple failed login attempts within the specified date range.

**Query Parameters**

| Parameter | Type     | Required | Description                    |
| --------- | -------- | -------- | ------------------------------ |
| startDate | datetime | Yes      | Start of date range (ISO 8601) |
| endDate   | datetime | Yes      | End of date range (ISO 8601)   |

**Response**

```json
[
  {
    "ipAddress": "203.0.113.42",
    "failedAttempts": 15,
    "usernames": ["admin", "dr.kim", "root"]
  }
]
```

**Error Responses**: `401 Unauthorized`, `403 Forbidden`

#### 8.3.7 Get Failed Login Attempts

```http
GET /api/v1/admin/audit/security/failed-logins
```

Returns all failed login attempts within the specified date range (paginated).

**Query Parameters**

| Parameter | Type     | Required | Description                    |
| --------- | -------- | -------- | ------------------------------ |
| startDate | datetime | Yes      | Start of date range (ISO 8601) |
| endDate   | datetime | Yes      | End of date range (ISO 8601)   |

**Response**: Paginated list of `LoginHistoryResponseDto` items with `success: false`. Same shape as 8.3.2 response.

**Error Responses**: `401 Unauthorized`, `403 Forbidden`

---

## 9. WebSocket API (Real-time Updates)

### 9.1 Connection

```javascript
// Client connection
const socket = io('wss://api.hospital-erp.com', {
  auth: {
    token: 'Bearer <access_token>',
  },
});
```

### 9.2 Events

| Event                  | Direction       | Description          |
| ---------------------- | --------------- | -------------------- |
| `room:status`          | Server → Client | Room status change   |
| `admission:created`    | Server → Client | New admission        |
| `admission:discharged` | Server → Client | Discharge processed  |
| `vital:recorded`       | Server → Client | Vital signs recorded |
| `round:started`        | Server → Client | Rounding started     |
| `subscribe:floor`      | Client → Server | Subscribe to floor   |

### 9.3 Event Payload Examples

```javascript
// room:status event
{
  "event": "room:status",
  "data": {
    "roomId": "room-uuid",
    "roomNumber": "301",
    "status": "OCCUPIED",
    "beds": [
      { "bedId": "bed-1", "status": "OCCUPIED" },
      { "bedId": "bed-2", "status": "OCCUPIED" }
    ]
  },
  "timestamp": "2025-12-29T10:30:00Z"
}
```

---

## 10. Health Check API

Health check endpoints for Kubernetes probes and infrastructure monitoring. These endpoints do not require authentication.

### 10.1 Full Health Check

```http
GET /health
```

Performs a comprehensive health check including all dependencies (database, etc.).

**Authentication**: Not required

**Response (200 OK)**

```json
{
  "status": "ok",
  "timestamp": "2025-12-29T10:30:00.000Z",
  "uptime": 86400.123,
  "checks": {
    "database": "ok"
  }
}
```

**Response (503 Service Unavailable)**

```json
{
  "status": "error",
  "timestamp": "2025-12-29T10:30:00.000Z",
  "uptime": 86400.123,
  "checks": {
    "database": "error"
  }
}
```

**Response Fields**

| Field           | Type   | Description                             |
| --------------- | ------ | --------------------------------------- |
| status          | string | Overall health status (`ok` or `error`) |
| timestamp       | string | ISO 8601 timestamp of the check         |
| uptime          | number | Server uptime in seconds                |
| checks          | object | Individual component health statuses    |
| checks.database | string | Database connection status              |

### 10.2 Liveness Probe

```http
GET /health/live
```

Kubernetes liveness probe endpoint. Returns immediately without checking dependencies. Used to determine if the application process is running and should not be restarted.

**Authentication**: Not required

**Response (200 OK)**

```json
{
  "status": "ok",
  "timestamp": "2025-12-29T10:30:00.000Z"
}
```

**Response Fields**

| Field     | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| status    | string | Always `ok` if process is alive |
| timestamp | string | ISO 8601 timestamp of the check |

**Usage Notes**

- This endpoint always returns 200 OK if the application is running
- No external dependencies are checked
- Suitable for Kubernetes `livenessProbe` configuration

### 10.3 Readiness Probe

```http
GET /health/ready
```

Kubernetes readiness probe endpoint. Checks if the application is ready to accept traffic by verifying all dependencies.

**Authentication**: Not required

**Response (200 OK)**

```json
{
  "status": "ok",
  "timestamp": "2025-12-29T10:30:00.000Z",
  "uptime": 86400.123,
  "checks": {
    "database": "ok"
  }
}
```

**Response (503 Service Unavailable)**

Returns the same structure as `/health` with `status: "error"` when dependencies are unavailable.

**Usage Notes**

- Returns 503 if database is not connected
- Kubernetes will stop routing traffic to this pod until it returns 200
- Suitable for Kubernetes `readinessProbe` configuration

### 10.4 Kubernetes Configuration Example

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hospital-erp-backend
spec:
  containers:
    - name: backend
      image: hospital-erp-backend:latest
      ports:
        - containerPort: 3000
      livenessProbe:
        httpGet:
          path: /health/live
          port: 3000
        initialDelaySeconds: 10
        periodSeconds: 15
        timeoutSeconds: 5
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 10
        timeoutSeconds: 5
        failureThreshold: 3
```

**Probe Configuration Guidelines**

| Parameter           | Liveness Probe | Readiness Probe | Description                        |
| ------------------- | -------------- | --------------- | ---------------------------------- |
| initialDelaySeconds | 10             | 5               | Wait before first probe            |
| periodSeconds       | 15             | 10              | Interval between probes            |
| timeoutSeconds      | 5              | 5               | Timeout for each probe             |
| failureThreshold    | 3              | 3               | Consecutive failures before action |

---

## 11. Error Code Definitions

### 11.1 Authentication Related

| Code                          | Message                      | HTTP |
| ----------------------------- | ---------------------------- | ---- |
| AUTH_INVALID_CREDENTIALS      | Invalid username or password | 401  |
| AUTH_TOKEN_EXPIRED            | Token has expired            | 401  |
| AUTH_TOKEN_INVALID            | Invalid token                | 401  |
| AUTH_INSUFFICIENT_PERMISSIONS | Insufficient permissions     | 403  |

### 11.2 Patient Related

| Code                         | Message                           | HTTP |
| ---------------------------- | --------------------------------- | ---- |
| PATIENT_NOT_FOUND            | Patient not found                 | 404  |
| PATIENT_ALREADY_EXISTS       | Patient number already registered | 409  |
| PATIENT_HAS_ACTIVE_ADMISSION | Patient is currently admitted     | 409  |

### 11.3 Room Related

| Code                 | Message                 | HTTP |
| -------------------- | ----------------------- | ---- |
| ROOM_NOT_FOUND       | Room not found          | 404  |
| BED_NOT_AVAILABLE    | Bed is not available    | 409  |
| BED_ALREADY_OCCUPIED | Bed is already occupied | 409  |

### 11.4 Admission Related

| Code                         | Message                         | HTTP |
| ---------------------------- | ------------------------------- | ---- |
| ADMISSION_NOT_FOUND          | Admission record not found      | 404  |
| ADMISSION_ALREADY_DISCHARGED | Patient already discharged      | 409  |
| TRANSFER_SAME_BED            | Cannot transfer to the same bed | 400  |

### 11.5 Legacy System Related

| Code                      | Message                              | HTTP |
| ------------------------- | ------------------------------------ | ---- |
| LEGACY_PATIENT_NOT_FOUND  | Patient not found in legacy system   | 404  |
| PATIENT_ALREADY_IMPORTED  | Patient already imported from legacy | 409  |
| LEGACY_SYSTEM_UNAVAILABLE | Legacy system connection failed      | 503  |

### 11.6 Rounding Related

| Code                     | Message                                      | HTTP |
| ------------------------ | -------------------------------------------- | ---- |
| ROUND_NOT_FOUND          | Rounding session not found                   | 404  |
| ROUND_RECORD_NOT_FOUND   | Rounding record not found                    | 404  |
| INVALID_STATE_TRANSITION | Invalid state transition from {from} to {to} | 400  |
| ROUND_ALREADY_STARTED    | Rounding session has already been started    | 409  |
| ROUND_ALREADY_COMPLETED  | Rounding session has already been completed  | 409  |
| ROUND_ALREADY_CANCELLED  | Rounding session has already been cancelled  | 409  |

**State Transition Error Details**

When an invalid state transition is attempted, the error response includes details about the current state and valid transitions:

```json
{
  "statusCode": 400,
  "timestamp": "2025-12-29T10:30:00Z",
  "path": "/api/v1/rounds/round-uuid/start",
  "method": "POST",
  "message": "Invalid state transition from IN_PROGRESS to IN_PROGRESS",
  "details": {
    "currentState": "IN_PROGRESS",
    "attemptedState": "IN_PROGRESS",
    "validTransitions": ["PAUSED", "COMPLETED"]
  }
}
```

---

## Appendix: OpenAPI 3.0 Spec (Partial)

```yaml
openapi: 3.0.3
info:
  title: Inpatient Management ERP API
  version: 1.0.0
  description: RESTful API for Inpatient Management

servers:
  - url: https://api.hospital-erp.com/api/v1
    description: Production

security:
  - bearerAuth: []

paths:
  /patients:
    get:
      summary: List Patients
      tags: [Patients]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: search
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PatientListResponse'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Patient:
      type: object
      properties:
        id:
          type: string
          format: uuid
        patientNumber:
          type: string
        name:
          type: string
        birthDate:
          type: string
          format: date
        gender:
          type: string
          enum: [MALE, FEMALE, OTHER]
```

---

## 12. Enum Reference

This section provides a single source of truth for all valid enum values used in API requests and responses. All values must match the Prisma schema definitions exactly.

### 12.1 Gender

| Value    | Description |
| -------- | ----------- |
| `MALE`   | Male        |
| `FEMALE` | Female      |
| `OTHER`  | Other       |

### 12.2 RoomType

| Value            | Description                  |
| ---------------- | ---------------------------- |
| `WARD`           | General ward                 |
| `ICU`            | Intensive Care Unit          |
| `ISOLATION`      | Isolation room               |
| `VIP`            | VIP room                     |
| `EMERGENCY`      | Emergency room               |
| `RECOVERY`       | Recovery room                |
| `NICU`           | Neonatal Intensive Care Unit |
| `PEDIATRIC`      | Pediatric ward               |
| `LABOR_DELIVERY` | Labor and delivery room      |
| `OPERATING`      | Operating room               |

### 12.3 BedStatus

| Value         | Description                   |
| ------------- | ----------------------------- |
| `EMPTY`       | Bed is unoccupied             |
| `OCCUPIED`    | Bed is currently occupied     |
| `RESERVED`    | Bed is reserved for a patient |
| `MAINTENANCE` | Bed is under maintenance      |
