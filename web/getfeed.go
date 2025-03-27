package web

import (
	"encoding/json"
	"log"
	"net/http"
)

func HandleFeed(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetFeed(w, r)
	//case http.MethodPost:
	//Post method on feedPage only for filters
	//HandleHomePost(w, r)
	default:
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
}

// GetFeed fetches posts from the database for the home page (returns JSON)
func GetFeed(w http.ResponseWriter, r *http.Request) {
	// Fetch posts from the database
	posts, err := GetPosts(0)
	if err != nil {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	// Return posts as JSON
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(posts); err != nil {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
}

// GetPosts fetches all posts from the database and returns them as a slice of PostDetails
func GetPosts(userID int) ([]PostDetails, error) {
	var posts []PostDetails
	// Query to get all posts ordered by creation date
	query := `
        SELECT Post.id
        FROM Post
        ORDER BY Post.created_at DESC;
`
	rows, err := db.Query(query)
	if err != nil {
		log.Println("Error fetching posts:", err)
		return nil, err
	}
	defer rows.Close()
	// Loop through the rows and fetch details for each post
	for rows.Next() {
		var postID int
		if err := rows.Scan(&postID); err != nil {
			log.Println("Error scanning post ID:", err)
			return nil, err
		}
		// Get the details for each post
		post, err := GetPostDetails(postID, userID)
		if err != nil {
			log.Println("Error getting post details:", err)
			return nil, err
		}
		posts = append(posts, *post)
	}
	// Return the list of posts
	return posts, nil
}
