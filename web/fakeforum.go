package web

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"r-t-forum/database"
)

func PostsHandler(w http.ResponseWriter, r *http.Request) {
	db := database.InitDB()
	defer db.Close()

	posts, err := fetchPosts(db)
	if err != nil {
		log.Println("❌ Error fetching posts:", err) // Log the actual error
		http.Error(w, "Error fetching posts", http.StatusInternalServerError)
		return
	}

	jsonData, err := json.Marshal(posts)
	if err != nil {
		log.Println("❌ Error marshalling JSON:", err) // Log JSON error if any
		http.Error(w, "Error processing data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}

func fetchPosts(db *sql.DB) ([]PostDetails, error) {
	// Modified query that gets all posts without a WHERE clause
	query := `
		SELECT  
			Post.id AS post_id, 
			Post.user_id AS user_id, 
			User.username AS username,  
			Post.title AS post_title, 
			Post.content AS post_content, 
			Post.created_at AS post_created_at, 
			COALESCE(likes.post_likes, 0) AS post_likes,    
			COALESCE(likes.post_dislikes, 0) AS post_dislikes, 
			COALESCE(GROUP_CONCAT(Category.name, ','), '') AS categories 
		FROM Post 
		LEFT JOIN User ON Post.user_id = User.id 
		LEFT JOIN ( 
			SELECT  
				post_id, 
				SUM(CASE WHEN type = 1 THEN 1 ELSE 0 END) AS post_likes, 
				SUM(CASE WHEN type = 2 THEN 1 ELSE 0 END) AS post_dislikes 
			FROM Like 
			GROUP BY post_id 
		) AS likes ON Post.id = likes.post_id 
		LEFT JOIN Post_Category ON Post.id = Post_Category.post_id 
		LEFT JOIN Category ON Post_Category.category_id = Category.id 
		GROUP BY Post.id, Post.user_id, User.username, Post.title, Post.content, Post.created_at
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
		var p PostDetails
		if err := rows.Scan(&p.PostID, &p.UserID, &p.Username, &p.PostTitle, &p.PostContent, &p.CreatedAt, &p.Likes, &p.Dislikes, &p.Categories); err != nil {
			log.Println("❌ Error scanning row:", err)
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, nil
}
