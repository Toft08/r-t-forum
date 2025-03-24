package database

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3" // SQLite3 driver; the blank import ensures the driver is included "_" is important!!!
)

// InitDB initializes the SQLite database and returns a database connection object
func InitDB() *sql.DB {
	// Open the SQLite database
	db, err := sql.Open("sqlite3", "./database.db")
	if err != nil {
		log.Println("Failed to initialize the database")
		log.Fatal(err)
	}

	// Ping the database to make sure the connection is valid
	err = db.Ping()
	if err != nil {
		log.Println("Failed to ping the database")
		log.Fatal(err)
	} else {
		log.Println("Database initialized successfully")
	}

	// Return the database connection
	return db
}