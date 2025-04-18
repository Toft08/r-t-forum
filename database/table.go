package database

import (
	"database/sql"
	"fmt"
)

// MakeTables creates the tables in the database if they do not exist and inserts initial data into the tables
func MakeTables(db *sql.DB) {

	createUserTableQuery := `
		CREATE TABLE IF NOT EXISTS User (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT UNIQUE NOT NULL,
		username TEXT UNIQUE NOT NULL COLLATE NOCASE,
		password TEXT NOT NULL,
		firstname TEXT NOT NULL,
		lastname TEXT NOT NULL,
		age INTEGER NOT NULL,
		gender TEXT NOT NULL,
		created_at TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted'))
	);`
	if _, err := db.Exec(createUserTableQuery); err != nil {
		fmt.Println("Error creating User table:", err)
		return
	}
	createPostTableQuery := `
		CREATE TABLE IF NOT EXISTS Post (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
    	content TEXT NOT NULL,
   		user_id INTEGER NOT NULL,
   		created_at TEXT NOT NULL,
    	FOREIGN KEY (user_id) REFERENCES User (id) ON DELETE CASCADE
	);`
	//status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted'))
	if _, err := db.Exec(createPostTableQuery); err != nil {
		fmt.Println("Error creating Post table:", err)
		return
	}
	createCommentTableQuery := `
		CREATE TABLE IF NOT EXISTS Comment (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		content TEXT NOT NULL,
		post_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		created_at TEXT NOT NULL,
		FOREIGN KEY (post_id) REFERENCES Post (id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES User (id) ON DELETE CASCADE
	);`
	//status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted'))
	if _, err := db.Exec(createCommentTableQuery); err != nil {
		fmt.Println("Error creating Comment table:", err)
		return
	}
	createMessageTableQuery := `
		CREATE TABLE IF NOT EXISTS Message (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sender TEXT NOT NULL,
		receiver TEXT NOT NULL,
		user_id INTEGER NOT NULL,
		content TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES User (id) ON DELETE CASCADE
	);`
	if _, err := db.Exec(createMessageTableQuery); err != nil {
		fmt.Println("Error creating Message table:", err)
		return
	}
	createCategoryTableQuery := `
		CREATE TABLE IF NOT EXISTS Category (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT UNIQUE NOT NULL
	);`
	//status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted'))
	if _, err := db.Exec(createCategoryTableQuery); err != nil {
		fmt.Println("Error creating Category table:", err)
		return
	}
	createPost_CategoryTableQuery := `
		CREATE TABLE IF NOT EXISTS Post_Category (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		category_id INTEGER NOT NULL,
		post_id INTEGER NOT NULL,
		FOREIGN KEY (category_id) REFERENCES Category (id) ON DELETE CASCADE,
		FOREIGN KEY (post_id) REFERENCES Post (id) ON DELETE CASCADE
	);`
	if _, err := db.Exec(createPost_CategoryTableQuery); err != nil {
		fmt.Println("Error creating Post_Category table:", err)
		return
	}
	createLikeTableQuery := `
		CREATE TABLE IF NOT EXISTS Like (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		post_id INTEGER,
		comment_id INTEGER,
		created_at TEXT NOT NULL,
		updated_at TEXT,
		type INTEGER NOT NULL,
		FOREIGN KEY (user_id) REFERENCES User (id) ON DELETE CASCADE,
		FOREIGN KEY (post_id) REFERENCES Post (id) ON DELETE CASCADE,
		FOREIGN KEY (comment_id) REFERENCES Comment (id) ON DELETE CASCADE
	);`
	if _, err := db.Exec(createLikeTableQuery); err != nil {
		fmt.Println("Error creating Like table:", err)
		return
	}
	createSessionTableQuery := `
		CREATE TABLE IF NOT EXISTS Session (
		id TEXT PRIMARY KEY,
		status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'inactive', 'deleted')),
		user_id INTEGER NOT NULL,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL,
		expired_at TEXT NOT NULL,
		FOREIGN KEY (user_id) REFERENCES User (id) ON DELETE CASCADE
	);`
	if _, err := db.Exec(createSessionTableQuery); err != nil {
		fmt.Println("Error creating Session table:", err)
		return
	}
	insertCategoryQuery := `
    INSERT INTO category (name)
    SELECT 'General' WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'General')
    UNION ALL
    SELECT 'Tutorial' WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Tutorial')
    UNION ALL
    SELECT 'Question' WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Question')
	UNION ALL
    SELECT 'Plants' WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Plants')
	UNION ALL
    SELECT 'Pests' WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Pests')
	UNION ALL
    SELECT 'Sustainability' WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Sustainability');
`
	if _, err := db.Exec(insertCategoryQuery); err != nil {
		fmt.Println("Error inserting into Category table:", err)
		return
	}
	insertUserQuery := `
INSERT INTO User (username, email, password, firstname, lastname, age, gender, created_at)
SELECT 'admin', 'admin@example.com', 'hashedpassword', 'Admin', 'User', 30, 'Other', datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM User WHERE username = 'admin');
`

	if _, err := db.Exec(insertUserQuery); err != nil {
		fmt.Println("Error inserting into User table:", err)
		return
	}
	
	//Insert initial data into Post
	insertPostQuery := `
	INSERT INTO post (title, content, user_id, created_at)
	SELECT 'Welcome to the forum', 'This is the first post!', 1, datetime('now')
	WHERE NOT EXISTS (
	SELECT 1 FROM post WHERE title = 'Welcome to the forum'
	);
`
	result, err := db.Exec(insertPostQuery)
	if err != nil {
		fmt.Println("Error inserting into Post table:", err)
		return
	}

	// Retrieve the last inserted ID
	lastInsertID, err := result.LastInsertId()
	if err != nil {
		fmt.Println("Error retrieving last insert ID:", err)
		return
	}

	insertPostCategoryQuery := `
    INSERT INTO Post_category (post_id, category_id)
	VALUES (?, 1);
`

	if _, err := db.Exec(insertPostCategoryQuery, int(lastInsertID)); err != nil {
		fmt.Println("Error inserting into Post_category table:", err)
		return
	}

	fmt.Println("Tables created and initial data inserted successfully.")
}

