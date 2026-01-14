# System Architecture Design Document

## Document Information

| Item             | Content          |
| ---------------- | ---------------- |
| Document Version | 0.1.0.0          |
| Created Date     | 2025-12-29       |
| Status           | Draft            |
| Owner            | kcenon@naver.com |

---

## 1. Architecture Overview

### 1.1 System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              External Systems                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│   │  Existing    │    │   SMS/       │    │   Backup     │                  │
│   │  Medical     │    │   Notification│    │   Storage    │                  │
│   │  Program     │    │   Service    │    │   (S3)       │                  │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│          │                   │                   │                          │
└──────────┼───────────────────┼───────────────────┼──────────────────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                    ┌─────────────────────────────┐                          │
│                    │  Inpatient Management ERP   │                          │
│                    │          System             │                          │
│                    │  ┌─────────────────────┐   │                          │
│                    │  │     API Gateway     │   │                          │
│                    │  └─────────────────────┘   │                          │
│                    │            │               │                          │
│                    │  ┌─────────┴─────────┐    │                          │
│                    │  │   Application     │    │                          │
│                    │  │   Services        │    │                          │
│                    │  └─────────┬─────────┘    │                          │
│                    │            │               │                          │
│                    │  ┌─────────┴─────────┐    │                          │
│                    │  │    Data Layer     │    │                          │
│                    │  └───────────────────┘    │                          │
│                    │                             │                          │
│                    └─────────────────────────────┘                          │
│                                 ▲                                           │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
    ┌──────┴──────┐       ┌──────┴──────┐       ┌──────┴──────┐
    │   PC Web    │       │   Tablet    │       │   Mobile    │
    │(Admin/Clerk)│       │  (Rounds)   │       │  (Nurses)   │
    └─────────────┘       └─────────────┘       └─────────────┘
```

### 1.2 Architecture Principles

| Principle            | Description                           | Application                   |
| -------------------- | ------------------------------------- | ----------------------------- |
| **Layer Separation** | Separate Presentation, Business, Data | Improved maintainability      |
| **Modularization**   | Independent modules per domain        | Extensibility, easier testing |
| **Loose Coupling**   | Interface-based dependencies          | Minimize change impact        |
| **Security First**   | Apply security at all layers          | Medical data protection       |
| **Scalability**      | Horizontal scaling design             | Handle usage growth           |

---

## 2. Logical Architecture

### 2.1 Layer Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  PC Web     │  │  Tablet Web │  │  Mobile Web             │  │
│  │  (Next.js)  │  │  (Next.js)  │  │  (Next.js PWA)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    API GATEWAY LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • Authentication & Authorization                           ││
│  │  • Rate Limiting                                            ││
│  │  • Request/Response Logging                                 ││
│  │  • API Versioning                                           ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │   Auth    │ │  Patient  │ │   Room    │ │  Report   │       │
│  │  Module   │ │  Module   │ │  Module   │ │  Module   │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ Admission │ │ Rounding  │ │Integration│ │   Admin   │       │
│  │  Module   │ │  Module   │ │  Module   │ │  Module   │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • Entities (Patient, Room, Bed, Report, User)              ││
│  │  • Value Objects (VitalSigns, BloodPressure, Dosage)        ││
│  │  • Domain Services (AdmissionService, TransferService)      ││
│  │  • Domain Events (PatientAdmitted, RoomTransferred)         ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │PostgreSQL │ │   Redis   │ │  Legacy   │ │    S3     │       │
│  │Repository │ │   Cache   │ │  Adapter  │ │  Storage  │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Module Detailed Description

| Module                 | Responsibility                 | Key Features                                       |
| ---------------------- | ------------------------------ | -------------------------------------------------- |
| **Auth Module**        | Authentication/Authorization   | Login, session management, permission verification |
| **Patient Module**     | Patient Management             | Patient CRUD, search, history lookup               |
| **Room Module**        | Room Management                | Room status, layout, vacant beds                   |
| **Admission Module**   | Admission/Discharge Management | Admission, transfer, discharge processing          |
| **Report Module**      | Reports/Logs                   | Nursing logs, treatment reports, vitals            |
| **Rounding Module**    | Rounding Management            | Round records, mobile input                        |
| **Integration Module** | External Integration           | Existing system synchronization                    |
| **Admin Module**       | Administration                 | Users, permissions, settings, logs                 |

---

## 3. Physical Architecture

### 3.1 Deployment Diagram (AWS)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  AWS Cloud                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           VPC (10.0.0.0/16)                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  ┌─────────────── Public Subnet (10.0.1.0/24) ──────────────────┐   │   │
│  │  │                                                               │   │   │
│  │  │   ┌──────────────┐         ┌──────────────┐                  │   │   │
│  │  │   │     ALB      │         │   NAT GW     │                  │   │   │
│  │  │   │ (HTTPS:443)  │         │              │                  │   │   │
│  │  │   └──────┬───────┘         └──────────────┘                  │   │   │
│  │  │          │                                                    │   │   │
│  │  └──────────┼────────────────────────────────────────────────────┘   │   │
│  │             │                                                         │   │
│  │  ┌──────────┼─────── Private Subnet (10.0.2.0/24) ──────────────┐   │   │
│  │  │          │                                                    │   │   │
│  │  │          ▼                                                    │   │   │
│  │  │   ┌──────────────────────────────────────────┐               │   │   │
│  │  │   │            ECS Cluster (Fargate)          │               │   │   │
│  │  │   │  ┌────────────────┐ ┌────────────────┐   │               │   │   │
│  │  │   │  │  App Service   │ │ Worker Service │   │               │   │   │
│  │  │   │  │  (2 Tasks)     │ │ (1 Task)       │   │               │   │   │
│  │  │   │  └────────────────┘ └────────────────┘   │               │   │   │
│  │  │   └──────────────────────────────────────────┘               │   │   │
│  │  │                                                               │   │   │
│  │  └───────────────────────────────────────────────────────────────┘   │   │
│  │                                                                       │   │
│  │  ┌─────────────── Data Subnet (10.0.3.0/24) ────────────────────┐   │   │
│  │  │                                                               │   │   │
│  │  │   ┌────────────────┐         ┌────────────────┐              │   │   │
│  │  │   │  RDS Primary   │ ──────> │  RDS Standby   │              │   │   │
│  │  │   │  PostgreSQL    │         │  (Multi-AZ)    │              │   │   │
│  │  │   └────────────────┘         └────────────────┘              │   │   │
│  │  │                                                               │   │   │
│  │  │   ┌────────────────┐                                         │   │   │
│  │  │   │  ElastiCache   │                                         │   │   │
│  │  │   │  (Redis)       │                                         │   │   │
│  │  │   └────────────────┘                                         │   │   │
│  │  │                                                               │   │   │
│  │  └───────────────────────────────────────────────────────────────┘   │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   CloudFront    │  │       S3        │  │   CloudWatch    │             │
│  │   (CDN)         │  │   (Storage)     │  │   (Monitoring)  │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Container Configuration

```yaml
# docker-compose.yml (Development Environment)
version: '3.8'

services:
  app:
    build: ./apps/backend
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/hospital_erp
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache

  frontend:
    build: ./apps/frontend
    ports:
      - '8080:8080'
    environment:
      - API_URL=http://app:3000

  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=hospital_erp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  cache:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

---

## 4. Data Flow Architecture

### 4.1 Admission Process

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│ Admissions │    │  Frontend  │    │  Backend   │    │  Database  │
│   Clerk    │    │  (Next.js) │    │  (NestJS)  │    │(PostgreSQL)│
└─────┬──────┘    └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
      │                 │                 │                 │
      │  1. Register    │                 │                 │
      │     Admission   │                 │                 │
      │────────────────>│                 │                 │
      │                 │                 │                 │
      │                 │  2. POST /api   │                 │
      │                 │    /admissions  │                 │
      │                 │────────────────>│                 │
      │                 │                 │                 │
      │                 │                 │  3. Query       │
      │                 │                 │     Patient from│
      │                 │                 │     Legacy      │
      │                 │                 │ ──────────────> │
      │                 │                 │ <────────────── │
      │                 │                 │                 │
      │                 │                 │  4. Save        │
      │                 │                 │     Admission   │
      │                 │                 │     Info        │
      │                 │                 │────────────────>│
      │                 │                 │                 │
      │                 │                 │  5. Update      │
      │                 │                 │     Room Status │
      │                 │                 │────────────────>│
      │                 │                 │                 │
      │                 │  6. Success     │                 │
      │                 │     Response    │                 │
      │                 │<────────────────│                 │
      │                 │                 │                 │
      │                 │  7. Real-time   │                 │
      │                 │     Dashboard   │                 │
      │                 │     Update      │                 │
      │                 │    (WebSocket)  │                 │
      │  8. Confirm     │                 │                 │
      │<────────────────│                 │                 │
      │                 │                 │                 │
```

### 4.2 Mobile Rounding Report Process

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│   Doctor   │    │   Tablet   │    │  Backend   │    │   Redis    │
│            │    │  (PWA)     │    │  (NestJS)  │    │  (Cache)   │
└─────┬──────┘    └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
      │                 │                 │                 │
      │  1. Select      │                 │                 │
      │     Patient     │                 │                 │
      │────────────────>│                 │                 │
      │                 │                 │                 │
      │                 │  2. GET /api    │                 │
      │                 │    /patients/:id│                 │
      │                 │────────────────>│                 │
      │                 │                 │  3. Cache       │
      │                 │                 │     Lookup      │
      │                 │                 │────────────────>│
      │                 │                 │<────────────────│
      │                 │                 │                 │
      │                 │  4. Patient     │                 │
      │                 │     Info        │                 │
      │                 │<────────────────│                 │
      │                 │                 │                 │
      │  5. Input       │                 │                 │
      │     Vitals      │                 │                 │
      │────────────────>│                 │                 │
      │                 │                 │                 │
      │                 │  6. POST /api   │                 │
      │                 │    /vitals      │                 │
      │                 │────────────────>│                 │
      │                 │                 │                 │
      │                 │  7. Save        │                 │
      │                 │     Complete    │                 │
      │                 │<────────────────│                 │
      │                 │                 │                 │
      │  8. Next        │                 │                 │
      │     Patient     │                 │                 │
      │────────────────>│                 │                 │
```

---

## 5. Security Architecture

### 5.1 Authentication/Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       Security Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    1. Authentication                      │  │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────────────┐   │  │
│  │  │  Login   │───>│  Verify  │───>│  Issue JWT       │   │  │
│  │  │  Request │    │  Creds   │    │  (Access+Refresh)│   │  │
│  │  └──────────┘    └──────────┘    └──────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    2. Authorization                       │  │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────────────┐   │  │
│  │  │  API     │───>│  RBAC    │───>│  Resource        │   │  │
│  │  │  Request │    │  Check   │    │  Access Control  │   │  │
│  │  └──────────┘    └──────────┘    └──────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    3. Audit Logging                       │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  WHO(User) + WHEN(Time) + WHAT(Action) + WHERE   │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Role-Based Access Control (RBAC)

```typescript
// Role and Permission Definitions
enum Role {
  ADMIN = 'ADMIN', // System Administrator
  DOCTOR = 'DOCTOR', // Doctor
  HEAD_NURSE = 'HEAD_NURSE', // Head Nurse
  NURSE = 'NURSE', // Nurse
  CLERK = 'CLERK', // Admissions Clerk
}

// Permission Mapping
const permissions = {
  [Role.ADMIN]: ['*'], // Full Permissions
  [Role.DOCTOR]: ['patient:read', 'patient:update', 'report:read', 'report:write', 'rounding:*'],
  [Role.HEAD_NURSE]: ['patient:read', 'patient:update', 'room:read', 'room:update', 'report:*'],
  [Role.NURSE]: ['patient:read', 'vital:write', 'report:read', 'report:write:own'],
  [Role.CLERK]: ['patient:read', 'patient:create', 'admission:*', 'room:read'],
};
```

---

## 6. Integration Architecture

### 6.1 Legacy System Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Integration Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐         ┌────────────────────────────────┐ │
│  │  Existing      │         │         New ERP System          │ │
│  │  Medical       │         │                                │ │
│  │  Program       │         │  ┌────────────────────────┐   │ │
│  │                │         │  │   Integration Module   │   │ │
│  │  ┌──────────┐  │         │  │                        │   │ │
│  │  │  Legacy  │  │ ──────> │  │  ┌──────────────────┐ │   │ │
│  │  │  DB      │  │  JDBC/  │  │  │  Legacy Adapter  │ │   │ │
│  │  │          │  │  API    │  │  └──────────────────┘ │   │ │
│  │  └──────────┘  │         │  │                        │   │ │
│  │                │         │  │  ┌──────────────────┐ │   │ │
│  └────────────────┘         │  │  │  Data Mapper     │ │   │ │
│                             │  │  └──────────────────┘ │   │ │
│                             │  │                        │   │ │
│                             │  │  ┌──────────────────┐ │   │ │
│                             │  │  │  Sync Scheduler  │ │   │ │
│                             │  │  └──────────────────┘ │   │ │
│                             │  │                        │   │ │
│                             │  └────────────────────────┘   │ │
│                             │                                │ │
│                             │  ┌────────────────────────┐   │ │
│                             │  │      ERP Database      │   │ │
│                             │  └────────────────────────┘   │ │
│                             │                                │ │
│                             └────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Synchronization Strategy

| Data Type          | Sync Method     | Frequency      | Notes                  |
| ------------------ | --------------- | -------------- | ---------------------- |
| Patient Basic Info | Pull (on query) | Real-time      | 5-minute cache         |
| Medical Records    | Pull (on query) | Real-time      | Read-only              |
| Admission Status   | Bidirectional   | Event-based    | Transaction processing |
| Prescription Info  | Pull            | 5-minute batch | Read-only              |

---

## 7. Scalability and Availability

### 7.1 Horizontal Scaling Strategy

```
                     ┌─────────────────┐
                     │  Load Balancer  │
                     │     (ALB)       │
                     └────────┬────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   App #1     │     │   App #2     │     │   App #3     │
│  (Container) │     │  (Container) │     │  (Container) │
└──────────────┘     └──────────────┘     └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐   ┌──────────────┐
            │   Primary    │   │   Replica    │
            │   (RDS)      │   │   (Read)     │
            └──────────────┘   └──────────────┘
```

### 7.2 Availability Design

| Component   | Availability Strategy | Target RTO | Target RPO |
| ----------- | --------------------- | ---------- | ---------- |
| Application | Multi-AZ Deployment   | 1 min      | 0          |
| Database    | RDS Multi-AZ          | 5 min      | 1 min      |
| Cache       | Redis Cluster         | 1 min      | 5 min      |
| Storage     | S3 Cross-Region       | 1 hour     | 0          |

---

## 8. Monitoring and Operations

### 8.1 Observability Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    Observability Stack                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │    Metrics     │  │     Logs       │  │    Traces      │    │
│  │  (CloudWatch)  │  │  (CloudWatch   │  │   (X-Ray)      │    │
│  │                │  │   Logs)        │  │                │    │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘    │
│          │                   │                   │              │
│          └───────────────────┼───────────────────┘              │
│                              │                                   │
│                              ▼                                   │
│                    ┌────────────────┐                           │
│                    │   Dashboard    │                           │
│                    │  (CloudWatch)  │                           │
│                    └───────┬────────┘                           │
│                            │                                     │
│                            ▼                                     │
│                    ┌────────────────┐                           │
│                    │    Alerts      │                           │
│                    │    (SNS)       │                           │
│                    └────────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Key Metrics

| Metric                  | Threshold  | Alert    |
| ----------------------- | ---------- | -------- |
| API Response Time (P95) | > 1 second | Warning  |
| API Error Rate          | > 1%       | Critical |
| CPU Usage               | > 80%      | Warning  |
| Memory Usage            | > 85%      | Warning  |
| DB Connection Pool      | > 80%      | Warning  |
| Concurrent Users        | > 100      | Info     |

---

## Appendix: Architecture Decision Records (ADR)

### ADR-001: Monolithic vs Microservices

**Status**: Approved

**Decision**: Adopt Modular Monolithic Architecture

**Rationale**:

1. Microservices is excessive for initial scale (under 100 concurrent users)
2. Minimize development/operations complexity
3. Modules can be separated later if needed

### ADR-002: Database Selection

**Status**: Approved

**Decision**: Adopt PostgreSQL 16

**Rationale**:

1. ACID guarantees essential for medical data
2. Flexible schema extension with JSONB
3. Per-patient access control with Row-Level Security
4. Mature ecosystem and tool support
