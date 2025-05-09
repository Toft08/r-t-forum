package web

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Login handles both GET and POST requests for user authentication
func Login(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	log.Printf("Login request received - Method: %s", r.Method)
	switch r.Method {
	case http.MethodPost:
		HandleLoginPost(w, r)
	default:
		log.Printf("Unsupported method: %s", r.Method)
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}

// HandleLoginPost handles the user login form submission
func HandleLoginPost(w http.ResponseWriter, r *http.Request) {
	var loginRequest LoginRequest
	// Attempt to decode JSON body
	err := json.NewDecoder(r.Body).Decode(&loginRequest)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	loginID := loginRequest.LoginID

	userID, username, hashedPassword, err := getUserCredentials(loginID)
	if err != nil {
		fmt.Println(err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid username"})
		return
	}

	// Verify password
	if err := verifyPassword(hashedPassword, loginRequest.Password); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid password"})
		return
	}

	// Create a session for the user
	if err := createSession(w, userID); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Internal server error"})
		return
	}
	AllUsers.AddUser(username)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Login successful",
		"token":   "Session",
	})
	
}

// getUserCredentials retrieves the user's ID and hashed password from the database
func getUserCredentials(loginID string) (int, string, string, error) {
	var userID int
	var username, hashedPassword string

	err := db.QueryRow("SELECT id, username ,password FROM User WHERE username = ? OR email = ?", loginID, loginID).Scan(&userID, &username, &hashedPassword)
	if err != nil {
		return 0, "", "", err
	}
	return userID, username, hashedPassword, nil
}

// verifyPassword compares the hashed password with the password provided by the user
func verifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// createSession creates a new session for the user and stores it in the database
func createSession(w http.ResponseWriter, userID int) error {
	// First check for and delete any existing sessions for this user
	_, err := db.Exec("UPDATE Session SET status = 'deleted', updated_at = ? WHERE user_id = ? AND status = 'active'",
		time.Now().Format("2006-01-02 15:04:05"), userID)
	if err != nil {
		log.Println("Error deleting existing session:", err)
		return err
	}
	sessionID := uuid.NewString()
	expiredAt := time.Now().Add(30 * time.Minute).Format("2006-01-02 15:04:05")

	http.SetCookie(w, &http.Cookie{
		Name:    "session_id",
		Value:   sessionID,
		Expires: time.Now().Add(30 * time.Minute),
		Secure:  true,
		Path:    "/",
	})

	// Store session ID in database, including the expired_at field
	_, err = db.Exec("INSERT INTO Session (id, user_id, created_at, updated_at, expired_at) VALUES (?, ?, ?, ?, ?)",
		sessionID, userID, time.Now().Format("2006-01-02 15:04:05"), time.Now().Format("2006-01-02 15:04:05"), expiredAt)
	if err != nil {
		log.Println("Error inserting session into database:", err)
		return err
	}

	return nil
}
