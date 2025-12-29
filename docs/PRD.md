# Product Requirements Document (PRD)
# Inpatient Management ERP System

---

## Document Information

| Item | Content |
|------|---------|
| Document Version | 0.1.0.0 |
| Created Date | 2025-12-29 |
| Status | Draft |
| Administrator | kcenon@naver.com |
| Product Name | Inpatient Management ERP System |

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Definition](#2-problem-definition)
3. [Product Goals](#3-product-goals)
4. [User Definition](#4-user-definition)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [User Stories](#7-user-stories)
8. [Screen Overview](#8-screen-overview)
9. [Success Metrics](#9-success-metrics)
10. [Schedule and Milestones](#10-schedule-and-milestones)
11. [Constraints and Assumptions](#11-constraints-and-assumptions)
12. [Risk Factors](#12-risk-factors)
13. [Appendix](#13-appendix)

---

## 1. Product Overview

### 1.1 Product Vision

> **"An integrated ERP system that enhances healthcare staff efficiency and strengthens patient safety through digital transformation of inpatient management"**

### 1.2 Background

Currently, the hospital's inpatient management is conducted manually using Google Sheets. This has resulted in the following issues:

- **Data Security Vulnerability**: Patient personal information exposed in cloud spreadsheets
- **Work Inefficiency**: Duplicate entry of the same information, inability to share information in real-time
- **System Fragmentation**: Lack of data integration with existing medical practice programs
- **Regulatory Compliance Difficulties**: Difficulty meeting Medical Service Act and Personal Information Protection Act requirements

### 1.3 Solution Summary

The Inpatient Management ERP System provides the following:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Core Value Proposition                    │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Real-time data integration with existing medical programs    │
│  ✓ Real-time monitoring of room status and patient conditions   │
│  ✓ Mobile support for rounds/rounding reports                   │
│  ✓ Compliance with Medical Service Act and Privacy Laws         │
│  ✓ Intuitive UI/UX for quick information input and retrieval    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Platform Configuration

| Platform | Purpose | Primary Users |
|----------|---------|---------------|
| **PC Web** | Administrative/admission tasks, detailed inquiries | Admissions Office, System Administrator |
| **Tablet Web** | Rounds/rounding, mobile input | Physicians, Head Nurses |
| **Mobile Web (PWA)** | Quick inquiry/input | Nurses, Medical Staff |

---

## 2. Problem Definition

### 2.1 Current State (As-Is)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Current Work Process                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Google Sheets        Existing Medical Program    Paper Records │
│   ┌─────────┐           ┌─────────┐            ┌─────────┐     │
│   │Inpatient │           │ Patient │            │  Vital  │     │
│   │  List   │    ❌     │  Info   │     ❌     │ Records │     │
│   │         │ No Sync   │         │  No Sync   │         │     │
│   └─────────┘           └─────────┘            └─────────┘     │
│        │                      │                      │          │
│        └──────────────────────┼──────────────────────┘          │
│                               ▼                                  │
│                    ┌─────────────────────┐                      │
│                    │  Manual Integration  │                      │
│                    │ (Inefficient, Errors)│                      │
│                    └─────────────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Issues

| Problem Area | Details | Impact Level |
|--------------|---------|--------------|
| **Data Security** | Sensitive information exposed in Google Sheets, lack of access control | High |
| **Work Efficiency** | Duplicate entry of same information, inability to grasp real-time status | High |
| **System Integration** | Data inconsistency with existing medical practice programs | Medium |
| **Mobile Support** | PC access required during rounds, unable to enter data immediately | Medium |
| **Regulatory Compliance** | Failure to meet Medical Service Act/Personal Information Protection Act requirements | High |

### 2.3 Target State (To-Be)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Target Work Process                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │            Inpatient Management ERP System               │  │
│   │                                                          │  │
│   │   ┌─────────┐    ┌─────────┐    ┌─────────┐            │  │
│   │   │ Patient │◄──►│  Room   │◄──►│ Reports │            │  │
│   │   │ Mgmt    │    │  Mgmt   │    │         │            │  │
│   │   └─────────┘    └─────────┘    └─────────┘            │  │
│   │        ▲              ▲              ▲                  │  │
│   │        │              │              │                  │  │
│   │        └──────────────┼──────────────┘                  │  │
│   │                       ▼                                  │  │
│   │              ┌─────────────────┐                        │  │
│   │              │   Integrated DB │                        │  │
│   │              │   (PostgreSQL)  │                        │  │
│   │              └────────┬────────┘                        │  │
│   │                       │                                  │  │
│   └───────────────────────┼─────────────────────────────────┘  │
│                           │                                     │
│                    ┌──────┴──────┐                              │
│                    │ Integration │                              │
│                    │    Layer    │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
│                    ┌──────┴──────┐                              │
│                    │   Existing  │                              │
│                    │   Medical   │                              │
│                    │   Program   │                              │
│                    └─────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Product Goals

### 3.1 Business Goals

| # | Goal | Metric | Target Value |
|---|------|--------|--------------|
| G1 | Improve Work Efficiency | Patient information entry time | 50% reduction |
| G2 | Improve Data Accuracy | Input error rate | 80% reduction |
| G3 | Achieve Regulatory Compliance | Security audit pass | 100% |
| G4 | User Satisfaction | NPS (Net Promoter Score) | 50 or above |

### 3.2 Product Goals

| # | Goal | Description |
|---|------|-------------|
| P1 | **System Integration** | Real-time data integration with existing medical practice programs |
| P2 | **Real-time Status Monitoring** | Immediate confirmation of room status and patient conditions |
| P3 | **Mobile Work Support** | Rounding records and vital sign entry on tablet/mobile |
| P4 | **Security Compliance** | Meet Medical Service Act and Personal Information Protection Act requirements |

### 3.3 Success Criteria

```
┌─────────────────────────────────────────────────────────────────┐
│                        Release Success Criteria                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Must Have                                                   │
│  ────────────────────                                           │
│  • Patient registration/inquiry/modification functionality      │
│  • Real-time room status board updates                          │
│  • Complete admission/discharge process operation               │
│  • Data inquiry integration with existing medical programs      │
│  • User authentication and permission management                │
│  • Audit log recording                                          │
│                                                                  │
│  📋 Should Have                                                 │
│  ────────────────────                                           │
│  • Mobile vital sign input                                      │
│  • Tablet support for rounding records                          │
│  • Nursing log creation                                         │
│  • Alert functionality (abnormal values, etc.)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. User Definition

### 4.1 User Personas

#### Persona 1: Admissions Office Staff (Lee Won-mu)

| Item | Content |
|------|---------|
| **Role** | Admissions Office Supervisor |
| **Main Tasks** | Admission/discharge procedures, room assignment, patient registration |
| **Technical Level** | Intermediate (familiar with PC web) |
| **Pain Point** | Checking patient information from multiple sources, difficulty grasping real-time room status |
| **Expected Value** | View all information on one screen, quick admission/discharge processing |

#### Persona 2: Staff Nurse (Kim Gan-ho)

| Item | Content |
|------|---------|
| **Role** | Ward Nurse |
| **Main Tasks** | Vital measurements, nursing records, medication management |
| **Technical Level** | Beginner-Intermediate (prefers mobile) |
| **Pain Point** | Can only enter data at PC, takes notes during rounds and re-enters later |
| **Expected Value** | Immediate entry at patient bedside, quick access to previous records |

#### Persona 3: Attending Physician (Dr. Park Ui-sa)

| Item | Content |
|------|---------|
| **Role** | Internal Medicine Specialist |
| **Main Tasks** | Rounds, prescriptions, treatment plan development |
| **Technical Level** | Intermediate (uses tablet) |
| **Pain Point** | Time spent gathering patient information during rounds, delayed record entry |
| **Expected Value** | Patient information at a glance, immediate recording during rounds |

#### Persona 4: Head Nurse (Choi Su-gan)

| Item | Content |
|------|---------|
| **Role** | Ward Head Nurse |
| **Main Tasks** | Ward management, nursing log review, rounding |
| **Technical Level** | Intermediate |
| **Pain Point** | Difficulty grasping overall status, delayed awareness of problem patients |
| **Expected Value** | Dashboard for overall status, alerts for patients requiring attention |

### 4.2 Role-Based Permissions

| Function | System Admin | Physician | Head Nurse | Nurse | Admissions |
|----------|:------------:|:---------:|:----------:|:-----:|:----------:|
| **Patient Information** |
| View | ✅ | ✅ | ✅ | ✅ (assigned) | ✅ |
| Register | ✅ | ❌ | ❌ | ❌ | ✅ |
| Modify | ✅ | ✅ (own patients) | ✅ | ❌ | ✅ |
| **Room Management** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assign/Transfer | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Reports/Logs** |
| View | ✅ | ✅ | ✅ | ✅ (assigned) | ❌ |
| Create | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Administrative Functions** |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 5. Functional Requirements

### 5.1 Functional Scope Overview

```
Inpatient Management ERP
├── 1. System Integration (Interface)
│   ├── Existing medical program integration (EMR/OCS)
│   ├── Laboratory Information System integration (LIS)
│   └── Patient basic information synchronization
│
├── 2. Room and Patient Management
│   ├── Room status board
│   ├── Admission processing
│   ├── Room transfer processing
│   └── Discharge processing
│
├── 3. Reports and Logs
│   ├── Vital sign management
│   ├── I/O (Intake/Output)
│   ├── Medication records
│   ├── Nursing logs
│   └── Rounding records
│
└── 4. Administrator Functions
    ├── User account management
    ├── Role/permission management
    └── Audit logs
```

### 5.2 Core Function Details

#### FR-01: Patient Management

| ID | Function | Priority | Description |
|----|----------|:--------:|-------------|
| FR-01-01 | Patient List Inquiry | **Required** | Search, filter, sort support |
| FR-01-02 | Patient Detail Inquiry | **Required** | Basic info, admission info, history |
| FR-01-03 | Patient Registration | **Required** | New patient information entry |
| FR-01-04 | Patient Information Modification | **Required** | Modify contact, guardian info, etc. |
| FR-01-05 | Existing System Patient Inquiry | **Required** | Medical program patient search |

#### FR-02: Room Management

| ID | Function | Priority | Description |
|----|----------|:--------:|-------------|
| FR-02-01 | Room Status Board | **Required** | Real-time status by floor/room |
| FR-02-02 | Available Bed Inquiry | **Required** | Search available beds |
| FR-02-03 | Bed Assignment | **Required** | Assign bed upon admission |
| FR-02-04 | Real-time Status Updates | **Required** | WebSocket-based automatic refresh |

#### FR-03: Admission/Discharge Management

| ID | Function | Priority | Description |
|----|----------|:--------:|-------------|
| FR-03-01 | Admission Registration | **Required** | Admission info entry, bed assignment |
| FR-03-02 | Room Transfer Processing | **Required** | Room transfer recording |
| FR-03-03 | Discharge Processing | **Required** | Discharge info entry, bed release |
| FR-03-04 | Admission History Inquiry | **Required** | Past admission record inquiry |

#### FR-04: Vital Signs

| ID | Function | Priority | Description |
|----|----------|:--------:|-------------|
| FR-04-01 | Vital Sign Entry | High | Temperature, blood pressure, pulse, respiration, SpO2 |
| FR-04-02 | Vital Sign Inquiry | High | Chronological history, latest values |
| FR-04-03 | Vital Sign Trend Graph | High | Period-based trend visualization |
| FR-04-04 | Abnormal Value Alerts | Medium | Alerts when outside normal range |

#### FR-05: Reports/Logs

| ID | Function | Priority | Description |
|----|----------|:--------:|-------------|
| FR-05-01 | Daily Report Creation | High | Patient status summary recording |
| FR-05-02 | I/O Recording | High | Intake/output entry |
| FR-05-03 | Medication Records | Medium | Medication schedule and administration records |
| FR-05-04 | Nursing Logs | Medium | SOAP format nursing records |

#### FR-06: Rounding

| ID | Function | Priority | Description |
|----|----------|:--------:|-------------|
| FR-06-01 | Rounding Session Creation | High | Round start/end management |
| FR-06-02 | Rounding Record Entry | High | Patient-specific observation recording |
| FR-06-03 | Rounding History Inquiry | High | Past rounding record inquiry |

#### FR-07: Administrator Functions

| ID | Function | Priority | Description |
|----|----------|:--------:|-------------|
| FR-07-01 | User Account Management | **Required** | CRUD, password reset |
| FR-07-02 | Role/Permission Management | **Required** | RBAC-based permission settings |
| FR-07-03 | Audit Log Inquiry | **Required** | Access/modification history inquiry |

#### FR-08: System Integration

| ID | Function | Priority | Description |
|----|----------|:--------:|-------------|
| FR-08-01 | Existing System Patient Inquiry | **Required** | Medical program (EMR/OCS) DB inquiry |
| FR-08-02 | Patient Information Sync | **Required** | Automatic basic info integration |
| FR-08-03 | Lab Results Inquiry (LIS) | **Required** | LIS integration, lab test results inquiry |
| FR-08-04 | Prescription Inquiry | Medium | Current prescriptions, medication history |
| FR-08-05 | PACS Link Integration | Low | Link to PACS viewer for imaging results (Phase 3+) |

### 5.3 Function Priority Matrix

```
                    Business Value
                 High         Medium       Low
          ┌─────────────┬─────────────┬─────────────┐
    High  │Patient Mgmt │Vital Entry  │             │
          │Room Status  │I/O Records  │             │
          │Admission/   │Rounding     │             │
Imple-    │Discharge    │             │             │
menta-├─────────────┼─────────────┼─────────────┤
tion  Med │Daily Reports│Nursing Logs │             │
Feasi-    │User Mgmt    │Medication   │             │
bility    │Audit Logs   │Records      │             │
          │             │             │             │
   ├─────────────┼─────────────┼─────────────┤
    Low   │             │Alerts       │Statistics   │
          │             │             │Analysis     │
          └─────────────┴─────────────┴─────────────┘

MVP Scope: High Business Value + High Implementation Feasibility
```

---

## 6. Non-Functional Requirements

### 6.1 Performance Requirements

| ID | Requirement | Target Value | Measurement Method |
|----|-------------|--------------|-------------------|
| NFR-P01 | Page Loading Time | Within 3 seconds | Lighthouse |
| NFR-P02 | API Response Time | Within 500ms | APM Monitoring |
| NFR-P03 | Concurrent Users | 100+ | Load Testing |
| NFR-P04 | System Availability | 99.5%+ | Uptime Monitoring |

### 6.2 Security Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| NFR-S01 | Data Encryption (At Rest) | AES-256-GCM (sensitive data) |
| NFR-S02 | Data Encryption (In Transit) | TLS 1.3 |
| NFR-S03 | Authentication | JWT + Refresh Token |
| NFR-S04 | Multi-Factor Authentication | MFA (TOTP) support |
| NFR-S05 | Access Control | RBAC (Role-Based) |
| NFR-S06 | Audit Logs | Record all data access/modifications |
| NFR-S07 | Session Management | 30-minute idle timeout |
| NFR-S08 | Password Policy | 8+ characters, complexity rules |

### 6.3 Regulatory Compliance

| Law/Regulation | Requirement | Implementation Approach |
|----------------|-------------|------------------------|
| **Personal Information Protection Act** | Sensitive data encryption | Encrypt resident registration number, medical info at rest |
| | 2-year access record retention | 2-year audit log retention |
| **Medical Service Act** | 5-year medical record retention | Data retention policy |
| | Medical record access control | RBAC permission management |
| **Electronic Documents Act** | Digital signature, integrity | Change history tracking |

### 6.4 Compatibility

| ID | Requirement | Details |
|----|-------------|---------|
| NFR-C01 | Browser Compatibility | Chrome, Edge, Safari (latest 2 versions) |
| NFR-C02 | Responsive Support | PC (1024px+), Tablet (768px+), Mobile (320px+) |
| NFR-C03 | PWA Support | Offline basic functionality, installable |

### 6.5 Maintainability

| ID | Requirement | Details |
|----|-------------|---------|
| NFR-M01 | Code Quality | ESLint, Prettier applied |
| NFR-M02 | Test Coverage | 80%+ |
| NFR-M03 | API Documentation | OpenAPI 3.0 (Swagger) |
| NFR-M04 | Logging | Structured logs, trace ID |

---

## 7. User Stories

### 7.1 Epic 1: Patient Management

```
US-01: Patient Search
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As an Admissions Office Staff
I want to quickly search by patient name or patient number
So that I can immediately verify patient information during admission processing

Acceptance Criteria:
✓ Partial match search by patient name possible
✓ Patient number search possible
✓ Search results displayed within 2 seconds
✓ Direct access to detailed information from result list
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
US-02: Patient Detail Information Inquiry
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As an Attending Physician
I want to view the patient's current status and history on one screen
So that I can quickly assess patient condition during rounds

Acceptance Criteria:
✓ Basic info (name, age, diagnosis) displayed at top
✓ Current admission info (room, admission date, attending physician) displayed
✓ Recent vital signs displayed
✓ Tab navigation for detailed information
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 7.2 Epic 2: Room Management

```
US-03: Room Status Inquiry
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As a Head Nurse
I want to view the entire ward status at a glance
So that I can efficiently manage beds and staff allocation

Acceptance Criteria:
✓ Displayed as floor-by-floor room layout
✓ Each bed status (empty/occupied/attention) distinguished by color
✓ Brief patient info displayed on bed click
✓ Real-time updates (immediate reflection of admissions/discharges)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
US-04: Available Bed Search
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As an Admissions Office Staff
I want to quickly find available beds
So that I can assign appropriate beds to admission patients

Acceptance Criteria:
✓ Filtering by room type (single, double, etc.)
✓ Filtering by floor
✓ Display as available bed list or layout view
✓ Proceed directly to admission registration with selected bed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 7.3 Epic 3: Admission/Discharge Management

```
US-05: Admission Registration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As an Admissions Office Staff
I want to process admission quickly and accurately
So that the patient can be admitted to the room promptly

Acceptance Criteria:
✓ Automatic patient info retrieval from existing medical program
✓ Available bed selection
✓ Attending physician/nurse assignment
✓ Immediate room status board update upon admission completion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
US-06: Discharge Processing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As an Admissions Office Staff
I want to process discharge systematically
So that the bed becomes immediately available after discharge

Acceptance Criteria:
✓ Discharge reason and discharge summary entry
✓ Follow-up care plan recording
✓ Automatic bed status change upon discharge completion
✓ Record added to patient admission history
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 7.4 Epic 4: Vital Signs

```
US-07: Vital Sign Entry (Mobile)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As a Staff Nurse
I want to enter vitals immediately at the patient bedside
So that I can reduce time spent taking notes and re-entering later

Acceptance Criteria:
✓ Quick entry via numeric keypad
✓ Previous measurement values displayed for reference
✓ Warning displayed when outside normal range
✓ Quick navigation to next patient after saving
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
US-08: Vital Sign Trend Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As an Attending Physician
I want to view patient vital sign changes as a graph
So that I can easily understand patient condition changes

Acceptance Criteria:
✓ Graphs by item (temperature, blood pressure, pulse, etc.)
✓ Period selection available (last 7 days, entire admission, etc.)
✓ Abnormal value points highlighted
✓ Click on graph point to display detailed data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 7.5 Epic 5: Rounding

```
US-09: Rounding Records (Tablet)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As an Attending Physician
I want to view patient information and record simultaneously during rounds
So that I can reduce separate recording time after rounds

Acceptance Criteria:
✓ Rounding patient list displayed
✓ Recent vitals, key information displayed per patient
✓ Input area for observations and instructions
✓ Quick navigation to next patient
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 8. Screen Overview

### 8.1 Screen List

| # | Screen Name | Path | Description | Target Users |
|---|-------------|------|-------------|--------------|
| 1 | Login | /login | User authentication | All |
| 2 | Dashboard | / | Key status summary | All |
| 3 | Patient List | /patients | Patient search/inquiry | All |
| 4 | Patient Detail | /patients/:id | Patient info detail | All |
| 5 | Room Status Board | /rooms | Floor-by-floor room status | All |
| 6 | Admission Registration | /admissions/new | Admission processing | Admissions |
| 7 | Vital Sign Entry | /vitals/input | Vital sign entry | Nurses |
| 8 | Rounding | /rounds | Round records | Physicians |
| 9 | Admin | /admin | System management | Admin |

### 8.2 Key Screen Wireframes

#### Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                       2025-12-29 (Sun)│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Inpatients│  │Today's   │  │Today's   │  │ Available│        │
│  │    45    │  │Admissions│  │Discharges│  │   Beds   │        │
│  │          │  │    3     │  │    2     │  │    8     │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌─────────────────────────┐  ┌────────────────────────┐        │
│  │   Room Status (Mini-map)│  │     Today's Rounds     │        │
│  │  ● ● ○ ● ● ○ ● ●      │  │  AM ● In Progress 12/15│        │
│  │  ● ○ ● ● ○ ○ ● ●      │  │  PM ○ Scheduled 14:00  │        │
│  └─────────────────────────┘  └────────────────────────┘        │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐      │
│  │              Patients Requiring Attention              │      │
│  │  🔴 Hong Gil-dong (301-A) - Temp 38.5°C               │      │
│  │  🟡 Kim Patient (305-B) - Vital not entered (4 hours) │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Patient Detail

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Patient List                         Hong Gil-dong (P2025001)│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Hong Gil-dong  34y M │ A+ │ Internal Med 301-A │ ● Stable │ │
│  │  Admitted: 2025-12-25 (Day 10) │ Attending: Dr. Lee        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Basic Info │ Vitals │ I/O │ Meds │ Nursing Log │ Reports │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                           │   │
│  │  Recent Vitals (08:00)                  [+ Enter Vitals] │   │
│  │  ┌───────┬───────┬───────┬───────┬───────┐              │   │
│  │  │ Temp  │  BP   │ Pulse │ Resp  │ SpO2  │              │   │
│  │  │36.5°C│120/80 │  72   │  18   │  98%  │              │   │
│  │  └───────┴───────┴───────┴───────┴───────┘              │   │
│  │                                                           │   │
│  │  Vital Trends (7 days)                                   │   │
│  │  [==========Graph==========]                             │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Design Principles

| Principle | Description |
|-----------|-------------|
| **Clarity** | Clear information delivery, intuitive layout |
| **Efficiency** | Complete tasks with minimum clicks |
| **Consistency** | Use same patterns and components |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Responsiveness** | Optimized for PC, tablet, mobile |

---

## 9. Success Metrics

### 9.1 Key Performance Indicators (KPI)

| Metric | Current | Target | Measurement Method |
|--------|---------|--------|-------------------|
| **Patient Info Entry Time** | 5 min/case | 2.5 min/case | User behavior logs |
| **Input Error Rate** | 5% | 1% | Data validation |
| **Room Status Assessment Time** | 15 min | Immediate | User interviews |
| **System Availability** | - | 99.5% | Uptime monitoring |
| **User Satisfaction** | - | 80%+ | Surveys |

### 9.2 Phase-Based Goals

| Phase | Goal |
|-------|------|
| **MVP (M2)** | Core functions operational, able to replace existing workflow |
| **Beta (M3)** | All functions operational, ready for production use |
| **GA (M4)** | Stable operations, target KPIs achieved |

---

## 10. Schedule and Milestones

### 10.1 Overall Schedule

```
┌─────────────────────────────────────────────────────────────────┐
│                   Project Schedule (Approx. 4-5 months)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: Analysis & Design (4 weeks)                           │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                │
│  └─ Requirements analysis, design, prototype                    │
│                                                                  │
│  Phase 2: Development - Core (6 weeks)                          │
│  ░░░░░░░░████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░                │
│  └─ Patient mgmt, room mgmt, admission/discharge, integration   │
│                                                                  │
│  Phase 3: Development - Extended (4 weeks)                      │
│  ░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░                │
│  └─ Reports/logs, rounding, mobile optimization                 │
│                                                                  │
│  Phase 4: Stabilization & Deployment (3 weeks)                  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████░░░░░░░░░░░░░                │
│  └─ Testing, data migration, training, go-live                  │
│                                                                  │
│        W1-4        W5-10       W11-14      W15-17               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Milestones

| Milestone | Target Timing | Key Content | Completion Criteria |
|-----------|---------------|-------------|---------------------|
| **M1: Design Complete** | W4 | Design documents complete | Design review approved |
| **M2: Core Development Complete** | W10 | Core functions complete | Functional testing passed |
| **M3: Full Development Complete** | W14 | All functions complete | UAT can begin |
| **M4: Service Launch** | W17 | Production launch | Stable operation confirmed |

### 10.3 Deliverables by Phase

| Phase | Deliverables |
|-------|--------------|
| **Phase 1** | Requirements specification, system design document, screen design document, DB design document, API specification, prototype |
| **Phase 2** | Auth module, patient management, room status board, admission/discharge management, system integration |
| **Phase 3** | Vital management, I/O management, nursing logs, rounding, mobile UI, admin functions |
| **Phase 4** | Test results report, migration complete, user manual, operator manual, completion report |

---

## 11. Constraints and Assumptions

### 11.1 Constraints

| # | Constraint | Impact | Mitigation |
|---|------------|--------|------------|
| C1 | Dependency on existing medical program DB structure | Integration scope determination | Early DB analysis, adapter pattern |
| C2 | Cloud environment (AWS/Naver Cloud) | Cost implications | Cost-optimized design |
| C3 | Hospital internal network policies | Possible access restrictions | Confirm security requirements in advance |
| C4 | Medical Service Act/Personal Information Protection Act | Increased security requirements | Security-first design |

### 11.2 Assumptions

| # | Assumption | Verification Timing | Impact if Not Met |
|---|------------|---------------------|-------------------|
| A1 | Access rights to existing medical program DB provided | Phase 1 | Reduced integration scope |
| A2 | Cooperation for Google Sheets data cleansing | Phase 4 | Migration delay |
| A3 | User training time secured | Phase 4 | Extended stabilization period |
| A4 | Good in-hospital WiFi environment | Phase 1 | Limited mobile functionality |

### 11.3 Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                        External Dependencies                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Existing Medical Program                                        │
│  └─ DB access rights or API provision required                  │
│  └─ Integration scope: Patient basic info, medical history      │
│                                                                  │
│  Google Sheets (Legacy Data)                                     │
│  └─ One-time migration                                          │
│  └─ Data cleansing and mapping cooperation required             │
│                                                                  │
│  Cloud Infrastructure (AWS/Naver Cloud)                         │
│  └─ Client-side account and cost responsibility                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Risk Factors

### 12.1 Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| Existing system integration delay | Medium | High | Early DB analysis, use mock server |
| Requirements changes | High | Medium | Change management process, buffer schedule |
| Key personnel departure | Low | High | Documentation, knowledge sharing |
| Technical challenges | Medium | Medium | Early PoC execution, expert consulting |
| Data migration issues | Medium | High | Pre-data analysis, automated validation |
| User resistance | Medium | Medium | Early involvement, sufficient training |

### 12.2 Risk Response Matrix

```
                    Probability
               Low         Medium       High
          ┌──────────┬──────────┬──────────┐
    High  │🟡 Monitor│🔴 Respond │🔴 Respond │
          │(Personnel│ Immediate │ Immediate │
    │     │ Departure)│(Integration)│         │
Impact    │          │(Migration)│          │
    ├──────────┼──────────┼──────────┤
    Med   │ ✅ Accept│🟡 Monitor│🟡 Monitor │
          │          │(Technical)│(Req. Change)│
    │     │          │(User      │          │
          │          │Resistance)│          │
    ├──────────┼──────────┼──────────┤
    Low   │ ✅ Accept│ ✅ Accept│🟡 Monitor │
          │          │          │          │
          └──────────┴──────────┴──────────┘
```

---

## 13. Appendix

### 13.1 Technology Stack Summary

| Layer | Technology | Selection Rationale |
|-------|------------|---------------------|
| **Frontend** | Next.js 14 + TypeScript | SSR support, responsive, type safety |
| **UI** | Tailwind CSS + shadcn/ui | Rapid development, built-in accessibility |
| **Backend** | NestJS + TypeScript | Modular, dependency injection, enterprise patterns |
| **ORM** | Prisma | Type-safe, migration management |
| **Database** | PostgreSQL 16 | ACID, JSON support, medical data reliability |
| **Cache** | Redis 7 | Session management, real-time status board |
| **Cloud** | AWS (ECS Fargate, RDS) | Scalability, managed services |

### 13.2 Existing Project Ecosystem Utilization

This project leverages the following existing healthcare system projects for efficient integration:

#### 13.2.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           External Systems                               │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐           │
│    │   LIS   │    │ EMR/OCS │    │ Modality│    │  PACS   │           │
│    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘           │
│         │HL7          │HL7          │DICOM         │DICOM            │
└─────────┼──────────────┼──────────────┼──────────────┼─────────────────┘
          │              │              │              │
          ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Integration Layer (Existing Projects)                 │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      pacs_bridge (C++23)                           │ │
│  │  • HL7 v2.x Gateway (MLLP/TLS)    • FHIR R4 Gateway (REST)        │ │
│  │  • HL7↔DICOM Mapping              • Message Queue (SQLite)         │ │
│  │  • Patient Demographics Cache      • MWL/MPPS Handler              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      pacs_system (C++20)                           │ │
│  │  • DICOM Services (C-STORE/FIND/MOVE/GET)  • DICOMweb REST API    │ │
│  │  • Modality Worklist (MWL)                  • MPPS                 │ │
│  │  • SQLite Index Database                    • RBAC Security        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┬┘
                                                                         │
                                              REST API                   │
                                                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Application Layer (This Project)                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                 hospital_erp_system (TypeScript)                   │ │
│  │  • Next.js 14 (Frontend)           • NestJS (Backend)              │ │
│  │  • PostgreSQL 16 (Database)        • Redis 7 (Cache)               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 13.2.2 Existing Projects

| Project | Description | Protocols | Utilization |
|---------|-------------|-----------|-------------|
| **pacs_system** | PACS server implementation (C++20) | DICOM, DICOMweb REST | PACS image viewer URL link, imaging status query |
| **pacs_bridge** | HIS/RIS integration bridge (C++23) | HL7 v2.x, FHIR R4, DICOM | LIS/EMR integration, protocol translation |

#### 13.2.3 Integration Benefits

| Benefit | Description | Impact |
|---------|-------------|--------|
| **Protocol Reuse** | HL7 v2.x parser/builder already implemented | 4-6 weeks development time saved |
| **Security Infrastructure** | TLS, OAuth2, audit logging implemented | Security compliance acceleration |
| **Message Queue** | Reliable message delivery system | Reduced integration risk |
| **FHIR Support** | R4 gateway in development | Future-proof architecture |
| **Monitoring** | Prometheus metrics, distributed tracing | Production-ready observability |

#### 13.2.4 Integration Strategy by Feature

| Feature | Integration Approach | Priority |
|---------|---------------------|:--------:|
| **LIS Integration** | pacs_bridge HL7 Gateway → REST API → hospital_erp | **Required** |
| **EMR/OCS Integration** | pacs_bridge ADT Handler → Patient Cache → hospital_erp | **Required** |
| **PACS Link** | pacs_system DICOMweb API → URL generation → hospital_erp | Low (Phase 3+) |
| **Prescription Query** | pacs_bridge FHIR Client → MedicationRequest → hospital_erp | Medium |

### 13.3 Related Documents

| Document | Location | Description |
|----------|----------|-------------|
| Project Overview | [reference/01-overview/project-overview.md](reference/01-overview/project-overview.md) | Project background, scope |
| Technology Stack | [reference/01-overview/technology-stack.md](reference/01-overview/technology-stack.md) | Technology selection rationale |
| Schedule Plan | [reference/01-overview/schedule-plan.md](reference/01-overview/schedule-plan.md) | Detailed schedule, WBS |
| System Architecture | [reference/02-design/system-architecture.md](reference/02-design/system-architecture.md) | Architecture design |
| Database Design | [reference/02-design/database-design.md](reference/02-design/database-design.md) | ERD, table definitions |
| API Specification | [reference/02-design/api-specification.md](reference/02-design/api-specification.md) | REST API specification |
| Screen Design | [reference/02-design/ui-design.md](reference/02-design/ui-design.md) | UI/UX guide |
| Security Requirements | [reference/03-security/security-requirements.md](reference/03-security/security-requirements.md) | Security policies |
| Glossary | [reference/04-appendix/glossary.md](reference/04-appendix/glossary.md) | Medical/technical terms |

### 13.4 Terminology

| Term | Description |
|------|-------------|
| **EMR** | Electronic Medical Record |
| **Vital Signs** | Physiological signs (temperature, pulse, respiration, blood pressure) |
| **I/O** | Intake/Output |
| **Rounding** | Ward rounds, patient status check |
| **Room Transfer** | Moving to a different room |
| **RBAC** | Role-Based Access Control |
| **PWA** | Progressive Web App |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-12-29 | - | Initial draft |

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Author | | | |
| PM | | | |
| Technical Lead | | | |
| Client Representative | | | |
