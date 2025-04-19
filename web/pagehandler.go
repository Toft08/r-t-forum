package web

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"r-t-forum/database"
	"strings"
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

	path := r.URL.Path

	trimmedPath := strings.TrimPrefix(path, "/api/")

	nextSlashIndex := strings.Index(trimmedPath, "/")

	var page string
	if nextSlashIndex != -1 {
		page = trimmedPath[:nextSlashIndex]
	} else {
		page = trimmedPath
	}

	loggedIn, userID := VerifySession(r, db)

	if !loggedIn {
		switch page {
		case "login":
			Login(w, r, db)
		case "signup":
			SignUp(w, r, db)
		default:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Page Not Found"})
		}
	} else {
		switch page {
		case "check-session":
			checkSessionHandler(w, r, db)
		case "posts":
			FeedHandler(w, r)
		case "post":
			fmt.Printf("Handling post request for %s\n", r.URL.Path)
			PostHandler(w, r, userID)
		case "create-post":
			CreatePost(w, r, userID)
		case "logout":
			Logout(w, r)
		case "all-users":
			allUsersHandler(w, r)
		case "ws":
			handleChatWebSocket(w, r)
		case "getMessagesHandler":
			getMessagesHandler(w, r)
		default:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Page Not Found"})
		}
	}
}

// VerifySession checks if the session ID exists in the database
func VerifySession(r *http.Request, db *sql.DB) (bool, int) {
	var userID int
	cookie, err := r.Cookie("session_id")
	if err != nil {
		return false, 0
	}

	err = db.QueryRow("SELECT user_id FROM Session WHERE id = ?", cookie.Value).Scan(&userID)
	if err != nil {
		log.Printf("Error finding userID for session cookie %s: %v", cookie.Value, err)
		return false, 0
	}

	return true, userID
}

// API endpoint to check if the user is logged in
func checkSessionHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	_, err := r.Cookie("session_id")
	if err != nil {
		log.Println("No session cookie found:", err)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "User not logged in"})
		return
	}

	loggedIn, userID := VerifySession(r, db)
	if loggedIn {
		// log.Printf("User %s (ID: %d) is logged in", userID)
	} else {
		log.Println("User is not logged in")
	}
	username, err := database.FindUsernameByUserID(userID, db)
	if err != nil {
		fmt.Println(err)
	}
	response := map[string]interface{}{
		"loggedIn": loggedIn,
		"userID":   userID,
		"username": username,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
