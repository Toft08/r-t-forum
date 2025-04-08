package web

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

var db *sql.DB

// PageDetails contains the data to be passed to the HTML templates
func Handler(w http.ResponseWriter, r *http.Request, database *sql.DB) {

	db = database
	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		log.Printf("Unsupported method: %s", r.Method)
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	switch r.URL.Path {
	case "/":
		// HomePage(w, r, &data)
	case "/api/login":
		Login(w, r, db)
	case "/api/signup":
		SignUp(w, r, db)
	case "/api/posts":
		PostsHandler(w, r)
	case "/api/create-post":
		CreatePost(w, r, &PageDetails{})
	case "/api/logout":
		Logout(w, r)
	case "/api/check-session":
		checkSessionHandler(w, r)
	default:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Page Not Found"})
	}
}

// VerifySession checks if the session ID exists in the database
func VerifySession(r *http.Request) (bool, int, string) {
	var userID int
	var username string
	cookie, err := r.Cookie("session_id")
	if err != nil {
		return false, 0, ""
	}

	err = db.QueryRow("SELECT user_id FROM Session WHERE id = ?", cookie.Value).Scan(&userID)
	if err != nil {
		log.Println("No userID found for the cookie")
		return false, 0, ""
	}

	err = db.QueryRow("SELECT username FROM User WHERE id = ?", userID).Scan(&username)
	if err != nil {
		log.Println("No username found")
		return false, 0, ""
	}

	return true, userID, username
}

// API endpoint to check if the user is logged in
func checkSessionHandler(w http.ResponseWriter, r *http.Request) {
	loggedIn, userID, username := VerifySession(r)

	// Build response based on session validity
	response := map[string]interface{}{
		"loggedIn": loggedIn,
		"userID":   userID,
		"username": username,
	}

	// Set Content-Type header and encode the response as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
