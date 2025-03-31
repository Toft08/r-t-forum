package web

import (
	"encoding/json"
	"net/http"
)

var ActiveUsers = New()

// activeUsersHandler is responsible for responding with active users
func activeUsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		// Get the list of active users
		users := ActiveUsers.GetActiveUsers()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(users)
	} else {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method Not Allowed"})
	}
}
