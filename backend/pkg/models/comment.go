package models

import (
	"html"
	"strings"
	"time"
)

type Comment struct {
	Id        int
	Username  string
	Avatar    *string
	Image     *string
	Content   string
	CreatedAt string
}

// InsertComment inserts a new comment into the database
func (db *DB) InsertComment(postID, userID int, content string, imagePath *string) (int, error) {
	_, err := db.GetPost(postID, userID)
	if err != nil {
		return 0, err
	}

	var commentID int
	err = db.Db.QueryRow(`INSERT INTO comments (post_id, user_id, content, image_path) VALUES (?, ?, ?, ?) RETURNING id`, postID, userID, html.EscapeString(content), imagePath).
		Scan(&commentID)
	if err != nil {
		return 0, err
	}
	return commentID, nil
}

// GetComment retrieves a comment by its ID
func (db *DB) GetComment(commentID int) (Comment, error) {
	var c Comment
	var timeCreated time.Time
	var firstName, lastName string

	err := db.Db.QueryRow(`SELECT comments.id, comments.content, comments.image_path, users.first_name, users.last_name, comments.created_at, users.avatar 
		FROM comments JOIN users ON comments.user_id = users.id WHERE comments.id = ?`, commentID).
		Scan(&c.Id, &c.Content, &c.Image, &firstName, &lastName, &timeCreated, &c.Avatar)

	if err != nil {
		return Comment{}, err
	}

	c.Username = strings.Join([]string{firstName, lastName}, " ")
	c.Content = html.UnescapeString(c.Content)
	c.CreatedAt = timeCreated.Format("Jan 2, 2006 at 15:04")

	return c, nil
}

// GetCommentsByPost retrieves paginated comments for a post
func (db *DB) GetCommentsByPost(postID, offset int) ([]Comment, error) {
	rows, err := db.Db.Query(
		`SELECT comments.id, comments.content, comments.image_path, users.first_name, users.last_name, comments.created_at, users.avatar 
		FROM comments JOIN users ON comments.user_id = users.id WHERE comments.post_id = ? ORDER BY comments.id DESC LIMIT 4 OFFSET ?;`,
		postID, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var comment Comment
		var timeCreated time.Time
		var firstName, lastName string

		err := rows.Scan(&comment.Id, &comment.Content, &comment.Image, &firstName, &lastName, &timeCreated, &comment.Avatar)
		if err != nil {
			return nil, err
		}

		comment.Username = strings.Join([]string{firstName, lastName}, " ")
		comment.Content = html.UnescapeString(comment.Content)
		comment.CreatedAt = timeCreated.Format("Jan 2, 2006 at 15:04")
		comments = append(comments, comment)
	}

	return comments, nil
}
