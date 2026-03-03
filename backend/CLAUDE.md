# Backend — Go

## Stack
- Go 1.23+
- Chi v5 router (`github.com/go-chi/chi/v5`)
- pgx/v5 for PostgreSQL (`github.com/jackc/pgx/v5`)
- golang-migrate for migrations (`github.com/golang-migrate/migrate/v4`)
- go-jose/v4 for JWT validation (`github.com/go-jose/go-jose/v4`)
- go-redis/v9 for Redis (`github.com/redis/go-redis/v9`)
- gomail.v2 for SMTP (`gopkg.in/gomail.v2`)

## Architecture
Layered: `Middleware → Handler → Service → Repository → DB`

- `cmd/server/main.go` — wires everything together, starts HTTP server
- `internal/config/` — environment-based configuration
- `internal/middleware/` — auth, CORS, logging, rate limiting
- `internal/handler/` — HTTP request/response parsing; delegates to services
- `internal/service/` — business logic and authorization checks
- `internal/repository/` — DB I/O only; no business logic
- `internal/model/` — shared data types and context keys
- `internal/email/` — SMTP email sending via gomail
- `migrations/` — SQL migration files for golang-migrate

## Key Patterns

### Authentication
- Auth middleware (`internal/middleware/auth.go`) validates Keycloak JWT bearer tokens
- JWKS fetched from `{KEYCLOAK_ISSUER}/protocol/openid-connect/certs` and cached in Redis for 1 hour
- On each authenticated request, user is upserted in DB and stored in `context` under `model.ContextKeyUser`
- Use `handler.RequireUser(w, r)` to extract user from context in handlers

### Authorization
- Services check event membership via `eventRepo.GetMemberRole()`
- Admin-only actions (update/delete event, cancel invitation) explicitly require `role == "admin"`
- `repository.ErrNotFound` is translated to `service.ErrForbidden` for membership checks

### Error Handling
- Repository returns `repository.ErrNotFound` for missing rows
- Service wraps and translates to `service.Err*` sentinel errors
- `handler.HandleServiceError()` maps service errors to HTTP status codes
- JSON error shape: `{"error": "message"}`

### Repository Queries
- All queries use pgx v5 parameterized statements (no string concatenation)
- No ORM — plain SQL in repository functions
- `scanUser`, `scanEvent`, etc. are local scan helpers for consistent mapping

## Running
```bash
cd backend
go run ./cmd/server          # start server (requires env vars)
go test ./...                # run all tests
go build -o server ./cmd/server && ./server  # build and run
```

## Environment Variables
| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | required | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `KEYCLOAK_ISSUER` | required | e.g. `http://localhost:8180/realms/vibe-party` |
| `KEYCLOAK_CLIENT_ID` | `vibe-party-frontend` | JWT audience claim |
| `SMTP_HOST` | `localhost` | SMTP server host |
| `SMTP_PORT` | `1025` | SMTP server port |
| `SMTP_FROM` | `noreply@vibe-party.app` | Sender address |
| `APP_PORT` | `8080` | HTTP listen port |
| `APP_ENV` | `development` | `development` or `production` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated list |
| `FRONTEND_URL` | `http://localhost:5173` | Used in invitation email links |
