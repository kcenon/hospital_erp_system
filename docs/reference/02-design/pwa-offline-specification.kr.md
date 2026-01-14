# PWA 오프라인 기능 상세 명세서

---

## 문서 정보

| 항목      | 내용                             |
| --------- | -------------------------------- |
| 문서 버전 | 1.0.0                            |
| 작성일    | 2026-01-12                       |
| 상태      | 초안                             |
| 관리자    | kcenon@naver.com                 |
| 표준 기준 | W3C PWA Standards, IEEE 830-1998 |

---

## 문서 이력

| 버전  | 일자       | 작성자 | 변경 내용                     |
| ----- | ---------- | ------ | ----------------------------- |
| 1.0.0 | 2026-01-12 | -      | 초안 작성 (갭 분석 기반 신규) |

---

## 목차

1. [개요](#1-개요)
2. [오프라인 지원 기능 분류](#2-오프라인-지원-기능-분류)
3. [서비스 워커 전략](#3-서비스-워커-전략)
4. [캐싱 전략](#4-캐싱-전략)
5. [오프라인 데이터 저장](#5-오프라인-데이터-저장)
6. [동기화 전략](#6-동기화-전략)
7. [충돌 해결](#7-충돌-해결)
8. [사용자 경험](#8-사용자-경험)
9. [기술 구현](#9-기술-구현)
10. [테스트 및 검증](#10-테스트-및-검증)

---

## 1. 개요

### 1.1 목적

본 문서는 입원환자 관리 ERP 시스템의 **PWA(Progressive Web App) 오프라인 기능**에 대한 상세 명세를 정의합니다. 병원 내 네트워크 불안정 상황에서도 핵심 업무의 연속성을 보장하기 위함입니다.

### 1.2 오프라인 지원의 필요성

```
병원 환경의 네트워크 이슈
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 병동 구조상 Wi-Fi 음영 지역 존재
2. 네트워크 장비 유지보수/장애
3. 회진 중 이동 시 일시적 연결 끊김
4. 다수 기기 동시 접속 시 대역폭 부족
5. 재해/정전 시 네트워크 불안정
```

### 1.3 설계 원칙

| 원칙                     | 설명                               |
| ------------------------ | ---------------------------------- |
| **Offline-First**        | 네트워크 없이도 기본 기능 작동     |
| **Graceful Degradation** | 제한된 연결에서도 점진적 기능 제공 |
| **Data Integrity**       | 오프라인 데이터의 무결성 보장      |
| **Conflict Resolution**  | 동기화 충돌 시 명확한 해결 정책    |
| **User Transparency**    | 현재 상태를 사용자에게 명확히 표시 |

### 1.4 추적성 참조

| 관련 요구사항 | 문서                          |
| ------------- | ----------------------------- |
| REQ-NFR-007   | SRS.kr.md - PWA 지원          |
| REQ-FR-023    | SRS.kr.md - 모바일 라운딩     |
| UI-MOBILE-001 | ui-design.kr.md - 모바일 대응 |

---

## 2. 오프라인 지원 기능 분류

### 2.1 기능 분류 매트릭스

```
┌────────────────────────────────────────────────────────────────┐
│                    오프라인 지원 레벨                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ■ Level 1: 완전 오프라인 지원 (Fully Offline)                  │
│    → 네트워크 없이도 완전히 작동                                 │
│                                                                 │
│  ▣ Level 2: 읽기 전용 오프라인 (Read-Only Offline)              │
│    → 캐시된 데이터 조회만 가능, 쓰기는 큐잉                      │
│                                                                 │
│  ▤ Level 3: 임시 저장 지원 (Draft Mode)                         │
│    → 작성 중인 내용 로컬 저장, 온라인 시 동기화                   │
│                                                                 │
│  □ Level 4: 온라인 필수 (Online Required)                       │
│    → 네트워크 연결 필수, 오프라인 시 사용 불가                   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 모듈별 오프라인 지원 레벨

#### 2.2.1 환자 관리 모듈

| 기능           | 레벨 | 오프라인 동작               |
| -------------- | ---- | --------------------------- |
| 환자 목록 조회 | ▣ L2 | 캐시된 담당 환자 목록 표시  |
| 환자 상세 조회 | ▣ L2 | 캐시된 환자 정보 표시       |
| 환자 검색      | ▣ L2 | 캐시된 데이터 내에서만 검색 |
| 환자 정보 수정 | □ L4 | 온라인 필수 (민감 정보)     |
| 바이탈 입력    | ▤ L3 | 로컬 저장 후 동기화 큐      |
| I/O 기록       | ▤ L3 | 로컬 저장 후 동기화 큐      |

#### 2.2.2 병실 관리 모듈

| 기능           | 레벨 | 오프라인 동작           |
| -------------- | ---- | ----------------------- |
| 병실 현황판    | ▣ L2 | 마지막 동기화 상태 표시 |
| 병실 상세 조회 | ▣ L2 | 캐시된 병실 정보        |
| 입퇴원 처리    | □ L4 | 온라인 필수             |
| 전실 처리      | □ L4 | 온라인 필수             |

#### 2.2.3 라운딩 모듈

| 기능        | 레벨 | 오프라인 동작       |
| ----------- | ---- | ------------------- |
| 라운딩 시작 | ▤ L3 | 로컬 시작 기록      |
| 환자별 메모 | ▤ L3 | 로컬 저장 후 동기화 |
| 음성 메모   | ■ L1 | 로컬 녹음 및 저장   |
| 사진 촬영   | ■ L1 | 로컬 저장           |
| 라운딩 완료 | ▤ L3 | 로컬 완료 기록      |

#### 2.2.4 보고서 모듈

| 기능          | 레벨 | 오프라인 동작          |
| ------------- | ---- | ---------------------- |
| 보고서 조회   | ▣ L2 | 최근 캐시된 보고서     |
| 보고서 작성   | ▤ L3 | 초안 저장, 동기화 대기 |
| 보고서 승인   | □ L4 | 온라인 필수            |
| 인쇄/내보내기 | □ L4 | 온라인 필수            |

#### 2.2.5 시스템/인증 모듈

| 기능             | 레벨 | 오프라인 동작         |
| ---------------- | ---- | --------------------- |
| 로그인           | □ L4 | 온라인 필수           |
| 자동 로그인 유지 | ■ L1 | 유효 토큰 있으면 유지 |
| 로그아웃         | ■ L1 | 즉시 처리             |
| 설정 조회        | ▣ L2 | 캐시된 설정           |
| 알림 조회        | ▣ L2 | 캐시된 알림 목록      |

---

## 3. 서비스 워커 전략

### 3.1 서비스 워커 라이프사이클

```
┌───────────────────────────────────────────────────────────────┐
│                  Service Worker Lifecycle                      │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐                │
│   │ Install │ ──▶ │ Waiting │ ──▶ │ Active  │                │
│   └────┬────┘     └────┬────┘     └────┬────┘                │
│        │               │               │                       │
│        ▼               │               ▼                       │
│  Cache Static      Skip Waiting   Handle Fetch               │
│  Resources         on User Action  & Background Sync          │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 서비스 워커 등록

```typescript
// service-worker-registration.ts
import { Workbox } from 'workbox-window';

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return;
  }

  const wb = new Workbox('/sw.js');

  // 새 버전 감지 시 사용자에게 알림
  wb.addEventListener('waiting', () => {
    showUpdateNotification({
      message: '새 버전이 준비되었습니다.',
      action: {
        label: '새로고침',
        onClick: () => {
          wb.messageSkipWaiting();
          window.location.reload();
        },
      },
    });
  });

  // 컨트롤러 변경 감지
  wb.addEventListener('controlling', () => {
    window.location.reload();
  });

  // 오프라인 상태 변경 감지
  wb.addEventListener('message', (event) => {
    if (event.data.type === 'OFFLINE_MODE_CHANGED') {
      updateOfflineStatus(event.data.isOffline);
    }
  });

  await wb.register();
}
```

### 3.3 서비스 워커 구현

```typescript
// sw.ts (Workbox 기반)
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// 프리캐시 (빌드 시 생성된 매니페스트)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 앱 셸 라우팅
const appShellHandler = new NetworkFirst({
  cacheName: 'app-shell',
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 }),
  ],
});

registerRoute(
  new NavigationRoute(appShellHandler, {
    allowlist: [/^\/(?!api\/).*/],
  }),
);

// 오프라인 폴백 페이지
const offlineFallbackPage = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-fallback').then((cache) => {
      return cache.add(offlineFallbackPage);
    }),
  );
});

// 네비게이션 요청 실패 시 오프라인 페이지
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request);
        } catch (error) {
          const cache = await caches.open('offline-fallback');
          return await cache.match(offlineFallbackPage);
        }
      })(),
    );
  }
});
```

---

## 4. 캐싱 전략

### 4.1 캐시 분류

| 캐시명          | 전략                   | TTL   | 최대 항목 | 용도             |
| --------------- | ---------------------- | ----- | --------- | ---------------- |
| `app-shell`     | Network First          | 7일   | 50        | HTML, 기본 UI    |
| `static-assets` | Cache First            | 30일  | 200       | JS, CSS, 이미지  |
| `api-cache`     | Stale While Revalidate | 1시간 | 500       | API 응답         |
| `patient-data`  | Network First          | 30분  | 1000      | 환자 데이터      |
| `room-data`     | Network First          | 15분  | 100       | 병실 데이터      |
| `offline-queue` | -                      | 7일   | 1000      | 오프라인 요청 큐 |

### 4.2 리소스 타입별 캐싱

```typescript
// Static Assets (Cache First)
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30일
      }),
    ],
  }),
);

// API 요청 (Stale While Revalidate)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.includes('/api/auth/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 60 * 60, // 1시간
      }),
    ],
  }),
);

// 환자 데이터 (Network First with Fallback)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/patients'),
  new NetworkFirst({
    cacheName: 'patient-data',
    networkTimeoutSeconds: 5, // 5초 후 캐시 사용
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 30 * 60, // 30분
      }),
    ],
  }),
);

// 병실 데이터 (Network First)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/rooms'),
  new NetworkFirst({
    cacheName: 'room-data',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 15 * 60, // 15분
      }),
    ],
  }),
);

// 인증 관련 (Network Only - 캐시 금지)
registerRoute(({ url }) => url.pathname.startsWith('/api/auth/'), new NetworkOnly());
```

### 4.3 동적 데이터 프리패칭

```typescript
// 로그인 후 담당 환자 데이터 프리패칭
async function prefetchAssignedPatients(userId: string): Promise<void> {
  const assignments = await fetch(`/api/assignments?userId=${userId}`);
  const { patientIds, roomIds } = await assignments.json();

  // 환자 데이터 프리패치
  await Promise.all(
    patientIds.map(async (patientId) => {
      const response = await fetch(`/api/patients/${patientId}`);
      const cache = await caches.open('patient-data');
      await cache.put(`/api/patients/${patientId}`, response.clone());
    }),
  );

  // 병실 데이터 프리패치
  await Promise.all(
    roomIds.map(async (roomId) => {
      const response = await fetch(`/api/rooms/${roomId}`);
      const cache = await caches.open('room-data');
      await cache.put(`/api/rooms/${roomId}`, response.clone());
    }),
  );

  // 프리패치 완료 알림
  navigator.serviceWorker.controller?.postMessage({
    type: 'PREFETCH_COMPLETE',
    data: { patientCount: patientIds.length, roomCount: roomIds.length },
  });
}
```

---

## 5. 오프라인 데이터 저장

### 5.1 저장소 전략

```
┌─────────────────────────────────────────────────────────────┐
│                 Offline Storage Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌───────────────────┐                                     │
│   │   Cache Storage   │  ← HTTP 응답 캐시 (Workbox)         │
│   │   (Cache API)     │                                     │
│   └───────────────────┘                                     │
│                                                              │
│   ┌───────────────────┐                                     │
│   │     IndexedDB     │  ← 구조화된 데이터 (Dexie.js)       │
│   │   (via Dexie)     │                                     │
│   └───────────────────┘                                     │
│                                                              │
│   ┌───────────────────┐                                     │
│   │  LocalStorage     │  ← 설정, 토큰 (민감도 낮음)         │
│   └───────────────────┘                                     │
│                                                              │
│   ┌───────────────────┐                                     │
│   │  SessionStorage   │  ← 임시 상태 (탭 한정)              │
│   └───────────────────┘                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 IndexedDB 스키마 (Dexie.js)

```typescript
// offline-database.ts
import Dexie, { Table } from 'dexie';

interface CachedPatient {
  id: string;
  data: PatientData;
  cachedAt: Date;
  expiresAt: Date;
  version: number;
}

interface CachedRoom {
  id: string;
  data: RoomData;
  cachedAt: Date;
  expiresAt: Date;
}

interface OfflineVitalRecord {
  localId: string; // 로컬 UUID
  patientId: string;
  data: VitalData;
  createdAt: Date;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncAttempts: number;
  lastSyncAttempt?: Date;
  serverId?: string; // 동기화 후 서버 ID
  error?: string;
}

interface OfflineRoundingNote {
  localId: string;
  roundingSessionId?: string;
  patientId: string;
  content: string;
  attachments: OfflineAttachment[];
  createdAt: Date;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncAttempts: number;
}

interface OfflineAttachment {
  localId: string;
  type: 'image' | 'audio';
  blob: Blob;
  thumbnail?: Blob;
  createdAt: Date;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  serverUrl?: string;
}

class OfflineDatabase extends Dexie {
  cachedPatients!: Table<CachedPatient>;
  cachedRooms!: Table<CachedRoom>;
  offlineVitals!: Table<OfflineVitalRecord>;
  offlineRoundingNotes!: Table<OfflineRoundingNote>;
  offlineAttachments!: Table<OfflineAttachment>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('HospitalERP_Offline');

    this.version(1).stores({
      cachedPatients: 'id, cachedAt, expiresAt',
      cachedRooms: 'id, cachedAt, expiresAt',
      offlineVitals: 'localId, patientId, syncStatus, createdAt',
      offlineRoundingNotes: 'localId, patientId, syncStatus, createdAt',
      offlineAttachments: 'localId, type, syncStatus, createdAt',
      syncQueue: '++id, type, priority, createdAt, syncStatus',
    });
  }
}

export const offlineDb = new OfflineDatabase();
```

### 5.3 오프라인 데이터 관리자

```typescript
// offline-data-manager.ts
export class OfflineDataManager {
  private readonly db = offlineDb;
  private readonly maxCacheAge = 30 * 60 * 1000; // 30분

  // 환자 데이터 조회 (캐시 우선)
  async getPatient(patientId: string): Promise<PatientData | null> {
    // 1. IndexedDB 캐시 확인
    const cached = await this.db.cachedPatients.get(patientId);

    if (cached && new Date() < cached.expiresAt) {
      return cached.data;
    }

    // 2. 온라인이면 서버에서 가져와서 캐시
    if (navigator.onLine) {
      try {
        const response = await fetch(`/api/patients/${patientId}`);
        const data = await response.json();

        await this.db.cachedPatients.put({
          id: patientId,
          data,
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + this.maxCacheAge),
          version: data.version,
        });

        return data;
      } catch (error) {
        // 네트워크 오류 시 만료된 캐시라도 반환
        if (cached) {
          return cached.data;
        }
        throw error;
      }
    }

    // 3. 오프라인이고 만료된 캐시가 있으면 반환
    if (cached) {
      return cached.data;
    }

    return null;
  }

  // 바이탈 오프라인 저장
  async saveVitalOffline(vital: VitalInput): Promise<string> {
    const localId = crypto.randomUUID();

    await this.db.offlineVitals.add({
      localId,
      patientId: vital.patientId,
      data: vital,
      createdAt: new Date(),
      syncStatus: 'pending',
      syncAttempts: 0,
    });

    // 동기화 큐에 추가
    await this.db.syncQueue.add({
      type: 'vital',
      referenceId: localId,
      priority: 1, // 높은 우선순위
      createdAt: new Date(),
      syncStatus: 'pending',
    });

    return localId;
  }

  // 오프라인 저장 데이터 조회
  async getPendingVitals(): Promise<OfflineVitalRecord[]> {
    return this.db.offlineVitals.where('syncStatus').anyOf(['pending', 'failed']).toArray();
  }

  // 캐시 정리
  async cleanupExpiredCache(): Promise<void> {
    const now = new Date();

    await this.db.cachedPatients.where('expiresAt').below(now).delete();

    await this.db.cachedRooms.where('expiresAt').below(now).delete();
  }

  // 저장소 사용량 확인
  async getStorageUsage(): Promise<StorageUsage> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        usagePercentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100,
      };
    }
    return { used: 0, quota: 0, usagePercentage: 0 };
  }
}
```

---

## 6. 동기화 전략

### 6.1 Background Sync 구현

```typescript
// background-sync.ts
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

// 바이탈 데이터 동기화 큐
const vitalSyncQueue = new BackgroundSyncPlugin('vital-sync-queue', {
  maxRetentionTime: 7 * 24 * 60, // 7일 (분 단위)
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request.clone());

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.status}`);
        }

        // 동기화 성공 시 로컬 DB 업데이트
        const body = await entry.request.clone().json();
        await offlineDb.offlineVitals.update(body.localId, {
          syncStatus: 'synced',
          serverId: (await response.json()).id,
        });

        // 사용자에게 알림
        self.registration.showNotification('동기화 완료', {
          body: '오프라인에서 저장한 바이탈 데이터가 동기화되었습니다.',
          icon: '/icons/sync-success-192.png',
          tag: 'sync-complete',
        });
      } catch (error) {
        // 재시도 큐에 다시 추가
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// 라운딩 메모 동기화 큐
const roundingSyncQueue = new BackgroundSyncPlugin('rounding-sync-queue', {
  maxRetentionTime: 7 * 24 * 60,
});

// POST 요청 라우팅 (오프라인 시 큐잉)
registerRoute(
  ({ url }) => url.pathname === '/api/vitals',
  new NetworkOnly({
    plugins: [vitalSyncQueue],
  }),
  'POST',
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/rounding/notes'),
  new NetworkOnly({
    plugins: [roundingSyncQueue],
  }),
  'POST',
);
```

### 6.2 수동 동기화 트리거

```typescript
// sync-manager.ts
export class SyncManager {
  private syncInProgress = false;

  // 수동 동기화 트리거
  async triggerSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { status: 'already_in_progress' };
    }

    if (!navigator.onLine) {
      return { status: 'offline', message: '네트워크 연결을 확인해주세요.' };
    }

    this.syncInProgress = true;

    try {
      const results = await Promise.allSettled([
        this.syncVitals(),
        this.syncRoundingNotes(),
        this.syncAttachments(),
      ]);

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        status: 'completed',
        successful,
        failed,
        details: results,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // 바이탈 동기화
  private async syncVitals(): Promise<void> {
    const pendingVitals = await offlineDb.offlineVitals
      .where('syncStatus')
      .anyOf(['pending', 'failed'])
      .toArray();

    for (const vital of pendingVitals) {
      await this.syncSingleVital(vital);
    }
  }

  private async syncSingleVital(vital: OfflineVitalRecord): Promise<void> {
    await offlineDb.offlineVitals.update(vital.localId, {
      syncStatus: 'syncing',
      lastSyncAttempt: new Date(),
    });

    try {
      const response = await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vital.data,
          localId: vital.localId,
          createdAt: vital.createdAt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result = await response.json();

      await offlineDb.offlineVitals.update(vital.localId, {
        syncStatus: 'synced',
        serverId: result.id,
      });
    } catch (error) {
      await offlineDb.offlineVitals.update(vital.localId, {
        syncStatus: 'failed',
        syncAttempts: vital.syncAttempts + 1,
        error: error.message,
      });
      throw error;
    }
  }

  // 첨부파일 동기화 (청크 업로드)
  private async syncAttachments(): Promise<void> {
    const pendingAttachments = await offlineDb.offlineAttachments
      .where('syncStatus')
      .equals('pending')
      .toArray();

    for (const attachment of pendingAttachments) {
      await this.uploadAttachment(attachment);
    }
  }

  private async uploadAttachment(attachment: OfflineAttachment): Promise<void> {
    const CHUNK_SIZE = 256 * 1024; // 256KB
    const totalChunks = Math.ceil(attachment.blob.size / CHUNK_SIZE);

    // 업로드 세션 시작
    const sessionResponse = await fetch('/api/uploads/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        localId: attachment.localId,
        fileName: `${attachment.type}_${attachment.localId}`,
        fileSize: attachment.blob.size,
        totalChunks,
      }),
    });

    const { sessionId } = await sessionResponse.json();

    // 청크 업로드
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, attachment.blob.size);
      const chunk = attachment.blob.slice(start, end);

      await fetch(`/api/uploads/session/${sessionId}/chunk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Chunk-Index': String(i),
        },
        body: chunk,
      });
    }

    // 업로드 완료
    const completeResponse = await fetch(`/api/uploads/session/${sessionId}/complete`, {
      method: 'POST',
    });

    const { url } = await completeResponse.json();

    await offlineDb.offlineAttachments.update(attachment.localId, {
      syncStatus: 'synced',
      serverUrl: url,
    });
  }
}
```

### 6.3 동기화 우선순위

| 우선순위 | 데이터 유형 | 설명           |
| -------- | ----------- | -------------- |
| 1 (최고) | 바이탈 사인 | 환자 안전 관련 |
| 2        | 라운딩 메모 | 진료 기록      |
| 3        | I/O 기록    | 환자 관리      |
| 4        | 첨부파일    | 사진, 음성     |
| 5 (최저) | 설정/기타   | 사용자 설정    |

---

## 7. 충돌 해결

### 7.1 충돌 유형

```
┌─────────────────────────────────────────────────────────────┐
│                    Conflict Types                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. UPDATE-UPDATE Conflict                                   │
│     → 같은 레코드를 오프라인/온라인에서 각각 수정            │
│                                                              │
│  2. DELETE-UPDATE Conflict                                   │
│     → 서버에서 삭제된 레코드를 오프라인에서 수정            │
│                                                              │
│  3. DUPLICATE Conflict                                       │
│     → 동일 시점의 바이탈 기록이 중복 생성                   │
│                                                              │
│  4. VERSION Conflict                                         │
│     → 낙관적 잠금 버전 불일치                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 충돌 해결 정책

```typescript
// conflict-resolver.ts
type ConflictResolutionStrategy =
  | 'SERVER_WINS' // 서버 데이터 우선
  | 'CLIENT_WINS' // 클라이언트 데이터 우선
  | 'LATEST_WINS' // 최신 타임스탬프 우선
  | 'MERGE' // 병합 (필드별)
  | 'MANUAL'; // 사용자 선택

const CONFLICT_POLICIES: Record<DataType, ConflictResolutionStrategy> = {
  // 바이탈: 모든 기록 보존 (APPEND_ONLY)
  vital: 'CLIENT_WINS', // 오프라인 기록도 별도로 저장

  // 환자 정보: 서버 우선 (민감 데이터)
  patient: 'SERVER_WINS',

  // 라운딩 메모: 최신 우선
  rounding_note: 'LATEST_WINS',

  // 설정: 병합
  settings: 'MERGE',
};

export class ConflictResolver {
  async resolveConflict<T>(
    local: OfflineRecord<T>,
    server: ServerRecord<T>,
    dataType: DataType,
  ): Promise<ResolvedRecord<T>> {
    const strategy = CONFLICT_POLICIES[dataType];

    switch (strategy) {
      case 'SERVER_WINS':
        return {
          data: server.data,
          version: server.version,
          conflictResolution: 'server_applied',
        };

      case 'CLIENT_WINS':
        // 바이탈의 경우 로컬 기록을 새 레코드로 추가
        if (dataType === 'vital') {
          return {
            data: local.data,
            version: server.version + 1,
            conflictResolution: 'client_appended',
            appendAsNew: true,
          };
        }
        return {
          data: local.data,
          version: server.version + 1,
          conflictResolution: 'client_applied',
        };

      case 'LATEST_WINS':
        const localTime = new Date(local.updatedAt).getTime();
        const serverTime = new Date(server.updatedAt).getTime();

        if (localTime > serverTime) {
          return {
            data: local.data,
            version: server.version + 1,
            conflictResolution: 'client_newer',
          };
        }
        return {
          data: server.data,
          version: server.version,
          conflictResolution: 'server_newer',
        };

      case 'MERGE':
        const merged = this.mergeData(local.data, server.data);
        return {
          data: merged,
          version: server.version + 1,
          conflictResolution: 'merged',
        };

      case 'MANUAL':
        return {
          data: null,
          conflict: { local, server },
          conflictResolution: 'pending_user_decision',
        };
    }
  }

  private mergeData<T>(local: T, server: T): T {
    // 필드별 병합 로직
    const merged = { ...server };

    for (const key of Object.keys(local)) {
      const localValue = local[key];
      const serverValue = server[key];

      // 로컬에서 변경되었고 서버와 다른 경우
      if (localValue !== undefined && localValue !== serverValue) {
        // 배열은 합집합
        if (Array.isArray(localValue) && Array.isArray(serverValue)) {
          merged[key] = [...new Set([...serverValue, ...localValue])];
        }
        // 객체는 재귀 병합
        else if (typeof localValue === 'object' && typeof serverValue === 'object') {
          merged[key] = this.mergeData(localValue, serverValue);
        }
        // 기본값은 로컬 우선 (설정 등)
        else {
          merged[key] = localValue;
        }
      }
    }

    return merged;
  }
}
```

### 7.3 충돌 알림 UI

```typescript
// conflict-notification.tsx
interface ConflictNotificationProps {
  conflicts: Conflict[];
  onResolve: (conflictId: string, resolution: 'local' | 'server') => void;
}

export function ConflictNotification({ conflicts, onResolve }: ConflictNotificationProps) {
  if (conflicts.length === 0) return null;

  return (
    <Alert variant="warning">
      <AlertTitle>동기화 충돌 발생</AlertTitle>
      <AlertDescription>
        오프라인에서 작성한 {conflicts.length}개의 항목이 서버 데이터와 충돌합니다.
      </AlertDescription>
      <ConflictList>
        {conflicts.map(conflict => (
          <ConflictItem key={conflict.id}>
            <ConflictInfo>
              <span>{conflict.dataType}: {conflict.description}</span>
              <span className="text-muted">
                로컬: {formatDate(conflict.local.updatedAt)} /
                서버: {formatDate(conflict.server.updatedAt)}
              </span>
            </ConflictInfo>
            <ConflictActions>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResolve(conflict.id, 'local')}
              >
                내 변경 사용
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResolve(conflict.id, 'server')}
              >
                서버 버전 사용
              </Button>
            </ConflictActions>
          </ConflictItem>
        ))}
      </ConflictList>
    </Alert>
  );
}
```

---

## 8. 사용자 경험

### 8.1 오프라인 상태 표시

```typescript
// offline-indicator.tsx
export function OfflineIndicator() {
  const { isOnline, lastSyncTime, pendingCount } = useOfflineStatus();

  return (
    <div className={cn(
      'fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg',
      isOnline ? 'bg-green-100' : 'bg-yellow-100'
    )}>
      {/* 상태 아이콘 */}
      <div className={cn(
        'w-3 h-3 rounded-full',
        isOnline ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
      )} />

      {/* 상태 텍스트 */}
      <span className="text-sm font-medium">
        {isOnline ? '온라인' : '오프라인 모드'}
      </span>

      {/* 동기화 대기 건수 */}
      {pendingCount > 0 && (
        <Badge variant="secondary">
          동기화 대기: {pendingCount}
        </Badge>
      )}

      {/* 마지막 동기화 시간 */}
      {!isOnline && lastSyncTime && (
        <span className="text-xs text-muted-foreground">
          마지막 동기화: {formatRelativeTime(lastSyncTime)}
        </span>
      )}

      {/* 수동 동기화 버튼 */}
      {isOnline && pendingCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerManualSync}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

### 8.2 오프라인 데이터 표시

```typescript
// offline-data-badge.tsx
export function OfflineDataBadge({ data }: { data: { syncStatus: string } }) {
  const badges = {
    pending: { label: '동기화 대기', variant: 'warning' as const },
    syncing: { label: '동기화 중', variant: 'info' as const },
    synced: { label: '동기화됨', variant: 'success' as const },
    failed: { label: '동기화 실패', variant: 'destructive' as const }
  };

  const badge = badges[data.syncStatus];

  if (!badge || data.syncStatus === 'synced') return null;

  return (
    <Badge variant={badge.variant} className="ml-2">
      {data.syncStatus === 'syncing' && (
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      )}
      {badge.label}
    </Badge>
  );
}
```

### 8.3 오프라인 폴백 페이지

```html
<!-- offline.html -->
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>오프라인 - 입원환자 관리 시스템</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background: #f5f5f5;
        text-align: center;
        padding: 20px;
      }
      .icon {
        font-size: 64px;
        margin-bottom: 20px;
      }
      h1 {
        color: #333;
        margin-bottom: 10px;
      }
      p {
        color: #666;
        margin-bottom: 20px;
        max-width: 400px;
      }
      .btn {
        background: #2563eb;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
      }
      .btn:hover {
        background: #1d4ed8;
      }
      .status {
        margin-top: 20px;
        font-size: 14px;
        color: #888;
      }
    </style>
  </head>
  <body>
    <div class="icon">📶</div>
    <h1>오프라인 상태입니다</h1>
    <p>네트워크 연결이 끊어졌습니다. 연결이 복원되면 자동으로 동기화됩니다.</p>
    <button class="btn" onclick="location.reload()">다시 시도</button>
    <div class="status" id="status"></div>

    <script>
      // 온라인 상태 감지
      window.addEventListener('online', () => {
        document.getElementById('status').textContent = '연결됨! 페이지를 새로고침합니다...';
        setTimeout(() => location.reload(), 1000);
      });

      // 연결 확인
      if (navigator.onLine) {
        document.getElementById('status').textContent = '연결 확인 중...';
        fetch('/api/health')
          .then(() => location.reload())
          .catch(() => {
            document.getElementById('status').textContent = '서버에 연결할 수 없습니다.';
          });
      }
    </script>
  </body>
</html>
```

---

## 9. 기술 구현

### 9.1 PWA 매니페스트

```json
// manifest.json
{
  "name": "입원환자 관리 ERP 시스템",
  "short_name": "입원관리",
  "description": "병원 입원환자 관리를 위한 ERP 시스템",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["medical", "productivity", "business"],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "대시보드"
    },
    {
      "src": "/screenshots/patient-list.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "환자 목록"
    }
  ],
  "shortcuts": [
    {
      "name": "병실 현황",
      "short_name": "현황",
      "description": "병실 현황판 바로가기",
      "url": "/rooms",
      "icons": [{ "src": "/icons/room-96.png", "sizes": "96x96" }]
    },
    {
      "name": "라운딩 시작",
      "short_name": "라운딩",
      "description": "라운딩 시작하기",
      "url": "/rounding/start",
      "icons": [{ "src": "/icons/rounding-96.png", "sizes": "96x96" }]
    }
  ],
  "related_applications": [],
  "prefer_related_applications": false
}
```

### 9.2 Next.js 설정

```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1년
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7일
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
  ],
});

module.exports = withPWA({
  // Next.js 설정
});
```

### 9.3 오프라인 훅

```typescript
// hooks/useOffline.ts
import { useState, useEffect, useCallback } from 'react';
import { offlineDb } from '@/lib/offline-database';
import { SyncManager } from '@/lib/sync-manager';

interface OfflineState {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  syncInProgress: boolean;
  storageUsage: number;
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    lastSyncTime: null,
    syncInProgress: false,
    storageUsage: 0,
  });

  const syncManager = new SyncManager();

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => {
      setState((s) => ({ ...s, isOnline: true }));
      // 온라인 복귀 시 자동 동기화
      syncManager.triggerSync();
    };

    const handleOffline = () => {
      setState((s) => ({ ...s, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 대기 중인 항목 수 업데이트
  useEffect(() => {
    const updatePendingCount = async () => {
      const vitals = await offlineDb.offlineVitals
        .where('syncStatus')
        .anyOf(['pending', 'failed'])
        .count();

      const notes = await offlineDb.offlineRoundingNotes
        .where('syncStatus')
        .anyOf(['pending', 'failed'])
        .count();

      setState((s) => ({ ...s, pendingCount: vitals + notes }));
    };

    updatePendingCount();

    // IndexedDB 변경 감지
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // 수동 동기화
  const triggerSync = useCallback(async () => {
    setState((s) => ({ ...s, syncInProgress: true }));

    try {
      const result = await syncManager.triggerSync();
      setState((s) => ({
        ...s,
        syncInProgress: false,
        lastSyncTime: new Date(),
      }));
      return result;
    } catch (error) {
      setState((s) => ({ ...s, syncInProgress: false }));
      throw error;
    }
  }, []);

  // 오프라인 데이터 저장
  const saveOffline = useCallback(
    async <T>(type: 'vital' | 'rounding_note', data: T): Promise<string> => {
      const localId = crypto.randomUUID();

      if (type === 'vital') {
        await offlineDb.offlineVitals.add({
          localId,
          patientId: (data as any).patientId,
          data: data as any,
          createdAt: new Date(),
          syncStatus: 'pending',
          syncAttempts: 0,
        });
      } else if (type === 'rounding_note') {
        await offlineDb.offlineRoundingNotes.add({
          localId,
          patientId: (data as any).patientId,
          content: (data as any).content,
          attachments: [],
          createdAt: new Date(),
          syncStatus: 'pending',
          syncAttempts: 0,
        });
      }

      // 온라인이면 즉시 동기화 시도
      if (navigator.onLine) {
        syncManager.triggerSync();
      }

      return localId;
    },
    [],
  );

  return {
    ...state,
    triggerSync,
    saveOffline,
  };
}
```

---

## 10. 테스트 및 검증

### 10.1 테스트 시나리오

| 시나리오                | 테스트 방법                          | 예상 결과                          |
| ----------------------- | ------------------------------------ | ---------------------------------- |
| 완전 오프라인 접속      | 네트워크 차단 후 앱 실행             | 캐시된 페이지 표시                 |
| 오프라인 바이탈 입력    | 네트워크 차단 후 바이탈 저장         | IndexedDB에 저장, 동기화 대기 표시 |
| 온라인 복귀 자동 동기화 | 네트워크 복원                        | 자동으로 대기 중인 데이터 동기화   |
| 충돌 해결               | 오프라인에서 수정 후 서버에서도 수정 | 충돌 알림 및 해결 옵션 제공        |
| 저장소 한계 도달        | IndexedDB 90% 이상 사용              | 경고 표시, 오래된 캐시 정리        |
| 서비스 워커 업데이트    | 새 버전 배포                         | 업데이트 알림, 새로고침 옵션       |

### 10.2 E2E 테스트 코드

```typescript
// tests/e2e/offline.spec.ts
import { test, expect } from '@playwright/test';

test.describe('PWA Offline Functionality', () => {
  test('should show offline indicator when network is disconnected', async ({ page, context }) => {
    await page.goto('/dashboard');

    // 네트워크 오프라인 설정
    await context.setOffline(true);

    // 오프라인 인디케이터 확인
    await expect(page.getByText('오프라인 모드')).toBeVisible();
  });

  test('should save vital data offline and sync when online', async ({ page, context }) => {
    await page.goto('/patients/123/vitals');

    // 네트워크 오프라인 설정
    await context.setOffline(true);

    // 바이탈 입력
    await page.fill('[name="temperature"]', '36.5');
    await page.fill('[name="bloodPressureSystolic"]', '120');
    await page.fill('[name="bloodPressureDiastolic"]', '80');
    await page.click('button[type="submit"]');

    // 동기화 대기 배지 확인
    await expect(page.getByText('동기화 대기')).toBeVisible();

    // 네트워크 온라인 복귀
    await context.setOffline(false);

    // 자동 동기화 확인
    await expect(page.getByText('동기화됨')).toBeVisible({ timeout: 10000 });
  });

  test('should cache patient data for offline access', async ({ page, context }) => {
    // 온라인에서 환자 페이지 방문
    await page.goto('/patients/123');
    const patientName = await page.textContent('.patient-name');

    // 네트워크 오프라인 설정
    await context.setOffline(true);

    // 페이지 새로고침
    await page.reload();

    // 캐시된 환자 정보 표시 확인
    await expect(page.locator('.patient-name')).toHaveText(patientName!);
  });

  test('should show offline fallback page for uncached routes', async ({ page, context }) => {
    // 네트워크 오프라인 설정
    await context.setOffline(true);

    // 방문한 적 없는 페이지 접근
    await page.goto('/patients/999');

    // 오프라인 폴백 페이지 확인
    await expect(page.getByText('오프라인 상태입니다')).toBeVisible();
  });
});
```

### 10.3 성능 요구사항

| 메트릭                            | 목표           | 측정 방법   |
| --------------------------------- | -------------- | ----------- |
| First Contentful Paint (오프라인) | < 1.5초        | Lighthouse  |
| 오프라인 저장 응답 시간           | < 100ms        | 인앱 측정   |
| 동기화 처리량                     | 100 records/분 | 부하 테스트 |
| IndexedDB 쿼리 시간               | < 50ms         | 인앱 측정   |
| 서비스 워커 활성화 시간           | < 500ms        | Lighthouse  |

---

## 변경 이력

| 버전  | 일자       | 변경 내용                          |
| ----- | ---------- | ---------------------------------- |
| 1.0.0 | 2026-01-12 | 초안 작성 - 갭 분석 기반 신규 문서 |

---

> **관련 문서**
>
> - [SRS.kr.md](../../SRS.kr.md) - 요구사항 명세
> - [notification-specification.kr.md](notification-specification.kr.md) - 알림 명세
> - [ui-design.kr.md](ui-design.kr.md) - UI 설계
