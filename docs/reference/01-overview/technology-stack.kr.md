# 기술 스택 제안서

## 문서 정보

| 항목      | 내용             |
| --------- | ---------------- |
| 문서 버전 | 0.1.0.0          |
| 작성일    | 2025-12-29       |
| 상태      | 제안             |
| 관리자    | kcenon@naver.com |

---

## 1. 기술 스택 개요

### 1.1 추천 아키텍처 유형

**모놀리식 모듈러 아키텍처 (Modular Monolith)** 권장

```
┌─────────────────────────────────────────────────────────────────┐
│                     추천 이유                                     │
├─────────────────────────────────────────────────────────────────┤
│  ✓ 중소규모 병원 ERP에 적합한 복잡도                               │
│  ✓ 초기 개발 및 배포 단순화                                        │
│  ✓ 향후 마이크로서비스 전환 가능한 모듈 구조                         │
│  ✓ 운영/유지보수 비용 효율적                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 기술 스택 요약

| 계층         | 기술                    | 선택 이유                              |
| ------------ | ----------------------- | -------------------------------------- |
| **Frontend** | Next.js 14 + TypeScript | SSR 지원, 반응형 UI, 타입 안정성       |
| **Backend**  | NestJS + TypeScript     | 모듈화, 의존성 주입, 엔터프라이즈 패턴 |
| **Database** | PostgreSQL 16           | ACID, JSON 지원, 의료 데이터 신뢰성    |
| **Cache**    | Redis                   | 세션 관리, 실시간 현황판               |
| **Cloud**    | AWS / Naver Cloud       | 국내 규정 준수, 확장성                 |

---

## 2. Frontend 기술 스택

### 2.1 핵심 프레임워크

```
Frontend Stack
├── Framework: Next.js 14 (App Router)
├── Language: TypeScript 5.x
├── UI Library: Tailwind CSS + shadcn/ui
├── State Management: Zustand (클라이언트) + TanStack Query (서버)
├── Form: React Hook Form + Zod
└── Charts: Recharts 또는 Chart.js
```

### 2.2 기술 선택 근거

| 기술               | 선택 이유                                                              | 대안              |
| ------------------ | ---------------------------------------------------------------------- | ----------------- |
| **Next.js 14**     | App Router로 서버 컴포넌트 지원, SEO 불필요하나 SSR로 초기 로딩 최적화 | Vite + React      |
| **TypeScript**     | 의료 데이터 타입 안정성 필수, 런타임 에러 감소                         | JavaScript        |
| **shadcn/ui**      | 커스터마이징 용이, 접근성 기본 지원                                    | MUI, Ant Design   |
| **Tailwind CSS**   | 반응형 UI 빠른 개발, 일관된 디자인 시스템                              | Styled Components |
| **Zustand**        | 경량, 보일러플레이트 최소화                                            | Redux Toolkit     |
| **TanStack Query** | 서버 상태 캐싱, 자동 갱신, 낙관적 업데이트                             | SWR               |

### 2.3 반응형 지원 전략

```typescript
// 디바이스별 breakpoint 정의
const breakpoints = {
  mobile: '320px', // 스마트폰
  tablet: '768px', // 태블릿 (회진용)
  desktop: '1024px', // PC (원무/관리)
  wide: '1440px', // 대형 모니터 (현황판)
};
```

---

## 3. Backend 기술 스택

### 3.1 핵심 프레임워크

```
Backend Stack
├── Framework: NestJS 10.x
├── Language: TypeScript 5.x
├── ORM: Prisma (또는 TypeORM)
├── API: REST + GraphQL (선택적)
├── Validation: class-validator + class-transformer
├── Authentication: Passport.js + JWT
└── Documentation: Swagger (OpenAPI 3.0)
```

### 3.2 모듈 구조

```
src/
├── modules/
│   ├── auth/           # 인증/인가
│   ├── users/          # 사용자 관리
│   ├── patients/       # 환자 관리
│   ├── rooms/          # 병실 관리
│   ├── admission/      # 입퇴원 관리
│   ├── reports/        # 보고서/일지
│   ├── rounding/       # 라운딩
│   └── integration/    # 외부 시스템 연동
├── common/
│   ├── guards/         # 인가 가드
│   ├── interceptors/   # 로깅, 변환
│   ├── filters/        # 예외 필터
│   └── decorators/     # 커스텀 데코레이터
└── config/             # 환경 설정
```

### 3.3 기술 선택 근거

| 기술            | 선택 이유                                     | 대안             |
| --------------- | --------------------------------------------- | ---------------- |
| **NestJS**      | Angular 스타일 DI, 모듈화, 엔터프라이즈 패턴  | Express, Fastify |
| **Prisma**      | 타입 안전 ORM, 마이그레이션 관리, 직관적 문법 | TypeORM, Drizzle |
| **JWT**         | 무상태 인증, 확장성, 모바일 지원              | Session 기반     |
| **Passport.js** | 다양한 인증 전략 지원                         | 직접 구현        |

---

## 4. Database 기술 스택

### 4.1 주요 데이터베이스

```
Database Stack
├── Primary: PostgreSQL 16
│   ├── 환자 정보
│   ├── 의료 기록
│   ├── 사용자/권한
│   └── 감사 로그
├── Cache: Redis 7.x
│   ├── 세션 저장소
│   ├── 실시간 현황 캐시
│   └── Rate Limiting
└── Search (선택): Elasticsearch
    └── 환자 검색 최적화 (대규모 시)
```

### 4.2 PostgreSQL 선택 이유

| 특성                   | 설명                               |
| ---------------------- | ---------------------------------- |
| **ACID 준수**          | 의료 데이터 무결성 보장            |
| **JSON 지원**          | 유연한 스키마 확장 (JSONB)         |
| **Row-Level Security** | 환자별 접근 제어 지원              |
| **Extensions**         | pgcrypto (암호화), pg_audit (감사) |
| **성숙도**             | 검증된 안정성, 풍부한 도구         |

### 4.3 데이터 암호화 전략

```sql
-- 민감 정보 암호화 예시 (pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 환자 주민번호 암호화 저장
INSERT INTO patients (name, ssn_encrypted)
VALUES (
  '홍길동',
  pgp_sym_encrypt('901234-1234567', 'encryption_key')
);
```

---

## 5. 인프라 및 클라우드

### 5.1 AWS 구성안 (추천)

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS 아키텍처                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [CloudFront] ──> [ALB] ──> [ECS/Fargate]                      │
│        │                          │                              │
│        │                          ├── App Container              │
│        │                          └── Worker Container           │
│        │                                                         │
│   [S3 Static]                 [RDS PostgreSQL]                   │
│                                    │                             │
│                               [ElastiCache Redis]                │
│                                                                  │
│   [CloudWatch] ── 모니터링                                        │
│   [WAF] ── 웹 방화벽                                              │
│   [Secrets Manager] ── 시크릿 관리                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Naver Cloud 구성안 (대안)

| AWS         | Naver Cloud 대응        | 비고                    |
| ----------- | ----------------------- | ----------------------- |
| ECS/Fargate | Kubernetes Service      | 컨테이너 오케스트레이션 |
| RDS         | Cloud DB for PostgreSQL | 관리형 DB               |
| ElastiCache | Cloud Redis             | 캐시                    |
| CloudFront  | CDN+                    | 정적 콘텐츠             |
| S3          | Object Storage          | 파일 저장               |
| WAF         | Security Monitoring     | 보안                    |

### 5.3 비용 추정 (월간, AWS 기준)

| 서비스          | 사양            | 예상 비용    |
| --------------- | --------------- | ------------ |
| ECS Fargate     | 2 vCPU, 4GB × 2 | ~$80         |
| RDS PostgreSQL  | db.t3.medium    | ~$60         |
| ElastiCache     | cache.t3.micro  | ~$15         |
| ALB             | 기본 사용량     | ~$20         |
| S3 + CloudFront | 100GB           | ~$10         |
| **합계**        |                 | **~$185/월** |

---

## 6. 개발 도구 및 CI/CD

### 6.1 개발 환경

```
Development Tools
├── IDE: VS Code + Extensions
├── Version Control: Git + GitHub/GitLab
├── Package Manager: pnpm (Monorepo)
├── Linting: ESLint + Prettier
├── Testing: Jest + Playwright
└── API Testing: Postman / Insomnia
```

### 6.2 CI/CD 파이프라인

```yaml
# GitHub Actions 예시
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Tests
        run: pnpm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker Image
        run: docker build -t hospital-erp .

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS
        run: ./deploy.sh
```

---

## 7. 외부 시스템 연동

### 7.1 기존 진료 프로그램 연동 옵션

| 방식             | 장점                          | 단점                          | 권장 상황          |
| ---------------- | ----------------------------- | ----------------------------- | ------------------ |
| **DB 직접 연결** | 실시간성, 전체 데이터 접근    | 결합도 높음, 스키마 변경 위험 | API 미제공 시      |
| **API 연동**     | 느슨한 결합, 변경 영향 최소화 | API 개발 필요                 | API 제공 시 (권장) |
| **ETL 배치**     | 시스템 독립성                 | 실시간성 부족                 | 읽기 전용 데이터   |

### 7.2 연동 아키텍처

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   기존 진료   │      │   연동 계층   │      │   신규 ERP   │
│   프로그램    │ ───> │  (Adapter)   │ ───> │   시스템     │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                     │
       │                     │                     │
   [기존 DB]            [Message Queue]        [신규 DB]
                       (선택적 비동기)
```

---

## 8. 대안 기술 비교

### 8.1 Frontend 대안

| 옵션               | 장점                      | 단점                   | 적합도     |
| ------------------ | ------------------------- | ---------------------- | ---------- |
| **Next.js** (선택) | SSR, 성숙도, 생태계       | 학습 곡선              | ⭐⭐⭐⭐⭐ |
| Vue + Nuxt         | 쉬운 학습, 유연성         | React 대비 생태계 작음 | ⭐⭐⭐⭐   |
| Angular            | 엔터프라이즈 패턴, 풀스택 | 무거움, 복잡           | ⭐⭐⭐     |

### 8.2 Backend 대안

| 옵션              | 장점                  | 단점              | 적합도     |
| ----------------- | --------------------- | ----------------- | ---------- |
| **NestJS** (선택) | 구조화, 타입 안정성   | 초기 설정 복잡    | ⭐⭐⭐⭐⭐ |
| Express.js        | 유연성, 단순함        | 구조 부재         | ⭐⭐⭐     |
| Spring Boot       | 엔터프라이즈 검증     | Java 필요, 무거움 | ⭐⭐⭐⭐   |
| Django            | 빠른 개발, Admin 내장 | Python 성능       | ⭐⭐⭐     |

### 8.3 Database 대안

| 옵션                  | 장점                 | 단점                   | 적합도     |
| --------------------- | -------------------- | ---------------------- | ---------- |
| **PostgreSQL** (선택) | 기능, 확장성, 안정성 | 설정 복잡도            | ⭐⭐⭐⭐⭐ |
| MySQL                 | 널리 사용, 쉬운 운영 | 기능 제한적            | ⭐⭐⭐⭐   |
| MongoDB               | 유연한 스키마        | ACID 제한, 의료 부적합 | ⭐⭐       |

---

## 9. 결론 및 권장 사항

### 9.1 최종 권장 스택

```
┌─────────────────────────────────────────────────────────────────┐
│                    권장 기술 스택 요약                             │
├─────────────────────────────────────────────────────────────────┤
│  Frontend  : Next.js 14 + TypeScript + Tailwind + shadcn/ui    │
│  Backend   : NestJS 10 + TypeScript + Prisma                   │
│  Database  : PostgreSQL 16 + Redis 7                           │
│  Cloud     : AWS (ECS Fargate + RDS + ElastiCache)             │
│  CI/CD     : GitHub Actions + Docker                           │
│  Monitoring: CloudWatch + Sentry                               │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 기대 효과

1. **개발 효율성**: TypeScript 전 계층 사용으로 타입 공유, 에러 감소
2. **유지보수성**: 모듈화된 구조로 기능별 독립 개발/배포 가능
3. **확장성**: 클라우드 기반으로 사용량 증가 시 자동 확장
4. **보안성**: 엔터프라이즈급 인증/인가, 암호화 기본 지원
5. **비용 효율**: 서버리스 컨테이너로 사용량 기반 과금

---

## 부록: 버전 호환성 매트릭스

| 구성요소   | 권장 버전 | 최소 버전 | LTS 종료 |
| ---------- | --------- | --------- | -------- |
| Node.js    | 20.x      | 18.x      | 2026-04  |
| TypeScript | 5.3+      | 5.0       | -        |
| Next.js    | 14.x      | 13.x      | -        |
| NestJS     | 10.x      | 9.x       | -        |
| PostgreSQL | 16        | 14        | 2026-11  |
| Redis      | 7.x       | 6.x       | -        |
