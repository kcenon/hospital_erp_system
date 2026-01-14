# Inpatient Management ERP System Project Overview

## Document Information

| Item             | Content          |
| ---------------- | ---------------- |
| Document Version | 0.1.0.0          |
| Created Date     | 2025-12-29       |
| Status           | Draft            |
| Maintainer       | kcenon@naver.com |

---

## 1. Project Overview

### 1.1 Project Name

**Inpatient Management ERP System**

### 1.2 Project Background

Transitioning from the current Google Sheets-based inpatient data management to a systematic solution to:

- **Enhance Data Security**: Systematic management and access control of patient personal information
- **Improve Operational Efficiency**: Prevent duplicate entries and enable real-time information sharing
- **Integrate with Existing Systems**: Data integration with the existing outpatient management program

### 1.3 Project Objectives

```
┌─────────────────────────────────────────────────────────────────┐
│                        Core Objectives                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Real-time data synchronization with existing medical program│
│  2. Real-time monitoring of room status and patient conditions  │
│  3. Mobile support for rounds/rounding reports                  │
│  4. Compliance with Medical Service Act and Privacy Act         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. System Scope

### 2.1 Platform Configuration

| Platform   | Purpose                        | Users                            |
| ---------- | ------------------------------ | -------------------------------- |
| PC Web     | Administration/Admission tasks | Admission office, Administrators |
| Tablet Web | Rounds/Rounding                | Doctors, Head nurses             |
| Mobile Web | Quick lookup/entry             | Nurses, Medical staff            |

### 2.2 Functional Scope

```
Inpatient Management ERP
├── System Integration (Interface)
│   ├── Integration with existing medical program (DB/API)
│   └── Patient basic information synchronization
│
├── Room and Patient Management
│   ├── Room status board (by floor/room)
│   ├── Admission processing management
│   ├── Room transfer processing
│   └── Discharge processing and history
│
├── Reports and Logs
│   ├── Inpatient daily report
│   │   ├── Vital signs
│   │   ├── I/O (Intake/Output)
│   │   ├── Meal records
│   │   └── Medication records
│   ├── Treatment reports
│   └── Daily rounding report
│
└── Administrator Functions
    ├── User account management
    ├── Permission management (role-based)
    ├── Data backup
    └── Audit logs
```

---

## 3. Stakeholders

### 3.1 User Groups

| Role                     | Primary Functions                                                               | Access Permissions                  |
| ------------------------ | ------------------------------------------------------------------------------- | ----------------------------------- |
| **System Administrator** | System settings, user management, audit logs                                    | Full access                         |
| **Admission Office**     | Admission/discharge processing, room assignment, patient information management | Patient management, Room management |
| **Doctor**               | Rounds, prescriptions, treatment report writing                                 | Medical care, Reports               |
| **Head Nurse**           | Ward management, nursing log review, rounding report                            | Entire ward                         |
| **Nurse**                | Vital signs entry, nursing log writing, I/O recording                           | Assigned patients                   |

### 3.2 External Systems

| System                   | Integration Method          | Data                                       |
| ------------------------ | --------------------------- | ------------------------------------------ |
| Existing Medical Program | Direct DB connection or API | Patient basic information, Medical records |
| Google Sheets (Legacy)   | One-time migration          | Existing admission data                    |

---

## 4. Non-Functional Requirements

### 4.1 Security Requirements

| Item               | Requirement                                 |
| ------------------ | ------------------------------------------- |
| Data Encryption    | AES-256 (at rest), TLS 1.3 (in transit)     |
| Authentication     | Multi-factor authentication (MFA) support   |
| Access Control     | RBAC (Role-Based Access Control)            |
| Audit Logs         | Record all data access/modification history |
| Session Management | Automatic logout, concurrent session limits |

### 4.2 Performance Requirements

| Item             | Target           |
| ---------------- | ---------------- |
| Page Loading     | Within 3 seconds |
| API Response     | Within 500ms     |
| Concurrent Users | 100+ users       |
| Availability     | 99.5% or higher  |

### 4.3 Regulatory Compliance

- **Personal Information Protection Act**: Encryption of sensitive information, 2-year retention of access records
- **Medical Service Act**: 5-year retention of medical records, access control for medical record viewing
- **Electronic Document Act**: Digital signatures, integrity assurance

---

## 5. Constraints and Assumptions

### 5.1 Constraints

1. **Existing System Dependency**: Integration scope depends on the medical program DB structure
2. **Cloud Environment**: Client-side cloud account and cost responsibility
3. **Network Environment**: Must comply with hospital internal network policies

### 5.2 Assumptions

1. DB access rights or API availability for the existing medical program
2. Cooperation available for Google Sheets data cleansing and mapping
3. User training and change management support available

---

## 6. Deliverables

| Category                     | Deliverables                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------ |
| **Development Deliverables** | Source code, build scripts                                                     |
| **Design Documents**         | UI design document, DB design document, API specification, System architecture |
| **Operations Documents**     | User manual, Administrator manual, Installation guide                          |
| **Project Documents**        | Requirements definition document, Completion report                            |

---

## 7. Terminology

| Term          | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| EMR           | Electronic Medical Record                                          |
| OCS           | Order Communication System                                         |
| Vital Signs   | Body vital signs (temperature, pulse, respiration, blood pressure) |
| I/O           | Intake/Output                                                      |
| Rounding      | Ward rounds, patient status check                                  |
| Room Transfer | Moving to a different room                                         |
| RBAC          | Role-Based Access Control                                          |

---

## Appendix: Related Documents

- [01-Tech Stack Proposal](./planning/01-tech-stack-proposal.md)
- [02-System Architecture](./architecture/02-system-architecture.md)
- [03-Database Design](./database/03-database-design.md)
- [04-API Specification](./api/04-api-specification.md)
- [05-Security Requirements](./security/05-security-requirements.md)
- [06-UI Design Guide](./ui/06-ui-design-guide.md)
- [07-Project Schedule](./planning/07-project-schedule.md)
