# Inpatient Management ERP System

> **An integrated ERP system that enhances healthcare staff efficiency and strengthens patient safety through digital transformation of inpatient management**

[![Status](https://img.shields.io/badge/Status-In%20Development-yellow)]()
[![Version](https://img.shields.io/badge/Version-0.1.0-blue)]()
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

---

## Overview

The Inpatient Management ERP System is designed to replace manual Google Sheets-based hospital inpatient management with a modern, secure, and efficient digital solution.

### Key Features

- **Real-time Data Integration**: Seamless synchronization with existing medical programs
- **Room Status Monitoring**: Real-time tracking of room availability and patient conditions
- **Mobile Rounds Support**: Tablet and mobile-optimized interface for physician rounds
- **Regulatory Compliance**: Built-in compliance with Medical Service Act and Privacy Laws
- **Intuitive UI/UX**: Quick information input and retrieval for healthcare staff

### Platform Support

| Platform             | Purpose                        | Primary Users                     |
| -------------------- | ------------------------------ | --------------------------------- |
| **PC Web**           | Administrative/admission tasks | Admissions Office, Administrators |
| **Tablet Web**       | Rounds/rounding, mobile input  | Physicians, Head Nurses           |
| **Mobile Web (PWA)** | Quick inquiry/input            | Nurses, Medical Staff             |

---

## Technology Stack

### Architecture

**Modular Monolith Architecture** - Designed for small-to-medium hospital ERP with future microservices transition capability.

### Tech Stack Summary

| Layer             | Technology               | Purpose                                   |
| ----------------- | ------------------------ | ----------------------------------------- |
| **Frontend**      | Next.js 14 + TypeScript  | SSR, responsive UI, type safety           |
| **UI Components** | Tailwind CSS + shadcn/ui | Design system, accessibility              |
| **Backend**       | NestJS + TypeScript      | Modularization, enterprise patterns       |
| **Database**      | PostgreSQL 16            | ACID compliance, medical data reliability |
| **Cache**         | Redis                    | Session management, real-time updates     |
| **Cloud**         | AWS / Naver Cloud        | Regulatory compliance, scalability        |

---

## Project Structure

```
hospital_erp_system/
├── apps/
│   ├── frontend/                # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/             # Next.js App Router pages
│   │   │   │   ├── (auth)/      # Auth-related pages
│   │   │   │   └── (dashboard)/ # Dashboard pages
│   │   │   ├── components/      # React components
│   │   │   │   ├── ui/          # shadcn/ui components
│   │   │   │   ├── forms/       # Form components
│   │   │   │   ├── layouts/     # Layout components
│   │   │   │   └── features/    # Feature-specific components
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── lib/             # Utility functions
│   │   │   ├── providers/       # React context providers
│   │   │   ├── services/        # API service functions
│   │   │   ├── stores/          # Zustand state stores
│   │   │   └── types/           # TypeScript type definitions
│   │   └── public/              # Static assets
│   └── backend/                 # NestJS backend application
│       ├── src/                 # Source code
│       │   ├── common/          # Shared utilities
│       │   │   ├── decorators/  # Custom decorators (CurrentUser, Public, Roles)
│       │   │   ├── filters/     # Exception filters
│       │   │   ├── guards/      # Auth guards (JWT, Roles)
│       │   │   ├── interceptors/ # Request/response interceptors
│       │   │   └── pipes/       # Validation pipes
│       │   ├── config/          # Configuration modules
│       │   │   ├── app.config.ts
│       │   │   ├── database.config.ts
│       │   │   ├── jwt.config.ts
│       │   │   ├── redis.config.ts
│       │   │   └── env.validation.ts
│       │   ├── modules/         # Feature modules
│       │   │   ├── admin/       # Admin and audit management
│       │   │   ├── admission/   # Admission/discharge management
│       │   │   ├── auth/        # Authentication and authorization
│       │   │   ├── integration/ # Legacy system integration
│       │   │   ├── patient/     # Patient management
│       │   │   ├── report/      # Vital signs and reports
│       │   │   ├── room/        # Room management
│       │   │   └── rounding/    # Rounding workflows
│       │   ├── prisma/          # Prisma service module
│       │   ├── redis/           # Redis module for session management
│       │   ├── app.module.ts    # Root application module
│       │   └── main.ts          # Application entry point
│       └── prisma/              # Prisma ORM configuration
│           ├── schema.prisma    # Database schema definition
│           ├── migrations/      # Database migrations
│           └── seed.ts          # Seed data script
├── scripts/
│   ├── init-db.sql              # Database initialization script
│   ├── dev-start.sh             # Start development environment
│   ├── dev-stop.sh              # Stop development environment
│   ├── db-reset.sh              # Reset database
│   └── db-seed.sh               # Seed database with test data
├── docker-compose.yml           # Development Docker Compose configuration
├── docker-compose.prod.yml      # Production Docker Compose reference
├── docs/                        # Documentation
│   ├── PRD.md / PRD.kr.md       # Product Requirements Document
│   ├── SRS.md / SRS.kr.md       # Software Requirements Specification
│   ├── SDS.md / SDS.kr.md       # Software Design Specification
│   └── reference/               # Reference documentation
├── package.json                 # Root package.json (pnpm workspace)
├── pnpm-workspace.yaml          # Workspace configuration
└── turbo.json                   # Turborepo configuration
```

---

## Documentation

### Core Documents

| Document | Description                         | Link                  |
| -------- | ----------------------------------- | --------------------- |
| **PRD**  | Product Requirements Document       | [PRD.md](docs/PRD.md) |
| **SRS**  | Software Requirements Specification | [SRS.md](docs/SRS.md) |
| **SDS**  | Software Design Specification       | [SDS.md](docs/SDS.md) |

### Reference Documents

| Category     | Documents                                                                                                                                                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overview** | [Project Overview](docs/reference/01-overview/project-overview.md), [Technology Stack](docs/reference/01-overview/technology-stack.md), [Schedule Plan](docs/reference/01-overview/schedule-plan.md)                                                           |
| **Design**   | [System Architecture](docs/reference/02-design/system-architecture.md), [Database Design](docs/reference/02-design/database-design.md), [API Specification](docs/reference/02-design/api-specification.md), [UI Design](docs/reference/02-design/ui-design.md) |
| **Database** | [Database Configuration](docs/database-configuration.md)                                                                                                                                                                                                       |
| **Security** | [Security Requirements](docs/reference/03-security/security-requirements.md)                                                                                                                                                                                   |
| **Appendix** | [Glossary](docs/reference/04-appendix/glossary.md)                                                                                                                                                                                                             |
| **Guides**   | [Development Environment](docs/reference/05-guides/development-environment-setup.md), [Coding Conventions](docs/reference/05-guides/coding-conventions.md), [Testing Strategy](docs/reference/05-guides/testing-strategy.md)                                   |

---

## Getting Started

### Prerequisites

- Node.js 20.x LTS
- pnpm 9.x
- PostgreSQL 16.x
- Redis 7.x
- Docker & Docker Compose (recommended)

### Quick Start with Docker (Recommended)

The easiest way to get started is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/kcenon/hospital_erp_system.git
cd hospital_erp_system

# Start all services (PostgreSQL, Redis, Backend, Frontend)
./scripts/dev-start.sh

# Access the application:
# - Frontend: http://localhost:3001
# - Backend API: http://localhost:3000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379

# Stop all services
./scripts/dev-stop.sh
```

### Manual Installation

For development without Docker:

```bash
# Clone the repository
git clone https://github.com/kcenon/hospital_erp_system.git
cd hospital_erp_system

# Install dependencies
pnpm install

# Start PostgreSQL and Redis manually or use Docker for databases only
docker compose up postgres redis -d

# Set up environment variables
cp apps/backend/env.example apps/backend/.env
cp apps/frontend/env.example apps/frontend/.env.local

# Generate Prisma client and run migrations
cd apps/backend
pnpm db:generate
pnpm db:migrate

# Seed the database with sample data
pnpm db:seed

# Start backend development server
pnpm dev

# For frontend development (in a new terminal)
cd apps/frontend
npm install
npm run dev  # Starts on port 3001
```

### Development Scripts

| Script                   | Description                          |
| ------------------------ | ------------------------------------ |
| `./scripts/dev-start.sh` | Start all Docker services            |
| `./scripts/dev-stop.sh`  | Stop all Docker services             |
| `./scripts/db-reset.sh`  | Reset database (drops and recreates) |
| `./scripts/db-seed.sh`   | Seed database with initial/test data |

See [Development Environment Setup](docs/reference/05-guides/development-environment-setup.md) for detailed instructions.

---

## Development

### Quick Links

- [Development Environment Setup](docs/reference/05-guides/development-environment-setup.md)
- [Coding Conventions](docs/reference/05-guides/coding-conventions.md)
- [Testing Strategy](docs/reference/05-guides/testing-strategy.md)
- [Infrastructure Setup](docs/reference/05-guides/infrastructure-setup.md)
- [System Integration Patterns](docs/reference/05-guides/system-integration-patterns.md)

### CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

| Workflow          | Trigger          | Purpose                                        |
| ----------------- | ---------------- | ---------------------------------------------- |
| **CI**            | PR, Push         | Lint, typecheck, test, and build verification  |
| **Security**      | PR, Push, Weekly | Dependency audit, CodeQL analysis, secret scan |
| **Build**         | Push to main     | Build and push Docker images to GHCR           |
| **PR Automation** | PR events        | Auto-labeling, size labeling, stale PR marking |

#### Required Checks for PRs

- ESLint and Prettier formatting
- TypeScript compilation
- Unit tests passing
- Build verification

### Branch Strategy

| Branch      | Purpose                 |
| ----------- | ----------------------- |
| `main`      | Production-ready code   |
| `develop`   | Development integration |
| `feature/*` | Feature development     |
| `hotfix/*`  | Production bug fixes    |

---

## Deployment

### Kubernetes Deployment

The Hospital ERP System supports production-grade Kubernetes deployment with high availability, auto-scaling, and comprehensive observability.

#### Architecture Overview

```
Internet → Ingress (NGINX + TLS) → Frontend/Backend → Redis Cache → PgBouncer → RDS PostgreSQL
                                        ↓
                            Prometheus + Grafana + Loki (Monitoring)
```

**Key Features:**

- **High Availability**: Multi-replica deployments with pod disruption budgets
- **Auto-Scaling**: Horizontal pod autoscaling based on CPU/memory metrics
- **Zero-Trust Security**: Network policies, RBAC, pod security standards
- **GitOps**: ArgoCD-based continuous deployment
- **Observability**: Prometheus metrics, Loki logging, Grafana dashboards
- **TLS**: Automated certificate provisioning with cert-manager

#### Quick Start (Kubernetes)

```bash
# Prerequisites: kubectl, kustomize, helm installed
# Cluster: EKS, GKE, or local (kind/minikube)

# 1. Install infrastructure (NGINX Ingress, cert-manager, monitoring)
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# 2. Configure secrets in AWS Secrets Manager
aws secretsmanager create-secret --name hospital-erp/database/credentials --secret-string '{...}'
aws secretsmanager create-secret --name hospital-erp/backend/secrets --secret-string '{...}'

# 3. Deploy application
kubectl apply -k k8s/overlays/production

# 4. Verify deployment
kubectl get pods -n hospital-erp-system
kubectl get ingress -n hospital-erp-system
```

#### Documentation

| Document                                                  | Description                                |
| --------------------------------------------------------- | ------------------------------------------ |
| [Architecture](docs/kubernetes/architecture.md)           | Detailed system architecture with diagrams |
| [Deployment Guide](docs/kubernetes/deployment-guide.md)   | Step-by-step deployment instructions       |
| [Configuration](docs/kubernetes/configuration.md)         | Environment variables and settings         |
| [Troubleshooting](docs/kubernetes/troubleshooting.md)     | Common issues and debugging guide          |
| [Security](docs/kubernetes/security.md)                   | Network policies, RBAC, and compliance     |
| [Disaster Recovery](docs/kubernetes/disaster-recovery.md) | Backup, restore, and failover procedures   |
| [Runbooks](docs/kubernetes/runbooks/)                     | Operational procedures for incidents       |
| [Kubernetes Manifests](k8s/README.md)                     | Kustomize-based manifest structure         |

#### Environment Configurations

| Environment     | Namespace              | Replicas | Resources          | Auto-Scaling |
| --------------- | ---------------------- | -------- | ------------------ | ------------ |
| **Development** | `hospital-erp-dev`     | 1        | Low (512Mi/500m)   | Disabled     |
| **Staging**     | `hospital-erp-staging` | 2        | Medium (1Gi/1000m) | Enabled      |
| **Production**  | `hospital-erp-prod`    | 3+       | High (2Gi/2000m)   | Enabled      |

#### Monitoring & Observability

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Dashboards for application and infrastructure metrics
- **Loki**: Centralized logging with LogQL queries
- **AlertManager**: Alert routing to Slack/PagerDuty

**Access Grafana:**

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Open http://localhost:3000
```

#### Disaster Recovery

| Scenario         | RTO       | RPO      | Recovery Method              |
| ---------------- | --------- | -------- | ---------------------------- |
| Pod failure      | < 1 min   | 0        | Automatic (Kubernetes)       |
| Node failure     | < 5 min   | 0        | Automatic (Pod rescheduling) |
| Database failure | < 1 hour  | < 15 min | Automated backups (CronJob)  |
| Cluster failure  | < 2 hours | < 15 min | Velero backup restore        |

See [Disaster Recovery Plan](docs/kubernetes/disaster-recovery.md) for detailed procedures.

#### Security & Compliance

The Kubernetes deployment implements HIPAA-compliant security measures:

- **Network Security**: Zero-trust network policies with default deny
- **Access Control**: RBAC with least privilege principle
- **Secrets Management**: AWS Secrets Manager with External Secrets Operator
- **Pod Security**: Restricted pod security standards enforced
- **TLS/SSL**: Automated certificate management with cert-manager
- **Audit Logging**: Comprehensive logging for all PHI access

See [Security Documentation](docs/kubernetes/security.md) for complete security architecture.

---

## Roadmap

| Phase       | Period    | Focus                                        |
| ----------- | --------- | -------------------------------------------- |
| **Phase 1** | Month 1-2 | Foundation (Auth, Patient, Room Management)  |
| **Phase 2** | Month 3-4 | Core Features (Admission/Discharge, Reports) |
| **Phase 3** | Month 5   | Advanced Features (Rounds, Statistics)       |
| **Phase 4** | Month 6   | Stabilization & Launch                       |

---

## Security & Compliance

This system is designed to comply with:

- **Medical Service Act** (의료법)
- **Personal Information Protection Act** (개인정보보호법)
- **Electronic Documents Act** (전자문서법)

All patient data is encrypted at rest and in transit. See [Security Requirements](docs/reference/03-security/security-requirements.md) for details.

---

## Contributing

This is a proprietary project. Contribution guidelines will be provided to authorized team members.

---

## License

Proprietary - All rights reserved.

---

## Contact

- **Project Maintainer**: kcenon@naver.com
- **Documentation**: See [Reference Documentation](docs/reference/README.md)

---

_Last Updated: 2026-01-15_
