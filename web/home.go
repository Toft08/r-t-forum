package web

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
)

func PostsHandler(w http.ResponseWriter, r *http.Request) {
	// db := database.InitDB()
	// defer db.Close()

	posts, err := FetchPosts(0)
	if err != nil {
		log.Println("❌ Error fetching posts:", err)
		http.Error(w, "Error fetching posts", http.StatusInternalServerError)
		return
	}

	log.Printf("Number of posts fetched: %d", len(posts))

	// Directly encode the posts array
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(posts); err != nil {
		log.Println("❌ Error encoding JSON:", err)
		http.Error(w, "Error processing data", http.StatusInternalServerError)
	}
}

func FetchPosts(userID int) ([]PostDetails, error) {
	// Modified query that gets all posts without a WHERE clause
	// query := `
	// 	SELECT
	// 		Post.id AS post_id,
	// 		Post.user_id AS user_id,
	// 		User.username AS username,
	// 		Post.title AS post_title,
	// 		Post.content AS post_content,
	// 		Post.created_at AS post_created_at,
	// 		COALESCE(likes.post_likes, 0) AS post_likes,
	// 		COALESCE(likes.post_dislikes, 0) AS post_dislikes,
	// 		COALESCE(GROUP_CONCAT(Category.name, ','), '') AS categories
	// 	FROM Post
	// 	LEFT JOIN User ON Post.user_id = User.id
	// 	LEFT JOIN (
	// 		SELECT
	// 			post_id,
	// 			SUM(CASE WHEN type = 1 THEN 1 ELSE 0 END) AS post_likes,
	// 			SUM(CASE WHEN type = 2 THEN 1 ELSE 0 END) AS post_dislikes
	// 		FROM Like
	// 		GROUP BY post_id
	// 	) AS likes ON Post.id = likes.post_id
	// 	LEFT JOIN Post_Category ON Post.id = Post_Category.post_id
	// 	LEFT JOIN Category ON Post_Category.category_id = Category.id
	// 	GROUP BY Post.id, Post.user_id, User.username, Post.title, Post.content, Post.created_at
	// 	ORDER BY Post.created_at DESC;
	// `
	query := `
		SELECT Post.id
		FROM Post
		ORDER BY Post.created_at DESC;
	`
	rows, err := db.Query(query)
	if err != nil {
		log.Println("❌ Error executing query:", err)
		return nil, err
	}
	defer rows.Close()

	var posts []PostDetails
	for rows.Next() {
		var postID int
		if err := rows.Scan(&postID); err != nil {
			log.Println("❌ Error scanning post ID:", err)
			return nil, err
		}

		// Get the details for each post
		p, err := GetPostDetails(postID, userID)
		if err != nil {
			log.Println("❌ Error getting post details:", err)
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
