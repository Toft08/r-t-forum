package main

import (
	"forum/database"
	"forum/web"
	"log"
	"net/http"
)

func main() {
	http.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("./assets"))))

	// http.Handle("/assets/", http.FileServer(http.Dir(".")))

	db := database.InitDB()
	if db == nil {
		log.Fatal("Database initialization failed.")
	} else {
		log.Println("Database initialized successfully.")
	}
	defer db.Close()

	database.MakeTables(db)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Create an empty PageDetails struct to pass
		pageData := &web.PageDetails{}

		// Call PageHandler and pass the necessary arguments
		web.PageHandler(w, r, pageData)
	})

	log.Println("Server is running on http://localhost:8080")

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("Error starting the server:", err)
	}
}
