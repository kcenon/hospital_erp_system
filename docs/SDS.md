# Software Design Specification (SDS)

# Inpatient Management ERP System

---

## Document Information

| Item                | Content                             |
| ------------------- | ----------------------------------- |
| Document Version    | 1.0.0                               |
| Created Date        | 2025-12-29                          |
| Status              | Draft                               |
| Maintainer          | kcenon@naver.com                    |
| Standards Reference | IEEE 1016-2009 / IEEE Std 1016-1998 |
| Product Name        | Inpatient Management ERP System     |

---

## Document History

| Version | Date       | Author | Changes       |
| ------- | ---------- | ------ | ------------- |
| 1.0.0   | 2025-12-29 | -      | Initial draft |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Design Overview](#2-design-overview)
3. [System Architecture Design](#3-system-architecture-design)
4. [Module Detailed Design](#4-module-detailed-design)
5. [Data Design](#5-data-design)
6. [Interface Design](#6-interface-design)
7. [Security Design](#7-security-design)
8. [Design Constraints and Dependencies](#8-design-constraints-and-dependencies)
9. [Requirements-Design Traceability Matrix](#9-requirements-design-traceability-matrix)
10. [Appendix](#10-appendix)

---

## 1. Introduction

### 1.1 Purpose

This document provides a detailed description of the software design for the **Inpatient Management ERP System**. It presents the system architecture, module structure, data design, and interface design to implement the functional and non-functional requirements defined in the SRS (Software Requirements Specification).

**Target Audience:**

- **Development Team**: Implementation reference and guidelines
- **Architects**: Design review and approval
- **Quality Assurance Team**: Test planning based on design
- **Maintenance Team**: System understanding and change impact analysis

> **Traceability Reference**: [SRS.md](SRS.md) Section 1.1, [PRD.md](PRD.md) Section 1

### 1.2 Scope

This design document covers the following scope:

```
SDS Scope
├── System Architecture
│   ├── Logical Architecture (Layers, Modules)
│   ├── Physical Architecture (Deployment, Infrastructure)
│   └── Integration Architecture (External System Integration)
│
├── Module Detailed Design
│   ├── Authentication Module (Auth)
│   ├── Patient Management Module (Patient)
│   ├── Room Management Module (Room)
│   ├── Admission/Discharge Module (Admission)
│   ├── Report/Journal Module (Report)
│   ├── Rounding Module (Rounding)
│   └── Admin Module (Admin)
│
├── Data Design
│   ├── Logical Data Model
│   ├── Physical Data Model
│   └── Data Flow
│
├── Interface Design
│   ├── User Interface
│   ├── API Interface
│   └── External System Interface
│
└── Security Design
    ├── Authentication/Authorization
    ├── Data Protection
    └── Audit Logging
```

> **Traceability Reference**: [SRS.md](SRS.md) Section 1.2, [PRD.md](PRD.md) Section 5.1

### 1.3 Definitions and Abbreviations

| Term/Abbreviation | Definition                               |
| ----------------- | ---------------------------------------- |
| **SDS**           | Software Design Specification            |
| **SRS**           | Software Requirements Specification      |
| **PRD**           | Product Requirements Document            |
| **DDD**           | Domain-Driven Design                     |
| **CQRS**          | Command Query Responsibility Segregation |
| **DTO**           | Data Transfer Object                     |
| **VO**            | Value Object                             |

> **Traceability Reference**: [SRS.md](SRS.md) Section 1.3, [Glossary.md](reference/04-appendix/glossary.md)

### 1.4 Reference Documents

| Document ID  | Document Name                       | Location                                                                   | Relationship          |
| ------------ | ----------------------------------- | -------------------------------------------------------------------------- | --------------------- |
| **DOC-SRS**  | Software Requirements Specification | [SRS.md](SRS.md)                                                           | Requirements Source   |
| **DOC-PRD**  | Product Requirements Document       | [PRD.md](PRD.md)                                                           | Business Requirements |
| **DOC-ARCH** | System Architecture                 | [system-architecture.md](reference/02-design/system-architecture.md)       | Architecture Details  |
| **DOC-DB**   | Database Design Document            | [database-design.md](reference/02-design/database-design.md)               | DB Schema             |
| **DOC-API**  | API Specification                   | [API-specification.md](reference/02-design/api-specification.md)           | API Definition        |
| **DOC-UI**   | UI Design Document                  | [UI-design.md](reference/02-design/ui-design.md)                           | UI Design             |
| **DOC-SEC**  | Security Requirements               | [security-requirements.md](reference/03-security/security-requirements.md) | Security Policy       |

---

## 2. Design Overview

### 2.1 Design Goals

The system design has been established to achieve the following goals:

| ID        | Goal            | Related Requirements | Design Approach                      |
| --------- | --------------- | -------------------- | ------------------------------------ |
| **DG-01** | Maintainability | REQ-NFR-050~054      | Modular Monolith, DDD Application    |
| **DG-02** | Scalability     | REQ-NFR-070~072      | Horizontally Scalable Architecture   |
| **DG-03** | Security        | REQ-NFR-010~033      | Layered Security, Encryption         |
| **DG-04** | Performance     | REQ-NFR-001~006      | Caching, Async Processing            |
| **DG-05** | Reliability     | REQ-NFR-040~043      | High Availability, Disaster Recovery |

> **Traceability Reference**: [SRS.md](SRS.md) Section 5

### 2.2 Design Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                       Design Principles                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  SOLID Principles │    │  Clean Architecture│                │
│  │  ─────────────    │    │  ─────────────     │                │
│  │  S: Single Resp.  │    │  Dependency Inversion              │
│  │  O: Open-Closed   │    │  Layer Separation  │                │
│  │  L: Liskov Subst. │    │  Business-Centric  │                │
│  │  I: Interface Seg.│    │                    │                │
│  │  D: Dependency Inv│    │                    │                │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  Domain-Driven    │    │  Security Design  │                 │
│  │  Design           │    │  ─────────────    │                 │
│  │  ─────────────    │    │  Defense in Depth │                 │
│  │  Bounded Context  │    │  Least Privilege  │                 │
│  │  Aggregate        │    │  Fail Secure      │                 │
│  │  Value Object     │    │                   │                 │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Architecture Decision Records (ADR)

| ADR ID      | Decision         | Rationale                             | Affected Requirements |
| ----------- | ---------------- | ------------------------------------- | --------------------- |
| **ADR-001** | Modular Monolith | Initial scale, operational complexity | REQ-NFR-050, 054      |
| **ADR-002** | PostgreSQL 16    | ACID, medical data reliability        | REQ-NFR-040~043       |
| **ADR-003** | NestJS + Next.js | Type safety, SSR                      | REQ-NFR-060, 061      |
| **ADR-004** | JWT + Redis      | Session management, scalability       | REQ-NFR-010~015       |
| **ADR-005** | WebSocket        | Real-time dashboard                   | REQ-FR-013            |

> **Traceability Reference**: [system-architecture.md](reference/02-design/system-architecture.md) Appendix ADR

---

## 3. System Architecture Design

### 3.1 Logical Architecture

#### 3.1.1 Layer Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│  ───────────────────────────────────────────────────────────    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  PC Web     │  │  Tablet Web │  │  Mobile Web (PWA)       │  │
│  │  (Next.js)  │  │  (Next.js)  │  │  (Next.js)              │  │
│  │             │  │             │  │                         │  │
│  │ Admin/Clerk │  │  Rounding   │  │     Nursing Staff       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                  │
│  Related Requirements: REQ-FR UI-01~05, REQ-NFR-060~062          │
├─────────────────────────────────────────────────────────────────┤
│                    API GATEWAY LAYER                             │
│  ───────────────────────────────────────────────────────────    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • JWT Verification and Authentication (REQ-NFR-010~015)    ││
│  │  • RBAC Permission Verification (REQ-NFR-023)               ││
│  │  • Rate Limiting (100 requests/min)                         ││
│  │  • Request/Response Logging (REQ-NFR-030~033)               ││
│  │  • API Version Management (/v1/)                            ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                             │
│  ───────────────────────────────────────────────────────────    │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │   Auth    │ │  Patient  │ │   Room    │ │ Admission │       │
│  │  Module   │ │  Module   │ │  Module   │ │  Module   │       │
│  │           │ │           │ │           │ │           │       │
│  │REQ-FR-060 │ │REQ-FR-001 │ │REQ-FR-010 │ │REQ-FR-020 │       │
│  │    ~064   │ │    ~006   │ │    ~015   │ │    ~025   │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │  Report   │ │ Rounding  │ │Integration│ │   Admin   │       │
│  │  Module   │ │  Module   │ │  Module   │ │  Module   │       │
│  │           │ │           │ │           │ │           │       │
│  │REQ-FR-030 │ │REQ-FR-050 │ │REQ-FR-005 │ │REQ-FR-060 │       │
│  │    ~045   │ │    ~054   │ │    ~006   │ │    ~064   │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER                                  │
│  ───────────────────────────────────────────────────────────    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Entities:                                                   ││
│  │    Patient, Admission, Room, Bed, Report, VitalSign, User   ││
│  │                                                              ││
│  │  Value Objects:                                              ││
│  │    BloodPressure, VitalSigns, Dosage, PatientNumber         ││
│  │                                                              ││
│  │  Domain Services:                                            ││
│  │    AdmissionService, TransferService, DischargeService      ││
│  │                                                              ││
│  │  Domain Events:                                              ││
│  │    PatientAdmitted, PatientDischarged, RoomTransferred      ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                          │
│  ───────────────────────────────────────────────────────────    │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │PostgreSQL │ │   Redis   │ │  Legacy   │ │    S3     │       │
│  │Repository │ │   Cache   │ │  Adapter  │ │  Storage  │       │
│  │           │ │           │ │           │ │           │       │
│  │ REQ-NFR-  │ │ REQ-NFR-  │ │ REQ-FR-   │ │ REQ-NFR-  │       │
│  │ 040~043   │ │ 005, 006  │ │ 005, 006  │ │ 040~043   │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

> **Traceability Reference**: [system-architecture.md](reference/02-design/system-architecture.md) Section 2

#### 3.1.2 Module Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                    Module Dependency Diagram                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        ┌──────────┐                             │
│                        │   Auth   │                             │
│                        │  Module  │                             │
│                        └────┬─────┘                             │
│                             │                                    │
│            ┌────────────────┼────────────────┐                  │
│            │                │                │                  │
│            ▼                ▼                ▼                  │
│      ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│      │  Admin   │    │ Patient  │    │Integration│              │
│      │  Module  │    │  Module  │    │  Module   │              │
│      └──────────┘    └────┬─────┘    └─────┬─────┘              │
│                           │                │                     │
│            ┌──────────────┼────────────────┤                    │
│            │              │                │                    │
│            ▼              ▼                │                    │
│      ┌──────────┐    ┌──────────┐          │                    │
│      │   Room   │◄───│Admission │◄─────────┘                    │
│      │  Module  │    │  Module  │                               │
│      └──────────┘    └────┬─────┘                               │
│                           │                                      │
│            ┌──────────────┼──────────────┐                      │
│            │              │              │                      │
│            ▼              ▼              ▼                      │
│      ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│      │  Report  │    │ Rounding │    │  Audit   │              │
│      │  Module  │    │  Module  │    │  Module  │              │
│      └──────────┘    └──────────┘    └──────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Physical Architecture

#### 3.2.1 Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud / Naver Cloud                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────── VPC ────────────────────────────────────┐ │
│  │                                                                         │ │
│  │  ┌─────────────── Public Subnet ──────────────────┐                    │ │
│  │  │                                                 │                    │ │
│  │  │   ┌──────────────┐         ┌──────────────┐    │                    │ │
│  │  │   │     ALB      │         │   NAT GW     │    │                    │ │
│  │  │   │ (HTTPS:443)  │         │              │    │                    │ │
│  │  │   │              │         │              │    │                    │ │
│  │  │   │REQ-NFR-021   │         │              │    │                    │ │
│  │  │   └──────┬───────┘         └──────────────┘    │                    │ │
│  │  │          │                                      │                    │ │
│  │  └──────────┼──────────────────────────────────────┘                    │ │
│  │             │                                                            │ │
│  │  ┌──────────┼─────── Private Subnet (App) ─────────────────────────┐   │ │
│  │  │          │                                                       │   │ │
│  │  │          ▼                                                       │   │ │
│  │  │   ┌──────────────────────────────────────────┐                  │   │ │
│  │  │   │            ECS Cluster (Fargate)          │                  │   │ │
│  │  │   │  ┌────────────────┐ ┌────────────────┐   │                  │   │ │
│  │  │   │  │  App Service   │ │  App Service   │   │   Auto Scaling  │   │ │
│  │  │   │  │  (Task 1)      │ │  (Task 2)      │   │   Min: 2        │   │ │
│  │  │   │  │                │ │                │   │   Max: 10       │   │ │
│  │  │   │  │ REQ-NFR-003    │ │ REQ-NFR-003    │   │                  │   │ │
│  │  │   │  └────────────────┘ └────────────────┘   │                  │   │ │
│  │  │   └──────────────────────────────────────────┘                  │   │ │
│  │  │                                                                  │   │ │
│  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                          │ │
│  │  ┌─────────────── Private Subnet (Data) ───────────────────────────┐   │ │
│  │  │                                                                  │   │ │
│  │  │   ┌────────────────┐         ┌────────────────┐                 │   │ │
│  │  │   │  RDS Primary   │ ──────> │  RDS Standby   │                 │   │ │
│  │  │   │  PostgreSQL 16 │  Sync   │  (Multi-AZ)    │                 │   │ │
│  │  │   │                │         │                │                 │   │ │
│  │  │   │ REQ-NFR-040~43 │         │ REQ-NFR-040~43 │                 │   │ │
│  │  │   └────────────────┘         └────────────────┘                 │   │ │
│  │  │                                                                  │   │ │
│  │  │   ┌────────────────┐                                            │   │ │
│  │  │   │  ElastiCache   │                                            │   │ │
│  │  │   │  (Redis 7)     │                                            │   │ │
│  │  │   │                │                                            │   │ │
│  │  │   │ REQ-NFR-005,06 │                                            │   │ │
│  │  │   └────────────────┘                                            │   │ │
│  │  │                                                                  │   │ │
│  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   CloudFront    │  │       S3        │  │   CloudWatch    │             │
│  │   (CDN)         │  │   (Storage)     │  │   (Monitoring)  │             │
│  │                 │  │                 │  │                 │             │
│  │ REQ-NFR-001     │  │ REQ-NFR-040~43  │  │ REQ-NFR-001~06  │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Traceability Reference**: [system-architecture.md](reference/02-design/system-architecture.md) Section 3

#### 3.2.2 Infrastructure Specifications

| Component      | Specification               | Related Requirements |
| -------------- | --------------------------- | -------------------- |
| **App Server** | Fargate 2vCPU, 4GB RAM      | REQ-NFR-001~003      |
| **Database**   | RDS db.r6g.large (Multi-AZ) | REQ-NFR-040~043      |
| **Cache**      | ElastiCache cache.r6g.large | REQ-NFR-005, 006     |
| **Storage**    | S3 Standard                 | REQ-NFR-040~043      |
| **CDN**        | CloudFront                  | REQ-NFR-001          |

### 3.3 Integration Architecture

#### 3.3.1 External System Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Integration Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐         ┌────────────────────────────────┐  │
│  │  Legacy Medical │         │         New ERP System         │  │
│  │  Program        │         │                                │  │
│  │                │         │  ┌────────────────────────┐    │  │
│  │  ┌──────────┐  │         │  │   Integration Module   │    │  │
│  │  │  Legacy  │  │ ──────> │  │                        │    │  │
│  │  │  DB      │  │  JDBC   │  │  ┌──────────────────┐  │    │  │
│  │  │          │  │  Query  │  │  │  Legacy Adapter  │  │    │  │
│  │  └──────────┘  │         │  │  │                  │  │    │  │
│  │                │         │  │  │ • Patient Query  │  │    │  │
│  │                │         │  │  │ • Medical Record │  │    │  │
│  │                │         │  │  │ • Data Mapping   │  │    │  │
│  │                │         │  │  └──────────────────┘  │    │  │
│  │                │         │  │                        │    │  │
│  │                │         │  │  ┌──────────────────┐  │    │  │
│  │                │         │  │  │  Cache Layer     │  │    │  │
│  │                │         │  │  │  (Redis 5min TTL)│  │    │  │
│  │                │         │  │  └──────────────────┘  │    │  │
│  │                │         │  │                        │    │  │
│  └────────────────┘         │  └────────────────────────┘    │  │
│                             │                                │  │
│                             │  Related Requirements:         │  │
│                             │  REQ-FR-005, REQ-FR-006        │  │
│                             │                                │  │
│                             └────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3.2 Synchronization Strategy

| Data Type          | Sync Method     | Frequency | Cache TTL | Related Requirements |
| ------------------ | --------------- | --------- | --------- | -------------------- |
| Patient Basic Info | Pull (on query) | Real-time | 5 min     | REQ-FR-005           |
| Medical History    | Pull (on query) | Real-time | 5 min     | REQ-FR-005           |
| Admission Status   | Event-driven    | Event     | -         | REQ-FR-006           |

> **Traceability Reference**: [system-architecture.md](reference/02-design/system-architecture.md) Section 6

---

## 4. Module Detailed Design

### 4.1 Authentication Module (Auth Module)

#### 4.1.1 Module Overview

| Item                      | Content                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| **Responsibility**        | User authentication, session management, permission verification |
| **Related Requirements**  | REQ-NFR-010~015, REQ-FR-060~064                                  |
| **External Dependencies** | Redis (session), PostgreSQL (users)                              |

#### 4.1.2 Component Structure

```typescript
// Auth Module Structure
@Module({
  imports: [
    JwtModule.registerAsync({...}),
    PassportModule,
    UsersModule,
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    SessionService,
    RbacService,
  ],
  exports: [AuthService, RbacService],
})
export class AuthModule {}
```

#### 4.1.3 Class Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Auth Module Classes                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐       ┌──────────────────┐                │
│  │  AuthController  │       │   AuthService    │                │
│  ├──────────────────┤       ├──────────────────┤                │
│  │ + login()        │──────>│ + validateUser() │                │
│  │ + logout()       │       │ + login()        │                │
│  │ + refresh()      │       │ + logout()       │                │
│  │ + changePassword()│      │ + refreshToken() │                │
│  └──────────────────┘       │ + changePassword()│                │
│                             └────────┬─────────┘                │
│                                      │                          │
│         ┌────────────────────────────┼────────────────────┐     │
│         │                            │                    │     │
│         ▼                            ▼                    ▼     │
│  ┌──────────────┐          ┌──────────────┐     ┌──────────────┐│
│  │SessionService│          │  JwtService  │     │  RbacService ││
│  ├──────────────┤          ├──────────────┤     ├──────────────┤│
│  │+ create()    │          │+ sign()      │     │+ hasPermission││
│  │+ validate()  │          │+ verify()    │     │+ getRoles()  ││
│  │+ destroy()   │          │+ decode()    │     │+ checkAccess()│
│  │+ refresh()   │          └──────────────┘     └──────────────┘│
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.1.4 Authentication Flow Sequence

```
┌────────┐    ┌────────────┐    ┌────────────┐    ┌───────┐    ┌───────┐
│ Client │    │AuthController│   │AuthService │    │ Redis │    │  DB   │
└───┬────┘    └──────┬─────┘    └──────┬─────┘    └───┬───┘    └───┬───┘
    │                │                 │              │            │
    │ POST /login    │                 │              │            │
    │────────────────>                 │              │            │
    │                │ validateUser()  │              │            │
    │                │────────────────>│              │            │
    │                │                 │ findUser()   │            │
    │                │                 │─────────────────────────>│
    │                │                 │              │   user     │
    │                │                 │<─────────────────────────│
    │                │                 │ verify password          │
    │                │                 │──────────────────────────│
    │                │                 │              │            │
    │                │                 │ createSession()          │
    │                │                 │─────────────>│            │
    │                │                 │   sessionId  │            │
    │                │                 │<─────────────│            │
    │                │                 │              │            │
    │                │  {accessToken,  │              │            │
    │                │   refreshToken} │              │            │
    │                │<────────────────│              │            │
    │ 200 OK         │                 │              │            │
    │<────────────────                 │              │            │
    │                │                 │              │            │
```

> **Traceability**: REQ-NFR-010~015 -> AuthService, SessionService

### 4.2 Patient Management Module (Patient Module)

#### 4.2.1 Module Overview

| Item                      | Content                                         |
| ------------------------- | ----------------------------------------------- |
| **Responsibility**        | Patient CRUD, search, legacy system integration |
| **Related Requirements**  | REQ-FR-001~006                                  |
| **External Dependencies** | Integration Module (legacy system)              |

#### 4.2.2 Component Structure

```typescript
// Patient Module Structure
@Module({
  imports: [TypeOrmModule.forFeature([Patient, PatientDetail]), IntegrationModule, CacheModule],
  controllers: [PatientController],
  providers: [PatientService, PatientRepository, PatientSearchService, LegacyPatientAdapter],
  exports: [PatientService],
})
export class PatientModule {}
```

#### 4.2.3 Entity Design

```typescript
// Patient Entity
@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  patientNumber: string; // P2025001234

  @Column()
  name: string;

  @Column({ type: 'date' })
  birthDate: Date;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ nullable: true })
  bloodType?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  legacyPatientId?: string; // Legacy system ID (REQ-FR-005)

  @OneToOne(() => PatientDetail, (detail) => detail.patient)
  detail: PatientDetail;

  @OneToMany(() => Admission, (admission) => admission.patient)
  admissions: Admission[];
}

// PatientDetail Entity (encrypted fields)
@Entity('patient_details')
export class PatientDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Patient)
  @JoinColumn()
  patient: Patient;

  @Column({ type: 'bytea', nullable: true })
  ssnEncrypted?: Buffer; // Social Security Number (REQ-NFR-020)

  @Column({ type: 'bytea', nullable: true })
  medicalHistoryEncrypted?: Buffer; // Medical History (REQ-NFR-020)

  @Column({ type: 'text', nullable: true })
  allergies?: string;
}
```

> **Traceability**: REQ-FR-001~006 -> PatientService, PatientController

### 4.3 Room Management Module (Room Module)

#### 4.3.1 Module Overview

| Item                      | Content                                        |
| ------------------------- | ---------------------------------------------- |
| **Responsibility**        | Room status, bed management, real-time updates |
| **Related Requirements**  | REQ-FR-010~015                                 |
| **External Dependencies** | WebSocket Gateway                              |

#### 4.3.2 Component Structure

```typescript
// Room Module Structure
@Module({
  imports: [TypeOrmModule.forFeature([Building, Floor, Room, Bed]), CacheModule],
  controllers: [RoomController],
  providers: [
    RoomService,
    BedService,
    RoomDashboardService,
    RoomGateway, // WebSocket (REQ-FR-013)
  ],
  exports: [RoomService, BedService],
})
export class RoomModule {}
```

#### 4.3.3 Real-time Dashboard Design

```typescript
// WebSocket Gateway for Room Status (REQ-FR-013)
@WebSocketGateway({
  namespace: '/rooms',
  cors: { origin: '*' },
})
export class RoomGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe:floor')
  async subscribeFloor(client: Socket, floorId: string) {
    client.join(`floor:${floorId}`);
    const status = await this.roomService.getFloorStatus(floorId);
    client.emit('room:status', status);
  }

  // Broadcast on bed status change
  async broadcastRoomUpdate(roomId: string, status: RoomStatus) {
    const room = await this.roomService.findById(roomId);
    this.server.to(`floor:${room.floorId}`).emit('room:status', {
      roomId,
      status,
      updatedAt: new Date(),
    });
  }
}
```

> **Traceability**: REQ-FR-013 -> RoomGateway (WebSocket real-time update)

### 4.4 Admission/Discharge Module (Admission Module)

#### 4.4.1 Module Overview

| Item                      | Content                                   |
| ------------------------- | ----------------------------------------- |
| **Responsibility**        | Admission, transfer, discharge processing |
| **Related Requirements**  | REQ-FR-020~025                            |
| **External Dependencies** | Patient, Room, Integration                |

#### 4.4.2 Domain Service Design

```typescript
// Admission Domain Service
@Injectable()
export class AdmissionDomainService {
  constructor(
    private readonly admissionRepo: AdmissionRepository,
    private readonly bedService: BedService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Admission processing (REQ-FR-020)
  async admitPatient(dto: CreateAdmissionDto): Promise<Admission> {
    // 1. Check bed availability
    const bed = await this.bedService.findAvailableBed(dto.bedId);
    if (!bed) {
      throw new BedNotAvailableException(dto.bedId);
    }

    // 2. Create admission record
    const admission = await this.admissionRepo.create({
      patientId: dto.patientId,
      bedId: dto.bedId,
      admissionDate: dto.admissionDate,
      admissionType: dto.admissionType,
      diagnosis: dto.diagnosis,
      attendingDoctorId: dto.attendingDoctorId,
      primaryNurseId: dto.primaryNurseId,
      status: AdmissionStatus.ACTIVE,
    });

    // 3. Update bed status
    await this.bedService.occupy(dto.bedId, admission.id);

    // 4. Emit domain event
    this.eventEmitter.emit('admission.created', {
      admissionId: admission.id,
      patientId: dto.patientId,
      bedId: dto.bedId,
    });

    return admission;
  }

  // Transfer processing (REQ-FR-021)
  async transferPatient(admissionId: string, dto: TransferDto): Promise<Transfer> {
    const admission = await this.admissionRepo.findActiveById(admissionId);
    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    // 1. Check new bed availability
    const newBed = await this.bedService.findAvailableBed(dto.toBedId);
    if (!newBed) {
      throw new BedNotAvailableException(dto.toBedId);
    }

    // 2. Create transfer record
    const transfer = await this.transferRepo.create({
      admissionId,
      fromBedId: admission.bedId,
      toBedId: dto.toBedId,
      transferDate: dto.transferDate,
      reason: dto.reason,
    });

    // 3. Update bed status
    await this.bedService.release(admission.bedId);
    await this.bedService.occupy(dto.toBedId, admissionId);

    // 4. Emit domain event
    this.eventEmitter.emit('admission.transferred', {
      admissionId,
      fromBedId: admission.bedId,
      toBedId: dto.toBedId,
    });

    return transfer;
  }

  // Discharge processing (REQ-FR-022)
  async dischargePatient(admissionId: string, dto: DischargeDto): Promise<Discharge> {
    // ... discharge logic
  }
}
```

#### 4.4.3 Event Handlers

```typescript
// Admission Event Handler
@Injectable()
export class AdmissionEventHandler {
  constructor(
    private readonly roomGateway: RoomGateway,
    private readonly auditService: AuditService,
  ) {}

  @OnEvent('admission.created')
  async handleAdmissionCreated(event: AdmissionCreatedEvent) {
    // Real-time room dashboard update (REQ-FR-025)
    await this.roomGateway.broadcastRoomUpdate(event.bedId, 'OCCUPIED');

    // Audit log (REQ-NFR-031)
    await this.auditService.log({
      action: 'CREATE',
      resourceType: 'admission',
      resourceId: event.admissionId,
    });
  }

  @OnEvent('admission.discharged')
  async handleAdmissionDischarged(event: AdmissionDischargedEvent) {
    // Real-time room dashboard update
    await this.roomGateway.broadcastRoomUpdate(event.bedId, 'EMPTY');
  }
}
```

> **Traceability**: REQ-FR-020~025 -> AdmissionDomainService

### 4.5 Report Module

#### 4.5.1 Module Overview

| Item                      | Content                                                 |
| ------------------------- | ------------------------------------------------------- |
| **Responsibility**        | Vital signs, I/O, medications, nursing notes management |
| **Related Requirements**  | REQ-FR-030~045                                          |
| **External Dependencies** | Admission Module                                        |

#### 4.5.2 Value Object Design

```typescript
// VitalSigns Value Object (REQ-FR-030~035)
export class VitalSigns {
  constructor(
    public readonly temperature: number, // Temperature (°C)
    public readonly systolicBp: number, // Systolic BP (mmHg)
    public readonly diastolicBp: number, // Diastolic BP (mmHg)
    public readonly pulseRate: number, // Pulse Rate (bpm)
    public readonly respiratoryRate: number, // Respiratory Rate (/min)
    public readonly oxygenSaturation: number, // Oxygen Saturation (%)
    public readonly bloodGlucose?: number, // Blood Glucose (mg/dL)
  ) {
    this.validate();
  }

  private validate() {
    // Normal range validation (REQ-FR-033)
    if (this.temperature < 30 || this.temperature > 45) {
      throw new InvalidVitalValueException('temperature', this.temperature);
    }
    // ... other item validation
  }

  // Abnormal value detection (REQ-FR-033)
  getAlerts(): VitalAlert[] {
    const alerts: VitalAlert[] = [];

    if (this.temperature < 36.1 || this.temperature > 37.2) {
      alerts.push({
        type: 'temperature',
        value: this.temperature,
        severity: this.temperature > 38.5 ? 'HIGH' : 'MEDIUM',
      });
    }

    if (this.oxygenSaturation < 95) {
      alerts.push({
        type: 'oxygenSaturation',
        value: this.oxygenSaturation,
        severity: this.oxygenSaturation < 90 ? 'CRITICAL' : 'HIGH',
      });
    }

    // ... other item validation

    return alerts;
  }
}
```

#### 4.5.3 Daily Report Aggregation Service

```typescript
// Daily report aggregation (REQ-FR-040)
@Injectable()
export class DailyReportAggregator {
  constructor(
    private readonly vitalRepo: VitalSignRepository,
    private readonly ioRepo: IntakeOutputRepository,
    private readonly medicationRepo: MedicationRepository,
  ) {}

  async generateDailySummary(admissionId: string, date: Date): Promise<DailySummary> {
    const [vitals, ios, medications] = await Promise.all([
      this.vitalRepo.findByAdmissionAndDate(admissionId, date),
      this.ioRepo.findByAdmissionAndDate(admissionId, date),
      this.medicationRepo.findByAdmissionAndDate(admissionId, date),
    ]);

    return {
      admissionId,
      date,
      vitalsSummary: this.summarizeVitals(vitals),
      ioBalance: this.calculateIOBalance(ios),
      medicationCompliance: this.calculateMedicationCompliance(medications),
      alerts: this.collectAlerts(vitals),
    };
  }

  private summarizeVitals(vitals: VitalSign[]): VitalsSummary {
    if (vitals.length === 0) return null;

    return {
      latest: vitals[0],
      min: this.findMin(vitals),
      max: this.findMax(vitals),
      average: this.calculateAverage(vitals),
    };
  }

  private calculateIOBalance(ios: IntakeOutput[]): IOBalance {
    const totalIntake = ios.reduce(
      (sum, io) => sum + io.oralIntake + io.ivIntake + io.otherIntake,
      0,
    );
    const totalOutput = ios.reduce(
      (sum, io) => sum + io.urineOutput + io.stoolOutput + io.vomitOutput + io.drainageOutput,
      0,
    );

    return {
      totalIntake,
      totalOutput,
      balance: totalIntake - totalOutput,
    };
  }
}
```

> **Traceability**: REQ-FR-030~045 -> VitalSigns, DailyReportAggregator

### 4.6 Rounding Module

#### 4.6.1 Module Overview

| Item                      | Content                                   |
| ------------------------- | ----------------------------------------- |
| **Responsibility**        | Rounding session management, record input |
| **Related Requirements**  | REQ-FR-050~054                            |
| **External Dependencies** | Admission, Report Module                  |

#### 4.6.2 Rounding Session State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                   Rounding Session State Machine                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────┐                                                  │
│    │ PLANNED │                                                  │
│    └────┬────┘                                                  │
│         │                                                        │
│         │ start()                                               │
│         ▼                                                        │
│    ┌─────────────┐                                              │
│    │ IN_PROGRESS │◄─────────────────────┐                       │
│    └──────┬──────┘                      │                       │
│           │                              │                       │
│           │ addRecord()                  │ continueRound()       │
│           │                              │                       │
│           ▼                              │                       │
│    ┌─────────────┐                ┌─────┴─────┐                 │
│    │   PAUSED    │───────────────>│ RESUMED   │                 │
│    └─────────────┘   resume()     └───────────┘                 │
│           │                                                      │
│           │ complete()                                          │
│           ▼                                                      │
│    ┌─────────────┐                                              │
│    │  COMPLETED  │                                              │
│    └─────────────┘                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.6.3 Tablet Rounding Service

```typescript
// Tablet Rounding Service (REQ-FR-053)
@Injectable()
export class TabletRoundingService {
  constructor(
    private readonly roundRepo: RoundRepository,
    private readonly admissionService: AdmissionService,
    private readonly vitalService: VitalSignService,
  ) {}

  // Get rounding patient list (REQ-FR-054)
  async getRoundingPatientList(roundId: string): Promise<RoundingPatient[]> {
    const round = await this.roundRepo.findById(roundId);
    const admissions = await this.admissionService.findActiveByFloor(round.floorId);

    return Promise.all(
      admissions.map(async (admission) => {
        const latestVitals = await this.vitalService.findLatest(admission.id);
        const previousRecords = await this.roundRepo.findPreviousRecords(admission.id);

        return {
          admissionId: admission.id,
          patient: admission.patient,
          bed: admission.bed,
          latestVitals,
          diagnosis: admission.diagnosis,
          admissionDays: this.calculateAdmissionDays(admission.admissionDate),
          previousNotes: previousRecords[0]?.observation,
        };
      }),
    );
  }

  // Add rounding record (REQ-FR-051)
  async addRoundRecord(roundId: string, dto: CreateRoundRecordDto): Promise<RoundRecord> {
    const round = await this.roundRepo.findInProgress(roundId);
    if (!round) {
      throw new RoundNotInProgressException(roundId);
    }

    const record = await this.roundRepo.createRecord({
      roundId,
      admissionId: dto.admissionId,
      visitOrder: dto.visitOrder,
      patientStatus: dto.patientStatus,
      chiefComplaint: dto.chiefComplaint,
      observation: dto.observation,
      plan: dto.plan,
      orders: dto.orders,
      visitedAt: new Date(),
    });

    return record;
  }
}
```

> **Traceability**: REQ-FR-050~054 -> TabletRoundingService

### 4.7 Admin Module

#### 4.7.1 Module Overview

| Item                      | Content                                                 |
| ------------------------- | ------------------------------------------------------- |
| **Responsibility**        | User management, role/permission management, audit logs |
| **Related Requirements**  | REQ-FR-060~064, REQ-NFR-030~033                         |
| **External Dependencies** | Auth Module                                             |

#### 4.7.2 Audit Log Service

```typescript
// Audit Log Service (REQ-NFR-030~033)
@Injectable()
export class AuditService {
  constructor(
    private readonly auditRepo: AuditLogRepository,
    @Inject('REQUEST') private readonly request: Request,
  ) {}

  async log(event: AuditEvent): Promise<void> {
    await this.auditRepo.create({
      userId: this.request.user?.id,
      username: this.request.user?.username,
      userRole: this.request.user?.roles?.[0],
      ipAddress: this.request.ip,
      userAgent: this.request.headers['user-agent'],

      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,

      requestPath: this.request.path,
      requestMethod: this.request.method,

      success: event.success ?? true,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,

      changes: event.changes,
      timestamp: new Date(),
    });
  }

  // Patient information access log (REQ-NFR-031)
  async logPatientAccess(patientId: string, accessType: string, fields: string[]): Promise<void> {
    await this.auditRepo.createPatientAccess({
      userId: this.request.user.id,
      patientId,
      accessType,
      accessedFields: fields,
      ipAddress: this.request.ip,
      accessedAt: new Date(),
    });
  }
}
```

> **Traceability**: REQ-NFR-030~033 -> AuditService

---

## 5. Data Design

### 5.1 Logical Data Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Logical Data Model (ERD)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐            │
│  │    users     │       │    roles     │       │ permissions  │            │
│  ├──────────────┤       ├──────────────┤       ├──────────────┤            │
│  │ id (PK)      │       │ id (PK)      │       │ id (PK)      │            │
│  │ employee_id  │◄─────►│ code         │◄─────►│ code         │            │
│  │ username     │       │ name         │       │ resource     │            │
│  │ password_hash│       │ level        │       │ action       │            │
│  │ name         │       └──────────────┘       └──────────────┘            │
│  │ department   │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         │ 1:N                                                               │
│         │                                                                    │
│  ┌──────┴───────────────────────────────────────────────────────────────┐  │
│  │                          patients                                     │  │
│  │  ┌──────────────┐       ┌──────────────────┐                         │  │
│  │  │  patients    │       │ patient_details  │                         │  │
│  │  ├──────────────┤       ├──────────────────┤                         │  │
│  │  │ id (PK)      │──────►│ patient_id (FK)  │                         │  │
│  │  │ patient_number│      │ ssn_encrypted    │                         │  │
│  │  │ name         │       │ medical_history  │                         │  │
│  │  │ birth_date   │       │ allergies        │                         │  │
│  │  │ gender       │       └──────────────────┘                         │  │
│  │  └──────┬───────┘                                                     │  │
│  │         │ 1:N                                                         │  │
│  └─────────┼─────────────────────────────────────────────────────────────┘  │
│            │                                                                 │
│  ┌─────────┴─────────────────────────────────────────────────────────────┐  │
│  │                          admissions                                    │  │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │  │
│  │  │  admissions  │───►│  transfers   │    │  discharges  │            │  │
│  │  ├──────────────┤    ├──────────────┤    ├──────────────┤            │  │
│  │  │ id (PK)      │    │ admission_id │    │ admission_id │            │  │
│  │  │ patient_id   │    │ from_bed_id  │    │ discharge_date│           │  │
│  │  │ bed_id       │    │ to_bed_id    │    │ discharge_type│           │  │
│  │  │ admission_date│   │ transfer_date│    │ summary      │            │  │
│  │  │ status       │    └──────────────┘    └──────────────┘            │  │
│  │  └──────┬───────┘                                                     │  │
│  └─────────┼─────────────────────────────────────────────────────────────┘  │
│            │ 1:N                                                             │
│  ┌─────────┼─────────────────────────────────────────────────────────────┐  │
│  │         │                    reports                                   │  │
│  │  ┌──────┴───────┐  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │ vital_signs  │  │intake_outputs│  │ medications  │                │  │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤                │  │
│  │  │ admission_id │  │ admission_id │  │ admission_id │                │  │
│  │  │ temperature  │  │ oral_intake  │  │ medication_name               │  │
│  │  │ systolic_bp  │  │ iv_intake    │  │ dosage       │                │  │
│  │  │ diastolic_bp │  │ urine_output │  │ route        │                │  │
│  │  │ measured_at  │  │ record_date  │  │ administered_at               │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Traceability Reference**: [database-design.md](reference/02-design/database-design.md) Section 2, 3

### 5.2 Schema-Table Mapping

| Schema        | Tables                                                                 | Related Requirements |
| ------------- | ---------------------------------------------------------------------- | -------------------- |
| **public**    | users, roles, permissions, user_roles                                  | REQ-FR-060~064       |
| **patient**   | patients, patient_details                                              | REQ-FR-001~006       |
| **room**      | buildings, floors, rooms, beds                                         | REQ-FR-010~015       |
| **admission** | admissions, transfers, discharges                                      | REQ-FR-020~025       |
| **report**    | vital_signs, intake_outputs, medications, nursing_notes, daily_reports | REQ-FR-030~045       |
| **rounding**  | rounds, round_records                                                  | REQ-FR-050~054       |
| **audit**     | access_logs, change_logs, login_history                                | REQ-NFR-030~033      |

### 5.3 Encrypted Fields

| Table           | Field           | Encryption Method      | Related Requirements |
| --------------- | --------------- | ---------------------- | -------------------- |
| patient_details | ssn_encrypted   | AES-256-GCM (pgcrypto) | REQ-NFR-020          |
| patient_details | medical_history | AES-256-GCM            | REQ-NFR-020          |
| patient_details | insurance_info  | AES-256-GCM            | REQ-NFR-020          |
| users           | password_hash   | bcrypt (cost 12)       | REQ-NFR-011          |

> **Traceability Reference**: [security-requirements.md](reference/03-security/security-requirements.md) Section 4

### 5.4 Index Strategy

| Table       | Index                            | Purpose                | Related Requirements |
| ----------- | -------------------------------- | ---------------------- | -------------------- |
| patients    | (patient_number)                 | Patient number search  | REQ-FR-001           |
| patients    | (name)                           | Name search            | REQ-FR-001           |
| admissions  | (patient_id, status)             | Active admission query | REQ-FR-002           |
| beds        | (room_id, status)                | Empty bed search       | REQ-FR-011           |
| vital_signs | (admission_id, measured_at DESC) | Latest vitals          | REQ-FR-031           |
| access_logs | (created_at, user_id)            | Audit log query        | REQ-NFR-030          |

---

## 6. Interface Design

### 6.1 User Interface

#### 6.1.1 Screen-Requirements Mapping

| Screen ID | Screen Name            | Related Requirements | Users                |
| --------- | ---------------------- | -------------------- | -------------------- |
| SCR-01    | Login                  | REQ-NFR-010~015      | All                  |
| SCR-02    | Dashboard              | REQ-FR-010, 013      | All                  |
| SCR-03    | Patient List           | REQ-FR-001           | All                  |
| SCR-04    | Patient Detail         | REQ-FR-002, 031, 032 | All                  |
| SCR-05    | Room Dashboard         | REQ-FR-010~015       | All                  |
| SCR-06    | Admission Registration | REQ-FR-020, 024      | Administrative Staff |
| SCR-07    | Vital Signs Input      | REQ-FR-030, 034, 035 | Nurses               |
| SCR-08    | Rounding               | REQ-FR-050~054       | Physicians           |
| SCR-09    | Admin                  | REQ-FR-060~064       | Administrators       |

> **Traceability Reference**: [UI-design.md](reference/02-design/ui-design.md)

#### 6.1.2 Responsive Design

| Platform   | Resolution | Optimized Screens        | Related Requirements    |
| ---------- | ---------- | ------------------------ | ----------------------- |
| PC Web     | 1024px+    | All screens              | UI-01, REQ-NFR-061      |
| Tablet     | 768px+     | Rounding, Patient Detail | UI-02, REQ-NFR-061      |
| Mobile PWA | 320px+     | Vital Signs Input, Query | UI-03, REQ-NFR-061, 062 |

### 6.2 API Interface

#### 6.2.1 API Endpoint Mapping

| Endpoint                     | Method   | Related Requirements | Auth | Permission       |
| ---------------------------- | -------- | -------------------- | ---- | ---------------- |
| `/auth/login`                | POST     | REQ-NFR-010          | -    | -                |
| `/auth/refresh`              | POST     | REQ-NFR-013          | JWT  | -                |
| `/patients`                  | GET      | REQ-FR-001           | JWT  | patient:read     |
| `/patients/:id`              | GET      | REQ-FR-002           | JWT  | patient:read     |
| `/patients`                  | POST     | REQ-FR-003           | JWT  | patient:create   |
| `/patients/:id`              | PATCH    | REQ-FR-004           | JWT  | patient:update   |
| `/patients/search/legacy`    | GET      | REQ-FR-005           | JWT  | patient:read     |
| `/rooms`                     | GET      | REQ-FR-010           | JWT  | room:read        |
| `/rooms/dashboard/floor/:id` | GET      | REQ-FR-010           | JWT  | room:read        |
| `/beds/available`            | GET      | REQ-FR-011           | JWT  | room:read        |
| `/admissions`                | POST     | REQ-FR-020           | JWT  | admission:create |
| `/admissions/:id/transfer`   | POST     | REQ-FR-021           | JWT  | admission:update |
| `/admissions/:id/discharge`  | POST     | REQ-FR-022           | JWT  | admission:update |
| `/admissions/:id/vitals`     | POST     | REQ-FR-030           | JWT  | vital:write      |
| `/admissions/:id/vitals`     | GET      | REQ-FR-031           | JWT  | vital:read       |
| `/rounds`                    | POST     | REQ-FR-050           | JWT  | round:write      |
| `/rounds/:id/records`        | POST     | REQ-FR-051           | JWT  | round:write      |
| `/admin/users`               | GET/POST | REQ-FR-060           | JWT  | admin:users      |
| `/admin/audit/access-logs`   | GET      | REQ-FR-062           | JWT  | admin:audit      |

> **Traceability Reference**: [API-specification.md](reference/02-design/api-specification.md)

#### 6.2.2 WebSocket Events

| Event                  | Direction | Related Requirements | Description                     |
| ---------------------- | --------- | -------------------- | ------------------------------- |
| `room:status`          | S->C      | REQ-FR-013           | Room status change              |
| `admission:created`    | S->C      | REQ-FR-025           | New admission notification      |
| `admission:discharged` | S->C      | REQ-FR-025           | Discharge notification          |
| `vital:recorded`       | S->C      | REQ-FR-033           | Vital signs recorded (abnormal) |
| `subscribe:floor`      | C->S      | REQ-FR-013           | Floor subscription              |

### 6.3 External System Interface

#### 6.3.1 Legacy Medical Program Integration

| Interface                | Method      | Data                        | Related Requirements |
| ------------------------ | ----------- | --------------------------- | -------------------- |
| Patient Basic Info Query | JDBC/API    | Name, DOB, Gender, etc.     | REQ-FR-005           |
| Medical Record Query     | JDBC/API    | Prescriptions, Test Results | REQ-FR-005           |
| Patient Sync             | Event-based | Patient Basic Info          | REQ-FR-006           |

```typescript
// Legacy Adapter Interface
interface LegacyPatientAdapter {
  findPatientById(legacyId: string): Promise<LegacyPatient>;
  searchPatients(query: string): Promise<LegacyPatient[]>;
  getMedicalHistory(legacyId: string): Promise<MedicalHistory>;
}
```

> **Traceability Reference**: [system-architecture.md](reference/02-design/system-architecture.md) Section 6

---

## 7. Security Design

### 7.1 Authentication Design

#### 7.1.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Authentication Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    1. Login Request                         │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  Client ──► username/password ──► AuthService             │ │
│  │                                        │                   │ │
│  │                            ┌───────────┴───────────┐       │ │
│  │                            │ Password Verify (bcrypt)│     │ │
│  │                            │ REQ-NFR-011             │     │ │
│  │                            └─────────────────────────┘     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    2. Token Issuance                        │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  ┌─────────────────┐    ┌─────────────────┐               │ │
│  │  │  Access Token   │    │  Refresh Token  │               │ │
│  │  │  (1 hour valid) │    │  (7 days valid) │               │ │
│  │  │  REQ-NFR-013    │    │  REQ-NFR-013    │               │ │
│  │  └─────────────────┘    └─────────────────┘               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    3. Session Management                    │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  Redis Session: { userId, jti, deviceInfo, lastActivity }  │ │
│  │  ┌─────────────────┐    ┌─────────────────┐               │ │
│  │  │ Idle Timeout    │    │ Concurrent Session│             │ │
│  │  │ 30 minutes      │    │ Limit: Max 3      │             │ │
│  │  │ REQ-NFR-013     │    │ REQ-NFR-014       │             │ │
│  │  └─────────────────┘    └─────────────────┘               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.1.2 Password Policy

| Policy Item                | Setting                   | Related Requirements |
| -------------------------- | ------------------------- | -------------------- |
| Minimum Length             | 8 characters              | REQ-NFR-010          |
| Uppercase Required         | Yes                       | REQ-NFR-010          |
| Lowercase Required         | Yes                       | REQ-NFR-010          |
| Number Required            | Yes                       | REQ-NFR-010          |
| Special Character Required | Yes                       | REQ-NFR-010          |
| Hashing Algorithm          | bcrypt (cost 12)          | REQ-NFR-011          |
| Login Failure Limit        | 5 attempts/15 min lockout | REQ-NFR-015          |

### 7.2 Authorization Design

#### 7.2.1 RBAC Permission Matrix

| Resource | Permission | ADMIN | DOCTOR | HEAD_NURSE | NURSE | CLERK |
| -------- | ---------- | :---: | :----: | :--------: | :---: | :---: |
| patient  | read       |   Y   |   Y    |     Y      |  Y\*  |   Y   |
| patient  | create     |   Y   |   N    |     N      |   N   |   Y   |
| patient  | update     |   Y   |  Y\*   |     Y      |   N   |   Y   |
| room     | read       |   Y   |   Y    |     Y      |   Y   |   Y   |
| room     | assign     |   Y   |   N    |     Y      |   N   |   Y   |
| vital    | write      |   Y   |   Y    |     Y      |   Y   |   N   |
| report   | write      |   Y   |   Y    |     Y      |   Y   |   N   |
| admin    | \*         |   Y   |   N    |     N      |   N   |   N   |

\*Limited permission (assigned patients only, own records only)

> **Traceability**: REQ-NFR-023, [security-requirements.md](reference/03-security/security-requirements.md) Section 3

### 7.3 Data Protection Design

#### 7.3.1 Encryption Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        Encryption Layers                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Transport Layer Encryption                 │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  TLS 1.3 (All API communication) ─── REQ-NFR-021           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Storage Layer Encryption                   │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ Field-Level Encryption (AES-256-GCM)                 │  │ │
│  │  │ ─────────────────────────────────────────────────   │  │ │
│  │  │ • Social Security Number (ssn_encrypted)             │  │ │
│  │  │ • Medical Records (medical_history)                  │  │ │
│  │  │ • Insurance Information (insurance_info)             │  │ │
│  │  │                                                      │  │ │
│  │  │ Related Requirements: REQ-NFR-020                    │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ Disk Encryption (RDS)                                │  │ │
│  │  │ ─────────────────────────────────────────────────   │  │ │
│  │  │ • AWS KMS managed key                                │  │ │
│  │  │ • AES-256 full disk encryption                       │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Data Masking                               │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  • SSN: 901234-1****** (REQ-NFR-022)                       │ │
│  │  • Phone: 010-****-5678                                    │ │
│  │  • Role-based differential masking                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Audit Logging Design

| Log Type            | Recorded Items                    | Retention Period | Related Requirements |
| ------------------- | --------------------------------- | ---------------- | -------------------- |
| Login/Logout        | User, time, IP, result            | 2 years          | REQ-NFR-030          |
| Patient Info Access | User, patient ID, accessed fields | 2 years          | REQ-NFR-031          |
| Data Changes        | Before/after values, modifier     | Permanent        | REQ-NFR-032          |
| Permission Changes  | Admin, target, change details     | Permanent        | REQ-NFR-033          |

> **Traceability Reference**: [security-requirements.md](reference/03-security/security-requirements.md) Section 5

---

## 8. Design Constraints and Dependencies

### 8.1 Technical Constraints

| ID     | Constraint                                     | Impact            | Design Response                      | Related Requirements |
| ------ | ---------------------------------------------- | ----------------- | ------------------------------------ | -------------------- |
| CON-01 | Legacy medical program DB structure dependency | Integration scope | Adapter Pattern                      | REQ-FR-005           |
| CON-02 | Web browser-based                              | Compatibility     | Chrome/Edge/Safari latest 2 versions | REQ-NFR-060          |
| CON-03 | Cloud environment                              | Cost              | Cost-optimized design                | REQ-NFR-070          |

> **Traceability Reference**: [SRS.md](SRS.md) Section 2.4

### 8.2 External Dependencies

| ID     | Dependency | Version  | Purpose          | Related Requirements |
| ------ | ---------- | -------- | ---------------- | -------------------- |
| DEP-01 | PostgreSQL | 16.x     | Primary database | REQ-NFR-040~043      |
| DEP-02 | Redis      | 7.x      | Cache/Session    | REQ-NFR-005, 013     |
| DEP-03 | Node.js    | 20.x LTS | Runtime          | SW-01                |
| DEP-04 | Next.js    | 14.x     | Frontend         | SW-04                |
| DEP-05 | NestJS     | 10.x     | Backend          | SW-05                |

> **Traceability Reference**: [SRS.md](SRS.md) Section 3.3, [tech-stack.md](reference/01-overview/technology-stack.md)

### 8.3 Design Assumptions

| ID     | Assumption                  | Verification Point | Design Impact if Not Met         |
| ------ | --------------------------- | ------------------ | -------------------------------- |
| ASM-01 | Direct access to legacy DB  | Phase 1            | Integration Module design change |
| ASM-02 | Good hospital WiFi coverage | Phase 1            | Enhanced PWA offline features    |
| ASM-03 | Concurrent users under 100  | In operation       | Horizontal scaling required      |

---

## 9. Requirements-Design Traceability Matrix

### 9.1 Functional Requirements -> Design Elements Mapping

| Requirement ID | Requirement Name            | Module      | Class/Component                   | DB Table                  | API Endpoint                       |
| -------------- | --------------------------- | ----------- | --------------------------------- | ------------------------- | ---------------------------------- |
| REQ-FR-001     | Patient List Query          | Patient     | PatientService, PatientController | patients                  | GET /patients                      |
| REQ-FR-002     | Patient Detail Query        | Patient     | PatientService                    | patients, patient_details | GET /patients/:id                  |
| REQ-FR-003     | Patient Registration        | Patient     | PatientService                    | patients                  | POST /patients                     |
| REQ-FR-004     | Patient Info Update         | Patient     | PatientService                    | patients                  | PATCH /patients/:id                |
| REQ-FR-005     | Legacy System Patient Query | Integration | LegacyPatientAdapter              | -                         | GET /patients/search/legacy        |
| REQ-FR-006     | Patient Info Sync           | Integration | PatientSyncService                | patients                  | -                                  |
| REQ-FR-010     | Room Dashboard              | Room        | RoomDashboardService              | rooms, beds               | GET /rooms/dashboard/floor/:id     |
| REQ-FR-011     | Available Bed Query         | Room        | BedService                        | beds                      | GET /beds/available                |
| REQ-FR-012     | Bed Assignment              | Admission   | AdmissionDomainService            | admissions, beds          | POST /admissions                   |
| REQ-FR-013     | Real-time Status Update     | Room        | RoomGateway (WebSocket)           | -                         | WS room:status                     |
| REQ-FR-020     | Admission Registration      | Admission   | AdmissionDomainService            | admissions                | POST /admissions                   |
| REQ-FR-021     | Transfer Processing         | Admission   | AdmissionDomainService            | transfers                 | POST /admissions/:id/transfer      |
| REQ-FR-022     | Discharge Processing        | Admission   | AdmissionDomainService            | discharges                | POST /admissions/:id/discharge     |
| REQ-FR-030     | Vital Signs Input           | Report      | VitalSignService                  | vital_signs               | POST /admissions/:id/vitals        |
| REQ-FR-031     | Vital Signs Query           | Report      | VitalSignService                  | vital_signs               | GET /admissions/:id/vitals         |
| REQ-FR-032     | Vital Signs Trend Graph     | Report      | VitalChartService                 | vital_signs               | GET /admissions/:id/vitals/chart   |
| REQ-FR-033     | Abnormal Value Alert        | Report      | VitalAlertService                 | vital_signs               | WS vital:recorded                  |
| REQ-FR-040     | Daily Report Creation       | Report      | DailyReportService                | daily_reports             | POST /admissions/:id/daily-reports |
| REQ-FR-050     | Rounding Session Creation   | Rounding    | RoundingService                   | rounds                    | POST /rounds                       |
| REQ-FR-051     | Rounding Record Input       | Rounding    | TabletRoundingService             | round_records             | POST /rounds/:id/records           |
| REQ-FR-060     | User Account Management     | Admin       | UserService                       | users                     | /admin/users                       |
| REQ-FR-061     | Role/Permission Management  | Admin       | RoleService                       | roles, permissions        | /admin/roles                       |
| REQ-FR-062     | Audit Log Query             | Admin       | AuditService                      | access_logs, change_logs  | GET /admin/audit/access-logs       |

### 9.2 Non-Functional Requirements -> Design Elements Mapping

| Requirement ID | Requirement Name          | Design Element       | Implementation              |
| -------------- | ------------------------- | -------------------- | --------------------------- |
| REQ-NFR-001    | Page Load 3 sec           | CDN, SSR             | CloudFront, Next.js SSR     |
| REQ-NFR-002    | API Response 500ms        | Caching, Index       | Redis cache, DB index       |
| REQ-NFR-003    | 100 Concurrent Users      | Auto Scaling         | ECS Fargate Auto Scaling    |
| REQ-NFR-005    | Dashboard Refresh 3 sec   | WebSocket            | RoomGateway                 |
| REQ-NFR-010    | Password Policy           | AuthService          | PasswordValidator           |
| REQ-NFR-011    | Password Hashing          | AuthService          | bcrypt (cost 12)            |
| REQ-NFR-013    | Session Timeout           | SessionService       | Redis TTL 30 min            |
| REQ-NFR-014    | Concurrent Session Limit  | SessionService       | Redis session count         |
| REQ-NFR-020    | Storage Data Encryption   | PatientDetail Entity | pgcrypto AES-256            |
| REQ-NFR-021    | Transport Data Encryption | ALB, nginx           | TLS 1.3                     |
| REQ-NFR-023    | RBAC                      | RbacService, Guards  | PermissionGuard             |
| REQ-NFR-030    | Login Logging             | AuditService         | audit.login_history         |
| REQ-NFR-031    | Patient Access Logging    | AuditService         | audit.patient_access_logs   |
| REQ-NFR-040    | System Availability 99.5% | Multi-AZ             | RDS Multi-AZ, ECS Multi-AZ  |
| REQ-NFR-050    | Code Quality              | CI/CD                | ESLint, Prettier, SonarQube |
| REQ-NFR-051    | Test Coverage 80%         | Testing              | Jest, Cypress               |

### 9.3 Design Document Cross-Reference

| Design Area  | SDS Section | Detailed Design Document                                                   | Related SRS Section |
| ------------ | ----------- | -------------------------------------------------------------------------- | ------------------- |
| Architecture | 3           | [system-architecture.md](reference/02-design/system-architecture.md)       | 2.1, 3.3            |
| Data         | 5           | [database-design.md](reference/02-design/database-design.md)               | Appendix A          |
| API          | 6.2         | [API-specification.md](reference/02-design/api-specification.md)           | 3.4, Appendix B     |
| UI           | 6.1         | [UI-design.md](reference/02-design/ui-design.md)                           | 3.1, Appendix C     |
| Security     | 7           | [security-requirements.md](reference/03-security/security-requirements.md) | 5.2                 |

---

## 10. Appendix

### Appendix A: Design ID System

```
Design Element ID Format: {Category}-{Number}

Categories:
- DG    : Design Goal
- ADR   : Architecture Decision Record
- MOD   : Module
- CMP   : Component
- ENT   : Entity
- SVC   : Service
- API   : API Endpoint
- SCR   : Screen
- SEC   : Security

Examples:
- DG-01  : First design goal
- ADR-001: First architecture decision
- MOD-AUTH: Authentication module
- ENT-PATIENT: Patient entity
```

### Appendix B: Technology Stack Summary

| Layer    | Technology     | Version | Purpose            |
| -------- | -------------- | ------- | ------------------ |
| Frontend | Next.js        | 14.x    | SSR, Responsive UI |
| Frontend | TypeScript     | 5.x     | Type safety        |
| Frontend | Tailwind CSS   | 3.x     | Styling            |
| Frontend | shadcn/ui      | latest  | UI components      |
| Backend  | NestJS         | 10.x    | API server         |
| Backend  | TypeScript     | 5.x     | Type safety        |
| ORM      | Prisma         | 5.x     | Database access    |
| Database | PostgreSQL     | 16.x    | Primary database   |
| Cache    | Redis          | 7.x     | Cache/Session      |
| Realtime | Socket.io      | 4.x     | WebSocket          |
| Cloud    | AWS (ECS, RDS) | -       | Infrastructure     |

### Appendix C: Term Definitions

> **Traceability Reference**: [glossary.md](reference/04-appendix/glossary.md)

---

## Approval

| Role               | Name | Signature | Date |
| ------------------ | ---- | --------- | ---- |
| Author             |      |           |      |
| Architect          |      |           |      |
| Technical Reviewer |      |           |      |
| PM                 |      |           |      |

---

_This document was prepared based on the IEEE 1016-2009 standard._
