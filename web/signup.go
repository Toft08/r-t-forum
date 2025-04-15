package web

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"net/mail"
	"regexp"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// SignUp handles user registration via JSON requests
func SignUp(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Method Not Allowed",
		})
		return
	}

	var user struct {
		Username        string `json:"username"`
		Age             int    `json:"age"`
		Gender          string `json:"gender"`
		FirstName       string `json:"firstname"`
		LastName        string `json:"lastname"`
		Email           string `json:"email"`
		Password        string `json:"password"`
		ConfirmPassword string `json:"confirmpassword"`
	}

	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, `{"error": "Invalid JSON data"}`, http.StatusBadRequest)
		return
	}

	// Validate username
	if !IsValidUsername(user.Username) {
		http.Error(w, `{"error": "Invalid username: must be 3-20 characters, letters, numbers, or _"}`, http.StatusBadRequest)
		return
	}

	// Validate email
	if !isValidEmail(user.Email) {
		http.Error(w, `{"error": "Invalid email address"}`, http.StatusBadRequest)
		return
	}

	// Validate password
	if user.Password == "" {
		http.Error(w, `{"error": "Password cannot be empty"}`, http.StatusBadRequest)
		return
	}
	if user.FirstName == "" || user.LastName == "" {
		http.Error(w, `{"error": "First name and last name are required"}`, http.StatusBadRequest)
		return
	}

	if user.Age <= 0 || user.Age > 120 {
		http.Error(w, `{"error": "Invalid age"}`, http.StatusBadRequest)
		return
	}

	if user.Gender != "male" && user.Gender != "female" && user.Gender != "other" {
		http.Error(w, `{"error": "Invalid gender"}`, http.StatusBadRequest)
		return
	}

	if user.Password != user.ConfirmPassword {
		http.Error(w, `{"error": "Passwords do not match"}`, http.StatusBadRequest)
		return
	}

	// Check if username or email is already in use
	uniqueUsername, uniqueEmail, err := isUsernameOrEmailUnique(user.Username, user.Email, db)
	if err != nil {
		log.Println("Error checking user uniqueness:", err)
		http.Error(w, `{"error": "Internal Server Error"}`, http.StatusInternalServerError)
		return
	}
	if !uniqueUsername {
		http.Error(w, `{"error": "Username is already taken"}`, http.StatusConflict)
		return
	}
	if !uniqueEmail {
		http.Error(w, `{"error": "Email is already registered"}`, http.StatusConflict)
		return
	}

	// Hash the password
	hashedPassword, err := hashPassword(user.Password)
	if err != nil {
		log.Println("Error hashing password:", err)
		http.Error(w, `{"error": "Internal Server Error"}`, http.StatusInternalServerError)
		return
	}

	// Insert user into database
	err = insertUserIntoDB(user.Username, user.Email, hashedPassword, user.Age, user.Gender, user.FirstName, user.LastName, db)

	if err != nil {
		log.Println("Error inserting user into database:", err)
		http.Error(w, `{"error": "Internal Server Error"}`, http.StatusInternalServerError)
		return
	}

	// Respond with success message
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Signup successful"})
	tellAllToUpdate()
}

func tellAllToUpdate() {
	var msg RealTimeMessage
	msg.Type = "update"

	onlineUsers := []string{}
	clientsMu.Lock()
	for username := range clients {
		onlineUsers = append(onlineUsers, username)
	}
	clientsMu.Unlock()

	msg.Usernames = onlineUsers

	clientsMu.Lock()
	for _, conn := range clients {
		err := conn.WriteJSON(msg)
		if err != nil {
			log.Println("Error sending update:", err)
		}
	}
	clientsMu.Unlock()
}

// hashPassword hashes the user's password using bcrypt
func hashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hashed), err
}

// insertUserIntoDB inserts the user's details into the database
func insertUserIntoDB(username, email, hashedPassword string, age int, gender, firstname, lastname string, db *sql.DB) error {
	_, err := db.Exec(`INSERT INTO user (username, email, password, age, gender, firstname, lastname, created_at)
					   VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
		username, email, hashedPassword, age, gender, firstname, lastname)
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
func isUsernameOrEmailUnique(username, email string, db *sql.DB) (bool, bool, error) {
	username = strings.ToLower(username)
	email = strings.ToLower(email)

	var count int
	err := db.QueryRow(`
        SELECT COUNT(*) 
        FROM User 
        WHERE username = ?`, username).Scan(&count)
	if err != nil || count != 0 {
		return false, false, err
	}
	err = db.QueryRow(`
        SELECT COUNT(*) 
        FROM User 
        WHERE email = ?`, email).Scan(&count)
	if err != nil || count != 0 {
		return true, false, err
	}
	return true, true, nil // Returns true if neither username nor email exists
}
