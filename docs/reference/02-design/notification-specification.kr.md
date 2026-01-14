# 알림 및 푸시 기능 상세 명세서

---

## 문서 정보

| 항목      | 내용             |
| --------- | ---------------- |
| 문서 버전 | 1.0.0            |
| 작성일    | 2026-01-12       |
| 상태      | 초안             |
| 관리자    | kcenon@naver.com |
| 표준 기준 | IEEE 830-1998    |

---

## 문서 이력

| 버전  | 일자       | 작성자 | 변경 내용                     |
| ----- | ---------- | ------ | ----------------------------- |
| 1.0.0 | 2026-01-12 | -      | 초안 작성 (갭 분석 기반 신규) |

---

## 목차

1. [개요](#1-개요)
2. [알림 채널](#2-알림-채널)
3. [알림 트리거 및 이벤트](#3-알림-트리거-및-이벤트)
4. [알림 메시지 템플릿](#4-알림-메시지-템플릿)
5. [재시도 정책](#5-재시도-정책)
6. [사용자 설정](#6-사용자-설정)
7. [기술 구현](#7-기술-구현)
8. [모니터링 및 분석](#8-모니터링-및-분석)

---

## 1. 개요

### 1.1 목적

본 문서는 입원환자 관리 ERP 시스템의 **알림 및 푸시 기능**에 대한 상세 명세를 정의합니다. 의료 환경에서 적시 알림은 환자 안전과 직결되므로, 신뢰성과 적시성이 핵심 품질 속성입니다.

### 1.2 범위

```
알림 시스템 범위
├── 범위 내 (In Scope)
│   ├── 실시간 푸시 알림 (WebSocket)
│   ├── PWA 푸시 알림 (Web Push API)
│   ├── SMS 알림 (긴급 알림)
│   ├── 이메일 알림 (비긴급)
│   └── 인앱 알림 (알림 센터)
│
└── 범위 외 (Out of Scope)
    ├── 카카오톡/LINE 메신저 연동
    ├── 음성 알림 (TTS)
    └── 팩스 알림
```

### 1.3 추적성 참조

| 관련 요구사항 | 문서                                             |
| ------------- | ------------------------------------------------ |
| REQ-FR-013    | SRS.kr.md - 알림 및 이상수치 경고                |
| REQ-NFR-002   | SRS.kr.md - 실시간 응답 요구사항                 |
| SEC-003       | security-requirements.kr.md - 민감정보 전송 보안 |

---

## 2. 알림 채널

### 2.1 채널 우선순위

```
알림 채널 우선순위 (높음 → 낮음)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. WebSocket 실시간 푸시 (최우선)
2. Web Push (PWA)
3. SMS (긴급)
4. 인앱 알림 센터
5. 이메일 (비긴급)
```

### 2.2 채널별 상세 명세

#### 2.2.1 WebSocket 실시간 푸시

| 속성              | 값                                                       |
| ----------------- | -------------------------------------------------------- |
| **프로토콜**      | WSS (TLS 1.3)                                            |
| **연결 유지**     | Heartbeat 30초                                           |
| **재연결 전략**   | Exponential Backoff (1s → 2s → 4s → 8s → 16s → 최대 30s) |
| **메시지 포맷**   | JSON                                                     |
| **최대 페이로드** | 64KB                                                     |
| **압축**          | per-message deflate                                      |

**이벤트 구조**:

```typescript
interface WebSocketNotification {
  id: string; // UUID v7
  type: NotificationType; // 알림 유형
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string; // ISO 8601
  payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    actions?: NotificationAction[];
  };
  metadata: {
    source: string; // 발생 모듈
    targetUserIds: string[]; // 대상 사용자
    patientId?: string; // 관련 환자
    roomId?: string; // 관련 병실
  };
}

type NotificationType =
  | 'VITAL_CRITICAL' // 바이탈 위험 수치
  | 'VITAL_WARNING' // 바이탈 주의 수치
  | 'ADMISSION_NEW' // 신규 입원
  | 'DISCHARGE_PENDING' // 퇴원 예정
  | 'TRANSFER_REQUEST' // 전실 요청
  | 'ROUNDING_REMINDER' // 회진 알림
  | 'LAB_RESULT_READY' // 검사 결과 도착
  | 'LAB_RESULT_CRITICAL' // 검사 결과 위험
  | 'SYSTEM_MAINTENANCE' // 시스템 점검
  | 'SECURITY_ALERT'; // 보안 경고
```

#### 2.2.2 Web Push (PWA)

| 속성           | 값                          |
| -------------- | --------------------------- |
| **표준**       | W3C Push API + VAPID        |
| **서비스워커** | 필수                        |
| **권한**       | 명시적 사용자 동의          |
| **TTL**        | 우선순위별 상이 (아래 참조) |
| **긴급도**     | high / normal / low         |

**TTL 정책**:
| 알림 유형 | TTL | 긴급도 |
|----------|-----|-------|
| 바이탈 위험 | 0 (즉시 만료) | high |
| 바이탈 주의 | 3600 (1시간) | high |
| 검사 결과 위험 | 0 | high |
| 일반 알림 | 86400 (24시간) | normal |
| 시스템 공지 | 604800 (7일) | low |

**페이로드 구조**:

```typescript
interface WebPushPayload {
  title: string;
  body: string;
  icon: string; // /icons/notification-192.png
  badge: string; // /icons/badge-72.png
  image?: string; // 선택적 이미지
  tag: string; // 중복 방지 태그
  renotify: boolean; // 동일 태그 재알림
  requireInteraction: boolean; // 사용자 상호작용 필수
  silent: boolean; // 무음 여부
  data: {
    url: string; // 클릭 시 이동 URL
    notificationId: string;
    timestamp: number;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}
```

#### 2.2.3 SMS 알림

| 속성          | 값                               |
| ------------- | -------------------------------- |
| **제공업체**  | AWS SNS / Twilio (선택)          |
| **문자 유형** | 긴급: 단문(SMS), 일반: 장문(LMS) |
| **최대 길이** | SMS: 90바이트 / LMS: 2000바이트  |
| **발신번호**  | 병원 대표번호 (사전 등록)        |
| **발송 시간** | 08:00 - 22:00 (긴급 제외)        |

**SMS 전용 이벤트**:

- 바이탈 위험 수치 (VITAL_CRITICAL)
- 검사 결과 위험 (LAB_RESULT_CRITICAL)
- 보안 경고 (SECURITY_ALERT) - 담당자만

#### 2.2.4 인앱 알림 센터

| 속성          | 값                            |
| ------------- | ----------------------------- |
| **저장 기간** | 30일                          |
| **최대 건수** | 사용자당 500건                |
| **정렬**      | 최신순 (timestamp DESC)       |
| **읽음 상태** | 개별 / 전체 읽음 처리         |
| **필터**      | 유형별, 우선순위별, 읽음 여부 |

**데이터 모델**:

```sql
CREATE TABLE notification.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    notification_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT valid_priority CHECK (priority IN ('critical', 'high', 'medium', 'low'))
);

CREATE INDEX idx_user_notifications_user_unread
    ON notification.user_notifications(user_id, is_read, created_at DESC)
    WHERE is_read = FALSE;
```

#### 2.2.5 이메일 알림

| 속성            | 값                 |
| --------------- | ------------------ |
| **제공업체**    | AWS SES            |
| **템플릿 엔진** | React Email / MJML |
| **전송 큐**     | Redis + Bull Queue |
| **Rate Limit**  | 시간당 1000건      |
| **바운스 처리** | SNS 콜백           |

**이메일 전용 이벤트**:

- 일간/주간 리포트 요약
- 시스템 점검 예고
- 계정 관련 알림 (비밀번호 변경, 세션 만료)
- 규정 준수 알림

---

## 3. 알림 트리거 및 이벤트

### 3.1 바이탈 사인 알림

#### 3.1.1 임계치 정의

| 바이탈          | 위험(Critical)         | 주의(Warning)          | 정상 범위      |
| --------------- | ---------------------- | ---------------------- | -------------- |
| **체온**        | < 35.0°C 또는 > 40.0°C | < 36.0°C 또는 > 38.5°C | 36.0 - 37.5°C  |
| **수축기 혈압** | < 80 또는 > 200 mmHg   | < 90 또는 > 160 mmHg   | 90 - 140 mmHg  |
| **이완기 혈압** | < 40 또는 > 120 mmHg   | < 50 또는 > 100 mmHg   | 60 - 90 mmHg   |
| **맥박**        | < 40 또는 > 150 bpm    | < 50 또는 > 120 bpm    | 60 - 100 bpm   |
| **호흡수**      | < 8 또는 > 35 /min     | < 10 또는 > 25 /min    | 12 - 20 /min   |
| **산소포화도**  | < 88%                  | < 92%                  | ≥ 95%          |
| **혈당**        | < 50 또는 > 500 mg/dL  | < 70 또는 > 300 mg/dL  | 70 - 140 mg/dL |

#### 3.1.2 알림 로직

```typescript
async function checkVitalAlert(vital: VitalRecord): Promise<AlertDecision> {
  const thresholds = await getPatientThresholds(vital.patientId);
  const alerts: Alert[] = [];

  // 체온 체크
  if (vital.temperature) {
    if (
      vital.temperature < thresholds.temp.criticalLow ||
      vital.temperature > thresholds.temp.criticalHigh
    ) {
      alerts.push({
        type: 'VITAL_CRITICAL',
        metric: 'temperature',
        value: vital.temperature,
        threshold: thresholds.temp,
      });
    } else if (
      vital.temperature < thresholds.temp.warningLow ||
      vital.temperature > thresholds.temp.warningHigh
    ) {
      alerts.push({
        type: 'VITAL_WARNING',
        metric: 'temperature',
        value: vital.temperature,
        threshold: thresholds.temp,
      });
    }
  }

  // 중복 알림 방지 (동일 환자, 동일 지표, 30분 내)
  const recentAlerts = await getRecentAlerts(vital.patientId, 30 * 60 * 1000);
  const filteredAlerts = alerts.filter(
    (alert) =>
      !recentAlerts.some((recent) => recent.metric === alert.metric && recent.type === alert.type),
  );

  return { alerts: filteredAlerts, shouldNotify: filteredAlerts.length > 0 };
}
```

#### 3.1.3 알림 대상자 결정

```typescript
async function determineRecipients(alert: Alert, patient: Patient): Promise<User[]> {
  const recipients: User[] = [];

  // 1. 담당 간호사 (항상)
  const assignedNurse = await getAssignedNurse(patient.roomId);
  if (assignedNurse) recipients.push(assignedNurse);

  // 2. 병동 수간호사 (Critical 또는 Warning)
  if (alert.type === 'VITAL_CRITICAL' || alert.type === 'VITAL_WARNING') {
    const headNurse = await getHeadNurse(patient.wardId);
    if (headNurse) recipients.push(headNurse);
  }

  // 3. 담당 의사 (Critical만)
  if (alert.type === 'VITAL_CRITICAL') {
    const attendingDoctor = await getAttendingDoctor(patient.id);
    if (attendingDoctor) recipients.push(attendingDoctor);
  }

  return [...new Set(recipients)]; // 중복 제거
}
```

### 3.2 입퇴원 알림

| 이벤트    | 트리거            | 알림 대상                  | 채널            |
| --------- | ----------------- | -------------------------- | --------------- |
| 신규 입원 | 입원 확정 시      | 담당 병동 간호사, 수간호사 | WebSocket, 인앱 |
| 입원 예정 | 입원 30분 전      | 담당 간호사                | WebSocket, 인앱 |
| 퇴원 예정 | 퇴원 확정 시      | 담당 간호사, 원무과        | WebSocket, 인앱 |
| 퇴원 완료 | 퇴원 처리 시      | 해당 병실 담당자           | WebSocket, 인앱 |
| 전실 요청 | 전실 요청 생성 시 | 양쪽 병동 수간호사         | WebSocket, 인앱 |
| 전실 완료 | 전실 처리 완료 시 | 관련 모든 담당자           | WebSocket, 인앱 |

### 3.3 회진 및 라운딩 알림

| 이벤트           | 트리거         | 알림 대상        | 채널            |
| ---------------- | -------------- | ---------------- | --------------- |
| 회진 시작 예정   | 회진 15분 전   | 담당 간호사      | WebSocket, Push |
| 회진 시작        | 의사 체크인 시 | 해당 병동 간호사 | WebSocket       |
| 회진 메모 작성됨 | 메모 저장 시   | 담당 간호사      | 인앱            |
| 회진 완료        | 회진 종료 시   | 수간호사         | 인앱            |

### 3.4 검사 결과 알림

| 이벤트           | 트리거         | 알림 대상                   | 채널                 |
| ---------------- | -------------- | --------------------------- | -------------------- |
| 검사 결과 도착   | LIS 연동 수신  | 담당 의사, 간호사           | WebSocket, 인앱      |
| 위험 수치 검출   | 자동 분석      | 담당 의사, 간호사, 수간호사 | WebSocket, Push, SMS |
| 검사 결과 확인됨 | 의사 확인 서명 | 담당 간호사                 | 인앱                 |

### 3.5 시스템 알림

| 이벤트         | 트리거                   | 알림 대상           | 채널         |
| -------------- | ------------------------ | ------------------- | ------------ |
| 점검 예고      | 점검 24시간 전, 1시간 전 | 전체 사용자         | 인앱, 이메일 |
| 점검 시작      | 점검 시작 시             | 접속 중 사용자      | WebSocket    |
| 점검 완료      | 점검 종료 시             | 전체 사용자         | 인앱         |
| 세션 만료 경고 | 만료 5분 전              | 해당 사용자         | WebSocket    |
| 보안 경고      | 이상 접속 감지           | 관리자, 해당 사용자 | Push, SMS    |

---

## 4. 알림 메시지 템플릿

### 4.1 템플릿 관리

모든 알림 메시지는 중앙 집중식 템플릿으로 관리됩니다.

```typescript
// notification-templates.ts
export const NotificationTemplates = {
  VITAL_CRITICAL: {
    title: '[긴급] 바이탈 위험 수치 감지',
    body: '{{patientName}} ({{roomNumber}}) 환자의 {{metric}}이(가) {{value}}으로 위험 수준입니다. 즉시 확인이 필요합니다.',
    shortBody: '{{roomNumber}} {{patientName}}: {{metric}} {{value}} 위험',
    sms: '[긴급] {{roomNumber}} {{patientName}} {{metric}} {{value}} 위험 - 즉시 확인 요망',
  },

  VITAL_WARNING: {
    title: '[주의] 바이탈 주의 수치',
    body: '{{patientName}} ({{roomNumber}}) 환자의 {{metric}}이(가) {{value}}입니다. 확인이 필요합니다.',
    shortBody: '{{roomNumber}} {{patientName}}: {{metric}} {{value}} 주의',
  },

  ADMISSION_NEW: {
    title: '신규 입원 환자',
    body: '{{roomNumber}}호에 {{patientName}} 환자가 입원하였습니다. 입원 사유: {{admissionReason}}',
    shortBody: '{{roomNumber}}호 {{patientName}} 입원',
  },

  DISCHARGE_PENDING: {
    title: '퇴원 예정 환자',
    body: '{{patientName}} ({{roomNumber}}) 환자가 {{expectedDate}}에 퇴원 예정입니다.',
    shortBody: '{{roomNumber}} {{patientName}} {{expectedDate}} 퇴원예정',
  },

  ROUNDING_REMINDER: {
    title: '회진 시작 예정',
    body: '{{wardName}} 병동 회진이 15분 후 시작됩니다. 담당 의사: {{doctorName}}',
    shortBody: '{{wardName}} 회진 15분 후 시작',
  },

  LAB_RESULT_READY: {
    title: '검사 결과 도착',
    body: '{{patientName}} ({{roomNumber}}) 환자의 {{testType}} 검사 결과가 도착했습니다.',
    shortBody: '{{roomNumber}} {{patientName}} {{testType}} 결과 도착',
  },

  LAB_RESULT_CRITICAL: {
    title: '[긴급] 검사 결과 위험',
    body: '{{patientName}} ({{roomNumber}}) 환자의 {{testType}} 검사에서 위험 수치가 감지되었습니다. {{details}}',
    sms: '[긴급] {{roomNumber}} {{patientName}} {{testType}} 위험수치 - 즉시 확인 요망',
  },
};
```

### 4.2 다국어 지원

```typescript
// i18n/notifications/ko.json
{
  "vital_critical_title": "[긴급] 바이탈 위험 수치 감지",
  "vital_critical_body": "{{patientName}} ({{roomNumber}}) 환자의 {{metric}}이(가) {{value}}으로 위험 수준입니다.",
  "metrics": {
    "temperature": "체온",
    "blood_pressure_systolic": "수축기 혈압",
    "blood_pressure_diastolic": "이완기 혈압",
    "pulse": "맥박",
    "respiration": "호흡수",
    "spo2": "산소포화도",
    "blood_sugar": "혈당"
  }
}
```

---

## 5. 재시도 정책

### 5.1 채널별 재시도 설정

| 채널      | 최대 재시도 | 초기 대기 | 백오프 전략      | 최대 대기 |
| --------- | ----------- | --------- | ---------------- | --------- |
| WebSocket | 무제한      | 1초       | Exponential (x2) | 30초      |
| Web Push  | 3회         | 5초       | Exponential (x2) | 60초      |
| SMS       | 3회         | 30초      | Linear (+30초)   | 120초     |
| 이메일    | 5회         | 60초      | Exponential (x2) | 3600초    |

### 5.2 재시도 로직

```typescript
interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

const retryPolicies: Record<Channel, RetryPolicy> = {
  WEBSOCKET: {
    maxRetries: Infinity,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: ['CONNECTION_LOST', 'TIMEOUT'],
  },
  WEB_PUSH: {
    maxRetries: 3,
    initialDelayMs: 5000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
    retryableErrors: ['SUBSCRIPTION_EXPIRED', 'TEMPORARY_FAILURE'],
  },
  SMS: {
    maxRetries: 3,
    initialDelayMs: 30000,
    maxDelayMs: 120000,
    backoffMultiplier: 1,
    retryableErrors: ['RATE_LIMITED', 'PROVIDER_UNAVAILABLE'],
  },
  EMAIL: {
    maxRetries: 5,
    initialDelayMs: 60000,
    maxDelayMs: 3600000,
    backoffMultiplier: 2,
    retryableErrors: ['RATE_LIMITED', 'TEMPORARY_FAILURE', 'MAILBOX_FULL'],
  },
};

async function sendWithRetry(
  channel: Channel,
  notification: Notification,
  attempt: number = 0,
): Promise<SendResult> {
  const policy = retryPolicies[channel];

  try {
    return await sendNotification(channel, notification);
  } catch (error) {
    if (!policy.retryableErrors.includes(error.code)) {
      throw error; // 재시도 불가 에러
    }

    if (attempt >= policy.maxRetries) {
      await handleFailedNotification(channel, notification, error);
      throw new MaxRetriesExceededError(channel, attempt);
    }

    const delay = Math.min(
      policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt),
      policy.maxDelayMs,
    );

    await sleep(delay);
    return sendWithRetry(channel, notification, attempt + 1);
  }
}
```

### 5.3 실패 처리

```typescript
async function handleFailedNotification(
  channel: Channel,
  notification: Notification,
  error: Error,
): Promise<void> {
  // 1. 실패 로그 기록
  await logNotificationFailure({
    channel,
    notificationId: notification.id,
    error: error.message,
    attempts: notification.retryCount,
    timestamp: new Date(),
  });

  // 2. Critical 알림은 폴백 채널로 전송
  if (notification.priority === 'critical') {
    const fallbackChannel = getFallbackChannel(channel);
    if (fallbackChannel) {
      await sendWithRetry(fallbackChannel, notification);
    }
  }

  // 3. 알림 상태 업데이트
  await updateNotificationStatus(notification.id, 'FAILED', {
    channel,
    error: error.message,
    lastAttempt: new Date(),
  });

  // 4. Critical 알림 실패 시 관리자 알림
  if (notification.priority === 'critical') {
    await alertAdminNotificationFailure(notification);
  }
}
```

### 5.4 폴백 채널

| 주 채널   | 1차 폴백         | 2차 폴백         |
| --------- | ---------------- | ---------------- |
| WebSocket | Web Push         | SMS (Critical만) |
| Web Push  | SMS (Critical만) | 이메일           |
| SMS       | -                | 이메일           |
| 이메일    | -                | -                |

---

## 6. 사용자 설정

### 6.1 알림 설정 UI

```typescript
interface UserNotificationSettings {
  userId: string;

  // 채널 활성화
  channels: {
    webSocket: boolean; // 항상 true (비활성화 불가)
    webPush: boolean;
    sms: boolean; // 전화번호 등록 필요
    email: boolean;
  };

  // 유형별 설정
  types: {
    vitalCritical: {
      enabled: true; // 비활성화 불가
      channels: ['websocket', 'push', 'sms'];
    };
    vitalWarning: {
      enabled: boolean;
      channels: Channel[];
    };
    admission: {
      enabled: boolean;
      channels: Channel[];
    };
    rounding: {
      enabled: boolean;
      channels: Channel[];
    };
    labResult: {
      enabled: boolean;
      channels: Channel[];
    };
    system: {
      enabled: boolean;
      channels: Channel[];
    };
  };

  // 방해 금지 시간
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm 형식
    end: string;
    exceptCritical: true; // Critical은 항상 알림
  };

  // 알림 묶음
  batching: {
    enabled: boolean;
    intervalMinutes: number; // 5, 15, 30, 60
    excludeTypes: NotificationType[];
  };
}
```

### 6.2 관리자 강제 설정

특정 알림은 사용자가 비활성화할 수 없습니다:

```typescript
const MANDATORY_NOTIFICATIONS: NotificationType[] = [
  'VITAL_CRITICAL',
  'LAB_RESULT_CRITICAL',
  'SECURITY_ALERT',
];

function validateSettings(settings: UserNotificationSettings): ValidationResult {
  for (const type of MANDATORY_NOTIFICATIONS) {
    if (!settings.types[type]?.enabled) {
      return {
        valid: false,
        error: `${type} 알림은 비활성화할 수 없습니다.`,
      };
    }
  }
  return { valid: true };
}
```

### 6.3 기본 설정값

```typescript
const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  channels: {
    webSocket: true,
    webPush: true,
    sms: false,
    email: true,
  },
  types: {
    vitalCritical: { enabled: true, channels: ['websocket', 'push', 'sms'] },
    vitalWarning: { enabled: true, channels: ['websocket', 'push'] },
    admission: { enabled: true, channels: ['websocket'] },
    rounding: { enabled: true, channels: ['websocket', 'push'] },
    labResult: { enabled: true, channels: ['websocket'] },
    system: { enabled: true, channels: ['websocket', 'email'] },
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
    exceptCritical: true,
  },
  batching: {
    enabled: false,
    intervalMinutes: 15,
    excludeTypes: ['VITAL_CRITICAL', 'LAB_RESULT_CRITICAL'],
  },
};
```

---

## 7. 기술 구현

### 7.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Patient      │  │ Vital        │  │ Lab Result   │           │
│  │ Service      │  │ Service      │  │ Service      │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
│         ▼                 ▼                 ▼                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 Notification Service                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │   │
│  │  │  Event     │  │  Template  │  │  Settings  │          │   │
│  │  │  Handler   │  │  Engine    │  │  Manager   │          │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘          │   │
│  │        │               │               │                  │   │
│  │        ▼               ▼               ▼                  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │              Notification Dispatcher                │  │   │
│  │  └────────────────────────┬───────────────────────────┘  │   │
│  └───────────────────────────┼──────────────────────────────┘   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  WebSocket   │      │  Push Queue  │      │  SMS Queue   │
│  Gateway     │      │  (Redis)     │      │  (Redis)     │
└──────────────┘      └──────┬───────┘      └──────┬───────┘
                             │                      │
                             ▼                      ▼
                      ┌──────────────┐      ┌──────────────┐
                      │  Web Push    │      │  SMS         │
                      │  (VAPID)     │      │  (AWS SNS)   │
                      └──────────────┘      └──────────────┘
```

### 7.2 NestJS 모듈 구조

```typescript
// notification.module.ts
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'push-notifications' },
      { name: 'sms-notifications' },
      { name: 'email-notifications' },
    ),
    RedisModule,
    WebSocketModule,
  ],
  providers: [
    NotificationService,
    NotificationDispatcher,
    TemplateEngine,
    SettingsManager,

    // 채널별 서비스
    WebSocketNotificationService,
    WebPushNotificationService,
    SmsNotificationService,
    EmailNotificationService,

    // 큐 프로세서
    PushNotificationProcessor,
    SmsNotificationProcessor,
    EmailNotificationProcessor,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
```

### 7.3 WebSocket Gateway

```typescript
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly connectedUsers = new Map<string, Socket[]>();

  async handleConnection(client: Socket) {
    try {
      const user = await this.authService.validateWebSocket(client);
      if (!user) {
        client.disconnect();
        return;
      }

      const existing = this.connectedUsers.get(user.id) || [];
      this.connectedUsers.set(user.id, [...existing, client]);

      // 미확인 알림 전송
      const unreadNotifications = await this.notificationService.getUnreadNotifications(user.id);
      client.emit('unread-count', unreadNotifications.length);
    } catch (error) {
      this.logger.error(`WebSocket connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      const sockets = this.connectedUsers.get(user.id) || [];
      this.connectedUsers.set(
        user.id,
        sockets.filter((s) => s.id !== client.id),
      );
    }
  }

  async sendToUser(userId: string, event: string, data: any) {
    const sockets = this.connectedUsers.get(userId) || [];
    for (const socket of sockets) {
      socket.emit(event, data);
    }
  }

  async sendToUsers(userIds: string[], event: string, data: any) {
    await Promise.all(userIds.map((userId) => this.sendToUser(userId, event, data)));
  }

  async broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}
```

### 7.4 Web Push 서비스

```typescript
@Injectable()
export class WebPushNotificationService {
  constructor(
    @InjectQueue('push-notifications')
    private readonly pushQueue: Queue,
  ) {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
  }

  async subscribe(userId: string, subscription: PushSubscription): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: { userId, endpoint: subscription.endpoint },
      },
      update: { keys: subscription.keys, updatedAt: new Date() },
      create: {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
    });
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.delete({
      where: { userId_endpoint: { userId, endpoint } },
    });
  }

  async send(notification: Notification, userIds: string[]): Promise<void> {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
    });

    const payload = this.buildPayload(notification);

    await Promise.all(
      subscriptions.map(async (sub) => {
        await this.pushQueue.add(
          'send',
          {
            subscription: {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload,
            notificationId: notification.id,
            userId: sub.userId,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );
      }),
    );
  }

  private buildPayload(notification: Notification): WebPushPayload {
    return {
      title: notification.title,
      body: notification.body,
      icon: '/icons/notification-192.png',
      badge: '/icons/badge-72.png',
      tag: `${notification.type}-${notification.id}`,
      renotify: notification.priority === 'critical',
      requireInteraction: notification.priority === 'critical',
      silent: false,
      data: {
        url: notification.actionUrl,
        notificationId: notification.id,
        timestamp: Date.now(),
      },
      actions: notification.actions,
    };
  }
}
```

---

## 8. 모니터링 및 분석

### 8.1 메트릭

| 메트릭                               | 설명               | 임계값         |
| ------------------------------------ | ------------------ | -------------- |
| `notification.sent.total`            | 전송된 총 알림 수  | -              |
| `notification.sent.by_channel`       | 채널별 전송 수     | -              |
| `notification.sent.by_type`          | 유형별 전송 수     | -              |
| `notification.delivery.latency`      | 전송 지연시간 (ms) | P99 < 1000ms   |
| `notification.delivery.success_rate` | 전송 성공률        | > 99%          |
| `notification.delivery.failure_rate` | 전송 실패율        | < 1%           |
| `notification.retry.count`           | 재시도 횟수        | P99 < 3        |
| `notification.read.rate`             | 읽음 비율          | -              |
| `notification.read.latency`          | 읽음까지 시간      | Critical < 60s |

### 8.2 알림 분석 대시보드

```sql
-- 일간 알림 통계
SELECT
    DATE(created_at) AS date,
    notification_type,
    channel,
    COUNT(*) AS total_sent,
    COUNT(*) FILTER (WHERE status = 'DELIVERED') AS delivered,
    COUNT(*) FILTER (WHERE status = 'FAILED') AS failed,
    AVG(delivery_latency_ms) AS avg_latency_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY delivery_latency_ms) AS p99_latency
FROM notification.notification_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at), notification_type, channel
ORDER BY date DESC, notification_type;

-- Critical 알림 응답 시간 분석
SELECT
    notification_id,
    notification_type,
    created_at AS sent_at,
    read_at,
    EXTRACT(EPOCH FROM (read_at - created_at)) AS response_seconds
FROM notification.user_notifications un
JOIN notification.notification_logs nl ON un.notification_id = nl.id
WHERE nl.priority = 'critical'
  AND un.is_read = TRUE
  AND created_at >= CURRENT_DATE - INTERVAL '24 hours'
ORDER BY response_seconds DESC
LIMIT 100;
```

### 8.3 알림 실패 알림

```typescript
@Cron('*/5 * * * *') // 5분마다
async checkNotificationHealth() {
  const failureRate = await this.getRecentFailureRate();

  if (failureRate > 0.05) { // 5% 이상 실패
    await this.alertService.sendAdminAlert({
      type: 'NOTIFICATION_HIGH_FAILURE_RATE',
      severity: 'warning',
      message: `알림 실패율이 ${(failureRate * 100).toFixed(2)}%입니다.`,
      details: await this.getFailureDetails()
    });
  }

  const criticalDeliveryRate = await this.getCriticalDeliveryRate();

  if (criticalDeliveryRate < 0.95) { // Critical 전송률 95% 미만
    await this.alertService.sendAdminAlert({
      type: 'CRITICAL_NOTIFICATION_DELIVERY_LOW',
      severity: 'critical',
      message: `Critical 알림 전송률이 ${(criticalDeliveryRate * 100).toFixed(2)}%입니다.`,
      details: await this.getCriticalNotificationDetails()
    });
  }
}
```

### 8.4 감사 로그

모든 알림은 감사 로그에 기록됩니다:

```typescript
interface NotificationAuditLog {
  id: string;
  notificationId: string;
  channel: Channel;
  recipientUserId: string;
  action: 'CREATED' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  timestamp: Date;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
    errorDetails?: string;
  };
}
```

---

## 변경 이력

| 버전  | 일자       | 변경 내용                          |
| ----- | ---------- | ---------------------------------- |
| 1.0.0 | 2026-01-12 | 초안 작성 - 갭 분석 기반 신규 문서 |

---

> **관련 문서**
>
> - [SRS.kr.md](../../SRS.kr.md) - 요구사항 명세
> - [api-specification.kr.md](api-specification.kr.md) - API 명세
> - [security-requirements.kr.md](../03-security/security-requirements.kr.md) - 보안 요구사항
