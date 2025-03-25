package main

import (
	"log"
	"net/http"
	"r-t-forum/database"
	"r-t-forum/web"
)

// func main() {

// 	http.Handle("/assets/", http.FileServer(http.Dir(".")))

// 	db := database.InitDB()
// 	defer db.Close()

// 	database.MakeTables(db)

// 	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
// 		web.PageHandler(w, r, db)
// 	})

// 	log.Println("Server is running on http://localhost:8080")

// 	err := http.ListenAndServe(":8080", nil)
// 	if err != nil {
// 		log.Fatal("Error starting the server:", err)
// 	}
// }

func main() {
	http.Handle("/", http.FileServer(http.Dir("."))) // Serve static files from current directory

	db := database.InitDB()
	defer db.Close()

	if db == nil {
		log.Println("❌ Database connection is nil")
		return
	}

	database.MakeTables(db)

	http.HandleFunc("/posts", func(w http.ResponseWriter, r *http.Request) {
		web.PostsHandler(w, r)
	})

	log.Println("Server is running on http://localhost:8080")

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("Error starting the server:", err)
	}
}
