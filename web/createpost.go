package web

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

// CreatePost handles post creation via JSON API
func CreatePost(w http.ResponseWriter, r *http.Request, userID int) {
	if r.Method == http.MethodGet {
		// Fetch categories for the frontend
		FetchCategories(w, r)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, `{"Error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Decode incoming JSON
	var post PostDetails
	err := json.NewDecoder(r.Body).Decode(&post)
	if err != nil {
		log.Println("Error decoding JSON:", err)
		http.Error(w, `{"error": "Invalid JSON"}`, http.StatusBadRequest)
		return
	}

	// Validate input
	if post.PostTitle == "" || post.PostContent == "" {
		http.Error(w, `{"error": "Title or content cannot be empty"}`, http.StatusBadRequest)
		return
	}

	categories := post.Categories

	// Default category if none is selected
	if len(categories) == 0 {
		categories = append(categories, "1") // Give general category id 1
	}

	// Convert category strings to valid IDs
	var categoryIDs []int
	for _, cat := range categories {
		categoryID, err := HandleCategory(db, cat)
		if err != nil {
			log.Println("Invalid category:", err)
			http.Error(w, `{"error": "Invalid category"}`, http.StatusBadRequest)
			return
		}
		categoryIDs = append(categoryIDs, categoryID)
	}

	err = AddPostToDatabase(post.PostTitle, post.PostContent, categoryIDs, userID)
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

func FetchCategories(w http.ResponseWriter, r *http.Request) {
	var data []CategoryDetails
	var err error
	data, err = GetCategories()
	if err != nil {
		log.Println("Error fething categories: ", err)
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
