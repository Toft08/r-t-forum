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
	if _, err := db.Exec(createPostTableQuery); err != nil {
		fmt.Println("Error creating Post table:", err)
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
	if _, err := db.Exec(createCommentTableQuery); err != nil {
		fmt.Println("Error creating Comment table:", err)
		return
	}
	createCategoryTableQuery := `
		CREATE TABLE IF NOT EXISTS Category (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
    	name TEXT UNIQUE NOT NULL
	);`
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
	// insertUser := `
	// INSERT INTO User (username, email, password, firstname, lastname, age, gender, created_at)
	// SELECT 'admin', 'admin@example.com', 'hashedpassword', 'Admin', 'User', 30, 'Other', datetime('now')
	// WHERE NOT EXISTS (SELECT 1 FROM User WHERE username = 'admin');
	// `
	
	// 	if _, err := db.Exec(insertUser); err != nil {
	// 		fmt.Println("Error inserting into User table:", err)
	// 		return
	// 	}
	//Insert initial data into Post
	insertPostQuery := `
	INSERT INTO post (title, content, user_id, created_at)
	SELECT 'THIS IS THE THIRD POST', 'This is the third post!', 1, datetime('now')
	WHERE NOT EXISTS (SELECT 1 FROM post WHERE title = 'THIS IS THE THIRD POST');

	INSERT INTO post (title, content, user_id, created_at)
	SELECT 'THIS IS THE SECOND POST', 'This is the second post!', 1, datetime('now')
	WHERE NOT EXISTS (SELECT 1 FROM post WHERE title = 'THIS IS THE SECOND POST');

	INSERT INTO post (title, content, user_id, created_at)
	SELECT 'Welcome to the forum', 'This is the first post!', 1, datetime('now')
	WHERE NOT EXISTS (SELECT 1 FROM post WHERE title = 'Welcome to the forum');
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
	SELECT id, 1 FROM Post WHERE title = 'Welcome to the forum'
    UNION ALL
    SELECT id, 2 FROM Post WHERE title = 'THIS IS THE SECOND POST'
    UNION ALL
    SELECT id, 3 FROM Post WHERE title = 'THIS IS THE THIRD POST';
`

	if _, err := db.Exec(insertPostCategoryQuery, int(lastInsertID)); err != nil {
		fmt.Println("Error inserting into Post_category table:", err)
		return
	}
	 

// 	insertMessages := `INSERT INTO Message (sender,receiver , content) VALUES
// (toft, roope, 'How do you… how do you like my lawn club for St. Lou?'),
// (toft, roope, 'Hey, all those people gonna be at the game today?'),
// (toft, roope, 'Certainly'),
// (toft, roope, 'Ah, this is gonna be a whopper of a game!'),
// (toft, roope, 'Well it should be'),
// (toft, roope, 'Hey, toft…'),
// (toft, roope, 'What?'),
// (toft, roope, 'I understand they made you the manager of this here whole great team'),
// (toft, roope, 'Why not?'),
// (toft, roope, 'So, you the manager?'),
// (toft, roope, 'I''m the manager!'),
// (toft, roope, 'Well, you know, I''d like to know some of the guys'' names on the team so when I meet ''em on the street or in the ballpark I''ll be able to say, "Hello" to those people'),
// (toft, roope, 'Why sure I''ll introduce you to the boys. They give ''em funny names though'),
// (toft, roope, 'Oh I know they give those ball players awful funny names'),
// (toft, roope, 'Well, let''s see, on the team we have uh Who''s on first, What''s on second, I Don''t Know is on third…'),
// (toft, roope, 'Are you the manager?'),
// (toft, roope, 'Yes'),
// (toft, roope, 'You know the guys'' names?'),
// (toft, roope, 'I sure do'),
// (toft, roope, 'Then tell me the guys'' names'),
// (toft, roope, 'I say, Who''s on first, What''s on second, I Don''t Know''s on third and then you…'),
// (toft, roope, 'You the manager?'),
// (toft, roope, 'Yes'),
// (toft, roope, 'You know the guys'' names?'),
// (toft, roope, 'I''m telling you their names!'),
// (toft, roope, 'Well who''s on first?'),
// (toft, roope, 'Yeah'),
// (toft, roope, 'Go ahead and tell me'),
// (toft, roope, 'Who'),
// (toft, roope, 'The guy on first'),
// (toft, roope, 'Who'),
// (toft, roope, 'The guy playin'' first base'),
// (toft, roope, 'Who'),
// (toft, roope, 'The guy on first'),
// (toft, roope, 'Who is on first!'),
// (toft, roope, 'What are you askin'' me for? I''m askin'' you!'),
// (toft, roope, 'I''m not asking you, I''m telling you'),
// (toft, roope, 'You ain''t tellin'' me nothin''. I''m askin'' you, who''s on first?'),
// (toft, roope, 'That''s it!'),
// (toft, roope, 'Well go ahead and tell me!'),
// (toft, roope, 'Who!'),
// (toft, roope, 'The guy on first base'),
// (toft, roope, 'That''s his name'),
// (toft, roope, 'That''s whose name?'),
// (toft, roope, 'Yes'),
// (toft, roope, 'Well go ahead and tell me'),
// (toft, roope, 'That''s the man''s name!'),
// (toft, roope, 'That''s whose name?'),
// (toft, roope, 'Yeah!'),
// (toft, roope, 'Well go ahead and tell me!'),
// (toft, roope, 'Who is on first'),
// (toft, roope, 'What are you askin'' me for? I''m askin'' you, who''s on first?'),
// (toft, roope, 'That''s it'),
// (toft, roope, 'Well go ahead and tell me'),
// (toft, roope, 'Who'),
// (toft, roope, 'The guy on first'),
// (toft, roope, 'That''s it'),
// (toft, roope, 'What''s the guy''s name on first?'),
// (toft, roope, 'No, What''s on second'),
// (toft, roope, 'I''m not askin'' you who''s on second!'),
// (toft, roope, 'Who''s on first'),
// (toft, roope, 'That''s what I''m askin'' you! Who''s on first?'),
// (toft, roope, 'Now wait a minute. Don''t…don''t change the players'),
// (toft, roope, 'I''m not changin'' nobody! I asked you a simple question. What''s the guys'' name on first base?'),
// (toft, roope, 'What''s the guy''s name on second base'),
// (toft, roope, 'I''m not askin'' you who''s on second!'),
// (toft, roope, 'Who''s on first'),
// (toft, roope, 'I don''t know'),
// (toft, roope, 'He''s on third. Now we''re not talking about him'),
// (toft, roope, 'Look, you got a first baseman?'),
// (toft, roope, 'Yes'),
// (toft, roope, 'Then tell me the fella''s name playin'' first'),
// (toft, roope, 'Who'),
// (toft, roope, 'The guy playin'' first'),
// (toft, roope, 'That''s his name'),
// (toft, roope, 'Wait…What''s the guy''s name on first base?'),
// (toft, roope, 'What is the guy''s name on second base!'),
// (toft, roope, 'Who''s playin'' second?'),
// (toft, roope, 'Who''s playin'' first'),
// (toft, roope, 'I don''t know'),
// (toft, roope, 'He''s on third base'),
// (toft, roope, 'Look, when you pay off the first baseman every month, who do you pay the money to?'),
// (toft, roope, 'Every dollar of it'),
// (toft, roope, 'Yeah. Look, you gotta pay the money to somebody on first base, don''t you?'),
// (toft, roope, 'Yeah'),
// (toft, roope, 'Does he give you a receipt?'),
// (toft, roope, 'Sure'),
// (toft, roope, 'How does he sign the receipt?'),
// (toft, roope, 'Who'),
// (toft, roope, 'The guy that you give the money to'),
// (toft, roope, 'Who'),
// (toft, roope, 'The guy you give the money to'),
// (toft, roope, 'That''s how he signs it'),
// (toft, roope, 'That''s how who signs it?'),
// (toft, roope, 'Yes'),
// (toft, roope, 'Well go ahead and tell me!?'),
// (toft, roope, 'That''s it'),
// (toft, roope, 'That''s who?'),
// (toft, roope, 'Yeah'),
// (toft, roope, 'When you give the guy the money, doesn''t he have to sign the receipt?'),
// (toft, roope, 'He does!'),
// (toft, roope, 'Well how does he sign his name?'),
// (toft, roope, 'Who'),
// (toft, roope, 'The guy you give the money to'),
// (toft, roope, 'That''s how he signs it!'),
// (toft, roope, 'You! You…You just don''t give money to someone without having ''em sign the receipt!'),
// (toft, roope, 'No! Who signs it'),
// (toft, roope, 'What are you askin'' me for?'),
// (toft, roope, 'Now calm down. I''m not asking you, I am telling you. The…'),
// (toft, roope, 'Well go ahead and tell me. What''s the guy''s name that signs the receipt on first base?'),
// (toft, roope, 'Well now wait a minute. What signs his own receipt'),
// (toft, roope, 'Who signs his own receipt?'),
// (toft, roope, 'No, Who signs his'),
// (toft, roope, 'I''m askin'' you, when the guy on first base gives you a piece of paper…'),
// (toft, roope, 'Yes, now wait…'),
// (toft, roope, '…he puts his name on it'),
// (toft, roope, 'No, Who puts his name on it…'),
// (toft, roope, 'How…'),
// (toft, roope, '…and what puts his name on it…'),
// (toft, roope, 'How does the fella''s name on first base look to you when he signs his name?'),
// (toft, roope, 'Who'),
// (toft, roope, 'To you'),
// (toft, roope, 'That''s how it does'),
// (toft, roope, 'How does it look to you?'),
// (toft, roope, 'Who!'),
// (toft, roope, 'To you'),
// (toft, roope, 'Who!'),
// (toft, roope, 'To you'),
// (toft, roope, 'Who! Look…'),
// (toft, roope, 'When the guy signs his name, how does it look to you?'),
// (toft, roope, 'Now that''s how it looks. Who'),
// (toft, roope, 'How…Who?'),
// (toft, roope, 'Who'),
// (toft, roope, 'I''m askin'' you. What''s the guy''s name on first base you give the money to?'),
// (toft, roope, 'Who! After all, the man''s entitled to it…'),
// (toft, roope, 'Who is?'),
// (toft, roope, 'Yes. Sometimes his wife comes down and collects it'),
// (toft, roope, 'Whose wife?'),
// (toft, roope, 'Yeah, sure'),
// (toft, roope, 'All I''m tryin'' to find out is what''s the guy''s name on first base…'),
// (toft, roope, 'What is on second base'),
// (toft, roope, 'I''m not askin'' you who''s on second'),
// (toft, roope, 'Who''s on first'),
// (toft, roope, 'I don''t know'),
// (toft, roope, 'He''s…'),
// (toft, roope, 'Third base, I know'),
// (toft, roope, 'Yeah'),
// (toft, roope, 'You got a outfield?'),
// (toft, roope, 'Sure'),
// (toft, roope, 'The left fielder''s name?'),
// (toft, roope, 'Why'),
// (toft, roope, 'I just thought I''d ask you'),
// (toft, roope, 'Well I just thought I''d tell you'),
// (toft, roope, 'The left fielder''s name?'),
// (toft, roope, 'Why!?'),
// (toft, roope, 'Hmm…Because!'),
// (toft, roope, 'Oh, he''s center field'),
// (toft, roope, 'Oh…'),
// (toft, roope, 'Told you all these players got…'),
// (toft, roope, 'All I''m tryin'' to figure out is what''s the guy''s name in left field'),
// (toft, roope, 'Now, What''s on second'),
// (toft, roope, 'I''m not askin'' you who''s on second'),
// (toft, roope, 'Who''s on first'),
// (toft, roope, 'I don''t know…'),
// (toft, roope, 'Third base'),
// (toft, roope, 'You got a pitcher on this team?'),
// (toft, roope, 'Wouldn''t be a fine team without a pitcher'),
// (toft, roope, 'What''s his name?'),
// (toft, roope, 'Tomorrow'),
// (toft, roope, 'You don''t want to tell me today?'),
// (toft, roope, 'I''m telling you'),
// (toft, roope, 'Then go ahead'),
// (toft, roope, 'Tomorrow!'),
// (toft, roope, 'What time?'),
// (toft, roope, 'What time what?'),
// (toft, roope, 'What time tomorrow are you gonna tell me who''s pitching?'),
// (toft, roope, 'Now listen. Who is not…'),
// (toft, roope, 'I''ll break your arm, you say who''s on first! I want to know what''s the pitcher''s name?'),
// (toft, roope, 'What''s on second'),
// (toft, roope, 'I don''t know'),
// (toft, roope, 'Third base!'),
// (toft, roope, 'You got a catcher?'),
// (toft, roope, 'Sure'),
// (toft, roope, 'The catcher''s name?'),
// (toft, roope, 'Today'),
// (toft, roope, 'Today. You don''t wanna tell me, today…tomorrow…do you?'),
// (toft, roope, 'I''m telling you'),
// (toft, roope, 'So the catcher''s name?'),
// (toft, roope, 'Today'),
// (toft, roope, 'Today. And Tomorrow''s pitching'),
// (toft, roope, 'Now you''ve got it!'),
// (toft, roope, 'Now I''ve got it…'),
// (toft, roope, 'Hey!'),
// (toft, roope, 'All we got is a couple of days on the team!'),
// (toft, roope, 'Well I can''t help that'),
// (toft, roope, 'All right. You know now, I''m a good catcher. Now, I get behind the plate and…and Tomorrow''s pitching on my team and a heavy hitter gets up'),
// (toft, roope, 'Yes?'),
// (toft, roope, 'Now when he gets up, me being a good catcher, I''m gonna throw the guy out at first base. So the guy bunts the ball. I pick up the ball, I''m gonna throw the guy out at first base. So I pick up the ball and throw it to who?'),
// (toft, roope, 'Now that''s the first thing you''ve said right'),
// (toft, roope, 'I don''t even know what I''m talkin'' about!'),
// (toft, roope, 'Well that''s…That''s all you have…'),
// (toft, roope, 'That''s all I have to do is to throw the ball to first base. Now who''s got it?'),
// (toft, roope, 'Naturally. Now you''ve got it'),
// (toft, roope, 'I throw the ball to first base, somebody''s gotta get the ball! Now who''s got it?'),
// (toft, roope, 'Naturally'),
// (toft, roope, 'Who?'),
// (toft, roope, 'Naturally'),
// (toft, roope, 'Naturally?'),
// (toft, roope, 'Naturally'),
// (toft, roope, 'So I pick up the ball and I throw it to Naturally'),
// (toft, roope, 'No, no, no, no…'),
// (toft, roope, 'He gets the ball. Naturally gets the ball and...'),
// (toft, roope, 'You throw the ball to first base'),
// (toft, roope, 'Then who gets it?'),
// (toft, roope, 'Naturally'),
// (toft, roope, 'So I pick up the ball and I throw it to Naturally'),
// (toft, roope, 'No!'),
// (toft, roope, 'Naturally gets the ball and…and…'),
// (toft, roope, 'You throw the ball to Who'),
// (toft, roope, 'Naturally'),
// (toft, roope, 'Naturally'),
// (toft, roope, 'That''s what I''m saying!?toft'),
// (toft, roope, 'I said, I throw the ball to Naturally'),
// (toft, roope, 'No you don''t!'),
// (toft, roope, 'I throw it to who?'),
// (toft, roope, 'Naturally'),
// (toft, roope, 'That''s what I''m saying!'),
// (toft, roope, 'No it isn''t'),
// (toft, roope, 'I throw the ball to first base, somebody''s gotta get it'),
// (toft, roope, 'So Who gets it'),
// (toft, roope, 'Naturally'),
// (toft, roope, 'That''s it'),
// (toft, roope, 'Okay. Now I ask you, who gets it?'),
// (toft, roope, 'Naturally'),
// (toft, roope, 'Same as you!'),
// (toft, roope, 'Now listen…'),
// (toft, roope, 'I throw the ball to Naturally'),
// (toft, roope, 'You throw the ball to Who!'),
// (toft, roope, 'Then who gets it?'),
// (toft, roope, 'Naturally'),
// (toft, roope, 'He better get it! So I throw the ball to first base'),
// (toft, roope, 'All right'),
// (toft, roope, 'Whoever gets it drops the ball and the guy runs to second. Now, Who picks up the ball and throws it to What. What throws it to I Don''t Know. I Don''t Know throws it back to Tomorrow, triple play'),
// (toft, roope, 'Could be'),
// (toft, roope, 'Another guy gets up and hits a long fly ball to Because'),
// (toft, roope, 'Yes'),
// (toft, roope, 'Why? I don''t know! He''s on third and I don''t give a darn!'),
// (toft, roope, 'What''d you say?'),
// (toft, roope, 'I said, I don''t give a darn!'),
// (toft, roope, 'Oh, that''s our shortstop!');`
// _, err = db.Exec(insertMessages)
// if err != nil {
// 	fmt.Println("Error inserting into Message table:", err)
// 	return
// }

	fmt.Println("Tables created and initial data inserted successfully.")
}

