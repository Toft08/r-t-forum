package web

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
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
	if r.Method == http.MethodGet {
		FetchCategories(w, r)
		return
	} else if r.Method == http.MethodPost {
		NewPost(w, r)
		return
	} else {
		ErrorHandler(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
}

// NewPost handles the creation of a new post by extracting data from the request
func NewPost(w http.ResponseWriter, r *http.Request) {
	_, userID, _ := VerifySession(r)

	var newPost PostDetails
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&newPost)
	if err != nil {
		log.Println("Error decoding the data:", err)
		ErrorHandler(w, "Bad Request", http.StatusBadRequest)
		return
	}

	if newPost.PostTitle == "" || newPost.PostContent == "" {
		ErrorHandler(w, "Title or content cannot be empty", http.StatusBadRequest)
		return
	}

	categories := newPost.Categories
	if len(categories) == 0 {
		categories = append(categories, "1") // Default category if none selected
	}

	var categoryIDs []int
	// Convert category names to category IDs
	for _, cat := range categories {
		categoryID, err := HandleCategory(cat)
		if err != nil {
			log.Println("Error handling categoryID in createpost:", err)
			ErrorHandler(w, "Bad Request", http.StatusBadRequest)
			return
		}
		categoryIDs = append(categoryIDs, categoryID)
	}

	err = AddPostToDatabase(newPost.PostTitle, newPost.PostContent, categoryIDs, userID)
	if err != nil {
		ErrorHandler(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	ErrorHandler(w, "Message added to database", http.StatusOK)
}

// HandleCategory handles the conversion of category names to category IDs (ensure that they exist in the database)
func HandleCategory(categoryName string) (int, error) {
	// Logic to retrieve category ID by category name from the database
	// This is an example, and you need to implement actual DB interaction
	var categoryID int
	err := db.QueryRow("SELECT id FROM Category WHERE name = ?", categoryName).Scan(&categoryID)
	if err != nil {
		log.Println("Error retrieving category ID:", err)
		return 0, err
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
