# 용어 사전 및 부록

## 문서 정보

| 항목      | 내용             |
| --------- | ---------------- |
| 문서 버전 | 0.1.0.0          |
| 작성일    | 2025-12-29       |
| 상태      | 초안             |
| 관리자    | kcenon@naver.com |

---

## 1. 의료 용어 사전

### 1.1 환자 관리 용어

| 용어 (한글) | 용어 (영문)    | 약어 | 설명                        |
| ----------- | -------------- | ---- | --------------------------- |
| 입원        | Admission      | ADM  | 환자가 병원에 입원하는 것   |
| 퇴원        | Discharge      | DC   | 환자가 병원에서 나가는 것   |
| 전실        | Transfer       | TRF  | 다른 병실로 옮기는 것       |
| 외래        | Outpatient     | OPD  | 입원하지 않고 진료받는 환자 |
| 입원환자    | Inpatient      | IPD  | 입원하여 치료받는 환자      |
| 재원환자    | Census         | -    | 현재 입원 중인 환자         |
| 재원일수    | Length of Stay | LOS  | 입원 기간 (일)              |

### 1.2 바이탈 사인 용어

| 용어 (한글) | 용어 (영문)       | 약어 | 정상 범위     | 단위  |
| ----------- | ----------------- | ---- | ------------- | ----- |
| 체온        | Temperature       | T    | 36.1~37.2     | °C    |
| 혈압        | Blood Pressure    | BP   | 90/60~120/80  | mmHg  |
| 수축기 혈압 | Systolic BP       | SBP  | 90~120        | mmHg  |
| 이완기 혈압 | Diastolic BP      | DBP  | 60~80         | mmHg  |
| 맥박        | Pulse Rate        | PR   | 60~100        | bpm   |
| 호흡        | Respiratory Rate  | RR   | 12~20         | /min  |
| 산소포화도  | Oxygen Saturation | SpO2 | 95~100        | %     |
| 혈당        | Blood Glucose     | BG   | 70~100 (공복) | mg/dL |

### 1.3 섭취/배설 (I/O) 용어

| 용어 (한글) | 용어 (영문)       | 약어 | 설명                      |
| ----------- | ----------------- | ---- | ------------------------- |
| 섭취량      | Intake            | I    | 경구, 수액 등 들어간 양   |
| 배설량      | Output            | O    | 소변, 대변 등 나온 양     |
| 경구 섭취   | Oral Intake       | PO   | 입으로 먹은 양            |
| 수액        | Intravenous Fluid | IV   | 정맥으로 주입한 수액      |
| 요량        | Urine Output      | UO   | 소변량                    |
| 금식        | Nil Per Os        | NPO  | 입으로 아무것도 먹지 않음 |

### 1.4 투약 관련 용어

| 용어 (한글) | 용어 (영문)       | 약어 | 설명             |
| ----------- | ----------------- | ---- | ---------------- |
| 경구        | Per Oral          | PO   | 입으로 복용      |
| 정맥주사    | Intravenous       | IV   | 정맥으로 주사    |
| 근육주사    | Intramuscular     | IM   | 근육에 주사      |
| 피하주사    | Subcutaneous      | SC   | 피부 아래 주사   |
| 외용        | Topical           | TOP  | 피부에 바르는 것 |
| 1일 1회     | Once Daily        | QD   | 하루에 한 번     |
| 1일 2회     | Twice Daily       | BID  | 하루에 두 번     |
| 1일 3회     | Three Times Daily | TID  | 하루에 세 번     |
| 필요시      | As Needed         | PRN  | 필요할 때        |
| 식전        | Before Meal       | AC   | 식사 전          |
| 식후        | After Meal        | PC   | 식사 후          |

### 1.5 환자 상태 용어

| 용어 (한글) | 용어 (영문) | 설명               |
| ----------- | ----------- | ------------------ |
| 안정        | Stable      | 상태가 안정적      |
| 호전        | Improving   | 상태가 좋아지는 중 |
| 악화        | Declining   | 상태가 나빠지는 중 |
| 위급        | Critical    | 위험한 상태        |
| 명료        | Alert       | 의식 명료          |
| 기면        | Drowsy      | 졸린 상태          |
| 혼미        | Stupor      | 강한 자극에만 반응 |
| 혼수        | Coma        | 무반응 상태        |

### 1.6 간호 기록 용어 (SOAP)

| 용어   | 영문       | 설명               |
| ------ | ---------- | ------------------ |
| 주관적 | Subjective | 환자가 말하는 증상 |
| 객관적 | Objective  | 관찰/측정된 데이터 |
| 사정   | Assessment | 간호사의 판단      |
| 계획   | Plan       | 간호 계획          |

---

## 2. 기술 용어 사전

### 2.1 시스템 아키텍처

| 용어     | 설명                                                         |
| -------- | ------------------------------------------------------------ |
| **API**  | Application Programming Interface, 시스템 간 통신 인터페이스 |
| **REST** | Representational State Transfer, API 설계 스타일             |
| **JWT**  | JSON Web Token, 인증 토큰 형식                               |
| **RBAC** | Role-Based Access Control, 역할 기반 접근 제어               |
| **SSR**  | Server-Side Rendering, 서버 측 렌더링                        |
| **PWA**  | Progressive Web App, 웹 기반 앱                              |
| **ORM**  | Object-Relational Mapping, 객체-DB 매핑                      |

### 2.2 데이터베이스

| 용어      | 설명                                                             |
| --------- | ---------------------------------------------------------------- |
| **ACID**  | Atomicity, Consistency, Isolation, Durability - DB 트랜잭션 속성 |
| **DDL**   | Data Definition Language, 데이터 정의 언어 (CREATE, ALTER)       |
| **DML**   | Data Manipulation Language, 데이터 조작 언어 (SELECT, INSERT)    |
| **ERD**   | Entity-Relationship Diagram, 개체 관계도                         |
| **FK**    | Foreign Key, 외래 키                                             |
| **PK**    | Primary Key, 기본 키                                             |
| **Index** | 검색 속도 향상을 위한 데이터 구조                                |

### 2.3 보안

| 용어       | 설명                                                 |
| ---------- | ---------------------------------------------------- |
| **AES**    | Advanced Encryption Standard, 대칭키 암호화 알고리즘 |
| **bcrypt** | 비밀번호 해싱 알고리즘                               |
| **MFA**    | Multi-Factor Authentication, 다중 인증               |
| **TLS**    | Transport Layer Security, 전송 계층 보안             |
| **WAF**    | Web Application Firewall, 웹 방화벽                  |
| **XSS**    | Cross-Site Scripting, 스크립트 삽입 공격             |
| **CSRF**   | Cross-Site Request Forgery, 요청 위조 공격           |

### 2.4 클라우드/인프라

| 용어      | 설명                                                |
| --------- | --------------------------------------------------- |
| **AWS**   | Amazon Web Services, 아마존 클라우드 서비스         |
| **ECS**   | Elastic Container Service, AWS 컨테이너 서비스      |
| **RDS**   | Relational Database Service, AWS 관리형 DB          |
| **ALB**   | Application Load Balancer, 부하 분산기              |
| **CDN**   | Content Delivery Network, 콘텐츠 전송 네트워크      |
| **VPC**   | Virtual Private Cloud, 가상 사설 클라우드           |
| **CI/CD** | Continuous Integration/Deployment, 지속적 통합/배포 |

---

## 3. 의료 시스템 관련 용어

### 3.1 의료 정보 시스템

| 용어 | 영문                                       | 설명                   |
| ---- | ------------------------------------------ | ---------------------- |
| EMR  | Electronic Medical Record                  | 전자의무기록           |
| OCS  | Order Communication System                 | 처방전달시스템         |
| PACS | Picture Archiving and Communication System | 의료영상저장전송시스템 |
| LIS  | Laboratory Information System              | 검사정보시스템         |
| RIS  | Radiology Information System               | 영상정보시스템         |
| HIS  | Hospital Information System                | 병원정보시스템         |
| CRM  | Customer Relationship Management           | 고객관계관리           |

### 3.2 의료 표준

| 표준          | 설명                                                          |
| ------------- | ------------------------------------------------------------- |
| **HL7**       | Health Level 7, 의료정보 교환 표준                            |
| **DICOM**     | Digital Imaging and Communications in Medicine, 의료영상 표준 |
| **ICD-10**    | International Classification of Diseases, 질병분류코드        |
| **SNOMED CT** | Systematized Nomenclature of Medicine, 의학용어체계           |

---

## 4. 프로젝트 관리 용어

### 4.1 방법론 및 프로세스

| 용어        | 설명                                        |
| ----------- | ------------------------------------------- |
| **Agile**   | 반복적, 점진적 개발 방법론                  |
| **Sprint**  | 1~4주 단위의 개발 주기                      |
| **Backlog** | 개발해야 할 기능 목록                       |
| **MVP**     | Minimum Viable Product, 최소 기능 제품      |
| **UAT**     | User Acceptance Testing, 사용자 인수 테스트 |
| **WBS**     | Work Breakdown Structure, 작업 분류 체계    |

### 4.2 품질 관리

| 용어    | 설명                                      |
| ------- | ----------------------------------------- |
| **QA**  | Quality Assurance, 품질 보증              |
| **QC**  | Quality Control, 품질 관리                |
| **SLA** | Service Level Agreement, 서비스 수준 협약 |
| **KPI** | Key Performance Indicator, 핵심 성과 지표 |
| **RTO** | Recovery Time Objective, 복구 목표 시간   |
| **RPO** | Recovery Point Objective, 복구 목표 시점  |

---

## 5. 관련 법규 요약

### 5.1 개인정보보호법

```
┌─────────────────────────────────────────────────────────────────┐
│                    개인정보보호법 주요 조항                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  제23조 (민감정보의 처리 제한)                                   │
│  - 건강, 유전, 범죄 등 민감정보는 별도 동의 필요                   │
│  - 의료 정보는 민감정보에 해당                                    │
│                                                                  │
│  제24조 (고유식별정보의 처리 제한)                                │
│  - 주민등록번호는 법령에서 허용하는 경우만 수집                    │
│  - 암호화 저장 필수                                              │
│                                                                  │
│  제29조 (안전조치의무)                                           │
│  - 기술적, 관리적, 물리적 보호조치                                │
│  - 접근 권한 관리, 접근 기록 보관                                 │
│                                                                  │
│  제34조 (개인정보 유출 통지 등)                                   │
│  - 유출 시 지체 없이 정보주체에 통지                              │
│  - 1,000명 이상 유출 시 개인정보보호위원회 신고                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 의료법

```
┌─────────────────────────────────────────────────────────────────┐
│                      의료법 주요 조항                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  제21조 (기록 열람 등)                                           │
│  - 의료인/의료기관은 환자 외 타인에게 기록 열람 제한               │
│  - 환자의 동의 또는 법률에 의한 경우만 예외                        │
│                                                                  │
│  제22조 (진료기록부 등)                                          │
│  - 진료기록부 작성 및 보존 의무                                   │
│  - 전자의무기록 시스템 사용 시 전자서명 필요                       │
│                                                                  │
│  제23조 (전자의무기록)                                           │
│  - 진본성, 무결성, 보안성 확보 필요                               │
│  - 보건복지부령이 정하는 기준 준수                                │
│                                                                  │
│  보존 기간                                                       │
│  - 진료기록부: 10년                                              │
│  - 수술기록: 10년                                                │
│  - 간호기록부: 5년                                               │
│  - 환자명부: 5년                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 참고 자료

### 6.1 기술 문서

| 자료              | 링크/참조                       |
| ----------------- | ------------------------------- |
| Next.js 공식 문서 | https://nextjs.org/docs         |
| NestJS 공식 문서  | https://docs.nestjs.com         |
| Prisma 공식 문서  | https://www.prisma.io/docs      |
| PostgreSQL 매뉴얼 | https://www.postgresql.org/docs |
| Tailwind CSS      | https://tailwindcss.com/docs    |
| shadcn/ui         | https://ui.shadcn.com           |

### 6.2 보안 가이드

| 자료                | 설명                           |
| ------------------- | ------------------------------ |
| OWASP Top 10        | 웹 애플리케이션 보안 위험 10선 |
| KISA 가이드라인     | 한국인터넷진흥원 보안 가이드   |
| 개인정보보호 가이드 | 개인정보보호위원회 발간 자료   |

### 6.3 의료 정보화 표준

| 자료                     | 설명                         |
| ------------------------ | ---------------------------- |
| 의료정보 표준 프레임워크 | 보건복지부 표준 가이드       |
| 전자의무기록 인증 기준   | 한국보건의료정보원 인증 기준 |

---

## 7. 문서 목차 (전체 참조)

### 7.1 프로젝트 문서 구조

```
hospital_erp_system/docs/reference/
├── 00-project-overview.md          # 프로젝트 개요
├── planning/
│   ├── 01-tech-stack-proposal.md   # 기술 스택 제안서
│   └── 07-project-schedule.md      # 프로젝트 일정
├── architecture/
│   └── 02-system-architecture.md   # 시스템 아키텍처
├── database/
│   └── 03-database-design.md       # 데이터베이스 설계
├── api/
│   └── 04-api-specification.md     # API 명세서
├── security/
│   └── 05-security-requirements.md # 보안 요구사항
├── ui/
│   └── 06-ui-design-guide.md       # 화면 설계 가이드
└── 08-glossary-appendix.md         # 용어 사전 및 부록
```

### 7.2 문서 간 참조 관계

```
┌─────────────────────────────────────────────────────────────────┐
│                        문서 참조 관계                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│           ┌────────────────────────┐                            │
│           │   00. 프로젝트 개요     │                            │
│           └───────────┬────────────┘                            │
│                       │                                          │
│     ┌─────────────────┼─────────────────┐                       │
│     ▼                 ▼                 ▼                       │
│ ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│ │ 01.기술   │    │ 02.아키텍처│    │ 07.일정  │                   │
│ │   스택    │───>│          │    │         │                   │
│ └──────────┘    └────┬─────┘    └──────────┘                   │
│                      │                                          │
│     ┌────────────────┼────────────────┐                        │
│     ▼                ▼                ▼                        │
│ ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│ │ 03.DB    │    │ 04.API   │    │ 05.보안  │                   │
│ │  설계    │<──>│  명세    │<──>│  요구사항 │                   │
│ └──────────┘    └────┬─────┘    └──────────┘                   │
│                      │                                          │
│                      ▼                                          │
│                ┌──────────┐                                     │
│                │ 06.UI    │                                     │
│                │  설계    │                                     │
│                └──────────┘                                     │
│                                                                  │
│                ┌──────────┐                                     │
│                │ 08.용어  │ ← 전체 문서에서 참조                  │
│                │  사전    │                                     │
│                └──────────┘                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. 변경 이력

| 버전  | 일자       | 작성자 | 변경 내용 |
| ----- | ---------- | ------ | --------- |
| 1.0.0 | 2025-12-29 | -      | 초안 작성 |

---

## 9. 문서 승인

| 역할   | 성명 | 서명 | 일자 |
| ------ | ---- | ---- | ---- |
| 작성자 |      |      |      |
| 검토자 |      |      |      |
| 승인자 |      |      |      |
