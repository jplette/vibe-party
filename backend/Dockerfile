FROM golang:1.23-alpine AS builder

WORKDIR /app

# Download dependencies first (leverages Docker layer caching).
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o server ./cmd/server

# ---- Final image ----
FROM alpine:3.19

# ca-certificates: needed for HTTPS calls (Keycloak JWKS endpoint).
# wget: used by docker-compose healthcheck.
RUN apk --no-cache add ca-certificates wget

WORKDIR /app

COPY --from=builder /app/server .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

CMD ["./server"]
