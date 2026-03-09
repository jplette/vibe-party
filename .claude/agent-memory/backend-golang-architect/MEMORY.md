# Backend Architect Memory — vibe-party

## Project Overview
Event planning web app. Backend: Go 1.23+, PostgreSQL 16, Redis 7, Keycloak 24.

## Stack & Module
- Module: `github.com/vibe-party/backend`
- Router: `github.com/go-chi/chi/v5` v5.1.0
- DB driver: `github.com/jackc/pgx/v5` (pool: `pgxpool`)
- Migrations: `github.com/golang-migrate/migrate/v4` — uses `pgx/v5` driver, needs `pgx5://` URL scheme
- JWT: `github.com/go-jose/go-jose/v4` — `jwt.Expected{AnyAudience: jwt.Audience{clientID}, Issuer: ..., Time: time.Now()}`
- Redis: `github.com/redis/go-redis/v9` (NOT go-redis/redis/v9)
- Email: `gopkg.in/gomail.v2`
- Logging: stdlib `log/slog`

## Architecture
`Middleware → Handler → Service → Repository → DB`

- `cmd/server/main.go` — wiring and startup
- `internal/config/` — env-based config (no panics, returns errors)
- `internal/model/models.go` — all domain types + ContextKey constants
- `internal/repository/` — pgx queries only, returns `repository.ErrNotFound`
- `internal/service/` — business logic, translates repo errors to `service.Err*`
- `internal/handler/` — HTTP, uses `handler.RequireUser()`, `handler.HandleServiceError()`
- `internal/middleware/` — no imports from handler package (avoids circularity)
- `internal/email/` — gomail SMTP, no SMTP AUTH for dev (MailHog)

## Critical Details
- **golang-migrate URL**: Must convert `postgres://` → `pgx5://` before passing to migrate.New()
- **JWKS caching**: Redis key `jwks:keycloak`, TTL 1 hour; falls back gracefully if Redis down
- **User sync**: Every authenticated request upserts user via `users.UpsertByKeycloakID()`
- **Rate limiting**: In-memory token bucket; 100 req/min global, 20 req/min for POST invitations
- **Invitation tokens**: `crypto/rand` 32 bytes, base64 URL-encoded
- **Middleware does NOT import handler package** — writes JSON errors inline

## Keycloak / JWT
- JWKS endpoint: `{KEYCLOAK_ISSUER}/protocol/openid-connect/certs`
- Supported algorithms: RS256, RS384, RS512, ES256, ES384, ES512
- Audience validated via `jwt.Expected.AnyAudience = jwt.Audience{clientID}`
- Clock leeway: 30 seconds

## DB Connection
- pgxpool: MaxConns=25, MinConns=5, MaxConnLifetime=1h, MaxConnIdleTime=30m

## Environment Variables
DATABASE_URL (required), KEYCLOAK_ISSUER (required), REDIS_URL, KEYCLOAK_CLIENT_ID,
SMTP_HOST, SMTP_PORT, SMTP_FROM, APP_PORT, APP_ENV, CORS_ALLOWED_ORIGINS, FRONTEND_URL

## go.sum
Run `go mod tidy` in backend/ after any dependency changes to regenerate go.sum.
