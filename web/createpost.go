package web

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

// PostData represents the JSON structure received from the frontend
type PostData struct {
	Title      string   `json:"title"`
	Content    string   `json:"content"`
	Categories []string `json:"categories"`
}

// CreatePost handles post creation via JSON API
func CreatePost(w http.ResponseWriter, r *http.Request, data *PageDetails) {
	if r.Method != http.MethodPost {
		// ErrorHandler(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check if the user is logged in
	var userID int
	data.LoggedIn, userID, data.Username = VerifySession(r)
	if !data.LoggedIn {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Decode JSON body
	var postData PostData
	err := json.NewDecoder(r.Body).Decode(&postData)
	if err != nil {
		log.Println("Error decoding JSON:", err)
		http.Error(w, `{"error": "Invalid JSON"}`, http.StatusBadRequest)
		return
	}

	// Validate input
	if postData.Title == "" || postData.Content == "" {
		http.Error(w, `{"error": "Title or content cannot be empty"}`, http.StatusBadRequest)
		return
	}

	// Default category if none is selected
	if len(postData.Categories) == 0 {
		postData.Categories = append(postData.Categories, "1") // General category
	}

	// Convert category strings to valid IDs
	var categoryIDs []int
	for _, cat := range postData.Categories {
		categoryID, err := HandleCategory(cat)
		if err != nil {
			log.Println("Invalid category:", err)
			http.Error(w, `{"error": "Invalid category"}`, http.StatusBadRequest)
			return
		}
		categoryIDs = append(categoryIDs, categoryID)
	}

	// Insert post into database
	err = AddPostToDatabase(postData.Title, postData.Content, categoryIDs, userID)
	if err != nil {
		http.Error(w, `{"error": "Server error"}`, http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"message": "Post created successfully"}`))
}

// AddPostToDatabase inserts a new post into the database
func AddPostToDatabase(title, content string, categories []int, userID int) error {

	var result sql.Result
	var err error
	result, err = db.Exec("INSERT INTO Post (title, content, user_id, created_at) VALUES (?, ?, ?, ?)",
		title, content, userID, time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
		log.Println("Error inserting post:", err)
		return err
	}

	// Get the post id for the post inserted
	postID, err := result.LastInsertId()
	if err != nil {
		log.Println("Error getting post ID:", err)
		return err
	}

	// Add all categories into Post_category table
	for _, categoryID := range categories {
		_, err = db.Exec("INSERT INTO Post_category (category_id, post_id) VALUES (?, ?)",
			categoryID, postID)
		if err != nil {
			log.Println("Error inserting post category:", err)
			return err
		}
	}

	return nil
}
