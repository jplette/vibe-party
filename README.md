# vibe-party

Event planning and invitation management app. Authenticated users can create events, invite others, and track RSVPs.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, PrimeReact v10, PrimeFlex |
| Backend | Go 1.23, Chi v5 router, pgx/v5, golang-migrate |
| Auth | Keycloak 24 (OIDC/PKCE), go-jose/v4 JWT validation |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Email (dev) | Mailpit |
| Keycloak theme | Keycloakify v11 + React 18 + PrimeReact |

## Services

| Service | Port | Description |
|---|---|---|
| Frontend | 5173 | React SPA |
| Backend API | 8080 | Go REST API |
| Keycloak | 8180 | Auth server |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | JWT JWKS cache |
| Mailpit | 8025 | Email web UI (dev) |

## Quick start

**Prerequisites:** Docker, Node >= 18, Go 1.23+, Maven (for Keycloak theme builds only)

```bash
# First time — build the Keycloak theme JAR, then start all services
make build-theme && make dev

# Subsequent starts (theme JAR already built)
make dev
```

> **Note:** On first run, or after `make clean`, Keycloak imports the realm from `keycloak/realm-export.json`. If you change the realm config, run `make clean && make dev` to re-import.

## Common commands

```bash
make dev               # Start all services (detached)
make dev-build         # Rebuild images and start
make stop              # Stop all services
make clean             # Stop and remove all volumes (destructive — resets DB)
make logs              # Tail all logs
make logs-backend      # Tail logs for a specific service
make test-backend      # Run Go unit tests
make test-frontend     # Run frontend unit tests (vitest)
make test-e2e          # Run Playwright E2E tests
make build-theme       # Build Keycloak login theme JAR
make sync-theme-assets # Sync fonts + CSS variables from frontend/ to keycloak-theme/
make theme-storybook   # Open Storybook for theme page development
make migrate           # Run DB migrations up
make migrate-down      # Roll back one migration
make psql              # Open psql shell
make seed              # Seed development data
make fmt               # Format Go code
make lint              # Run golangci-lint
```

## Seed users (Keycloak)

| Username | Password | Role |
|---|---|---|
| admin | admin123 | global-admin |
| alice | alice123 | user |
| bob | bob123 | user |

## Project structure

```
vibe-party/
  frontend/          # React SPA
  backend/           # Go REST API
  keycloak-theme/    # Custom Keycloak login theme (Keycloakify v11)
  keycloak/          # Keycloak realm config
  postgres/          # DB init scripts
  Makefile
  docker-compose.yml
```

### Frontend (`frontend/`)

React SPA built with Vite. Auth via `oidc-client-ts` (PKCE flow), tokens stored in memory (Zustand). API calls via `ky` with a Bearer token interceptor.

Pages: Dashboard, Event List, Event Detail, Event Create/Edit/Settings, Invitation Accept/Decline.

```bash
cd frontend
npm install
npm run dev          # Vite dev server at :5173
npm test             # Unit tests (vitest)
npx playwright test  # E2E tests
```

### Backend (`backend/`)

Go REST API. Layered architecture: `Middleware → Handler → Service → Repository → DB`.

Middleware chain: Recovery → RequestID → slog Logging → CORS → RateLimiter → JWTAuth.

```bash
cd backend
go run ./cmd/server  # Requires env vars (see backend/CLAUDE.md)
go test ./...
```

### Keycloak theme (`keycloak-theme/`)

Custom login UI built with Keycloakify v11 + React 18 + PrimeReact. Matches the app's design system exactly (Lato font, Atomic Tangerine primary, Steel Azure nav).

Five custom pages: Login, Register, Reset Password, Verify Email, Error.

```bash
make build-theme                         # Build JAR → keycloak-theme/dist_keycloak/
cd keycloak-theme && npm run dev         # Local preview with mock Keycloak context
cd keycloak-theme && npm run start-keycloak  # Live test against a local Keycloak container
make theme-storybook                     # Storybook for isolated page development
make sync-theme-assets                   # Re-sync fonts + CSS vars from frontend/
```

After changing theme source files, rebuild the JAR and restart Keycloak:

```bash
make build-theme && docker compose restart keycloak
```

## Design system

| Token | Value |
|---|---|
| Primary (Atomic Tangerine) | `#ff6b35` |
| Nav (Steel Azure) | `#004e89` |
| Surface (Beige) | `#efefd0` |
| Font | Lato (local, `/public/fonts/lato/`) |
| Component library | PrimeReact v10, theme: `lara-light-amber` |

CSS variables live in `frontend/src/styles/_variables.css` and are synced to `keycloak-theme/src/styles/_variables.css` via `make sync-theme-assets`.

## Email (development)

Outbound email is captured by Mailpit. View sent emails at [http://localhost:8025](http://localhost:8025).

## Troubleshooting

**Keycloak shows default theme after `make dev`**
The realm already exists in the DB — Keycloak skips re-import. Run `make clean && make build-theme && make dev` to reset.

**Keycloak theme changes not showing**
Rebuild the JAR and restart Keycloak: `make build-theme && docker compose restart keycloak`

**`make dev` fails on first run**
Run `make build-theme` first to generate the `dist_keycloak/` directory that docker-compose mounts.

**Backend can't connect to Keycloak**
Keycloak takes ~60–90 seconds to start. The backend retries JWKS fetches automatically.
