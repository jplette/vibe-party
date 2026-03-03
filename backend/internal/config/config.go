package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config holds all application configuration sourced from environment variables.
type Config struct {
	DatabaseURL        string
	RedisURL           string
	KeycloakIssuer       string
	KeycloakInternalURL  string
	KeycloakClientID     string
	SMTPHost           string
	SMTPPort           int
	SMTPFrom           string
	AppPort            string
	AppEnv             string
	CORSAllowedOrigins []string
	FrontendURL        string
}

// Load reads configuration from environment variables and returns a validated Config.
// Returns an error if any required variable is missing or a value is malformed.
func Load() (*Config, error) {
	databaseURL, err := requireEnv("DATABASE_URL")
	if err != nil {
		return nil, err
	}

	keycloakIssuer, err := requireEnv("KEYCLOAK_ISSUER")
	if err != nil {
		return nil, err
	}

	smtpPortStr := getEnv("SMTP_PORT", "1025")
	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		return nil, fmt.Errorf("invalid SMTP_PORT %q: %w", smtpPortStr, err)
	}

	corsOrigins := parseCORSOrigins(os.Getenv("CORS_ALLOWED_ORIGINS"))

	cfg := &Config{
		DatabaseURL:        databaseURL,
		RedisURL:           getEnv("REDIS_URL", "redis://localhost:6379"),
		KeycloakIssuer:      keycloakIssuer,
		KeycloakInternalURL: getEnv("KEYCLOAK_INTERNAL_URL", keycloakIssuer),
		KeycloakClientID:    getEnv("KEYCLOAK_CLIENT_ID", "vibe-party-frontend"),
		SMTPHost:           getEnv("SMTP_HOST", "localhost"),
		SMTPPort:           smtpPort,
		SMTPFrom:           getEnv("SMTP_FROM", "noreply@vibe-party.app"),
		AppPort:            getEnv("APP_PORT", "8080"),
		AppEnv:             getEnv("APP_ENV", "development"),
		CORSAllowedOrigins: corsOrigins,
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:5173"),
	}

	return cfg, nil
}

func requireEnv(key string) (string, error) {
	val := os.Getenv(key)
	if val == "" {
		return "", fmt.Errorf("required environment variable %q is not set", key)
	}
	return val, nil
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func parseCORSOrigins(raw string) []string {
	if raw == "" {
		return []string{"http://localhost:5173"}
	}
	var origins []string
	for _, o := range strings.Split(raw, ",") {
		if trimmed := strings.TrimSpace(strings.TrimRight(o, "/")); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	if len(origins) == 0 {
		return []string{"http://localhost:5173"}
	}
	return origins
}
