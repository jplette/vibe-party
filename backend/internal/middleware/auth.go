package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-jose/go-jose/v4"
	"github.com/go-jose/go-jose/v4/jwt"
	"github.com/redis/go-redis/v9"
	"github.com/vibe-party/backend/internal/model"
	"github.com/vibe-party/backend/internal/service"
)

const jwksCacheKey = "jwks:keycloak"
const jwksCacheTTL = time.Hour

// keycloakClaims holds the JWT claims we care about from Keycloak tokens.
type keycloakClaims struct {
	jwt.Claims
	Email             string `json:"email"`
	Name              string `json:"name"`
	PreferredUsername string `json:"preferred_username"`
	RealmAccess       struct {
		Roles []string `json:"roles"`
	} `json:"realm_access"`
}

// JWTAuth returns a middleware that validates Keycloak bearer tokens.
// On success, it upserts the user in the DB and stores them in the request context.
//
// keycloakIssuer is the public-facing issuer URL (matches the "iss" claim in tokens,
// e.g. http://localhost:8180/realms/vibe-party).
// jwksBaseURL is the internal URL used to fetch JWKS (may differ inside Docker,
// e.g. http://keycloak:8180/realms/vibe-party).
func JWTAuth(
	keycloakIssuer string,
	jwksBaseURL string,
	clientID string,
	redisClient *redis.Client,
	userSvc *service.UserService,
	logger *slog.Logger,
) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractBearerToken(r)
			if token == "" {
				respondAuthError(w, http.StatusUnauthorized, "missing or invalid authorization header")
				return
			}

			jwks, err := getJWKS(r.Context(), jwksBaseURL, redisClient, logger)
			if err != nil {
				logger.ErrorContext(r.Context(), "failed to fetch JWKS", slog.String("error", err.Error()))
				respondAuthError(w, http.StatusInternalServerError, "authentication unavailable")
				return
			}

			claims, err := validateToken(token, jwks, keycloakIssuer)
			if err != nil {
				// Signature failure may be due to stale cached JWKS (e.g. Keycloak
				// restarted and generated new keys). Evict cache and retry once.
				if strings.Contains(err.Error(), "cryptographic primitive") || strings.Contains(err.Error(), "verify claims") {
					logger.Info("token verification failed with cached JWKS, refetching")
					evictJWKSCache(r.Context(), redisClient, logger)
					jwks, err = fetchJWKS(r.Context(), jwksBaseURL, redisClient, logger)
					if err == nil {
						claims, err = validateToken(token, jwks, keycloakIssuer)
					}
				}
				if err != nil {
					logger.DebugContext(r.Context(), "token validation failed", slog.String("error", err.Error()))
					respondAuthError(w, http.StatusUnauthorized, "invalid or expired token")
					return
				}
			}

			// Determine display name: prefer Name, fall back to PreferredUsername, then Email.
			name := claims.Name
			if name == "" {
				name = claims.PreferredUsername
			}
			if name == "" {
				name = claims.Email
			}

			// Upsert user in DB — keeps local records in sync with Keycloak.
			user, err := userSvc.SyncUser(r.Context(), claims.Subject, claims.Email, name)
			if err != nil {
				logger.ErrorContext(r.Context(), "failed to sync user", slog.String("error", err.Error()))
				respondAuthError(w, http.StatusInternalServerError, "user sync failed")
				return
			}

			// Store user in context for downstream handlers.
			ctx := context.WithValue(r.Context(), model.ContextKeyUser, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// respondAuthError writes a minimal JSON error response without importing the handler package.
func respondAuthError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg}) //nolint:errcheck
}

// extractBearerToken pulls the token from the Authorization: Bearer <token> header.
func extractBearerToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}

// getJWKS returns JWKS from Redis cache if available, otherwise fetches from Keycloak.
func getJWKS(ctx context.Context, jwksBaseURL string, redisClient *redis.Client, logger *slog.Logger) (*jose.JSONWebKeySet, error) {
	if redisClient != nil {
		cached, err := redisClient.Get(ctx, jwksCacheKey).Result()
		if err == nil && cached != "" {
			var jwks jose.JSONWebKeySet
			if jsonErr := json.Unmarshal([]byte(cached), &jwks); jsonErr == nil {
				return &jwks, nil
			}
			logger.Warn("failed to unmarshal cached JWKS, refetching")
		}
	}
	return fetchJWKS(ctx, jwksBaseURL, redisClient, logger)
}

// fetchJWKS always fetches fresh JWKS from Keycloak (bypassing cache) and stores the result.
func fetchJWKS(ctx context.Context, jwksBaseURL string, redisClient *redis.Client, logger *slog.Logger) (*jose.JSONWebKeySet, error) {
	certsURL := strings.TrimRight(jwksBaseURL, "/") + "/protocol/openid-connect/certs"
	resp, err := http.Get(certsURL) //nolint:gosec // URL is from trusted server config
	if err != nil {
		return nil, fmt.Errorf("fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("JWKS endpoint returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read JWKS body: %w", err)
	}

	var jwks jose.JSONWebKeySet
	if err := json.Unmarshal(body, &jwks); err != nil {
		return nil, fmt.Errorf("parse JWKS: %w", err)
	}

	if redisClient != nil {
		if setErr := redisClient.Set(ctx, jwksCacheKey, string(body), jwksCacheTTL).Err(); setErr != nil {
			logger.Warn("failed to cache JWKS in Redis", slog.String("error", setErr.Error()))
		}
	}

	return &jwks, nil
}

// evictJWKSCache removes the cached JWKS from Redis.
func evictJWKSCache(ctx context.Context, redisClient *redis.Client, logger *slog.Logger) {
	if redisClient == nil {
		return
	}
	if err := redisClient.Del(ctx, jwksCacheKey).Err(); err != nil {
		logger.Warn("failed to evict JWKS cache", slog.String("error", err.Error()))
	}
}

// validateToken parses and validates the JWT signature, issuer, and expiry.
// Audience is intentionally not validated: Keycloak access tokens carry aud=["account"]
// by default, not the client ID. Signature + issuer + expiry is sufficient for a
// resource server.
func validateToken(tokenStr string, jwks *jose.JSONWebKeySet, issuer string) (*keycloakClaims, error) {
	tok, err := jwt.ParseSigned(tokenStr, []jose.SignatureAlgorithm{
		jose.RS256, jose.RS384, jose.RS512,
		jose.ES256, jose.ES384, jose.ES512,
	})
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	if len(tok.Headers) == 0 {
		return nil, fmt.Errorf("token has no headers")
	}

	// Select the signing key by key ID (kid).
	kid := tok.Headers[0].KeyID
	var signingKey *jose.JSONWebKey
	for i := range jwks.Keys {
		k := &jwks.Keys[i]
		if k.KeyID == kid {
			signingKey = k
			break
		}
	}
	if signingKey == nil {
		// Fall back to first key if no kid match (some Keycloak versions omit kid).
		if len(jwks.Keys) > 0 {
			signingKey = &jwks.Keys[0]
		} else {
			return nil, fmt.Errorf("no matching JWKS key found for kid %q", kid)
		}
	}

	var claims keycloakClaims
	if err := tok.Claims(signingKey.Public(), &claims); err != nil {
		return nil, fmt.Errorf("verify claims: %w", err)
	}

	// Validate issuer and expiry with a 30s clock-skew leeway.
	expected := jwt.Expected{
		Issuer: issuer,
		Time:   time.Now(),
	}

	if err := claims.ValidateWithLeeway(expected, 30*time.Second); err != nil {
		return nil, fmt.Errorf("claims validation: %w", err)
	}

	return &claims, nil
}
