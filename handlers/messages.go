// handlers/messages.go
package handlers

import "net/http"

func GetConversationsHandler(w http.ResponseWriter, r *http.Request) {
	// Get list of conversations for current user
}

func GetMessagesHandler(w http.ResponseWriter, r *http.Request) {
	// Get message history between two users with pagination
}
