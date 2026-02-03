# API Specification

## Document Information

| Item             | Content                        |
| ---------------- | ------------------------------ |
| Document Version | 0.5.0.0                        |
| Created Date     | 2025-12-29                     |
| Last Updated     | 2026-02-03                     |
| Owner            | kcenon@naver.com               |
| API Version      | 1.0                            |
| Base URL         | `https://api.hospital-erp.com` |

---

## 1. API Overview

### 1.1 Design Principles

| Principle         | Description                                      |
| ----------------- | ------------------------------------------------ |
| **RESTful**       | Resource-centric design, HTTP method utilization |
| **JSON**          | Request/response body in JSON format             |
| **Versioning**    | Single-version API (see Section 1.6)             |
| **Consistency**   | Unified naming conventions and response format   |
| **Documentation** | Auto-generated OpenAPI 3.0 (Swagger)             |

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
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067200
```

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
  "gender": "M",
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
  "path": "/patients/invalid-uuid",
  "method": "GET",
  "message": "Patient not found"
}
```

For validation errors (HTTP 400/422), the message may be an array:

```json
{
  "statusCode": 400,
  "timestamp": "2025-12-29T10:30:00Z",
  "path": "/patients",
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

This API uses a **single-version approach without URL path versioning**. All endpoints are accessed directly without a version prefix:

```
https://api.hospital-erp.com/patients
https://api.hospital-erp.com/admissions
https://api.hospital-erp.com/rounds
```

#### Rationale

The single-version approach was chosen for the initial release based on:

| Consideration       | Decision                                                  |
| ------------------- | --------------------------------------------------------- |
| **Simplicity**      | Reduces complexity for initial development and deployment |
| **Early Stage**     | No existing clients require backward compatibility        |
| **Rapid Iteration** | Allows faster feature development without version burden  |
| **Single Client**   | Primary consumer is the internal frontend application     |

#### Future Versioning Plan

When breaking changes become necessary, the following strategies will be considered:

| Strategy            | Format                | Pros             | Cons                         |
| ------------------- | --------------------- | ---------------- | ---------------------------- |
| **URL Path**        | `/v2/patients`        | Clear, cacheable | URL proliferation            |
| **Header**          | `Accept-Version: v2`  | Clean URLs       | Less visible, harder to test |
| **Query Parameter** | `/patients?version=2` | Flexible         | Not RESTful, cache issues    |

**Recommended**: URL path versioning will be adopted when version 2 is introduced:

```typescript
// NestJS implementation
app.setGlobalPrefix('v1'); // For version 1
app.setGlobalPrefix('v2'); // For version 2 (separate deployment)
```

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

---

## 2. Authentication API

### 2.1 Login

```http
POST /auth/login
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
POST /auth/refresh
```

**Request**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.3 Logout

```http
POST /auth/logout
```

**Request**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.4 Change Password

```http
POST /auth/change-password
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
GET /patients
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
      "gender": "M",
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
GET /patients/{patientId}
```

**Response (200 OK)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "patientNumber": "P2025001234",
  "name": "John Doe",
  "birthDate": "1990-05-15",
  "gender": "M",
  "bloodType": "A+",
  "phone": "010-1234-5678",
  "emergencyContact": "Jane Doe",
  "emergencyPhone": "010-9876-5432",
  "address": "123 Teheran-ro, Gangnam-gu, Seoul",
  "allergies": ["Penicillin"],
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
POST /patients
```

**Request**

```json
{
  "patientNumber": "P2025001234",
  "name": "John Doe",
  "birthDate": "1990-05-15",
  "gender": "M",
  "bloodType": "A+",
  "phone": "010-1234-5678",
  "emergencyContact": "Jane Doe",
  "emergencyPhone": "010-9876-5432",
  "address": "123 Teheran-ro, Gangnam-gu, Seoul",
  "allergies": ["Penicillin"]
}
```

### 3.4 Update Patient Information

```http
PATCH /patients/{patientId}
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
GET /patients/legacy/search
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
    "gender": "M",
    "ssn": "900515-1******",
    "phone": "010-****-5678",
    "bloodType": "A+",
    "insuranceType": "NATIONAL"
  }
]
```

#### 3.5.2 Get Legacy Patient Details

```http
GET /patients/legacy/{legacyId}
```

**Response (200 OK)**

```json
{
  "legacyId": "L2020001234",
  "name": "John Doe",
  "birthDate": "1990-05-15",
  "gender": "M",
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
GET /patients/legacy/{legacyId}/medical-history
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
POST /patients/legacy/{legacyId}/import
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
GET /patients/legacy/health
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
GET /rooms
```

**Query Parameters**

| Parameter  | Type    | Description                           |
| ---------- | ------- | ------------------------------------- |
| buildingId | uuid    | Building filter                       |
| floorId    | uuid    | Floor filter                          |
| status     | string  | Status (AVAILABLE, FULL, MAINTENANCE) |
| hasVacancy | boolean | Has vacant beds                       |

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
    "roomType": "DOUBLE",
    "capacity": 2,
    "currentCount": 1,
    "status": "AVAILABLE",
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
GET /rooms/dashboard/floor/{floorId}
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
      "status": "AVAILABLE",
      "beds": [...]
    }
  ],
  "updatedAt": "2025-12-29T10:30:00Z"
}
```

### 4.3 Get Available Beds

```http
GET /beds/available
```

**Query Parameters**

| Parameter | Type   | Description                       |
| --------- | ------ | --------------------------------- |
| floorId   | uuid   | Floor filter                      |
| roomType  | string | Room type (SINGLE, DOUBLE, MULTI) |

---

## 5. Admission Management API

### 5.1 Register Admission

```http
POST /admissions
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
GET /admissions/{admissionId}
```

### 5.3 List Admissions

```http
GET /admissions
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
POST /admissions/{admissionId}/transfer
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
POST /admissions/{admissionId}/discharge
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
GET /admissions/by-number/{admissionNumber}
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
GET /admissions/patient/{patientId}/active
```

Returns the currently active admission for a specific patient, or null if not admitted.

### 5.8 Get Admissions by Floor

```http
GET /admissions/floor/{floorId}
```

**Query Parameters**

| Parameter | Type   | Description                |
| --------- | ------ | -------------------------- |
| status    | string | Filter by admission status |

### 5.9 Get Transfer History

```http
GET /admissions/{admissionId}/transfers
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
POST /admissions/{admissionId}/vitals
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
GET /admissions/{admissionId}/vitals
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
GET /admissions/{admissionId}/daily-reports/{date}
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
POST /admissions/{admissionId}/daily-reports/{date}/generate
```

Generates or regenerates the daily report for the specified date by aggregating all available data.

**Response (201 Created)**

Same as Get Daily Report response.

#### 6.3.3 Get Live Daily Summary (Without Saving)

```http
GET /admissions/{admissionId}/daily-reports/{date}/summary
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
GET /admissions/{admissionId}/daily-reports
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
POST /admissions/{admissionId}/io
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
GET /admissions/{admissionId}/io
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
GET /admissions/{admissionId}/io/daily/{date}
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
GET /admissions/{admissionId}/io/balance
```

**Query Parameters**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| startDate | date | Start date  |
| endDate   | date | End date    |

### 6.6 Medication API

#### 6.6.1 Schedule Medication

```http
POST /admissions/{admissionId}/medications
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
POST /admissions/{admissionId}/medications/{medicationId}/administer
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
POST /admissions/{admissionId}/medications/{medicationId}/hold
```

**Request**

```json
{
  "reason": "Patient NPO for procedure"
}
```

#### 6.6.4 Refuse Medication

```http
POST /admissions/{admissionId}/medications/{medicationId}/refuse
```

**Request**

```json
{
  "reason": "Patient refused due to nausea"
}
```

#### 6.6.5 Get Scheduled Medications

```http
GET /admissions/{admissionId}/medications/scheduled/{date}
```

#### 6.6.6 Get Medication History

```http
GET /admissions/{admissionId}/medications
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
POST /admissions/{admissionId}/notes
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
GET /admissions/{admissionId}/notes
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
GET /admissions/{admissionId}/notes/significant
```

#### 6.7.4 Get Latest Note

```http
GET /admissions/{admissionId}/notes/latest
```

---

## 7. Rounding API

### 7.1 Create Rounding Session

```http
POST /rounds
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
GET /rounds
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

### 7.3 Get Round Detail

```http
GET /rounds/{roundId}
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
POST /rounds/{roundId}/start
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
POST /rounds/{roundId}/pause
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
POST /rounds/{roundId}/resume
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
POST /rounds/{roundId}/complete
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
POST /rounds/{roundId}/cancel
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
GET /rounds/{roundId}/patients
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
POST /rounds/{roundId}/records
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
PATCH /rounds/{roundId}/records/{recordId}
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
GET /admin/users
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
GET /admin/users/{userId}
```

#### 8.1.3 Create User

```http
POST /admin/users
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
PATCH /admin/users/{userId}
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
DELETE /admin/users/{userId}
```

**Note**: This deactivates the user and destroys all their sessions.

#### 8.1.6 Reset User Password

```http
POST /admin/users/{userId}/reset-password
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
POST /admin/users/{userId}/roles
```

**Request**

```json
{
  "roleId": "role-uuid"
}
```

#### 8.1.8 Remove Role from User

```http
DELETE /admin/users/{userId}/roles/{roleId}
```

### 8.2 Role Management

#### 8.2.1 List Roles

```http
GET /admin/roles
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
GET /admin/roles/{roleId}
```

#### 8.2.3 Get Role with Permissions

```http
GET /admin/roles/{roleId}/permissions
```

**Response**

```json
{
  "id": "role-uuid",
  "code": "DOCTOR",
  "name": "Doctor",
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

### 8.3 Audit Logs

#### 8.3.1 Get Access Logs

```http
GET /admin/audit/access-logs
```

**Query Parameters**

| Parameter    | Type     | Description    |
| ------------ | -------- | -------------- |
| userId       | uuid     | User filter    |
| resourceType | string   | Resource type  |
| action       | string   | Action         |
| startDate    | datetime | Start datetime |
| endDate      | datetime | End datetime   |

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
    "status": "FULL",
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
  "path": "/rounds/round-uuid/start",
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
  - url: https://api.hospital-erp.com
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
          enum: [M, F]
```
