# Development Environment Setup Guide

## Document Information

| Item             | Content          |
| ---------------- | ---------------- |
| Document Version | 0.1.0.0          |
| Created Date     | 2025-12-29       |
| Status           | Draft            |
| Manager          | kcenon@naver.com |

---

## 1. Required Software

### 1.1 Runtime and Package Manager

| Software           | Version  | Purpose                    | Installation                            |
| ------------------ | -------- | -------------------------- | --------------------------------------- |
| **Node.js**        | 20.x LTS | JavaScript runtime         | [nodejs.org](https://nodejs.org) or nvm |
| **pnpm**           | 9.x+     | Package manager            | `npm install -g pnpm@9`                 |
| **Docker**         | 24.x+    | Container environment      | [docker.com](https://docker.com)        |
| **Docker Compose** | 2.x+     | Multi-container management | Included in Docker Desktop              |

### 1.2 Database and Cache

| Software       | Version | Purpose       | Note                         |
| -------------- | ------- | ------------- | ---------------------------- |
| **PostgreSQL** | 16.x    | Main database | Docker or local installation |
| **Redis**      | 7.x     | Session/cache | Docker recommended           |

### 1.3 Development Tools

| Tool                   | Purpose         | Note               |
| ---------------------- | --------------- | ------------------ |
| **VS Code**            | IDE             | Recommended editor |
| **Git**                | Version control | 2.40+              |
| **Postman / Insomnia** | API testing     | Optional           |
| **DBeaver**            | DB client       | Optional           |

---

## 2. Node.js Installation

### 2.1 Using nvm (Recommended)

```bash
# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# After restarting shell
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 2.2 Windows (nvm-windows)

```powershell
# Using Chocolatey
choco install nvm

# Or direct installation
# https://github.com/coreybutler/nvm-windows/releases

nvm install 20
nvm use 20
```

### 2.3 pnpm Installation

```bash
# Install via npm (specific version for project compatibility)
npm install -g pnpm@9

# Or standalone installation (recommended)
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verify
pnpm --version  # 9.x.x
```

---

## 3. Docker Environment Setup

### 3.1 Docker Desktop Installation

- **macOS/Windows**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: Install Docker Engine + Docker Compose

```bash
# Verify Docker version
docker --version        # Docker version 24.x.x
docker compose version  # Docker Compose version v2.x.x
```

### 3.2 Development Docker Compose

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: hospital-erp-db
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: hospital_user
      POSTGRES_PASSWORD: hospital_dev_password
      POSTGRES_DB: hospital_erp_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U hospital_user -d hospital_erp_dev']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: hospital-erp-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # Development mail server (optional)
  mailhog:
    image: mailhog/mailhog
    container_name: hospital-erp-mail
    ports:
      - '1025:1025' # SMTP
      - '8025:8025' # Web UI

volumes:
  postgres_data:
  redis_data:
```

### 3.3 Docker Commands

```bash
# Start services
docker compose -f docker-compose.dev.yml up -d

# Check service status
docker compose -f docker-compose.dev.yml ps

# View logs
docker compose -f docker-compose.dev.yml logs -f postgres

# Stop services
docker compose -f docker-compose.dev.yml down

# Delete including volumes (reset data)
docker compose -f docker-compose.dev.yml down -v
```

---

## 4. Project Setup

### 4.1 Clone Repository

```bash
# Clone repository
git clone https://github.com/your-org/hospital-erp.git
cd hospital-erp

# Check branches
git branch -a
```

### 4.2 Monorepo Structure

```
hospital-erp/
├── apps/
│   ├── frontend/          # Next.js app
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── backend/           # NestJS app
│       ├── src/
│       ├── prisma/
│       ├── package.json
│       └── nest-cli.json
│
├── packages/
│   ├── shared/            # Shared types, utilities
│   ├── ui/                # Shared UI components
│   └── config/            # ESLint, TS config
│
├── docker/
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
│
├── scripts/
│   ├── init-db.sql
│   └── seed.ts
│
├── package.json           # Root package.json
├── pnpm-workspace.yaml    # pnpm workspace
├── turbo.json             # Turborepo config
└── .env.example           # Environment variable template
```

### 4.3 Install Dependencies

```bash
# Install all packages from root
pnpm install

# Install specific app only
pnpm --filter frontend install
pnpm --filter backend install
```

### 4.4 Environment Variable Setup

```bash
# Copy .env.example
cp .env.example .env.local

# Or per app
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env.local
```

**Backend Environment Variables (.env)**

```env
# App settings
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://hospital_user:hospital_dev_password@localhost:5432/hospital_erp_dev?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_ACCESS_SECRET="your-super-secret-access-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_ACCESS_EXPIRATION="1h"
JWT_REFRESH_EXPIRATION="7d"

# Encryption
ENCRYPTION_KEY="32-byte-hex-key-for-aes-256-encryption"

# Legacy system integration (optional)
LEGACY_DB_HOST=localhost
LEGACY_DB_PORT=1433
LEGACY_DB_USER=legacy_user
LEGACY_DB_PASSWORD=legacy_password
LEGACY_DB_NAME=legacy_db
```

**Frontend Environment Variables (.env.local)**

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# App settings
NEXT_PUBLIC_APP_NAME="Inpatient Management System"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

---

## 5. Database Setup

### 5.1 Prisma Initialization

```bash
# Navigate to Backend directory
cd apps/backend

# Generate Prisma client
pnpm prisma generate

# Run migrations (development)
pnpm prisma migrate dev --name init

# Check migration status
pnpm prisma migrate status
```

### 5.2 Seed Data

```bash
# Run seed data
pnpm prisma db seed

# Or run directly
pnpm ts-node prisma/seed.ts
```

### 5.3 Prisma Studio (DB GUI)

```bash
# Start Prisma Studio
pnpm prisma studio

# Access in browser at http://localhost:5555
```

---

## 6. Running Development Server

### 6.1 Run All Services

```bash
# Run all apps from root (Turborepo)
pnpm dev

# Result:
# - Frontend: http://localhost:8080
# - Backend:  http://localhost:3000
# - API Docs: http://localhost:3000/api/docs
```

### 6.2 Run Individual Services

```bash
# Run Frontend only
pnpm --filter frontend dev

# Run Backend only
pnpm --filter backend dev

# Backend (watch mode)
pnpm --filter backend start:dev
```

### 6.3 Verify Running

```bash
# Backend health check
curl http://localhost:3000/health

# Access Frontend
open http://localhost:8080
```

---

## 7. VS Code Setup

### 7.1 Recommended Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    // Required
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

    // Utilities
    "christian-kohler.path-intellisense",
    "mikestead.dotenv",
    "humao.rest-client",

    // Docker
    "ms-azuretools.vscode-docker"
  ]
}
```

### 7.2 Workspace Settings

```json
// .vscode/settings.json
{
  // Editor
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
  "eslint.workingDirectories": ["apps/frontend", "apps/backend", "packages/*"],

  // Tailwind CSS
  "tailwindCSS.experimental.classRegex": [["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]],

  // File associations
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // Search exclusions
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true
  }
}
```

### 7.3 Debugging Settings

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

## 8. Git Setup

### 8.1 Git Hooks (Husky)

```bash
# Initialize Husky
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

### 8.2 lint-staged Configuration

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"],
    "*.prisma": ["prisma format"]
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
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Formatting
        'refactor', // Refactoring
        'test', // Tests
        'chore', // Other
        'perf', // Performance
        'ci', // CI/CD
        'revert', // Rollback
      ],
    ],
    'scope-enum': [
      2,
      'always',
      ['frontend', 'backend', 'shared', 'ui', 'db', 'auth', 'patient', 'room', 'report'],
    ],
  },
};
```

---

## 9. Troubleshooting

### 9.1 Common Issues

| Issue                     | Cause                 | Solution                          |
| ------------------------- | --------------------- | --------------------------------- |
| `EACCES` permission error | npm global permission | Use nvm or change npm prefix      |
| Port conflict             | Port already in use   | `lsof -i :3000` then kill process |
| Prisma client error       | Not generated         | `pnpm prisma generate`            |
| Docker connection failed  | Service not running   | `docker compose up -d`            |

### 9.2 Frequently Used Commands

```bash
# Clean cache
pnpm store prune
rm -rf node_modules && pnpm install

# Reset Prisma
pnpm prisma migrate reset

# Clean Docker
docker system prune -a

# Check ports
lsof -i :3000
lsof -i :5432
lsof -i :6379
```

---

## 10. Checklist

### Development Environment Setup Verification

- [ ] Node.js 20.x installed
- [ ] pnpm 8.x installed
- [ ] Docker Desktop running
- [ ] PostgreSQL container running
- [ ] Redis container running
- [ ] Dependencies installed (`pnpm install`)
- [ ] Environment variables configured (`.env`)
- [ ] Prisma migration completed
- [ ] Development server running verified
- [ ] VS Code extensions installed
