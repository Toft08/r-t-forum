package web

import (
	"encoding/json"
	"log"
	"net/http"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// SignUp handles user registration via JSON requests
func SignUp(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var user struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
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

	// Check if username or email is already in use
	uniqueUsername, uniqueEmail, err := isUsernameOrEmailUnique(user.Username, user.Email)
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
	err = insertUserIntoDB(user.Username, user.Email, hashedPassword)
	if err != nil {
		log.Println("Error inserting user into database:", err)
		http.Error(w, `{"error": "Internal Server Error"}`, http.StatusInternalServerError)
		return
	}

	// Respond with success message
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Signup successful"})
}

// func handleSignUpPost(w http.ResponseWriter, r *http.Request, data *PageDetails) {
// 	username := r.FormValue("username")
// 	email := r.FormValue("email")
// 	password := r.FormValue("password")

// 	// Validate username
// 	if !IsValidUsername(username) {
// 		data.ValidationError = "Invalid username: must be 3-20 characters, letters, numbers, or _"
// 		RenderTemplate(w, "signup", data)
// 		return
// 	}

// 	if !isValidEmail(email) {
// 		data.ValidationError = "Invalid email address"
// 		RenderTemplate(w, "signup", data)
// 		return
// 	}
// 	if password == "" {
// 		data.ValidationError = "Password cannot be empty"
// 		RenderTemplate(w, "signup", data)
// 		return
// 	}

// 	uniqueUsername, uniqueEmail, err := isUsernameOrEmailUnique(username, email)
// 	if err != nil {
// 		log.Println("Error checking if username is unique:", err)
// 		ErrorHandler(w, "Internal Server Error", http.StatusInternalServerError)
// 		return
// 	}
// 	if !uniqueUsername {
// 		data.ValidationError = "Username is already taken"
// 		RenderTemplate(w, "signup", data)
// 		return
// 	}
// 	if !uniqueEmail {
// 		data.ValidationError = "Email is already registered to existing user"
// 		RenderTemplate(w, "signup", data)
// 		return
// 	}

// 	// Hash the password
// 	hashedPassword, err := hashPassword(password)
// 	if err != nil {
// 		log.Println("Error hashing password:", err)
// 		ErrorHandler(w, "Internal Server Error", http.StatusInternalServerError)
// 		return
// 	}

// 	// Insert user into database
// 	err = insertUserIntoDB(username, email, hashedPassword)
// 	if err != nil {
// 		log.Println("Error inserting user into database:", err)
// 		ErrorHandler(w, "Internal Server Error", http.StatusInternalServerError)
// 		return
// 	}

// 	http.Redirect(w, r, "/login", http.StatusFound)
// }

// hashPassword hashes the user's password using bcrypt
func hashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hashed), err
}

// insertUserIntoDB inserts the user's details into the database
func insertUserIntoDB(username, email, hashedPassword string) error {
	_, err := db.Exec("INSERT INTO User (username, email, password, created_at) VALUES (?, ?, ?, ?)",
		username, email, hashedPassword, time.Now().Format("2006-01-02 15:04:05"))
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
func isUsernameOrEmailUnique(username, email string) (bool, bool, error) {
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
