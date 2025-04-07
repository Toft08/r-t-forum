package web

import (
	"encoding/json"
	"net/http"
	"sync"
)

var (
	AllUsers = NewUserStore()
)
type UserStore struct {
	users map[string]bool
	mu sync.Mutex
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

	users := make([]string, 0 , len(u.users))
	for user := range u.users {
		users = append(users, user)
	}
	return users
}

func allUsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		users := AllUsers.GetAllUsers()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(users)
	} else {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method Not Allowed"})
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
