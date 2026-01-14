# 검색 최적화 전략

---

## 문서 정보

| 항목      | 내용             |
| --------- | ---------------- |
| 문서 버전 | 1.0.0            |
| 작성일    | 2026-01-12       |
| 상태      | 초안             |
| 관리자    | kcenon@naver.com |
| 표준 기준 | 내부 성능 기준   |

---

## 문서 이력

| 버전  | 일자       | 작성자 | 변경 내용                     |
| ----- | ---------- | ------ | ----------------------------- |
| 1.0.0 | 2026-01-12 | -      | 초안 작성 (갭 분석 기반 신규) |

---

## 목차

1. [개요](#1-개요)
2. [검색 요구사항](#2-검색-요구사항)
3. [검색 아키텍처](#3-검색-아키텍처)
4. [PostgreSQL 최적화](#4-postgresql-최적화)
5. [Redis 캐싱 전략](#5-redis-캐싱-전략)
6. [전문 검색 (Full-Text Search)](#6-전문-검색-full-text-search)
7. [실시간 검색](#7-실시간-검색)
8. [성능 모니터링](#8-성능-모니터링)
9. [확장 전략](#9-확장-전략)

---

## 1. 개요

### 1.1 목적

본 문서는 입원환자 관리 ERP 시스템의 **검색 기능 최적화 전략**을 정의합니다. 의료 현장에서 신속한 환자 정보 검색은 업무 효율성과 환자 안전에 직결됩니다.

### 1.2 성능 목표

| 검색 유형             | 응답 시간 목표 | 동시 사용자 |
| --------------------- | -------------- | ----------- |
| 환자 이름/ID 검색     | < 100ms        | 100         |
| 병실 현황 조회        | < 200ms        | 100         |
| 환자 기록 검색        | < 500ms        | 50          |
| 전문 검색 (진료 기록) | < 1000ms       | 20          |
| 대시보드 통계         | < 300ms        | 100         |

### 1.3 추적성 참조

| 관련 요구사항 | 문서                                |
| ------------- | ----------------------------------- |
| REQ-NFR-003   | SRS.kr.md - 성능 요구사항           |
| REQ-FR-002    | SRS.kr.md - 환자 검색 기능          |
| DB-001        | database-design.kr.md - 인덱스 설계 |

---

## 2. 검색 요구사항

### 2.1 검색 유형별 분류

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Search Types Classification                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │   Exact Match       │  │   Prefix Match      │                   │
│  │   정확 일치         │  │   접두어 일치        │                   │
│  │                     │  │                     │                   │
│  │  - 환자 ID          │  │  - 환자 이름        │                   │
│  │  - 등록번호         │  │  - 병실 번호        │                   │
│  │  - 주민번호(암호화) │  │  - 진단 코드        │                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │   Full-Text Search  │  │   Range Query       │                   │
│  │   전문 검색         │  │   범위 검색         │                   │
│  │                     │  │                     │                   │
│  │  - 간호 기록        │  │  - 입원 기간        │                   │
│  │  - 라운딩 메모      │  │  - 바이탈 수치      │                   │
│  │  - 진료 노트        │  │  - 검사 결과        │                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │   Aggregate Query   │  │   Real-time Search  │                   │
│  │   집계 검색         │  │   실시간 검색        │                   │
│  │                     │  │                     │                   │
│  │  - 통계 대시보드    │  │  - 자동완성         │                   │
│  │  - 병동별 현황      │  │  - 즉시 필터링      │                   │
│  │  - 기간별 리포트    │  │  - 라이브 모니터링  │                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 주요 검색 시나리오

| 시나리오              | 검색 대상       | 예상 빈도 | 중요도   |
| --------------------- | --------------- | --------- | -------- |
| 환자 이름으로 검색    | 환자 테이블     | 매우 높음 | Critical |
| 병실 번호로 환자 조회 | 입원, 병실      | 높음      | High     |
| 담당 의사별 환자 목록 | 입원, 의사 배정 | 높음      | High     |
| 특정 진단명 환자 검색 | 환자, 진단      | 중간      | Medium   |
| 바이탈 이상 환자 필터 | 바이탈 기록     | 높음      | Critical |
| 기간별 입퇴원 환자    | 입원 기록       | 중간      | Medium   |
| 간호 기록 내용 검색   | 간호 기록       | 낮음      | Low      |

---

## 3. 검색 아키텍처

### 3.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Search Architecture                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                         ┌───────────────┐                           │
│                         │   Frontend    │                           │
│                         │   (Next.js)   │                           │
│                         └───────┬───────┘                           │
│                                 │                                    │
│                                 ▼                                    │
│                         ┌───────────────┐                           │
│                         │  API Gateway  │                           │
│                         │   (NestJS)    │                           │
│                         └───────┬───────┘                           │
│                                 │                                    │
│              ┌──────────────────┼──────────────────┐                │
│              │                  │                  │                 │
│              ▼                  ▼                  ▼                 │
│      ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│      │    Redis     │   │  PostgreSQL  │   │ Elasticsearch │        │
│      │   (Cache)    │   │   (Primary)  │   │  (Optional)   │        │
│      └──────────────┘   └──────────────┘   └──────────────┘        │
│              │                  │                  │                 │
│              │                  │                  │                 │
│      ┌───────┴───────┐  ┌───────┴───────┐  ┌───────┴───────┐       │
│      │ - 자동완성    │  │ - 정확 검색   │  │ - 전문 검색   │       │
│      │ - 최근 검색   │  │ - 접두어 검색 │  │ - 유사도 검색 │       │
│      │ - 인기 검색어 │  │ - 범위 검색   │  │ - 집계 분석   │       │
│      └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 계층별 역할

| 계층              | 역할                            | 기술                     |
| ----------------- | ------------------------------- | ------------------------ |
| **L1: 캐시**      | 빈번한 검색 결과 캐싱, 자동완성 | Redis                    |
| **L2: RDBMS**     | 정확한 검색, 트랜잭션 보장      | PostgreSQL + pg_trgm     |
| **L3: 검색 엔진** | 전문 검색, 복잡한 집계 (선택적) | Elasticsearch (Phase 3+) |

---

## 4. PostgreSQL 최적화

### 4.1 인덱스 전략

#### 4.1.1 환자 테이블 인덱스

```sql
-- 환자 기본 인덱스
CREATE INDEX idx_patients_name ON patient.patients(name);
CREATE INDEX idx_patients_name_gin ON patient.patients USING gin(name gin_trgm_ops);
CREATE INDEX idx_patients_mrn ON patient.patients(medical_record_number);
CREATE INDEX idx_patients_created ON patient.patients(created_at DESC);

-- 복합 인덱스 (자주 사용되는 필터 조합)
CREATE INDEX idx_patients_status_ward ON patient.patients(status, ward_id)
  WHERE status = 'ADMITTED';

-- 부분 인덱스 (현재 입원 환자만)
CREATE INDEX idx_patients_admitted ON patient.patients(id, name, room_id)
  WHERE status = 'ADMITTED';
```

#### 4.1.2 입원 테이블 인덱스

```sql
-- 입원 기록 인덱스
CREATE INDEX idx_admissions_patient ON admission.admissions(patient_id);
CREATE INDEX idx_admissions_room ON admission.admissions(room_id);
CREATE INDEX idx_admissions_date ON admission.admissions(admission_date DESC);
CREATE INDEX idx_admissions_status ON admission.admissions(status)
  WHERE status IN ('ACTIVE', 'PENDING');

-- 입퇴원 기간 검색용
CREATE INDEX idx_admissions_period ON admission.admissions(admission_date, discharge_date)
  WHERE discharge_date IS NOT NULL;

-- 담당 의사별 검색
CREATE INDEX idx_admissions_doctor ON admission.admissions(attending_doctor_id)
  WHERE status = 'ACTIVE';
```

#### 4.1.3 바이탈 테이블 인덱스

```sql
-- 바이탈 기록 인덱스
CREATE INDEX idx_vitals_patient_time ON room.vitals(patient_id, recorded_at DESC);
CREATE INDEX idx_vitals_room_time ON room.vitals(room_id, recorded_at DESC);

-- 이상 수치 빠른 조회
CREATE INDEX idx_vitals_abnormal ON room.vitals(patient_id, recorded_at DESC)
  WHERE temperature < 36.0 OR temperature > 38.5
     OR systolic_bp < 90 OR systolic_bp > 160
     OR heart_rate < 50 OR heart_rate > 120
     OR spo2 < 92;

-- 시간 범위 검색 (BRIN - 대용량 시계열 데이터)
CREATE INDEX idx_vitals_time_brin ON room.vitals USING brin(recorded_at);
```

### 4.2 쿼리 최적화

#### 4.2.1 환자 검색 쿼리

```sql
-- 이름으로 환자 검색 (접두어 + 유사도)
CREATE OR REPLACE FUNCTION search_patients(
  search_term TEXT,
  limit_count INT DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  medical_record_number VARCHAR,
  room_number VARCHAR,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.medical_record_number,
    r.room_number,
    similarity(p.name, search_term) AS similarity
  FROM patient.patients p
  LEFT JOIN room.rooms r ON p.current_room_id = r.id
  WHERE
    p.status = 'ADMITTED'
    AND (
      p.name ILIKE search_term || '%'           -- 접두어 일치 (우선)
      OR p.name % search_term                    -- 유사도 일치 (pg_trgm)
      OR p.medical_record_number ILIKE search_term || '%'
    )
  ORDER BY
    CASE WHEN p.name ILIKE search_term || '%' THEN 0 ELSE 1 END,
    similarity(p.name, search_term) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 사용 예시
SELECT * FROM search_patients('김철', 10);
```

#### 4.2.2 병실 현황 쿼리

```sql
-- 병동별 병실 현황 (Materialized View 활용)
CREATE MATERIALIZED VIEW room.room_status_summary AS
SELECT
  r.id AS room_id,
  r.room_number,
  r.ward_id,
  w.name AS ward_name,
  r.capacity,
  COUNT(a.id) AS occupied,
  r.capacity - COUNT(a.id) AS available,
  ARRAY_AGG(
    jsonb_build_object(
      'patient_id', p.id,
      'patient_name', p.name,
      'bed_number', a.bed_number,
      'admission_date', a.admission_date
    ) ORDER BY a.bed_number
  ) FILTER (WHERE a.id IS NOT NULL) AS patients
FROM room.rooms r
LEFT JOIN room.wards w ON r.ward_id = w.id
LEFT JOIN admission.admissions a ON r.id = a.room_id AND a.status = 'ACTIVE'
LEFT JOIN patient.patients p ON a.patient_id = p.id
GROUP BY r.id, r.room_number, r.ward_id, w.name, r.capacity;

-- 인덱스
CREATE UNIQUE INDEX idx_room_status_room_id ON room.room_status_summary(room_id);
CREATE INDEX idx_room_status_ward ON room.room_status_summary(ward_id);

-- 자동 갱신 (트리거)
CREATE OR REPLACE FUNCTION refresh_room_status()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY room.room_status_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_room_status
AFTER INSERT OR UPDATE OR DELETE ON admission.admissions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_room_status();
```

#### 4.2.3 대시보드 통계 쿼리

```sql
-- 대시보드 통계 (캐시용 View)
CREATE MATERIALIZED VIEW report.dashboard_stats AS
SELECT
  -- 전체 현황
  (SELECT COUNT(*) FROM patient.patients WHERE status = 'ADMITTED') AS total_admitted,
  (SELECT COUNT(*) FROM room.rooms) AS total_rooms,
  (SELECT SUM(capacity) FROM room.rooms) AS total_beds,
  (SELECT COUNT(*) FROM admission.admissions WHERE status = 'ACTIVE') AS occupied_beds,

  -- 오늘 입퇴원
  (SELECT COUNT(*) FROM admission.admissions
   WHERE admission_date::date = CURRENT_DATE) AS today_admissions,
  (SELECT COUNT(*) FROM admission.admissions
   WHERE discharge_date::date = CURRENT_DATE) AS today_discharges,

  -- 이상 바이탈 (최근 1시간)
  (SELECT COUNT(DISTINCT patient_id) FROM room.vitals
   WHERE recorded_at > NOW() - INTERVAL '1 hour'
     AND (temperature < 36.0 OR temperature > 38.5
          OR systolic_bp < 90 OR systolic_bp > 160)) AS abnormal_vitals,

  -- 갱신 시간
  NOW() AS refreshed_at;

-- 5분마다 자동 갱신 (pg_cron 사용)
SELECT cron.schedule('*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY report.dashboard_stats');
```

### 4.3 쿼리 플래닝 최적화

```sql
-- 통계 갱신 (정기적 실행 필요)
ANALYZE patient.patients;
ANALYZE admission.admissions;
ANALYZE room.vitals;

-- 실행 계획 확인
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM search_patients('김', 20);

-- 플래너 설정 최적화
SET random_page_cost = 1.1;  -- SSD 환경
SET effective_cache_size = '8GB';
SET work_mem = '256MB';
```

---

## 5. Redis 캐싱 전략

### 5.1 캐시 구조

```typescript
// redis-cache-keys.ts
export const CacheKeys = {
  // 검색 결과 캐시
  SEARCH_PATIENTS: (term: string) => `search:patients:${term.toLowerCase()}`,
  SEARCH_ROOMS: (wardId: string) => `search:rooms:${wardId}`,

  // 자동완성 캐시
  AUTOCOMPLETE_PATIENTS: 'autocomplete:patients',
  AUTOCOMPLETE_ROOMS: 'autocomplete:rooms',
  AUTOCOMPLETE_DOCTORS: 'autocomplete:doctors',

  // 최근 검색어
  RECENT_SEARCHES: (userId: string) => `recent:searches:${userId}`,

  // 인기 검색어
  POPULAR_SEARCHES: 'popular:searches',

  // 실시간 현황
  DASHBOARD_STATS: 'dashboard:stats',
  ROOM_STATUS: (roomId: string) => `room:status:${roomId}`,
  WARD_STATUS: (wardId: string) => `ward:status:${wardId}`,

  // 환자 상세 캐시
  PATIENT_DETAIL: (patientId: string) => `patient:detail:${patientId}`,
  PATIENT_VITALS: (patientId: string) => `patient:vitals:${patientId}`,
};

export const CacheTTL = {
  SEARCH_RESULTS: 60, // 1분
  AUTOCOMPLETE: 300, // 5분
  RECENT_SEARCHES: 86400, // 24시간
  POPULAR_SEARCHES: 3600, // 1시간
  DASHBOARD_STATS: 30, // 30초
  ROOM_STATUS: 30, // 30초
  PATIENT_DETAIL: 60, // 1분
  PATIENT_VITALS: 30, // 30초
};
```

### 5.2 자동완성 구현

```typescript
// autocomplete-service.ts
@Injectable()
export class AutocompleteService {
  constructor(
    private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  // 자동완성 인덱스 구축
  async buildPatientAutocomplete(): Promise<void> {
    const patients = await this.prisma.patient.findMany({
      where: { status: 'ADMITTED' },
      select: { id: true, name: true, medicalRecordNumber: true },
    });

    const pipeline = this.redis.pipeline();

    // 기존 인덱스 삭제
    await this.redis.del(CacheKeys.AUTOCOMPLETE_PATIENTS);

    // Sorted Set으로 자동완성 구축
    for (const patient of patients) {
      const score = 0; // 모두 동일 점수 (문자열 정렬)

      // 이름의 각 접두어를 인덱스에 추가
      for (let i = 1; i <= patient.name.length; i++) {
        const prefix = patient.name.substring(0, i).toLowerCase();
        pipeline.zadd(
          `${CacheKeys.AUTOCOMPLETE_PATIENTS}:${prefix}`,
          score,
          JSON.stringify({
            id: patient.id,
            name: patient.name,
            mrn: patient.medicalRecordNumber,
          }),
        );
      }
    }

    await pipeline.exec();
  }

  // 자동완성 검색
  async searchAutocomplete(prefix: string, limit: number = 10): Promise<AutocompleteResult[]> {
    const cacheKey = `${CacheKeys.AUTOCOMPLETE_PATIENTS}:${prefix.toLowerCase()}`;

    const results = await this.redis.zrange(cacheKey, 0, limit - 1);

    if (results.length === 0) {
      // 캐시 미스 시 DB 직접 조회
      return this.searchPatientsByPrefix(prefix, limit);
    }

    return results.map((r) => JSON.parse(r));
  }

  // 최근 검색어 저장
  async saveRecentSearch(userId: string, term: string): Promise<void> {
    const key = CacheKeys.RECENT_SEARCHES(userId);
    const now = Date.now();

    await this.redis
      .pipeline()
      .zadd(key, now, term)
      .zremrangebyrank(key, 0, -11) // 최근 10개만 유지
      .expire(key, CacheTTL.RECENT_SEARCHES)
      .exec();
  }

  // 최근 검색어 조회
  async getRecentSearches(userId: string, limit: number = 5): Promise<string[]> {
    const key = CacheKeys.RECENT_SEARCHES(userId);
    return this.redis.zrevrange(key, 0, limit - 1);
  }

  // 인기 검색어 업데이트
  async updatePopularSearch(term: string): Promise<void> {
    await this.redis.zincrby(CacheKeys.POPULAR_SEARCHES, 1, term.toLowerCase());
  }

  // 인기 검색어 조회
  async getPopularSearches(limit: number = 10): Promise<PopularSearch[]> {
    const results = await this.redis.zrevrange(
      CacheKeys.POPULAR_SEARCHES,
      0,
      limit - 1,
      'WITHSCORES',
    );

    const searches: PopularSearch[] = [];
    for (let i = 0; i < results.length; i += 2) {
      searches.push({
        term: results[i],
        count: parseInt(results[i + 1]),
      });
    }

    return searches;
  }
}
```

### 5.3 검색 결과 캐싱

```typescript
// search-cache-service.ts
@Injectable()
export class SearchCacheService {
  constructor(private readonly redis: Redis) {}

  // 검색 결과 캐싱
  async cacheSearchResult<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CacheTTL.SEARCH_RESULTS,
  ): Promise<T> {
    const cached = await this.redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const result = await fetcher();

    await this.redis.setex(key, ttl, JSON.stringify(result));

    return result;
  }

  // 캐시 무효화
  async invalidatePatientCache(patientId: string): Promise<void> {
    const patterns = [
      CacheKeys.PATIENT_DETAIL(patientId),
      CacheKeys.PATIENT_VITALS(patientId),
      'search:patients:*', // 검색 결과 전체 무효화
    ];

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  // 병실 상태 변경 시 캐시 무효화
  async invalidateRoomCache(roomId: string, wardId: string): Promise<void> {
    await Promise.all([
      this.redis.del(CacheKeys.ROOM_STATUS(roomId)),
      this.redis.del(CacheKeys.WARD_STATUS(wardId)),
      this.redis.del(CacheKeys.DASHBOARD_STATS),
    ]);
  }
}
```

---

## 6. 전문 검색 (Full-Text Search)

### 6.1 PostgreSQL FTS 설정

```sql
-- 한국어 검색 설정
CREATE TEXT SEARCH CONFIGURATION korean (COPY = simple);

-- 간호 기록 검색 인덱스
ALTER TABLE rounding.nursing_notes
ADD COLUMN search_vector tsvector;

CREATE INDEX idx_nursing_notes_search
ON rounding.nursing_notes USING gin(search_vector);

-- 검색 벡터 업데이트 트리거
CREATE OR REPLACE FUNCTION update_nursing_notes_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('korean', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('korean', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('korean', COALESCE(NEW.assessment, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nursing_notes_search
BEFORE INSERT OR UPDATE ON rounding.nursing_notes
FOR EACH ROW EXECUTE FUNCTION update_nursing_notes_search();
```

### 6.2 전문 검색 쿼리

```sql
-- 간호 기록 검색 함수
CREATE OR REPLACE FUNCTION search_nursing_notes(
  search_query TEXT,
  patient_id_filter UUID DEFAULT NULL,
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL,
  limit_count INT DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  patient_id UUID,
  patient_name VARCHAR,
  title VARCHAR,
  content_snippet TEXT,
  created_at TIMESTAMP,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nn.id,
    nn.patient_id,
    p.name AS patient_name,
    nn.title,
    ts_headline('korean', nn.content, plainto_tsquery('korean', search_query),
      'MaxWords=50, MinWords=20, StartSel=<mark>, StopSel=</mark>'
    ) AS content_snippet,
    nn.created_at,
    ts_rank(nn.search_vector, plainto_tsquery('korean', search_query)) AS rank
  FROM rounding.nursing_notes nn
  JOIN patient.patients p ON nn.patient_id = p.id
  WHERE
    nn.search_vector @@ plainto_tsquery('korean', search_query)
    AND (patient_id_filter IS NULL OR nn.patient_id = patient_id_filter)
    AND (date_from IS NULL OR nn.created_at::date >= date_from)
    AND (date_to IS NULL OR nn.created_at::date <= date_to)
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 사용 예시
SELECT * FROM search_nursing_notes('발열 해열제', NULL, '2026-01-01', NULL, 10);
```

### 6.3 pg_trgm 유사도 검색

```sql
-- pg_trgm 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 유사도 검색 설정
SET pg_trgm.similarity_threshold = 0.3;

-- 환자 이름 유사도 검색
SELECT
  id,
  name,
  medical_record_number,
  similarity(name, '김철수') AS sim
FROM patient.patients
WHERE name % '김철수'
ORDER BY sim DESC
LIMIT 10;

-- 오타 교정 검색
CREATE OR REPLACE FUNCTION suggest_patient_name(input_name TEXT)
RETURNS TABLE(
  suggested_name VARCHAR,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.name,
    similarity(p.name, input_name)
  FROM patient.patients p
  WHERE similarity(p.name, input_name) > 0.3
  ORDER BY similarity(p.name, input_name) DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 7. 실시간 검색

### 7.1 디바운싱 및 스로틀링

```typescript
// search-controller.ts
@Controller('api/search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly throttler: ThrottlerGuard,
  ) {}

  @Get('patients')
  @Throttle(10, 1) // 초당 10회 제한
  async searchPatients(
    @Query('q') query: string,
    @Query('limit') limit: number = 20,
  ): Promise<PatientSearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    return this.searchService.searchPatients(query, limit);
  }

  @Get('autocomplete')
  @Throttle(20, 1) // 초당 20회 제한 (타이핑 빈도 고려)
  async autocomplete(
    @Query('q') query: string,
    @Query('type') type: 'patient' | 'room' | 'doctor' = 'patient',
  ): Promise<AutocompleteResult[]> {
    if (!query || query.length < 1) {
      return [];
    }

    return this.searchService.autocomplete(query, type);
  }
}
```

```typescript
// Frontend: useDebounce 훅
export function useSearch(delay: number = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useMemo(
    () =>
      debounce((q: string) => {
        if (q.length >= 2) {
          setIsLoading(true);
          searchPatients(q)
            .then(setResults)
            .finally(() => setIsLoading(false));
        } else {
          setResults([]);
        }
      }, delay),
    [delay],
  );

  useEffect(() => {
    debouncedQuery(query);
    return () => debouncedQuery.cancel();
  }, [query, debouncedQuery]);

  return { query, setQuery, results, isLoading };
}
```

### 7.2 Optimistic UI

```typescript
// optimistic-search.tsx
export function PatientSearchWithOptimistic() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [cachedResults, setCachedResults] = useState<Map<string, PatientSearchResult[]>>(new Map());

  const handleSearch = async (newQuery: string) => {
    setQuery(newQuery);

    // 1. 캐시된 결과 즉시 표시 (Optimistic)
    const cached = cachedResults.get(newQuery);
    if (cached) {
      setResults(cached);
      return;
    }

    // 2. 접두어 기반 임시 결과 표시
    const prefixResults = findCachedByPrefix(cachedResults, newQuery);
    if (prefixResults.length > 0) {
      setResults(prefixResults.filter(r =>
        r.name.toLowerCase().includes(newQuery.toLowerCase())
      ));
    }

    // 3. 서버 검색 및 캐시 업데이트
    try {
      const serverResults = await searchPatients(newQuery);
      setResults(serverResults);
      setCachedResults(prev => new Map(prev).set(newQuery, serverResults));
    } catch (error) {
      // 에러 시 캐시된 결과 유지
      console.error('Search failed:', error);
    }
  };

  return (
    <SearchInput
      value={query}
      onChange={handleSearch}
      results={results}
    />
  );
}
```

---

## 8. 성능 모니터링

### 8.1 쿼리 성능 추적

```sql
-- 슬로우 쿼리 로깅 설정
ALTER SYSTEM SET log_min_duration_statement = 100; -- 100ms 이상
ALTER SYSTEM SET log_statement = 'none';
ALTER SYSTEM SET log_duration = off;
SELECT pg_reload_conf();

-- 슬로우 쿼리 분석 뷰
CREATE VIEW monitoring.slow_queries AS
SELECT
    query,
    calls,
    total_time / 1000 AS total_seconds,
    mean_time AS avg_ms,
    max_time AS max_ms,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio
FROM pg_stat_statements
WHERE mean_time > 100 -- 100ms 이상
ORDER BY total_time DESC
LIMIT 20;
```

### 8.2 검색 메트릭

```typescript
// search-metrics.ts
@Injectable()
export class SearchMetricsService {
  private readonly metrics = new Map<string, SearchMetric>();

  recordSearch(
    searchType: string,
    durationMs: number,
    resultCount: number,
    cacheHit: boolean,
  ): void {
    const key = searchType;
    const existing = this.metrics.get(key) || {
      totalCalls: 0,
      totalDurationMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgResultCount: 0,
    };

    existing.totalCalls++;
    existing.totalDurationMs += durationMs;
    existing.avgResultCount =
      (existing.avgResultCount * (existing.totalCalls - 1) + resultCount) / existing.totalCalls;

    if (cacheHit) {
      existing.cacheHits++;
    } else {
      existing.cacheMisses++;
    }

    this.metrics.set(key, existing);
  }

  getMetrics(): Record<string, SearchMetricSummary> {
    const result: Record<string, SearchMetricSummary> = {};

    for (const [key, metric] of this.metrics) {
      result[key] = {
        totalCalls: metric.totalCalls,
        avgDurationMs: metric.totalDurationMs / metric.totalCalls,
        cacheHitRate: metric.cacheHits / (metric.cacheHits + metric.cacheMisses),
        avgResultCount: metric.avgResultCount,
      };
    }

    return result;
  }
}

// Prometheus 메트릭 노출
@Injectable()
export class PrometheusSearchMetrics {
  private readonly searchDuration = new Histogram({
    name: 'search_duration_seconds',
    help: 'Search request duration in seconds',
    labelNames: ['search_type', 'cache_hit'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  });

  private readonly searchResults = new Histogram({
    name: 'search_result_count',
    help: 'Number of search results returned',
    labelNames: ['search_type'],
    buckets: [0, 1, 5, 10, 20, 50, 100],
  });

  recordSearch(
    searchType: string,
    durationMs: number,
    resultCount: number,
    cacheHit: boolean,
  ): void {
    this.searchDuration.observe(
      { search_type: searchType, cache_hit: String(cacheHit) },
      durationMs / 1000,
    );
    this.searchResults.observe({ search_type: searchType }, resultCount);
  }
}
```

### 8.3 알림 설정

```yaml
# prometheus-alerts.yml
groups:
  - name: search_performance
    rules:
      - alert: SlowSearchQueries
        expr: histogram_quantile(0.95, search_duration_seconds) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'Search queries are slow'
          description: 'P95 search latency is {{ $value }}s'

      - alert: HighSearchErrorRate
        expr: rate(search_errors_total[5m]) / rate(search_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'High search error rate'
          description: 'Search error rate is {{ $value | humanizePercentage }}'

      - alert: LowCacheHitRate
        expr: search_cache_hit_ratio < 0.7
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: 'Low search cache hit rate'
          description: 'Cache hit rate is {{ $value | humanizePercentage }}'
```

---

## 9. 확장 전략

### 9.1 Phase 3+ Elasticsearch 도입

```typescript
// elasticsearch-service.ts (Phase 3+)
@Injectable()
export class ElasticsearchService {
  private readonly client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL,
      auth: {
        username: process.env.ES_USERNAME,
        password: process.env.ES_PASSWORD,
      },
    });
  }

  // 인덱스 생성
  async createPatientIndex(): Promise<void> {
    await this.client.indices.create({
      index: 'patients',
      body: {
        settings: {
          analysis: {
            analyzer: {
              korean: {
                type: 'custom',
                tokenizer: 'nori_tokenizer',
                filter: ['nori_part_of_speech'],
              },
            },
          },
        },
        mappings: {
          properties: {
            name: {
              type: 'text',
              analyzer: 'korean',
              fields: {
                keyword: { type: 'keyword' },
                suggest: {
                  type: 'completion',
                  analyzer: 'korean',
                },
              },
            },
            medicalRecordNumber: { type: 'keyword' },
            diagnosis: {
              type: 'text',
              analyzer: 'korean',
            },
            admissionDate: { type: 'date' },
            roomNumber: { type: 'keyword' },
            wardId: { type: 'keyword' },
            status: { type: 'keyword' },
          },
        },
      },
    });
  }

  // 복합 검색
  async searchPatients(query: SearchQuery): Promise<SearchResult> {
    const response = await this.client.search({
      index: 'patients',
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: query.term,
                  fields: ['name^3', 'diagnosis', 'medicalRecordNumber'],
                  fuzziness: 'AUTO',
                },
              },
            ],
            filter: [
              { term: { status: 'ADMITTED' } },
              ...(query.wardId ? [{ term: { wardId: query.wardId } }] : []),
            ],
          },
        },
        highlight: {
          fields: {
            name: {},
            diagnosis: {},
          },
        },
        suggest: {
          patient_suggest: {
            prefix: query.term,
            completion: {
              field: 'name.suggest',
              size: 5,
            },
          },
        },
      },
    });

    return this.mapSearchResponse(response);
  }
}
```

### 9.2 읽기 전용 복제본

```yaml
# PostgreSQL 읽기 복제본 설정
primary:
  host: db-primary.hospital.local
  write: true

replicas:
  - host: db-replica-1.hospital.local
    read: true
    searchQueries: true

  - host: db-replica-2.hospital.local
    read: true
    reportQueries: true
```

```typescript
// 읽기/쓰기 분리
@Injectable()
export class SearchRepository {
  constructor(
    @InjectDataSource('read')
    private readonly readDataSource: DataSource,

    @InjectDataSource('write')
    private readonly writeDataSource: DataSource,
  ) {}

  async searchPatients(query: string): Promise<Patient[]> {
    // 읽기 전용 복제본 사용
    return this.readDataSource.query('SELECT * FROM search_patients($1)', [query]);
  }

  async updatePatient(id: string, data: UpdatePatientDto): Promise<void> {
    // 쓰기는 Primary 사용
    await this.writeDataSource.query('UPDATE patient.patients SET ... WHERE id = $1', [id]);
  }
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
> - [database-design.kr.md](database-design.kr.md) - 데이터베이스 설계
> - [api-specification.kr.md](api-specification.kr.md) - API 명세
