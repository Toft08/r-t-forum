package web

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// signUp handles both GET and POST requests for user registration
func SignUp(w http.ResponseWriter, r *http.Request, data *PageDetails) {
	w.Header().Set("Content-Type", "application/json")

	// Handle different HTTP methods
	switch r.Method {
	case http.MethodGet:
		// Render the initial signup page (can be used for the first load in SPA)
		RenderTemplate(w, "index", data)
	case http.MethodPost:
		// Handle signup via AJAX, return JSON responses
		handleSignUpPost(w, r)
	default:
		// If method is not GET or POST, return Method Not Allowed error
		http.Error(w, `{"error": "Method Not Allowed"}`, http.StatusMethodNotAllowed)
	}
}

func handleSignUpPost(w http.ResponseWriter, r *http.Request) {
	var requestData struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	// Decode the JSON request body
	err := json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, `{"error": "Invalid input"}`, http.StatusBadRequest)
		return
	}
	log.Println("Response:", `{"success": true, "message": "Signup successful"}`)

	// Validate username
	if !IsValidUsername(requestData.Username) {
		http.Error(w, `{"error": "Invalid username: must be 3-20 characters, letters, numbers, or _"}`, http.StatusBadRequest)
		return
	}

	// Validate email
	if !isValidEmail(requestData.Email) {
		http.Error(w, `{"error": "Invalid email address"}`, http.StatusBadRequest)
		return
	}

	// Check password
	if requestData.Password == "" {
		http.Error(w, `{"error": "Password cannot be empty"}`, http.StatusBadRequest)
		return
	}

	// Check if username or email is already taken
	uniqueUsername, uniqueEmail, err := isUsernameOrEmailUnique(db, requestData.Username, requestData.Email)
	if err != nil {
		log.Println("Error checking if username is unique:", err)
		http.Error(w, `{"error": "Internal Server Error"}`, http.StatusInternalServerError)
		return
	}

	if !uniqueUsername {
		http.Error(w, `{"error": "Username is already taken"}`, http.StatusBadRequest)
		return
	}
	if !uniqueEmail {
		http.Error(w, `{"error": "Email is already registered to existing user"}`, http.StatusBadRequest)
		return
	}

	// Hash the password
	hashedPassword, err := hashPassword(requestData.Password)
	if err != nil {
		log.Println("Error hashing password:", err)
		http.Error(w, `{"error1": "Internal Server Error"}`, http.StatusInternalServerError)
		return
	}

	// Insert user into database
	err = insertUserIntoDB(db, requestData.Username, requestData.Email, hashedPassword)
	if err != nil {
		log.Println("Error inserting user into database:", err)
		http.Error(w, `{"error2": "Internal Server Error"}`, http.StatusInternalServerError)
		return
	}

	// Return success message in JSON format
	w.WriteHeader(http.StatusOK)
	_, err = w.Write([]byte(`{"success": true, "message": "Signup successful"}`))
	if err != nil {
		log.Println("Error writing response:", err)
		http.Error(w, `{"error3": "Internal Server Error"}`, http.StatusInternalServerError)
	}
}

// hashPassword hashes the user's password using bcrypt
func hashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hashed), err
}

func insertUserIntoDB(db *sql.DB, username, email, password string) error {
	_, err := db.Exec(`
        INSERT INTO User (username, email, password, age, gender, firstname, lastname, created_at) 
        VALUES (?, ?, ?, ?)`,
		username, email, password, time.Now().Format("2006-01-02 15:04:05"))
	return err
}

// isValidEmail checks if the email address is valid
func isValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

// IsValidUsername checks if the username is valid
func IsValidUsername(username string) bool {
	re := regexp.MustCompile(`^[a-zA-Z0-9_]{3,20}$`) // Only letters, numbers, and _
	return re.MatchString(username)
}

// isUsernameOrEmailUnique checks if the username or email is unique in the database
func isUsernameOrEmailUnique(db *sql.DB, username, email string) (bool, bool, error) {
	if db == nil {
		return false, false, fmt.Errorf("database connection is nil")
	}
	username = strings.ToLower(username)
	email = strings.ToLower(email)

	var usernameCount, emailCount int

	// Check if username is unique
	err := db.QueryRow(`SELECT COUNT(*) FROM User WHERE username = ?`, username).Scan(&usernameCount)
	if err != nil {
		return false, false, err
	}

	// Check if email is unique
	err = db.QueryRow(`SELECT COUNT(*) FROM User WHERE email = ?`, email).Scan(&emailCount)
	if err != nil {
		return false, false, err
	}

	// Determine uniqueness
	isUsernameUnique := usernameCount == 0
	isEmailUnique := emailCount == 0

	return isUsernameUnique, isEmailUnique, nil
}
