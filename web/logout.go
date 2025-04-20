package web

import (
	"database/sql"
	"encoding/json"
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

	var sessionID string
	err = db.QueryRow("SELECT id FROM Session WHERE id = ? AND status = 'active'", cookie.Value).Scan(&sessionID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Println("No active session found for ID:", cookie.Value)
		} else {
			log.Println("Error checking session:", err)
		}
		http.Error(w, `{"error": "Session not found"}`, http.StatusNotFound)
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
		Secure:  true,
		Path:     "/",
	})
	log.Println("Logged out successfully")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logout successful"})
}
