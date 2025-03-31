package web

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"
)

// type CategoryDetails struct {
// 	ID   int    `json:"id"`
// 	Name string `json:"name"`
// }

// FetchCategories fetches the list of categories and sends them as a JSON response
func FetchCategories(w http.ResponseWriter, r *http.Request) {
	var data []CategoryDetails
	var err error

	// Fetch categories from the database
	data, err = GetCategories()
	if err != nil {
		log.Println("Error fetching categories:", err)
		ErrorHandler(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// Send categories as a JSON response
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Println("Error encoding categories:", err)
		ErrorHandler(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

// CreatePost handles both the fetching of categories (GET) and posting a new post (POST)
func CreatePost(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		FetchCategories(w, r)
	case http.MethodPost:
		HandlePostCreation(w, r)
	default:
		ErrorHandler(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}

// NewPost handles the creation of a new post by extracting data from the request
func HandlePostCreation(w http.ResponseWriter, r *http.Request) {
	_, userID, _ := VerifySession(r)

	var post PostDetails
	if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
		log.Println("Error decoding data:", err)
		ErrorHandler(w, "Bad Request", http.StatusBadRequest)
		return
	}

	if post.PostTitle == "" || post.PostContent == "" {
		ErrorHandler(w, "Title or content cannot be empty", http.StatusBadRequest)
		return
	}

	if len(post.Categories) == 0 {
		post.Categories = []string{"1"} // Default category
	}

	var categoryIDs []int
	for _, cat := range post.Categories {
		id, err := HandleCategory(cat)
		if err != nil {
			log.Println("Error handling category:", err)
			ErrorHandler(w, "Bad Request", http.StatusBadRequest)
			return
		}
		categoryIDs = append(categoryIDs, id)
	}

	if err := AddPostToDatabase(post.PostTitle, post.PostContent, categoryIDs, userID); err != nil {
		ErrorHandler(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	ErrorHandler(w, "Post added successfully", http.StatusOK)
}

// HandleCategory handles the conversion of category names to category ID
func HandleCategory(category string) (int, error) {

	categoryID, err := strconv.Atoi(category)
	if err != nil {
		log.Println("Error converting categoryID", err)
		return 0, err
	}

	valid := ValidateCategoryID(categoryID)
	if !valid {
		log.Println("Invalid categoryID", category)
		return 0, fmt.Errorf("invalid category id: %s", category)
	}

	return categoryID, nil

}

// ResponseHandler sends a response with a status code and message
// func ResponseHandler(w http.ResponseWriter, statusCode int, message string) {
// 	w.WriteHeader(statusCode)
// 	w.Header().Set("Content-Type", "application/json")
// 	err := json.NewEncoder(w).Encode(map[string]string{"message": message})
// 	if err != nil {
// 		log.Println("Error encoding response:", err)
// 	}
// }

// CreatePost receives details for created post and inserts them into the database
// func CreatePost(w http.ResponseWriter, r *http.Request) {
// 	var userID int
// 	var err error
// 	var categoryIDs []int

// 	data.LoggedIn, _, data.Username = VerifySession(r)

// 	if r.Method == http.MethodPost {
// 		data.LoggedIn, userID, data.Username = VerifySession(r)
// 		if !data.LoggedIn {
// 			ErrorHandler(w, "You must be logged in to create a post", http.StatusUnauthorized)
// 			return
// 		}

// 		err = r.ParseForm()
// 		if err != nil {
// 			log.Println("Unable to parse form:", err)
// 			ErrorHandler(w, "Bad Request", http.StatusBadRequest)
// 			return
// 		}

// 		title := r.FormValue("title")
// 		content := r.FormValue("content")
// 		categories := r.Form["category"]

// 		if title == "" || content == "" {
// 			ErrorHandler(w, "Title or content cannot be empty", http.StatusBadRequest)
// 			return
// 		}

// 		if len(categories) == 0 {
// 			categories = append(categories, "1") // If no category chosen, give category id 1 (=general)
// 		}

// 		// Converting categoryIDs to integers and validating that they exists in the database
// 		for _, cat := range categories {
// 			var categoryID int
// 			categoryID, err = HandleCategory(cat)
// 			if err != nil {
// 				log.Println("Error handling categoryID in createpost", err)
// 				ErrorHandler(w, "Bad Request", http.StatusBadRequest)
// 			}

// 			categoryIDs = append(categoryIDs, categoryID)
// 		}

// 		err = AddPostToDatabase(title, content, categoryIDs, userID)
// 		if err != nil {
// 			ErrorHandler(w, "Internal Server Error", http.StatusInternalServerError)
// 			return
// 		}

// 		http.Redirect(w, r, "/", http.StatusFound)

// 	} else if r.Method != http.MethodGet {

// 		ErrorHandler(w, "Method Not Allowed", http.StatusMethodNotAllowed)
// 	}

// 	// RenderTemplate(w, "create-post", data)
// }

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
