package web

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
	PostID      int              `json:"post_id"`
	UserID      int              `json:"user_id"`
	Username    string           `json:"username"`
	PostTitle   string           `json:"post_title"`
	PostContent string           `json:"post_content"`
	CreatedAt   string           `json:"created_at"`
	Likes       int              `json:"likes"`
	LikedNow    bool             `json:"liked_now"`
	Dislikes    int              `json:"dislikes"`
	DislikedNow bool             `json:"disliked_now"`
	Categories  []string         `json:"categories"`
	Comments    []CommentDetails `json:"comments"`
}

type CategoryDetails struct {
	CategoryID   int
	CategoryName string
}

type Post struct {
	ID         int      `json:"id"`
	Title      string   `json:"title"`
	Content    string   `json:"content"`
	Categories []string `json:"categories"`
}
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type StoredMessage struct {
	ID        int    `json:"id"`
	Sender    string `json:"sender"`
	Receiver  string `json:"receiver"`
	UserID    int    `json:"user_id"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}
