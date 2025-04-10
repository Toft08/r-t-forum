package web

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
)

var (
	AllUsers = NewUserStore()
)

type UserStore struct {
	users map[string]bool
	mu    sync.Mutex
}

func NewUserStore() *UserStore {
	return &UserStore{
		users: make(map[string]bool),
	}
}

func (u *UserStore) AddUser(username string) {
	u.mu.Lock()
	defer u.mu.Unlock()
	u.users[username] = true
}

func (u *UserStore) GetAllUsers() []string {
	u.mu.Lock()
	defer u.mu.Unlock()

	users := make([]string, 0, len(u.users))
	for user := range u.users {
		users = append(users, user)
	}
	return users
}

func allUsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method Not Allowed"})
		return
	}
	cookie, err := r.Cookie("session_id")
	if err != nil {
		log.Println("No session cookie found:", err)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "User not logged in"})
		return
	}
	log.Printf("Session cookie: %s", cookie.Value)

	loggedIn, userID, username := VerifySession(r, db)
	if loggedIn {
		log.Printf("User %s (ID: %d) is logged in", username, userID)
	} else {
		log.Println("User is not logged in")
	}

	// Fetch all users from the database
	rows, err := db.Query("SELECT username FROM User where id != ?", userID)
	if err != nil {
		log.Println("Error fetching users from database:", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []string
	for rows.Next() {
		var username string
		if err := rows.Scan(&username); err != nil {
			log.Println("Error scanning user:", err)
			continue
		}
		users = append(users, username)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode("ok")
	var msg RealTimeMessage
	msg.Type = "allUsers"
	msg.Usernames = users
	clientsMu.Lock()
	conn, exists := clients[username]
	clientsMu.Unlock()


	
			if exists {
				// err := recipientConn.WriteJSON(msg)
				err := conn.WriteJSON(msg)
				if err != nil {
					log.Println("Error sending message:", err)
				}
			} else {
				log.Println( msg, "not found")
			}		
}

// // ActiveUserStore is a thread-safe struct to store active users
// type ActiveUserStore struct {
// 	sync.RWMutex
// 	users map[string]bool
// }

// // New creates a new ActiveUserStore instance
// func New() *ActiveUserStore {
// 	return &ActiveUserStore{
// 		users: make(map[string]bool),
// 	}
// }

// // AddUser marks a user as active
// func (store *ActiveUserStore) AddUser(username string) {
// 	store.Lock()
// 	defer store.Unlock()
// 	store.users[username] = true
// }

// // RemoveUser marks a user as inactive
// func (store *ActiveUserStore) RemoveUser(username string) {
// 	store.Lock()
// 	defer store.Unlock()
// 	delete(store.users, username)
// }

// // GetActiveUsers returns a list of active users
// func (store *ActiveUserStore) GetActiveUsers() []string {
// 	store.RLock()
// 	defer store.RUnlock()

// 	users := []string{}
// 	for user := range store.users {
// 		users = append(users, user)
// 	}
// 	return users
// }
