# On-Premise Infrastructure Setup Guide

## Document Information

| Item             | Content          |
| ---------------- | ---------------- |
| Document Version | 0.1.0.0          |
| Created Date     | 2026-01-12       |
| Status           | Draft            |
| Manager          | kcenon@naver.com |

---

## 1. On-Premise Overview

### 1.1 When to Choose On-Premise

| Consideration               | On-Premise Advantage                          |
| --------------------------- | --------------------------------------------- |
| **Data Sovereignty**        | Complete control over patient data location   |
| **Network Latency**         | Ultra-low latency for real-time monitoring    |
| **Regulatory Compliance**   | Easier to meet local medical data regulations |
| **Existing Infrastructure** | Leverage current hospital IT investment       |
| **Long-term Cost**          | Potentially lower TCO for 5+ year operation   |
| **Air-gapped Networks**     | Support for isolated medical networks         |

### 1.2 On-Premise vs Cloud Comparison

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    Deployment Model Comparison                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Aspect              │  On-Premise          │  Cloud (AWS)               │
│  ────────────────────┼──────────────────────┼────────────────────────────│
│  Initial Cost        │  High (Hardware)     │  Low (Pay-as-you-go)       │
│  Ongoing Cost        │  Lower (5+ years)    │  Higher (Monthly fees)     │
│  Scalability         │  Manual              │  Automatic                 │
│  Maintenance         │  Internal IT Team    │  Managed by provider       │
│  Data Control        │  Complete            │  Shared responsibility     │
│  Compliance          │  Easier (Local)      │  Requires verification     │
│  Disaster Recovery   │  Self-managed        │  Multi-region available    │
│  Network Latency     │  Minimal             │  Variable                  │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Architecture Options

| Scale                    | Recommended Setup                  | Use Case                            |
| ------------------------ | ---------------------------------- | ----------------------------------- |
| **Small** (< 50 beds)    | Single Server + Docker Compose     | Clinic, Small Hospital              |
| **Medium** (50-200 beds) | 3-Node K3s Cluster                 | General Hospital                    |
| **Large** (200+ beds)    | Full Kubernetes Cluster (5+ nodes) | University Hospital, Medical Center |

---

## 2. Hardware Requirements

### 2.1 Minimum Specifications (Small Scale)

#### Single Server Setup

| Component          | Minimum                          | Recommended             |
| ------------------ | -------------------------------- | ----------------------- |
| **CPU**            | 8 cores (Intel Xeon or AMD EPYC) | 16 cores                |
| **RAM**            | 32 GB ECC                        | 64 GB ECC               |
| **Storage (OS)**   | 256 GB NVMe SSD                  | 512 GB NVMe SSD         |
| **Storage (Data)** | 1 TB NVMe SSD (RAID 1)           | 2 TB NVMe SSD (RAID 10) |
| **Network**        | 1 Gbps dual NIC                  | 10 Gbps dual NIC        |
| **Power**          | Redundant PSU                    | Redundant PSU + UPS     |

### 2.2 Medium Scale (K3s Cluster)

#### 3-Node Configuration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        K3s Cluster Architecture                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐                     │
│  │   Load Balancer      │  │   Load Balancer      │  (Active-Standby)   │
│  │   (HAProxy/Nginx)    │  │   (HAProxy/Nginx)    │                     │
│  └──────────┬───────────┘  └──────────┬───────────┘                     │
│             │                         │                                  │
│             └───────────┬─────────────┘                                  │
│                         │                                                │
│  ┌──────────────────────┼──────────────────────┐                        │
│  │                      │                      │                         │
│  ▼                      ▼                      ▼                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                         │
│  │  Node 1    │  │  Node 2    │  │  Node 3    │                         │
│  │  (Master)  │  │  (Master)  │  │  (Master)  │   K3s Control Plane    │
│  │            │  │            │  │            │                         │
│  │  App Pods  │  │  App Pods  │  │  App Pods  │   Application Layer    │
│  │            │  │            │  │            │                         │
│  └────────────┘  └────────────┘  └────────────┘                         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Shared Storage (NFS/Ceph)                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐                 │
│  │  PostgreSQL Primary    │  │  PostgreSQL Standby    │  (Streaming)   │
│  └────────────────────────┘  └────────────────────────┘                 │
│                                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐                 │
│  │  Redis Primary         │  │  Redis Replica         │  (Sentinel)    │
│  └────────────────────────┘  └────────────────────────┘                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

| Node Role         | CPU     | RAM   | Storage             | Quantity |
| ----------------- | ------- | ----- | ------------------- | -------- |
| K3s Master/Worker | 8 cores | 32 GB | 500 GB NVMe         | 3        |
| Database Server   | 8 cores | 64 GB | 2 TB NVMe (RAID 10) | 2        |
| Load Balancer     | 4 cores | 8 GB  | 100 GB SSD          | 2        |
| NFS Storage       | 4 cores | 16 GB | 4 TB (RAID 6)       | 1        |

### 2.3 Large Scale (Full Kubernetes)

| Node Role         | CPU      | RAM    | Storage             | Quantity |
| ----------------- | -------- | ------ | ------------------- | -------- |
| K8s Control Plane | 4 cores  | 16 GB  | 200 GB NVMe         | 3        |
| K8s Worker Node   | 16 cores | 64 GB  | 500 GB NVMe         | 5+       |
| Database Cluster  | 16 cores | 128 GB | 4 TB NVMe (RAID 10) | 3        |
| Redis Cluster     | 8 cores  | 32 GB  | 500 GB NVMe         | 3        |
| Load Balancer     | 4 cores  | 8 GB   | 100 GB SSD          | 2        |
| Storage (Ceph)    | 8 cores  | 32 GB  | 8 TB (each)         | 3        |
| Monitoring        | 8 cores  | 32 GB  | 1 TB SSD            | 1        |

---

## 3. Network Architecture

### 3.1 Network Segmentation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Network Architecture                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Hospital Network (Existing)                   │    │
│  │                         10.0.0.0/16                              │    │
│  └───────────────────────────┬─────────────────────────────────────┘    │
│                              │                                           │
│                    ┌─────────▼─────────┐                                │
│                    │     Firewall      │                                │
│                    │   (pfSense/OPN)   │                                │
│                    └─────────┬─────────┘                                │
│                              │                                           │
│  ┌───────────────────────────┼───────────────────────────┐              │
│  │                           │                           │               │
│  ▼                           ▼                           ▼               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   DMZ Network   │  │   App Network   │  │  Data Network   │          │
│  │  192.168.1.0/24 │  │  192.168.10.0/24│  │  192.168.20.0/24│          │
│  │                 │  │                 │  │                 │          │
│  │  - Load Balancer│  │  - K3s Nodes    │  │  - PostgreSQL   │          │
│  │  - Reverse Proxy│  │  - App Pods     │  │  - Redis        │          │
│  │                 │  │                 │  │  - NFS Storage  │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Management Network                            │    │
│  │                      192.168.100.0/24                            │    │
│  │                                                                  │    │
│  │  - Monitoring (Prometheus/Grafana)                               │    │
│  │  - Backup Server                                                 │    │
│  │  - Admin Access (SSH/VPN)                                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Firewall Rules

```bash
# DMZ → App Network
allow tcp 192.168.1.0/24 → 192.168.10.0/24 port 80,443

# App Network → Data Network
allow tcp 192.168.10.0/24 → 192.168.20.0/24 port 5432 (PostgreSQL)
allow tcp 192.168.10.0/24 → 192.168.20.0/24 port 6379 (Redis)
allow tcp 192.168.10.0/24 → 192.168.20.0/24 port 2049 (NFS)

# Management Network → All
allow tcp 192.168.100.0/24 → 192.168.0.0/16 port 22 (SSH)
allow tcp 192.168.100.0/24 → 192.168.10.0/24 port 6443 (K3s API)

# Block all other traffic
deny all
```

### 3.3 DNS Configuration

```yaml
# Internal DNS (CoreDNS or Bind9)
hospital-erp.local          → 192.168.1.10   # Load Balancer VIP
api.hospital-erp.local      → 192.168.1.10   # API Endpoint
db-primary.hospital-erp.local → 192.168.20.10  # PostgreSQL Primary
db-standby.hospital-erp.local → 192.168.20.11  # PostgreSQL Standby
redis.hospital-erp.local    → 192.168.20.20  # Redis Primary
```

---

## 4. Container Orchestration

### 4.1 K3s Installation (Recommended for Medium Scale)

#### Master Node 1 (Initial)

```bash
# Install K3s with embedded etcd
curl -sfL https://get.k3s.io | sh -s - server \
  --cluster-init \
  --tls-san=192.168.10.10 \
  --tls-san=k3s.hospital-erp.local \
  --disable=traefik \
  --write-kubeconfig-mode=644

# Get join token
cat /var/lib/rancher/k3s/server/node-token
```

#### Master Node 2, 3 (Join)

```bash
# Join as additional master
curl -sfL https://get.k3s.io | sh -s - server \
  --server https://192.168.10.10:6443 \
  --token <NODE_TOKEN> \
  --tls-san=192.168.10.11 \
  --disable=traefik
```

#### Verify Cluster

```bash
kubectl get nodes
# NAME    STATUS   ROLES                       AGE   VERSION
# node1   Ready    control-plane,etcd,master   5m    v1.28.4+k3s1
# node2   Ready    control-plane,etcd,master   3m    v1.28.4+k3s1
# node3   Ready    control-plane,etcd,master   2m    v1.28.4+k3s1
```

### 4.2 Docker Compose (Small Scale)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    restart: always
    networks:
      - frontend-network

  # Next.js Frontend
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

  # NestJS Backend
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

  # PostgreSQL Database
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
      test: ['CMD-SHELL', 'pg_isready -U hospital -d hospital_erp']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    networks:
      - backend-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', '-a', '${REDIS_PASSWORD}', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    networks:
      - backend-network

  # Backup Service
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
    internal: true # No external access
```

### 4.3 Kubernetes Manifests

#### Namespace and ConfigMap

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
  NODE_ENV: 'production'
  API_PORT: '3000'
  LOG_LEVEL: 'info'
```

#### Secrets (use external secret manager in production)

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: hospital-erp
type: Opaque
stringData:
  DATABASE_URL: 'postgresql://hospital:password@postgres-primary:5432/hospital_erp'
  REDIS_URL: 'redis://:password@redis:6379'
  JWT_ACCESS_SECRET: 'your-access-secret'
  JWT_REFRESH_SECRET: 'your-refresh-secret'
```

#### Backend Deployment

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
              memory: '512Mi'
              cpu: '250m'
            limits:
              memory: '1Gi'
              cpu: '1000m'
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
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/proxy-body-size: '50m'
    cert-manager.io/cluster-issuer: 'letsencrypt-prod'
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

## 5. Database Configuration

### 5.1 PostgreSQL High Availability

#### Primary Server Configuration

```ini
# /etc/postgresql/16/main/postgresql.conf

# Connection
listen_addresses = '*'
port = 5432
max_connections = 200

# Memory
shared_buffers = 16GB              # 25% of RAM
effective_cache_size = 48GB        # 75% of RAM
work_mem = 256MB
maintenance_work_mem = 2GB

# WAL and Replication
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
wal_keep_size = 1GB
synchronous_commit = on
synchronous_standby_names = 'standby1'

# Archiving
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'

# Logging
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d.log'
log_statement = 'ddl'
log_min_duration_statement = 1000

# Performance
random_page_cost = 1.1             # SSD optimized
effective_io_concurrency = 200     # SSD optimized
```

#### pg_hba.conf (Authentication)

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             192.168.10.0/24         scram-sha-256
host    replication     replicator      192.168.20.11/32        scram-sha-256
```

#### Standby Server Setup

```bash
# On standby server
pg_basebackup -h 192.168.20.10 -D /var/lib/postgresql/16/main \
  -U replicator -P -R -X stream -C -S standby1_slot

# Create standby.signal
touch /var/lib/postgresql/16/main/standby.signal

# Verify replication
psql -c "SELECT * FROM pg_stat_replication;"
```

### 5.2 Automated Failover with Patroni

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

## 6. Redis Configuration

### 6.1 Redis Sentinel (High Availability)

#### Redis Primary

```conf
# /etc/redis/redis.conf
bind 192.168.20.20
port 6379
requirepass your_redis_password
masterauth your_redis_password

# Persistence
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec

# Memory
maxmemory 8gb
maxmemory-policy allkeys-lru

# Replication
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

#### Sentinel Configuration

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

## 7. Load Balancer Configuration

### 7.1 HAProxy Configuration

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

    # TLS Settings
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

# Stats Page
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if LOCALHOST

# HTTPS Frontend
frontend https_front
    bind *:443 ssl crt /etc/haproxy/certs/hospital-erp.pem
    http-request add-header X-Forwarded-Proto https
    http-request add-header X-Real-IP %[src]

    # ACLs
    acl is_api hdr(host) -i api.hospital-erp.local

    # Routing
    use_backend api_backend if is_api
    default_backend web_backend

# HTTP Redirect
frontend http_front
    bind *:80
    http-request redirect scheme https unless { ssl_fc }

# Web Backend (Next.js)
backend web_backend
    balance roundrobin
    option httpchk GET /api/health
    http-check expect status 200

    server web1 192.168.10.10:3000 check inter 5s fall 3 rise 2
    server web2 192.168.10.11:3000 check inter 5s fall 3 rise 2
    server web3 192.168.10.12:3000 check inter 5s fall 3 rise 2

# API Backend (NestJS)
backend api_backend
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200

    server api1 192.168.10.10:3001 check inter 5s fall 3 rise 2
    server api2 192.168.10.11:3001 check inter 5s fall 3 rise 2
    server api3 192.168.10.12:3001 check inter 5s fall 3 rise 2

# PostgreSQL (TCP Mode)
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

### 7.2 Keepalived (VIP Failover)

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
        192.168.1.10/24     # VIP for external access
    }

    track_script {
        check_haproxy
    }
}
```

---

## 8. Backup and Recovery

### 8.1 PostgreSQL Backup Strategy

#### Daily Backup Script

```bash
#!/bin/bash
# /opt/scripts/pg_backup.sh

set -e

BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p ${BACKUP_DIR}/daily

# Full backup using pg_dump
pg_dump -h localhost -U hospital -Fc hospital_erp \
    > ${BACKUP_DIR}/daily/hospital_erp_${DATE}.dump

# WAL archive backup
pg_basebackup -h localhost -U replicator -D ${BACKUP_DIR}/base_${DATE} \
    -Ft -z -P -X stream

# Cleanup old backups
find ${BACKUP_DIR}/daily -name "*.dump" -mtime +${RETENTION_DAYS} -delete
find ${BACKUP_DIR} -name "base_*" -type d -mtime +7 -exec rm -rf {} \;

# Verify backup
pg_restore --list ${BACKUP_DIR}/daily/hospital_erp_${DATE}.dump > /dev/null

echo "Backup completed: hospital_erp_${DATE}.dump"
```

#### Cron Schedule

```bash
# /etc/cron.d/pg_backup
0 2 * * * postgres /opt/scripts/pg_backup.sh >> /var/log/pg_backup.log 2>&1
```

### 8.2 Disaster Recovery

#### Point-in-Time Recovery (PITR)

```bash
# Stop PostgreSQL
systemctl stop postgresql

# Restore base backup
rm -rf /var/lib/postgresql/16/main/*
tar -xzf /backup/postgresql/base_20260112/base.tar.gz -C /var/lib/postgresql/16/main/

# Create recovery.signal
touch /var/lib/postgresql/16/main/recovery.signal

# Configure recovery
cat >> /var/lib/postgresql/16/main/postgresql.auto.conf << EOF
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
recovery_target_time = '2026-01-12 10:00:00'
recovery_target_action = 'promote'
EOF

# Start PostgreSQL
systemctl start postgresql
```

### 8.3 Off-site Backup (Optional)

```bash
#!/bin/bash
# Sync to remote backup server
rsync -avz --delete \
    /backup/postgresql/ \
    backup@remote-backup-server:/backup/hospital-erp/postgresql/

# Or use S3-compatible storage (MinIO)
aws --endpoint-url http://minio.hospital-erp.local:9000 \
    s3 sync /backup/postgresql/ s3://hospital-backups/postgresql/
```

---

## 9. Monitoring and Alerting

### 9.1 Prometheus + Grafana Stack

#### Docker Compose (Monitoring)

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
      - '9090:9090'
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
      - '3000:3000'
    restart: always

  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - '9093:9093'
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
      - '9100:9100'
    restart: always

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    environment:
      - DATA_SOURCE_NAME=postgresql://hospital:${DB_PASSWORD}@postgres:5432/hospital_erp?sslmode=disable
    ports:
      - '9187:9187'
    restart: always

  redis-exporter:
    image: oliver006/redis_exporter:latest
    environment:
      - REDIS_ADDR=redis://redis:6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    ports:
      - '9121:9121'
    restart: always

volumes:
  prometheus-data:
  grafana-data:
```

#### Prometheus Configuration

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

#### Alert Rules

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
          summary: 'High CPU usage on {{ $labels.instance }}'

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High memory usage on {{ $labels.instance }}'

      - alert: PostgreSQLDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'PostgreSQL is down'

      - alert: PostgreSQLReplicationLag
        expr: pg_replication_lag > 30
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'PostgreSQL replication lag is {{ $value }} seconds'

      - alert: RedisDown
        expr: redis_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'Redis is down'

      - alert: HighAPILatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'API latency P95 is {{ $value }}s'
```

---

## 10. CI/CD Pipeline

### 10.1 GitLab CI (Self-hosted)

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

### 10.2 Jenkins Pipeline (Alternative)

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
                message "Deploy to production?"
                ok "Deploy"
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
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Check console output at ${env.BUILD_URL}",
                to: "devops@hospital.com"
            )
        }
    }
}
```

---

## 11. Security Hardening

### 11.1 OS Level Security

```bash
#!/bin/bash
# security-hardening.sh

# Disable unnecessary services
systemctl disable bluetooth
systemctl disable cups
systemctl disable avahi-daemon

# Configure firewall (UFW)
ufw default deny incoming
ufw default allow outgoing
ufw allow from 192.168.0.0/16 to any port 22    # SSH from internal
ufw allow from 192.168.0.0/16 to any port 443   # HTTPS
ufw allow from 192.168.0.0/16 to any port 6443  # K3s API
ufw enable

# SSH Hardening
cat >> /etc/ssh/sshd_config << EOF
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
systemctl restart sshd

# Kernel Security Parameters
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

# Install and configure fail2ban
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

### 11.2 Container Security

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

### 11.3 SSL/TLS Certificates

```bash
# Generate self-signed certificates for internal use
# (Use Let's Encrypt or enterprise CA for production)

# Create CA
openssl genrsa -out ca.key 4096
openssl req -new -x509 -days 3650 -key ca.key -out ca.crt \
    -subj "/C=KR/ST=Seoul/O=Hospital/CN=Hospital CA"

# Create server certificate
openssl genrsa -out hospital-erp.key 2048
openssl req -new -key hospital-erp.key -out hospital-erp.csr \
    -subj "/C=KR/ST=Seoul/O=Hospital/CN=hospital-erp.local"

# Sign with CA
openssl x509 -req -days 365 -in hospital-erp.csr \
    -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out hospital-erp.crt \
    -extfile <(echo "subjectAltName=DNS:hospital-erp.local,DNS:api.hospital-erp.local,DNS:*.hospital-erp.local")

# Create combined PEM for HAProxy
cat hospital-erp.crt hospital-erp.key > hospital-erp.pem
```

---

## 12. Cost Estimation

### 12.1 Hardware Cost (One-time)

| Item             | Specification                                | Quantity | Unit Cost (USD) | Total       |
| ---------------- | -------------------------------------------- | -------- | --------------- | ----------- |
| **Small Scale**  |                                              |          |                 |             |
| Server           | Dell PowerEdge R650 (16 core, 64GB, 2TB)     | 1        | $8,000          | $8,000      |
| UPS              | APC 3000VA                                   | 1        | $1,500          | $1,500      |
| Network Switch   | 24-port Gigabit                              | 1        | $300            | $300        |
| **Subtotal**     |                                              |          |                 | **$9,800**  |
|                  |                                              |          |                 |             |
| **Medium Scale** |                                              |          |                 |             |
| K3s Nodes        | Dell PowerEdge R650 (8 core, 32GB, 500GB)    | 3        | $5,000          | $15,000     |
| Database Servers | Dell PowerEdge R750 (8 core, 64GB, 2TB RAID) | 2        | $10,000         | $20,000     |
| Load Balancers   | Dell PowerEdge R450 (4 core, 8GB)            | 2        | $3,000          | $6,000      |
| Storage Server   | Synology RS3621xs+ (4TB x 12)                | 1        | $8,000          | $8,000      |
| Network Switch   | 10GbE 24-port                                | 2        | $2,000          | $4,000      |
| UPS              | APC 5000VA                                   | 2        | $3,000          | $6,000      |
| **Subtotal**     |                                              |          |                 | **$59,000** |

### 12.2 Operating Cost (Monthly)

| Item                 | Small Scale | Medium Scale |
| -------------------- | ----------- | ------------ |
| Electricity          | ~$100       | ~$500        |
| Internet (Dedicated) | $200        | $500         |
| IT Staff (Part-time) | $1,000      | $3,000       |
| Software Licenses    | $200        | $500         |
| Backup Storage       | $100        | $300         |
| **Monthly Total**    | **~$1,600** | **~$4,800**  |

### 12.3 5-Year TCO Comparison

| Deployment Model        | Year 1   | Year 2-5 | 5-Year Total |
| ----------------------- | -------- | -------- | ------------ |
| **On-Premise (Small)**  | $29,000  | $76,800  | **$105,800** |
| **On-Premise (Medium)** | $116,600 | $230,400 | **$347,000** |
| **AWS Cloud**           | $4,224   | $16,896  | **$21,120**  |

> **Note**: On-premise has higher upfront cost but may be required for compliance. Cloud costs assume basic usage and will scale with traffic.

---

## 13. Checklist

### Pre-deployment Checklist

- [ ] Hardware procurement and rack installation
- [ ] Network infrastructure setup (switches, cables, firewall)
- [ ] Operating system installation (Ubuntu 22.04 LTS recommended)
- [ ] Security hardening applied
- [ ] K3s/Docker installed and configured
- [ ] PostgreSQL cluster with replication tested
- [ ] Redis Sentinel configured
- [ ] Load balancer (HAProxy) with VIP working
- [ ] SSL certificates installed
- [ ] DNS configured
- [ ] Backup scripts scheduled and tested
- [ ] Monitoring stack deployed (Prometheus + Grafana)
- [ ] Alerting configured and tested
- [ ] CI/CD pipeline connected
- [ ] Disaster recovery procedure documented and tested
- [ ] Security audit completed

### Go-Live Checklist

- [ ] Application deployed and health checks passing
- [ ] Database migrations applied
- [ ] Initial admin user created
- [ ] Integration with existing systems verified
- [ ] Performance testing completed
- [ ] Staff training completed
- [ ] Support contacts documented
- [ ] Runbook available to operations team

---

## Appendix A: Troubleshooting

### Common Issues

#### PostgreSQL Replication Not Working

```bash
# Check replication status
psql -c "SELECT * FROM pg_stat_replication;"

# Check WAL sender processes
ps aux | grep wal

# Verify network connectivity
nc -zv standby-server 5432
```

#### K3s Node Not Joining

```bash
# Check K3s service status
systemctl status k3s

# View K3s logs
journalctl -u k3s -f

# Verify token is correct
cat /var/lib/rancher/k3s/server/node-token
```

#### HAProxy Health Check Failing

```bash
# Test backend directly
curl -v http://backend-server:3000/health

# Check HAProxy stats
curl http://localhost:8404/stats

# View HAProxy logs
tail -f /var/log/haproxy.log
```

---

## Appendix B: Maintenance Procedures

### Rolling Update

```bash
# Update backend deployment
kubectl set image deployment/backend backend=registry/hospital-erp/backend:v1.2.0 -n hospital-erp

# Monitor rollout
kubectl rollout status deployment/backend -n hospital-erp

# Rollback if needed
kubectl rollout undo deployment/backend -n hospital-erp
```

### Database Maintenance

```bash
# Vacuum and analyze (during low traffic)
psql -c "VACUUM ANALYZE;"

# Reindex if needed
psql -c "REINDEX DATABASE hospital_erp;"

# Check table bloat
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

---

_Document End_
