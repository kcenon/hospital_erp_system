# 인시던트 대응 Runbook

---

## 문서 정보

| 항목      | 내용                         |
| --------- | ---------------------------- |
| 문서 버전 | 1.0.0                        |
| 작성일    | 2026-01-12                   |
| 상태      | 초안                         |
| 관리자    | kcenon@naver.com             |
| 표준 기준 | NIST Incident Response, ITIL |

---

## 문서 이력

| 버전  | 일자       | 작성자 | 변경 내용                     |
| ----- | ---------- | ------ | ----------------------------- |
| 1.0.0 | 2026-01-12 | -      | 초안 작성 (갭 분석 기반 신규) |

---

## 목차

1. [개요](#1-개요)
2. [인시던트 분류](#2-인시던트-분류)
3. [대응 조직](#3-대응-조직)
4. [일반 대응 절차](#4-일반-대응-절차)
5. [데이터베이스 장애](#5-데이터베이스-장애)
6. [Redis 장애](#6-redis-장애)
7. [API 성능 저하](#7-api-성능-저하)
8. [보안 인시던트](#8-보안-인시던트)
9. [네트워크 장애](#9-네트워크-장애)
10. [사후 조치](#10-사후-조치)

---

## 1. 개요

### 1.1 목적

본 문서는 입원환자 관리 ERP 시스템의 **인시던트 대응 절차(Runbook)**를 정의합니다. 의료 시스템의 특성상 신속한 복구와 데이터 무결성이 환자 안전에 직결됩니다.

### 1.2 적용 범위

```
Runbook 적용 대상 시스템
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. PostgreSQL Primary/Replica
2. Redis Cluster
3. API Server (NestJS)
4. Web Server (Next.js)
5. Load Balancer (ALB)
6. CDN (CloudFront)
7. S3 Storage
8. VPN / Network
```

### 1.3 연락처

| 역할              | 담당자 | 연락처        | 비상연락             |
| ----------------- | ------ | ------------- | -------------------- |
| **인프라 책임자** | OOO    | xxx-xxxx-xxxx | 1순위                |
| **DBA**           | OOO    | xxx-xxxx-xxxx | DB 장애 시           |
| **보안 담당**     | OOO    | xxx-xxxx-xxxx | 보안 인시던트 시     |
| **개발 리드**     | OOO    | xxx-xxxx-xxxx | 애플리케이션 장애 시 |
| **AWS Support**   | -      | AWS Console   | 인프라 장애 시       |

---

## 2. 인시던트 분류

### 2.1 심각도 수준

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Incident Severity Levels                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  P1 - Critical (긴급)                                        │    │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │    │
│  │  • 전체 서비스 불가                                          │    │
│  │  • 환자 데이터 유출/손실 위험                                │    │
│  │  • 응답 시간: 15분 이내                                      │    │
│  │  • 복구 목표: 1시간 이내                                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  P2 - High (높음)                                            │    │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │    │
│  │  • 주요 기능 장애 (바이탈 입력, 검사결과 조회 등)            │    │
│  │  • 성능 심각 저하 (응답 > 5초)                               │    │
│  │  • 응답 시간: 30분 이내                                      │    │
│  │  • 복구 목표: 4시간 이내                                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  P3 - Medium (중간)                                          │    │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │    │
│  │  • 부분 기능 장애                                            │    │
│  │  • 성능 저하 (응답 2-5초)                                    │    │
│  │  • 응답 시간: 2시간 이내                                     │    │
│  │  • 복구 목표: 24시간 이내                                    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  P4 - Low (낮음)                                             │    │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │    │
│  │  • 사소한 기능 오류                                          │    │
│  │  • 우회 가능한 문제                                          │    │
│  │  • 응답 시간: 다음 영업일                                    │    │
│  │  • 복구 목표: 1주일 이내                                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 인시던트 유형별 분류

| 유형             | 예시                                | 기본 심각도 |
| ---------------- | ----------------------------------- | ----------- |
| **인프라**       | DB 장애, 네트워크 단절, 서버 다운   | P1~P2       |
| **애플리케이션** | API 오류, 메모리 누수, 무한 루프    | P2~P3       |
| **보안**         | 데이터 유출, 무단 접근, DDoS        | P1~P2       |
| **데이터**       | 데이터 손상, 백업 실패, 동기화 오류 | P1~P2       |
| **성능**         | 느린 응답, 타임아웃, 리소스 부족    | P2~P3       |
| **외부 연동**    | EMR 연동 실패, SMS 발송 실패        | P2~P3       |

---

## 3. 대응 조직

### 3.1 조직 구성

```
┌─────────────────────────────────────────────────────────────────────┐
│                 Incident Response Organization                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                    ┌────────────────────┐                           │
│                    │  인시던트 커맨더   │                           │
│                    │  (Incident Commander)                          │
│                    └─────────┬──────────┘                           │
│                              │                                       │
│         ┌────────────────────┼────────────────────┐                 │
│         │                    │                    │                  │
│         ▼                    ▼                    ▼                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │  기술 리드   │    │  커뮤니케이션 │    │   기록 담당  │          │
│  │  (Tech Lead) │    │  (Comm Lead)  │    │  (Scribe)    │          │
│  └──────┬───────┘    └──────────────┘    └──────────────┘          │
│         │                                                            │
│    ┌────┴────┐                                                      │
│    │         │                                                       │
│    ▼         ▼                                                       │
│ ┌─────┐  ┌─────┐                                                    │
│ │ 인프라│  │ 개발 │                                                    │
│ │ 팀   │  │ 팀   │                                                    │
│ └─────┘  └─────┘                                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 역할별 책임

| 역할                  | 책임                                   |
| --------------------- | -------------------------------------- |
| **인시던트 커맨더**   | 전체 대응 지휘, 의사결정, 에스컬레이션 |
| **기술 리드**         | 기술적 분석 및 복구 조율               |
| **커뮤니케이션 리드** | 이해관계자 소통, 상황 업데이트         |
| **기록 담당**         | 타임라인 기록, 조치 사항 문서화        |
| **인프라 팀**         | 서버, 네트워크, 클라우드 리소스 관리   |
| **개발 팀**           | 애플리케이션 레벨 문제 해결            |

### 3.3 에스컬레이션 매트릭스

| 경과 시간 | P1             | P2            | P3            |
| --------- | -------------- | ------------- | ------------- |
| 15분      | 팀장 → 본부장  | 팀장          | -             |
| 30분      | 본부장 → CTO   | 팀장 → 본부장 | 팀장          |
| 1시간     | CTO → CEO      | 본부장 → CTO  | 팀장 → 본부장 |
| 2시간     | 외부 지원 검토 | CTO           | 본부장        |

---

## 4. 일반 대응 절차

### 4.1 인시던트 대응 플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Incident Response Flow                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    ┌───────────────┐                                                │
│ 1. │ 감지 (Detect) │ ◀── 모니터링 알림 / 사용자 신고               │
│    └───────┬───────┘                                                │
│            │                                                         │
│            ▼                                                         │
│    ┌───────────────┐                                                │
│ 2. │ 분류 (Triage) │ ◀── 심각도/유형 판단, 담당자 배정              │
│    └───────┬───────┘                                                │
│            │                                                         │
│            ▼                                                         │
│    ┌───────────────┐                                                │
│ 3. │ 봉쇄 (Contain)│ ◀── 피해 확산 방지, 임시 조치                  │
│    └───────┬───────┘                                                │
│            │                                                         │
│            ▼                                                         │
│    ┌────────────────────┐                                           │
│ 4. │ 근본원인 분석      │ ◀── 로그 분석, 디버깅                     │
│    │ (Root Cause)       │                                           │
│    └───────┬────────────┘                                           │
│            │                                                         │
│            ▼                                                         │
│    ┌───────────────┐                                                │
│ 5. │ 복구 (Recover)│ ◀── 수정 배포, 서비스 복원                     │
│    └───────┬───────┘                                                │
│            │                                                         │
│            ▼                                                         │
│    ┌───────────────┐                                                │
│ 6. │ 검증 (Verify) │ ◀── 정상 작동 확인, 모니터링                   │
│    └───────┬───────┘                                                │
│            │                                                         │
│            ▼                                                         │
│    ┌───────────────────────┐                                        │
│ 7. │ 사후분석 (Postmortem) │ ◀── 재발 방지, 문서화                  │
│    └───────────────────────┘                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 인시던트 선언 체크리스트

```markdown
## 인시던트 선언 체크리스트

### 1. 초기 정보 수집

- [ ] 증상 확인 (어떤 문제가 발생했는가?)
- [ ] 영향 범위 (어떤 서비스/사용자가 영향을 받는가?)
- [ ] 시작 시점 (언제부터 발생했는가?)
- [ ] 심각도 판단 (P1/P2/P3/P4)

### 2. 인시던트 채널 생성

- [ ] Slack 채널: #incident-YYYY-MM-DD-설명
- [ ] 인시던트 커맨더 지정
- [ ] 참여자 소집

### 3. 초기 조치

- [ ] 사용자 공지 (필요시)
- [ ] 임시 조치 적용 (필요시)
- [ ] 타임라인 기록 시작

### 4. 에스컬레이션

- [ ] 관련 팀 통보
- [ ] 경영진 보고 (P1/P2)
```

---

## 5. 데이터베이스 장애

### 5.1 PostgreSQL Primary 장애

#### 증상

- API 응답 없음 또는 500 에러
- `connection refused` 또는 `too many connections` 에러
- CloudWatch RDS 메트릭 이상

#### 진단

```bash
# 1. RDS 인스턴스 상태 확인
aws rds describe-db-instances \
  --db-instance-identifier hospital-erp-primary \
  --query 'DBInstances[0].DBInstanceStatus'

# 2. 연결 수 확인
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT count(*) FROM pg_stat_activity;"

# 3. 활성 쿼리 확인
psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY duration DESC
LIMIT 10;"

# 4. 디스크 사용량 확인
psql -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname))
FROM pg_database ORDER BY pg_database_size(pg_database.datname) DESC;"

# 5. RDS 이벤트 로그 확인
aws rds describe-events \
  --source-identifier hospital-erp-primary \
  --source-type db-instance \
  --duration 60
```

#### 복구 절차

**시나리오 1: 연결 풀 소진**

```bash
# 1. 유휴 연결 종료
psql -c "SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < NOW() - INTERVAL '10 minutes';"

# 2. API 서버 재시작 (연결 풀 초기화)
aws ecs update-service --cluster hospital-erp --service api \
  --force-new-deployment

# 3. 연결 풀 설정 확인 및 조정
# prisma.schema의 connection_limit 확인
```

**시나리오 2: Primary 인스턴스 다운**

```bash
# 1. Replica가 있는 경우 - Failover 실행
aws rds failover-db-cluster \
  --db-cluster-identifier hospital-erp-cluster

# 2. Failover 완료 대기 (약 1-2분)
aws rds wait db-instance-available \
  --db-instance-identifier hospital-erp-primary

# 3. 애플리케이션 엔드포인트 확인
# (RDS Cluster Endpoint는 자동으로 새 Primary를 가리킴)

# 4. 데이터 무결성 확인
psql -c "SELECT MAX(created_at) FROM patient.patients;"
psql -c "SELECT MAX(recorded_at) FROM room.vitals;"
```

**시나리오 3: 디스크 풀**

```bash
# 1. 불필요한 데이터 정리 (임시 테이블, 로그 등)
psql -c "TRUNCATE TABLE audit.api_logs WHERE created_at < NOW() - INTERVAL '90 days';"

# 2. VACUUM 실행
psql -c "VACUUM FULL;"

# 3. 스토리지 확장 (RDS)
aws rds modify-db-instance \
  --db-instance-identifier hospital-erp-primary \
  --allocated-storage 500 \
  --apply-immediately
```

### 5.2 PostgreSQL 성능 저하

#### 진단

```bash
# 1. 슬로우 쿼리 확인
psql -c "SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;"

# 2. 잠금 대기 확인
psql -c "SELECT blocked.pid, blocked.query, blocking.pid as blocking_pid, blocking.query as blocking_query
FROM pg_catalog.pg_locks blockedl
JOIN pg_stat_activity blocked ON blockedl.pid = blocked.pid
JOIN pg_catalog.pg_locks blockingl ON blockingl.locktype = blockedl.locktype
  AND blockedl.database IS NOT DISTINCT FROM blockingl.database
  AND blockedl.relation IS NOT DISTINCT FROM blockingl.relation
JOIN pg_stat_activity blocking ON blockingl.pid = blocking.pid
WHERE NOT blockedl.granted AND blocking.pid != blocked.pid;"

# 3. 테이블 bloat 확인
psql -c "SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;"
```

#### 복구 절차

```bash
# 1. 문제 쿼리 강제 종료
psql -c "SELECT pg_cancel_backend(PID);"  # 쿼리만 취소
psql -c "SELECT pg_terminate_backend(PID);"  # 연결 종료

# 2. 누락된 인덱스 생성 (Online)
psql -c "CREATE INDEX CONCURRENTLY idx_xxx ON table (column);"

# 3. 통계 갱신
psql -c "ANALYZE table_name;"

# 4. Bloat 심한 테이블 VACUUM
psql -c "VACUUM (VERBOSE, ANALYZE) table_name;"
```

---

## 6. Redis 장애

### 6.1 Redis 연결 실패

#### 증상

- 세션 유지 안됨 (자동 로그아웃)
- 실시간 업데이트 중단
- 캐시 미스율 급증

#### 진단

```bash
# 1. ElastiCache 상태 확인
aws elasticache describe-cache-clusters \
  --cache-cluster-id hospital-erp-redis \
  --show-cache-node-info

# 2. Redis 연결 테스트
redis-cli -h $REDIS_HOST -p 6379 ping

# 3. 메모리 사용량 확인
redis-cli INFO memory | grep used_memory_human

# 4. 연결 수 확인
redis-cli CLIENT LIST | wc -l

# 5. Slow Log 확인
redis-cli SLOWLOG GET 10
```

#### 복구 절차

**시나리오 1: 연결 문제**

```bash
# 1. Security Group 확인
aws ec2 describe-security-groups \
  --group-ids sg-xxxxx \
  --query 'SecurityGroups[0].IpPermissions'

# 2. API 서버에서 Redis 연결 설정 확인
# ioredis connection pool 설정 점검

# 3. Failover 실행 (Cluster Mode)
aws elasticache failover-shard \
  --cache-cluster-id hospital-erp-redis \
  --shard-id 0001
```

**시나리오 2: 메모리 부족**

```bash
# 1. 메모리 정책 확인
redis-cli CONFIG GET maxmemory-policy

# 2. 큰 키 식별
redis-cli --bigkeys

# 3. 만료된 키 정리
redis-cli SCAN 0 MATCH "*" COUNT 1000

# 4. 필요시 maxmemory 조정
aws elasticache modify-cache-cluster \
  --cache-cluster-id hospital-erp-redis \
  --cache-node-type cache.r6g.large \
  --apply-immediately
```

### 6.2 Redis 데이터 손실 복구

```bash
# 1. 마지막 스냅샷 확인
aws elasticache describe-snapshots \
  --cache-cluster-id hospital-erp-redis

# 2. 스냅샷에서 복원
aws elasticache create-cache-cluster \
  --cache-cluster-id hospital-erp-redis-restored \
  --snapshot-name hospital-erp-redis-snapshot-20260112

# 3. 애플리케이션 엔드포인트 변경
# 환경 변수 REDIS_HOST 업데이트 후 재배포
```

---

## 7. API 성능 저하

### 7.1 API 응답 지연

#### 증상

- API 응답 시간 > 2초
- 타임아웃 에러 증가
- 사용자 불만 접수

#### 진단

```bash
# 1. API 서버 리소스 확인
aws ecs describe-services --cluster hospital-erp --services api \
  --query 'services[0].runningCount'

# 2. CloudWatch 메트릭 확인
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=api \
  --start-time $(date -u -v-1H '+%Y-%m-%dT%H:%M:%SZ') \
  --end-time $(date -u '+%Y-%m-%dT%H:%M:%SZ') \
  --period 300 \
  --statistics Average

# 3. 애플리케이션 로그 확인
aws logs filter-log-events \
  --log-group-name /ecs/hospital-erp-api \
  --filter-pattern "ERROR" \
  --start-time $(date -u -v-1H '+%s000')

# 4. 특정 엔드포인트 응답 시간 확인
curl -w "@curl-format.txt" -o /dev/null -s \
  "https://api.hospital.example.com/api/patients"
```

#### 복구 절차

**시나리오 1: CPU 과부하**

```bash
# 1. Auto Scaling 확인 및 수동 스케일 아웃
aws ecs update-service --cluster hospital-erp --service api \
  --desired-count 6

# 2. 특정 무거운 요청 식별 및 제한
# Rate Limiting 임시 강화

# 3. 비동기 처리 가능한 작업 분리
# Bull Queue 사용 확인
```

**시나리오 2: 메모리 누수**

```bash
# 1. 힙 덤프 수집 (Node.js)
# NODE_OPTIONS='--inspect' 로 시작된 경우
# Chrome DevTools에서 힙 스냅샷 수집

# 2. 메모리 사용량 급증 시 롤링 재시작
aws ecs update-service --cluster hospital-erp --service api \
  --force-new-deployment

# 3. 이전 버전으로 롤백 (필요시)
aws ecs update-service --cluster hospital-erp --service api \
  --task-definition hospital-erp-api:PREVIOUS_VERSION
```

### 7.2 API 완전 중단

```bash
# 1. ALB 헬스체크 상태 확인
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:...

# 2. ECS 태스크 상태 확인
aws ecs list-tasks --cluster hospital-erp --service-name api \
  --desired-status RUNNING

# 3. 태스크 로그 확인
aws logs tail /ecs/hospital-erp-api --since 5m

# 4. 서비스 강제 재시작
aws ecs update-service --cluster hospital-erp --service api \
  --force-new-deployment

# 5. 롤백 (이전 버전 배포)
aws ecs update-service --cluster hospital-erp --service api \
  --task-definition hospital-erp-api:42  # 이전 안정 버전
```

---

## 8. 보안 인시던트

### 8.1 무단 접근 시도 감지

#### 증상

- 다수의 로그인 실패 로그
- 비정상적인 API 호출 패턴
- WAF 알림

#### 진단

```bash
# 1. 의심스러운 IP 확인
aws wafv2 get-sampled-requests \
  --web-acl-arn $WAF_ARN \
  --rule-metric-name IPRateLimit \
  --scope REGIONAL \
  --time-window StartTime=$(date -u -v-1H '+%Y-%m-%dT%H:%M:%SZ'),EndTime=$(date -u '+%Y-%m-%dT%H:%M:%SZ') \
  --max-items 100

# 2. 로그인 실패 분석
aws logs filter-log-events \
  --log-group-name /ecs/hospital-erp-api \
  --filter-pattern '"LOGIN_FAILED"' \
  --start-time $(date -u -v-1H '+%s000')

# 3. 특정 IP의 요청 패턴 확인
aws logs filter-log-events \
  --log-group-name /ecs/hospital-erp-api \
  --filter-pattern '{ $.ip = "SUSPICIOUS_IP" }'
```

#### 대응 절차

```bash
# 1. 즉시 IP 차단 (WAF)
aws wafv2 update-ip-set \
  --scope REGIONAL \
  --id $IP_SET_ID \
  --name BlockedIPs \
  --addresses "SUSPICIOUS_IP/32"

# 2. 영향받은 계정 확인 및 잠금
# SQL: UPDATE auth.users SET is_locked = TRUE WHERE last_failed_ip = 'SUSPICIOUS_IP';

# 3. 세션 무효화
redis-cli KEYS "session:*" | xargs redis-cli DEL

# 4. 비밀번호 재설정 강제 (필요시)
# 영향받은 사용자에게 비밀번호 변경 요청 발송

# 5. 보안팀 및 CSIRT 보고
```

### 8.2 데이터 유출 의심

#### 즉시 조치

```bash
# 1. 의심스러운 사용자/세션 즉시 차단
redis-cli DEL "session:SUSPICIOUS_SESSION_ID"

# 2. 대량 데이터 조회 로그 확인
aws logs filter-log-events \
  --log-group-name /ecs/hospital-erp-api \
  --filter-pattern '{ $.endpoint = "/api/patients" && $.resultCount > 100 }'

# 3. DB 감사 로그 확인
psql -c "SELECT * FROM audit.access_logs
WHERE action = 'SELECT' AND affected_rows > 100
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;"

# 4. 증거 보존
aws s3 cp s3://hospital-erp-logs/access-logs/$(date '+%Y/%m/%d')/ \
  s3://hospital-erp-forensics/incident-$(date '+%Y%m%d')/ --recursive

# 5. 개인정보보호위원회 신고 준비 (72시간 내)
```

### 8.3 랜섬웨어/악성코드 감염

```bash
# 1. 즉시 격리
# 감염 의심 서버 네트워크 격리

# 2. 최근 백업 확인
aws rds describe-db-snapshots \
  --db-instance-identifier hospital-erp-primary \
  --query 'DBSnapshots[-5:]'

# 3. 클린 환경에서 복원
# 별도 VPC에 새 인스턴스 생성 후 백업 복원

# 4. 포렌식 분석을 위한 증거 보존
# 감염된 디스크 스냅샷 생성
aws ec2 create-snapshot --volume-id vol-xxx --description "Forensics"

# 5. 전문 보안업체 연락 및 수사기관 신고
```

---

## 9. 네트워크 장애

### 9.1 VPC/서브넷 연결 문제

#### 진단

```bash
# 1. VPC Flow Logs 확인
aws ec2 describe-flow-logs --filter "Name=resource-id,Values=vpc-xxx"

# 2. 라우팅 테이블 확인
aws ec2 describe-route-tables \
  --filters "Name=vpc-id,Values=vpc-xxx"

# 3. NAT Gateway 상태 확인
aws ec2 describe-nat-gateways \
  --filter "Name=vpc-id,Values=vpc-xxx"

# 4. VPC Endpoint 상태 확인
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=vpc-xxx"
```

#### 복구 절차

```bash
# 1. NAT Gateway 재생성 (장애 시)
aws ec2 create-nat-gateway \
  --subnet-id subnet-xxx \
  --allocation-id eipalloc-xxx

# 2. 라우팅 테이블 업데이트
aws ec2 replace-route \
  --route-table-id rtb-xxx \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id nat-new-xxx
```

### 9.2 DNS 문제

```bash
# 1. Route 53 헬스체크 상태 확인
aws route53 get-health-check-status \
  --health-check-id $HEALTH_CHECK_ID

# 2. DNS 레코드 확인
aws route53 list-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --query "ResourceRecordSets[?Name == 'api.hospital.example.com.']"

# 3. DNS 해석 테스트
dig api.hospital.example.com @8.8.8.8

# 4. 긴급: 정적 IP로 임시 전환 (필요시)
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.hospital.example.com",
        "Type": "A",
        "TTL": 60,
        "ResourceRecords": [{"Value": "BACKUP_IP"}]
      }
    }]
  }'
```

---

## 10. 사후 조치

### 10.1 사후분석 (Postmortem) 템플릿

```markdown
# 인시던트 사후분석 보고서

## 개요

- **인시던트 ID**: INC-2026-0112-001
- **발생일시**: 2026-01-12 14:30 KST
- **해결일시**: 2026-01-12 15:45 KST
- **총 소요시간**: 1시간 15분
- **심각도**: P2 (High)
- **영향 범위**: API 응답 지연, 바이탈 입력 실패

## 타임라인

| 시간  | 이벤트                              |
| ----- | ----------------------------------- |
| 14:30 | 모니터링 알림 수신 (API 응답 > 3초) |
| 14:35 | 인시던트 선언, 담당자 소집          |
| 14:40 | DB 커넥션 풀 소진 확인              |
| 14:50 | 유휴 커넥션 강제 종료               |
| 15:00 | 커넥션 풀 설정 조정                 |
| 15:15 | API 서버 롤링 재시작                |
| 15:30 | 서비스 정상화 확인                  |
| 15:45 | 인시던트 종료 선언                  |

## 근본 원인 (Root Cause)

슬로우 쿼리로 인한 DB 커넥션 점유 시간 증가로 커넥션 풀 소진.
특정 리포트 쿼리가 인덱스 없이 Full Scan 수행.

## 영향

- 사용자 약 50명이 15분간 서비스 이용 불가
- 바이탈 입력 실패 건수: 12건 (이후 수동 입력)
- 데이터 손실: 없음

## 재발 방지 조치

| 조치                           | 담당자 | 완료일     |
| ------------------------------ | ------ | ---------- |
| 문제 쿼리에 인덱스 추가        | DBA    | 2026-01-13 |
| 커넥션 풀 모니터링 알림 추가   | 인프라 | 2026-01-14 |
| 슬로우 쿼리 주간 리뷰 프로세스 | 개발팀 | 2026-01-15 |
| 커넥션 타임아웃 설정 검토      | 개발팀 | 2026-01-15 |

## 교훈 (Lessons Learned)

1. 리포트 쿼리 배포 전 실행 계획 검토 필수화
2. DB 커넥션 풀 사용률 알림 임계값 낮춤 (80% → 70%)
3. 슬로우 쿼리 로그 실시간 알림 구축 필요

## 참석자

- 인시던트 커맨더: OOO
- 기술 리드: OOO
- 참여자: OOO, OOO
```

### 10.2 재발 방지 체크리스트

```markdown
## 재발 방지 체크리스트

### 기술적 조치

- [ ] 근본 원인에 대한 수정 배포
- [ ] 관련 모니터링/알림 강화
- [ ] 자동화된 테스트 케이스 추가
- [ ] 문서/Runbook 업데이트

### 프로세스 개선

- [ ] 코드 리뷰 체크리스트 업데이트
- [ ] 배포 전 검증 절차 강화
- [ ] 교육/공유 세션 진행

### 확인

- [ ] 유사 시스템에 동일 문제 없는지 확인
- [ ] 개선 조치 효과 검증 완료
- [ ] 최종 보고서 작성 및 공유
```

### 10.3 인시던트 통계

```sql
-- 월간 인시던트 통계
CREATE VIEW monitoring.incident_statistics AS
SELECT
    DATE_TRUNC('month', created_at) AS month,
    severity,
    COUNT(*) AS incident_count,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) AS avg_resolution_minutes,
    MAX(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) AS max_resolution_minutes
FROM monitoring.incidents
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at), severity
ORDER BY month DESC, severity;

-- MTTR (Mean Time To Recovery) 계산
SELECT
    severity,
    ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60), 2) AS mttr_minutes
FROM monitoring.incidents
WHERE resolved_at IS NOT NULL
  AND created_at >= NOW() - INTERVAL '3 months'
GROUP BY severity;
```

---

## 부록: 유용한 명령어 모음

### AWS CLI 단축 명령

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가

# ECS 서비스 상태 확인
alias ecs-status='aws ecs describe-services --cluster hospital-erp --services api web --query "services[*].{Name:serviceName,Running:runningCount,Desired:desiredCount,Status:status}"'

# RDS 상태 확인
alias rds-status='aws rds describe-db-instances --db-instance-identifier hospital-erp-primary --query "DBInstances[0].{Status:DBInstanceStatus,CPU:PerformanceInsightsEnabled}"'

# 최근 로그 확인
alias api-logs='aws logs tail /ecs/hospital-erp-api --since 5m --follow'

# ECS 롤링 재시작
alias ecs-restart='aws ecs update-service --cluster hospital-erp --service api --force-new-deployment'

# Redis 연결 테스트
alias redis-ping='redis-cli -h $REDIS_HOST ping'
```

### 긴급 롤백 스크립트

```bash
#!/bin/bash
# emergency-rollback.sh

set -e

SERVICE=$1
TARGET_VERSION=$2

if [ -z "$SERVICE" ] || [ -z "$TARGET_VERSION" ]; then
  echo "Usage: ./emergency-rollback.sh <service> <task-definition-version>"
  exit 1
fi

echo "Rolling back $SERVICE to version $TARGET_VERSION..."

aws ecs update-service \
  --cluster hospital-erp \
  --service $SERVICE \
  --task-definition hospital-erp-$SERVICE:$TARGET_VERSION

echo "Waiting for deployment..."
aws ecs wait services-stable \
  --cluster hospital-erp \
  --services $SERVICE

echo "Rollback complete!"
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
> - [infrastructure-setup.kr.md](infrastructure-setup.kr.md) - 인프라 설정
> - [security-requirements.kr.md](../03-security/security-requirements.kr.md) - 보안 요구사항
