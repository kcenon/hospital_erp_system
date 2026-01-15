# API Specification

## Document Information

| Item             | Content                           |
| ---------------- | --------------------------------- |
| Document Version | 0.1.0.0                           |
| Created Date     | 2025-12-29                        |
| Owner            | kcenon@naver.com                  |
| API Version      | v1                                |
| Base URL         | `https://api.hospital-erp.com/v1` |

---

## 1. API Overview

### 1.1 Design Principles

| Principle         | Description                                      |
| ----------------- | ------------------------------------------------ |
| **RESTful**       | Resource-centric design, HTTP method utilization |
| **JSON**          | Request/response body in JSON format             |
| **Versioning**    | Version included in URL path (/v1/)              |
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

#### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-12-29T10:30:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### List Response (Pagination)

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    },
    "timestamp": "2025-12-29T10:30:00Z"
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient not found.",
    "details": {
      "patientId": "invalid-uuid"
    }
  },
  "meta": {
    "timestamp": "2025-12-29T10:30:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
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
  "success": true,
  "data": {
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
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
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
  "success": true,
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
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
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
  "success": true,
  "data": {
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
{
  "success": true,
  "data": [
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
}
```

#### 3.5.2 Get Legacy Patient Details

```http
GET /patients/legacy/{legacyId}
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
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
}
```

#### 3.5.3 Get Medical History from Legacy

```http
GET /patients/legacy/{legacyId}/medical-history
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
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
}
```

#### 3.5.4 Import Patient from Legacy System

```http
POST /patients/legacy/{legacyId}/import
```

**Response (201 Created)**

```json
{
  "success": true,
  "data": {
    "id": "new-patient-uuid",
    "patientNumber": "P2025001234",
    "name": "John Doe",
    "birthDate": "1990-05-15",
    "gender": "MALE",
    "legacyPatientId": "L2020001234"
  }
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
  "success": true,
  "data": {
    "connected": true
  }
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
{
  "success": true,
  "data": [
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
}
```

### 4.2 Floor Room Dashboard

```http
GET /rooms/dashboard/floor/{floorId}
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
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
  "success": true,
  "data": {
    "id": "admission-uuid",
    "admissionNumber": "A2025123456",
    "patient": { ... },
    "bed": { ... },
    "status": "ACTIVE",
    "createdAt": "2025-12-29T14:30:00Z"
  }
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
  "success": true,
  "data": {
    "id": "admission-uuid",
    "admissionNumber": "A2025123456",
    "patient": { ... },
    "bed": { ... },
    "status": "ACTIVE",
    "transfers": [ ... ],
    "discharge": null
  }
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
{
  "success": true,
  "data": [
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
}
```

---

## 6. Reports and Logs API

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
{
  "success": true,
  "data": [
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
}
```

### 6.3 Create Daily Report

```http
POST /admissions/{admissionId}/daily-reports
```

**Request**

```json
{
  "reportDate": "2025-12-29",
  "generalCondition": "GOOD",
  "consciousnessLevel": "ALERT",
  "painLevel": 2,
  "sleepQuality": "GOOD",
  "mobilityStatus": "ASSISTED",
  "mealIntakeRate": 80,
  "dietType": "REGULAR",
  "bowelMovement": true,
  "urinationStatus": "NORMAL",
  "notes": "Overall condition good"
}
```

### 6.4 Get Daily Reports

```http
GET /admissions/{admissionId}/daily-reports
```

### 6.5 Record I/O (Intake/Output)

```http
POST /admissions/{admissionId}/intake-outputs
```

**Request**

```json
{
  "recordDate": "2025-12-29",
  "recordTime": "08:00",
  "oralIntake": 200,
  "ivIntake": 500,
  "urineOutput": 300,
  "notes": ""
}
```

### 6.6 Record Medication

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
  "administeredAt": "2025-12-29T08:05:00Z",
  "status": "ADMINISTERED",
  "orderedBy": "doctor-uuid",
  "notes": ""
}
```

### 6.7 Create Nursing Note

```http
POST /admissions/{admissionId}/nursing-notes
```

**Request**

```json
{
  "noteDatetime": "2025-12-29T10:30:00Z",
  "category": "ASSESSMENT",
  "priority": "NORMAL",
  "subjective": "Complains of headache",
  "objective": "V/S stable, conscious and alert",
  "assessment": "Mild headache, vital signs within normal range",
  "plan": "Observe, consider PRN analgesic"
}
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
  "roundDate": "2025-12-29",
  "roundType": "MORNING",
  "floorId": "floor-uuid",
  "leadDoctorId": "doctor-uuid"
}
```

### 7.2 List Rounding Sessions

```http
GET /rounds
```

**Query Parameters**

| Parameter | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| roundDate | date   | Rounding date                   |
| floorId   | uuid   | Floor filter                    |
| status    | string | PLANNED, IN_PROGRESS, COMPLETED |

### 7.3 Start Rounding

```http
POST /rounds/{roundId}/start
```

### 7.4 Add Rounding Record

```http
POST /rounds/{roundId}/records
```

**Request**

```json
{
  "admissionId": "admission-uuid",
  "visitOrder": 1,
  "patientStatus": "STABLE",
  "chiefComplaint": "No specific complaints",
  "observation": "V/S stable, meal intake good",
  "plan": "Continue current treatment",
  "orders": "Vital check QID"
}
```

### 7.5 Complete Rounding

```http
POST /rounds/{roundId}/complete
```

---

## 8. Admin API

### 8.1 List Users

```http
GET /admin/users
```

### 8.2 Create User

```http
POST /admin/users
```

**Request**

```json
{
  "employeeId": "EMP2025001",
  "username": "nurse002",
  "password": "InitialP@ss123",
  "name": "Park Nurse",
  "email": "nurse002@hospital.com",
  "phone": "010-1234-5678",
  "department": "Internal Medicine Ward",
  "position": "Nurse",
  "roles": ["NURSE"]
}
```

### 8.3 Update User

```http
PATCH /admin/users/{userId}
```

### 8.4 Deactivate User

```http
DELETE /admin/users/{userId}
```

### 8.5 Role Management

```http
GET /admin/roles
POST /admin/roles
PATCH /admin/roles/{roleId}
```

### 8.6 Get Access Logs

```http
GET /admin/audit/access-logs
```

**Query Parameters**

| Parameter    | Type     | Description    |
| ------------ | -------- | -------------- |
| userId       | uuid     | User filter    |
| resourceType | string   | Resource type  |
| action       | string   | Action         |
| fromDate     | datetime | Start datetime |
| toDate       | datetime | End datetime   |

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

## 10. Error Code Definitions

### 10.1 Authentication Related

| Code                          | Message                      | HTTP |
| ----------------------------- | ---------------------------- | ---- |
| AUTH_INVALID_CREDENTIALS      | Invalid username or password | 401  |
| AUTH_TOKEN_EXPIRED            | Token has expired            | 401  |
| AUTH_TOKEN_INVALID            | Invalid token                | 401  |
| AUTH_INSUFFICIENT_PERMISSIONS | Insufficient permissions     | 403  |

### 10.2 Patient Related

| Code                         | Message                           | HTTP |
| ---------------------------- | --------------------------------- | ---- |
| PATIENT_NOT_FOUND            | Patient not found                 | 404  |
| PATIENT_ALREADY_EXISTS       | Patient number already registered | 409  |
| PATIENT_HAS_ACTIVE_ADMISSION | Patient is currently admitted     | 409  |

### 10.3 Room Related

| Code                 | Message                 | HTTP |
| -------------------- | ----------------------- | ---- |
| ROOM_NOT_FOUND       | Room not found          | 404  |
| BED_NOT_AVAILABLE    | Bed is not available    | 409  |
| BED_ALREADY_OCCUPIED | Bed is already occupied | 409  |

### 10.4 Admission Related

| Code                         | Message                         | HTTP |
| ---------------------------- | ------------------------------- | ---- |
| ADMISSION_NOT_FOUND          | Admission record not found      | 404  |
| ADMISSION_ALREADY_DISCHARGED | Patient already discharged      | 409  |
| TRANSFER_SAME_BED            | Cannot transfer to the same bed | 400  |

### 10.5 Legacy System Related

| Code                      | Message                              | HTTP |
| ------------------------- | ------------------------------------ | ---- |
| LEGACY_PATIENT_NOT_FOUND  | Patient not found in legacy system   | 404  |
| PATIENT_ALREADY_IMPORTED  | Patient already imported from legacy | 409  |
| LEGACY_SYSTEM_UNAVAILABLE | Legacy system connection failed      | 503  |

---

## Appendix: OpenAPI 3.0 Spec (Partial)

```yaml
openapi: 3.0.3
info:
  title: Inpatient Management ERP API
  version: 1.0.0
  description: RESTful API for Inpatient Management

servers:
  - url: https://api.hospital-erp.com/v1
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
