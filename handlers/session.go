// handlers/session.go
package handlers

import (
	"net/http"

	"github.com/gofrs/uuid" // or "github.com/google/uuid"
)

// Session stores for active user sessions
var sessions = make(map[string]string) // sessionID -> userID

// CreateSession creates a new session for a user
func CreateSession(w http.ResponseWriter, userID string) string {
	// Generate a unique session ID
	sessionID := uuid.Must(uuid.NewV4()).String()

	// Store the session
	sessions[sessionID] = userID

	// Set session cookie
	cookie := &http.Cookie{
		Name:     "session",
		Value:    sessionID,
		Path:     "/",
		MaxAge:   86400, // 1 day
		HttpOnly: true,
	}
	http.SetCookie(w, cookie)

	return sessionID
}

// GetUserIDFromSession retrieves the user ID from the session
func GetUserIDFromSession(r *http.Request) string {
	// Get session cookie
	cookie, err := r.Cookie("session")
	if err != nil {
		return ""
	}

	// Look up user ID by session ID
	userID, exists := sessions[cookie.Value]
	if !exists {
		return ""
	}

	return userID
}

// DestroySession removes a session
func DestroySession(w http.ResponseWriter, r *http.Request) {
	// Get session cookie
	cookie, err := r.Cookie("session")
	if err != nil {
		return
	}

	// Remove session from store
	delete(sessions, cookie.Value)

	// Clear cookie
	expiredCookie := &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	}
	http.SetCookie(w, expiredCookie)
}

// AuthMiddleware checks if a user is authenticated
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := GetUserIDFromSession(r)
		if userID == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}
