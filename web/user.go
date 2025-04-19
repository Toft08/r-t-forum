package web

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
)

// Global user store
var AllUsers = NewUserStore()

// UserStore manages the collection of users
type UserStore struct {
	users map[string]bool
	mu    sync.Mutex
}

// NewUserStore creates a new user store
func NewUserStore() *UserStore {
	return &UserStore{
		users: make(map[string]bool),
	}
}

// AddUser adds a username to the store
func (u *UserStore) AddUser(username string) {
	u.mu.Lock()
	defer u.mu.Unlock()
	u.users[username] = true
}

// GetAllUsers returns a slice of all usernames in the store
func (u *UserStore) GetAllUsers() []string {
	u.mu.Lock()
	defer u.mu.Unlock()

	users := make([]string, 0, len(u.users))
	for user := range u.users {
		users = append(users, user)
	}
	return users
}

// allUsersHandler responds to requests for all users
func allUsersHandler(w http.ResponseWriter, r *http.Request) {
	// Check if method is allowed
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method Not Allowed"})
		return
	}

	// Check if user is logged in
	_, err := r.Cookie("session_id")
	if err != nil {
		log.Println("No session cookie found:", err)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "User not logged in"})
		return
	}

	// Verify session and get user ID
	_, userID := VerifySession(r, db)
	
	// Get requesting user's username
	var username string
	err = db.QueryRow("SELECT username FROM User WHERE id = ?", userID).Scan(&username)
	if err != nil {
		log.Println("Error fetching username from userID:", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	
	// Fetch all other users from the database
	rows, err := db.Query("SELECT username FROM User WHERE id != ?", userID)
	if err != nil {
		log.Println("Error fetching users from database:", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Build user list
	var users []string
	for rows.Next() {
		var user string
		if err := rows.Scan(&user); err != nil {
			log.Println("Error scanning user:", err)
			continue
		}
		users = append(users, user)
	}

	// Send HTTP response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode("ok")
	
	// Send WebSocket message with user list
	msg := RealTimeMessage{
		Type:      "allUsers",
		Usernames: users,
	}
	
	// Find the user's WebSocket connection
	clientsMu.Lock()
	conn, exists := clients[username]
	clientsMu.Unlock()

	// Send the user list over WebSocket if connection exists
	if exists {
		if err := conn.WriteJSON(msg); err != nil {
			log.Println("Error sending user list to client:", err)
		}
	} else {
		log.Println("WebSocket connection for user", username, "not found")
	}
}