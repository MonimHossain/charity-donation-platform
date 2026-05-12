# ICAC — Islamic Charity Audit Council

A full-stack monorepo for the Islamic Charity Audit Council platform, consisting of a Next.js frontend and an Express.js backend API.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Express.js, TypeScript, Bun (dev runtime) |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Storage | MinIO (S3-compatible) |
| Monorepo | Turborepo + pnpm workspaces |

---

## Local Development Setup

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Required for PostgreSQL and Redis |
| [Node.js](https://nodejs.org/) | ≥ 18 | Required by the toolchain |
| [pnpm](https://pnpm.io/installation) | 9.x | Package manager |
| [Bun](https://bun.sh/) | Latest | Used as the API dev runtime |

---

### 1. Install Docker

Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/) for your operating system.

Verify the installation:

```bash
docker --version
docker compose version
```

---

### 2. Clone the Repository

```bash
git clone https://github.com/hasan1119/ICAC.git
cd ICAC
```

---

### 3. Set Up pnpm

If pnpm is not installed, enable it via Node.js Corepack:

```bash
corepack enable
corepack prepare pnpm@9 --activate
```

Or install it directly:

```bash
npm install -g pnpm@9
```

Verify:

```bash
pnpm --version
```

---

### 4. Install Dependencies

From the project root, install all workspace packages in one command:

```bash
pnpm i
```

---

### 5. Start Infrastructure Services

Navigate to the `infra` directory and start PostgreSQL and Redis with Docker Compose:

```bash
cd infra
docker compose up -d
```

This starts:
- **PostgreSQL 16** on port `54321` (mapped from container port 5432)
- **Redis 7** on port `63792` (mapped from container port 6379)

Verify containers are running:

```bash
docker compose ps
```

Return to the project root when done:

```bash
cd ..
```

---

### 6. Configure Environment Variables

#### Backend (`apps/api`)

Copy the example env file:

```bash
cp apps/api/.env.example apps/api/.env
```

Open `apps/api/.env` and update the following required values:

```env
# JWT — replace with strong random secrets
ICAC_ADMIN_JWT_SECRET=replace-with-strong-secret
ICAC_ADMIN_RESET_SECRET=replace-with-strong-secret

# Default admin account (created on first run)
ICAC_ADMIN_EMAIL=admin@icac.org
ICAC_ADMIN_PASSWORD_HASH=<bcrypt hash of your chosen password>

# Database — matches the Docker Compose defaults
DATABASE_URL=postgresql://admin:admin123@localhost:54321/ICAC

# Redis — matches the Docker Compose defaults
REDIS_URL=redis://localhost:63792
```

All other values in `.env.example` can be left as-is for local development.

#### Frontend (`apps/web`)

Create a `.env.local` file in `apps/web`:

```bash
cp "apps/web/.env copy.local" apps/web/.env.local
```

The defaults point to the local backend:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:4000/api/v1
```

---

### 7. Run the Development Servers

From the project root, start both the frontend and backend in parallel:

```bash
pnpm run dev
```

Turborepo starts both workspaces concurrently:

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3001 |
| Backend API (Express) | http://localhost:4000 |
| API health check | http://localhost:4000/health |

The backend uses **Bun** as its dev runtime via `nodemon`. The database schema is auto-synced on first start, and seed data (admin user, sample charities, email templates) is created automatically.

---

## Project Structure

```
ICAC/
├── apps/
│   ├── api/          # Express.js backend (TypeScript + Bun)
│   └── web/          # Next.js 15 frontend (App Router)
├── packages/
│   ├── shared-types/ # Shared TypeScript types and enums
│   ├── ui/           # Shared UI components
│   ├── eslint-config/
│   └── typescript-config/
├── infra/
│   └── docker-compose.yaml   # PostgreSQL + Redis
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Useful Commands

```bash
# Run all dev servers
pnpm run dev

# Build all packages
pnpm run build

# Type-check all packages
pnpm check-types

# Lint all packages
pnpm run lint

# Run only the backend
pnpm --filter=api dev

# Run only the frontend
pnpm --filter=frontend dev

# Stop infrastructure containers
cd infra && docker compose down

# Stop containers and remove volumes (resets the database)
cd infra && docker compose down -v
```

---

## Default Admin Credentials

On first startup, the backend seeds a default admin account using the values in your `.env` file (`ICAC_ADMIN_EMAIL` and the password matching `ICAC_ADMIN_PASSWORD_HASH`).

The admin panel is accessible at: **http://localhost:3001/admin/login**
