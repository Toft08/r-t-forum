package web

type PageDetails struct {
	LoggedIn         bool
	Username         string
	Categories       []CategoryDetails
	Posts            []PostDetails
	SelectedCategory string
	SelectedFilter   string
	ValidationError  string
}

type CommentDetails struct {
	CommentID   int    `json:"comment_id"`
	PostID      int    `json:"post_id"`
	Content     string `json:"content"`
	UserID      int    `json:"user_id"`
	Username    string `json:"username"`
	CreatedAt   string `json:"created_at"`
	Likes       int    `json:"likes"`
	Dislikes    int    `json:"dislikes"`
	LikedNow    bool   `json:"liked_now"`
	DislikedNow bool   `json:"disliked_now"`
}

type PostDetails struct {
	PostID      int    `json:"post_id"`
	UserID      int    `json:"user_id"`
	Username    string `json:"username"`
	PostTitle   string `json:"post_title"`
	PostContent string `json:"post_content"`
	CreatedAt   string `json:"created_at"`
	Likes       int    `json:"likes"`
	Dislikes    int    `json:"dislikes"`
	Categories  string `json:"categories"`
}

type CategoryDetails struct {
	CategoryID   int    `json:"category_id"`
	CategoryName string `json:"category_name"`
}

type Post struct {
	ID      int    `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}
