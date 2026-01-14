# API 명세서

## 문서 정보

| 항목      | 내용                              |
| --------- | --------------------------------- |
| 문서 버전 | 0.1.0.0                           |
| 작성일    | 2025-12-29                        |
| 관리자    | kcenon@naver.com                  |
| API 버전  | v1                                |
| 기본 URL  | `https://api.hospital-erp.com/v1` |

---

## 1. API 개요

### 1.1 설계 원칙

| 원칙          | 설명                               |
| ------------- | ---------------------------------- |
| **RESTful**   | 리소스 중심 설계, HTTP 메서드 활용 |
| **JSON**      | 요청/응답 본문은 JSON 형식         |
| **버전 관리** | URL 경로에 버전 포함 (/v1/)        |
| **일관성**    | 명명 규칙, 응답 형식 통일          |
| **문서화**    | OpenAPI 3.0 (Swagger) 자동 생성    |

### 1.2 공통 헤더

```http
# 요청 헤더
Content-Type: application/json
Accept: application/json
Authorization: Bearer <access_token>
X-Request-ID: <uuid>           # 요청 추적용
X-Client-Version: 1.0.0        # 클라이언트 버전

# 응답 헤더
Content-Type: application/json
X-Request-ID: <uuid>
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067200
```

### 1.3 공통 응답 형식

#### 성공 응답

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

#### 목록 응답 (페이지네이션)

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

#### 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "환자를 찾을 수 없습니다.",
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

### 1.4 HTTP 상태 코드

| 코드 | 의미              | 사용 상황         |
| ---- | ----------------- | ----------------- |
| 200  | OK                | 성공 (조회, 수정) |
| 201  | Created           | 리소스 생성 성공  |
| 204  | No Content        | 삭제 성공         |
| 400  | Bad Request       | 잘못된 요청       |
| 401  | Unauthorized      | 인증 필요         |
| 403  | Forbidden         | 권한 없음         |
| 404  | Not Found         | 리소스 없음       |
| 409  | Conflict          | 충돌 (중복 등)    |
| 422  | Unprocessable     | 유효성 검증 실패  |
| 429  | Too Many Requests | 요청 제한 초과    |
| 500  | Internal Error    | 서버 오류         |

---

## 2. 인증 API

### 2.1 로그인

```http
POST /auth/login
```

**요청**

```json
{
  "username": "nurse001",
  "password": "SecureP@ss123"
}
```

**응답 (200 OK)**

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
      "name": "김간호",
      "department": "내과병동",
      "roles": ["NURSE"]
    }
  }
}
```

### 2.2 토큰 갱신

```http
POST /auth/refresh
```

**요청**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.3 로그아웃

```http
POST /auth/logout
```

**요청**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.4 비밀번호 변경

```http
POST /auth/change-password
```

**요청**

```json
{
  "currentPassword": "OldP@ss123",
  "newPassword": "NewSecureP@ss456"
}
```

**비밀번호 요구사항**

- 최소 8자 이상
- 대문자 1개 이상 포함
- 소문자 1개 이상 포함
- 숫자 1개 이상 포함
- 특수문자 1개 이상 포함

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

**에러 응답**

| HTTP | 코드                     | 설명                                 |
| ---- | ------------------------ | ------------------------------------ |
| 401  | AUTH_INVALID_CREDENTIALS | 현재 비밀번호가 올바르지 않음        |
| 403  | AUTH_SAME_PASSWORD       | 새 비밀번호가 현재 비밀번호와 동일함 |
| 422  | VALIDATION_FAILED        | 비밀번호가 요구사항을 충족하지 않음  |

---

## 3. 환자 관리 API

### 3.1 환자 목록 조회

```http
GET /patients
```

**쿼리 파라미터**

| 파라미터  | 타입    | 설명                             | 기본값 |
| --------- | ------- | -------------------------------- | ------ |
| page      | integer | 페이지 번호                      | 1      |
| limit     | integer | 페이지당 항목 수                 | 20     |
| search    | string  | 이름/환자번호 검색               | -      |
| status    | string  | 상태 필터 (ADMITTED, DISCHARGED) | -      |
| floorId   | uuid    | 층별 필터                        | -      |
| sortBy    | string  | 정렬 기준                        | name   |
| sortOrder | string  | 정렬 방향 (asc, desc)            | asc    |

**응답 (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "patientNumber": "P2025001234",
      "name": "홍길동",
      "birthDate": "1990-05-15",
      "gender": "M",
      "age": 34,
      "phone": "010-1234-5678",
      "currentAdmission": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "admissionDate": "2025-12-25",
        "roomNumber": "301",
        "bedNumber": "A",
        "diagnosis": "폐렴",
        "attendingDoctor": "이의사"
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

### 3.2 환자 상세 조회

```http
GET /patients/{patientId}
```

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "patientNumber": "P2025001234",
    "name": "홍길동",
    "birthDate": "1990-05-15",
    "gender": "M",
    "bloodType": "A+",
    "phone": "010-1234-5678",
    "emergencyContact": "홍부모",
    "emergencyPhone": "010-9876-5432",
    "address": "서울시 강남구 테헤란로 123",
    "allergies": ["페니실린"],
    "currentAdmission": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "admissionNumber": "A2025123456",
      "admissionDate": "2025-12-25",
      "admissionTime": "14:30",
      "diagnosis": "폐렴",
      "room": {
        "id": "room-uuid",
        "number": "301",
        "floor": "3층 내과병동"
      },
      "bed": {
        "id": "bed-uuid",
        "number": "A"
      },
      "attendingDoctor": {
        "id": "doctor-uuid",
        "name": "이의사"
      },
      "primaryNurse": {
        "id": "nurse-uuid",
        "name": "김간호"
      }
    },
    "admissionHistory": [
      {
        "id": "prev-admission-uuid",
        "admissionDate": "2024-06-10",
        "dischargeDate": "2024-06-20",
        "diagnosis": "급성 장염"
      }
    ]
  }
}
```

### 3.3 환자 등록

```http
POST /patients
```

**요청**

```json
{
  "patientNumber": "P2025001234",
  "name": "홍길동",
  "birthDate": "1990-05-15",
  "gender": "M",
  "bloodType": "A+",
  "phone": "010-1234-5678",
  "emergencyContact": "홍부모",
  "emergencyPhone": "010-9876-5432",
  "address": "서울시 강남구 테헤란로 123",
  "allergies": ["페니실린"]
}
```

### 3.4 환자 정보 수정

```http
PATCH /patients/{patientId}
```

**요청**

```json
{
  "phone": "010-1111-2222",
  "emergencyPhone": "010-3333-4444"
}
```

### 3.5 환자 검색 (기존 시스템 연동)

```http
GET /patients/search/legacy
```

**쿼리 파라미터**

| 파라미터        | 타입   | 설명                |
| --------------- | ------ | ------------------- |
| legacyPatientId | string | 기존 시스템 환자 ID |

---

## 4. 병실 관리 API

### 4.1 병실 현황 조회

```http
GET /rooms
```

**쿼리 파라미터**

| 파라미터   | 타입    | 설명                                |
| ---------- | ------- | ----------------------------------- |
| buildingId | uuid    | 건물 필터                           |
| floorId    | uuid    | 층 필터                             |
| status     | string  | 상태 (AVAILABLE, FULL, MAINTENANCE) |
| hasVacancy | boolean | 빈 병상 있음                        |

**응답 (200 OK)**

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
        "name": "3층 내과병동"
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
            "name": "홍길동",
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

### 4.2 층별 병실 현황판

```http
GET /rooms/dashboard/floor/{floorId}
```

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "floor": {
      "id": "floor-uuid",
      "number": 3,
      "name": "3층 내과병동",
      "building": "본관"
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

### 4.3 빈 병상 조회

```http
GET /beds/available
```

**쿼리 파라미터**

| 파라미터 | 타입   | 설명                              |
| -------- | ------ | --------------------------------- |
| floorId  | uuid   | 층 필터                           |
| roomType | string | 병실 유형 (SINGLE, DOUBLE, MULTI) |

---

## 5. 입퇴원 관리 API

### 5.1 입원 등록

```http
POST /admissions
```

**요청**

```json
{
  "patientId": "patient-uuid",
  "bedId": "bed-uuid",
  "admissionDate": "2025-12-29",
  "admissionTime": "14:30",
  "admissionType": "SCHEDULED",
  "admissionReason": "폐렴 치료",
  "diagnosis": "폐렴",
  "expectedDischarge": "2026-01-05",
  "attendingDoctorId": "doctor-uuid",
  "primaryNurseId": "nurse-uuid"
}
```

**응답 (201 Created)**

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

### 5.2 입원 정보 조회

```http
GET /admissions/{admissionId}
```

### 5.3 입원 목록 조회

```http
GET /admissions
```

**쿼리 파라미터**

| 파라미터 | 타입   | 설명               |
| -------- | ------ | ------------------ |
| status   | string | ACTIVE, DISCHARGED |
| floorId  | uuid   | 층 필터            |
| doctorId | uuid   | 담당의 필터        |
| nurseId  | uuid   | 담당 간호사 필터   |
| fromDate | date   | 입원일 시작        |
| toDate   | date   | 입원일 종료        |

### 5.4 전실 처리

```http
POST /admissions/{admissionId}/transfer
```

**요청**

```json
{
  "toBedId": "new-bed-uuid",
  "transferDate": "2025-12-29",
  "transferTime": "10:00",
  "reason": "병실 업그레이드 요청"
}
```

### 5.5 퇴원 처리

```http
POST /admissions/{admissionId}/discharge
```

**요청**

```json
{
  "dischargeDate": "2025-12-29",
  "dischargeTime": "11:00",
  "dischargeType": "NORMAL",
  "dischargeSummary": "치료 완료, 상태 호전",
  "followUpPlan": "외래 1주 후 재방문"
}
```

### 5.6 입원번호로 조회

```http
GET /admissions/by-number/{admissionNumber}
```

**응답 (200 OK)**

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

### 5.7 환자별 활성 입원 조회

```http
GET /admissions/patient/{patientId}/active
```

특정 환자의 현재 활성 입원 정보를 반환합니다. 입원 상태가 아니면 null을 반환합니다.

### 5.8 층별 입원 목록 조회

```http
GET /admissions/floor/{floorId}
```

**쿼리 파라미터**

| 파라미터 | 타입   | 설명           |
| -------- | ------ | -------------- |
| status   | string | 입원 상태 필터 |

### 5.9 전실 이력 조회

```http
GET /admissions/{admissionId}/transfers
```

**응답 (200 OK)**

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
      "reason": "병실 업그레이드 요청",
      "transferredBy": "user-uuid",
      "createdAt": "2025-12-29T10:00:00Z"
    }
  ]
}
```

---

## 6. 보고서 및 일지 API

### 6.1 바이탈 사인 기록

```http
POST /admissions/{admissionId}/vitals
```

**요청**

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

### 6.2 바이탈 사인 조회

```http
GET /admissions/{admissionId}/vitals
```

**쿼리 파라미터**

| 파라미터 | 타입     | 설명      |
| -------- | -------- | --------- |
| fromDate | datetime | 시작 일시 |
| toDate   | datetime | 종료 일시 |
| limit    | integer  | 최근 N건  |

**응답 (200 OK)**

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
        "name": "김간호"
      }
    }
  ]
}
```

### 6.3 일일 보고서 작성

```http
POST /admissions/{admissionId}/daily-reports
```

**요청**

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
  "notes": "전반적 상태 양호"
}
```

### 6.4 일일 보고서 조회

```http
GET /admissions/{admissionId}/daily-reports
```

### 6.5 I/O (섭취/배설량) 기록

```http
POST /admissions/{admissionId}/intake-outputs
```

**요청**

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

### 6.6 투약 기록

```http
POST /admissions/{admissionId}/medications
```

**요청**

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

### 6.7 간호 일지 작성

```http
POST /admissions/{admissionId}/nursing-notes
```

**요청**

```json
{
  "noteDatetime": "2025-12-29T10:30:00Z",
  "category": "ASSESSMENT",
  "priority": "NORMAL",
  "subjective": "두통 호소",
  "objective": "V/S 안정, 의식 명료",
  "assessment": "경증 두통, 활력징후 정상 범위",
  "plan": "경과 관찰, PRN 진통제 투여 고려"
}
```

---

## 7. 라운딩 API

### 7.1 라운딩 세션 생성

```http
POST /rounds
```

**요청**

```json
{
  "roundDate": "2025-12-29",
  "roundType": "MORNING",
  "floorId": "floor-uuid",
  "leadDoctorId": "doctor-uuid"
}
```

### 7.2 라운딩 목록 조회

```http
GET /rounds
```

**쿼리 파라미터**

| 파라미터  | 타입   | 설명                            |
| --------- | ------ | ------------------------------- |
| roundDate | date   | 라운딩 날짜                     |
| floorId   | uuid   | 층 필터                         |
| status    | string | PLANNED, IN_PROGRESS, COMPLETED |

### 7.3 라운딩 시작

```http
POST /rounds/{roundId}/start
```

### 7.4 라운딩 기록 추가

```http
POST /rounds/{roundId}/records
```

**요청**

```json
{
  "admissionId": "admission-uuid",
  "visitOrder": 1,
  "patientStatus": "STABLE",
  "chiefComplaint": "특이 호소 없음",
  "observation": "V/S 안정, 식사 양호",
  "plan": "현 치료 유지",
  "orders": "바이탈 체크 QID"
}
```

### 7.5 라운딩 완료

```http
POST /rounds/{roundId}/complete
```

---

## 8. 관리자 API

### 8.1 사용자 목록 조회

```http
GET /admin/users
```

### 8.2 사용자 생성

```http
POST /admin/users
```

**요청**

```json
{
  "employeeId": "EMP2025001",
  "username": "nurse002",
  "password": "InitialP@ss123",
  "name": "박간호",
  "email": "nurse002@hospital.com",
  "phone": "010-1234-5678",
  "department": "내과병동",
  "position": "간호사",
  "roles": ["NURSE"]
}
```

### 8.3 사용자 수정

```http
PATCH /admin/users/{userId}
```

### 8.4 사용자 비활성화

```http
DELETE /admin/users/{userId}
```

### 8.5 역할 관리

```http
GET /admin/roles
POST /admin/roles
PATCH /admin/roles/{roleId}
```

### 8.6 접근 로그 조회

```http
GET /admin/audit/access-logs
```

**쿼리 파라미터**

| 파라미터     | 타입     | 설명        |
| ------------ | -------- | ----------- |
| userId       | uuid     | 사용자 필터 |
| resourceType | string   | 리소스 유형 |
| action       | string   | 행위        |
| fromDate     | datetime | 시작 일시   |
| toDate       | datetime | 종료 일시   |

---

## 9. WebSocket API (실시간 업데이트)

### 9.1 연결

```javascript
// 클라이언트 연결
const socket = io('wss://api.hospital-erp.com', {
  auth: {
    token: 'Bearer <access_token>',
  },
});
```

### 9.2 이벤트

| 이벤트                 | 방향            | 설명           |
| ---------------------- | --------------- | -------------- |
| `room:status`          | Server → Client | 병실 상태 변경 |
| `admission:created`    | Server → Client | 새 입원        |
| `admission:discharged` | Server → Client | 퇴원 처리      |
| `vital:recorded`       | Server → Client | 바이탈 기록    |
| `round:started`        | Server → Client | 라운딩 시작    |
| `subscribe:floor`      | Client → Server | 층별 구독      |

### 9.3 이벤트 페이로드 예시

```javascript
// room:status 이벤트
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

## 10. 에러 코드 정의

### 10.1 인증 관련

| 코드                          | 메시지                                   | HTTP |
| ----------------------------- | ---------------------------------------- | ---- |
| AUTH_INVALID_CREDENTIALS      | 아이디 또는 비밀번호가 올바르지 않습니다 | 401  |
| AUTH_TOKEN_EXPIRED            | 토큰이 만료되었습니다                    | 401  |
| AUTH_TOKEN_INVALID            | 유효하지 않은 토큰입니다                 | 401  |
| AUTH_INSUFFICIENT_PERMISSIONS | 권한이 부족합니다                        | 403  |

### 10.2 환자 관련

| 코드                         | 메시지                     | HTTP |
| ---------------------------- | -------------------------- | ---- |
| PATIENT_NOT_FOUND            | 환자를 찾을 수 없습니다    | 404  |
| PATIENT_ALREADY_EXISTS       | 이미 등록된 환자번호입니다 | 409  |
| PATIENT_HAS_ACTIVE_ADMISSION | 현재 입원 중인 환자입니다  | 409  |

### 10.3 병실 관련

| 코드                 | 메시지                         | HTTP |
| -------------------- | ------------------------------ | ---- |
| ROOM_NOT_FOUND       | 병실을 찾을 수 없습니다        | 404  |
| BED_NOT_AVAILABLE    | 해당 병상은 사용할 수 없습니다 | 409  |
| BED_ALREADY_OCCUPIED | 이미 사용 중인 병상입니다      | 409  |

### 10.4 입퇴원 관련

| 코드                         | 메시지                             | HTTP |
| ---------------------------- | ---------------------------------- | ---- |
| ADMISSION_NOT_FOUND          | 입원 정보를 찾을 수 없습니다       | 404  |
| ADMISSION_ALREADY_DISCHARGED | 이미 퇴원 처리된 환자입니다        | 409  |
| TRANSFER_SAME_BED            | 동일한 병상으로 전실할 수 없습니다 | 400  |

---

## 부록: OpenAPI 3.0 스펙 (일부)

```yaml
openapi: 3.0.3
info:
  title: 입원환자 관리 ERP API
  version: 1.0.0
  description: 입원환자 관리를 위한 RESTful API

servers:
  - url: https://api.hospital-erp.com/v1
    description: Production

security:
  - bearerAuth: []

paths:
  /patients:
    get:
      summary: 환자 목록 조회
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
          description: 성공
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
