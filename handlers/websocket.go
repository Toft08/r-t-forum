// handlers/websocket.go
package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Check if request is from valid origin
		return true // Allow all connections in development
	},
}

// Connection represents a WebSocket connection
type Connection struct {
	Conn   *websocket.Conn
	UserID int
}

// ClientManager manages WebSocket connections
type ClientManager struct {
	clients    map[int]*Connection
	broadcast  chan []byte
	register   chan *Connection
	unregister chan *Connection
	mutex      sync.Mutex
}

// Message represents a WebSocket message
type Message struct {
	Type       string      `json:"type"`
	SenderID   int         `json:"senderId"`
	ReceiverID int         `json:"receiverId,omitempty"`
	Content    string      `json:"content,omitempty"`
	Timestamp  string      `json:"timestamp"`
	Data       interface{} `json:"data,omitempty"`
}

// Create a new client manager
var Manager = ClientManager{
	clients:    make(map[int]*Connection),
	broadcast:  make(chan []byte),
	register:   make(chan *Connection),
	unregister: make(chan *Connection),
}

// Start begins the client manager
func (manager *ClientManager) Start() {
	for {
		select {
		case conn := <-manager.register:
			// Register a new client
			manager.mutex.Lock()
			manager.clients[conn.UserID] = conn
			manager.mutex.Unlock()

			// Broadcast user online status
			broadcastUserStatus(conn.UserID, true)

		case conn := <-manager.unregister:
			// Unregister a client
			if _, ok := manager.clients[conn.UserID]; ok {
				manager.mutex.Lock()
				delete(manager.clients, conn.UserID)
				manager.mutex.Unlock()
				conn.Conn.Close()

				// Broadcast user offline status
				broadcastUserStatus(conn.UserID, false)
			}

		case message := <-manager.broadcast:
			// Broadcast a message to all clients
			for _, conn := range manager.clients {
				select {
				case conn.Conn.WriteMessage(websocket.TextMessage, message):
				default:
					close(conn.Conn)
					manager.unregister <- conn
				}
			}
		}
	}
}

// Send a message to a specific user
func (manager *ClientManager) SendToUser(userID int, message []byte) {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	if conn, ok := manager.clients[userID]; ok {
		conn.Conn.WriteMessage(websocket.TextMessage, message)
	}
}

// Broadcast user status to all connected clients
func broadcastUserStatus(userID int, online bool) {
	// Get username from database
	// (you'll need to implement this based on your DB structure)
	username := getUsernameByID(userID)

	statusMsg := Message{
		Type:      "status_update",
		SenderID:  userID,
		Timestamp: time.Now().Format(time.RFC3339),
		Data: map[string]interface{}{
			"userID":   userID,
			"username": username,
			"online":   online,
		},
	}

	msgBytes, _ := json.Marshal(statusMsg)
	Manager.broadcast <- msgBytes
}

// WebSocket handler function
func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	// Get user ID from session
	userID := getUserIDFromSession(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	// Create new connection
	client := &Connection{
		Conn:   conn,
		UserID: userID,
	}

	// Register connection
	Manager.register <- client

	// Handle incoming messages
	go handleMessages(client)
}

// Handle incoming WebSocket messages
func handleMessages(client *Connection) {
	defer func() {
		Manager.unregister <- client
	}()

	for {
		_, msgBytes, err := client.Conn.ReadMessage()
		if err != nil {
			break
		}

		// Parse message
		var msg Message
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			continue
		}

		// Set sender ID based on authenticated user
		msg.SenderID = client.UserID
		msg.Timestamp = time.Now().Format(time.RFC3339)

		// Process message based on type
		switch msg.Type {
		case "private_message":
			handlePrivateMessage(msg)
		case "typing_indicator":
			handleTypingIndicator(msg)
		case "read_receipt":
			handleReadReceipt(msg)
		}
	}
}

// Handle private messages
func handlePrivateMessage(msg Message) {
	// Store message in database
	// (you'll need to implement this based on your DB structure)
	msgID := storeMessage(msg.SenderID, msg.ReceiverID, msg.Content)

	// Include message ID in response
	msg.Data = map[string]interface{}{
		"messageID": msgID,
	}

	// Send to recipient if online
	msgBytes, _ := json.Marshal(msg)
	Manager.SendToUser(msg.ReceiverID, msgBytes)

	// Also send back to sender for confirmation
	Manager.SendToUser(msg.SenderID, msgBytes)
}

// Handle typing indicators
func handleTypingIndicator(msg Message) {
	msgBytes, _ := json.Marshal(msg)
	Manager.SendToUser(msg.ReceiverID, msgBytes)
}

// Handle read receipts
func handleReadReceipt(msg Message) {
	// Update message read status in database
	// (you'll need to implement this based on your DB structure)
	markMessagesAsRead(msg.SenderID, msg.ReceiverID)

	// Forward read receipt to sender
	msgBytes, _ := json.Marshal(msg)
	Manager.SendToUser(msg.ReceiverID, msgBytes)
}

// Helper functions to interact with your database
// These are placeholders - you'll need to implement them based on your actual DB structure

func getUserIDFromSession(r *http.Request) int {
	// Get session cookie
	cookie, err := r.Cookie("session")
	if err != nil {
		return 0
	}

	// Query session table
	// (implement this based on your DB structure)
	// ...

	return 0 // Replace with actual implementation
}

func getUsernameByID(userID int) string {
	// Query database for username
	// (implement this based on your DB structure)
	// ...

	return "" // Replace with actual implementation
}

func storeMessage(senderID, receiverID int, content string) int {
	// Store message in database
	// (implement this based on your DB structure)
	// ...

	return 0 // Replace with message ID
}

func markMessagesAsRead(senderID, receiverID int) {
	// Mark messages as read in database
	// (implement this based on your DB structure)
	// ...
}
