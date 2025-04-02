package web

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

var (
	clients   = make(map[string]*websocket.Conn)
	clientsMu sync.Mutex
)

// Message structure
type Message struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Message string `json:"message"`
}

// Session structure
type Session struct {
	ID        string
	UserID    int
	ExpiredAt string
}

// Handle WebSocket connections for chat
func handleChatWebSocket(w http.ResponseWriter, r *http.Request) {
	// Get session_id from the cookie
	sessionID, err := r.Cookie("session_id")
	if err != nil || sessionID == nil {
		http.Error(w, "Session ID missing or invalid", http.StatusUnauthorized)
		return
	}

	// Validate session ID and get associated user
	username, err := validateSession(sessionID.Value)
	if err != nil {
		http.Error(w, "Invalid session or session expired", http.StatusUnauthorized)
		return
	}

	// Upgrade to WebSocket connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	// Store the connection
	clientsMu.Lock()
	clients[username] = conn
	clientsMu.Unlock()

	log.Println(username, "connected")

	// Listen for incoming messages
	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Println(username, "disconnected")
			break
		}

		// Send message to recipient
		clientsMu.Lock()
		recipientConn, exists := clients[msg.To]
		clientsMu.Unlock()

		if exists {
			err := recipientConn.WriteJSON(msg)
			if err != nil {
				log.Println("Error sending message:", err)
			}
		} else {
			log.Println("Recipient", msg.To, "not found")
		}
	}

	// Remove user when disconnected
	clientsMu.Lock()
	delete(clients, username)
	clientsMu.Unlock()
}

// validateSession validates the session ID and retrieves the associated username
func validateSession(sessionID string) (string, error) {
	// Query session from the database
	var session Session
	err := db.QueryRow("SELECT id, user_id, expired_at FROM Session WHERE id = ? AND status = 'active'", sessionID).Scan(&session.ID, &session.UserID, &session.ExpiredAt)
	if err != nil {
		return "", err
	}

	// Check if the session has expired
	expirationTime, err := time.Parse("2006-01-02 15:04:05", session.ExpiredAt)
	if err != nil || time.Now().After(expirationTime) {
		return "", fmt.Errorf("session expired")
	}

	// Fetch the username associated with the session's user_id
	var username string
	err = db.QueryRow("SELECT username FROM User WHERE id = ?", session.UserID).Scan(&username)
	if err != nil {
		return "", err
	}

	return username, nil
}
