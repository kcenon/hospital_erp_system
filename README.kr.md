# 입원환자 관리 ERP 시스템

> **입원환자 관리의 디지털 전환을 통해 의료진의 업무 효율성을 높이고, 환자 안전을 강화하는 통합 ERP 시스템**

[![Status](https://img.shields.io/badge/상태-개발중-yellow)]()
[![Version](https://img.shields.io/badge/버전-0.1.0-blue)]()
[![License](https://img.shields.io/badge/라이선스-Proprietary-red)]()

---

## 개요

입원환자 관리 ERP 시스템은 구글 시트 기반의 수동 병원 입원환자 관리를 현대적이고 안전하며 효율적인 디지털 솔루션으로 대체하기 위해 설계되었습니다.

### 핵심 기능

- **실시간 데이터 연동**: 기존 진료 프로그램과 원활한 동기화
- **병실 현황 모니터링**: 병실 가용성 및 환자 상태 실시간 추적
- **모바일 라운딩 지원**: 의사 회진용 태블릿/모바일 최적화 인터페이스
- **법규 준수**: 의료법 및 개인정보보호법 준수 내장
- **직관적인 UI/UX**: 의료진을 위한 빠른 정보 입력 및 조회

### 플랫폼 지원

| 플랫폼 | 용도 | 주요 사용자 |
|--------|------|------------|
| **PC Web** | 관리/입원 업무 | 원무과, 관리자 |
| **Tablet Web** | 라운딩, 모바일 입력 | 의사, 수간호사 |
| **Mobile Web (PWA)** | 빠른 조회/입력 | 간호사, 의료진 |

---

## 기술 스택

### 아키텍처

**모듈러 모놀리스 아키텍처** - 중소 규모 병원 ERP에 적합하며, 향후 마이크로서비스 전환 가능성을 고려한 설계입니다.

### 기술 스택 요약

| 계층 | 기술 | 목적 |
|------|------|------|
| **Frontend** | Next.js 14 + TypeScript | SSR, 반응형 UI, 타입 안정성 |
| **UI 컴포넌트** | Tailwind CSS + shadcn/ui | 디자인 시스템, 접근성 |
| **Backend** | NestJS + TypeScript | 모듈화, 엔터프라이즈 패턴 |
| **Database** | PostgreSQL 16 | ACID 준수, 의료 데이터 신뢰성 |
| **Cache** | Redis | 세션 관리, 실시간 업데이트 |
| **Cloud** | AWS / Naver Cloud | 국내 법규 준수, 확장성 |

---

## 프로젝트 구조

```
hospital_erp_system/
├── README.md                    # 영문 README
├── README.kr.md                 # 현재 문서 (한글)
└── docs/                        # 문서
    ├── PRD.md / PRD.kr.md       # 제품 요구사항 명세서
    ├── SRS.md / SRS.kr.md       # 소프트웨어 요구사항 명세서
    ├── SDS.md / SDS.kr.md       # 소프트웨어 설계 명세서
    └── reference/               # 참조 문서
        ├── 01-overview/         # 프로젝트 개요, 기술 스택, 일정
        ├── 02-design/           # 아키텍처, DB, API, UI 설계
        ├── 03-security/         # 보안 요구사항
        ├── 04-appendix/         # 용어사전
        └── 05-guides/           # 개발 가이드
```

---

## 문서

### 핵심 문서

| 문서 | 설명 | 링크 |
|------|------|------|
| **PRD** | 제품 요구사항 명세서 | [PRD.kr.md](docs/PRD.kr.md) |
| **SRS** | 소프트웨어 요구사항 명세서 | [SRS.kr.md](docs/SRS.kr.md) |
| **SDS** | 소프트웨어 설계 명세서 | [SDS.kr.md](docs/SDS.kr.md) |

### 참조 문서

| 카테고리 | 문서 |
|----------|------|
| **개요** | [프로젝트 개요](docs/reference/01-overview/project-overview.kr.md), [기술 스택](docs/reference/01-overview/technology-stack.kr.md), [일정 계획](docs/reference/01-overview/schedule-plan.kr.md) |
| **설계** | [시스템 아키텍처](docs/reference/02-design/system-architecture.kr.md), [데이터베이스 설계](docs/reference/02-design/database-design.kr.md), [API 명세서](docs/reference/02-design/api-specification.kr.md), [화면 설계](docs/reference/02-design/ui-design.kr.md) |
| **보안** | [보안 요구사항](docs/reference/03-security/security-requirements.kr.md) |
| **부록** | [용어사전](docs/reference/04-appendix/glossary.kr.md) |
| **가이드** | [개발환경 설정](docs/reference/05-guides/development-environment-setup.kr.md), [코딩 컨벤션](docs/reference/05-guides/coding-conventions.kr.md), [테스트 전략](docs/reference/05-guides/testing-strategy.kr.md) |

---

## 시작하기

### 사전 요구사항

- Node.js 20.x LTS
- PostgreSQL 16.x
- Redis 7.x
- Docker & Docker Compose (권장)

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-org/hospital_erp_system.git
cd hospital_erp_system

# 의존성 설치 (소스 코드 구현 후)
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 시작
npm run dev
```

> **참고**: 소스 코드 구현이 진행 중입니다. 자세한 설치 방법은 [개발환경 설정](docs/reference/05-guides/development-environment-setup.kr.md)을 참조하세요.

---

## 개발

### 빠른 링크

- [개발환경 설정](docs/reference/05-guides/development-environment-setup.kr.md)
- [코딩 컨벤션](docs/reference/05-guides/coding-conventions.kr.md)
- [테스트 전략](docs/reference/05-guides/testing-strategy.kr.md)
- [인프라 설정](docs/reference/05-guides/infrastructure-setup.kr.md)
- [시스템 연동 패턴](docs/reference/05-guides/system-integration-patterns.kr.md)

### 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 프로덕션 준비 코드 |
| `develop` | 개발 통합 |
| `feature/*` | 기능 개발 |
| `hotfix/*` | 프로덕션 버그 수정 |

---

## 로드맵

| 단계 | 기간 | 주요 내용 |
|------|------|----------|
| **1단계** | 1-2개월 | 기반 구축 (인증, 환자, 병실 관리) |
| **2단계** | 3-4개월 | 핵심 기능 (입퇴원, 보고서) |
| **3단계** | 5개월 | 고급 기능 (라운딩, 통계) |
| **4단계** | 6개월 | 안정화 및 출시 |

---

## 보안 및 규정 준수

이 시스템은 다음 법규를 준수하도록 설계되었습니다:

- **의료법**
- **개인정보보호법**
- **전자문서법**

모든 환자 데이터는 저장 시와 전송 시 암호화됩니다. 자세한 내용은 [보안 요구사항](docs/reference/03-security/security-requirements.kr.md)을 참조하세요.

---

## 기여

이 프로젝트는 비공개 프로젝트입니다. 기여 가이드라인은 승인된 팀원에게 별도로 제공됩니다.

---

## 라이선스

Proprietary - All rights reserved.

---

## 연락처

- **프로젝트 관리자**: kcenon@naver.com
- **문서**: [참조 문서](docs/reference/README.kr.md) 참조

---

*최종 수정: 2025-12-29*
