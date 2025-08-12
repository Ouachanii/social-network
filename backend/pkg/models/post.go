package models

import (
	"database/sql"
	"fmt"
	"html"
	"time"
)

type Post struct {
	Pid             int
	Uid             int
	Username        string
	Avatar          *string
	Image           *string
	Content         string
	Privacy         string
	CreatedAt       string
	Likes           int
	Dislikes        int
	NbComment       int
	UserInteraction int
}

// CreatePost inserts a new post into the database and returns the post ID
func (db *DB) CreatePost(userID int, content, privacy string, imagePath *string, groupID int) (int, error) {
	if groupID != 0 {
		_, err := db.GetGroup(groupID)
		if err != nil {
			return 0, err
		}
	}
	var postID int
	// Handle empty content by setting it to NULL in database
	var contentValue interface{}
	if content == "" {
		contentValue = nil
	} else {
		contentValue = html.EscapeString(content)
	}

	err := db.Db.QueryRow(`
		INSERT INTO posts (user_id, content, privacy, image_path, group_id)
		VALUES (?, ?, ?, ?, ?) RETURNING id`,
		userID, contentValue, privacy, imagePath, groupID,
	).Scan(&postID)

	if err != nil {
		return 0, err
	}
	return postID, nil
}

// AddPostPrivacy inserts privacy settings for selected users
func (db *DB) AddPostPrivacy(postID int, selectedUsers []int) error {
	if len(selectedUsers) == 0 {
		return nil
	}

	for _, userID := range selectedUsers {
		_, err := db.Db.Exec(`INSERT INTO post_privacy_users (user_id, post_id, created_at) VALUES (?, ?, ?)`, userID, postID, time.Now())
		if err != nil {
			return err
		}
	}
	return nil
}

func (db *DB) GetUserPostCount(userID int) (int, error) {
	var count int
	err := db.Db.QueryRow("SELECT COUNT(*) FROM posts WHERE user_id = ? AND group_id = 0", userID).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (db *DB) GetPostsWithPrivacy(userID int, baseWhere string, args []interface{}, offset int) ([]Post, error) {
	privacyWhere := `
        AND (
            posts.privacy = 'public' 
            OR posts.user_id = ? 
            OR (posts.privacy = 'almost_private' AND EXISTS (
                SELECT 1 FROM follow_requests 
                WHERE follower_id = ? AND following_id = posts.user_id AND status = 'approved'
            )) 
            OR (posts.privacy = 'private' AND EXISTS (
                SELECT 1 FROM post_privacy_users 
                WHERE post_id = posts.id AND user_id = ?
            ))
        )`

	args = append(args, userID, userID, userID)

	query := `
        SELECT posts.id, posts.user_id, posts.created_at, posts.content, 
               posts.image_path, posts.privacy, 
               users.first_name, users.last_name, users.avatar,
               (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count
        FROM posts
        JOIN users ON posts.user_id = users.id
        ` + baseWhere + privacyWhere + `
        ORDER BY posts.id DESC LIMIT 10 OFFSET ?`
	args = append(args, offset)
	rows, err := db.Db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var post Post
		var timeCreated time.Time
		var firstName, lastName string

		var content sql.NullString
		err := rows.Scan(&post.Pid, &post.Uid, &timeCreated, &content,
			&post.Image, &post.Privacy, &firstName, &lastName, &post.Avatar, &post.NbComment)
		if err != nil {
			return nil, err
		}

		if content.Valid {
			post.Content = html.UnescapeString(content.String)
		} else {
			post.Content = ""
		}
		post.Username = firstName + " " + lastName
		post.CreatedAt = timeCreated.Format("Jan 2, 2006 at 15:04")
		post.Likes = db.getPostLikeDisLike(post.Pid)
		post.Dislikes = db.getPostDislikeCount(post.Pid)
		post.UserInteraction = db.getPostInteractions(post.Pid, userID)

		posts = append(posts, post)
	}

	return posts, nil
}

// GetGroupPosts retrieves posts for a specific group
func (db *DB) GetGroupPosts(groupID, userID int, offset int) ([]Post, error) {
	// First check if user is a member of the group
	status, err := db.GetUserGroupStatus(groupID, userID)
	if err != nil || status == "" {
		return nil, fmt.Errorf("user is not a member of this group")
	}

	query := `
        SELECT posts.id, posts.user_id, posts.created_at, posts.content, 
               posts.image_path, posts.privacy, 
               users.first_name, users.last_name, users.avatar,
               (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.group_id = ?
        ORDER BY posts.id DESC LIMIT 10 OFFSET ?`

	rows, err := db.Db.Query(query, groupID, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var post Post
		var timeCreated time.Time
		var firstName, lastName string

		var content sql.NullString
		err := rows.Scan(&post.Pid, &post.Uid, &timeCreated, &content,
			&post.Image, &post.Privacy, &firstName, &lastName, &post.Avatar, &post.NbComment)
		if err != nil {
			return nil, err
		}

		if content.Valid {
			post.Content = html.UnescapeString(content.String)
		} else {
			post.Content = ""
		}
		post.Username = firstName + " " + lastName
		post.CreatedAt = timeCreated.Format("Jan 2, 2006 at 15:04")
		post.Likes = db.getPostLikeDisLike(post.Pid)
		post.Dislikes = db.getPostDislikeCount(post.Pid)
		post.UserInteraction = db.getPostInteractions(post.Pid, userID)

		posts = append(posts, post)
	}

	return posts, nil
}

func (db *DB) GetPost(postID, userID int) (Post, error) {
	var p Post
	var timeCreated time.Time
	var fistname, lastname string
	var content sql.NullString
	err := db.Db.QueryRow(`SELECT posts.id, posts.user_id, posts.created_at, posts.content,posts.image_path,users.first_name, users.last_name, users.avatar FROM posts
        JOIN users ON posts.user_id = users.id WHERE posts.id = ? `, postID).Scan(&p.Pid, &p.Uid, &timeCreated, &content, &p.Image, &fistname, &lastname, &p.Avatar)
	if err != nil {
		return Post{}, err
	}
	if content.Valid {
		p.Content = html.UnescapeString(content.String)
	} else {
		p.Content = ""
	}
	p.Username = fistname + " " + lastname
	err = db.Db.QueryRow("SELECT COUNT(*) FROM comments WHERE post_id = ?", p.Pid).Scan(&p.NbComment)
	if err != nil {
		return Post{}, err
	}
	p.Likes = db.getPostLikeDisLike(p.Pid)
	p.Dislikes = db.getPostDislikeCount(p.Pid)
	p.UserInteraction = db.getPostInteractions(p.Pid, userID)
	p.CreatedAt = timeCreated.Format("Jan 2, 2006 at 15:04")
	return p, nil
}

func (db *DB) getPostLikeDisLike(post_id int) int {
	var count int
	err := db.Db.QueryRow("SELECT COUNT(*) FROM post_interactions WHERE post_id=? AND interaction=1", post_id).Scan(&count)
	if err != nil {
		return 0
	}
	return count
}

func (db *DB) getPostDislikeCount(post_id int) int {
	var count int
	err := db.Db.QueryRow("SELECT COUNT(*) FROM post_interactions WHERE post_id=? AND interaction=-1", post_id).Scan(&count)
	if err != nil {
		return 0
	}
	return count
}

func (db *DB) getPostInteractions(pid, uid int) int {
	var ii int
	db.Db.QueryRow(`select interaction from post_interactions where user_id = ? and post_id=?`, uid, pid).Scan(&ii)
	return ii
}

// InsertOrUpdateLike handles inserting or updating likes in the database
func (db *DB) InsertOrUpdateLike(userID, postID, likeStatus int) error {

	_, err := db.GetPost(postID, userID)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO post_interactions (user_id, post_id, interaction)
		VALUES (?, ?, ?)
		ON CONFLICT(user_id, post_id) DO UPDATE SET interaction=excluded.interaction
	`
	_, err = db.Db.Exec(query, userID, postID, likeStatus)
	return err
}

// GetPostsByUserID retrieves all posts for a specific user
func (db *DB) GetPostsByUserID(userID int, offset int) ([]Post, error) {
	query := `
        SELECT posts.id, posts.user_id, posts.created_at, posts.content, 
               posts.image_path, posts.privacy, 
               users.first_name, users.last_name, users.avatar,
               (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.user_id = ? AND posts.group_id = 0
        ORDER BY posts.id DESC LIMIT 10 OFFSET ?`

	rows, err := db.Db.Query(query, userID, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var post Post
		var timeCreated time.Time
		var firstName, lastName string

		var content sql.NullString
		err := rows.Scan(&post.Pid, &post.Uid, &timeCreated, &content,
			&post.Image, &post.Privacy, &firstName, &lastName, &post.Avatar, &post.NbComment)
		if err != nil {
			return nil, err
		}

		if content.Valid {
			post.Content = html.UnescapeString(content.String)
		} else {
			post.Content = ""
		}
		post.Username = firstName + " " + lastName
		post.CreatedAt = timeCreated.Format("Jan 2, 2006 at 15:04")
		post.Likes = db.getPostLikeDisLike(post.Pid)
		post.Dislikes = db.getPostDislikeCount(post.Pid)
		post.UserInteraction = db.getPostInteractions(post.Pid, userID)

		posts = append(posts, post)
	}

	return posts, nil
}

// GetUserPosts retrieves posts for a specific user with privacy checks
func (db *DB) GetUserPosts(userID, currentUserID int) ([]Post, error) {
	query := `
        SELECT posts.id, posts.user_id, posts.created_at, posts.content, 
               posts.image_path, posts.privacy, 
               users.first_name, users.last_name, users.avatar,
               (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.user_id = ? AND posts.group_id = 0
        AND (
            posts.privacy = 'public' 
            OR posts.user_id = ? 
            OR (posts.privacy = 'almost_private' AND EXISTS (
                SELECT 1 FROM follow_requests 
                WHERE follower_id = ? AND following_id = posts.user_id AND status = 'approved'
            )) 
            OR (posts.privacy = 'private' AND EXISTS (
                SELECT 1 FROM post_privacy_users 
                WHERE post_id = posts.id AND user_id = ?
            ))
        )
        ORDER BY posts.id DESC`

	rows, err := db.Db.Query(query, userID, currentUserID, currentUserID, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var post Post
		var timeCreated time.Time
		var firstName, lastName string

		var content sql.NullString
		err := rows.Scan(&post.Pid, &post.Uid, &timeCreated, &content,
			&post.Image, &post.Privacy, &firstName, &lastName, &post.Avatar, &post.NbComment)
		if err != nil {
			return nil, err
		}

		if content.Valid {
			post.Content = html.UnescapeString(content.String)
		} else {
			post.Content = ""
		}
		post.Username = firstName + " " + lastName
		post.CreatedAt = timeCreated.Format("Jan 2, 2006 at 15:04")
		post.Likes = db.getPostLikeDisLike(post.Pid)
		post.Dislikes = db.getPostDislikeCount(post.Pid)
		post.UserInteraction = db.getPostInteractions(post.Pid, currentUserID)

		posts = append(posts, post)
	}

	return posts, nil
}
