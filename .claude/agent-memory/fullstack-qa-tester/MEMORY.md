# QA Tester Agent Memory — vibe-party

## Project Stack
- Frontend: React 19 + TypeScript + PrimeReact 10 (lara-light-amber theme) + Vite 6
- Auth: Keycloak OIDC/PKCE via oidc-client-ts, tokens in Zustand authStore (memory only)
- API: ky client with Bearer token interceptor
- State: TanStack Query v5 + Zustand v5
- Forms: react-hook-form + zod

## Test Infrastructure (Frontend)
- Unit/Integration: Vitest v2 + React Testing Library v16 + jsdom
- E2E: Playwright v1.58 (Chromium only by default)
- Setup file: `frontend/src/test/setup.ts`
- Shared utilities: `frontend/src/test/utils.tsx` — renderWithProviders, mockUseAuth, makeEvent/makeTodo/makeBringItem/makeEventMember factories
- Config: `frontend/vitest.config.ts`, `frontend/playwright.config.ts`

## Test Commands
- `npm run test:run` — run all unit tests once
- `npm run test` — vitest watch mode
- `npm run test:coverage` — coverage with v8
- `npm run test:e2e` — Playwright E2E (requires `make dev`)

## Mock Patterns
- useAuth: `vi.mock('../../auth/useAuth', () => ({ useAuth: vi.fn() }))` + `vi.mocked(useAuth).mockReturnValue(mockUseAuth({...}))`
- useNavigate: `vi.mock('react-router-dom', async (importOriginal) => { ...actual, useNavigate: () => mockNavigate })`
- Hook mocks (useEvents, useTodos, etc): full module mock with vi.fn() returning typed partial objects
- CSS modules: auto-mocked in setup.ts via Proxy (returns class name as string)
- PrimeReact Dropdown renders both a hidden `<option>` AND a visible `<span>` for placeholder text — use `getAllByText` not `getByText` for placeholder assertions

## Pitfalls Found
- `@testing-library/dom` must be installed separately (not bundled with @testing-library/react)
- `jsdom` must be installed as a devDep; Vitest does not bundle it
- PrimeReact Tag values (e.g., "Upcoming", "Past") can duplicate text in the DOM alongside stat labels — use `getAllByText(...).length >= 1` for assertions
- PrimeReact section headings containing todo titles can cause duplicate `/done/i` matches — use `getAllByText`
- `@vitest/coverage-v8` version must match vitest version; install with `--legacy-peer-deps`

## E2E Notes
- Keycloak serves login at localhost:8180; app redirects there automatically
- Seed users: alice/alice123, bob/bob123
- E2E fixtures: `e2e/fixtures/auth.ts` — `authenticatedPage` fixture pre-logs in as alice
- E2E Page Objects: `e2e/pages/LoginPage.ts`, `DashboardPage.ts`, `EventFormPage.ts`
- E2E requires full Docker stack: `make dev`
- 40 E2E tests across 4 spec files: auth.spec.ts, dashboard.spec.ts, events.spec.ts, invitation.spec.ts

## File Locations (Frontend)
- Unit tests: `src/<domain>/__tests__/*.test.tsx`
- E2E specs: `frontend/e2e/*.spec.ts`
- E2E page objects: `frontend/e2e/pages/`
- E2E fixtures: `frontend/e2e/fixtures/`

## Backend Test Infrastructure
- Framework: stdlib `testing` package only (no external test libraries)
- Run command: `go test ./...` from `backend/`; `-race` flag used to detect data races
- Test files co-located with source: `internal/<pkg>/*_test.go`

## Backend Test Patterns
- Services use unexported interfaces (defined in `internal/service/repos.go`) for all repo deps
- Mocks live in `internal/service/mocks_test.go` in `package service` (not `package service_test`) to access unexported interface types
- Constructor helpers `newTestEventService`, `newTestTodoService`, etc. build services with mock deps
- Async email in InvitationService.SendInvitation is tested with a buffered channel (NOT a bool flag) to avoid race conditions
- Mock function closures with multiple string params: use exact count — `name, _, _ string` for 3 strings, NOT `name, _, _, _ string`
- `go test -race ./...` is required to catch goroutine races in async paths

## Backend Test Files Created
- `internal/handler/respond_test.go` — RespondJSON, RespondError, DecodeJSON
- `internal/handler/errors_test.go` — HandleServiceError (all 5 sentinel errors + wrapped errors)
- `internal/handler/context_test.go` — UserFromContext, RequireUser
- `internal/handler/health_test.go` — Health liveness endpoint
- `internal/middleware/cors_test.go` — CORS (7 cases: allowed/disallowed origin, OPTIONS preflight, headers)
- `internal/middleware/ratelimit_test.go` — tokenBucket.allow, RateLimiter middleware, extractIP
- `internal/middleware/auth_test.go` — extractBearerToken (7 cases)
- `internal/model/models_test.go` — Invitation.ToResponse (token stripping + all statuses)
- `internal/service/repos.go` — repository interfaces (eventRepository, todoRepository, etc.)
- `internal/service/mocks_test.go` — all mock implementations + newTest*Service helpers
- `internal/service/events_test.go` — EventService (all 6 methods, 19 cases)
- `internal/service/todos_test.go` — TodoService (all 6 methods, 17 cases)
- `internal/service/invitations_test.go` — InvitationService (all 6 methods, 17 cases)
- `internal/service/users_test.go` — UserService (all 4 methods, 8 cases)
