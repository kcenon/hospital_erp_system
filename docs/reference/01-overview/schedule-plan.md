# Project Schedule Plan

## Document Information

| Item | Content |
|------|---------|
| Document Version | 0.1.0.0 |
| Created Date | 2025-12-29 |
| Status | Proposal |
| Maintainer | kcenon@naver.com |

---

## 1. Project Overview

### 1.1 Schedule Summary

| Item | Content |
|------|---------|
| Project Name | Inpatient Management ERP System |
| Start Date | Immediately upon contract signing |
| Total Duration | Approximately 4-5 months (detailed discussion required) |
| Major Milestones | 4 phases |

### 1.2 Overall Schedule Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Project Overall Schedule                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 1: Analysis & Design (4 weeks)                                        │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                       │
│  └─ Requirements analysis, system design, prototype                          │
│                                                                              │
│  Phase 2: Development - Core (6 weeks)                                       │
│  ░░░░░░░░████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                       │
│  └─ Patient mgmt, room mgmt, admission/discharge, legacy integration         │
│                                                                              │
│  Phase 3: Development - Extended (4 weeks)                                   │
│  ░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░                       │
│  └─ Reports/logs, rounding, mobile optimization                              │
│                                                                              │
│  Phase 4: Stabilization & Deployment (3 weeks)                               │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████░░░░░░░░░░░░░░░░░                       │
│  └─ Testing, data migration, training, production transition                 │
│                                                                              │
│        W1-4        W5-10       W11-14      W15-17                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Phase Schedule

### 2.1 Phase 1: Analysis & Design (4 weeks)

```
Week 1-2: Requirements Analysis
├── Current State Assessment
│   ├── Existing Google Sheets analysis
│   ├── Current business process interviews
│   ├── Existing medical program DB analysis
│   └── Stakeholder requirements gathering
│
└── Requirements Definition
    ├── Functional requirements specification
    ├── Non-functional requirements specification
    ├── Priority definition (MoSCoW)
    └── Requirements review meeting

Week 3-4: System Design
├── Architecture Design
│   ├── System architecture document
│   ├── Database design
│   ├── API design
│   └── Security design
│
├── UI/UX Design
│   ├── Wireframes
│   ├── Screen design document
│   └── Design system definition
│
└── Clickable Prototype
    ├── Main screen prototypes
    ├── User feedback collection
    └── Final design confirmation
```

| Deliverable | Completion Criteria |
|-------------|---------------------|
| Requirements Definition Document | Stakeholder review completed |
| System Design Document | Technical review completed |
| Screen Design Document | User confirmation completed |
| Prototype | Main screens clickable |
| DB Design Document | ERD and DDL completed |
| API Specification | OpenAPI spec completed |

### 2.2 Phase 2: Development - Core (6 weeks)

```
Week 5-6: Foundation Setup
├── Development Environment Setup
│   ├── Project structure configuration
│   ├── CI/CD pipeline setup
│   ├── Development/staging server configuration
│   └── Database initial setup
│
└── Authentication/Authorization Module
    ├── User management functions
    ├── Login/Logout
    ├── JWT-based authentication
    ├── Role-based permission management
    └── Basic audit log implementation

Week 7-8: Patient & Room Management
├── Patient Management Module
│   ├── Patient registration/lookup/modification
│   ├── Patient search function
│   ├── Patient detail information screen
│   └── Patient history management
│
└── Room Management Module
    ├── Room/bed structure management
    ├── Room status board UI
    ├── Real-time status updates
    └── Available bed lookup

Week 9-10: Admission/Discharge & Integration
├── Admission/Discharge Management Module
│   ├── Admission processing
│   ├── Room transfer processing
│   ├── Discharge processing
│   └── Admission history management
│
└── Legacy System Integration
    ├── Integration adapter development
    ├── Patient information synchronization
    ├── Medical information lookup
    └── Data consistency verification
```

| Deliverable | Completion Criteria |
|-------------|---------------------|
| Authentication Module | Login/permission management functional |
| Patient Management | CRUD functions operational |
| Room Status Board | Real-time updates operational |
| Admission/Discharge Management | Complete process operational |
| System Integration | Legacy DB data retrieval working |

### 2.3 Phase 3: Development - Extended (4 weeks)

```
Week 11-12: Reports & Logs
├── Vital Signs Management
│   ├── Vital sign entry (PC/Mobile)
│   ├── Vital sign trend graphs
│   ├── Abnormal value alerts
│   └── Vital sign history lookup
│
├── I/O (Intake/Output) Management
│   ├── I/O entry function
│   ├── Daily total calculation
│   └── I/O record lookup
│
├── Nursing Log
│   ├── Log writing function
│   ├── SOAP format support
│   └── Log search/lookup
│
└── Medication Records
    ├── Medication schedule management
    ├── Medication record entry
    └── Medication history lookup

Week 13-14: Rounding & Mobile
├── Rounding Module
│   ├── Rounding session creation
│   ├── Per-patient rounding records
│   ├── Rounding completion processing
│   └── Rounding history lookup
│
├── Mobile/Tablet Optimization
│   ├── Responsive layout completion
│   ├── Touch-optimized UI
│   ├── Offline support (basic)
│   └── PWA configuration
│
└── Administrator Functions
    ├── User management screen
    ├── Permission management screen
    ├── System settings
    └── Audit log lookup
```

| Deliverable | Completion Criteria |
|-------------|---------------------|
| Vital Signs Management | Entry/lookup/graphs operational |
| I/O Management | Entry/total calculation operational |
| Nursing Log | CRUD functions operational |
| Rounding | Complete process operational |
| Mobile UI | Tablet optimization completed |
| Administrator Functions | All management functions operational |

### 2.4 Phase 4: Stabilization & Deployment (3 weeks)

```
Week 15: Integration Testing
├── Functional Testing
│   ├── Complete function testing
│   ├── Bug fixes
│   └── Performance testing
│
├── Security Testing
│   ├── Vulnerability scanning
│   ├── Penetration testing
│   └── Security issue resolution
│
└── User Acceptance Testing (UAT)
    ├── Scenario-based testing
    ├── Feedback collection
    └── Final modifications

Week 16: Data Migration & Deployment
├── Data Migration
│   ├── Google Sheets data cleansing
│   ├── Data transformation and migration
│   ├── Data verification
│   └── Migration completion confirmation
│
└── Production Environment Deployment
    ├── Production server configuration
    ├── Application deployment
    ├── Monitoring setup
    └── Backup system establishment

Week 17: Training & Stabilization
├── User Training
│   ├── Administrator training
│   ├── General user training
│   ├── User manual distribution
│   └── Q&A sessions
│
└── Stabilization Operations
    ├── Production monitoring
    ├── Initial issue response
    ├── Performance optimization
    └── Operations handover
```

| Deliverable | Completion Criteria |
|-------------|---------------------|
| Test Results Report | Major bugs: 0 |
| Migration Complete | Data consistency: 100% |
| User Manual | Distribution completed |
| Administrator Manual | Handover completed |
| Completion Report | Final approval |

---

## 3. Milestones

### 3.1 Major Milestones

| Milestone | Target Date | Key Content | Completion Criteria |
|-----------|-------------|-------------|---------------------|
| **M1: Design Complete** | W4 | Design documents completed | Design review approved |
| **M2: Core Development Complete** | W10 | Core functions completed | Functional testing passed |
| **M3: Full Development Complete** | W14 | All functions completed | UAT ready to start |
| **M4: Service Launch** | W17 | Production operations begin | Stable operations confirmed |

### 3.2 Milestone Checkpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                       Milestone Checkpoints                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  M1: Design Complete ◆──────────────────────────────────────── │
│      □ Requirements definition document approved                 │
│      □ System architecture review completed                      │
│      □ DB design review completed                                │
│      □ Screen design confirmed                                   │
│      □ Prototype demo completed                                  │
│                                                                  │
│  M2: Core Development Complete ◆─────────────────────────────  │
│      □ Authentication/authorization function tests passed        │
│      □ Patient management CRUD operational                       │
│      □ Room status board real-time updates working               │
│      □ Admission/discharge process completed                     │
│      □ Legacy system integration confirmed                       │
│                                                                  │
│  M3: Full Development Complete ◆────────────────────────────── │
│      □ All reports/logs functions operational                    │
│      □ Rounding function operational                             │
│      □ Mobile UI optimization completed                          │
│      □ Administrator functions completed                         │
│      □ Integration testing passed                                │
│                                                                  │
│  M4: Service Launch ◆─────────────────────────────────────────  │
│      □ UAT completed and approved                                │
│      □ Data migration completed                                  │
│      □ Production deployment completed                           │
│      □ User training completed                                   │
│      □ Stable operations confirmed (1 week)                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Resource Plan

### 4.1 Expected Resource Allocation

| Role | Headcount | Allocation Period | Primary Tasks |
|------|-----------|-------------------|---------------|
| PM/PL | 1 | Entire period | Project management, client communication |
| Backend Developer | 2 | W3-W15 | API development, DB, integration |
| Frontend Developer | 2 | W3-W15 | UI development, responsive |
| UI/UX Designer | 1 | W1-W6 | Design, prototype |
| QA Engineer | 1 | W5-W17 | Testing, quality management |
| Infrastructure/DevOps | 0.5 | W1-W17 | Servers, CI/CD, deployment |

### 4.2 Resource Allocation Plan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Role              W1-2  W3-4  W5-6  W7-8  W9-10 W11-12 W13-14 W15-16 W17  │
├─────────────────────────────────────────────────────────────────────────────┤
│  PM/PL             ████  ████  ████  ████  ████   ████   ████   ████  ████ │
│  Backend Dev (2)         ████  ████  ████  ████   ████   ████   ██        │
│  Frontend Dev (2)        ████  ████  ████  ████   ████   ████   ██        │
│  UI/UX Designer    ████  ████  ██                                          │
│  QA Engineer             ██    ████  ████  ████   ████   ████   ████  ████ │
│  Infra/DevOps      ██    ██    ██    ██    ██     ██     ██     ████  ██   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Risk Management

### 5.1 Major Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Legacy system integration delay | High | Medium | Early DB analysis, use of mock server |
| Requirements changes | Medium | High | Change management process, schedule buffer |
| Key personnel departure | High | Low | Documentation, knowledge sharing |
| Technical challenges | Medium | Medium | Early PoC execution, expert consultation |
| Data migration issues | High | Medium | Pre-analysis of data, automated verification |

### 5.2 Risk Response Plan

```
┌─────────────────────────────────────────────────────────────────┐
│                        Risk Response Matrix                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│     High  │  ⚠️ Monitor       │  🔴 Immediate   │  🔴 Immediate  │
│           │  (Technical       │  (Legacy        │  (Personnel    │
│           │   challenges)     │   integration)  │   departure)   │
│  Impact   │                   │                 │                │
│     Med   │  ✅ Accept        │  ⚠️ Monitor     │  ⚠️ Monitor    │
│           │                   │  (Migration)    │  (Req changes) │
│           │                   │                 │                │
│     Low   │  ✅ Accept        │  ✅ Accept      │  ⚠️ Monitor    │
│           │                   │                 │                │
│           └───────────────────┴─────────────────┴────────────────│
│                Low               Medium             High         │
│                              Probability                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Communication Plan

### 6.1 Regular Meetings

| Meeting Type | Frequency | Attendees | Purpose |
|--------------|-----------|-----------|---------|
| Kickoff Meeting | Once | All | Project start, goal sharing |
| Weekly Progress Meeting | Weekly | PM, Dev team | Progress status, issue sharing |
| Client Review | Bi-weekly | PM, Client | Deliverable review, feedback |
| Milestone Review | Per milestone | All | Phase completion confirmation |
| Daily Standup | Daily | Dev team | Daily progress/issue sharing |

### 6.2 Reporting Structure

```
Project Reporting Structure

┌────────────────────────────────────────┐
│           Client (Decision Maker)       │
│                    ▲                   │
│                    │ Weekly/Monthly     │
│                    │ Reports            │
│              ┌─────┴─────┐             │
│              │    PM     │             │
│              └─────┬─────┘             │
│                    │ Daily Reports     │
│     ┌──────────────┼──────────────┐    │
│     ▼              ▼              ▼    │
│ ┌───────┐    ┌───────┐    ┌───────┐   │
│ │  Dev  │    │ Design│    │  QA   │   │
│ │ Team  │    │       │    │       │   │
│ └───────┘    └───────┘    └───────┘   │
└────────────────────────────────────────┘
```

---

## 7. Quality Management

### 7.1 Quality Standards

| Area | Quality Standard | Measurement Method |
|------|------------------|-------------------|
| Functionality | 100% requirements implementation | Functional testing |
| Performance | Response time within 3 seconds | Performance testing |
| Security | High/Critical vulnerabilities: 0 | Security scan |
| Usability | User satisfaction 80%+ | UAT survey |
| Reliability | Availability 99.5%+ | Monitoring |

### 7.2 Test Strategy

```
Test Pyramid

         /\
        /  \  E2E Tests (10%)
       /----\  - Core user scenarios
      /      \
     /--------\  Integration Tests (30%)
    /          \  - API tests
   /------------\  - Inter-module integration
  /              \
 /----------------\  Unit Tests (60%)
/                  \  - Business logic
/--------------------\  - Utility functions
```

---

## 8. Change Management

### 8.1 Change Request Process

```
┌─────────────────────────────────────────────────────────────────┐
│                        Change Request Process                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Change Request ──> 2. Impact Analysis ──> 3. Review/Approve ──> 4. Implement │
│       │                      │                     │                    │        │
│       ▼                      ▼                     ▼                    ▼        │
│   Change Request        Impact Analysis       Approve/Reject      Development/  │
│   Document              (Schedule, Cost)      Decision            Testing       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Change Approval Criteria

| Change Scale | Approval Authority | Processing Deadline |
|--------------|-------------------|-------------------|
| Minor (UI modifications, etc.) | PM | 3 days |
| Moderate (Function modifications) | PM + Client Representative | 1 week |
| Major (Schedule impact) | Client Decision Maker | 2 weeks |

---

## Appendix: Detailed WBS

### Work Breakdown Structure

```
1. Project Management
   1.1 Project Planning
   1.2 Progress Management
   1.3 Quality Management
   1.4 Risk Management
   1.5 Change Management

2. Analysis & Design
   2.1 Requirements Analysis
       2.1.1 Current State Assessment
       2.1.2 Stakeholder Interviews
       2.1.3 Requirements Definition
       2.1.4 Requirements Review
   2.2 System Design
       2.2.1 Architecture Design
       2.2.2 Database Design
       2.2.3 API Design
       2.2.4 Security Design
   2.3 UI/UX Design
       2.3.1 Wireframes
       2.3.2 Screen Design
       2.3.3 Prototype

3. Development - Core
   3.1 Development Environment Setup
   3.2 Authentication/Authorization Module
   3.3 Patient Management Module
   3.4 Room Management Module
   3.5 Admission/Discharge Management Module
   3.6 Legacy System Integration

4. Development - Extended
   4.1 Vital Signs Management
   4.2 I/O Management
   4.3 Nursing Log
   4.4 Medication Management
   4.5 Rounding Module
   4.6 Mobile Optimization
   4.7 Administrator Functions

5. Testing & Deployment
   5.1 Unit Testing
   5.2 Integration Testing
   5.3 Performance Testing
   5.4 Security Testing
   5.5 UAT
   5.6 Data Migration
   5.7 Production Deployment

6. Training & Stabilization
   6.1 User Training
   6.2 Operations Training
   6.3 Manual Writing
   6.4 Stabilization Operations
   6.5 Handover
```
