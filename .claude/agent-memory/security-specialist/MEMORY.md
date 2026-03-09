# Security Specialist Memory — vibe-party

## Project Architecture Summary
- React+PrimeReact SPA (frontend/) — OIDC/PKCE via oidc-client-ts, tokens in Zustand memory store (NOT localStorage)
- Go + Chi backend (backend/) — JWT validated via JWKS from Keycloak, pgx v5 parameterized queries throughout
- PostgreSQL, Redis (JWKS cache), Keycloak (OIDC), Mailpit (dev SMTP)
- Docker Compose wires all 6 services

## Auth Pattern
- Backend: JWTAuth middleware validates RS256/ES256 Keycloak tokens, upserts user in DB on every request
- Frontend: oidc-client-ts PKCE flow, access tokens stored in Zustand (in-memory), never localStorage
- Audience validation intentionally skipped (documented in auth.go line 191); issuer + signature + expiry checked

## Known Security Issues Found (2026-03-05 audit)

### Critical
- Hardcoded credentials in docker-compose.yml: POSTGRES_PASSWORD=vibe_secret, KEYCLOAK_ADMIN_PASSWORD=admin
- sslmode=disable in DATABASE_URL throughout docker-compose and .env.example

### High
- GET /users/{id} endpoint has no authorization — any authenticated user can enumerate all user UUIDs and retrieve profiles (IDOR)
- Invitation token exposed in ListInvitations API response (model.Invitation includes Token field)
- Rate limiter trusts X-Forwarded-For header blindly — trivial to bypass by spoofing the header
- /ready health endpoint leaks internal DB/Redis error details publicly (no auth)
- JWT audience not validated (aud claim) — tokens issued for other clients accepted

### Medium
- Nginx config missing all security headers (no CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- SMTP configured with nil auth (unauthenticated relay) — acceptable in dev but no guard for prod
- Backend container runs as root (no USER directive in Dockerfile)
- mailpit image uses :latest tag
- Invitation email HTML template vulnerable to email header injection via eventName/recipientEmail (no sanitization)
- DecodeJSON leaks schema structure in error messages ("invalid request body: json: unknown field...")
- sessionStorage used for post-login redirect in CallbackPage and InvitationAcceptPage

### Low
- No request body size limit on backend (no http.MaxBytesReader)
- Clock skew leeway of 30s is adequate but no nbf validation documented
- No Content-Security-Policy on backend API responses
- golang.org/x/crypto v0.25.0 — check for updates

## Architecture Security Notes
- All SQL queries use pgx v5 parameterized statements — no injection risk found
- Service layer enforces membership checks on all event-scoped operations
- Admin role required for UpdateEvent, DeleteEvent, CancelInvitation
- Only membership (not admin) required for todo/item create/update/delete — intentional design
- CORS is allowlist-based, not wildcard
- Redis JWKS cache eviction on signature failure provides key rotation resilience

## Key File Paths for Security Review
- backend/internal/middleware/auth.go — JWT validation
- backend/internal/middleware/cors.go — CORS policy
- backend/internal/middleware/ratelimit.go — rate limiting (IP trust issue)
- backend/internal/handler/users.go — IDOR vulnerability
- backend/internal/model/models.go — Invitation struct exposes Token
- backend/internal/service/invitations.go — token generation, SendInvitation email
- backend/internal/email/email.go — SMTP, HTML injection risk
- backend/internal/handler/health.go — /ready info disclosure
- docker-compose.yml — hardcoded secrets
- frontend/nginx.conf — missing security headers
- frontend/src/auth/AuthProvider.tsx — InMemoryWebStorage (good)
- frontend/src/stores/authStore.ts — token in memory only (good)
