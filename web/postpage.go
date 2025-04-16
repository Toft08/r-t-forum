package web

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// PostHandler handles requests to view a specific post
func PostHandler(w http.ResponseWriter, r *http.Request, userID int) {
	pathParts := strings.Split(r.URL.Path, "/")
	var addedPart string
	fmt.Printf("Post Handler1 %s\n", r.URL.Path)

	fmt.Printf("Post Handler2 %s\n", pathParts)
	fmt.Printf("Post Handler3 %s\n", pathParts[3])

	postID, err := strconv.Atoi(pathParts[3])
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	//Check if comment or vote is added to post
	if len(pathParts) > 4 {
		addedPart = pathParts[4]
		fmt.Printf("Post Handler4 %s\n", addedPart)
	}

	if !ValidatePostID(postID) {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	switch r.Method {
	case http.MethodGet:
		HandlePostPageGet(w, r, postID, userID)
	case http.MethodPost:
		if addedPart == "comment" {
			HandleComment(w, r, postID, userID)
		} else if addedPart == "vote" {
			HandleVote(w, r, postID, userID)
		} else {
			http.Error(w, "Invalid action", http.StatusBadRequest)
			return
		}
	default:
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}

}

// HandlePostPageGet handles get requests to the post page
func HandlePostPageGet(w http.ResponseWriter, r *http.Request, postID, userID int) {
	post, err := GetPostDetails(postID, userID)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

// HandlePostPagePost handles post requests to the post page
func HandleComment(w http.ResponseWriter, r *http.Request, postID, userID int) {

	var newComment CommentDetails
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&newComment)
	if err != nil {
		log.Println("error decoding the data")
		return
	}

	if newComment.Content != "" {
		// Insert comment into the database
		err := AddComment(postID, newComment.Content, userID)
		if err != nil {
			log.Println("error adding comment to the database")
			return
		}
	}

	HandlePostPageGet(w, r, postID, userID)
}

func HandleVote(w http.ResponseWriter, r *http.Request, postID, userID int) {

	var newVote VoteDetails
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&newVote)
	if err != nil {
		log.Println("error decoding the data")
		return
	}
	// Insert vote into the database
	var likeType int
	var post_id int
	var comment_id int
	if newVote.Vote == "like" {
		likeType = 1
	} else if newVote.Vote == "dislike" {
		likeType = 2
	} else {
		log.Println("Invalid vote value: ", newVote.Vote)
		return
	}
	// Check if the vote is for a post or a comment
	if newVote.PostID != 0 {
		comment_id = 0
		post_id = newVote.PostID
	} else {
		exists := ValidateCommentID(newVote.CommentID)
		if !exists {
			log.Println("CommentID doesn't exist", comment_id)
			return
		}
		post_id = 0
	}

	err = AddVotes(userID, post_id, comment_id, likeType)
	if err != nil {
		log.Printf("Error adding votes to the database: userID %d, postID %d, commentID %d, like type %d\n", userID, post_id, comment_id, likeType)

		return
	}

	HandlePostPageGet(w, r, postID, userID)
}

func AddComment(postID int, content string, userID int) error {
	_, err := db.Exec("INSERT INTO Comment (post_id, content, user_id, created_at) VALUES (?, ?, ?, ?)",
		postID, content, userID, time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
		log.Println("Error creating post:", err)
		return err
	}
	return nil
}

// ValidatePostID checks if a post with the given ID exists in the database
func ValidatePostID(postID int) bool {
	var post int
	err := db.QueryRow("SELECT id FROM Post WHERE id = ?", postID).Scan(&post)
	if err != nil {
		log.Println("Error scanning postID:", err)
		return false
	}
	return true
}

// ValidateCommentID checks if a comment with the given ID exists in the database
func ValidateCommentID(commentID int) bool {
	var comment int
	err := db.QueryRow("SELECT id FROM Comment WHERE id = ?", commentID).Scan(&comment)
	if err != nil {
		log.Println("Error scanning commentID:", err)
		return false
	}
	return true
}

// AddVotes adds or updates a vote type for a post or comment
func AddVotes(userID, postID, commentID, vote int) error {
	var row *sql.Row
	query := `SELECT Type FROM Like WHERE user_id = ? AND `
	deleteQuery := `UPDATE Like SET type = 0, created_at = ? WHERE user_id = ? AND `
	updateQuery := `UPDATE Like SET type = ?, created_at = ? WHERE user_id = ? AND `
	var addon string
	var ID int

	if postID == 0 && commentID == 0 {
		return fmt.Errorf("both postID and commentID cannot be zero")
	}

	if postID == 0 {
		ID = commentID
		addon = `comment_id = ?`
	} else if commentID == 0 {
		ID = postID
		addon = `post_id = ?`
	}
	query += addon
	deleteQuery += addon
	updateQuery += addon

	row = db.QueryRow(query, userID, ID)
	var likeType int
	err := row.Scan(&likeType)
	if err != nil {
		if err == sql.ErrNoRows {
			likeType = -1 // To imply that no record exists
		} else {
			log.Println("Error scanning current value:", err)
			return err
		}
	}

	if likeType == vote {
		// If existing like type is the same the the current, remove the like by changing the type to 0
		_, err = db.Exec(deleteQuery, time.Now().Format("2006-01-02 15:04:05"), userID, ID)
		if err != nil {
			log.Println("Error updating the record to 0:", err)
			return err
		}
	} else if likeType == -1 {
		// If no record exists, insert a new one
		insertQuery := `INSERT INTO Like (type, user_id, post_id, comment_id, created_at) VALUES (?, ?, ?, ?, ?)`
		_, err = db.Exec(insertQuery, vote, userID, postID, commentID, time.Now().Format("2006-01-02 15:04:05"))
		if err != nil {
			log.Println("Error inserting record:", err)
			return err
		}
	} else {
		_, err = db.Exec(updateQuery, vote, time.Now().Format("2006-01-02 15:04:05"), userID, ID)
		if err != nil {
			log.Println("Error updating the record to new vote:", err)
			return err
		}
	}
	return nil
}
