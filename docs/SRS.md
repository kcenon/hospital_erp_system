# Software Requirements Specification (SRS)

# Inpatient Management ERP System

---

## Document Information

| Item               | Content                                 |
| ------------------ | --------------------------------------- |
| Document Version   | 1.0.0                                   |
| Created Date       | 2025-12-29                              |
| Status             | Draft                                   |
| Maintainer         | kcenon@naver.com                        |
| Standard Reference | IEEE 830-1998 / ISO/IEC/IEEE 29148:2018 |
| Product Name       | Inpatient Management ERP System         |

---

## Document History

| Version | Date       | Author | Changes       |
| ------- | ---------- | ------ | ------------- |
| 1.0.0   | 2025-12-29 | -      | Initial draft |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [External Interface Requirements](#3-external-interface-requirements)
4. [System Features](#4-system-features)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Other Requirements](#6-other-requirements)
7. [Requirements Traceability Matrix](#7-requirements-traceability-matrix)
8. [Appendices](#8-appendices)

---

## 1. Introduction

### 1.1 Purpose

This document describes the software requirements for the **Inpatient Management ERP System** in detail. The purpose of this document is to communicate the functional and non-functional requirements of the system to the following audiences:

- **Development Team**: Basis for system design and implementation
- **Project Manager**: Project scope and schedule management
- **Quality Assurance Team**: Test case derivation and verification
- **Stakeholders**: Requirements review and approval

> **Traceability Reference**: [PRD.md](PRD.md) Section 1.1-1.3

### 1.2 Scope

#### 1.2.1 Product Name

**Inpatient Management ERP System**

#### 1.2.2 Product Objectives

| ID         | Objective                                                                   | Measurement Criteria                   |
| ---------- | --------------------------------------------------------------------------- | -------------------------------------- |
| **OBJ-01** | Real-time data integration with existing medical program                    | Data synchronization delay < 5 minutes |
| **OBJ-02** | Real-time monitoring of room status and patient condition                   | Dashboard refresh < 3 seconds          |
| **OBJ-03** | Mobile support for rounding/ward round reports                              | Mobile access rate > 80%               |
| **OBJ-04** | Compliance with Medical Service Act and Personal Information Protection Act | 100% security audit pass               |

> **Traceability Reference**: [PRD.md](PRD.md) Section 3, [Project-Overview.md](reference/01-overview/project-overview.md) Section 1.3

#### 1.2.3 Product Scope

```
Inpatient Management ERP
├── In Scope
│   ├── System Integration (EMR/OCS, LIS)
│   ├── Room and Patient Management
│   ├── Admission/Discharge Management
│   ├── Reports and Journals
│   ├── Rounding Management
│   ├── Lab Results Inquiry (LIS Integration)
│   └── Admin Functions
│
└── Out of Scope
    ├── Outpatient Management
    ├── Operating Room Management
    ├── Inventory/Pharmacy Management
    ├── Billing/Payment System
    └── PACS Image Direct Display (link integration available in Phase 3+)
```

### 1.3 Definitions, Acronyms, and Abbreviations

#### 1.3.1 Medical Terms

| Term                    | Definition                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| **Admission**           | Patient being admitted to the hospital                                                                 |
| **Discharge**           | Patient leaving the hospital                                                                           |
| **Transfer**            | Patient moving to a different room                                                                     |
| **Vital Signs**         | Biological indicators including temperature, blood pressure, pulse, respiration, and oxygen saturation |
| **I/O (Intake/Output)** | Fluid intake and output measurement                                                                    |
| **Rounding**            | Ward rounds, patient status checks                                                                     |
| **SOAP**                | Subjective, Objective, Assessment, Plan - nursing record format                                        |

> **Traceability Reference**: [Glossary.md](reference/04-appendix/glossary.md)

#### 1.3.2 Technical Terms

| Abbreviation | Definition                        |
| ------------ | --------------------------------- |
| **API**      | Application Programming Interface |
| **JWT**      | JSON Web Token                    |
| **RBAC**     | Role-Based Access Control         |
| **MFA**      | Multi-Factor Authentication       |
| **PWA**      | Progressive Web App               |
| **SSR**      | Server-Side Rendering             |

### 1.4 References

| Document ID | Document Name                       | Location                                                                                         | Description                    |
| ----------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------ |
| **REF-01**  | Product Requirements Document (PRD) | [PRD.md](PRD.md)                                                                                 | Product vision, user stories   |
| **REF-02**  | Project Overview                    | [reference/01-overview/project-overview.md](reference/01-overview/project-overview.md)           | Project background, objectives |
| **REF-03**  | Technology Stack Proposal           | [reference/01-overview/technology-stack.md](reference/01-overview/technology-stack.md)           | Technology selection rationale |
| **REF-04**  | System Architecture                 | [reference/02-design/system-architecture.md](reference/02-design/system-architecture.md)         | System structure               |
| **REF-05**  | Database Design                     | [reference/02-design/database-design.md](reference/02-design/database-design.md)                 | DB schema                      |
| **REF-06**  | API Specification                   | [reference/02-design/api-specification.md](reference/02-design/api-specification.md)             | REST API definition            |
| **REF-07**  | Security Requirements               | [reference/03-security/security-requirements.md](reference/03-security/security-requirements.md) | Security policies              |
| **REF-08**  | Glossary                            | [reference/04-appendix/glossary.md](reference/04-appendix/glossary.md)                           | Term definitions               |

### 1.5 Overview

This SRS document is organized as follows:

- **Section 2**: Product perspective, functions, user characteristics, constraints, assumptions and dependencies
- **Section 3**: User, hardware, software, and communication interface requirements
- **Section 4**: System functional requirements (detailed)
- **Section 5**: Non-functional requirements including performance, security, and quality
- **Section 6**: Other requirements including regulatory compliance and internationalization
- **Section 7**: Requirements traceability matrix
- **Section 8**: Appendices (data model, UI reference, etc.)

---

## 2. Overall Description

### 2.1 Product Perspective

#### 2.1.1 System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              External Systems                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│   │   Existing   │    │  SMS/Alert   │    │   Backup     │                  │
│   │   Medical    │    │   Service    │    │   Storage    │                  │
│   │   Program    │    │              │    │   (S3)       │                  │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│          │                   │                   │                          │
└──────────┼───────────────────┼───────────────────┼──────────────────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Inpatient Management ERP System                           │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │   Auth    │ │  Patient  │ │   Room    │ │  Report   │ │  Admin    │     │
│  │  Module   │ │  Module   │ │  Module   │ │  Module   │ │  Module   │     │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘     │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
    ┌──────┴──────┐      ┌──────┴──────┐      ┌──────┴──────┐
    │   PC Web    │      │   Tablet    │      │   Mobile    │
    │ (Admin/Adm) │      │  (Rounds)   │      │  (Nurses)   │
    └─────────────┘      └─────────────┘      └─────────────┘
```

> **Traceability Reference**: [system-architecture.md](reference/02-design/system-architecture.md) Section 1.1

#### 2.1.2 System Interfaces

| Interface                    | Description                                        | Reference Document                                                             |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Existing Medical Program** | Patient basic information, medical history inquiry | [system-architecture.md](reference/02-design/system-architecture.md) Section 6 |
| **SMS/Alert Service**        | Abnormal value alert transmission                  | -                                                                              |
| **Backup Storage**           | Data backup, document storage                      | [database-design.md](reference/02-design/database-design.md) Section 6         |

### 2.2 Product Functions

#### 2.2.1 Function Overview

```
Inpatient Management ERP
├── F1. System Integration (Interface)
│   ├── F1.1 Existing Medical Program Integration
│   └── F1.2 Patient Basic Information Synchronization
│
├── F2. Room and Patient Management
│   ├── F2.1 Room Status Dashboard
│   ├── F2.2 Patient Management (View/Register/Edit)
│   ├── F2.3 Admission Processing
│   ├── F2.4 Transfer Processing
│   └── F2.5 Discharge Processing
│
├── F3. Reports and Journals
│   ├── F3.1 Vital Signs Management
│   ├── F3.2 I/O (Intake/Output)
│   ├── F3.3 Medication Records
│   ├── F3.4 Nursing Journal
│   └── F3.5 Daily Reports
│
├── F4. Rounding
│   ├── F4.1 Rounding Session Management
│   └── F4.2 Rounding Records
│
└── F5. Admin Functions
    ├── F5.1 User Account Management
    ├── F5.2 Role/Permission Management
    └── F5.3 Audit Logs
```

> **Traceability Reference**: [PRD.md](PRD.md) Section 5.1, [project-overview.md](reference/01-overview/project-overview.md) Section 2.2

### 2.3 User Characteristics

#### 2.3.1 User Role Definitions

| Role ID    | Role Name            | Technical Level       | Primary Tasks                                   | Access Platform |
| ---------- | -------------------- | --------------------- | ----------------------------------------------- | --------------- |
| **USR-01** | System Administrator | Advanced              | System settings, user management                | PC Web          |
| **USR-02** | Admission Staff      | Intermediate          | Admission/discharge processing, room assignment | PC Web          |
| **USR-03** | Attending Physician  | Intermediate          | Rounds, prescriptions, treatment plans          | Tablet          |
| **USR-04** | Head Nurse           | Intermediate          | Ward management, nursing journal review         | PC/Tablet       |
| **USR-05** | Nurse                | Beginner-Intermediate | Vital input, nursing records                    | Mobile PWA      |

> **Traceability Reference**: [PRD.md](PRD.md) Section 4.1

#### 2.3.2 Role-Based Permission Matrix

| Function                 | System Admin |     Physician     | Head Nurse |     Nurse     | Admission Staff |
| ------------------------ | :----------: | :---------------: | :--------: | :-----------: | :-------------: |
| View Patient Info        |      ✅      |        ✅         |     ✅     | ✅ (assigned) |       ✅        |
| Register Patient Info    |      ✅      |        ❌         |     ❌     |      ❌       |       ✅        |
| Edit Patient Info        |      ✅      | ✅ (own patients) |     ✅     |      ❌       |       ✅        |
| View Room                |      ✅      |        ✅         |     ✅     |      ✅       |       ✅        |
| Room Assignment/Transfer |      ✅      |        ❌         |     ✅     |      ❌       |       ✅        |
| View Reports/Journals    |      ✅      |        ✅         |     ✅     | ✅ (assigned) |       ❌        |
| Write Reports/Journals   |      ✅      |        ✅         |     ✅     |      ✅       |       ❌        |
| User Management          |      ✅      |        ❌         |     ❌     |      ❌       |       ❌        |
| View Audit Logs          |      ✅      |        ❌         |     ❌     |      ❌       |       ❌        |

> **Traceability Reference**: [PRD.md](PRD.md) Section 4.2, [security-requirements.md](reference/03-security/security-requirements.md) Section 3

### 2.4 Constraints

#### 2.4.1 Technical Constraints

| ID         | Constraint                                          | Impact                       | Mitigation            |
| ---------- | --------------------------------------------------- | ---------------------------- | --------------------- |
| **CON-01** | Dependency on existing medical program DB structure | Determines integration scope | Apply adapter pattern |
| **CON-02** | Web browser-based (Chrome, Edge, Safari)            | Support latest 2 versions    | Compatibility testing |
| **CON-03** | Cloud environment (AWS/Naver Cloud)                 | Client-side cost burden      | Cost-optimized design |

#### 2.4.2 Regulatory Constraints

| ID         | Regulation                          | Requirement                                                          | Reference                                                                  |
| ---------- | ----------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **CON-04** | Personal Information Protection Act | Sensitive data encryption, access records retention for 2 years      | [security-requirements.md](reference/03-security/security-requirements.md) |
| **CON-05** | Medical Service Act                 | Medical records retention for 5 years, medical record access control | [glossary.md](reference/04-appendix/glossary.md) Section 5                 |
| **CON-06** | Electronic Documents Act            | Digital signature, integrity assurance                               | [security-requirements.md](reference/03-security/security-requirements.md) |

> **Traceability Reference**: [PRD.md](PRD.md) Section 11, [project-overview.md](reference/01-overview/project-overview.md) Section 5

### 2.5 Assumptions and Dependencies

#### 2.5.1 Assumptions

| ID         | Assumption                                                | Verification Timing | Impact if Not Met             |
| ---------- | --------------------------------------------------------- | ------------------- | ----------------------------- |
| **ASM-01** | Access permission to existing medical program DB provided | Phase 1             | Integration scope reduction   |
| **ASM-02** | Cooperation for Google Sheets data cleansing              | Phase 4             | Migration delay               |
| **ASM-03** | User training time secured (minimum 4 hours)              | Phase 4             | Extended stabilization period |
| **ASM-04** | Good WiFi environment within hospital                     | Phase 1             | Mobile function limitations   |

#### 2.5.2 External Dependencies

| ID         | Dependency                  | Type               | Impact Level |
| ---------- | --------------------------- | ------------------ | ------------ |
| **DEP-01** | Existing Medical Program    | Data source        | High         |
| **DEP-02** | Google Sheets (legacy data) | One-time migration | Medium       |
| **DEP-03** | AWS/Naver Cloud             | Infrastructure     | High         |
| **DEP-04** | PostgreSQL                  | Database           | High         |
| **DEP-05** | Redis                       | Cache/Session      | Medium       |

> **Traceability Reference**: [PRD.md](PRD.md) Section 11.2-11.3

---

## 3. External Interface Requirements

### 3.1 User Interfaces

#### 3.1.1 Platform-Specific UI Requirements

| ID        | Requirement              | Details                                                          | Priority    |
| --------- | ------------------------ | ---------------------------------------------------------------- | ----------- |
| **UI-01** | PC Web Support           | Resolution 1024px or higher, optimized for admission/admin tasks | Required    |
| **UI-02** | Tablet Web Support       | Resolution 768px or higher, optimized for rounds/rounding        | Required    |
| **UI-03** | Mobile Web (PWA) Support | Resolution 320px or higher, simple view/input                    | Required    |
| **UI-04** | Responsive Design        | Consistent experience across all platforms                       | Required    |
| **UI-05** | Accessibility Compliance | WCAG 2.1 AA standards                                            | Recommended |

> **Traceability Reference**: [PRD.md](PRD.md) Section 1.4, [screen-design.md](reference/02-design/ui-design.md)

#### 3.1.2 Main Screen List

| Screen ID  | Screen Name            | Path            | Primary Users   |
| ---------- | ---------------------- | --------------- | --------------- |
| **SCR-01** | Login                  | /login          | All             |
| **SCR-02** | Dashboard              | /               | All             |
| **SCR-03** | Patient List           | /patients       | All             |
| **SCR-04** | Patient Detail         | /patients/:id   | All             |
| **SCR-05** | Room Status Dashboard  | /rooms          | All             |
| **SCR-06** | Admission Registration | /admissions/new | Admission Staff |
| **SCR-07** | Vital Input            | /vitals/input   | Nurse           |
| **SCR-08** | Rounding               | /rounds         | Physician       |
| **SCR-09** | Admin                  | /admin          | Administrator   |

> **Note**: The paths listed above are **frontend (UI) routes** for navigation. Backend API endpoints follow RESTful resource hierarchy. See Section 3.1.3 for the mapping between UI routes and API endpoints.

> **Traceability Reference**: [PRD.md](PRD.md) Section 8

#### 3.1.3 UI Route to API Endpoint Mapping

The frontend routes (UI paths) and backend API endpoints serve different purposes:

- **UI Routes**: Used for browser navigation and frontend routing (e.g., React Router)
- **API Endpoints**: RESTful resource endpoints following parent-child hierarchy

| Screen (UI Path) | API Endpoint(s)                            | Description                         |
| ---------------- | ------------------------------------------ | ----------------------------------- |
| /vitals/input    | POST /admissions/:admissionId/vitals       | Record vital signs for an admission |
| /vitals/:id      | GET /admissions/:admissionId/vitals        | Get vital signs history             |
| -                | GET /admissions/:admissionId/vitals/latest | Get latest vital signs              |
| /admissions/new  | POST /admissions                           | Create new admission                |
| /admissions/:id  | GET /admissions/:admissionId               | Get admission details               |
| /patients        | GET /patients                              | List patients                       |
| /patients/:id    | GET /patients/:patientId                   | Get patient details                 |
| /rounds          | GET /rounds                                | List rounding sessions              |
| /rounds/:id      | GET /rounds/:roundId                       | Get round details                   |

**Design Rationale**:

Vital signs use nested routes under admissions (`/admissions/:admissionId/vitals`) because:

1. **Resource Ownership**: Vital signs belong to a specific admission record
2. **Access Control**: Ensures vitals are always associated with a valid admission
3. **RESTful Best Practice**: Parent-child relationship is clearly expressed in the URL
4. **Consistency**: Other admission-related resources follow the same pattern (medications, nursing-notes, io)

> **API Reference**: See [api-specification.md](reference/02-design/api-specification.md) Section 6 for complete API documentation

### 3.2 Hardware Interfaces

| ID        | Requirement           | Details                                           |
| --------- | --------------------- | ------------------------------------------------- |
| **HW-01** | Client Devices        | PC, tablets, smartphones with web browser support |
| **HW-02** | Network               | Hospital internal WiFi or wired network           |
| **HW-03** | Server Infrastructure | AWS ECS Fargate or equivalent cloud service       |

### 3.3 Software Interfaces

#### 3.3.1 External System Interfaces

| ID        | System                              | Integration Method                      | Data                                | Reference                                                                      |
| --------- | ----------------------------------- | --------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| **SI-01** | Existing Medical Program (EMR/OCS)  | pacs_bridge HL7 Gateway → REST API      | Patient basic info, medical history | [system-architecture.md](reference/02-design/system-architecture.md) Section 6 |
| **SI-02** | Laboratory Information System (LIS) | pacs_bridge HL7/FHIR Gateway → REST API | Lab test results, test history      | [lis-integration.md](reference/02-design/lis-integration.md)                   |
| **SI-03** | Google Sheets (legacy)              | One-time migration                      | Existing admission data             | [database-design.md](reference/02-design/database-design.md) Section 5         |
| **SI-04** | PACS (Phase 3+)                     | pacs_system DICOMweb REST API           | Imaging results viewer link         | -                                                                              |

#### 3.3.1.1 Integration Layer (pacs_bridge/pacs_system)

The system utilizes existing healthcare integration projects for protocol translation and external system connectivity:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Integration Layer Architecture                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐  │
│  │   EMR/OCS   │   │     LIS     │   │  Modality   │   │    PACS     │  │
│  │   (HL7)     │   │   (HL7)     │   │   (DICOM)   │   │   (DICOM)   │  │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘  │
│         │                 │                 │                 │          │
│         └─────────────────┼─────────────────┼─────────────────┘          │
│                           │                 │                            │
│                           ▼                 ▼                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                     pacs_bridge (C++23)                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │  │
│  │  │ HL7 v2.x   │  │ FHIR R4    │  │ Message    │  │ PACS       │   │  │
│  │  │ Gateway    │  │ Gateway    │  │ Queue      │  │ Adapter    │   │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    │                                      │
│                              REST API                                     │
│                                    │                                      │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                  hospital_erp_system (NestJS)                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │  │
│  │  │ Integration│  │ Patient    │  │ Lab Result │  │ PACS Link  │   │  │
│  │  │ Module     │  │ Module     │  │ Module     │  │ Module     │   │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

| Component       | Description                | Protocols                | Role                                                 |
| --------------- | -------------------------- | ------------------------ | ---------------------------------------------------- |
| **pacs_bridge** | HIS/RIS Integration Bridge | HL7 v2.x, FHIR R4, DICOM | Protocol translation, message routing, patient cache |
| **pacs_system** | PACS Server Implementation | DICOM, DICOMweb REST     | Imaging storage, MWL, MPPS, viewer URL generation    |

**Integration Benefits**:

- HL7 v2.x parser/builder already implemented (4-6 weeks saved)
- TLS, OAuth2, audit logging ready for security compliance
- Reliable message queue for guaranteed delivery
- FHIR R4 gateway for modern healthcare data exchange

#### 3.3.2 Internal Software Dependencies

| ID        | Software   | Version  | Purpose               |
| --------- | ---------- | -------- | --------------------- |
| **SW-01** | Node.js    | 20.x LTS | Runtime environment   |
| **SW-02** | PostgreSQL | 16.x     | Primary database      |
| **SW-03** | Redis      | 7.x      | Cache/Session storage |
| **SW-04** | Next.js    | 14.x     | Frontend framework    |
| **SW-05** | NestJS     | 10.x     | Backend framework     |

> **Traceability Reference**: [technology-stack.md](reference/01-overview/technology-stack.md)

### 3.4 Communication Interfaces

| ID        | Requirement     | Details                               | Reference                                                                            |
| --------- | --------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| **CI-01** | HTTPS (TLS 1.3) | Encryption for all API communications | [security-requirements.md](reference/03-security/security-requirements.md) Section 6 |
| **CI-02** | WebSocket       | Real-time room status updates         | [api-specification.md](reference/02-design/api-specification.md) Section 9           |
| **CI-03** | REST API        | Client-server communication           | [api-specification.md](reference/02-design/api-specification.md)                     |

---

## 4. System Features

### 4.1 Patient Management (F1: Patient Management)

#### 4.1.1 Feature Overview

Provides patient management functions including patient information inquiry, registration, modification, and integration with existing systems.

> **Traceability Reference**: [PRD.md](PRD.md) Section 5.2 FR-01

#### 4.1.2 Functional Requirements

| ID             | Requirement                     | Detailed Description                                                         | Priority | Source       |
| -------------- | ------------------------------- | ---------------------------------------------------------------------------- | -------- | ------------ |
| **REQ-FR-001** | Patient List Inquiry            | Support search (name, patient number), filter (admission status, ward), sort | Required | PRD FR-01-01 |
| **REQ-FR-002** | Patient Detail Inquiry          | Display basic info, admission info, vital history, medication history        | Required | PRD FR-01-02 |
| **REQ-FR-003** | Patient Registration            | New patient information input (name, date of birth, contact, etc.)           | Required | PRD FR-01-03 |
| **REQ-FR-004** | Patient Information Edit        | Edit contact, guardian info, allergies, etc.                                 | Required | PRD FR-01-04 |
| **REQ-FR-005** | Existing System Patient Inquiry | Search and retrieve patient information from medical program DB              | Required | PRD FR-01-05 |
| **REQ-FR-006** | Patient Information Sync        | Automatic synchronization of patient basic info with existing system         | Required | PRD FR-08-02 |

#### 4.1.3 User Story

```
US-01: Patient Search
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As an Admission Staff
I want to quickly search by patient name or patient number
So that I can immediately verify patient information during admission processing

Acceptance Criteria:
✓ Partial match search by patient name available
✓ Patient number search available
✓ Search results displayed within 2 seconds
✓ Direct access to detailed information from result list
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **Traceability Reference**: [PRD.md](PRD.md) Section 7.1

### 4.2 Room Management (F2: Room Management)

#### 4.2.1 Feature Overview

Provides real-time room status monitoring, vacant bed inquiry, and bed assignment functions.

> **Traceability Reference**: [PRD.md](PRD.md) Section 5.2 FR-02

#### 4.2.2 Functional Requirements

| ID             | Requirement             | Detailed Description                                     | Priority | Source       |
| -------------- | ----------------------- | -------------------------------------------------------- | -------- | ------------ |
| **REQ-FR-010** | Room Status Dashboard   | Real-time visualization by floor/room                    | Required | PRD FR-02-01 |
| **REQ-FR-011** | Vacant Bed Inquiry      | Filtering search for available beds (room type, floor)   | Required | PRD FR-02-02 |
| **REQ-FR-012** | Bed Assignment          | Bed designation during admission                         | Required | PRD FR-02-03 |
| **REQ-FR-013** | Real-time Status Update | WebSocket-based automatic refresh (within 3 seconds)     | Required | PRD FR-02-04 |
| **REQ-FR-014** | Bed Status Display      | Color-coded status (vacant/occupied/caution/maintenance) | Required | -            |
| **REQ-FR-015** | Bed Click Patient Info  | Patient summary popup on bed click                       | High     | -            |

#### 4.2.3 User Story

```
US-03: Room Status Inquiry
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As a Head Nurse
I want to see the entire ward status at a glance
So that I can efficiently manage beds and staff allocation

Acceptance Criteria:
✓ Display in floor-by-floor room layout format
✓ Color-coded bed status (vacant/occupied/caution)
✓ Brief patient info displayed on bed click
✓ Real-time updates (immediate reflection of admissions/discharges)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **Traceability Reference**: [PRD.md](PRD.md) Section 7.2

### 4.3 Admission Management (F3: Admission Management)

#### 4.3.1 Feature Overview

Provides admission registration, transfer processing, discharge processing, and admission history management functions.

> **Traceability Reference**: [PRD.md](PRD.md) Section 5.2 FR-03

#### 4.3.2 Functional Requirements

| ID             | Requirement                                   | Detailed Description                                              | Priority | Source       |
| -------------- | --------------------------------------------- | ----------------------------------------------------------------- | -------- | ------------ |
| **REQ-FR-020** | Admission Registration                        | Admission info input, bed assignment, attending staff designation | Required | PRD FR-03-01 |
| **REQ-FR-021** | Transfer Processing                           | Room transfer record, reason input                                | Required | PRD FR-03-02 |
| **REQ-FR-022** | Discharge Processing                          | Discharge info input, discharge summary, bed release              | Required | PRD FR-03-03 |
| **REQ-FR-023** | Admission History Inquiry                     | View past admission records by patient                            | Required | PRD FR-03-04 |
| **REQ-FR-024** | Existing System Integration on Admission      | Auto-retrieve patient info from existing medical program          | Required | -            |
| **REQ-FR-025** | Auto-refresh Dashboard on Admission/Discharge | Real-time update of room status dashboard                         | Required | -            |

#### 4.3.3 User Story

```
US-05: Admission Registration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As an Admission Staff
I want to process admission procedures quickly and accurately
So that patients can be assigned to rooms promptly

Acceptance Criteria:
✓ Auto-retrieve patient info from existing medical program
✓ Vacant bed selection available
✓ Attending physician/nurse designation
✓ Immediate room status dashboard update on admission completion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **Traceability Reference**: [PRD.md](PRD.md) Section 7.3

### 4.4 Vital Signs Management (F4: Vital Signs Management)

#### 4.4.1 Feature Overview

Provides patient vital signs input, inquiry, trend graphs, and abnormal value alert functions.

> **Traceability Reference**: [PRD.md](PRD.md) Section 5.2 FR-04

#### 4.4.2 Functional Requirements

| ID             | Requirement                    | Detailed Description                                                     | Priority | Source       |
| -------------- | ------------------------------ | ------------------------------------------------------------------------ | -------- | ------------ |
| **REQ-FR-030** | Vital Input                    | Input temperature, blood pressure, pulse, respiration, SpO2, blood sugar | High     | PRD FR-04-01 |
| **REQ-FR-031** | Vital Inquiry                  | Chronological history, latest values display                             | High     | PRD FR-04-02 |
| **REQ-FR-032** | Vital Trend Graph              | Period-based trend visualization (7 days, entire admission)              | High     | PRD FR-04-03 |
| **REQ-FR-033** | Abnormal Value Alert           | Warning display when normal range exceeded                               | Medium   | PRD FR-04-04 |
| **REQ-FR-034** | Mobile Vital Input             | Quick input with numeric keypad                                          | High     | -            |
| **REQ-FR-035** | Previous Measurement Reference | Display previous measurement on input screen                             | High     | -            |

#### 4.4.3 Normal Range Standards

| Item                     | Normal Range | Unit  |
| ------------------------ | ------------ | ----- |
| Temperature              | 36.1 ~ 37.2  | °C    |
| Systolic Blood Pressure  | 90 ~ 120     | mmHg  |
| Diastolic Blood Pressure | 60 ~ 80      | mmHg  |
| Pulse                    | 60 ~ 100     | bpm   |
| Respiratory Rate         | 12 ~ 20      | /min  |
| Oxygen Saturation        | 95 ~ 100     | %     |
| Blood Sugar (fasting)    | 70 ~ 100     | mg/dL |

> **Traceability Reference**: [glossary.md](reference/04-appendix/glossary.md) Section 1.2

### 4.5 Reports and Journals (F5: Reports and Notes)

#### 4.5.1 Feature Overview

Provides daily reports, I/O records, medication records, and nursing journal management functions.

> **Traceability Reference**: [PRD.md](PRD.md) Section 5.2 FR-05

#### 4.5.2 Functional Requirements

| ID             | Requirement            | Detailed Description                                                         | Priority | Source       |
| -------------- | ---------------------- | ---------------------------------------------------------------------------- | -------- | ------------ |
| **REQ-FR-040** | Daily Report Writing   | Patient status summary record (general condition, consciousness, pain, etc.) | High     | PRD FR-05-01 |
| **REQ-FR-041** | I/O Record             | Intake (oral, IV)/Output (urine, stool) input                                | High     | PRD FR-05-02 |
| **REQ-FR-042** | Medication Record      | Medication schedule and administration record                                | Medium   | PRD FR-05-03 |
| **REQ-FR-043** | Nursing Journal        | SOAP format nursing record writing                                           | Medium   | PRD FR-05-04 |
| **REQ-FR-044** | Report Review/Approval | Head nurse report review function                                            | Medium   | -            |
| **REQ-FR-045** | Report History Inquiry | View report history by date                                                  | High     | -            |

### 4.6 Rounding Management (F6: Rounding Management)

#### 4.6.1 Feature Overview

Provides rounding session creation, rounding record input, and rounding history inquiry functions.

> **Traceability Reference**: [PRD.md](PRD.md) Section 5.2 FR-06

#### 4.6.2 Functional Requirements

| ID             | Requirement               | Detailed Description                                        | Priority | Source       |
| -------------- | ------------------------- | ----------------------------------------------------------- | -------- | ------------ |
| **REQ-FR-050** | Rounding Session Creation | Round start/end management, attending physician designation | High     | PRD FR-06-01 |
| **REQ-FR-051** | Rounding Record Input     | Per-patient observation notes, instructions record          | High     | PRD FR-06-02 |
| **REQ-FR-052** | Rounding History Inquiry  | View past rounding records                                  | High     | PRD FR-06-03 |
| **REQ-FR-053** | Tablet Rounding Support   | Simultaneous patient info review and recording              | High     | -            |
| **REQ-FR-054** | Rounding Patient List     | Display rounding target patient list by ward                | High     | -            |
| **REQ-FR-055** | Rounding Session Start    | Transition session from PLANNED to IN_PROGRESS state        | High     | -            |
| **REQ-FR-056** | Rounding Session Pause    | Transition session from IN_PROGRESS to PAUSED state         | High     | -            |
| **REQ-FR-057** | Rounding Session Resume   | Transition session from PAUSED to IN_PROGRESS state         | High     | -            |
| **REQ-FR-058** | Rounding Session Complete | Transition session to COMPLETED state (terminal)            | High     | -            |
| **REQ-FR-059** | Rounding Session Cancel   | Transition session to CANCELLED state (terminal)            | Medium   | -            |

#### 4.6.3 State Machine

The rounding session follows a state machine pattern with the following states and transitions:

##### States

| State       | Description                                            |
| ----------- | ------------------------------------------------------ |
| PLANNED     | Session created but not yet started                    |
| IN_PROGRESS | Session actively in progress                           |
| PAUSED      | Session temporarily paused (e.g., emergency interrupt) |
| COMPLETED   | Session finished successfully (terminal state)         |
| CANCELLED   | Session cancelled before completion (terminal state)   |

##### State Transitions

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

##### Transition Rules

| From        | To          | Trigger  | Description                 |
| ----------- | ----------- | -------- | --------------------------- |
| PLANNED     | IN_PROGRESS | start    | Begin rounding session      |
| PLANNED     | CANCELLED   | cancel   | Cancel before starting      |
| IN_PROGRESS | PAUSED      | pause    | Temporarily pause session   |
| IN_PROGRESS | COMPLETED   | complete | Finish session successfully |
| PAUSED      | IN_PROGRESS | resume   | Resume paused session       |
| PAUSED      | COMPLETED   | complete | Complete from paused state  |
| PAUSED      | CANCELLED   | cancel   | Cancel paused session       |

##### Invalid Transitions

Terminal states (COMPLETED, CANCELLED) do not allow any outgoing transitions. Attempting invalid transitions results in an error response.

#### 4.6.4 User Story

```
US-09: Rounding Record (Tablet)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As an Attending Physician
I want to review patient info and record simultaneously during rounds
So that I can reduce separate recording time after rounds

Acceptance Criteria:
✓ Rounding patient list display
✓ Display recent vitals, key info per patient
✓ Observation notes, instructions input area
✓ Quick navigation to next patient
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
US-10: Rounding State Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As an Attending Physician
I want to control the state of my rounding session (start, pause, resume, complete)
So that I can handle interruptions and properly track rounding progress

Acceptance Criteria:
✓ Start a planned rounding session when ready
✓ Pause session for emergencies or interruptions
✓ Resume paused session to continue where left off
✓ Complete session when all patients visited
✓ Cancel session if rounding cannot be performed
✓ Receive clear error when invalid transition attempted
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **Traceability Reference**: [PRD.md](PRD.md) Section 7.5

### 4.7 Admin Functions (F7: Admin Functions)

#### 4.7.1 Feature Overview

Provides user account management, role/permission management, and audit log inquiry functions.

> **Traceability Reference**: [PRD.md](PRD.md) Section 5.2 FR-07

#### 4.7.2 Functional Requirements

| ID             | Requirement                | Detailed Description                                       | Priority | Source       |
| -------------- | -------------------------- | ---------------------------------------------------------- | -------- | ------------ |
| **REQ-FR-060** | User Account Management    | CRUD, password reset, account activation/deactivation      | Required | PRD FR-07-01 |
| **REQ-FR-061** | Role/Permission Management | RBAC-based permission settings, role creation/modification | Required | PRD FR-07-02 |
| **REQ-FR-062** | Audit Log Inquiry          | Access/change history inquiry by user, period, resource    | Required | PRD FR-07-03 |
| **REQ-FR-063** | Session Management         | Active session inquiry, forced logout                      | High     | -            |
| **REQ-FR-064** | System Settings            | Hospital info, ward settings, alert settings               | Medium   | -            |

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

| ID              | Requirement            | Target Value                       | Measurement Method               | Source      |
| --------------- | ---------------------- | ---------------------------------- | -------------------------------- | ----------- |
| **REQ-NFR-001** | Page Loading Time      | Within 3 seconds (95th percentile) | Lighthouse, Real User Monitoring | PRD NFR-P01 |
| **REQ-NFR-002** | API Response Time      | Within 500ms (95th percentile)     | APM Monitoring                   | PRD NFR-P02 |
| **REQ-NFR-003** | Concurrent Users       | 100 or more                        | Load Testing (k6, Artillery)     | PRD NFR-P03 |
| **REQ-NFR-004** | System Availability    | 99.5% or higher (monthly)          | Uptime Monitoring                | PRD NFR-P04 |
| **REQ-NFR-005** | Room Dashboard Refresh | Within 3 seconds                   | WebSocket Event Measurement      | -           |
| **REQ-NFR-006** | Database Response      | Within 100ms (simple queries)      | Query Monitoring                 | -           |

> **Traceability Reference**: [PRD.md](PRD.md) Section 6.1

### 5.2 Security Requirements

#### 5.2.1 Authentication Requirements

| ID              | Requirement              | Details                                                                    | Source                    |
| --------------- | ------------------------ | -------------------------------------------------------------------------- | ------------------------- |
| **REQ-NFR-010** | Password Policy          | 8+ characters, combination of upper/lowercase, numbers, special characters | security-requirements 2.1 |
| **REQ-NFR-011** | Password Hashing         | bcrypt (cost factor 12 or higher)                                          | security-requirements 2.2 |
| **REQ-NFR-012** | MFA Support              | TOTP (Google Authenticator compatible)                                     | PRD NFR-S04               |
| **REQ-NFR-013** | Session Timeout          | 30 minutes idle timeout, 8 hours absolute timeout                          | security-requirements 2.4 |
| **REQ-NFR-014** | Concurrent Session Limit | Maximum 3 sessions per user                                                | security-requirements 2.4 |
| **REQ-NFR-015** | Login Attempt Limit      | 15 minute lockout after 5 failed attempts                                  | security-requirements 2.1 |

> **Traceability Reference**: [security-requirements.md](reference/03-security/security-requirements.md) Section 2

#### 5.2.2 Data Protection Requirements

| ID              | Requirement                | Details                                                            | Source                    |
| --------------- | -------------------------- | ------------------------------------------------------------------ | ------------------------- |
| **REQ-NFR-020** | Data at Rest Encryption    | AES-256-GCM (sensitive data: SSN, medical records)                 | PRD NFR-S01               |
| **REQ-NFR-021** | Data in Transit Encryption | TLS 1.3                                                            | PRD NFR-S02               |
| **REQ-NFR-022** | Data Masking               | Partial masking of SSN, phone numbers (differential by permission) | security-requirements 4.4 |
| **REQ-NFR-023** | Access Control             | RBAC (Role-Based Access Control)                                   | PRD NFR-S05               |

> **Traceability Reference**: [security-requirements.md](reference/03-security/security-requirements.md) Section 4

#### 5.2.3 Audit and Logging Requirements

| ID              | Requirement              | Details                               | Retention Period | Source                    |
| --------------- | ------------------------ | ------------------------------------- | ---------------- | ------------------------- |
| **REQ-NFR-030** | Login/Logout Logs        | User, time, IP, result                | 2 years          | security-requirements 5.1 |
| **REQ-NFR-031** | Patient Info Access Logs | User, time, patient ID, viewed items  | 2 years          | security-requirements 5.1 |
| **REQ-NFR-032** | Data Change Logs         | Before/after values, modifier, time   | Permanent        | security-requirements 5.1 |
| **REQ-NFR-033** | Permission Change Logs   | Administrator, target, change details | Permanent        | security-requirements 5.1 |

> **Traceability Reference**: [PRD.md](PRD.md) Section 6.2, [security-requirements.md](reference/03-security/security-requirements.md) Section 5

### 5.3 Reliability Requirements

| ID              | Requirement                    | Target                              | Measurement Method           |
| --------------- | ------------------------------ | ----------------------------------- | ---------------------------- |
| **REQ-NFR-040** | System Availability            | 99.5% (monthly)                     | Uptime Monitoring            |
| **REQ-NFR-041** | Mean Time To Recovery (MTTR)   | Within 1 hour                       | Incident Response Records    |
| **REQ-NFR-042** | Recovery Point Objective (RPO) | Within 1 minute                     | WAL Archiving                |
| **REQ-NFR-043** | Automatic Failover             | DB Multi-AZ, container auto-restart | Infrastructure Configuration |

> **Traceability Reference**: [system-architecture.md](reference/02-design/system-architecture.md) Section 7

### 5.4 Maintainability Requirements

| ID              | Requirement        | Details                                             | Source      |
| --------------- | ------------------ | --------------------------------------------------- | ----------- |
| **REQ-NFR-050** | Code Quality       | ESLint, Prettier applied, static analysis pass      | PRD NFR-M01 |
| **REQ-NFR-051** | Test Coverage      | 80% or higher (Unit + Integration)                  | PRD NFR-M02 |
| **REQ-NFR-052** | API Documentation  | OpenAPI 3.0 (Swagger) auto-generation               | PRD NFR-M03 |
| **REQ-NFR-053** | Structured Logging | JSON format, request trace ID included              | PRD NFR-M04 |
| **REQ-NFR-054** | Modular Design     | Domain-specific independent modules, loose coupling | -           |

> **Traceability Reference**: [PRD.md](PRD.md) Section 6.5

### 5.5 Compatibility Requirements

| ID              | Requirement           | Details                                                  | Source      |
| --------------- | --------------------- | -------------------------------------------------------- | ----------- |
| **REQ-NFR-060** | Browser Compatibility | Chrome, Edge, Safari (latest 2 versions)                 | PRD NFR-C01 |
| **REQ-NFR-061** | Responsive Support    | PC (1024px+), Tablet (768px+), Mobile (320px+)           | PRD NFR-C02 |
| **REQ-NFR-062** | PWA Support           | Offline basic functions, installable, push notifications | PRD NFR-C03 |

> **Traceability Reference**: [PRD.md](PRD.md) Section 6.4

### 5.6 Scalability Requirements

| ID              | Requirement        | Details                                          |
| --------------- | ------------------ | ------------------------------------------------ |
| **REQ-NFR-070** | Horizontal Scaling | Container-based auto-scaling support             |
| **REQ-NFR-071** | Database Scaling   | Read replica support, vertical scaling if needed |
| **REQ-NFR-072** | Cache Scaling      | Redis cluster mode support                       |

> **Traceability Reference**: [system-architecture.md](reference/02-design/system-architecture.md) Section 7

---

## 6. Other Requirements

### 6.1 Regulatory Compliance Requirements

| ID              | Regulation                                     | Requirement                                            | Implementation                             | Source                  |
| --------------- | ---------------------------------------------- | ------------------------------------------------------ | ------------------------------------------ | ----------------------- |
| **REQ-REG-001** | Personal Information Protection Act Article 23 | Separate consent for sensitive info, encrypted storage | Consent management, AES-256 encryption     | glossary 5.1            |
| **REQ-REG-002** | Personal Information Protection Act Article 24 | SSN encryption required                                | pgcrypto encryption                        | security-requirements 4 |
| **REQ-REG-003** | Personal Information Protection Act Article 29 | Access record retention                                | Audit log retention for 2 years            | security-requirements 5 |
| **REQ-REG-004** | Medical Service Act Article 22                 | Medical record retention obligation                    | Data retention for 10 years                | glossary 5.2            |
| **REQ-REG-005** | Medical Service Act Article 21                 | Medical record access restriction                      | RBAC access control                        | security-requirements 3 |
| **REQ-REG-006** | Electronic Documents Act                       | Integrity, authenticity assurance                      | Change history tracking, digital signature | -                       |

> **Traceability Reference**: [PRD.md](PRD.md) Section 6.3, [glossary.md](reference/04-appendix/glossary.md) Section 5

### 6.2 Data Retention Requirements

| Data Type        | Retention Period | Basis                               |
| ---------------- | ---------------- | ----------------------------------- |
| Medical Records  | 10 years         | Medical Service Act                 |
| Surgical Records | 10 years         | Medical Service Act                 |
| Nursing Records  | 5 years          | Medical Service Act                 |
| Patient Registry | 5 years          | Medical Service Act                 |
| Access Logs      | 2 years          | Personal Information Protection Act |
| Change History   | Permanent        | Internal Policy                     |

> **Traceability Reference**: [glossary.md](reference/04-appendix/glossary.md) Section 5.2

### 6.3 Internationalization Requirements

| ID               | Requirement      | Details                                                  |
| ---------------- | ---------------- | -------------------------------------------------------- |
| **REQ-I18N-001** | Default Language | Korean                                                   |
| **REQ-I18N-002** | Date/Time Format | Korean Standard (KST, YYYY-MM-DD)                        |
| **REQ-I18N-003** | Number Format    | Korean Standard (decimal point ., thousands separator ,) |

### 6.4 Documentation Requirements

| ID              | Requirement          | Target Audience       |
| --------------- | -------------------- | --------------------- |
| **REQ-DOC-001** | User Manual          | End Users             |
| **REQ-DOC-002** | Administrator Manual | System Administrators |
| **REQ-DOC-003** | API Documentation    | Developers            |
| **REQ-DOC-004** | Installation Guide   | DevOps                |

---

## 7. Requirements Traceability Matrix

### 7.1 Functional Requirements Traceability

| Requirement ID | Requirement Name                | Source Document | Source Section | Test Case   |
| -------------- | ------------------------------- | --------------- | -------------- | ----------- |
| REQ-FR-001     | Patient List Inquiry            | PRD.md          | FR-01-01       | TC-PAT-001  |
| REQ-FR-002     | Patient Detail Inquiry          | PRD.md          | FR-01-02       | TC-PAT-002  |
| REQ-FR-003     | Patient Registration            | PRD.md          | FR-01-03       | TC-PAT-003  |
| REQ-FR-004     | Patient Info Edit               | PRD.md          | FR-01-04       | TC-PAT-004  |
| REQ-FR-005     | Existing System Patient Inquiry | PRD.md          | FR-01-05       | TC-INT-001  |
| REQ-FR-006     | Patient Info Sync               | PRD.md          | FR-08-02       | TC-INT-002  |
| REQ-FR-010     | Room Status Dashboard           | PRD.md          | FR-02-01       | TC-ROOM-001 |
| REQ-FR-011     | Vacant Bed Inquiry              | PRD.md          | FR-02-02       | TC-ROOM-002 |
| REQ-FR-012     | Bed Assignment                  | PRD.md          | FR-02-03       | TC-ROOM-003 |
| REQ-FR-013     | Real-time Status Update         | PRD.md          | FR-02-04       | TC-ROOM-004 |
| REQ-FR-020     | Admission Registration          | PRD.md          | FR-03-01       | TC-ADM-001  |
| REQ-FR-021     | Transfer Processing             | PRD.md          | FR-03-02       | TC-ADM-002  |
| REQ-FR-022     | Discharge Processing            | PRD.md          | FR-03-03       | TC-ADM-003  |
| REQ-FR-023     | Admission History Inquiry       | PRD.md          | FR-03-04       | TC-ADM-004  |
| REQ-FR-030     | Vital Input                     | PRD.md          | FR-04-01       | TC-VIT-001  |
| REQ-FR-031     | Vital Inquiry                   | PRD.md          | FR-04-02       | TC-VIT-002  |
| REQ-FR-032     | Vital Trend Graph               | PRD.md          | FR-04-03       | TC-VIT-003  |
| REQ-FR-033     | Abnormal Value Alert            | PRD.md          | FR-04-04       | TC-VIT-004  |
| REQ-FR-040     | Daily Report Writing            | PRD.md          | FR-05-01       | TC-RPT-001  |
| REQ-FR-041     | I/O Record                      | PRD.md          | FR-05-02       | TC-RPT-002  |
| REQ-FR-042     | Medication Record               | PRD.md          | FR-05-03       | TC-RPT-003  |
| REQ-FR-043     | Nursing Journal                 | PRD.md          | FR-05-04       | TC-RPT-004  |
| REQ-FR-050     | Rounding Session Creation       | PRD.md          | FR-06-01       | TC-RND-001  |
| REQ-FR-051     | Rounding Record Input           | PRD.md          | FR-06-02       | TC-RND-002  |
| REQ-FR-052     | Rounding History Inquiry        | PRD.md          | FR-06-03       | TC-RND-003  |
| REQ-FR-055     | Rounding Session Start          | SRS.md          | 4.6.2          | TC-RND-004  |
| REQ-FR-056     | Rounding Session Pause          | SRS.md          | 4.6.2          | TC-RND-005  |
| REQ-FR-057     | Rounding Session Resume         | SRS.md          | 4.6.2          | TC-RND-006  |
| REQ-FR-058     | Rounding Session Complete       | SRS.md          | 4.6.2          | TC-RND-007  |
| REQ-FR-059     | Rounding Session Cancel         | SRS.md          | 4.6.2          | TC-RND-008  |
| REQ-FR-060     | User Account Management         | PRD.md          | FR-07-01       | TC-ADM-010  |
| REQ-FR-061     | Role/Permission Management      | PRD.md          | FR-07-02       | TC-ADM-011  |
| REQ-FR-062     | Audit Log Inquiry               | PRD.md          | FR-07-03       | TC-ADM-012  |

### 7.2 Non-Functional Requirements Traceability

| Requirement ID | Requirement Name           | Source Document          | Source Section | Verification Method     |
| -------------- | -------------------------- | ------------------------ | -------------- | ----------------------- |
| REQ-NFR-001    | Page Loading Time          | PRD.md                   | NFR-P01        | Performance Testing     |
| REQ-NFR-002    | API Response Time          | PRD.md                   | NFR-P02        | APM Monitoring          |
| REQ-NFR-003    | Concurrent Users           | PRD.md                   | NFR-P03        | Load Testing            |
| REQ-NFR-004    | System Availability        | PRD.md                   | NFR-P04        | Availability Monitoring |
| REQ-NFR-010    | Password Policy            | security-requirements.md | 2.1            | Security Testing        |
| REQ-NFR-020    | Data at Rest Encryption    | PRD.md                   | NFR-S01        | Security Audit          |
| REQ-NFR-021    | Data in Transit Encryption | PRD.md                   | NFR-S02        | Security Audit          |
| REQ-NFR-030    | Login/Logout Logs          | security-requirements.md | 5.1            | Log Verification        |
| REQ-NFR-050    | Code Quality               | PRD.md                   | NFR-M01        | Static Analysis         |
| REQ-NFR-051    | Test Coverage              | PRD.md                   | NFR-M02        | Coverage Report         |

### 7.3 Requirements-Design Document Mapping

| Requirements Area    | Related Design Document  | Related Section                     |
| -------------------- | ------------------------ | ----------------------------------- |
| Patient Management   | database-design.md       | 3.2 patient schema                  |
| Patient Management   | api-specification.md     | 3. Patient Management API           |
| Room Management      | database-design.md       | 3.3 room schema                     |
| Room Management      | api-specification.md     | 4. Room Management API              |
| Admission Management | database-design.md       | 3.4 admission schema                |
| Admission Management | api-specification.md     | 5. Admission Management API         |
| Reports/Journals     | database-design.md       | 3.5 report schema                   |
| Reports/Journals     | api-specification.md     | 6. Reports and Journals API         |
| Rounding             | database-design.md       | 3.6 rounding schema                 |
| Rounding             | api-specification.md     | 7. Rounding API                     |
| Admin Functions      | database-design.md       | 3.1 public schema, 3.7 audit schema |
| Admin Functions      | api-specification.md     | 8. Admin API                        |
| Security             | security-requirements.md | All                                 |
| System Architecture  | system-architecture.md   | All                                 |

---

## 8. Appendices

### Appendix A: Data Model Reference

For detailed data models, please refer to the following documents:

- **ERD**: [database-design.md](reference/02-design/database-design.md) Section 2
- **Table Definitions**: [database-design.md](reference/02-design/database-design.md) Section 3

### Appendix B: API Specification Reference

For detailed API specifications, please refer to the following documents:

- **REST API**: [api-specification.md](reference/02-design/api-specification.md)
- **WebSocket API**: [api-specification.md](reference/02-design/api-specification.md) Section 9

### Appendix C: Screen Design Reference

For detailed screen designs, please refer to the following documents:

- **Screen Design**: [screen-design.md](reference/02-design/ui-design.md)
- **Wireframes**: [PRD.md](PRD.md) Section 8.2

### Appendix D: Requirement ID System

```
Requirement ID Format: REQ-{CATEGORY}-{NUMBER}

Categories:
- FR    : Functional Requirement
- NFR   : Non-Functional Requirement
- REG   : Regulatory Requirement
- I18N  : Internationalization
- DOC   : Documentation

Number: 3-digit number (001-999)

Examples:
- REQ-FR-001  : First functional requirement
- REQ-NFR-010 : Tenth non-functional requirement
- REQ-REG-001 : First regulatory requirement
```

### Appendix E: Priority Definitions

| Priority            | Definition                                             | Release        |
| ------------------- | ------------------------------------------------------ | -------------- |
| **Required (Must)** | Core system functions, mandatory regulatory compliance | MVP (Phase 2)  |
| **High**            | Major user scenario support                            | Beta (Phase 3) |
| **Medium**          | User convenience improvements                          | GA (Phase 4)   |
| **Low**             | Future enhancement items                               | Later releases |

### Appendix F: Glossary Reference

For detailed term definitions, please refer to the following document:

- [glossary.md](reference/04-appendix/glossary.md)

---

## Approval

| Role                    | Name | Signature | Date |
| ----------------------- | ---- | --------- | ---- |
| Author                  |      |           |      |
| Technical Reviewer      |      |           |      |
| PM                      |      |           |      |
| Customer Representative |      |           |      |

---

_This document was created based on IEEE 830-1998 and ISO/IEC/IEEE 29148:2018 standards._
