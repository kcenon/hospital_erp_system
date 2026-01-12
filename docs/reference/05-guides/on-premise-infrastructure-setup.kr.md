# 온프레미스 인프라 설정 가이드

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 0.1.0.0 |
| 작성일 | 2026-01-12 |
| 상태 | 초안 |
| 관리자 | kcenon@naver.com |

---

## 1. 온프레미스 개요

### 1.1 온프레미스 선택 시 고려사항

| 고려사항 | 온프레미스 장점 |
|----------|----------------|
| **데이터 주권** | 환자 데이터 위치에 대한 완전한 통제 |
| **네트워크 지연** | 실시간 모니터링을 위한 초저지연 |
| **규정 준수** | 국내 의료 데이터 규정 충족 용이 |
| **기존 인프라 활용** | 현재 병원 IT 투자 활용 |
| **장기 비용** | 5년 이상 운영 시 잠재적으로 낮은 TCO |
| **폐쇄망 지원** | 격리된 의료 네트워크 지원 |

### 1.2 온프레미스 vs 클라우드 비교

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        배포 모델 비교                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  항목               │  온프레미스            │  클라우드 (AWS)             │
│  ──────────────────┼───────────────────────┼───────────────────────────│
│  초기 비용          │  높음 (하드웨어)        │  낮음 (종량제)              │
│  운영 비용          │  낮음 (5년 이상)       │  높음 (월별 요금)           │
│  확장성             │  수동                  │  자동                      │
│  유지보수           │  내부 IT 팀            │  제공업체 관리              │
│  데이터 통제        │  완전                  │  공동 책임                 │
│  규정 준수          │  용이 (국내)           │  검증 필요                 │
│  재해 복구          │  자체 관리             │  다중 리전 가능             │
│  네트워크 지연      │  최소                  │  가변적                    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.3 아키텍처 옵션

| 규모 | 권장 구성 | 적용 대상 |
|------|----------|----------|
| **소규모** (50병상 미만) | 단일 서버 + Docker Compose | 의원, 소규모 병원 |
| **중규모** (50-200병상) | 3노드 K3s 클러스터 | 종합병원 |
| **대규모** (200병상 이상) | 전체 Kubernetes 클러스터 (5+노드) | 대학병원, 의료센터 |

---

## 2. 하드웨어 요구사항

### 2.1 최소 사양 (소규모)

#### 단일 서버 구성

| 구성요소 | 최소 | 권장 |
|----------|------|------|
| **CPU** | 8코어 (Intel Xeon 또는 AMD EPYC) | 16코어 |
| **RAM** | 32 GB ECC | 64 GB ECC |
| **스토리지 (OS)** | 256 GB NVMe SSD | 512 GB NVMe SSD |
| **스토리지 (데이터)** | 1 TB NVMe SSD (RAID 1) | 2 TB NVMe SSD (RAID 10) |
| **네트워크** | 1 Gbps 듀얼 NIC | 10 Gbps 듀얼 NIC |
| **전원** | 이중화 PSU | 이중화 PSU + UPS |

### 2.2 중규모 (K3s 클러스터)

#### 3노드 구성

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        K3s 클러스터 아키텍처                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐                     │
│  │   로드 밸런서         │  │   로드 밸런서         │  (Active-Standby)   │
│  │   (HAProxy/Nginx)    │  │   (HAProxy/Nginx)    │                     │
│  └──────────┬───────────┘  └──────────┬───────────┘                     │
│             │                         │                                  │
│             └───────────┬─────────────┘                                  │
│                         │                                                │
│  ┌──────────────────────┼──────────────────────┐                        │
│  │                      │                      │                         │
│  ▼                      ▼                      ▼                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                         │
│  │  노드 1    │  │  노드 2    │  │  노드 3    │                         │
│  │  (Master)  │  │  (Master)  │  │  (Master)  │   K3s 컨트롤 플레인    │
│  │            │  │            │  │            │                         │
│  │  앱 Pod    │  │  앱 Pod    │  │  앱 Pod    │   애플리케이션 레이어   │
│  │            │  │            │  │            │                         │
│  └────────────┘  └────────────┘  └────────────┘                         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     공유 스토리지 (NFS/Ceph)                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐                 │
│  │  PostgreSQL Primary    │  │  PostgreSQL Standby    │  (스트리밍)    │
│  └────────────────────────┘  └────────────────────────┘                 │
│                                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐                 │
│  │  Redis Primary         │  │  Redis Replica         │  (Sentinel)    │
│  └────────────────────────┘  └────────────────────────┘                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

| 노드 역할 | CPU | RAM | 스토리지 | 수량 |
|-----------|-----|-----|---------|------|
| K3s Master/Worker | 8코어 | 32 GB | 500 GB NVMe | 3 |
| 데이터베이스 서버 | 8코어 | 64 GB | 2 TB NVMe (RAID 10) | 2 |
| 로드 밸런서 | 4코어 | 8 GB | 100 GB SSD | 2 |
| NFS 스토리지 | 4코어 | 16 GB | 4 TB (RAID 6) | 1 |

### 2.3 대규모 (전체 Kubernetes)

| 노드 역할 | CPU | RAM | 스토리지 | 수량 |
|-----------|-----|-----|---------|------|
| K8s 컨트롤 플레인 | 4코어 | 16 GB | 200 GB NVMe | 3 |
| K8s 워커 노드 | 16코어 | 64 GB | 500 GB NVMe | 5+ |
| 데이터베이스 클러스터 | 16코어 | 128 GB | 4 TB NVMe (RAID 10) | 3 |
| Redis 클러스터 | 8코어 | 32 GB | 500 GB NVMe | 3 |
| 로드 밸런서 | 4코어 | 8 GB | 100 GB SSD | 2 |
| 스토리지 (Ceph) | 8코어 | 32 GB | 8 TB (각각) | 3 |
| 모니터링 | 8코어 | 32 GB | 1 TB SSD | 1 |

---

## 3. 네트워크 아키텍처

### 3.1 네트워크 분리

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        네트워크 아키텍처                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    병원 네트워크 (기존)                           │    │
│  │                         10.0.0.0/16                              │    │
│  └───────────────────────────┬─────────────────────────────────────┘    │
│                              │                                           │
│                    ┌─────────▼─────────┐                                │
│                    │     방화벽         │                                │
│                    │   (pfSense/OPN)   │                                │
│                    └─────────┬─────────┘                                │
│                              │                                           │
│  ┌───────────────────────────┼───────────────────────────┐              │
│  │                           │                           │               │
│  ▼                           ▼                           ▼               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   DMZ 네트워크   │  │   앱 네트워크    │  │  데이터 네트워크 │          │
│  │  192.168.1.0/24 │  │  192.168.10.0/24│  │  192.168.20.0/24│          │
│  │                 │  │                 │  │                 │          │
│  │  - 로드 밸런서   │  │  - K3s 노드     │  │  - PostgreSQL   │          │
│  │  - 리버스 프록시 │  │  - 앱 Pod       │  │  - Redis        │          │
│  │                 │  │                 │  │  - NFS 스토리지  │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    관리 네트워크                                  │    │
│  │                      192.168.100.0/24                            │    │
│  │                                                                  │    │
│  │  - 모니터링 (Prometheus/Grafana)                                 │    │
│  │  - 백업 서버                                                     │    │
│  │  - 관리자 접근 (SSH/VPN)                                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 방화벽 규칙

```bash
# DMZ → 앱 네트워크
allow tcp 192.168.1.0/24 → 192.168.10.0/24 port 80,443

# 앱 네트워크 → 데이터 네트워크
allow tcp 192.168.10.0/24 → 192.168.20.0/24 port 5432 (PostgreSQL)
allow tcp 192.168.10.0/24 → 192.168.20.0/24 port 6379 (Redis)
allow tcp 192.168.10.0/24 → 192.168.20.0/24 port 2049 (NFS)

# 관리 네트워크 → 전체
allow tcp 192.168.100.0/24 → 192.168.0.0/16 port 22 (SSH)
allow tcp 192.168.100.0/24 → 192.168.10.0/24 port 6443 (K3s API)

# 기타 모든 트래픽 차단
deny all
```

### 3.3 DNS 구성

```yaml
# 내부 DNS (CoreDNS 또는 Bind9)
hospital-erp.local          → 192.168.1.10   # 로드 밸런서 VIP
api.hospital-erp.local      → 192.168.1.10   # API 엔드포인트
db-primary.hospital-erp.local → 192.168.20.10  # PostgreSQL Primary
db-standby.hospital-erp.local → 192.168.20.11  # PostgreSQL Standby
redis.hospital-erp.local    → 192.168.20.20  # Redis Primary
```

---

## 4. 컨테이너 오케스트레이션

### 4.1 K3s 설치 (중규모 권장)

#### 마스터 노드 1 (초기화)

```bash
# embedded etcd로 K3s 설치
curl -sfL https://get.k3s.io | sh -s - server \
  --cluster-init \
  --tls-san=192.168.10.10 \
  --tls-san=k3s.hospital-erp.local \
  --disable=traefik \
  --write-kubeconfig-mode=644

# 조인 토큰 확인
cat /var/lib/rancher/k3s/server/node-token
```

#### 마스터 노드 2, 3 (조인)

```bash
# 추가 마스터로 조인
curl -sfL https://get.k3s.io | sh -s - server \
  --server https://192.168.10.10:6443 \
  --token <NODE_TOKEN> \
  --tls-san=192.168.10.11 \
  --disable=traefik
```

#### 클러스터 확인

```bash
kubectl get nodes
# NAME    STATUS   ROLES                       AGE   VERSION
# node1   Ready    control-plane,etcd,master   5m    v1.28.4+k3s1
# node2   Ready    control-plane,etcd,master   3m    v1.28.4+k3s1
# node3   Ready    control-plane,etcd,master   2m    v1.28.4+k3s1
```

### 4.2 Docker Compose (소규모)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Nginx 리버스 프록시
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    restart: always
    networks:
      - frontend-network

  # Next.js 프론트엔드
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.hospital-erp.local
    restart: always
    networks:
      - frontend-network

  # NestJS 백엔드
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://hospital:${DB_PASSWORD}@postgres:5432/hospital_erp
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: always
    networks:
      - frontend-network
      - backend-network

  # PostgreSQL 데이터베이스
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=hospital_erp
      - POSTGRES_USER=hospital
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d
      - ./postgres/postgresql.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hospital -d hospital_erp"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    networks:
      - backend-network

  # Redis 캐시
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    networks:
      - backend-network

  # 백업 서비스
  backup:
    image: postgres:16-alpine
    environment:
      - PGHOST=postgres
      - PGUSER=hospital
      - PGPASSWORD=${DB_PASSWORD}
      - PGDATABASE=hospital_erp
    volumes:
      - ./backups:/backups
      - ./scripts/backup.sh:/backup.sh:ro
    entrypoint: /bin/sh -c "crond -f"
    restart: always
    networks:
      - backend-network

volumes:
  postgres-data:
  redis-data:

networks:
  frontend-network:
    driver: bridge
  backend-network:
    driver: bridge
    internal: true  # 외부 접근 불가
```

### 4.3 Kubernetes 매니페스트

#### 네임스페이스 및 ConfigMap

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: hospital-erp
  labels:
    name: hospital-erp
---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: hospital-erp
data:
  NODE_ENV: "production"
  API_PORT: "3000"
  LOG_LEVEL: "info"
```

#### Secrets (프로덕션에서는 외부 시크릿 관리자 사용)

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: hospital-erp
type: Opaque
stringData:
  DATABASE_URL: "postgresql://hospital:password@postgres-primary:5432/hospital_erp"
  REDIS_URL: "redis://:password@redis:6379"
  JWT_ACCESS_SECRET: "your-access-secret"
  JWT_REFRESH_SECRET: "your-refresh-secret"
```

#### 백엔드 Deployment

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: hospital-erp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: hospital-erp/backend:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: backend
                topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: hospital-erp
spec:
  selector:
    app: backend
  ports:
    - port: 3000
      targetPort: 3000
  type: ClusterIP
```

#### Ingress (Nginx Ingress Controller)

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hospital-erp-ingress
  namespace: hospital-erp
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - hospital-erp.local
        - api.hospital-erp.local
      secretName: hospital-erp-tls
  rules:
    - host: hospital-erp.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
    - host: api.hospital-erp.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 3000
```

---

## 5. 데이터베이스 구성

### 5.1 PostgreSQL 고가용성

#### Primary 서버 구성

```ini
# /etc/postgresql/16/main/postgresql.conf

# 연결
listen_addresses = '*'
port = 5432
max_connections = 200

# 메모리
shared_buffers = 16GB              # RAM의 25%
effective_cache_size = 48GB        # RAM의 75%
work_mem = 256MB
maintenance_work_mem = 2GB

# WAL 및 복제
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
wal_keep_size = 1GB
synchronous_commit = on
synchronous_standby_names = 'standby1'

# 아카이빙
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'

# 로깅
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d.log'
log_statement = 'ddl'
log_min_duration_statement = 1000

# 성능
random_page_cost = 1.1             # SSD 최적화
effective_io_concurrency = 200     # SSD 최적화
```

#### pg_hba.conf (인증)

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             192.168.10.0/24         scram-sha-256
host    replication     replicator      192.168.20.11/32        scram-sha-256
```

#### Standby 서버 설정

```bash
# Standby 서버에서
pg_basebackup -h 192.168.20.10 -D /var/lib/postgresql/16/main \
  -U replicator -P -R -X stream -C -S standby1_slot

# standby.signal 생성
touch /var/lib/postgresql/16/main/standby.signal

# 복제 확인
psql -c "SELECT * FROM pg_stat_replication;"
```

### 5.2 Patroni를 이용한 자동 장애 조치

```yaml
# /etc/patroni/patroni.yml
scope: hospital-erp-cluster
name: node1

restapi:
  listen: 0.0.0.0:8008
  connect_address: 192.168.20.10:8008

etcd3:
  hosts:
    - 192.168.10.10:2379
    - 192.168.10.11:2379
    - 192.168.10.12:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
    synchronous_mode: true
    postgresql:
      use_pg_rewind: true
      parameters:
        max_connections: 200
        shared_buffers: 16GB
        wal_level: replica

  initdb:
    - encoding: UTF8
    - data-checksums

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 192.168.20.10:5432
  data_dir: /var/lib/postgresql/16/main
  authentication:
    superuser:
      username: postgres
      password: ${POSTGRES_PASSWORD}
    replication:
      username: replicator
      password: ${REPLICATOR_PASSWORD}

tags:
  nofailover: false
  noloadbalance: false
  clonefrom: false
  nosync: false
```

---

## 6. Redis 구성

### 6.1 Redis Sentinel (고가용성)

#### Redis Primary

```conf
# /etc/redis/redis.conf
bind 192.168.20.20
port 6379
requirepass your_redis_password
masterauth your_redis_password

# 영속성
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec

# 메모리
maxmemory 8gb
maxmemory-policy allkeys-lru

# 복제
min-replicas-to-write 1
min-replicas-max-lag 10
```

#### Redis Replica

```conf
# /etc/redis/redis.conf
bind 192.168.20.21
port 6379
requirepass your_redis_password
masterauth your_redis_password

replicaof 192.168.20.20 6379
```

#### Sentinel 구성

```conf
# /etc/redis/sentinel.conf
port 26379
sentinel monitor hospital-redis 192.168.20.20 6379 2
sentinel auth-pass hospital-redis your_redis_password
sentinel down-after-milliseconds hospital-redis 5000
sentinel failover-timeout hospital-redis 60000
sentinel parallel-syncs hospital-redis 1
```

---

## 7. 로드 밸런서 구성

### 7.1 HAProxy 구성

```haproxy
# /etc/haproxy/haproxy.cfg

global
    log /dev/log local0
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

    # TLS 설정
    ssl-default-bind-ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256
    ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets
    tune.ssl.default-dh-param 2048

defaults
    log global
    mode http
    option httplog
    option dontlognull
    option http-server-close
    option forwardfor except 127.0.0.0/8
    timeout connect 5s
    timeout client 30s
    timeout server 30s
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 408 /etc/haproxy/errors/408.http
    errorfile 500 /etc/haproxy/errors/500.http
    errorfile 502 /etc/haproxy/errors/502.http
    errorfile 503 /etc/haproxy/errors/503.http
    errorfile 504 /etc/haproxy/errors/504.http

# 통계 페이지
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if LOCALHOST

# HTTPS 프론트엔드
frontend https_front
    bind *:443 ssl crt /etc/haproxy/certs/hospital-erp.pem
    http-request add-header X-Forwarded-Proto https
    http-request add-header X-Real-IP %[src]

    # ACL
    acl is_api hdr(host) -i api.hospital-erp.local

    # 라우팅
    use_backend api_backend if is_api
    default_backend web_backend

# HTTP 리다이렉트
frontend http_front
    bind *:80
    http-request redirect scheme https unless { ssl_fc }

# 웹 백엔드 (Next.js)
backend web_backend
    balance roundrobin
    option httpchk GET /api/health
    http-check expect status 200

    server web1 192.168.10.10:3000 check inter 5s fall 3 rise 2
    server web2 192.168.10.11:3000 check inter 5s fall 3 rise 2
    server web3 192.168.10.12:3000 check inter 5s fall 3 rise 2

# API 백엔드 (NestJS)
backend api_backend
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200

    server api1 192.168.10.10:3001 check inter 5s fall 3 rise 2
    server api2 192.168.10.11:3001 check inter 5s fall 3 rise 2
    server api3 192.168.10.12:3001 check inter 5s fall 3 rise 2

# PostgreSQL (TCP 모드)
frontend postgres_front
    bind *:5432
    mode tcp
    default_backend postgres_backend

backend postgres_backend
    mode tcp
    option pgsql-check user postgres
    server pg_primary 192.168.20.10:5432 check inter 5s
    server pg_standby 192.168.20.11:5432 check inter 5s backup
```

### 7.2 Keepalived (VIP 장애 조치)

```conf
# /etc/keepalived/keepalived.conf (Primary LB)

global_defs {
    router_id LB_PRIMARY
    script_user root
    enable_script_security
}

vrrp_script check_haproxy {
    script "/usr/bin/killall -0 haproxy"
    interval 2
    weight 2
}

vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 101
    advert_int 1

    authentication {
        auth_type PASS
        auth_pass hospital123
    }

    virtual_ipaddress {
        192.168.1.10/24     # 외부 접근용 VIP
    }

    track_script {
        check_haproxy
    }
}
```

---

## 8. 백업 및 복구

### 8.1 PostgreSQL 백업 전략

#### 일일 백업 스크립트

```bash
#!/bin/bash
# /opt/scripts/pg_backup.sh

set -e

BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 백업 디렉토리 생성
mkdir -p ${BACKUP_DIR}/daily

# pg_dump를 사용한 전체 백업
pg_dump -h localhost -U hospital -Fc hospital_erp \
    > ${BACKUP_DIR}/daily/hospital_erp_${DATE}.dump

# WAL 아카이브 백업
pg_basebackup -h localhost -U replicator -D ${BACKUP_DIR}/base_${DATE} \
    -Ft -z -P -X stream

# 오래된 백업 삭제
find ${BACKUP_DIR}/daily -name "*.dump" -mtime +${RETENTION_DAYS} -delete
find ${BACKUP_DIR} -name "base_*" -type d -mtime +7 -exec rm -rf {} \;

# 백업 검증
pg_restore --list ${BACKUP_DIR}/daily/hospital_erp_${DATE}.dump > /dev/null

echo "백업 완료: hospital_erp_${DATE}.dump"
```

#### Cron 스케줄

```bash
# /etc/cron.d/pg_backup
0 2 * * * postgres /opt/scripts/pg_backup.sh >> /var/log/pg_backup.log 2>&1
```

### 8.2 재해 복구

#### Point-in-Time Recovery (PITR)

```bash
# PostgreSQL 중지
systemctl stop postgresql

# 베이스 백업 복원
rm -rf /var/lib/postgresql/16/main/*
tar -xzf /backup/postgresql/base_20260112/base.tar.gz -C /var/lib/postgresql/16/main/

# recovery.signal 생성
touch /var/lib/postgresql/16/main/recovery.signal

# 복구 설정
cat >> /var/lib/postgresql/16/main/postgresql.auto.conf << EOF
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
recovery_target_time = '2026-01-12 10:00:00'
recovery_target_action = 'promote'
EOF

# PostgreSQL 시작
systemctl start postgresql
```

### 8.3 원격 백업 (선택사항)

```bash
#!/bin/bash
# 원격 백업 서버로 동기화
rsync -avz --delete \
    /backup/postgresql/ \
    backup@remote-backup-server:/backup/hospital-erp/postgresql/

# 또는 S3 호환 스토리지 사용 (MinIO)
aws --endpoint-url http://minio.hospital-erp.local:9000 \
    s3 sync /backup/postgresql/ s3://hospital-backups/postgresql/
```

---

## 9. 모니터링 및 알림

### 9.1 Prometheus + Grafana 스택

#### Docker Compose (모니터링)

```yaml
# monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    ports:
      - "9090:9090"
    restart: always

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    restart: always

  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - "9093:9093"
    restart: always

  node-exporter:
    image: prom/node-exporter:latest
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
    ports:
      - "9100:9100"
    restart: always

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    environment:
      - DATA_SOURCE_NAME=postgresql://hospital:${DB_PASSWORD}@postgres:5432/hospital_erp?sslmode=disable
    ports:
      - "9187:9187"
    restart: always

  redis-exporter:
    image: oliver006/redis_exporter:latest
    environment:
      - REDIS_ADDR=redis://redis:6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    ports:
      - "9121:9121"
    restart: always

volumes:
  prometheus-data:
  grafana-data:
```

#### Prometheus 구성

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - '/etc/prometheus/rules/*.yml'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets:
          - 'node1:9100'
          - 'node2:9100'
          - 'node3:9100'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'hospital-erp-api'
    metrics_path: /metrics
    static_configs:
      - targets:
          - 'backend:3000'
```

#### 알림 규칙

```yaml
# prometheus/rules/alerts.yml
groups:
  - name: hospital-erp-alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.instance }}에서 높은 CPU 사용률"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.instance }}에서 높은 메모리 사용률"

      - alert: PostgreSQLDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL 다운"

      - alert: PostgreSQLReplicationLag
        expr: pg_replication_lag > 30
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL 복제 지연 {{ $value }}초"

      - alert: RedisDown
        expr: redis_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis 다운"

      - alert: HighAPILatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API 지연 P95가 {{ $value }}초"
```

---

## 10. CI/CD 파이프라인

### 10.1 GitLab CI (자체 호스팅)

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_REGISTRY: registry.hospital-erp.local
  IMAGE_TAG: $CI_COMMIT_SHORT_SHA

test:
  stage: test
  image: node:20-alpine
  script:
    - corepack enable pnpm
    - pnpm install
    - pnpm test
    - pnpm lint
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $DOCKER_REGISTRY
    - docker build -t $DOCKER_REGISTRY/hospital-erp/backend:$IMAGE_TAG ./backend
    - docker build -t $DOCKER_REGISTRY/hospital-erp/frontend:$IMAGE_TAG ./frontend
    - docker push $DOCKER_REGISTRY/hospital-erp/backend:$IMAGE_TAG
    - docker push $DOCKER_REGISTRY/hospital-erp/frontend:$IMAGE_TAG
  only:
    - main

deploy_staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context staging
    - kubectl set image deployment/backend backend=$DOCKER_REGISTRY/hospital-erp/backend:$IMAGE_TAG -n hospital-erp
    - kubectl set image deployment/frontend frontend=$DOCKER_REGISTRY/hospital-erp/frontend:$IMAGE_TAG -n hospital-erp
    - kubectl rollout status deployment/backend -n hospital-erp
    - kubectl rollout status deployment/frontend -n hospital-erp
  environment:
    name: staging
  only:
    - main

deploy_production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context production
    - kubectl set image deployment/backend backend=$DOCKER_REGISTRY/hospital-erp/backend:$IMAGE_TAG -n hospital-erp
    - kubectl set image deployment/frontend frontend=$DOCKER_REGISTRY/hospital-erp/frontend:$IMAGE_TAG -n hospital-erp
    - kubectl rollout status deployment/backend -n hospital-erp
    - kubectl rollout status deployment/frontend -n hospital-erp
  environment:
    name: production
  when: manual
  only:
    - main
```

### 10.2 Jenkins 파이프라인 (대안)

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'registry.hospital-erp.local'
        IMAGE_TAG = "${GIT_COMMIT.take(7)}"
    }

    stages {
        stage('Test') {
            agent {
                docker { image 'node:20-alpine' }
            }
            steps {
                sh 'corepack enable pnpm'
                sh 'pnpm install'
                sh 'pnpm test'
                sh 'pnpm lint'
            }
        }

        stage('Build') {
            steps {
                script {
                    docker.build("${DOCKER_REGISTRY}/hospital-erp/backend:${IMAGE_TAG}", "./backend")
                    docker.build("${DOCKER_REGISTRY}/hospital-erp/frontend:${IMAGE_TAG}", "./frontend")
                }
            }
        }

        stage('Push') {
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-credentials') {
                        docker.image("${DOCKER_REGISTRY}/hospital-erp/backend:${IMAGE_TAG}").push()
                        docker.image("${DOCKER_REGISTRY}/hospital-erp/frontend:${IMAGE_TAG}").push()
                    }
                }
            }
        }

        stage('Deploy Staging') {
            steps {
                withKubeConfig([credentialsId: 'k8s-staging']) {
                    sh """
                        kubectl set image deployment/backend backend=${DOCKER_REGISTRY}/hospital-erp/backend:${IMAGE_TAG} -n hospital-erp
                        kubectl set image deployment/frontend frontend=${DOCKER_REGISTRY}/hospital-erp/frontend:${IMAGE_TAG} -n hospital-erp
                        kubectl rollout status deployment/backend -n hospital-erp
                    """
                }
            }
        }

        stage('Deploy Production') {
            when {
                branch 'main'
            }
            input {
                message "프로덕션에 배포하시겠습니까?"
                ok "배포"
            }
            steps {
                withKubeConfig([credentialsId: 'k8s-production']) {
                    sh """
                        kubectl set image deployment/backend backend=${DOCKER_REGISTRY}/hospital-erp/backend:${IMAGE_TAG} -n hospital-erp
                        kubectl set image deployment/frontend frontend=${DOCKER_REGISTRY}/hospital-erp/frontend:${IMAGE_TAG} -n hospital-erp
                        kubectl rollout status deployment/backend -n hospital-erp
                    """
                }
            }
        }
    }

    post {
        failure {
            emailext(
                subject: "빌드 실패: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "콘솔 출력 확인: ${env.BUILD_URL}",
                to: "devops@hospital.com"
            )
        }
    }
}
```

---

## 11. 보안 강화

### 11.1 OS 레벨 보안

```bash
#!/bin/bash
# security-hardening.sh

# 불필요한 서비스 비활성화
systemctl disable bluetooth
systemctl disable cups
systemctl disable avahi-daemon

# 방화벽 구성 (UFW)
ufw default deny incoming
ufw default allow outgoing
ufw allow from 192.168.0.0/16 to any port 22    # 내부에서 SSH
ufw allow from 192.168.0.0/16 to any port 443   # HTTPS
ufw allow from 192.168.0.0/16 to any port 6443  # K3s API
ufw enable

# SSH 강화
cat >> /etc/ssh/sshd_config << EOF
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
systemctl restart sshd

# 커널 보안 매개변수
cat >> /etc/sysctl.conf << EOF
net.ipv4.ip_forward = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv6.conf.all.disable_ipv6 = 1
kernel.randomize_va_space = 2
EOF
sysctl -p

# fail2ban 설치 및 구성
apt install -y fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
EOF
systemctl enable fail2ban
systemctl start fail2ban
```

### 11.2 컨테이너 보안

```yaml
# k8s/pod-security-policy.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
  readOnlyRootFilesystem: true
```

### 11.3 SSL/TLS 인증서

```bash
# 내부용 자체 서명 인증서 생성
# (프로덕션에서는 Let's Encrypt 또는 기업 CA 사용)

# CA 생성
openssl genrsa -out ca.key 4096
openssl req -new -x509 -days 3650 -key ca.key -out ca.crt \
    -subj "/C=KR/ST=Seoul/O=Hospital/CN=Hospital CA"

# 서버 인증서 생성
openssl genrsa -out hospital-erp.key 2048
openssl req -new -key hospital-erp.key -out hospital-erp.csr \
    -subj "/C=KR/ST=Seoul/O=Hospital/CN=hospital-erp.local"

# CA로 서명
openssl x509 -req -days 365 -in hospital-erp.csr \
    -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out hospital-erp.crt \
    -extfile <(echo "subjectAltName=DNS:hospital-erp.local,DNS:api.hospital-erp.local,DNS:*.hospital-erp.local")

# HAProxy용 통합 PEM 생성
cat hospital-erp.crt hospital-erp.key > hospital-erp.pem
```

---

## 12. 비용 추정

### 12.1 하드웨어 비용 (일회성)

| 항목 | 사양 | 수량 | 단가 (USD) | 합계 |
|------|------|------|------------|------|
| **소규모** | | | | |
| 서버 | Dell PowerEdge R650 (16코어, 64GB, 2TB) | 1 | $8,000 | $8,000 |
| UPS | APC 3000VA | 1 | $1,500 | $1,500 |
| 네트워크 스위치 | 24포트 기가비트 | 1 | $300 | $300 |
| **소계** | | | | **$9,800** |
| | | | | |
| **중규모** | | | | |
| K3s 노드 | Dell PowerEdge R650 (8코어, 32GB, 500GB) | 3 | $5,000 | $15,000 |
| 데이터베이스 서버 | Dell PowerEdge R750 (8코어, 64GB, 2TB RAID) | 2 | $10,000 | $20,000 |
| 로드 밸런서 | Dell PowerEdge R450 (4코어, 8GB) | 2 | $3,000 | $6,000 |
| 스토리지 서버 | Synology RS3621xs+ (4TB x 12) | 1 | $8,000 | $8,000 |
| 네트워크 스위치 | 10GbE 24포트 | 2 | $2,000 | $4,000 |
| UPS | APC 5000VA | 2 | $3,000 | $6,000 |
| **소계** | | | | **$59,000** |

### 12.2 운영 비용 (월간)

| 항목 | 소규모 | 중규모 |
|------|--------|--------|
| 전기료 | ~$100 | ~$500 |
| 인터넷 (전용선) | $200 | $500 |
| IT 인력 (파트타임) | $1,000 | $3,000 |
| 소프트웨어 라이선스 | $200 | $500 |
| 백업 스토리지 | $100 | $300 |
| **월간 합계** | **~$1,600** | **~$4,800** |

### 12.3 5년 TCO 비교

| 배포 모델 | 1년차 | 2-5년차 | 5년 합계 |
|----------|-------|---------|----------|
| **온프레미스 (소규모)** | $29,000 | $76,800 | **$105,800** |
| **온프레미스 (중규모)** | $116,600 | $230,400 | **$347,000** |
| **AWS 클라우드** | $4,224 | $16,896 | **$21,120** |

> **참고**: 온프레미스는 초기 비용이 높지만 규정 준수를 위해 필요할 수 있습니다. 클라우드 비용은 기본 사용량 기준이며 트래픽에 따라 증가합니다.

---

## 13. 체크리스트

### 배포 전 체크리스트

- [ ] 하드웨어 조달 및 랙 설치
- [ ] 네트워크 인프라 설정 (스위치, 케이블, 방화벽)
- [ ] 운영 체제 설치 (Ubuntu 22.04 LTS 권장)
- [ ] 보안 강화 적용
- [ ] K3s/Docker 설치 및 구성
- [ ] PostgreSQL 클러스터 복제 테스트 완료
- [ ] Redis Sentinel 구성 완료
- [ ] 로드 밸런서 (HAProxy) VIP 동작 확인
- [ ] SSL 인증서 설치
- [ ] DNS 구성
- [ ] 백업 스크립트 스케줄 및 테스트 완료
- [ ] 모니터링 스택 배포 (Prometheus + Grafana)
- [ ] 알림 구성 및 테스트 완료
- [ ] CI/CD 파이프라인 연결
- [ ] 재해 복구 절차 문서화 및 테스트 완료
- [ ] 보안 감사 완료

### Go-Live 체크리스트

- [ ] 애플리케이션 배포 및 헬스체크 통과
- [ ] 데이터베이스 마이그레이션 적용
- [ ] 초기 관리자 사용자 생성
- [ ] 기존 시스템 연동 검증
- [ ] 성능 테스트 완료
- [ ] 직원 교육 완료
- [ ] 지원 연락처 문서화
- [ ] 운영팀에 런북 제공

---

## 부록 A: 문제 해결

### 일반적인 문제

#### PostgreSQL 복제 동작하지 않음

```bash
# 복제 상태 확인
psql -c "SELECT * FROM pg_stat_replication;"

# WAL 전송 프로세스 확인
ps aux | grep wal

# 네트워크 연결 확인
nc -zv standby-server 5432
```

#### K3s 노드 조인 안됨

```bash
# K3s 서비스 상태 확인
systemctl status k3s

# K3s 로그 보기
journalctl -u k3s -f

# 토큰 확인
cat /var/lib/rancher/k3s/server/node-token
```

#### HAProxy 헬스체크 실패

```bash
# 백엔드 직접 테스트
curl -v http://backend-server:3000/health

# HAProxy 통계 확인
curl http://localhost:8404/stats

# HAProxy 로그 보기
tail -f /var/log/haproxy.log
```

---

## 부록 B: 유지보수 절차

### 롤링 업데이트

```bash
# 백엔드 배포 업데이트
kubectl set image deployment/backend backend=registry/hospital-erp/backend:v1.2.0 -n hospital-erp

# 롤아웃 모니터링
kubectl rollout status deployment/backend -n hospital-erp

# 필요시 롤백
kubectl rollout undo deployment/backend -n hospital-erp
```

### 데이터베이스 유지보수

```bash
# Vacuum 및 Analyze (저트래픽 시간에)
psql -c "VACUUM ANALYZE;"

# 필요시 재인덱스
psql -c "REINDEX DATABASE hospital_erp;"

# 테이블 비대화 확인
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

---

*문서 끝*
