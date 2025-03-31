package web

import (
	"net/http"
	"sync"

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
	Send     chan []byte
}

// Hub is a struct that manages WebSocket connections
type Hub struct {
	clients    map[string]*Client
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.Mutex
}

var WsHub = Hub{
	clients:    make(map[string]*Client),
	broadcast:  make(chan []byte),
	register:   make(chan *Client),
	unregister: make(chan *Client),
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Could not upgrade connection", http.StatusBadRequest)
		return
	}
	username := r.URL.Query().Get("username")
	if username == "" {
		http.Error(w, "Username is required", http.StatusBadRequest)
		conn.Close()
		return
	}
	client := &Client{
		Username: username,
		Conn:     conn,
		Send:     make(chan []byte)}
	WsHub.register <- client

	go client.readMessages()
	go client.writeMessages()
}

func (c *Client) readMessages() {
	defer func() {
		WsHub.unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		WsHub.broadcast <- message
	}
}
func (c *Client) writeMessages() {
	for message := range c.Send {
		c.Conn.WriteMessage(websocket.TextMessage, message)
	}
}
func (h *Hub) RunHub() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.Username] = client
			h.mu.Unlock()
			h.sendActiveUsers()

		case client := <-h.unregister:
			h.mu.Lock()
			delete(h.clients, client.Username)
			h.mu.Unlock()
			close(client.Send)
			h.sendActiveUsers()

		case msg := <-h.broadcast:
			h.mu.Lock()
			for _, client := range h.clients {
				client.Send <- msg
			}
			h.mu.Unlock()
		}
	}
}
func (h *Hub) sendActiveUsers() {
	h.mu.Lock()
	defer h.mu.Unlock()

	users := []byte("active_users:")
	for username := range h.clients {
		users = append(users, []byte(username+"|")...)
	}

	for _, client := range h.clients {
		client.Send <- users
	}
}
