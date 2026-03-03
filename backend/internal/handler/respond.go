package handler

import (
	"encoding/json"
	"net/http"
)

// RespondJSON writes a JSON response with the given status code and body.
func RespondJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if body != nil {
		if err := json.NewEncoder(w).Encode(body); err != nil {
			// At this point headers are sent; nothing more we can do.
			return
		}
	}
}

// RespondError writes a structured JSON error response.
func RespondError(w http.ResponseWriter, status int, message string) {
	RespondJSON(w, status, map[string]string{"error": message})
}

// DecodeJSON decodes the request body into dest. Returns false and writes an
// error response if decoding fails, so callers can early-return on false.
func DecodeJSON(w http.ResponseWriter, r *http.Request, dest any) bool {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dest); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return false
	}
	return true
}
