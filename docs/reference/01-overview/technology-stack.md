# Technology Stack Proposal

## Document Information

| Item | Content |
|------|---------|
| Document Version | 0.1.0.0 |
| Created Date | 2025-12-29 |
| Status | Proposal |
| Maintainer | kcenon@naver.com |

---

## 1. Technology Stack Overview

### 1.1 Recommended Architecture Type

**Modular Monolith Architecture** Recommended

```
┌─────────────────────────────────────────────────────────────────┐
│                     Recommendation Rationale                     │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Appropriate complexity for small-to-medium hospital ERP      │
│  ✓ Simplified initial development and deployment                │
│  ✓ Modular structure enabling future microservices transition   │
│  ✓ Cost-effective operations and maintenance                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack Summary

| Layer | Technology | Selection Rationale |
|-------|------------|---------------------|
| **Frontend** | Next.js 14 + TypeScript | SSR support, responsive UI, type safety |
| **Backend** | NestJS + TypeScript | Modularization, dependency injection, enterprise patterns |
| **Database** | PostgreSQL 16 | ACID, JSON support, medical data reliability |
| **Cache** | Redis | Session management, real-time status board |
| **Cloud** | AWS / Naver Cloud | Domestic regulatory compliance, scalability |

---

## 2. Frontend Technology Stack

### 2.1 Core Framework

```
Frontend Stack
├── Framework: Next.js 14 (App Router)
├── Language: TypeScript 5.x
├── UI Library: Tailwind CSS + shadcn/ui
├── State Management: Zustand (client) + TanStack Query (server)
├── Form: React Hook Form + Zod
└── Charts: Recharts or Chart.js
```

### 2.2 Technology Selection Rationale

| Technology | Selection Rationale | Alternative |
|------------|---------------------|-------------|
| **Next.js 14** | Server components with App Router, SEO not required but SSR optimizes initial loading | Vite + React |
| **TypeScript** | Essential type safety for medical data, reduces runtime errors | JavaScript |
| **shadcn/ui** | Easy customization, built-in accessibility support | MUI, Ant Design |
| **Tailwind CSS** | Fast responsive UI development, consistent design system | Styled Components |
| **Zustand** | Lightweight, minimal boilerplate | Redux Toolkit |
| **TanStack Query** | Server state caching, auto-refresh, optimistic updates | SWR |

### 2.3 Responsive Support Strategy

```typescript
// Device-specific breakpoint definitions
const breakpoints = {
  mobile: '320px',   // Smartphones
  tablet: '768px',   // Tablets (for rounds)
  desktop: '1024px', // PC (admission/admin)
  wide: '1440px'     // Large monitors (status board)
};
```

---

## 3. Backend Technology Stack

### 3.1 Core Framework

```
Backend Stack
├── Framework: NestJS 10.x
├── Language: TypeScript 5.x
├── ORM: Prisma (or TypeORM)
├── API: REST + GraphQL (optional)
├── Validation: class-validator + class-transformer
├── Authentication: Passport.js + JWT
└── Documentation: Swagger (OpenAPI 3.0)
```

### 3.2 Module Structure

```
src/
├── modules/
│   ├── auth/           # Authentication/Authorization
│   ├── users/          # User management
│   ├── patients/       # Patient management
│   ├── rooms/          # Room management
│   ├── admission/      # Admission/Discharge management
│   ├── reports/        # Reports/Logs
│   ├── rounding/       # Rounding
│   └── integration/    # External system integration
├── common/
│   ├── guards/         # Authorization guards
│   ├── interceptors/   # Logging, transformation
│   ├── filters/        # Exception filters
│   └── decorators/     # Custom decorators
└── config/             # Environment configuration
```

### 3.3 Technology Selection Rationale

| Technology | Selection Rationale | Alternative |
|------------|---------------------|-------------|
| **NestJS** | Angular-style DI, modularization, enterprise patterns | Express, Fastify |
| **Prisma** | Type-safe ORM, migration management, intuitive syntax | TypeORM, Drizzle |
| **JWT** | Stateless authentication, scalability, mobile support | Session-based |
| **Passport.js** | Support for various authentication strategies | Custom implementation |

---

## 4. Database Technology Stack

### 4.1 Primary Databases

```
Database Stack
├── Primary: PostgreSQL 16
│   ├── Patient information
│   ├── Medical records
│   ├── Users/Permissions
│   └── Audit logs
├── Cache: Redis 7.x
│   ├── Session storage
│   ├── Real-time status cache
│   └── Rate Limiting
└── Search (optional): Elasticsearch
    └── Patient search optimization (at scale)
```

### 4.2 PostgreSQL Selection Rationale

| Feature | Description |
|---------|-------------|
| **ACID Compliance** | Ensures medical data integrity |
| **JSON Support** | Flexible schema extension (JSONB) |
| **Row-Level Security** | Per-patient access control support |
| **Extensions** | pgcrypto (encryption), pg_audit (auditing) |
| **Maturity** | Proven stability, rich tooling |

### 4.3 Data Encryption Strategy

```sql
-- Sensitive information encryption example (pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Patient SSN encrypted storage
INSERT INTO patients (name, ssn_encrypted)
VALUES (
  'John Doe',
  pgp_sym_encrypt('123-45-6789', 'encryption_key')
);
```

---

## 5. Infrastructure and Cloud

### 5.1 AWS Configuration (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Architecture                          │
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
│   [CloudWatch] ── Monitoring                                     │
│   [WAF] ── Web Application Firewall                              │
│   [Secrets Manager] ── Secret Management                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Naver Cloud Configuration (Alternative)

| AWS | Naver Cloud Equivalent | Notes |
|-----|------------------------|-------|
| ECS/Fargate | Kubernetes Service | Container orchestration |
| RDS | Cloud DB for PostgreSQL | Managed DB |
| ElastiCache | Cloud Redis | Cache |
| CloudFront | CDN+ | Static content |
| S3 | Object Storage | File storage |
| WAF | Security Monitoring | Security |

### 5.3 Cost Estimation (Monthly, AWS basis)

| Service | Specifications | Estimated Cost |
|---------|---------------|----------------|
| ECS Fargate | 2 vCPU, 4GB × 2 | ~$80 |
| RDS PostgreSQL | db.t3.medium | ~$60 |
| ElastiCache | cache.t3.micro | ~$15 |
| ALB | Basic usage | ~$20 |
| S3 + CloudFront | 100GB | ~$10 |
| **Total** | | **~$185/month** |

---

## 6. Development Tools and CI/CD

### 6.1 Development Environment

```
Development Tools
├── IDE: VS Code + Extensions
├── Version Control: Git + GitHub/GitLab
├── Package Manager: pnpm (Monorepo)
├── Linting: ESLint + Prettier
├── Testing: Jest + Playwright
└── API Testing: Postman / Insomnia
```

### 6.2 CI/CD Pipeline

```yaml
# GitHub Actions example
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

## 7. External System Integration

### 7.1 Existing Medical Program Integration Options

| Method | Advantages | Disadvantages | Recommended When |
|--------|------------|---------------|------------------|
| **Direct DB Connection** | Real-time, full data access | High coupling, schema change risk | API not available |
| **API Integration** | Loose coupling, minimal change impact | Requires API development | API available (recommended) |
| **ETL Batch** | System independence | Lack of real-time capability | Read-only data |

### 7.2 Integration Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Existing   │      │  Integration │      │   New ERP    │
│   Medical    │ ───> │    Layer     │ ───> │   System     │
│   Program    │      │  (Adapter)   │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                     │
       │                     │                     │
   [Existing DB]        [Message Queue]        [New DB]
                       (Optional async)
```

---

## 8. Alternative Technology Comparison

### 8.1 Frontend Alternatives

| Option | Advantages | Disadvantages | Fit |
|--------|------------|---------------|-----|
| **Next.js** (selected) | SSR, maturity, ecosystem | Learning curve | ★★★★★ |
| Vue + Nuxt | Easy learning, flexibility | Smaller ecosystem than React | ★★★★ |
| Angular | Enterprise patterns, full-stack | Heavy, complex | ★★★ |

### 8.2 Backend Alternatives

| Option | Advantages | Disadvantages | Fit |
|--------|------------|---------------|-----|
| **NestJS** (selected) | Structured, type safety | Complex initial setup | ★★★★★ |
| Express.js | Flexibility, simplicity | Lack of structure | ★★★ |
| Spring Boot | Enterprise proven | Requires Java, heavy | ★★★★ |
| Django | Rapid development, built-in Admin | Python performance | ★★★ |

### 8.3 Database Alternatives

| Option | Advantages | Disadvantages | Fit |
|--------|------------|---------------|-----|
| **PostgreSQL** (selected) | Features, extensibility, stability | Configuration complexity | ★★★★★ |
| MySQL | Widely used, easy operations | Limited features | ★★★★ |
| MongoDB | Flexible schema | ACID limitations, unsuitable for medical | ★★ |

---

## 9. Conclusion and Recommendations

### 9.1 Final Recommended Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                 Recommended Technology Stack Summary             │
├─────────────────────────────────────────────────────────────────┤
│  Frontend  : Next.js 14 + TypeScript + Tailwind + shadcn/ui    │
│  Backend   : NestJS 10 + TypeScript + Prisma                   │
│  Database  : PostgreSQL 16 + Redis 7                           │
│  Cloud     : AWS (ECS Fargate + RDS + ElastiCache)             │
│  CI/CD     : GitHub Actions + Docker                           │
│  Monitoring: CloudWatch + Sentry                               │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Expected Benefits

1. **Development Efficiency**: TypeScript across all layers enables type sharing, reduces errors
2. **Maintainability**: Modular structure enables independent development/deployment per feature
3. **Scalability**: Cloud-based auto-scaling with increased usage
4. **Security**: Enterprise-grade authentication/authorization, built-in encryption support
5. **Cost Efficiency**: Serverless containers with usage-based billing

---

## Appendix: Version Compatibility Matrix

| Component | Recommended Version | Minimum Version | LTS End |
|-----------|---------------------|-----------------|---------|
| Node.js | 20.x | 18.x | 2026-04 |
| TypeScript | 5.3+ | 5.0 | - |
| Next.js | 14.x | 13.x | - |
| NestJS | 10.x | 9.x | - |
| PostgreSQL | 16 | 14 | 2026-11 |
| Redis | 7.x | 6.x | - |
