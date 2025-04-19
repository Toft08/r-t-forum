package web

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func saveMessage(sender, receiver string, userID int, content string) error {
	_, err := db.Exec(`
        INSERT INTO Message (sender, receiver, user_id, content)
        VALUES (?, ?, ?, ?)`,
		sender, receiver, userID, content,
	)
	return err
}
func getMessages(sender, receiver string, limit int) ([]StoredMessage, error) {
	rows, err := db.Query(`
        SELECT sender, receiver, content, created_at 
        FROM Message
        WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
        ORDER BY created_at DESC LIMIT ?`,
		sender, receiver, receiver, sender, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []StoredMessage
	for rows.Next() {
		var msg StoredMessage
		err := rows.Scan(&msg.Sender, &msg.Receiver, &msg.Content, &msg.CreatedAt)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, nil
}

// Handler to fetch messages between two users
func getMessagesHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("getMessagesHandler called")
	sender := r.URL.Query().Get("sender")
	receiver := r.URL.Query().Get("receiver")

log.Printf("Sender: %s, Receiver: %s", sender, receiver)

	if sender == "" || receiver == "" {
		http.Error(w, "Missing sender or receiver", http.StatusBadRequest)
		return
	}

	// Fetch messages from the database
	messages, err := getMessages(sender, receiver, 10)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Error fetching messages", http.StatusInternalServerError)
		return
	}
	if len(messages) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode([]StoredMessage{})
		return
	}
	log.Printf("Fetched messages: %v", messages)
	if _, ok := clients[sender]; ok {
		clients[sender].WriteJSON(map[string]any{
			"messages":messages,
		})
	}
	if _, ok := clients[receiver]; ok {
		clients[receiver].WriteJSON(map[string]any{
			"messages":messages,
		})
	}
}
