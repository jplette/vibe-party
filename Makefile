.PHONY: dev dev-build stop clean migrate migrate-down test test-backend test-frontend lint fmt logs

# Start all services (detached)
dev:
	docker compose up -d

# Rebuild and start all services
dev-build:
	docker compose up -d --build

# Stop all services
stop:
	docker compose down

# Stop and remove volumes (destructive!)
clean:
	docker compose down -v

# Run database migrations (up)
migrate:
	docker compose exec backend ./migrate -path /migrations -database "$$DATABASE_URL" up

# Run database migrations (down 1 step)
migrate-down:
	docker compose exec backend ./migrate -path /migrations -database "$$DATABASE_URL" down 1

# Run all tests
test: test-backend

# Run backend unit tests
test-backend:
	cd backend && go test ./... -v

# Run frontend unit tests
test-frontend:
	cd frontend && npm test

# Run Playwright E2E tests
test-e2e:
	cd frontend && npx playwright test

# Lint backend
lint:
	cd backend && golangci-lint run ./...

# Format backend code
fmt:
	cd backend && gofmt -w .

# Tail logs for all services
logs:
	docker compose logs -f

# Tail logs for a specific service: make logs-backend
logs-%:
	docker compose logs -f $*

# Generate sqlc code
sqlc:
	cd backend && sqlc generate

# Seed dev data
seed:
	cd backend && go run ./cmd/seed/...

# Open psql shell
psql:
	docker compose exec postgres psql -U vibe -d vibe_party
