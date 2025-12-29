# Inpatient Management ERP System - Reference Documentation

> **Project**: Inpatient Management ERP System
> **Version**: 0.1.3.0
> **Last Modified**: 2025-12-29
> **Maintainer**: kcenon@naver.com

---

## Document Structure

```
reference/
├── README.md                              # Current document (index)
│
├── 01-overview/                           # Project Overview
│   ├── project-overview.md                # Project overview and scope
│   ├── technology-stack.md                # Technology stack proposal
│   └── schedule-plan.md                   # Project schedule plan
│
├── 02-design/                             # System Design
│   ├── system-architecture.md             # System architecture
│   ├── database-design.md                 # Database design
│   ├── api-specification.md               # API specification
│   ├── ui-design.md                       # UI design guide
│   └── lis-integration.md                 # LIS integration specification
│
├── 03-security/                           # Security
│   └── security-requirements.md           # Security requirements
│
├── 04-appendix/                           # Appendix
│   └── glossary.md                        # Glossary
│
└── 05-guides/                             # Development Guides
    ├── development-environment-setup.md   # Development environment setup
    ├── coding-conventions.md              # Coding conventions
    ├── infrastructure-setup.md            # Infrastructure setup
    ├── testing-strategy.md                # Test strategy
    └── system-integration-patterns.md     # System integration patterns
```

---

## Document List

### 01. Project Overview

| Document | Description | Target Audience |
|----------|-------------|-----------------|
| [project-overview.md](01-overview/project-overview.md) | Project background, objectives, scope, stakeholders, constraints | All |
| [technology-stack.md](01-overview/technology-stack.md) | Technology stack proposal (Next.js, NestJS, PostgreSQL, etc.) | Technical team, Decision makers |
| [schedule-plan.md](01-overview/schedule-plan.md) | 4-phase schedule plan, milestones, resources, risk management | PM, Executives |

### 02. System Design

| Document | Description | Target Audience |
|----------|-------------|-----------------|
| [system-architecture.md](02-design/system-architecture.md) | System architecture, module structure, data flow, deployment configuration | Development team |
| [database-design.md](02-design/database-design.md) | ERD, table definitions (DDL), encryption strategy, indexes | Backend developers |
| [api-specification.md](02-design/api-specification.md) | RESTful API endpoints, request/response formats, error codes | Full-stack developers |
| [ui-design.md](02-design/ui-design.md) | Design system, colors/typography, screen wireframes | Frontend, Designers |
| [lis-integration.md](02-design/lis-integration.md) | LIS integration specification, HL7/FHIR standards, data models | Backend, Integration team |

### 03. Security

| Document | Description | Target Audience |
|----------|-------------|-----------------|
| [security-requirements.md](03-security/security-requirements.md) | Authentication/authorization, encryption, audit logs, vulnerability management, regulatory compliance | All |

### 04. Appendix

| Document | Description | Target Audience |
|----------|-------------|-----------------|
| [glossary.md](04-appendix/glossary.md) | Medical terminology, technical terms, relevant regulations summary | All |

### 05. Development Guides

| Document | Description | Target Audience |
|----------|-------------|-----------------|
| [development-environment-setup.md](05-guides/development-environment-setup.md) | Development environment setup (Node.js, Docker, Prisma, etc.) | All developers |
| [coding-conventions.md](05-guides/coding-conventions.md) | TypeScript, React, NestJS coding rules | All developers |
| [infrastructure-setup.md](05-guides/infrastructure-setup.md) | AWS infrastructure configuration, Terraform, CI/CD pipeline | DevOps, Backend |
| [testing-strategy.md](05-guides/testing-strategy.md) | Unit/integration/E2E test strategy and execution guide | All developers |
| [system-integration-patterns.md](05-guides/system-integration-patterns.md) | Legacy system integration patterns, HL7/FHIR communication | Backend, Integration team |

---

## Document Reading Guide

### When First Understanding the Project

```
1. project-overview.md         → Understand the entire project
2. technology-stack.md         → Understand technical direction
3. schedule-plan.md            → Review schedule and milestones
```

### When Starting Development

```
1. system-architecture.md      → Understand overall structure
2. database-design.md          → Understand data model
3. api-specification.md        → Review API specifications
4. ui-design.md                → Learn UI guidelines
```

### During Security Review

```
1. security-requirements.md              → Complete security requirements
2. database-design.md (encryption)       → Data protection measures
3. api-specification.md (auth section)   → API security
```

### When Setting Up Development Environment

```
1. development-environment-setup.md  → Configure local environment
2. coding-conventions.md             → Learn coding rules
3. testing-strategy.md               → Learn test writing
```

### During Infrastructure/Deployment Work

```
1. infrastructure-setup.md     → Understand AWS infrastructure
2. system-architecture.md      → Review deployment architecture
3. security-requirements.md    → Review security configuration
```

### During Legacy System Integration

```
1. system-integration-patterns.md → Understand integration patterns
2. api-specification.md           → Review API interfaces
3. database-design.md             → Understand data mapping
```

### During LIS Integration

```
1. lis-integration.md             → LIS integration specification
2. system-integration-patterns.md → General integration patterns
3. api-specification.md           → API interface design
4. security-requirements.md       → Healthcare data security
```

---

## Document Status

| Document | Status | Version | Last Modified |
|----------|--------|---------|---------------|
| project-overview.md | Draft | 1.0.0 | 2025-12-29 |
| technology-stack.md | Proposal | 1.0.0 | 2025-12-29 |
| schedule-plan.md | Proposal | 1.0.0 | 2025-12-29 |
| system-architecture.md | Draft | 1.0.0 | 2025-12-29 |
| database-design.md | Draft | 1.0.0 | 2025-12-29 |
| api-specification.md | Draft | 1.0.0 | 2025-12-29 |
| ui-design.md | Draft | 1.0.0 | 2025-12-29 |
| lis-integration.md | Draft | 1.0.0 | 2025-12-29 |
| security-requirements.md | Draft | 1.0.0 | 2025-12-29 |
| glossary.md | Draft | 1.0.0 | 2025-12-29 |
| development-environment-setup.md | Draft | 1.0.0 | 2025-12-29 |
| coding-conventions.md | Draft | 1.0.0 | 2025-12-29 |
| infrastructure-setup.md | Draft | 1.0.0 | 2025-12-29 |
| testing-strategy.md | Draft | 1.0.0 | 2025-12-29 |
| system-integration-patterns.md | Draft | 1.0.0 | 2025-12-29 |

---

## Document Management Rules

### Version Control

- **Major (x.0.0)**: Structural changes, major revisions
- **Minor (0.x.0)**: Content additions, section changes
- **Patch (0.0.x)**: Typos, minor corrections

### Status Definitions

| Status | Description |
|--------|-------------|
| Draft | Writing completed, pending review |
| Under Review | Stakeholder review in progress |
| Approved | Final approval completed |
| Deprecated | No longer valid |

---

## Change History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-29 | 1.4.0 | Added LIS integration specification document |
| 2025-12-29 | 1.3.0 | Folder and file names converted to English |
| 2025-12-29 | 1.2.0 | Folder and file names converted to Korean |
| 2025-12-29 | 1.1.0 | Added 05-guides folder (5 development guides) |
| 2025-12-29 | 1.0.0 | Initial document structure created |

---

## Contact

For project-related inquiries, please contact the PM.
