# 개인정보 동의 관리 프로세스

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0.0 |
| 작성일 | 2026-01-12 |
| 상태 | 초안 |
| 관리자 | kcenon@naver.com |
| 표준 기준 | 개인정보보호법, 의료법 |

---

## 문서 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2026-01-12 | - | 초안 작성 (갭 분석 기반 신규) |

---

## 목차

1. [개요](#1-개요)
2. [법적 근거](#2-법적-근거)
3. [동의 유형](#3-동의-유형)
4. [동의 수집 프로세스](#4-동의-수집-프로세스)
5. [동의 관리 시스템](#5-동의-관리-시스템)
6. [동의 철회 처리](#6-동의-철회-처리)
7. [미성년자 및 법정대리인](#7-미성년자-및-법정대리인)
8. [동의 이력 관리](#8-동의-이력-관리)
9. [기술 구현](#9-기술-구현)
10. [감사 및 준수 확인](#10-감사-및-준수-확인)

---

## 1. 개요

### 1.1 목적

본 문서는 입원환자 관리 ERP 시스템의 **개인정보 동의 관리 프로세스**를 정의합니다. 의료 정보는 민감정보에 해당하므로, 명확한 동의 수집 및 관리 체계가 필수입니다.

### 1.2 적용 범위

```
동의 관리 대상
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 환자 개인정보 수집 및 이용 동의
2. 민감정보(건강정보) 처리 동의
3. 제3자 제공 동의 (보험사, 연구기관 등)
4. 개인정보 국외 이전 동의 (해당 시)
5. 마케팅 및 광고성 정보 수신 동의
6. 선택적 서비스 이용 동의
```

### 1.3 추적성 참조

| 관련 요구사항 | 문서 |
|--------------|------|
| REQ-NFR-SEC-002 | SRS.kr.md - 개인정보보호 요구사항 |
| SEC-008 | security-requirements.kr.md - 동의 관리 |
| REQ-FR-001 | SRS.kr.md - 환자 등록 |

---

## 2. 법적 근거

### 2.1 개인정보보호법

| 조항 | 내용 | 시스템 적용 |
|------|------|------------|
| 제15조 | 개인정보 수집·이용 동의 | 필수 동의 항목 정의 |
| 제17조 | 제3자 제공 동의 | 별도 동의 필요 |
| 제22조 | 동의 받는 방법 | 서면/전자 동의 UI |
| 제23조 | 민감정보 처리 제한 | 건강정보 별도 동의 |
| 제37조 | 처리정지권 | 동의 철회 기능 |

### 2.2 의료법

| 조항 | 내용 | 시스템 적용 |
|------|------|------------|
| 제19조 | 정보 누설 금지 | 접근 권한 관리 |
| 제21조 | 기록 열람 | 환자 조회 기능 |
| 제21조의2 | 전자의무기록 | 전자 동의 효력 |

### 2.3 동의의 유효성 요건

```
유효한 동의의 요건
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 명확성: 동의 내용이 명확하게 표시
2. 구체성: 수집 목적, 항목, 보유기간 명시
3. 자발성: 강제 없이 자유의사로 동의
4. 분리성: 필수/선택 항목 구분
5. 철회가능성: 언제든 동의 철회 가능
6. 인지가능성: 동의 내용 쉽게 인식
```

---

## 3. 동의 유형

### 3.1 동의 유형 분류

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Consent Type Classification                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      필수 동의 (Mandatory)                    │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  ✓ 진료 목적 개인정보 수집·이용                              │    │
│  │  ✓ 건강정보(민감정보) 처리                                   │    │
│  │  ✓ 진료비 청구를 위한 국민건강보험공단 제공                   │    │
│  │  ✓ 법령에 의한 의무적 정보 제공                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      선택 동의 (Optional)                     │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  ☐ 보험사 진료비 청구 대행                                   │    │
│  │  ☐ 의료 연구 목적 정보 제공                                  │    │
│  │  ☐ 만족도 조사 및 서비스 개선                                │    │
│  │  ☐ 건강 정보 및 프로모션 수신                                │    │
│  │  ☐ 제3자 마케팅 제공                                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 상세 동의 항목

#### 3.2.1 필수 동의

| ID | 동의 항목 | 수집 항목 | 이용 목적 | 보유 기간 |
|----|----------|----------|----------|----------|
| CONSENT-M01 | 진료 목적 개인정보 | 성명, 주민번호, 연락처, 주소 | 진료, 처방, 수납 | 진료 종료 후 10년 |
| CONSENT-M02 | 건강정보 처리 | 진단명, 검사결과, 처방내역, 바이탈 | 진료, 치료 | 진료 종료 후 10년 |
| CONSENT-M03 | 건강보험공단 제공 | 진료내역, 처방내역 | 진료비 청구 | 청구 완료 후 5년 |
| CONSENT-M04 | 법정 의무 제공 | 전염병 정보, 진료기록 | 법령 준수 | 법령에 따름 |

#### 3.2.2 선택 동의

| ID | 동의 항목 | 수집 항목 | 이용 목적 | 보유 기간 |
|----|----------|----------|----------|----------|
| CONSENT-O01 | 보험사 제공 | 진료내역, 진단서 | 실손보험 청구 대행 | 동의 철회 시까지 |
| CONSENT-O02 | 의료 연구 | 비식별화된 진료 데이터 | 의학 연구 | 연구 종료 시까지 |
| CONSENT-O03 | 만족도 조사 | 연락처, 입원 내역 | 서비스 개선 | 1년 |
| CONSENT-O04 | 건강 정보 수신 | 이메일, 전화번호 | 건강정보, 프로모션 | 동의 철회 시까지 |
| CONSENT-O05 | 제3자 마케팅 | 성명, 연락처 | 협력사 마케팅 | 동의 철회 시까지 |

---

## 4. 동의 수집 프로세스

### 4.1 입원 시 동의 수집 플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Consent Collection Workflow                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    ┌───────────┐                                                    │
│    │ 입원 접수 │                                                    │
│    └─────┬─────┘                                                    │
│          │                                                          │
│          ▼                                                          │
│    ┌───────────────────────────────────────┐                       │
│    │ 기존 동의 내역 확인                     │                       │
│    │ (이전 입원 시 동의 여부)                │                       │
│    └─────────────────┬─────────────────────┘                       │
│                      │                                              │
│          ┌───────────┴───────────┐                                 │
│          │                       │                                  │
│          ▼                       ▼                                  │
│    신규 환자               기존 환자                                 │
│    (전체 동의 필요)        (변경 사항만)                             │
│          │                       │                                  │
│          └───────────┬───────────┘                                 │
│                      │                                              │
│                      ▼                                              │
│    ┌───────────────────────────────────────┐                       │
│    │ 동의서 화면 표시                        │                       │
│    │ - 필수/선택 항목 구분                   │                       │
│    │ - 항목별 상세 설명 제공                 │                       │
│    │ - 전문 보기 기능                        │                       │
│    └─────────────────┬─────────────────────┘                       │
│                      │                                              │
│                      ▼                                              │
│    ┌───────────────────────────────────────┐                       │
│    │ 동의 방식 선택                          │                       │
│    │ ○ 전자서명 (태블릿)                    │                       │
│    │ ○ 서면 서명 (스캔 후 저장)             │                       │
│    │ ○ ARS 동의 (통화 녹음)                 │                       │
│    └─────────────────┬─────────────────────┘                       │
│                      │                                              │
│                      ▼                                              │
│    ┌───────────────────────────────────────┐                       │
│    │ 동의 검증                               │                       │
│    │ - 필수 항목 체크                        │                       │
│    │ - 서명/인증 확인                        │                       │
│    │ - 법정대리인 필요 여부 확인             │                       │
│    └─────────────────┬─────────────────────┘                       │
│                      │                                              │
│                      ▼                                              │
│    ┌───────────────────────────────────────┐                       │
│    │ 동의 저장 및 증빙                       │                       │
│    │ - 동의 이력 DB 저장                     │                       │
│    │ - 동의서 사본 제공 (이메일/출력)        │                       │
│    │ - 감사 로그 기록                        │                       │
│    └───────────────────────────────────────┘                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 동의서 UI 설계

```typescript
// consent-form-ui.tsx
interface ConsentFormProps {
  patient: Patient;
  consentItems: ConsentItem[];
  onSubmit: (consents: ConsentDecision[]) => Promise<void>;
}

export function ConsentForm({ patient, consentItems, onSubmit }: ConsentFormProps) {
  const [decisions, setDecisions] = useState<Map<string, boolean>>(new Map());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // 필수 항목과 선택 항목 분리
  const mandatoryItems = consentItems.filter(item => item.mandatory);
  const optionalItems = consentItems.filter(item => !item.mandatory);

  // 필수 항목 모두 동의 여부 확인
  const allMandatoryAccepted = mandatoryItems.every(
    item => decisions.get(item.id) === true
  );

  return (
    <div className="consent-form">
      {/* 필수 동의 항목 */}
      <section className="mandatory-consents">
        <h2>
          필수 동의 항목
          <Badge variant="destructive">필수</Badge>
        </h2>
        <p className="text-muted">
          다음 항목은 진료 서비스 제공을 위해 반드시 동의가 필요합니다.
        </p>

        {mandatoryItems.map(item => (
          <ConsentItemCard
            key={item.id}
            item={item}
            checked={decisions.get(item.id) ?? false}
            expanded={expandedItems.has(item.id)}
            onToggle={(checked) => setDecisions(prev => new Map(prev).set(item.id, checked))}
            onExpand={() => toggleExpanded(item.id)}
          />
        ))}

        {/* 전체 동의 버튼 */}
        <Button
          variant="outline"
          onClick={() => acceptAllMandatory()}
        >
          필수 항목 전체 동의
        </Button>
      </section>

      {/* 선택 동의 항목 */}
      <section className="optional-consents">
        <h2>
          선택 동의 항목
          <Badge variant="secondary">선택</Badge>
        </h2>
        <p className="text-muted">
          다음 항목에 동의하지 않아도 기본 진료 서비스를 받으실 수 있습니다.
        </p>

        {optionalItems.map(item => (
          <ConsentItemCard
            key={item.id}
            item={item}
            checked={decisions.get(item.id) ?? false}
            expanded={expandedItems.has(item.id)}
            onToggle={(checked) => setDecisions(prev => new Map(prev).set(item.id, checked))}
            onExpand={() => toggleExpanded(item.id)}
          />
        ))}
      </section>

      {/* 전자 서명 */}
      <section className="signature">
        <h2>서명</h2>
        <SignaturePad
          onSign={setSignatureData}
          width={400}
          height={150}
        />
        <p className="text-muted">
          위 내용을 충분히 이해하였으며, 본인의 자유로운 의사에 따라 동의합니다.
        </p>
      </section>

      {/* 제출 버튼 */}
      <Button
        disabled={!allMandatoryAccepted || !signatureData}
        onClick={() => handleSubmit()}
      >
        동의 완료
      </Button>
    </div>
  );
}

// 개별 동의 항목 카드
function ConsentItemCard({
  item,
  checked,
  expanded,
  onToggle,
  onExpand
}: ConsentItemCardProps) {
  return (
    <Card className={cn('consent-item', checked && 'checked')}>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Checkbox
            id={item.id}
            checked={checked}
            onCheckedChange={onToggle}
          />
          <label htmlFor={item.id} className="flex-1">
            <h3>{item.title}</h3>
            <p className="text-sm text-muted">{item.summary}</p>
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpand}
          >
            {expanded ? '접기' : '상세보기'}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          <ConsentDetails item={item} />
        </CardContent>
      )}
    </Card>
  );
}

// 동의 상세 내용
function ConsentDetails({ item }: { item: ConsentItem }) {
  return (
    <div className="consent-details">
      <table>
        <tbody>
          <tr>
            <th>수집 항목</th>
            <td>{item.collectedItems.join(', ')}</td>
          </tr>
          <tr>
            <th>수집 목적</th>
            <td>{item.purpose}</td>
          </tr>
          <tr>
            <th>보유 기간</th>
            <td>{item.retentionPeriod}</td>
          </tr>
          {item.thirdParty && (
            <tr>
              <th>제공받는 자</th>
              <td>{item.thirdParty.recipient}</td>
            </tr>
          )}
        </tbody>
      </table>

      <Accordion type="single" collapsible>
        <AccordionItem value="full-text">
          <AccordionTrigger>전문 보기</AccordionTrigger>
          <AccordionContent>
            <div
              className="legal-text"
              dangerouslySetInnerHTML={{ __html: item.fullText }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
```

### 4.3 동의 수집 규칙

| 규칙 | 설명 |
|------|------|
| 분리 동의 | 필수/선택 항목 별도 체크박스 |
| 기본값 해제 | 체크박스 기본값은 미선택 |
| 명확한 표시 | 선택 동의 항목임을 명확히 표시 |
| 상세 설명 | 각 항목별 수집/이용 내용 상세 설명 |
| 전문 제공 | 동의서 전문 열람 기능 |
| 사본 제공 | 동의 완료 후 사본 제공 |

---

## 5. 동의 관리 시스템

### 5.1 데이터 모델

```sql
-- 동의 유형 테이블
CREATE TABLE consent.consent_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('MANDATORY', 'OPTIONAL')),
    collected_items TEXT[] NOT NULL,
    purpose TEXT NOT NULL,
    retention_period VARCHAR(100) NOT NULL,
    third_party_recipient VARCHAR(200),
    legal_basis VARCHAR(200),
    full_text TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 동의 기록 테이블
CREATE TABLE consent.consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient.patients(id),
    consent_type_id UUID NOT NULL REFERENCES consent.consent_types(id),
    consent_version INTEGER NOT NULL,
    decision BOOLEAN NOT NULL,
    collected_by UUID REFERENCES auth.users(id),
    collection_method VARCHAR(20) NOT NULL
      CHECK (collection_method IN ('ELECTRONIC', 'PAPER', 'ARS', 'VERBAL')),
    signature_data TEXT,
    paper_document_url TEXT,
    recording_url TEXT,
    ip_address INET,
    user_agent TEXT,
    consent_given_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    withdrawn_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 제약조건
    CONSTRAINT valid_consent_evidence CHECK (
        (collection_method = 'ELECTRONIC' AND signature_data IS NOT NULL) OR
        (collection_method = 'PAPER' AND paper_document_url IS NOT NULL) OR
        (collection_method = 'ARS' AND recording_url IS NOT NULL) OR
        (collection_method = 'VERBAL')
    )
);

-- 동의 변경 이력 테이블
CREATE TABLE consent.consent_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_record_id UUID NOT NULL REFERENCES consent.consent_records(id),
    action VARCHAR(20) NOT NULL CHECK (action IN ('GRANTED', 'WITHDRAWN', 'RENEWED')),
    previous_decision BOOLEAN,
    new_decision BOOLEAN NOT NULL,
    reason TEXT,
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- 인덱스
CREATE INDEX idx_consent_records_patient ON consent.consent_records(patient_id);
CREATE INDEX idx_consent_records_active ON consent.consent_records(patient_id, consent_type_id)
  WHERE is_active = TRUE;
CREATE INDEX idx_consent_history_record ON consent.consent_history(consent_record_id);
```

### 5.2 동의 서비스

```typescript
// consent-service.ts
@Injectable()
export class ConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService
  ) {}

  // 환자의 현재 동의 상태 조회
  async getPatientConsents(patientId: string): Promise<PatientConsent[]> {
    const consents = await this.prisma.consentRecord.findMany({
      where: {
        patientId,
        isActive: true
      },
      include: {
        consentType: true
      },
      orderBy: {
        consentType: { category: 'asc' }
      }
    });

    // 동의하지 않은 항목도 포함 (선택 항목)
    const allTypes = await this.prisma.consentType.findMany({
      where: { isActive: true }
    });

    return allTypes.map(type => {
      const record = consents.find(c => c.consentTypeId === type.id);
      return {
        consentType: type,
        record,
        decision: record?.decision ?? null,
        consentedAt: record?.consentGivenAt ?? null
      };
    });
  }

  // 동의 수집
  async collectConsent(
    input: CollectConsentInput
  ): Promise<ConsentRecord[]> {
    const results: ConsentRecord[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const decision of input.decisions) {
        // 기존 동의 비활성화
        await tx.consentRecord.updateMany({
          where: {
            patientId: input.patientId,
            consentTypeId: decision.consentTypeId,
            isActive: true
          },
          data: { isActive: false }
        });

        // 새 동의 기록 생성
        const record = await tx.consentRecord.create({
          data: {
            patientId: input.patientId,
            consentTypeId: decision.consentTypeId,
            consentVersion: decision.version,
            decision: decision.accepted,
            collectedBy: input.collectedBy,
            collectionMethod: input.method,
            signatureData: input.signatureData,
            paperDocumentUrl: input.paperDocumentUrl,
            recordingUrl: input.recordingUrl,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            consentGivenAt: new Date()
          }
        });

        // 이력 기록
        await tx.consentHistory.create({
          data: {
            consentRecordId: record.id,
            action: 'GRANTED',
            newDecision: decision.accepted,
            performedBy: input.collectedBy
          }
        });

        results.push(record);
      }
    });

    // 감사 로그
    await this.auditService.log({
      action: 'CONSENT_COLLECTED',
      entityType: 'patient',
      entityId: input.patientId,
      details: {
        consentCount: results.length,
        method: input.method
      }
    });

    // 동의 사본 이메일 발송
    if (input.sendCopy && input.patientEmail) {
      await this.sendConsentCopy(input.patientId, input.patientEmail);
    }

    return results;
  }

  // 동의 여부 확인
  async hasConsent(
    patientId: string,
    consentTypeCode: string
  ): Promise<boolean> {
    const record = await this.prisma.consentRecord.findFirst({
      where: {
        patientId,
        consentType: { code: consentTypeCode },
        isActive: true,
        decision: true
      }
    });

    return !!record;
  }

  // 특정 작업에 필요한 동의 확인
  async validateConsentsForAction(
    patientId: string,
    action: ConsentableAction
  ): Promise<ConsentValidationResult> {
    const requiredConsents = CONSENT_REQUIREMENTS[action];

    const patientConsents = await this.getPatientConsents(patientId);

    const missing: ConsentType[] = [];
    const valid: ConsentType[] = [];

    for (const required of requiredConsents) {
      const consent = patientConsents.find(
        c => c.consentType.code === required.code
      );

      if (!consent?.decision) {
        if (required.mandatory) {
          missing.push(consent?.consentType);
        }
      } else {
        valid.push(consent.consentType);
      }
    }

    return {
      isValid: missing.length === 0,
      validConsents: valid,
      missingConsents: missing,
      action
    };
  }

  // 동의 사본 발송
  private async sendConsentCopy(
    patientId: string,
    email: string
  ): Promise<void> {
    const consents = await this.getPatientConsents(patientId);
    const acceptedConsents = consents.filter(c => c.decision);

    const pdf = await this.generateConsentPDF(acceptedConsents);

    await this.notificationService.sendEmail({
      to: email,
      subject: '[병원명] 개인정보 처리 동의서 사본',
      template: 'consent-copy',
      attachments: [
        {
          filename: `동의서_${formatDate(new Date())}.pdf`,
          content: pdf
        }
      ]
    });
  }
}

// 동의 필요 작업 정의
const CONSENT_REQUIREMENTS: Record<ConsentableAction, ConsentRequirement[]> = {
  'VIEW_PATIENT_RECORD': [
    { code: 'CONSENT-M01', mandatory: true },
    { code: 'CONSENT-M02', mandatory: true }
  ],
  'INSURANCE_CLAIM': [
    { code: 'CONSENT-O01', mandatory: true }
  ],
  'RESEARCH_DATA_EXPORT': [
    { code: 'CONSENT-O02', mandatory: true }
  ],
  'SEND_MARKETING': [
    { code: 'CONSENT-O04', mandatory: true }
  ]
};
```

---

## 6. 동의 철회 처리

### 6.1 철회 워크플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Consent Withdrawal Workflow                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    ┌───────────────────┐                                            │
│    │ 철회 요청 접수     │ ◀── 온라인 / 서면 / 전화                  │
│    └─────────┬─────────┘                                            │
│              │                                                       │
│              ▼                                                       │
│    ┌───────────────────┐                                            │
│    │ 본인 확인         │                                            │
│    │ - 신분증 확인     │                                            │
│    │ - 본인인증        │                                            │
│    └─────────┬─────────┘                                            │
│              │                                                       │
│              ▼                                                       │
│    ┌───────────────────┐                                            │
│    │ 철회 가능 여부    │                                            │
│    │ 검토              │                                            │
│    └─────────┬─────────┘                                            │
│              │                                                       │
│       ┌──────┴──────┐                                               │
│       │             │                                                │
│       ▼             ▼                                                │
│    필수 동의      선택 동의                                          │
│    (제한적 철회)  (즉시 철회)                                        │
│       │             │                                                │
│       ▼             │                                                │
│  ┌────────────┐     │                                               │
│  │ 법적 의무  │     │                                               │
│  │ 보존 안내  │     │                                               │
│  └─────┬──────┘     │                                               │
│        │            │                                                │
│        └──────┬─────┘                                               │
│               │                                                      │
│               ▼                                                      │
│    ┌───────────────────┐                                            │
│    │ 철회 처리         │                                            │
│    │ - 동의 상태 변경  │                                            │
│    │ - 관련 처리 중단  │                                            │
│    │ - 데이터 처리     │                                            │
│    └─────────┬─────────┘                                            │
│              │                                                       │
│              ▼                                                       │
│    ┌───────────────────┐                                            │
│    │ 철회 완료 통지    │                                            │
│    │ - 처리 결과 안내  │                                            │
│    │ - 영향 범위 안내  │                                            │
│    └───────────────────┘                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 철회 처리 서비스

```typescript
// consent-withdrawal-service.ts
@Injectable()
export class ConsentWithdrawalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly dataService: DataProcessingService
  ) {}

  // 동의 철회 요청 처리
  async withdrawConsent(
    input: WithdrawConsentInput
  ): Promise<WithdrawalResult> {
    // 1. 동의 기록 조회
    const consentRecord = await this.prisma.consentRecord.findFirst({
      where: {
        patientId: input.patientId,
        consentTypeId: input.consentTypeId,
        isActive: true,
        decision: true
      },
      include: { consentType: true }
    });

    if (!consentRecord) {
      throw new ConsentNotFoundError(input.patientId, input.consentTypeId);
    }

    // 2. 철회 가능 여부 확인
    const validation = await this.validateWithdrawal(consentRecord);

    if (!validation.canWithdraw) {
      return {
        success: false,
        reason: validation.reason,
        alternativeAction: validation.alternative
      };
    }

    // 3. 필수 동의 철회 시 영향 안내
    if (consentRecord.consentType.category === 'MANDATORY') {
      const impacts = await this.getWithdrawalImpacts(consentRecord.consentType);

      // 사용자 확인 필요
      if (!input.acknowledgedImpacts) {
        return {
          success: false,
          requiresAcknowledgement: true,
          impacts
        };
      }
    }

    // 4. 철회 처리
    await this.prisma.$transaction(async (tx) => {
      // 동의 상태 변경
      await tx.consentRecord.update({
        where: { id: consentRecord.id },
        data: {
          isActive: false,
          withdrawnAt: new Date(),
          withdrawnReason: input.reason
        }
      });

      // 이력 기록
      await tx.consentHistory.create({
        data: {
          consentRecordId: consentRecord.id,
          action: 'WITHDRAWN',
          previousDecision: true,
          newDecision: false,
          reason: input.reason,
          performedBy: input.requestedBy,
          metadata: {
            withdrawalMethod: input.method,
            ipAddress: input.ipAddress
          }
        }
      });
    });

    // 5. 관련 데이터 처리
    await this.handleDataAfterWithdrawal(consentRecord);

    // 6. 감사 로그
    await this.auditService.log({
      action: 'CONSENT_WITHDRAWN',
      entityType: 'consent',
      entityId: consentRecord.id,
      details: {
        consentType: consentRecord.consentType.code,
        reason: input.reason
      }
    });

    // 7. 철회 완료 통지
    await this.sendWithdrawalConfirmation(input.patientId, consentRecord.consentType);

    return {
      success: true,
      withdrawnAt: new Date(),
      impacts: await this.getWithdrawalImpacts(consentRecord.consentType)
    };
  }

  // 철회 가능 여부 검증
  private async validateWithdrawal(
    record: ConsentRecordWithType
  ): Promise<WithdrawalValidation> {
    const consentType = record.consentType;

    // 법적 의무 보존 동의는 철회 불가 (부분적)
    if (consentType.code === 'CONSENT-M04') {
      return {
        canWithdraw: false,
        reason: '법령에 의한 의무적 정보 제공 동의는 철회할 수 없습니다.',
        alternative: '진료 종료 후 법정 보존 기간 만료 시 자동 삭제됩니다.'
      };
    }

    // 진행 중인 보험 청구가 있는 경우
    if (consentType.code === 'CONSENT-O01') {
      const pendingClaims = await this.prisma.insuranceClaim.count({
        where: {
          patientId: record.patientId,
          status: { in: ['PENDING', 'PROCESSING'] }
        }
      });

      if (pendingClaims > 0) {
        return {
          canWithdraw: true,
          warning: '진행 중인 보험 청구 건이 있습니다. 철회 시 해당 청구가 중단됩니다.'
        };
      }
    }

    return { canWithdraw: true };
  }

  // 철회 후 데이터 처리
  private async handleDataAfterWithdrawal(
    record: ConsentRecordWithType
  ): Promise<void> {
    const consentType = record.consentType;

    switch (consentType.code) {
      case 'CONSENT-O01': // 보험사 제공
        await this.dataService.stopThirdPartySharing(
          record.patientId,
          'INSURANCE_COMPANY'
        );
        break;

      case 'CONSENT-O02': // 연구 목적
        await this.dataService.excludeFromResearch(record.patientId);
        break;

      case 'CONSENT-O04': // 마케팅 수신
        await this.dataService.unsubscribeMarketing(record.patientId);
        break;

      case 'CONSENT-O05': // 제3자 마케팅
        await this.dataService.stopThirdPartyMarketing(record.patientId);
        break;
    }
  }

  // 철회 영향 범위 조회
  private async getWithdrawalImpacts(
    consentType: ConsentType
  ): Promise<WithdrawalImpact[]> {
    const impacts: WithdrawalImpact[] = [];

    switch (consentType.code) {
      case 'CONSENT-M01': // 진료 개인정보
        impacts.push({
          area: '진료 서비스',
          description: '진료 예약 및 접수가 불가능합니다.',
          severity: 'critical'
        });
        break;

      case 'CONSENT-M03': // 건강보험공단
        impacts.push({
          area: '진료비 청구',
          description: '건강보험 적용이 불가능하여 진료비를 전액 부담해야 합니다.',
          severity: 'high'
        });
        break;

      case 'CONSENT-O01': // 보험사 제공
        impacts.push({
          area: '보험 청구',
          description: '실손보험 청구 대행 서비스를 이용할 수 없습니다.',
          severity: 'medium'
        });
        break;

      case 'CONSENT-O04': // 마케팅 수신
        impacts.push({
          area: '정보 수신',
          description: '건강 정보 및 프로모션 알림을 받을 수 없습니다.',
          severity: 'low'
        });
        break;
    }

    return impacts;
  }
}
```

---

## 7. 미성년자 및 법정대리인

### 7.1 동의권자 결정

```typescript
// consent-authority.ts
interface ConsentAuthority {
  patientId: string;
  patientAge: number;
  requiresLegalGuardian: boolean;
  guardianInfo?: LegalGuardian;
}

export function determineConsentAuthority(
  patient: Patient
): ConsentAuthority {
  const age = calculateAge(patient.birthDate);

  return {
    patientId: patient.id,
    patientAge: age,
    requiresLegalGuardian: age < 14, // 14세 미만
    guardianInfo: age < 14 ? patient.legalGuardian : undefined
  };
}

// 연령별 동의 요건
const AGE_CONSENT_RULES = {
  UNDER_14: {
    // 14세 미만: 법정대리인 단독 동의
    consentors: ['LEGAL_GUARDIAN'],
    description: '법정대리인의 동의가 필요합니다.'
  },
  UNDER_18: {
    // 14세 이상 18세 미만: 본인 + 법정대리인
    consentors: ['PATIENT', 'LEGAL_GUARDIAN'],
    description: '본인과 법정대리인 모두의 동의가 필요합니다.'
  },
  ADULT: {
    // 18세 이상: 본인 동의
    consentors: ['PATIENT'],
    description: '본인의 동의만 필요합니다.'
  }
};
```

### 7.2 법정대리인 동의 수집

```sql
-- 법정대리인 정보 테이블
CREATE TABLE consent.legal_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient.patients(id),
    guardian_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    resident_number_encrypted BYTEA,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    id_document_url TEXT,
    relationship_document_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 법정대리인 동의 기록
ALTER TABLE consent.consent_records
ADD COLUMN guardian_id UUID REFERENCES consent.legal_guardians(id),
ADD COLUMN guardian_signature_data TEXT,
ADD COLUMN patient_assent BOOLEAN; -- 14세 이상 미성년자의 동의
```

### 7.3 법정대리인 검증

```typescript
// guardian-verification-service.ts
@Injectable()
export class GuardianVerificationService {
  // 법정대리인 등록 및 검증
  async registerGuardian(
    input: RegisterGuardianInput
  ): Promise<LegalGuardian> {
    // 1. 관계 증빙 서류 검증
    const relationshipValid = await this.verifyRelationshipDocument(
      input.relationshipDocumentUrl,
      input.patientId,
      input.relationship
    );

    if (!relationshipValid) {
      throw new InvalidGuardianDocumentError();
    }

    // 2. 신분증 검증
    const idValid = await this.verifyIdDocument(input.idDocumentUrl);

    if (!idValid) {
      throw new InvalidIdDocumentError();
    }

    // 3. 법정대리인 등록
    const guardian = await this.prisma.legalGuardian.create({
      data: {
        patientId: input.patientId,
        guardianName: input.name,
        relationship: input.relationship,
        residentNumberEncrypted: await encrypt(input.residentNumber),
        phoneNumber: input.phoneNumber,
        email: input.email,
        idDocumentUrl: input.idDocumentUrl,
        relationshipDocumentUrl: input.relationshipDocumentUrl,
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: input.verifiedBy
      }
    });

    return guardian;
  }

  // 미성년자 동의 수집
  async collectMinorConsent(
    input: MinorConsentInput
  ): Promise<ConsentRecord[]> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: input.patientId }
    });

    const age = calculateAge(patient.birthDate);
    const guardian = await this.prisma.legalGuardian.findFirst({
      where: {
        patientId: input.patientId,
        verified: true
      }
    });

    if (age < 14 && !guardian) {
      throw new GuardianRequiredError();
    }

    // 14세 이상 18세 미만: 본인 동의(assent) + 법정대리인 동의
    if (age >= 14 && age < 18) {
      if (!input.patientAssent || !input.guardianConsent) {
        throw new DualConsentRequiredError();
      }
    }

    return this.consentService.collectConsent({
      ...input,
      guardianId: guardian?.id,
      guardianSignatureData: input.guardianSignatureData,
      patientAssent: input.patientAssent
    });
  }
}
```

---

## 8. 동의 이력 관리

### 8.1 이력 조회 API

```typescript
// consent-history-controller.ts
@Controller('api/consents')
export class ConsentController {
  @Get('patients/:patientId/history')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'COMPLIANCE_OFFICER')
  async getConsentHistory(
    @Param('patientId') patientId: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<ConsentHistoryResponse> {
    const history = await this.consentService.getConsentHistory(patientId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined
    });

    return {
      patientId,
      totalRecords: history.length,
      history: history.map(h => ({
        consentType: h.consentRecord.consentType.name,
        action: h.action,
        previousDecision: h.previousDecision,
        newDecision: h.newDecision,
        reason: h.reason,
        performedAt: h.performedAt,
        performedBy: h.performedBy?.name || 'SYSTEM'
      }))
    };
  }

  @Get('patients/:patientId/current')
  async getCurrentConsents(
    @Param('patientId') patientId: string
  ): Promise<CurrentConsentsResponse> {
    const consents = await this.consentService.getPatientConsents(patientId);

    return {
      patientId,
      consents: consents.map(c => ({
        id: c.consentType.id,
        code: c.consentType.code,
        name: c.consentType.name,
        category: c.consentType.category,
        decision: c.decision,
        consentedAt: c.consentedAt,
        version: c.record?.consentVersion
      }))
    };
  }
}
```

### 8.2 동의 현황 대시보드

```sql
-- 동의 현황 통계 뷰
CREATE VIEW consent.consent_statistics AS
SELECT
    ct.code,
    ct.name,
    ct.category,
    COUNT(*) FILTER (WHERE cr.decision = TRUE) AS accepted_count,
    COUNT(*) FILTER (WHERE cr.decision = FALSE) AS rejected_count,
    COUNT(*) FILTER (WHERE cr.decision IS NULL) AS pending_count,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE cr.decision = TRUE) /
        NULLIF(COUNT(*), 0), 2
    ) AS acceptance_rate
FROM consent.consent_types ct
LEFT JOIN consent.consent_records cr
    ON ct.id = cr.consent_type_id AND cr.is_active = TRUE
GROUP BY ct.id, ct.code, ct.name, ct.category
ORDER BY ct.category, ct.code;

-- 월별 동의/철회 추이
CREATE VIEW consent.consent_trends AS
SELECT
    DATE_TRUNC('month', ch.performed_at) AS month,
    ct.code AS consent_type,
    ch.action,
    COUNT(*) AS count
FROM consent.consent_history ch
JOIN consent.consent_records cr ON ch.consent_record_id = cr.id
JOIN consent.consent_types ct ON cr.consent_type_id = ct.id
WHERE ch.performed_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', ch.performed_at), ct.code, ch.action
ORDER BY month DESC, ct.code;
```

---

## 9. 기술 구현

### 9.1 동의 검증 미들웨어

```typescript
// consent-guard.ts
@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(
    private readonly consentService: ConsentService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredConsents = this.reflector.get<string[]>(
      'requiredConsents',
      context.getHandler()
    );

    if (!requiredConsents || requiredConsents.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const patientId = request.params.patientId || request.body.patientId;

    if (!patientId) {
      throw new BadRequestException('Patient ID is required');
    }

    for (const consentCode of requiredConsents) {
      const hasConsent = await this.consentService.hasConsent(patientId, consentCode);

      if (!hasConsent) {
        throw new ForbiddenException(
          `Required consent not found: ${consentCode}`
        );
      }
    }

    return true;
  }
}

// 데코레이터
export const RequireConsent = (...consentCodes: string[]) =>
  SetMetadata('requiredConsents', consentCodes);

// 사용 예시
@Controller('api/insurance')
export class InsuranceController {
  @Post('claims')
  @UseGuards(AuthGuard, ConsentGuard)
  @RequireConsent('CONSENT-O01')  // 보험사 제공 동의 필요
  async createClaim(@Body() dto: CreateClaimDto) {
    // 보험 청구 처리
  }
}
```

### 9.2 동의 버전 관리

```typescript
// consent-version-service.ts
@Injectable()
export class ConsentVersionService {
  // 동의서 버전 업데이트
  async updateConsentVersion(
    consentTypeId: string,
    newContent: UpdateConsentInput
  ): Promise<ConsentType> {
    const current = await this.prisma.consentType.findUnique({
      where: { id: consentTypeId }
    });

    // 새 버전 생성
    const updated = await this.prisma.consentType.update({
      where: { id: consentTypeId },
      data: {
        ...newContent,
        version: current.version + 1,
        updatedAt: new Date()
      }
    });

    // 이전 버전 동의자에게 재동의 필요 알림
    await this.notifyRenewalRequired(consentTypeId, current.version);

    return updated;
  }

  // 재동의 필요 환자 조회
  async getPatientsNeedingRenewal(
    consentTypeId: string
  ): Promise<Patient[]> {
    const currentType = await this.prisma.consentType.findUnique({
      where: { id: consentTypeId }
    });

    const outdatedRecords = await this.prisma.consentRecord.findMany({
      where: {
        consentTypeId,
        consentVersion: { lt: currentType.version },
        isActive: true,
        decision: true
      },
      include: { patient: true }
    });

    return outdatedRecords.map(r => r.patient);
  }

  // 재동의 요청 발송
  async requestRenewal(patientId: string, consentTypeId: string): Promise<void> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId }
    });

    const consentType = await this.prisma.consentType.findUnique({
      where: { id: consentTypeId }
    });

    await this.notificationService.send({
      userId: patient.userId,
      type: 'CONSENT_RENEWAL_REQUIRED',
      title: '개인정보 처리 동의 갱신 필요',
      body: `${consentType.name} 동의서가 변경되었습니다. 갱신이 필요합니다.`,
      data: {
        consentTypeId,
        action: 'RENEW_CONSENT'
      }
    });
  }
}
```

---

## 10. 감사 및 준수 확인

### 10.1 감사 항목

| 감사 항목 | 확인 내용 | 빈도 |
|----------|----------|------|
| 동의 수집 절차 | 필수/선택 분리, 기본값, 설명 제공 | 월간 |
| 동의 기록 무결성 | 변조 여부, 증빙 보존 | 분기 |
| 철회 처리 | 10일 이내 처리, 완료 통지 | 월간 |
| 미성년자 동의 | 법정대리인 확인, 이중 동의 | 분기 |
| 버전 관리 | 변경 이력, 재동의 처리 | 반기 |

### 10.2 준수 체크리스트

```typescript
// compliance-checker.ts
interface ComplianceCheckResult {
  category: string;
  item: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
}

async function runConsentComplianceCheck(): Promise<ComplianceCheckResult[]> {
  const results: ComplianceCheckResult[] = [];

  // 1. 동의 수집 UI 확인
  results.push(await checkConsentUICompliance());

  // 2. 동의 기록 완전성
  results.push(await checkConsentRecordCompleteness());

  // 3. 철회 처리 적시성
  results.push(await checkWithdrawalTimeliness());

  // 4. 미성년자 동의 적정성
  results.push(await checkMinorConsentCompliance());

  // 5. 동의서 버전 관리
  results.push(await checkVersionManagement());

  return results;
}

// 철회 처리 적시성 확인
async function checkWithdrawalTimeliness(): Promise<ComplianceCheckResult> {
  const overdue = await prisma.consentHistory.count({
    where: {
      action: 'WITHDRAWN',
      performedAt: {
        lt: subDays(new Date(), 10) // 10일 이전 요청
      },
      consentRecord: {
        isActive: true // 아직 처리 안 됨
      }
    }
  });

  return {
    category: '철회 처리',
    item: '10일 이내 처리',
    status: overdue > 0 ? 'FAIL' : 'PASS',
    details: overdue > 0
      ? `${overdue}건의 철회 요청이 10일을 초과했습니다.`
      : '모든 철회 요청이 적시에 처리되었습니다.'
  };
}
```

### 10.3 감사 보고서 생성

```typescript
// consent-audit-report.ts
@Injectable()
export class ConsentAuditReportService {
  async generateMonthlyReport(month: Date): Promise<AuditReport> {
    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);

    const report: AuditReport = {
      period: { from: startDate, to: endDate },
      generatedAt: new Date(),

      summary: {
        totalConsentsCollected: await this.countConsentsCollected(startDate, endDate),
        totalWithdrawals: await this.countWithdrawals(startDate, endDate),
        averageProcessingTime: await this.calcAverageProcessingTime(startDate, endDate)
      },

      byConsentType: await this.getStatsByConsentType(startDate, endDate),

      compliance: await runConsentComplianceCheck(),

      issues: await this.getComplianceIssues(startDate, endDate),

      recommendations: this.generateRecommendations()
    };

    // 보고서 저장
    await this.saveReport(report);

    return report;
  }
}
```

---

## 변경 이력

| 버전 | 일자 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-12 | 초안 작성 - 갭 분석 기반 신규 문서 |

---

> **관련 문서**
> - [SRS.kr.md](../../SRS.kr.md) - 요구사항 명세
> - [security-requirements.kr.md](security-requirements.kr.md) - 보안 요구사항
> - [data-retention-policy.kr.md](data-retention-policy.kr.md) - 데이터 보존 정책
