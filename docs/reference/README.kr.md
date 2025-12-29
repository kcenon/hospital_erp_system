# 입원환자 관리 ERP 시스템 - 기반 문서

> **프로젝트**: 입원환자 관리 ERP 시스템
> **버전**: 0.1.3.0
> **최종 수정**: 2025-12-29
> **관리자**: kcenon@naver.com

---

## 문서 구조

```
reference/
├── README.md                              # 현재 문서 (인덱스)
│
├── 01-overview/                           # 프로젝트 개요
│   ├── project-overview.md                # 프로젝트 개요 및 범위
│   ├── technology-stack.md                # 기술 스택 제안서
│   └── schedule-plan.md                   # 프로젝트 일정 계획
│
├── 02-design/                             # 시스템 설계
│   ├── system-architecture.md             # 시스템 아키텍처
│   ├── database-design.md                 # 데이터베이스 설계
│   ├── api-specification.md               # API 명세서
│   ├── ui-design.md                       # 화면 설계 가이드
│   └── lis-integration.md                 # LIS 연동 규격
│
├── 03-security/                           # 보안
│   └── security-requirements.md           # 보안 요구사항
│
├── 04-appendix/                           # 부록
│   └── glossary.md                        # 용어 사전
│
└── 05-guides/                             # 개발 가이드
    ├── development-environment-setup.md   # 개발 환경 설정
    ├── coding-conventions.md              # 코딩 컨벤션
    ├── infrastructure-setup.md            # 인프라 설정
    ├── testing-strategy.md                # 테스트 전략
    └── system-integration-patterns.md     # 시스템 연동 패턴
```

---

## 문서 목록

### 📋 01. 프로젝트 개요

| 문서 | 설명 | 대상 독자 |
|------|------|----------|
| [project-overview.md](01-overview/project-overview.md) | 프로젝트 배경, 목표, 범위, 이해관계자, 제약사항 | 전체 |
| [technology-stack.md](01-overview/technology-stack.md) | 기술 스택 제안 (Next.js, NestJS, PostgreSQL 등) | 기술팀, 의사결정자 |
| [schedule-plan.md](01-overview/schedule-plan.md) | 4단계 일정 계획, 마일스톤, 리소스, 리스크 관리 | PM, 경영진 |

### 🏗️ 02. 시스템 설계

| 문서 | 설명 | 대상 독자 |
|------|------|----------|
| [system-architecture.md](02-design/system-architecture.md) | 시스템 아키텍처, 모듈 구조, 데이터 흐름, 배포 구성 | 개발팀 |
| [database-design.md](02-design/database-design.md) | ERD, 테이블 정의(DDL), 암호화 전략, 인덱스 | 백엔드 개발자 |
| [api-specification.md](02-design/api-specification.md) | RESTful API 엔드포인트, 요청/응답 형식, 에러 코드 | 풀스택 개발자 |
| [ui-design.md](02-design/ui-design.md) | 디자인 시스템, 컬러/타이포, 화면 와이어프레임 | 프론트엔드, 디자이너 |
| [lis-integration.md](02-design/lis-integration.md) | LIS 연동 규격, HL7/FHIR 표준, 데이터 모델 | 백엔드, 통합팀 |

### 🔒 03. 보안

| 문서 | 설명 | 대상 독자 |
|------|------|----------|
| [security-requirements.md](03-security/security-requirements.md) | 인증/인가, 암호화, 감사 로그, 취약점 관리, 법규 준수 | 전체 |

### 📚 04. 부록

| 문서 | 설명 | 대상 독자 |
|------|------|----------|
| [glossary.md](04-appendix/glossary.md) | 의료 용어, 기술 용어, 관련 법규 요약 | 전체 |

### 🛠️ 05. 개발 가이드

| 문서 | 설명 | 대상 독자 |
|------|------|----------|
| [development-environment-setup.md](05-guides/development-environment-setup.md) | 개발 환경 구성 (Node.js, Docker, Prisma 등) | 개발팀 전체 |
| [coding-conventions.md](05-guides/coding-conventions.md) | TypeScript, React, NestJS 코딩 규칙 | 개발팀 전체 |
| [infrastructure-setup.md](05-guides/infrastructure-setup.md) | AWS 인프라 구성, Terraform, CI/CD 파이프라인 | DevOps, 백엔드 |
| [testing-strategy.md](05-guides/testing-strategy.md) | 단위/통합/E2E 테스트 전략 및 실행 가이드 | 개발팀 전체 |
| [system-integration-patterns.md](05-guides/system-integration-patterns.md) | 레거시 시스템 연동 패턴, HL7/FHIR 통신 | 백엔드, 통합팀 |

---

## 문서 읽기 가이드

### 처음 프로젝트를 파악할 때

```
1. project-overview.md         → 프로젝트 전체 이해
2. technology-stack.md         → 기술적 방향 파악
3. schedule-plan.md            → 일정 및 마일스톤 확인
```

### 개발을 시작할 때

```
1. system-architecture.md      → 전체 구조 이해
2. database-design.md          → 데이터 모델 파악
3. api-specification.md        → API 규격 확인
4. ui-design.md                → UI 가이드라인 숙지
```

### 보안 검토 시

```
1. security-requirements.md              → 보안 요구사항 전체
2. database-design.md (암호화)           → 데이터 보호 방안
3. api-specification.md (인증 섹션)      → API 보안
```

### 개발 환경 설정할 때

```
1. development-environment-setup.md  → 로컬 환경 구성
2. coding-conventions.md             → 코딩 규칙 숙지
3. testing-strategy.md               → 테스트 작성법
```

### 인프라/배포 작업 시

```
1. infrastructure-setup.md     → AWS 인프라 이해
2. system-architecture.md      → 배포 아키텍처 확인
3. security-requirements.md    → 보안 설정 검토
```

### 레거시 시스템 연동 시

```
1. system-integration-patterns.md → 연동 패턴 파악
2. api-specification.md           → API 인터페이스 확인
3. database-design.md             → 데이터 매핑 이해
```

### LIS 연동 작업 시

```
1. lis-integration.md             → LIS 연동 규격
2. system-integration-patterns.md → 일반 연동 패턴
3. api-specification.md           → API 인터페이스 설계
4. security-requirements.md       → 의료 데이터 보안
```

---

## 문서 상태

| 문서 | 상태 | 버전 | 최종 수정 |
|------|------|------|----------|
| project-overview.md | 초안 | 1.0.0 | 2025-12-29 |
| technology-stack.md | 제안 | 1.0.0 | 2025-12-29 |
| schedule-plan.md | 제안 | 1.0.0 | 2025-12-29 |
| system-architecture.md | 초안 | 1.0.0 | 2025-12-29 |
| database-design.md | 초안 | 1.0.0 | 2025-12-29 |
| api-specification.md | 초안 | 1.0.0 | 2025-12-29 |
| ui-design.md | 초안 | 1.0.0 | 2025-12-29 |
| lis-integration.md | 초안 | 1.0.0 | 2025-12-29 |
| security-requirements.md | 초안 | 1.0.0 | 2025-12-29 |
| glossary.md | 초안 | 1.0.0 | 2025-12-29 |
| development-environment-setup.md | 초안 | 1.0.0 | 2025-12-29 |
| coding-conventions.md | 초안 | 1.0.0 | 2025-12-29 |
| infrastructure-setup.md | 초안 | 1.0.0 | 2025-12-29 |
| testing-strategy.md | 초안 | 1.0.0 | 2025-12-29 |
| system-integration-patterns.md | 초안 | 1.0.0 | 2025-12-29 |

---

## 문서 관리 규칙

### 버전 관리

- **Major (x.0.0)**: 구조 변경, 대규모 수정
- **Minor (0.x.0)**: 내용 추가, 섹션 변경
- **Patch (0.0.x)**: 오탈자, 작은 수정

### 상태 정의

| 상태 | 설명 |
|------|------|
| 초안 | 작성 완료, 검토 대기 |
| 검토중 | 이해관계자 검토 진행 |
| 승인됨 | 최종 승인 완료 |
| 폐기 | 더 이상 유효하지 않음 |

---

## 변경 이력

| 일자 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-12-29 | 1.4.0 | LIS 연동 규격 문서 추가 |
| 2025-12-29 | 1.3.0 | 폴더명 및 파일명 영문화 |
| 2025-12-29 | 1.2.0 | 폴더명 및 파일명 한글화 |
| 2025-12-29 | 1.1.0 | 05-가이드 폴더 추가 (개발 가이드 5종) |
| 2025-12-29 | 1.0.0 | 초기 문서 구조 생성 |

---

## 문의

프로젝트 관련 문의사항은 PM에게 연락해 주세요.
