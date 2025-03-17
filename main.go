package main

import (
	"log"
	"net/http"
	"r-t-forum/database"
	"r-t-forum/handlers"
)

func main() {
	// Initialize database
	err := database.InitDB()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Serve static files
	http.Handle("/", http.FileServer(http.Dir("./static")))

	// db := database.InitDB()
	// defer db.Close()

	// database.MakeTables(db)

	// Auth routes
	http.HandleFunc("/api/auth/login", handlers.LoginHandler)
	http.HandleFunc("/api/auth/register", handlers.RegisterHandler)
	http.HandleFunc("/api/auth/logout", handlers.LogoutHandler)
	http.HandleFunc("/api/auth/check", handlers.CheckAuthHandler)

	// Post routes
	http.HandleFunc("/api/posts", handlers.GetPostsHandler)
	http.HandleFunc("/api/posts/create", handlers.CreatePostHandler)
	http.HandleFunc("/api/posts/", handlers.GetPostHandler)
	http.HandleFunc("/api/posts/comment", handlers.AddCommentHandler)

	// Message routes
	http.HandleFunc("/api/conversations", handlers.GetConversationsHandler)
	http.HandleFunc("/api/messages/", handlers.GetMessagesHandler)

	// User routes
	http.HandleFunc("/api/users/online", handlers.GetOnlineUsersHandler)
	http.HandleFunc("/api/users/", handlers.GetUserProfileHandler)

	// WebSocket route
	http.HandleFunc("/ws", handlers.WebSocketHandler)

	// Start server
	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
