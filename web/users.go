package web

import "sync"

// ActiveUserStore is a thread-safe struct to store active users
type ActiveUserStore struct {
	sync.RWMutex
	users map[string]bool
}

// New creates a new ActiveUserStore instance
func New() *ActiveUserStore {
	return &ActiveUserStore{
		users: make(map[string]bool),
	}
}

// AddUser marks a user as active
func (store *ActiveUserStore) AddUser(username string) {
	store.Lock()
	defer store.Unlock()
	store.users[username] = true
}

// RemoveUser marks a user as inactive
func (store *ActiveUserStore) RemoveUser(username string) {
	store.Lock()
	defer store.Unlock()
	delete(store.users, username)
}

// GetActiveUsers returns a list of active users
func (store *ActiveUserStore) GetActiveUsers() []string {
	store.RLock()
	defer store.RUnlock()

	users := []string{}
	for user := range store.users {
		users = append(users, user)
	}
	return users
}
