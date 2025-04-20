package web

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
)

// FeedHandler handles the main page of the forum
// It fetches posts from the database and returns them as JSON
func FeedHandler(w http.ResponseWriter, r *http.Request) {
	posts, err := FetchPosts(0)
	if err != nil {
		log.Println("Error fetching posts:", err)
		http.Error(w, "Error fetching posts", http.StatusInternalServerError)
		return
	}

	// Directly encode the posts array
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(posts); err != nil {
		log.Println("Error encoding JSON:", err)
		http.Error(w, "Error processing data", http.StatusInternalServerError)
	}
}

// FetchPosts retrieves posts from the database
// It returns a slice of PostDetails or an error if any
func FetchPosts(userID int) ([]PostDetails, error) {
	var posts []PostDetails

	query := `
		SELECT Post.id
		FROM Post
		ORDER BY Post.created_at DESC;
	`
	rows, err := db.Query(query)
	if err != nil {
		log.Println("Error executing query:", err)
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var postID int
		if err := rows.Scan(&postID); err != nil {
			log.Println("Error scanning post ID:", err)
			return nil, err
		}

		// Get the details for each post
		p, err := GetPostDetails(postID, userID)
		if err != nil {
			log.Println("Error getting post details:", err)
			return nil, err
		}
		posts = append(posts, *p)
	}
	return posts, nil
}

// HandleCategory converts the category ID into a string and returns validated ID
func HandleCategory(db *sql.DB, category string) (int, error) {
	categoryID, err := strconv.Atoi(category)
	if err != nil {
		log.Println("Error converting categoryID", err)
		return 0, err
	}
	// valid := ValidateCategoryID(categoryID)
	if !ValidateCategoryID(db, categoryID) {
		log.Println("Invalid categoryID", category)
		return 0, fmt.Errorf("invalid category id: %s", category)
	}
	return categoryID, nil
}

// ValidateCategoryID checks if the category ID given exists in the databse
func ValidateCategoryID(db *sql.DB, categoryID int) bool {
	var category int
	err := db.QueryRow("SELECT id FROM Category WHERE id = ?", categoryID).Scan(&category)
	if err != nil {
		log.Println("Error scanning category ID:", err)
		return false
	}
	return true
}
