# 소프트웨어 설계 명세서 (SDS)
# 입원환자 관리 ERP 시스템

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0.0 |
| 작성일 | 2025-12-29 |
| 상태 | 초안 |
| 관리자 | kcenon@naver.com |
| 표준 기준 | IEEE 1016-2009 / IEEE Std 1016-1998 |
| 제품명 | 입원환자 관리 ERP 시스템 (Inpatient Management ERP System) |

---

## 문서 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2025-12-29 | - | 초안 작성 |

---

## 목차

1. [소개](#1-소개)
2. [설계 개요](#2-설계-개요)
3. [시스템 아키텍처 설계](#3-시스템-아키텍처-설계)
4. [모듈 상세 설계](#4-모듈-상세-설계)
5. [데이터 설계](#5-데이터-설계)
6. [인터페이스 설계](#6-인터페이스-설계)
7. [보안 설계](#7-보안-설계)
8. [설계 제약사항 및 의존성](#8-설계-제약사항-및-의존성)
9. [요구사항-설계 추적 매트릭스](#9-요구사항-설계-추적-매트릭스)
10. [부록](#10-부록)

---

## 1. 소개

### 1.1 목적

본 문서는 **입원환자 관리 ERP 시스템**의 소프트웨어 설계를 상세히 기술합니다. SRS(소프트웨어 요구사항 명세서)에서 정의된 기능적, 비기능적 요구사항을 구현하기 위한 시스템 아키텍처, 모듈 구조, 데이터 설계, 인터페이스 설계를 제공합니다.

**이 문서의 대상:**
- **개발팀**: 구현의 기준 및 가이드
- **아키텍트**: 설계 검토 및 승인
- **품질 보증팀**: 설계 기반 테스트 계획 수립
- **유지보수팀**: 시스템 이해 및 변경 영향 분석

> **추적성 참조**: [SRS.md](SRS.md) 섹션 1.1, [PRD.md](PRD.md) 섹션 1

### 1.2 범위

본 설계 문서는 다음 범위를 포함합니다:

```
SDS 범위
├── 시스템 아키텍처
│   ├── 논리적 아키텍처 (계층, 모듈)
│   ├── 물리적 아키텍처 (배포, 인프라)
│   └── 통합 아키텍처 (외부 시스템 연동)
│
├── 모듈 상세 설계
│   ├── 인증 모듈 (Auth)
│   ├── 환자 관리 모듈 (Patient)
│   ├── 병실 관리 모듈 (Room)
│   ├── 입퇴원 관리 모듈 (Admission)
│   ├── 보고서/일지 모듈 (Report)
│   ├── 라운딩 모듈 (Rounding)
│   └── 관리자 모듈 (Admin)
│
├── 데이터 설계
│   ├── 논리적 데이터 모델
│   ├── 물리적 데이터 모델
│   └── 데이터 흐름
│
├── 인터페이스 설계
│   ├── 사용자 인터페이스
│   ├── API 인터페이스
│   └── 외부 시스템 인터페이스
│
└── 보안 설계
    ├── 인증/인가
    ├── 데이터 보호
    └── 감사 로깅
```

> **추적성 참조**: [SRS.md](SRS.md) 섹션 1.2, [PRD.md](PRD.md) 섹션 5.1

### 1.3 정의 및 약어

| 용어/약어 | 정의 |
|----------|------|
| **SDS** | Software Design Specification, 소프트웨어 설계 명세서 |
| **SRS** | Software Requirements Specification, 소프트웨어 요구사항 명세서 |
| **PRD** | Product Requirements Document, 제품 요구사항 문서 |
| **DDD** | Domain-Driven Design, 도메인 주도 설계 |
| **CQRS** | Command Query Responsibility Segregation |
| **DTO** | Data Transfer Object |
| **VO** | Value Object |

> **추적성 참조**: [SRS.md](SRS.md) 섹션 1.3, [용어사전.md](reference/04-appendix/glossary.md)

### 1.4 참조 문서

| 문서 ID | 문서명 | 위치 | 관계 |
|---------|--------|------|------|
| **DOC-SRS** | 소프트웨어 요구사항 명세서 | [SRS.md](SRS.md) | 요구사항 소스 |
| **DOC-PRD** | 제품 요구사항 명세서 | [PRD.md](PRD.md) | 비즈니스 요구사항 |
| **DOC-ARCH** | 시스템 아키텍처 | [시스템-아키텍처.md](reference/02-design/system-architecture.md) | 아키텍처 상세 |
| **DOC-DB** | 데이터베이스 설계서 | [데이터베이스-설계.md](reference/02-design/database-design.md) | DB 스키마 |
| **DOC-API** | API 명세서 | [API-명세서.md](reference/02-design/api-specification.md) | API 정의 |
| **DOC-UI** | 화면 설계서 | [화면-설계.md](reference/02-design/ui-design.md) | UI 설계 |
| **DOC-SEC** | 보안 요구사항 | [보안-요구사항.md](reference/03-security/security-requirements.md) | 보안 정책 |

---

## 2. 설계 개요

### 2.1 설계 목표

본 시스템의 설계는 다음 목표를 달성하도록 수립되었습니다:

| ID | 목표 | 관련 요구사항 | 설계 접근법 |
|----|------|--------------|------------|
| **DG-01** | 유지보수성 | REQ-NFR-050~054 | 모듈러 모놀리식, DDD 적용 |
| **DG-02** | 확장성 | REQ-NFR-070~072 | 수평 확장 가능 아키텍처 |
| **DG-03** | 보안성 | REQ-NFR-010~033 | 계층별 보안, 암호화 |
| **DG-04** | 성능 | REQ-NFR-001~006 | 캐싱, 비동기 처리 |
| **DG-05** | 신뢰성 | REQ-NFR-040~043 | 고가용성, 장애 복구 |

> **추적성 참조**: [SRS.md](SRS.md) 섹션 5

### 2.2 설계 원칙

```
┌─────────────────────────────────────────────────────────────────┐
│                        설계 원칙                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  SOLID 원칙       │    │  클린 아키텍처    │                   │
│  │  ─────────────   │    │  ─────────────   │                   │
│  │  S: 단일 책임     │    │  의존성 역전      │                   │
│  │  O: 개방-폐쇄     │    │  계층 분리        │                   │
│  │  L: 리스코프 치환  │    │  비즈니스 중심    │                   │
│  │  I: 인터페이스 분리│    │                  │                   │
│  │  D: 의존성 역전   │    │                  │                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  도메인 주도 설계  │    │  보안 설계       │                   │
│  │  ─────────────   │    │  ─────────────   │                   │
│  │  Bounded Context │    │  Defense in Depth│                   │
│  │  Aggregate       │    │  Least Privilege │                   │
│  │  Value Object    │    │  Fail Secure     │                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 아키텍처 결정 기록 (ADR)

| ADR ID | 결정 사항 | 근거 | 영향받는 요구사항 |
|--------|----------|------|------------------|
| **ADR-001** | 모듈러 모놀리식 | 초기 규모, 운영 복잡도 | REQ-NFR-050, 054 |
| **ADR-002** | PostgreSQL 16 | ACID, 의료 데이터 신뢰성 | REQ-NFR-040~043 |
| **ADR-003** | NestJS + Next.js | 타입 안정성, SSR | REQ-NFR-060, 061 |
| **ADR-004** | JWT + Redis | 세션 관리, 확장성 | REQ-NFR-010~015 |
| **ADR-005** | WebSocket | 실시간 현황판 | REQ-FR-013 |

> **추적성 참조**: [시스템-아키텍처.md](reference/02-design/system-architecture.md) 부록 ADR

---

## 3. 시스템 아키텍처 설계

### 3.1 논리적 아키텍처

#### 3.1.1 계층 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│  ───────────────────────────────────────────────────────────    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  PC Web     │  │  Tablet Web │  │  Mobile Web (PWA)       │  │
│  │  (Next.js)  │  │  (Next.js)  │  │  (Next.js)              │  │
│  │             │  │             │  │                         │  │
│  │ 원무/관리용  │  │   회진용    │  │     간호사용            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                  │
│  관련 요구사항: REQ-FR UI-01~05, REQ-NFR-060~062                 │
├─────────────────────────────────────────────────────────────────┤
│                    API GATEWAY LAYER                             │
│  ───────────────────────────────────────────────────────────    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • JWT 검증 및 인증 (REQ-NFR-010~015)                        ││
│  │  • RBAC 권한 검증 (REQ-NFR-023)                              ││
│  │  • Rate Limiting (분당 100 요청)                             ││
│  │  • Request/Response 로깅 (REQ-NFR-030~033)                   ││
│  │  • API 버전 관리 (/v1/)                                      ││
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

> **추적성 참조**: [시스템-아키텍처.md](reference/02-design/system-architecture.md) 섹션 2

#### 3.1.2 모듈 의존성

```
┌─────────────────────────────────────────────────────────────────┐
│                     모듈 의존성 다이어그램                         │
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

### 3.2 물리적 아키텍처

#### 3.2.1 배포 다이어그램

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

> **추적성 참조**: [시스템-아키텍처.md](reference/02-design/system-architecture.md) 섹션 3

#### 3.2.2 인프라 사양

| 구성요소 | 사양 | 관련 요구사항 |
|----------|------|--------------|
| **App Server** | Fargate 2vCPU, 4GB RAM | REQ-NFR-001~003 |
| **Database** | RDS db.r6g.large (Multi-AZ) | REQ-NFR-040~043 |
| **Cache** | ElastiCache cache.r6g.large | REQ-NFR-005, 006 |
| **Storage** | S3 Standard | REQ-NFR-040~043 |
| **CDN** | CloudFront | REQ-NFR-001 |

### 3.3 통합 아키텍처

#### 3.3.1 외부 시스템 연동

```
┌─────────────────────────────────────────────────────────────────┐
│                    통합 아키텍처                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐         ┌────────────────────────────────┐  │
│  │  기존 진료      │         │         신규 ERP 시스템         │  │
│  │  프로그램       │         │                                │  │
│  │                │         │  ┌────────────────────────┐    │  │
│  │  ┌──────────┐  │         │  │   Integration Module   │    │  │
│  │  │  Legacy  │  │ ──────> │  │                        │    │  │
│  │  │  DB      │  │  JDBC   │  │  ┌──────────────────┐  │    │  │
│  │  │          │  │  조회   │  │  │  Legacy Adapter  │  │    │  │
│  │  └──────────┘  │         │  │  │                  │  │    │  │
│  │                │         │  │  │ • 환자 조회      │  │    │  │
│  │                │         │  │  │ • 진료 내역 조회  │  │    │  │
│  │                │         │  │  │ • 데이터 매핑    │  │    │  │
│  │                │         │  │  └──────────────────┘  │    │  │
│  │                │         │  │                        │    │  │
│  │                │         │  │  ┌──────────────────┐  │    │  │
│  │                │         │  │  │  Cache Layer     │  │    │  │
│  │                │         │  │  │  (Redis 5분 TTL) │  │    │  │
│  │                │         │  │  └──────────────────┘  │    │  │
│  │                │         │  │                        │    │  │
│  └────────────────┘         │  └────────────────────────┘    │  │
│                             │                                │  │
│                             │  관련 요구사항:                 │  │
│                             │  REQ-FR-005, REQ-FR-006        │  │
│                             │                                │  │
│                             └────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3.2 동기화 전략

| 데이터 유형 | 동기화 방식 | 주기 | 캐시 TTL | 관련 요구사항 |
|------------|------------|------|---------|--------------|
| 환자 기본정보 | Pull (조회 시) | 실시간 | 5분 | REQ-FR-005 |
| 진료 내역 | Pull (조회 시) | 실시간 | 5분 | REQ-FR-005 |
| 입원 상태 | Event-driven | 이벤트 | - | REQ-FR-006 |

> **추적성 참조**: [시스템-아키텍처.md](reference/02-design/system-architecture.md) 섹션 6

---

## 4. 모듈 상세 설계

### 4.1 인증 모듈 (Auth Module)

#### 4.1.1 모듈 개요

| 항목 | 내용 |
|------|------|
| **책임** | 사용자 인증, 세션 관리, 권한 검증 |
| **관련 요구사항** | REQ-NFR-010~015, REQ-FR-060~064 |
| **외부 의존성** | Redis (세션), PostgreSQL (사용자) |

#### 4.1.2 컴포넌트 구조

```typescript
// Auth Module 구조
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

#### 4.1.3 클래스 다이어그램

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

#### 4.1.4 인증 흐름 시퀀스

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

> **추적성**: REQ-NFR-010~015 → AuthService, SessionService

### 4.2 환자 관리 모듈 (Patient Module)

#### 4.2.1 모듈 개요

| 항목 | 내용 |
|------|------|
| **책임** | 환자 CRUD, 검색, 기존 시스템 연동 |
| **관련 요구사항** | REQ-FR-001~006 |
| **외부 의존성** | Integration Module (기존 시스템) |

#### 4.2.2 컴포넌트 구조

```typescript
// Patient Module 구조
@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, PatientDetail]),
    IntegrationModule,
    CacheModule,
  ],
  controllers: [PatientController],
  providers: [
    PatientService,
    PatientRepository,
    PatientSearchService,
    LegacyPatientAdapter,
  ],
  exports: [PatientService],
})
export class PatientModule {}
```

#### 4.2.3 엔티티 설계

```typescript
// Patient Entity
@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  patientNumber: string;  // P2025001234

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
  legacyPatientId?: string;  // 기존 시스템 ID (REQ-FR-005)

  @OneToOne(() => PatientDetail, detail => detail.patient)
  detail: PatientDetail;

  @OneToMany(() => Admission, admission => admission.patient)
  admissions: Admission[];
}

// PatientDetail Entity (암호화 필드)
@Entity('patient_details')
export class PatientDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Patient)
  @JoinColumn()
  patient: Patient;

  @Column({ type: 'bytea', nullable: true })
  ssnEncrypted?: Buffer;  // 주민번호 (REQ-NFR-020)

  @Column({ type: 'bytea', nullable: true })
  medicalHistoryEncrypted?: Buffer;  // 병력 (REQ-NFR-020)

  @Column({ type: 'text', nullable: true })
  allergies?: string;
}
```

> **추적성**: REQ-FR-001~006 → PatientService, PatientController

### 4.3 병실 관리 모듈 (Room Module)

#### 4.3.1 모듈 개요

| 항목 | 내용 |
|------|------|
| **책임** | 병실 현황, 병상 관리, 실시간 업데이트 |
| **관련 요구사항** | REQ-FR-010~015 |
| **외부 의존성** | WebSocket Gateway |

#### 4.3.2 컴포넌트 구조

```typescript
// Room Module 구조
@Module({
  imports: [
    TypeOrmModule.forFeature([Building, Floor, Room, Bed]),
    CacheModule,
  ],
  controllers: [RoomController],
  providers: [
    RoomService,
    BedService,
    RoomDashboardService,
    RoomGateway,  // WebSocket (REQ-FR-013)
  ],
  exports: [RoomService, BedService],
})
export class RoomModule {}
```

#### 4.3.3 실시간 현황판 설계

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

  // 병상 상태 변경 시 브로드캐스트
  async broadcastRoomUpdate(roomId: string, status: RoomStatus) {
    const room = await this.roomService.findById(roomId);
    this.server
      .to(`floor:${room.floorId}`)
      .emit('room:status', {
        roomId,
        status,
        updatedAt: new Date(),
      });
  }
}
```

> **추적성**: REQ-FR-013 → RoomGateway (WebSocket 실시간 업데이트)

### 4.4 입퇴원 관리 모듈 (Admission Module)

#### 4.4.1 모듈 개요

| 항목 | 내용 |
|------|------|
| **책임** | 입원, 전실, 퇴원 처리 |
| **관련 요구사항** | REQ-FR-020~025 |
| **외부 의존성** | Patient, Room, Integration |

#### 4.4.2 도메인 서비스 설계

```typescript
// Admission Domain Service
@Injectable()
export class AdmissionDomainService {
  constructor(
    private readonly admissionRepo: AdmissionRepository,
    private readonly bedService: BedService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // 입원 처리 (REQ-FR-020)
  async admitPatient(dto: CreateAdmissionDto): Promise<Admission> {
    // 1. 병상 가용 여부 확인
    const bed = await this.bedService.findAvailableBed(dto.bedId);
    if (!bed) {
      throw new BedNotAvailableException(dto.bedId);
    }

    // 2. 입원 레코드 생성
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

    // 3. 병상 상태 업데이트
    await this.bedService.occupy(dto.bedId, admission.id);

    // 4. 도메인 이벤트 발행
    this.eventEmitter.emit('admission.created', {
      admissionId: admission.id,
      patientId: dto.patientId,
      bedId: dto.bedId,
    });

    return admission;
  }

  // 전실 처리 (REQ-FR-021)
  async transferPatient(admissionId: string, dto: TransferDto): Promise<Transfer> {
    const admission = await this.admissionRepo.findActiveById(admissionId);
    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    // 1. 새 병상 가용 여부 확인
    const newBed = await this.bedService.findAvailableBed(dto.toBedId);
    if (!newBed) {
      throw new BedNotAvailableException(dto.toBedId);
    }

    // 2. 전실 기록 생성
    const transfer = await this.transferRepo.create({
      admissionId,
      fromBedId: admission.bedId,
      toBedId: dto.toBedId,
      transferDate: dto.transferDate,
      reason: dto.reason,
    });

    // 3. 병상 상태 업데이트
    await this.bedService.release(admission.bedId);
    await this.bedService.occupy(dto.toBedId, admissionId);

    // 4. 도메인 이벤트 발행
    this.eventEmitter.emit('admission.transferred', {
      admissionId,
      fromBedId: admission.bedId,
      toBedId: dto.toBedId,
    });

    return transfer;
  }

  // 퇴원 처리 (REQ-FR-022)
  async dischargePatient(admissionId: string, dto: DischargeDto): Promise<Discharge> {
    // ... 퇴원 로직
  }
}
```

#### 4.4.3 이벤트 핸들러

```typescript
// 입퇴원 이벤트 핸들러
@Injectable()
export class AdmissionEventHandler {
  constructor(
    private readonly roomGateway: RoomGateway,
    private readonly auditService: AuditService,
  ) {}

  @OnEvent('admission.created')
  async handleAdmissionCreated(event: AdmissionCreatedEvent) {
    // 병실 현황판 실시간 업데이트 (REQ-FR-025)
    await this.roomGateway.broadcastRoomUpdate(event.bedId, 'OCCUPIED');

    // 감사 로그 (REQ-NFR-031)
    await this.auditService.log({
      action: 'CREATE',
      resourceType: 'admission',
      resourceId: event.admissionId,
    });
  }

  @OnEvent('admission.discharged')
  async handleAdmissionDischarged(event: AdmissionDischargedEvent) {
    // 병실 현황판 실시간 업데이트
    await this.roomGateway.broadcastRoomUpdate(event.bedId, 'EMPTY');
  }
}
```

> **추적성**: REQ-FR-020~025 → AdmissionDomainService

### 4.5 보고서 모듈 (Report Module)

#### 4.5.1 모듈 개요

| 항목 | 내용 |
|------|------|
| **책임** | 바이탈, I/O, 투약, 간호 일지 관리 |
| **관련 요구사항** | REQ-FR-030~045 |
| **외부 의존성** | Admission Module |

#### 4.5.2 Value Object 설계

```typescript
// VitalSigns Value Object (REQ-FR-030~035)
export class VitalSigns {
  constructor(
    public readonly temperature: number,      // 체온 (°C)
    public readonly systolicBp: number,       // 수축기 혈압 (mmHg)
    public readonly diastolicBp: number,      // 이완기 혈압 (mmHg)
    public readonly pulseRate: number,        // 맥박 (bpm)
    public readonly respiratoryRate: number,  // 호흡수 (/min)
    public readonly oxygenSaturation: number, // 산소포화도 (%)
    public readonly bloodGlucose?: number,    // 혈당 (mg/dL)
  ) {
    this.validate();
  }

  private validate() {
    // 정상 범위 검증 (REQ-FR-033)
    if (this.temperature < 30 || this.temperature > 45) {
      throw new InvalidVitalValueException('temperature', this.temperature);
    }
    // ... 다른 항목 검증
  }

  // 이상치 판정 (REQ-FR-033)
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

    // ... 다른 항목 검증

    return alerts;
  }
}
```

#### 4.5.3 일일 보고서 집계 서비스

```typescript
// 일일 보고서 집계 (REQ-FR-040)
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
    const totalIntake = ios.reduce((sum, io) =>
      sum + io.oralIntake + io.ivIntake + io.otherIntake, 0);
    const totalOutput = ios.reduce((sum, io) =>
      sum + io.urineOutput + io.stoolOutput + io.vomitOutput + io.drainageOutput, 0);

    return {
      totalIntake,
      totalOutput,
      balance: totalIntake - totalOutput,
    };
  }
}
```

> **추적성**: REQ-FR-030~045 → VitalSigns, DailyReportAggregator

### 4.6 라운딩 모듈 (Rounding Module)

#### 4.6.1 모듈 개요

| 항목 | 내용 |
|------|------|
| **책임** | 라운딩 세션 관리, 기록 입력 |
| **관련 요구사항** | REQ-FR-050~054 |
| **외부 의존성** | Admission, Report Module |

#### 4.6.2 라운딩 세션 상태 머신

```
┌─────────────────────────────────────────────────────────────────┐
│                   라운딩 세션 상태 머신                            │
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

#### 4.6.3 태블릿 라운딩 서비스

```typescript
// 태블릿 라운딩 서비스 (REQ-FR-053)
@Injectable()
export class TabletRoundingService {
  constructor(
    private readonly roundRepo: RoundRepository,
    private readonly admissionService: AdmissionService,
    private readonly vitalService: VitalSignService,
  ) {}

  // 라운딩 환자 목록 조회 (REQ-FR-054)
  async getRoundingPatientList(roundId: string): Promise<RoundingPatient[]> {
    const round = await this.roundRepo.findById(roundId);
    const admissions = await this.admissionService.findActiveByFloor(round.floorId);

    return Promise.all(admissions.map(async (admission) => {
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
    }));
  }

  // 라운딩 기록 추가 (REQ-FR-051)
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

> **추적성**: REQ-FR-050~054 → TabletRoundingService

### 4.7 관리자 모듈 (Admin Module)

#### 4.7.1 모듈 개요

| 항목 | 내용 |
|------|------|
| **책임** | 사용자 관리, 역할/권한 관리, 감사 로그 |
| **관련 요구사항** | REQ-FR-060~064, REQ-NFR-030~033 |
| **외부 의존성** | Auth Module |

#### 4.7.2 감사 로그 서비스

```typescript
// 감사 로그 서비스 (REQ-NFR-030~033)
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

  // 환자 정보 접근 로그 (REQ-NFR-031)
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

> **추적성**: REQ-NFR-030~033 → AuditService

---

## 5. 데이터 설계

### 5.1 논리적 데이터 모델

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         논리적 데이터 모델 (ERD)                              │
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

> **추적성 참조**: [데이터베이스-설계.md](reference/02-design/database-design.md) 섹션 2, 3

### 5.2 스키마별 테이블 매핑

| 스키마 | 테이블 | 관련 요구사항 |
|--------|--------|--------------|
| **public** | users, roles, permissions, user_roles | REQ-FR-060~064 |
| **patient** | patients, patient_details | REQ-FR-001~006 |
| **room** | buildings, floors, rooms, beds | REQ-FR-010~015 |
| **admission** | admissions, transfers, discharges | REQ-FR-020~025 |
| **report** | vital_signs, intake_outputs, medications, nursing_notes, daily_reports | REQ-FR-030~045 |
| **rounding** | rounds, round_records | REQ-FR-050~054 |
| **audit** | access_logs, change_logs, login_history | REQ-NFR-030~033 |

### 5.3 암호화 필드

| 테이블 | 필드 | 암호화 방식 | 관련 요구사항 |
|--------|------|------------|--------------|
| patient_details | ssn_encrypted | AES-256-GCM (pgcrypto) | REQ-NFR-020 |
| patient_details | medical_history | AES-256-GCM | REQ-NFR-020 |
| patient_details | insurance_info | AES-256-GCM | REQ-NFR-020 |
| users | password_hash | bcrypt (cost 12) | REQ-NFR-011 |

> **추적성 참조**: [보안-요구사항.md](reference/03-security/security-requirements.md) 섹션 4

### 5.4 인덱스 전략

| 테이블 | 인덱스 | 용도 | 관련 요구사항 |
|--------|--------|------|--------------|
| patients | (patient_number) | 환자번호 검색 | REQ-FR-001 |
| patients | (name) | 이름 검색 | REQ-FR-001 |
| admissions | (patient_id, status) | 활성 입원 조회 | REQ-FR-002 |
| beds | (room_id, status) | 빈 병상 검색 | REQ-FR-011 |
| vital_signs | (admission_id, measured_at DESC) | 최신 바이탈 | REQ-FR-031 |
| access_logs | (created_at, user_id) | 감사 로그 조회 | REQ-NFR-030 |

---

## 6. 인터페이스 설계

### 6.1 사용자 인터페이스

#### 6.1.1 화면-요구사항 매핑

| 화면 ID | 화면명 | 관련 요구사항 | 사용자 |
|---------|--------|--------------|--------|
| SCR-01 | 로그인 | REQ-NFR-010~015 | 전체 |
| SCR-02 | 대시보드 | REQ-FR-010, 013 | 전체 |
| SCR-03 | 환자 목록 | REQ-FR-001 | 전체 |
| SCR-04 | 환자 상세 | REQ-FR-002, 031, 032 | 전체 |
| SCR-05 | 병실 현황판 | REQ-FR-010~015 | 전체 |
| SCR-06 | 입원 등록 | REQ-FR-020, 024 | 원무과 |
| SCR-07 | 바이탈 입력 | REQ-FR-030, 034, 035 | 간호사 |
| SCR-08 | 라운딩 | REQ-FR-050~054 | 의사 |
| SCR-09 | 관리자 | REQ-FR-060~064 | 관리자 |

> **추적성 참조**: [화면-설계.md](reference/02-design/ui-design.md)

#### 6.1.2 반응형 설계

| 플랫폼 | 해상도 | 최적화 화면 | 관련 요구사항 |
|--------|--------|------------|--------------|
| PC Web | 1024px+ | 전체 화면 | UI-01, REQ-NFR-061 |
| Tablet | 768px+ | 라운딩, 환자 상세 | UI-02, REQ-NFR-061 |
| Mobile PWA | 320px+ | 바이탈 입력, 조회 | UI-03, REQ-NFR-061, 062 |

### 6.2 API 인터페이스

#### 6.2.1 API 엔드포인트 매핑

| 엔드포인트 | 메서드 | 관련 요구사항 | 인증 | 권한 |
|-----------|--------|--------------|------|------|
| `/auth/login` | POST | REQ-NFR-010 | - | - |
| `/auth/refresh` | POST | REQ-NFR-013 | JWT | - |
| `/patients` | GET | REQ-FR-001 | JWT | patient:read |
| `/patients/:id` | GET | REQ-FR-002 | JWT | patient:read |
| `/patients` | POST | REQ-FR-003 | JWT | patient:create |
| `/patients/:id` | PATCH | REQ-FR-004 | JWT | patient:update |
| `/patients/search/legacy` | GET | REQ-FR-005 | JWT | patient:read |
| `/rooms` | GET | REQ-FR-010 | JWT | room:read |
| `/rooms/dashboard/floor/:id` | GET | REQ-FR-010 | JWT | room:read |
| `/beds/available` | GET | REQ-FR-011 | JWT | room:read |
| `/admissions` | POST | REQ-FR-020 | JWT | admission:create |
| `/admissions/:id/transfer` | POST | REQ-FR-021 | JWT | admission:update |
| `/admissions/:id/discharge` | POST | REQ-FR-022 | JWT | admission:update |
| `/admissions/:id/vitals` | POST | REQ-FR-030 | JWT | vital:write |
| `/admissions/:id/vitals` | GET | REQ-FR-031 | JWT | vital:read |
| `/rounds` | POST | REQ-FR-050 | JWT | round:write |
| `/rounds/:id/records` | POST | REQ-FR-051 | JWT | round:write |
| `/admin/users` | GET/POST | REQ-FR-060 | JWT | admin:users |
| `/admin/audit/access-logs` | GET | REQ-FR-062 | JWT | admin:audit |

> **추적성 참조**: [API-명세서.md](reference/02-design/api-specification.md)

#### 6.2.2 WebSocket 이벤트

| 이벤트 | 방향 | 관련 요구사항 | 설명 |
|--------|------|--------------|------|
| `room:status` | S→C | REQ-FR-013 | 병실 상태 변경 |
| `admission:created` | S→C | REQ-FR-025 | 새 입원 알림 |
| `admission:discharged` | S→C | REQ-FR-025 | 퇴원 알림 |
| `vital:recorded` | S→C | REQ-FR-033 | 바이탈 기록 (이상치) |
| `subscribe:floor` | C→S | REQ-FR-013 | 층별 구독 |

### 6.3 외부 시스템 인터페이스

#### 6.3.1 기존 진료 프로그램 연동

| 인터페이스 | 방식 | 데이터 | 관련 요구사항 |
|-----------|------|--------|--------------|
| 환자 기본정보 조회 | JDBC/API | 이름, 생년월일, 성별 등 | REQ-FR-005 |
| 진료 내역 조회 | JDBC/API | 처방, 검사 결과 | REQ-FR-005 |
| 환자 동기화 | Event-based | 환자 기본정보 | REQ-FR-006 |

```typescript
// Legacy Adapter Interface
interface LegacyPatientAdapter {
  findPatientById(legacyId: string): Promise<LegacyPatient>;
  searchPatients(query: string): Promise<LegacyPatient[]>;
  getMedicalHistory(legacyId: string): Promise<MedicalHistory>;
}
```

> **추적성 참조**: [시스템-아키텍처.md](reference/02-design/system-architecture.md) 섹션 6

---

## 7. 보안 설계

### 7.1 인증 설계

#### 7.1.1 인증 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                        인증 흐름                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    1. 로그인 요청                           │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  Client ──► username/password ──► AuthService             │ │
│  │                                        │                   │ │
│  │                            ┌───────────┴───────────┐       │ │
│  │                            │ 비밀번호 검증 (bcrypt) │       │ │
│  │                            │ REQ-NFR-011           │       │ │
│  │                            └───────────────────────┘       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    2. 토큰 발급                             │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  ┌─────────────────┐    ┌─────────────────┐               │ │
│  │  │  Access Token   │    │  Refresh Token  │               │ │
│  │  │  (1시간 유효)    │    │  (7일 유효)     │               │ │
│  │  │  REQ-NFR-013    │    │  REQ-NFR-013    │               │ │
│  │  └─────────────────┘    └─────────────────┘               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    3. 세션 관리                             │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  Redis Session: { userId, jti, deviceInfo, lastActivity }  │ │
│  │  ┌─────────────────┐    ┌─────────────────┐               │ │
│  │  │ 유휴 타임아웃    │    │ 동시 세션 제한   │               │ │
│  │  │ 30분            │    │ 최대 3개        │               │ │
│  │  │ REQ-NFR-013     │    │ REQ-NFR-014     │               │ │
│  │  └─────────────────┘    └─────────────────┘               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.1.2 비밀번호 정책

| 정책 항목 | 설정값 | 관련 요구사항 |
|----------|--------|--------------|
| 최소 길이 | 8자 | REQ-NFR-010 |
| 대문자 포함 | 필수 | REQ-NFR-010 |
| 소문자 포함 | 필수 | REQ-NFR-010 |
| 숫자 포함 | 필수 | REQ-NFR-010 |
| 특수문자 포함 | 필수 | REQ-NFR-010 |
| 해싱 알고리즘 | bcrypt (cost 12) | REQ-NFR-011 |
| 로그인 실패 제한 | 5회/15분 잠금 | REQ-NFR-015 |

### 7.2 인가 설계

#### 7.2.1 RBAC 권한 매트릭스

| 리소스 | 권한 | ADMIN | DOCTOR | HEAD_NURSE | NURSE | CLERK |
|--------|------|:-----:|:------:|:----------:|:-----:|:-----:|
| patient | read | ✅ | ✅ | ✅ | ✅* | ✅ |
| patient | create | ✅ | ❌ | ❌ | ❌ | ✅ |
| patient | update | ✅ | ✅* | ✅ | ❌ | ✅ |
| room | read | ✅ | ✅ | ✅ | ✅ | ✅ |
| room | assign | ✅ | ❌ | ✅ | ❌ | ✅ |
| vital | write | ✅ | ✅ | ✅ | ✅ | ❌ |
| report | write | ✅ | ✅ | ✅ | ✅ | ❌ |
| admin | * | ✅ | ❌ | ❌ | ❌ | ❌ |

*제한적 권한 (담당 환자만, 본인 기록만)

> **추적성**: REQ-NFR-023, [보안-요구사항.md](reference/03-security/security-requirements.md) 섹션 3

### 7.3 데이터 보호 설계

#### 7.3.1 암호화 계층

```
┌─────────────────────────────────────────────────────────────────┐
│                        암호화 계층                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   전송 계층 암호화                          │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  TLS 1.3 (모든 API 통신) ─── REQ-NFR-021                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   저장 계층 암호화                          │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ 필드 레벨 암호화 (AES-256-GCM)                       │  │ │
│  │  │ ─────────────────────────────────────────────────   │  │ │
│  │  │ • 주민등록번호 (ssn_encrypted)                       │  │ │
│  │  │ • 의료 기록 (medical_history)                        │  │ │
│  │  │ • 보험 정보 (insurance_info)                         │  │ │
│  │  │                                                      │  │ │
│  │  │ 관련 요구사항: REQ-NFR-020                           │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ 디스크 암호화 (RDS)                                  │  │ │
│  │  │ ─────────────────────────────────────────────────   │  │ │
│  │  │ • AWS KMS 관리형 키                                  │  │ │
│  │  │ • AES-256 전체 디스크 암호화                         │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   데이터 마스킹                             │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  • 주민번호: 901234-1****** (REQ-NFR-022)                  │ │
│  │  • 전화번호: 010-****-5678                                 │ │
│  │  • 권한별 차등 마스킹                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 감사 로깅 설계

| 로그 유형 | 기록 항목 | 보관 기간 | 관련 요구사항 |
|----------|----------|----------|--------------|
| 로그인/로그아웃 | 사용자, 시간, IP, 결과 | 2년 | REQ-NFR-030 |
| 환자 정보 접근 | 사용자, 환자ID, 조회 항목 | 2년 | REQ-NFR-031 |
| 데이터 변경 | 변경 전/후 값, 변경자 | 영구 | REQ-NFR-032 |
| 권한 변경 | 관리자, 대상, 변경 내역 | 영구 | REQ-NFR-033 |

> **추적성 참조**: [보안-요구사항.md](reference/03-security/security-requirements.md) 섹션 5

---

## 8. 설계 제약사항 및 의존성

### 8.1 기술적 제약사항

| ID | 제약사항 | 영향 | 설계 대응 | 관련 요구사항 |
|----|----------|------|----------|--------------|
| CON-01 | 기존 진료 프로그램 DB 구조 의존 | 연동 범위 | Adapter 패턴 | REQ-FR-005 |
| CON-02 | 웹 브라우저 기반 | 호환성 | Chrome/Edge/Safari 최신 2버전 | REQ-NFR-060 |
| CON-03 | 클라우드 환경 | 비용 | 비용 최적화 설계 | REQ-NFR-070 |

> **추적성 참조**: [SRS.md](SRS.md) 섹션 2.4

### 8.2 외부 의존성

| ID | 의존성 | 버전 | 용도 | 관련 요구사항 |
|----|--------|------|------|--------------|
| DEP-01 | PostgreSQL | 16.x | 주 데이터베이스 | REQ-NFR-040~043 |
| DEP-02 | Redis | 7.x | 캐시/세션 | REQ-NFR-005, 013 |
| DEP-03 | Node.js | 20.x LTS | 런타임 | SW-01 |
| DEP-04 | Next.js | 14.x | 프론트엔드 | SW-04 |
| DEP-05 | NestJS | 10.x | 백엔드 | SW-05 |

> **추적성 참조**: [SRS.md](SRS.md) 섹션 3.3, [기술-스택.md](reference/01-overview/technology-stack.md)

### 8.3 설계 가정

| ID | 가정 | 검증 시점 | 미충족 시 설계 영향 |
|----|------|----------|-------------------|
| ASM-01 | 기존 DB 직접 접근 권한 | Phase 1 | Integration Module 설계 변경 |
| ASM-02 | 병원 내 WiFi 양호 | Phase 1 | PWA 오프라인 기능 강화 |
| ASM-03 | 동시 사용자 100명 이하 | 운영 중 | 수평 확장 필요 |

---

## 9. 요구사항-설계 추적 매트릭스

### 9.1 기능 요구사항 → 설계 요소 매핑

| 요구사항 ID | 요구사항명 | 모듈 | 클래스/컴포넌트 | DB 테이블 | API 엔드포인트 |
|-------------|-----------|------|---------------|----------|---------------|
| REQ-FR-001 | 환자 목록 조회 | Patient | PatientService, PatientController | patients | GET /patients |
| REQ-FR-002 | 환자 상세 조회 | Patient | PatientService | patients, patient_details | GET /patients/:id |
| REQ-FR-003 | 환자 등록 | Patient | PatientService | patients | POST /patients |
| REQ-FR-004 | 환자 정보 수정 | Patient | PatientService | patients | PATCH /patients/:id |
| REQ-FR-005 | 기존 시스템 환자 조회 | Integration | LegacyPatientAdapter | - | GET /patients/search/legacy |
| REQ-FR-006 | 환자 정보 동기화 | Integration | PatientSyncService | patients | - |
| REQ-FR-010 | 병실 현황판 | Room | RoomDashboardService | rooms, beds | GET /rooms/dashboard/floor/:id |
| REQ-FR-011 | 빈 병상 조회 | Room | BedService | beds | GET /beds/available |
| REQ-FR-012 | 병상 배정 | Admission | AdmissionDomainService | admissions, beds | POST /admissions |
| REQ-FR-013 | 현황 실시간 업데이트 | Room | RoomGateway (WebSocket) | - | WS room:status |
| REQ-FR-020 | 입원 등록 | Admission | AdmissionDomainService | admissions | POST /admissions |
| REQ-FR-021 | 전실 처리 | Admission | AdmissionDomainService | transfers | POST /admissions/:id/transfer |
| REQ-FR-022 | 퇴원 처리 | Admission | AdmissionDomainService | discharges | POST /admissions/:id/discharge |
| REQ-FR-030 | 바이탈 입력 | Report | VitalSignService | vital_signs | POST /admissions/:id/vitals |
| REQ-FR-031 | 바이탈 조회 | Report | VitalSignService | vital_signs | GET /admissions/:id/vitals |
| REQ-FR-032 | 바이탈 추이 그래프 | Report | VitalChartService | vital_signs | GET /admissions/:id/vitals/chart |
| REQ-FR-033 | 이상치 알림 | Report | VitalAlertService | vital_signs | WS vital:recorded |
| REQ-FR-040 | 일일 보고서 작성 | Report | DailyReportService | daily_reports | POST /admissions/:id/daily-reports |
| REQ-FR-050 | 라운딩 세션 생성 | Rounding | RoundingService | rounds | POST /rounds |
| REQ-FR-051 | 라운딩 기록 입력 | Rounding | TabletRoundingService | round_records | POST /rounds/:id/records |
| REQ-FR-060 | 사용자 계정 관리 | Admin | UserService | users | /admin/users |
| REQ-FR-061 | 역할/권한 관리 | Admin | RoleService | roles, permissions | /admin/roles |
| REQ-FR-062 | 감사 로그 조회 | Admin | AuditService | access_logs, change_logs | GET /admin/audit/access-logs |

### 9.2 비기능 요구사항 → 설계 요소 매핑

| 요구사항 ID | 요구사항명 | 설계 요소 | 구현 방식 |
|-------------|-----------|----------|----------|
| REQ-NFR-001 | 페이지 로딩 3초 | CDN, SSR | CloudFront, Next.js SSR |
| REQ-NFR-002 | API 응답 500ms | 캐싱, 인덱스 | Redis 캐시, DB 인덱스 |
| REQ-NFR-003 | 동시 100명 | Auto Scaling | ECS Fargate Auto Scaling |
| REQ-NFR-005 | 현황판 갱신 3초 | WebSocket | RoomGateway |
| REQ-NFR-010 | 비밀번호 정책 | AuthService | PasswordValidator |
| REQ-NFR-011 | 비밀번호 해싱 | AuthService | bcrypt (cost 12) |
| REQ-NFR-013 | 세션 타임아웃 | SessionService | Redis TTL 30분 |
| REQ-NFR-014 | 동시 세션 제한 | SessionService | Redis 세션 카운트 |
| REQ-NFR-020 | 저장 데이터 암호화 | PatientDetail Entity | pgcrypto AES-256 |
| REQ-NFR-021 | 전송 데이터 암호화 | ALB, nginx | TLS 1.3 |
| REQ-NFR-023 | RBAC | RbacService, Guards | PermissionGuard |
| REQ-NFR-030 | 로그인 로그 | AuditService | audit.login_history |
| REQ-NFR-031 | 환자 접근 로그 | AuditService | audit.patient_access_logs |
| REQ-NFR-040 | 시스템 가용성 99.5% | Multi-AZ | RDS Multi-AZ, ECS Multi-AZ |
| REQ-NFR-050 | 코드 품질 | CI/CD | ESLint, Prettier, SonarQube |
| REQ-NFR-051 | 테스트 커버리지 80% | 테스트 | Jest, Cypress |

### 9.3 설계 문서 간 추적

| 설계 영역 | SDS 섹션 | 상세 설계 문서 | 관련 SRS 섹션 |
|----------|----------|--------------|--------------|
| 아키텍처 | 3 | [시스템-아키텍처.md](reference/02-design/system-architecture.md) | 2.1, 3.3 |
| 데이터 | 5 | [데이터베이스-설계.md](reference/02-design/database-design.md) | 부록 A |
| API | 6.2 | [API-명세서.md](reference/02-design/api-specification.md) | 3.4, 부록 B |
| UI | 6.1 | [화면-설계.md](reference/02-design/ui-design.md) | 3.1, 부록 C |
| 보안 | 7 | [보안-요구사항.md](reference/03-security/security-requirements.md) | 5.2 |

---

## 10. 부록

### 부록 A: 설계 ID 체계

```
설계 요소 ID 형식: {카테고리}-{번호}

카테고리:
- DG    : Design Goal (설계 목표)
- ADR   : Architecture Decision Record (아키텍처 결정)
- MOD   : Module (모듈)
- CMP   : Component (컴포넌트)
- ENT   : Entity (엔티티)
- SVC   : Service (서비스)
- API   : API Endpoint
- SCR   : Screen (화면)
- SEC   : Security (보안)

예시:
- DG-01  : 첫 번째 설계 목표
- ADR-001: 첫 번째 아키텍처 결정
- MOD-AUTH: 인증 모듈
- ENT-PATIENT: 환자 엔티티
```

### 부록 B: 기술 스택 요약

| 계층 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Frontend | Next.js | 14.x | SSR, 반응형 UI |
| Frontend | TypeScript | 5.x | 타입 안정성 |
| Frontend | Tailwind CSS | 3.x | 스타일링 |
| Frontend | shadcn/ui | latest | UI 컴포넌트 |
| Backend | NestJS | 10.x | API 서버 |
| Backend | TypeScript | 5.x | 타입 안정성 |
| ORM | Prisma | 5.x | 데이터베이스 접근 |
| Database | PostgreSQL | 16.x | 주 데이터베이스 |
| Cache | Redis | 7.x | 캐시/세션 |
| Realtime | Socket.io | 4.x | WebSocket |
| Cloud | AWS (ECS, RDS) | - | 인프라 |

### 부록 C: 용어 정의

> **추적성 참조**: [용어사전.md](reference/04-appendix/glossary.md)

---

## 승인 (Approval)

| 역할 | 성명 | 서명 | 일자 |
|------|------|------|------|
| 작성자 | | | |
| 아키텍트 | | | |
| 기술 검토자 | | | |
| PM | | | |

---

*본 문서는 IEEE 1016-2009 표준을 기반으로 작성되었습니다.*
