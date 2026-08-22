# RenEl Enerji

Corporate website and admin panel for **RenEl Enerji**, a solar energy solutions company based in Turkey.

## Screenshots

| | |
| --- | --- |
| ![Homepage](docs/screenshots/anasayfa-hero.jpg) | ![Services](docs/screenshots/anasayfa-hizmetler.jpg) |
| Homepage — savings calculator widget, stats | Services section |
| ![Projects](docs/screenshots/projelerimiz.jpg) | ![Savings calculator](docs/screenshots/tasarruf-hesaplayici.jpg) |
| Completed projects, auto-synced counters | Savings calculator with live result |
| ![References](docs/screenshots/referanslar.jpg) | ![Blog](docs/screenshots/blog.jpg) |
| Client references | Blog |

## Tech Stack

| Layer          | Technology                                                      |
| -------------- | --------------------------------------------------------------- |
| Frontend       | React 19, Vite 8, Tailwind CSS 4                                |
| Backend        | NestJS, TypeORM, PostgreSQL, Redis                              |
| AI / Chatbot   | Groq                                                            |
| Analytics      | Umami                                                           |
| Logs           | In-panel log viewer (backend errors/warnings, 30-day retention) |
| Error Tracking | Sentry (optional)                                               |
| Deployment     | Docker Compose, Nginx, prerender (SEO for SPA)                  |

## Project Structure

```
renel-enerji/
├── frontend/          # React + Vite application
│   ├── src/
│   │   ├── components/    # Shared components
│   │   ├── pages/         # Pages
│   │   │   ├── admin/     # Admin panel pages
│   │   │   ├── projeler/  # Project detail pages
│   │   │   ├── hizmetler/ # Service detail pages
│   │   │   └── neden-biz/ # Why Us detail pages
│   │   ├── lib/           # Shared client-side logic (e.g. savings calculator)
│   │   ├── api/           # API request functions
│   │   └── contexts/      # React contexts
│   └── public/            # Static assets
├── backend/           # NestJS REST API
│   └── src/
│       ├── auth/            # JWT authentication + 2FA + login rate limiting
│       ├── projects/        # Projects module (incl. Instagram import)
│       ├── references/      # References module
│       ├── blog/            # Blog module
│       ├── faq/             # FAQ module
│       ├── chat/            # AI chatbot: conversations, lead capture, funnel tracking, KVKK retention purge
│       ├── analytics/       # Umami analytics integration
│       ├── sitemap/         # Dynamic sitemap generation
│       ├── weather/         # Weather integration
│       ├── upload/          # File upload
│       ├── groq/            # Groq AI client (chatbot + Instagram parsing)
│       ├── instagram-token/ # Instagram Graph API token refresh
│       ├── logs/            # DB-backed error/warning logs (admin panel viewer)
│       ├── webhooks/        # Instagram webhook receiver
│       └── common/          # Shared DTOs, encryption, logging, fetch helpers
└── docker-compose.yml # All services
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Local Development

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Set up environment variables
cp .env.example .env
cp backend/.env.example backend/.env

# Start the database
docker compose up db -d

# Start the backend (http://localhost:3001)
cd backend && npm run start:dev

# Start the frontend (http://localhost:5173)
cd frontend && npm run dev
```

### Production Deployment

```bash
# Set up environment variables
cp .env.production .env

# Build and start all services
docker compose up -d --build
```

**Required `.env` variables:**

```env
JWT_SECRET=            # Random string, min 32 characters
ADMIN_USERNAME=        # Admin username
ADMIN_PASSWORD_HASH=   # bcrypt hash, never a plain-text password
FRONTEND_URL=          # Frontend origin, required for CORS
CORS_ORIGINS=          # Optional comma-separated explicit CORS origin list;
                       # empty = derive www variant from FRONTEND_URL
REDIS_PASS=            # Random string, min 32 characters
APP_ENCRYPTION_KEY=    # openssl rand -hex 32 — encrypts stored 2FA/TOTP secrets
UMAMI_WEBSITE_ID=      # Website ID from Umami dashboard
UMAMI_USER=            # Umami username
UMAMI_PASS=            # Umami password
UMAMI_APP_SECRET=      # Umami app secret
```

Optional integrations (Groq chatbot, Instagram import, OpenWeather, Sentry, AI blog generation) are documented with setup notes in `backend/.env.example` — leave them blank to disable.

AI blog generation has its own guide: [docs/ai-content.md](docs/ai-content.md).

## Testing

```bash
# Unit tests
cd backend && npm test
cd frontend && npm test

# Backend e2e tests (needs throwaway Postgres + Redis on ports 5433/6380)
docker compose -f docker-compose.test.yml up -d
cd backend && npm run test:e2e
docker compose -f docker-compose.test.yml down
```

E2e tests are fully isolated from your local `backend/.env` — all configuration is pinned in `backend/test/setup-e2e.ts`. CI runs the same suite against GitHub Actions service containers.

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend (Nginx) | 8080 | React application |
| Backend (NestJS) | 3001 | REST API (internal) |
| Umami | 3002 | Analytics dashboard |
| PostgreSQL | 5432 | Main database (internal) |
| Redis | — | Login rate limiting / caching (internal) |
| Prerender | 3000 | Serves pre-rendered HTML to crawlers/bots for SEO (internal) |

## Database Backup & Restore

### Automated daily backups

`scripts/backup-db.sh` dumps the main database (and Umami, when up) to `~/backups` as gzipped SQL, keeps 14 days locally and copies the dumps off the VPS when an `rclone` remote is configured. Install it on the VPS as the deploy user:

```bash
# 1. (strongly recommended) configure an off-VPS target once:
rclone config   # create a remote named "renel-backup" (B2/S3/Drive/...)

# 2. schedule the nightly run:
crontab -e
0 2 * * * /home/deploy/renel-enerji/scripts/backup-db.sh >> /home/deploy/backups/backup.log 2>&1
```

Without an rclone remote the script still runs but the only copy stays on the VPS disk — it warns about this on every run.

### Manual backup / restore

```bash
# Backup (creates a timestamped SQL dump on the host)
docker compose exec -T db pg_dump -U renel renel_enerji > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore (overwrites existing data — stop the backend first to avoid writes mid-restore)
docker compose stop backend
cat backup_20260101_120000.sql | docker compose exec -T db psql -U renel renel_enerji
# gzipped dumps from the script: zcat renel_2026-07-13_0200.sql.gz | docker compose exec -T db psql -U renel renel_enerji
docker compose start backend
```

Uploaded files (project/blog media) live in the `uploads` volume — back up the host directory it's bound to (or `docker run --rm -v renel-enerji_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads.tar.gz -C /data .`) alongside the database dump.

## Admin Panel

| | |
| --- | --- |
| ![Dashboard](docs/screenshots/panel-dashboard.jpg) | ![Projects management](docs/screenshots/panel-projeler.jpg) |
| Dashboard — aggregate stats, quick actions | Project management |
| ![Analytics](docs/screenshots/panel-analitik.jpg) | |
| Analytics (Umami) | |

**Features:**
- Project management (create, edit, delete, media upload, Instagram import)
- References management
- Blog management (AI-generated posts appear in the same list with an **AI Draft** badge)
- AI Campaigns: autonomous blog-draft generation with OpenAI — see [docs/ai-content.md](docs/ai-content.md)
- FAQ management
- Chatbot lead management: transcripts, conversion funnel (KVKK: 6-month retention purge)
- Log viewer: backend errors/warnings with level filter (30-day retention)
- AI Generation Logs: one row per generation attempt, with tokens, cost and retry
- Site analytics (Umami integration)
- Account security: credential changes, two-factor authentication (2FA) setup
