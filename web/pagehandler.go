package web

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

var db *sql.DB

// func PageHandler(w http.ResponseWriter, r *http.Request) {
// 	http.ServeFile(w, r, "index.html")
// }

// PageDetails contains the data to be passed to the HTML templates
func Handler(w http.ResponseWriter, r *http.Request, database *sql.DB) {

	db = database
	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		log.Printf("Unsupported method: %s", r.Method)
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	switch r.URL.Path {
	case "/":
		// HomePage(w, r, &data)
	case "/api/login":
		Login(w, r, db)
	case "/api/signup":
		SignUp(w, r, db)
	case "/api/posts":
		PostsHandler(w, r)
	case "/api/logout":
		Logout(w, r)
	default:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Page Not Found"})
	}
}

// RenderTemplate handles the rendering of HTML templates with provided data
// func RenderTemplate(w http.ResponseWriter, t string, data interface{}) {

// 	err := tmpl.ExecuteTemplate(w, t+".html", data)
// 	if err != nil {
// 		log.Println("Error executing template:", err)
// 		ErrorHandler(w, "Internal Server Error", http.StatusInternalServerError)
// 		return
// 	}
// }

// // ErrorHandler handles the rendering of error pages
// func ErrorHandler(w http.ResponseWriter, errorMessage string, statusCode int) {

// 	w.WriteHeader(statusCode)

// 	err := tmpl.ExecuteTemplate(w, "error.html", map[string]string{
// 		"ErrorMessage": errorMessage,
// 	})
// 	if err != nil {
// 		log.Println("Error executing template error.html:", err)
// 		http.Error(w, errorMessage, statusCode)
// 		return
// 	}
// }

// VerifySession checks if the session ID exists in the database
func VerifySession(r *http.Request) (bool, int, string) {
	var userID int
	var username string
	cookie, err := r.Cookie("session_id")
	if err != nil {
		return false, 0, ""
	}

	err = db.QueryRow("SELECT user_id FROM Session WHERE id = ?", cookie.Value).Scan(&userID)
	if err != nil {
		log.Println("No userID found for the cookie")
		return false, 0, ""
	}

	err = db.QueryRow("SELECT username FROM User WHERE id = ?", userID).Scan(&username)
	if err != nil {
		log.Println("No username found")
		return false, 0, ""
	}

	return true, userID, username
}
