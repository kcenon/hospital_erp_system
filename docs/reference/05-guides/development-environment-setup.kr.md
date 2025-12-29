# 개발 환경 설정 가이드

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 0.1.0.0 |
| 작성일 | 2025-12-29 |
| 상태 | 초안 |
| 관리자 | kcenon@naver.com |

---

## 1. 필수 소프트웨어

### 1.1 런타임 및 패키지 매니저

| 소프트웨어 | 버전 | 용도 | 설치 방법 |
|-----------|------|------|----------|
| **Node.js** | 20.x LTS | JavaScript 런타임 | [nodejs.org](https://nodejs.org) 또는 nvm |
| **pnpm** | 8.x+ | 패키지 매니저 | `npm install -g pnpm` |
| **Docker** | 24.x+ | 컨테이너 환경 | [docker.com](https://docker.com) |
| **Docker Compose** | 2.x+ | 멀티 컨테이너 관리 | Docker Desktop 포함 |

### 1.2 데이터베이스 및 캐시

| 소프트웨어 | 버전 | 용도 | 비고 |
|-----------|------|------|------|
| **PostgreSQL** | 16.x | 메인 데이터베이스 | Docker 또는 로컬 설치 |
| **Redis** | 7.x | 세션/캐시 | Docker 권장 |

### 1.3 개발 도구

| 도구 | 용도 | 비고 |
|------|------|------|
| **VS Code** | IDE | 권장 에디터 |
| **Git** | 버전 관리 | 2.40+ |
| **Postman / Insomnia** | API 테스트 | 선택 |
| **DBeaver** | DB 클라이언트 | 선택 |

---

## 2. Node.js 설치

### 2.1 nvm 사용 (권장)

```bash
# nvm 설치 (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 셸 재시작 후
nvm install 20
nvm use 20
nvm alias default 20

# 확인
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 2.2 Windows (nvm-windows)

```powershell
# Chocolatey 사용
choco install nvm

# 또는 직접 설치
# https://github.com/coreybutler/nvm-windows/releases

nvm install 20
nvm use 20
```

### 2.3 pnpm 설치

```bash
# npm으로 설치
npm install -g pnpm

# 또는 standalone 설치 (권장)
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 확인
pnpm --version  # 8.x.x
```

---

## 3. Docker 환경 설정

### 3.1 Docker Desktop 설치

- **macOS/Windows**: [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치
- **Linux**: Docker Engine + Docker Compose 설치

```bash
# Docker 버전 확인
docker --version        # Docker version 24.x.x
docker compose version  # Docker Compose version v2.x.x
```

### 3.2 개발용 Docker Compose

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: hospital-erp-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: hospital_user
      POSTGRES_PASSWORD: hospital_dev_password
      POSTGRES_DB: hospital_erp_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hospital_user -d hospital_erp_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: hospital-erp-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 개발용 메일 서버 (선택)
  mailhog:
    image: mailhog/mailhog
    container_name: hospital-erp-mail
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # Web UI

volumes:
  postgres_data:
  redis_data:
```

### 3.3 Docker 명령어

```bash
# 서비스 시작
docker compose -f docker-compose.dev.yml up -d

# 서비스 상태 확인
docker compose -f docker-compose.dev.yml ps

# 로그 확인
docker compose -f docker-compose.dev.yml logs -f postgres

# 서비스 중지
docker compose -f docker-compose.dev.yml down

# 볼륨 포함 삭제 (데이터 초기화)
docker compose -f docker-compose.dev.yml down -v
```

---

## 4. 프로젝트 설정

### 4.1 저장소 클론

```bash
# 저장소 클론
git clone https://github.com/your-org/hospital-erp.git
cd hospital-erp

# 브랜치 확인
git branch -a
```

### 4.2 모노레포 구조

```
hospital-erp/
├── apps/
│   ├── frontend/          # Next.js 앱
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── backend/           # NestJS 앱
│       ├── src/
│       ├── prisma/
│       ├── package.json
│       └── nest-cli.json
│
├── packages/
│   ├── shared/            # 공유 타입, 유틸리티
│   ├── ui/                # 공유 UI 컴포넌트
│   └── config/            # ESLint, TS 설정
│
├── docker/
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
│
├── scripts/
│   ├── init-db.sql
│   └── seed.ts
│
├── package.json           # 루트 package.json
├── pnpm-workspace.yaml    # pnpm 워크스페이스
├── turbo.json             # Turborepo 설정
└── .env.example           # 환경 변수 템플릿
```

### 4.3 의존성 설치

```bash
# 루트에서 모든 패키지 설치
pnpm install

# 특정 앱만 설치
pnpm --filter frontend install
pnpm --filter backend install
```

### 4.4 환경 변수 설정

```bash
# .env.example을 복사
cp .env.example .env.local

# 또는 앱별로
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env.local
```

**Backend 환경 변수 (.env)**

```env
# 앱 설정
NODE_ENV=development
PORT=3000

# 데이터베이스
DATABASE_URL="postgresql://hospital_user:hospital_dev_password@localhost:5432/hospital_erp_dev?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_ACCESS_SECRET="your-super-secret-access-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_ACCESS_EXPIRATION="1h"
JWT_REFRESH_EXPIRATION="7d"

# 암호화
ENCRYPTION_KEY="32-byte-hex-key-for-aes-256-encryption"

# 레거시 시스템 연동 (선택)
LEGACY_DB_HOST=localhost
LEGACY_DB_PORT=1433
LEGACY_DB_USER=legacy_user
LEGACY_DB_PASSWORD=legacy_password
LEGACY_DB_NAME=legacy_db
```

**Frontend 환경 변수 (.env.local)**

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# 앱 설정
NEXT_PUBLIC_APP_NAME="입원환자 관리 시스템"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

---

## 5. 데이터베이스 설정

### 5.1 Prisma 초기화

```bash
# Backend 디렉토리로 이동
cd apps/backend

# Prisma 클라이언트 생성
pnpm prisma generate

# 마이그레이션 실행 (개발)
pnpm prisma migrate dev --name init

# 마이그레이션 상태 확인
pnpm prisma migrate status
```

### 5.2 시드 데이터

```bash
# 시드 데이터 실행
pnpm prisma db seed

# 또는 직접 실행
pnpm ts-node prisma/seed.ts
```

### 5.3 Prisma Studio (DB GUI)

```bash
# Prisma Studio 실행
pnpm prisma studio

# 브라우저에서 http://localhost:5555 접속
```

---

## 6. 개발 서버 실행

### 6.1 전체 서비스 실행

```bash
# 루트에서 모든 앱 실행 (Turborepo)
pnpm dev

# 결과:
# - Frontend: http://localhost:8080
# - Backend:  http://localhost:3000
# - API Docs: http://localhost:3000/api/docs
```

### 6.2 개별 서비스 실행

```bash
# Frontend만 실행
pnpm --filter frontend dev

# Backend만 실행
pnpm --filter backend dev

# Backend (watch 모드)
pnpm --filter backend start:dev
```

### 6.3 실행 확인

```bash
# Backend 헬스체크
curl http://localhost:3000/health

# Frontend 접속
open http://localhost:8080
```

---

## 7. VS Code 설정

### 7.1 권장 확장 프로그램

```json
// .vscode/extensions.json
{
  "recommendations": [
    // 필수
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",

    // TypeScript
    "ms-vscode.vscode-typescript-next",

    // React/Next.js
    "dsznajder.es7-react-js-snippets",
    "bradlc.vscode-tailwindcss",

    // Git
    "eamodio.gitlens",
    "mhutchie.git-graph",

    // 유틸리티
    "christian-kohler.path-intellisense",
    "mikestead.dotenv",
    "humao.rest-client",

    // Docker
    "ms-azuretools.vscode-docker"
  ]
}
```

### 7.2 워크스페이스 설정

```json
// .vscode/settings.json
{
  // 에디터
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },

  // TypeScript
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always",

  // ESLint
  "eslint.workingDirectories": [
    "apps/frontend",
    "apps/backend",
    "packages/*"
  ],

  // Tailwind CSS
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],

  // 파일 연결
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // 검색 제외
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true
  }
}
```

### 7.3 디버깅 설정

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "backend", "start:debug"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "restart": true
    },
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:8080",
      "webRoot": "${workspaceFolder}/apps/frontend"
    },
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "backend", "test", "--", "--runInBand"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 8. Git 설정

### 8.1 Git Hooks (Husky)

```bash
# Husky 초기화
pnpm dlx husky-init && pnpm install

# pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
EOF

# commit-msg hook (Conventional Commits)
cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm commitlint --edit $1
EOF
```

### 8.2 lint-staged 설정

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml}": [
      "prettier --write"
    ],
    "*.prisma": [
      "prisma format"
    ]
  }
}
```

### 8.3 Conventional Commits

```js
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 새 기능
        'fix',      // 버그 수정
        'docs',     // 문서
        'style',    // 포맷팅
        'refactor', // 리팩토링
        'test',     // 테스트
        'chore',    // 기타
        'perf',     // 성능
        'ci',       // CI/CD
        'revert'    // 롤백
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'frontend',
        'backend',
        'shared',
        'ui',
        'db',
        'auth',
        'patient',
        'room',
        'report'
      ]
    ]
  }
};
```

---

## 9. 트러블슈팅

### 9.1 일반적인 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| `EACCES` 권한 오류 | npm 글로벌 권한 | nvm 사용 또는 npm prefix 변경 |
| 포트 충돌 | 이미 사용 중인 포트 | `lsof -i :3000` 후 프로세스 종료 |
| Prisma 클라이언트 오류 | 생성 안됨 | `pnpm prisma generate` |
| Docker 연결 실패 | 서비스 미실행 | `docker compose up -d` |

### 9.2 자주 사용하는 명령어

```bash
# 캐시 정리
pnpm store prune
rm -rf node_modules && pnpm install

# Prisma 재설정
pnpm prisma migrate reset

# Docker 정리
docker system prune -a

# 포트 확인
lsof -i :3000
lsof -i :5432
lsof -i :6379
```

---

## 10. 체크리스트

### 개발 환경 설정 완료 확인

- [ ] Node.js 20.x 설치됨
- [ ] pnpm 8.x 설치됨
- [ ] Docker Desktop 실행 중
- [ ] PostgreSQL 컨테이너 실행 중
- [ ] Redis 컨테이너 실행 중
- [ ] 의존성 설치 완료 (`pnpm install`)
- [ ] 환경 변수 설정 완료 (`.env`)
- [ ] Prisma 마이그레이션 완료
- [ ] 개발 서버 실행 확인
- [ ] VS Code 확장 설치 완료
