package web

import (
	"log"
	"net/http"
	"time"
)

// Logout logs out the user by deleting the session from the database and setting the session cookie to expire
func Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		log.Println("Session cookie not found:", err)
		http.Error(w, `{"error": "Internal Server Error"}`, http.StatusInternalServerError)
		return
	}

	_, err = db.Exec("UPDATE Session SET status = 'deleted', updated_at = ? WHERE id = ? AND status = 'active'",
		time.Now().Format("2006-01-02 15:04:05"), cookie.Value)
	if err != nil {
		log.Println("Error deleting session:", err)
		http.Error(w, `{"error": "Internal Server Error"}`, http.StatusInternalServerError)
		return
	}

	// Expire the session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HttpOnly: true,
		Path:     "/",
	})
	log.Println("Logged out successfully")
	http.Error(w, `{"error": "Internal Server Error"}`, http.StatusInternalServerError)
}
