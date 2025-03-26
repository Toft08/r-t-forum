package web

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Login handles both GET and POST requests for user authentication
func Login(w http.ResponseWriter, r *http.Request, data *PageDetails) {
	data.ValidationError = ""
	switch r.Method {
	// case http.MethodGet:
	// RenderTemplate(w, "login", data)
	case http.MethodPost:
		HandleLoginPost(w, r, data)
	default:
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}

func HandleLoginPost(w http.ResponseWriter, r *http.Request, data *PageDetails) {
	// Decode JSON payload
	var loginRequest struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	// Attempt to decode JSON body
	err := json.NewDecoder(r.Body).Decode(&loginRequest)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	username := loginRequest.Username
	password := loginRequest.Password

	// Rest of your existing authentication logic remains the same
	userID, hashedPassword, err := getUserCredentials(username)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid username"})
		return
	}

	// Verify password
	if err := verifyPassword(hashedPassword, password); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid password"})
		return
	}

	// Create session
	if err := createSession(w, userID); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Internal server error"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Login successful"})
}

// getUserCredentials retrieves the user's ID and hashed password from the database
func getUserCredentials(username string) (int, string, error) {
	var userID int
	var hashedPassword string

	err := db.QueryRow("SELECT id, password FROM User WHERE username = ?", username).Scan(&userID, &hashedPassword)
	if err != nil {
		return 0, "", err
	}
	return userID, hashedPassword, nil
}

// verifyPassword compares the hashed password with the password provided by the user
func verifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// createSession creates a new session for the user and stores it in the database
func createSession(w http.ResponseWriter, userID int) error {
	// First check for and delete any existing sessions for this user
	_, err := db.Exec("DELETE FROM Session WHERE user_id = ?", userID)
	if err != nil {
		return err
	}
	sessionID := uuid.NewString()
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Expires:  time.Now().Add(30 * time.Minute),
		HttpOnly: true,
		Path:     "/",
	})

	// Store session ID in database
	_, err = db.Exec("INSERT INTO Session (id, user_id, created_at) VALUES (?, ?, ?)",
		sessionID, userID, time.Now().Format("2006-01-02 15:04:05"))

	return err
}
