// handlers/posts.go
package handlers

import "net/http"

func GetPostsHandler(w http.ResponseWriter, r *http.Request) {
	// Return posts with pagination
}

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	// Create new post
}

func GetPostHandler(w http.ResponseWriter, r *http.Request) {
	// Get single post with comments
}

func AddCommentHandler(w http.ResponseWriter, r *http.Request) {
	// Add comment to post
}
