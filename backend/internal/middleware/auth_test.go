package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestExtractBearerToken(t *testing.T) {
	tests := []struct {
		name      string
		authValue string
		wantToken string
	}{
		{
			name:      "valid Bearer token",
			authValue: "Bearer eyJhbGciOiJSUzI1NiJ9.payload.sig",
			wantToken: "eyJhbGciOiJSUzI1NiJ9.payload.sig",
		},
		{
			name:      "lowercase bearer is accepted",
			authValue: "bearer my-token",
			wantToken: "my-token",
		},
		{
			name:      "mixed case bearer is accepted",
			authValue: "BEARER my-token",
			wantToken: "my-token",
		},
		{
			name:      "missing Authorization header returns empty",
			authValue: "",
			wantToken: "",
		},
		{
			name:      "non-Bearer scheme returns empty",
			authValue: "Basic dXNlcjpwYXNz",
			wantToken: "",
		},
		{
			name:      "only scheme without token returns empty",
			authValue: "Bearer",
			wantToken: "",
		},
		{
			name:      "token with internal spaces is trimmed",
			authValue: "Bearer  my-token ",
			wantToken: "my-token",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if tt.authValue != "" {
				req.Header.Set("Authorization", tt.authValue)
			}

			got := extractBearerToken(req)
			if got != tt.wantToken {
				t.Errorf("got token %q; want %q", got, tt.wantToken)
			}
		})
	}
}
