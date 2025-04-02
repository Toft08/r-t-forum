package web

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// websocket upgrader
// Upgrader is used to upgrade HTTP connections to WebSocket connections
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Client is a struct that represents a WebSocket client
type Client struct {
	Username string
	Conn     *websocket.Conn
}

// Hub is a struct that manages WebSocket connections
type Hub struct {
	clients map[string]*Client
	mu      sync.Mutex
}

var WsHub = Hub{
	clients: make(map[string]*Client),
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Get session cookie
	cookie, err := r.Cookie("session_id")
	if err != nil {
		log.Println("Session cookie not found")
		return
	}

	// Retrieve username from database
	var username string
	err = db.QueryRow("SELECT username FROM Session WHERE id = ? AND status = 'active' AND expired_at > ?",
		cookie.Value, time.Now().Format("2006-01-02 15:04:05")).Scan(&username)
	if err != nil {
		log.Println("Invalid session or session expired")
		return
	}
	log.Println("Retrieved username:", username)

	if r.Header.Get("Upgrade") != "websocket" || r.Header.Get("Connection") != "Upgrade" {
		return
	}
	// Upgrade to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket Upgrade failed:", err)
		return
	}

	client := &Client{
		Username: username,
		Conn:     conn,
	}

	WsHub.addClient(client)

	client.listenForMessages()
}

// add client to the hub
func (h *Hub) addClient(client *Client) {
	h.mu.Lock()
	h.clients[client.Username] = client
	h.mu.Unlock()
	h.broadcastActiveUsers()
}

// remove client from the hub
func (h *Hub) removeClient(username string) {
	h.mu.Lock()
	if client, exists := h.clients[username]; exists {
		client.Conn.Close()
		delete(h.clients, username)
	}
	h.mu.Unlock()
	h.broadcastActiveUsers()
}

// reads messages from the websocket connection
func (c *Client) listenForMessages() {
	defer WsHub.removeClient(c.Username)

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		WsHub.broadcastMessage(message)
	}
}

// sends message to all connected users
func (h *Hub) broadcastMessage(message []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()

	for _, client := range h.clients {
		err := client.Conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			client.Conn.Close()
			delete(h.clients, client.Username)
		}
	}
}

// sends a list of active users to all clients
func (h *Hub) broadcastActiveUsers() {
	h.mu.Lock()
	defer h.mu.Unlock()

	var usernames []string
	for username := range h.clients {
		usernames = append(usernames, username)
	}
	message := map[string]interface{}{
		"type":  "active_users",
		"users": usernames,
	}
	jsonMessage, err := json.Marshal(message)
	if err != nil {
		return
	}
	for _, client := range h.clients {
		err := client.Conn.WriteMessage(websocket.TextMessage, jsonMessage)
		if err != nil {
			client.Conn.Close()
			delete(h.clients, client.Username)
		}
	}
}
