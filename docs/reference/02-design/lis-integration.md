# LIS (Laboratory Information System) Integration Specification

## Document Information

| Item | Content |
|------|---------|
| Document Version | 0.1.0.0 |
| Created Date | 2025-12-29 |
| Status | Draft |
| Maintainer | kcenon@naver.com |

---

## 1. LIS Overview

### 1.1 What is LIS?

**LIS (Laboratory Information System)** is an information system designed to manage clinical laboratory operations. It handles the entire workflow from test orders to result reporting.

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIS Workflow Overview                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│   │  Order  │───▶│ Sample  │───▶│ Testing │───▶│ Result  │     │
│   │ Receipt │    │Collection│   │         │    │Reporting│     │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘     │
│        │              │              │              │           │
│        ▼              ▼              ▼              ▼           │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    LIS Database                          │  │
│   │  - Test Orders     - Sample Tracking                     │  │
│   │  - Test Results    - Quality Control                     │  │
│   │  - Patient Info    - Equipment Interface                 │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 LIS Data Categories

| Category | Data Types | Use in ERP |
|----------|------------|------------|
| **Patient Demographics** | Patient ID, Name, DOB, Gender | Patient identification |
| **Test Orders** | Order ID, Test codes, Order date/time | Order tracking |
| **Test Results** | Result values, Units, Reference ranges | Clinical review |
| **Result Status** | Pending, Preliminary, Final, Corrected | Workflow management |
| **Specimen Info** | Collection date, Specimen type | Sample tracking |

### 1.3 Common Laboratory Tests

| Category | Tests | Clinical Significance |
|----------|-------|----------------------|
| **Hematology** | CBC, WBC differential, Hemoglobin | Blood cell analysis |
| **Chemistry** | BUN, Creatinine, Electrolytes, Liver function | Organ function |
| **Coagulation** | PT, aPTT, INR | Bleeding/clotting disorders |
| **Urinalysis** | UA, Urine culture | Kidney/UTI evaluation |
| **Cardiac Markers** | Troponin, BNP, CK-MB | Heart disease |
| **Infection Markers** | CRP, Procalcitonin, ESR | Inflammation/infection |

---

## 2. Integration Standards

### 2.1 HL7 (Health Level Seven)

**HL7** is the most widely used healthcare data exchange standard. Version 2.x is commonly used for LIS integration.

#### 2.1.1 HL7 Message Types for LIS

| Message Type | Trigger Event | Description |
|--------------|---------------|-------------|
| **ORM^O01** | Order Message | New lab order request |
| **ORU^R01** | Observation Result | Lab result report |
| **ORL^O22** | General Lab Order Response | Order acknowledgment |
| **QRY^R02** | Query for Results | Request results |
| **ADT^A01** | Admit/Visit Notification | Patient admission |

#### 2.1.2 HL7 v2.x Message Structure

```
MSH|^~\&|LIS|LAB|ERP|HOSPITAL|20251229120000||ORU^R01|MSG001|P|2.5
PID|1||12345678^^^HOSP^MR||DOE^JOHN^||19800115|M
OBR|1|ORD001|LAB001|80053^COMPREHENSIVE METABOLIC PANEL^L|||20251229080000
OBX|1|NM|2345-7^GLUCOSE^LN||95|mg/dL|70-100|N|||F
OBX|2|NM|2160-0^CREATININE^LN||1.1|mg/dL|0.7-1.3|N|||F
OBX|3|NM|3094-0^BUN^LN||15|mg/dL|7-20|N|||F
```

**Segment Descriptions:**

| Segment | Name | Key Fields |
|---------|------|------------|
| **MSH** | Message Header | Sending/Receiving apps, Message type, Version |
| **PID** | Patient Identification | Patient ID, Name, DOB, Gender |
| **OBR** | Observation Request | Order ID, Test code, Collection time |
| **OBX** | Observation Result | Result value, Units, Reference range, Status |

#### 2.1.3 HL7 Result Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| **F** | Final | Verified final result |
| **P** | Preliminary | Unverified preliminary result |
| **C** | Corrected | Previously reported result corrected |
| **X** | Cancelled | Order/result cancelled |
| **I** | Pending | Result pending |

### 2.2 FHIR (Fast Healthcare Interoperability Resources)

**FHIR R4** is the modern standard for healthcare data exchange, using RESTful APIs.

#### 2.2.1 FHIR Resources for Lab Results

| Resource | Description | Use Case |
|----------|-------------|----------|
| **DiagnosticReport** | Overall lab report | Panel/profile results |
| **Observation** | Individual test result | Single test value |
| **ServiceRequest** | Lab order | Order placement |
| **Specimen** | Sample information | Sample tracking |
| **Patient** | Patient demographics | Patient identification |

#### 2.2.2 FHIR DiagnosticReport Example

```json
{
  "resourceType": "DiagnosticReport",
  "id": "lab-report-001",
  "status": "final",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
      "code": "LAB",
      "display": "Laboratory"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "24323-8",
      "display": "Comprehensive metabolic 2000 panel"
    }]
  },
  "subject": {
    "reference": "Patient/12345678"
  },
  "effectiveDateTime": "2025-12-29T08:00:00Z",
  "issued": "2025-12-29T12:00:00Z",
  "result": [
    { "reference": "Observation/glucose-001" },
    { "reference": "Observation/creatinine-001" },
    { "reference": "Observation/bun-001" }
  ]
}
```

#### 2.2.3 FHIR Observation Example

```json
{
  "resourceType": "Observation",
  "id": "glucose-001",
  "status": "final",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/observation-category",
      "code": "laboratory"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "2345-7",
      "display": "Glucose [Mass/volume] in Serum or Plasma"
    }]
  },
  "subject": {
    "reference": "Patient/12345678"
  },
  "effectiveDateTime": "2025-12-29T08:00:00Z",
  "valueQuantity": {
    "value": 95,
    "unit": "mg/dL",
    "system": "http://unitsofmeasure.org",
    "code": "mg/dL"
  },
  "referenceRange": [{
    "low": { "value": 70, "unit": "mg/dL" },
    "high": { "value": 100, "unit": "mg/dL" }
  }],
  "interpretation": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
      "code": "N",
      "display": "Normal"
    }]
  }]
}
```

### 2.3 LOINC (Logical Observation Identifiers Names and Codes)

**LOINC** is the universal standard for identifying laboratory tests.

| LOINC Code | Component | Property | System |
|------------|-----------|----------|--------|
| 2345-7 | Glucose | MCnc | Ser/Plas |
| 2160-0 | Creatinine | MCnc | Ser/Plas |
| 3094-0 | Urea nitrogen | MCnc | Ser/Plas |
| 718-7 | Hemoglobin | MCnc | Bld |
| 4544-3 | Hematocrit | VFr | Bld |
| 777-3 | Platelets | NCnc | Bld |

---

## 3. Integration Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIS Integration Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────────────────────────────────────────────────┐│
│   │                    Inpatient ERP System                    ││
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       ││
│   │  │   Patient   │  │   Rounding  │  │  Dashboard  │       ││
│   │  │   Detail    │  │   Screen    │  │             │       ││
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       ││
│   │         │                │                │               ││
│   │         └────────────────┼────────────────┘               ││
│   │                          ▼                                 ││
│   │  ┌─────────────────────────────────────────────────────┐ ││
│   │  │              Lab Results Service                     │ ││
│   │  │                                                      │ ││
│   │  │  + getLatestResults(patientId): LabResult[]         │ ││
│   │  │  + getResultHistory(patientId, days): LabResult[]   │ ││
│   │  │  + getResultsByCategory(patientId, cat): LabResult[]│ ││
│   │  │                                                      │ ││
│   │  └───────────────────────┬─────────────────────────────┘ ││
│   └──────────────────────────┼───────────────────────────────┘│
│                              │                                 │
│   ┌──────────────────────────┼───────────────────────────────┐│
│   │                          ▼                                ││
│   │  ┌─────────────────────────────────────────────────────┐ ││
│   │  │              LIS Integration Adapter                 │ ││
│   │  │                                                      │ ││
│   │  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │ ││
│   │  │  │ HL7 Parser  │  │FHIR Client  │  │ REST Client│  │ ││
│   │  │  └─────────────┘  └─────────────┘  └────────────┘  │ ││
│   │  │                                                      │ ││
│   │  └───────────────────────┬─────────────────────────────┘ ││
│   │          Integration Layer                                ││
│   └──────────────────────────┼───────────────────────────────┘│
│                              │                                 │
│                              ▼                                 │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │                    Hospital LIS                          │ │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  │ │
│   │  │ Results │  │ Orders  │  │ Patient │  │ Specimens │  │ │
│   │  │   DB    │  │   DB    │  │   DB    │  │    DB     │  │ │
│   │  └─────────┘  └─────────┘  └─────────┘  └───────────┘  │ │
│   └─────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Integration Patterns

#### 3.2.1 Pull Pattern (Query-based)

ERP periodically queries LIS for new results.

```typescript
// Scheduled job to fetch new lab results
@Cron('*/5 * * * *') // Every 5 minutes
async syncLabResults(): Promise<void> {
  const patients = await this.getActiveInpatients();

  for (const patient of patients) {
    const results = await this.lisAdapter.getNewResults(
      patient.lisPatientId,
      patient.lastSyncTime
    );

    if (results.length > 0) {
      await this.labResultsService.saveResults(patient.id, results);
      await this.notifyIfCritical(patient, results);
    }
  }
}
```

#### 3.2.2 Push Pattern (Event-based)

LIS sends results to ERP when available (preferred for real-time).

```typescript
// Webhook endpoint for LIS result notifications
@Post('lis/results')
async receiveLabResult(@Body() hl7Message: string): Promise<void> {
  const parsedResult = this.hl7Parser.parse(hl7Message);

  const patient = await this.patientService.findByLisId(
    parsedResult.patientId
  );

  if (patient) {
    await this.labResultsService.saveResult(patient.id, parsedResult);

    // Real-time notification for critical values
    if (parsedResult.isCritical) {
      await this.alertService.sendCriticalAlert(patient, parsedResult);
    }
  }
}
```

### 3.3 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Data Flow Diagram                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Patient Admission]                                            │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────┐    Patient ID    ┌─────────────┐              │
│   │    ERP      │ ───────────────▶ │    LIS      │              │
│   │   System    │                  │   System    │              │
│   └─────────────┘                  └──────┬──────┘              │
│         ▲                                 │                      │
│         │                                 │                      │
│         │         Lab Results             │                      │
│         │  ◀──────────────────────────────┘                      │
│         │  (HL7 ORU^R01 / FHIR Observation)                      │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────┐                                               │
│   │   Display   │                                               │
│   │  - Rounding │                                               │
│   │  - Dashboard│                                               │
│   │  - Alerts   │                                               │
│   └─────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 pacs_bridge Integration Option (Recommended)

For hospitals with existing pacs_bridge infrastructure or new implementations seeking rapid development, leveraging the **pacs_bridge** project provides a pre-built protocol translation layer.

#### 3.4.1 Architecture with pacs_bridge

```
┌─────────────────────────────────────────────────────────────────────┐
│                   LIS Integration via pacs_bridge                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                  Inpatient ERP System                         │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│   │  │   Patient   │  │   Rounding  │  │  Dashboard  │          │  │
│   │  │   Detail    │  │   Screen    │  │             │          │  │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │  │
│   │         └────────────────┼────────────────┘                  │  │
│   │                          ▼                                    │  │
│   │  ┌─────────────────────────────────────────────────────────┐│  │
│   │  │              Lab Results Service                         ││  │
│   │  │              (REST API calls to pacs_bridge)             ││  │
│   │  └───────────────────────┬─────────────────────────────────┘│  │
│   └──────────────────────────┼──────────────────────────────────┘  │
│                              │ REST API (HTTP/JSON)                 │
│   ┌──────────────────────────┼──────────────────────────────────┐  │
│   │          pacs_bridge Integration Layer                       │  │
│   │                          ▼                                    │  │
│   │  ┌─────────────────────────────────────────────────────────┐│  │
│   │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ││  │
│   │  │  │ HL7 v2.x     │  │ FHIR R4      │  │ Message      │  ││  │
│   │  │  │ Gateway      │  │ Gateway      │  │ Queue        │  ││  │
│   │  │  │ (MLLP/TLS)   │  │ (REST)       │  │              │  ││  │
│   │  │  └──────────────┘  └──────────────┘  └──────────────┘  ││  │
│   │  │                   Protocol Translation                   ││  │
│   │  └───────────────────────┬─────────────────────────────────┘│  │
│   └──────────────────────────┼──────────────────────────────────┘  │
│                              │ HL7 v2.x / FHIR R4                   │
│   ┌──────────────────────────┼──────────────────────────────────┐  │
│   │                          ▼                                    │  │
│   │  ┌─────────────────────────────────────────────────────────┐│  │
│   │  │                    Hospital LIS                          ││  │
│   │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  ││  │
│   │  │  │ Results │  │ Orders  │  │ Patient │  │ Specimens │  ││  │
│   │  │  │   DB    │  │   DB    │  │   DB    │  │    DB     │  ││  │
│   │  │  └─────────┘  └─────────┘  └─────────┘  └───────────┘  ││  │
│   │  └─────────────────────────────────────────────────────────┘│  │
│   │                      External System                          │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3.4.2 pacs_bridge Features for LIS Integration

| Feature | Description | Benefit |
|---------|-------------|---------|
| **HL7 v2.x Gateway** | Full HL7 v2.x parser/builder with MLLP transport | No need to implement HL7 parsing from scratch |
| **FHIR R4 Gateway** | RESTful FHIR R4 client/server | Modern API support ready |
| **Message Queue** | Reliable message queuing with retry logic | Handles network failures gracefully |
| **Protocol Translation** | Automatic conversion between HL7/FHIR/JSON | Unified REST API for ERP |
| **Audit Logging** | Built-in healthcare-grade audit trails | Compliance ready |
| **TLS/mTLS Support** | Secure communication channels | Security infrastructure included |

#### 3.4.3 Integration Code Example

```typescript
// Using pacs_bridge REST API for lab results
@Injectable()
export class LabResultsService {
  private readonly pacsBridgeUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.pacsBridgeUrl = process.env.PACS_BRIDGE_URL;
  }

  // Get lab results via pacs_bridge (simplified - no HL7 parsing needed)
  async getLabResults(patientId: string): Promise<LabResult[]> {
    const url = `${this.pacsBridgeUrl}/api/lab-results/${patientId}`;

    const response = await this.httpService.get<LabResultDto[]>(url, {
      headers: {
        'Authorization': `Bearer ${await this.getAccessToken()}`,
        'Accept': 'application/json'
      }
    });

    return response.data.map(dto => this.mapToLabResult(dto));
  }

  // Subscribe to real-time lab result notifications
  async subscribeToResults(patientId: string, callback: (result: LabResult) => void): Promise<void> {
    const wsUrl = `${this.pacsBridgeUrl.replace('http', 'ws')}/ws/lab-results/${patientId}`;
    // pacs_bridge handles HL7 ORU^R01 → JSON conversion automatically
    this.websocketClient.connect(wsUrl, callback);
  }

  // pacs_bridge REST API response is already parsed JSON
  private mapToLabResult(dto: LabResultDto): LabResult {
    return {
      id: dto.id,
      patientId: dto.patientId,
      testCode: dto.loincCode,
      testName: dto.testName,
      value: dto.value,
      unit: dto.unit,
      referenceRangeLow: dto.refRangeLow,
      referenceRangeHigh: dto.refRangeHigh,
      status: dto.status,
      abnormalFlag: dto.abnormalFlag,
      criticalFlag: dto.isCritical,
      resultDateTime: new Date(dto.resultDateTime),
      // ... other fields
    };
  }
}
```

#### 3.4.4 Benefits of pacs_bridge Integration

| Aspect | Direct Integration | pacs_bridge Integration |
|--------|-------------------|------------------------|
| **Development Time** | 4-6 weeks | 1-2 weeks |
| **HL7 Parser** | Implement from scratch | Pre-built and tested |
| **FHIR Client** | Implement from scratch | Pre-built and tested |
| **Error Handling** | Custom implementation | Production-ready |
| **Security** | Custom TLS/auth setup | Built-in TLS/OAuth2 |
| **Monitoring** | Custom implementation | Built-in metrics/logs |
| **Maintenance** | Full ownership | Shared infrastructure |

#### 3.4.5 When to Use pacs_bridge

**Recommended when:**
- Hospital already uses or plans to use pacs_system for PACS integration
- Quick time-to-market is required
- LIS uses standard HL7 v2.x or FHIR R4 protocols
- Multiple external systems need integration (LIS, EMR, PACS)

**Consider direct integration when:**
- LIS uses proprietary/non-standard protocols
- Hospital has existing integration middleware
- Specific customizations not supported by pacs_bridge
- Minimal external dependencies are preferred

---

## 4. Data Model

### 4.1 Lab Result Entity

```typescript
// Domain entity for lab results
interface LabResult {
  id: string;
  patientId: string;

  // Order information
  orderId: string;
  orderDateTime: Date;

  // Test information
  testCode: string;        // LOINC code preferred
  testName: string;
  category: LabCategory;   // CHEM, HEME, COAG, etc.

  // Result information
  value: string | number;
  unit: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  referenceRangeText?: string;

  // Status and flags
  status: ResultStatus;    // FINAL, PRELIMINARY, CORRECTED
  abnormalFlag?: AbnormalFlag;  // L, H, LL, HH, N
  criticalFlag: boolean;

  // Timestamps
  collectionDateTime: Date;
  resultDateTime: Date;
  receivedDateTime: Date;

  // Source tracking
  lisResultId: string;
  lisOrderId: string;
}

enum LabCategory {
  CHEMISTRY = 'CHEM',
  HEMATOLOGY = 'HEME',
  COAGULATION = 'COAG',
  URINALYSIS = 'UA',
  MICROBIOLOGY = 'MICRO',
  IMMUNOLOGY = 'IMMU',
  BLOOD_BANK = 'BB'
}

enum ResultStatus {
  PENDING = 'P',
  PRELIMINARY = 'PR',
  FINAL = 'F',
  CORRECTED = 'C',
  CANCELLED = 'X'
}

enum AbnormalFlag {
  LOW = 'L',
  HIGH = 'H',
  CRITICAL_LOW = 'LL',
  CRITICAL_HIGH = 'HH',
  NORMAL = 'N',
  ABNORMAL = 'A'
}
```

### 4.2 Database Schema

```sql
-- Lab results table
CREATE TABLE lab.lab_results (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id            UUID NOT NULL REFERENCES patient.patients(id),

    -- Order information
    order_id              VARCHAR(50) NOT NULL,
    order_datetime        TIMESTAMPTZ NOT NULL,

    -- Test information
    test_code             VARCHAR(20) NOT NULL,  -- LOINC code
    test_name             VARCHAR(200) NOT NULL,
    category              VARCHAR(10) NOT NULL,

    -- Result information
    value_numeric         DECIMAL(18, 6),
    value_text            VARCHAR(500),
    unit                  VARCHAR(50),
    reference_range_low   DECIMAL(18, 6),
    reference_range_high  DECIMAL(18, 6),
    reference_range_text  VARCHAR(200),

    -- Status and flags
    status                VARCHAR(10) NOT NULL DEFAULT 'P',
    abnormal_flag         VARCHAR(5),
    is_critical           BOOLEAN DEFAULT FALSE,

    -- Timestamps
    collection_datetime   TIMESTAMPTZ NOT NULL,
    result_datetime       TIMESTAMPTZ NOT NULL,
    received_datetime     TIMESTAMPTZ DEFAULT NOW(),

    -- Source tracking
    lis_result_id         VARCHAR(100) NOT NULL,
    lis_order_id          VARCHAR(100),

    -- Audit
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_lis_result UNIQUE (lis_result_id)
);

-- Indexes for common queries
CREATE INDEX idx_lab_results_patient ON lab.lab_results(patient_id);
CREATE INDEX idx_lab_results_patient_date ON lab.lab_results(patient_id, result_datetime DESC);
CREATE INDEX idx_lab_results_category ON lab.lab_results(patient_id, category);
CREATE INDEX idx_lab_results_critical ON lab.lab_results(is_critical) WHERE is_critical = TRUE;
CREATE INDEX idx_lab_results_status ON lab.lab_results(status);

-- Lab result history (for corrected/amended results)
CREATE TABLE lab.lab_result_history (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_result_id         UUID NOT NULL REFERENCES lab.lab_results(id),
    previous_value        VARCHAR(500),
    previous_status       VARCHAR(10),
    change_reason         VARCHAR(500),
    changed_at            TIMESTAMPTZ DEFAULT NOW(),
    changed_by            VARCHAR(100)
);
```

---

## 5. API Specification

### 5.1 Lab Results Endpoints

#### GET /api/patients/{patientId}/lab-results

Get lab results for a patient.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category (CHEM, HEME, etc.) |
| `startDate` | ISO date | Results from this date |
| `endDate` | ISO date | Results until this date |
| `status` | string | Filter by status (F, P, C) |
| `criticalOnly` | boolean | Only critical values |
| `limit` | number | Max results (default: 50) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "testCode": "2345-7",
      "testName": "Glucose",
      "category": "CHEM",
      "value": 95,
      "unit": "mg/dL",
      "referenceRange": {
        "low": 70,
        "high": 100,
        "text": "70-100 mg/dL"
      },
      "status": "F",
      "abnormalFlag": "N",
      "isCritical": false,
      "collectionDateTime": "2025-12-29T08:00:00Z",
      "resultDateTime": "2025-12-29T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /api/patients/{patientId}/lab-results/latest

Get most recent results grouped by test type.

**Response:**

```json
{
  "data": {
    "CHEM": [
      { "testCode": "2345-7", "testName": "Glucose", "value": 95, "resultDateTime": "..." },
      { "testCode": "2160-0", "testName": "Creatinine", "value": 1.1, "resultDateTime": "..." }
    ],
    "HEME": [
      { "testCode": "718-7", "testName": "Hemoglobin", "value": 14.5, "resultDateTime": "..." }
    ]
  },
  "lastUpdated": "2025-12-29T12:00:00Z"
}
```

#### GET /api/patients/{patientId}/lab-results/{testCode}/trend

Get historical trend for a specific test.

**Response:**

```json
{
  "testCode": "2345-7",
  "testName": "Glucose",
  "unit": "mg/dL",
  "referenceRange": { "low": 70, "high": 100 },
  "data": [
    { "value": 95, "datetime": "2025-12-29T08:00:00Z", "status": "F" },
    { "value": 102, "datetime": "2025-12-28T08:00:00Z", "status": "F" },
    { "value": 98, "datetime": "2025-12-27T08:00:00Z", "status": "F" }
  ]
}
```

---

## 6. Security Considerations

### 6.1 Data Protection

| Aspect | Requirement | Implementation |
|--------|-------------|----------------|
| **Encryption in Transit** | TLS 1.3 | HTTPS for all API calls |
| **Encryption at Rest** | AES-256 | Database encryption |
| **Access Control** | Role-based | Only authorized staff |
| **Audit Logging** | All access | Log all result views |
| **Data Retention** | 5+ years | Per Medical Service Act |

### 6.2 Authentication for LIS Integration

```typescript
// LIS integration authentication
interface LisAuthConfig {
  // API Key authentication
  apiKey?: string;

  // OAuth2 client credentials
  oauth2?: {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string;
  };

  // Certificate-based (mTLS)
  certificate?: {
    certPath: string;
    keyPath: string;
    caPath: string;
  };
}
```

### 6.3 Critical Value Alerts

```typescript
// Critical value thresholds (examples)
const criticalThresholds = {
  '2345-7': { low: 40, high: 500 },     // Glucose mg/dL
  '2160-0': { low: null, high: 10 },    // Creatinine mg/dL
  '2823-3': { low: 2.5, high: 6.5 },    // Potassium mEq/L
  '2951-2': { low: 120, high: 160 },    // Sodium mEq/L
  '718-7': { low: 7, high: 20 },        // Hemoglobin g/dL
  '777-3': { low: 50000, high: null }   // Platelets /uL
};
```

---

## 7. Implementation Checklist

### Phase 1: Foundation

- [ ] Define LIS vendor and integration method
- [ ] Obtain LIS API documentation / HL7 specifications
- [ ] Set up development/test LIS environment
- [ ] Implement LIS adapter interface
- [ ] Create lab_results database schema

### Phase 2: Core Integration

- [ ] Implement HL7 message parser (if applicable)
- [ ] Implement FHIR client (if applicable)
- [ ] Implement result synchronization service
- [ ] Create lab results API endpoints
- [ ] Implement result caching

### Phase 3: UI Integration

- [ ] Add lab results to patient detail screen
- [ ] Add lab results to rounding screen
- [ ] Implement result trend charts
- [ ] Implement critical value alerts

### Phase 4: Testing & Validation

- [ ] Unit tests for parser/adapter
- [ ] Integration tests with LIS
- [ ] Result accuracy validation
- [ ] Performance testing
- [ ] Security audit

---

## 8. Vendor-Specific Notes

### 8.1 Common LIS Vendors in Korea

| Vendor | Common Interface | Notes |
|--------|------------------|-------|
| **U2BIO** | HL7 v2.x, Web API | Common in mid-size hospitals |
| **Labgenomics** | HL7 v2.x | Genetic testing focus |
| **SCL (Seoul Clinical Lab)** | HL7 v2.x, REST API | Reference lab |
| **GC Labs** | HL7 v2.x | Large network |
| **Samkwang Medical Labs** | HL7 v2.x | Wide coverage |

### 8.2 Integration Considerations

1. **Message Character Set**: Korean hospitals often use EUC-KR or UTF-8
2. **Patient ID Matching**: Ensure consistent ID format between systems
3. **Test Code Mapping**: Map vendor-specific codes to LOINC
4. **Result Format**: Numeric vs. text results handling
5. **Time Zone**: Ensure consistent timestamp handling (KST)

---

## 9. References

- [HL7 International](https://www.hl7.org/)
- [FHIR R4 Specification](https://www.hl7.org/fhir/)
- [LOINC](https://loinc.org/)
- [IHE Laboratory Technical Framework](https://www.ihe.net/Technical_Frameworks/#laboratory)

---

## Change History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-29 | 0.1.0.0 | Initial document creation |

---

*Last Updated: 2025-12-29*
