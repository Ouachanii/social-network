package models

import (
	"database/sql"
	"fmt"
)

type Follower struct {
	ID        int     `json:"id"`
	Firstname string  `json:"fname"`
	Lastname  string  `json:"lname"`
	Avatar    *string `json:"avatar"`
}

func (db *DB) GetFollowers(userID int) ([]Follower, error) {
	rows, err := db.Db.Query(`
		SELECT users.id, users.first_name, users.last_name FROM users
		JOIN follow_requests ON users.id = follow_requests.follower_id
		WHERE follow_requests.following_id = ? AND follow_requests.status = 'approved';
	`, userID)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer rows.Close()

	var followers []Follower
	for rows.Next() {
		var f Follower
		err := rows.Scan(&f.ID, &f.Firstname, &f.Lastname)
		if err != nil {
			return nil, err
		}
		followers = append(followers, f)
	}
	return followers, nil
}

func (db *DB) GetFollowing(userID int) ([]Follower, error) {
	rows, err := db.Db.Query(`
		SELECT users.id, users.first_name, users.last_name FROM users
		JOIN follow_requests ON users.id = follow_requests.following_id
		WHERE follow_requests.follower_id = ? AND follow_requests.status = 'approved';
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var following []Follower
	for rows.Next() {
		var f Follower
		err := rows.Scan(&f.ID, &f.Firstname, &f.Lastname)
		if err != nil {
			return nil, err
		}
		following = append(following, f)
	}
	return following, nil
}

func (db *DB) GetFollowStatus(followerID, followingID int) (string, error) {
	var status string
	err := db.Db.QueryRow("SELECT status FROM follow_requests WHERE follower_id = ? AND following_id = ?", followerID, followingID).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return status, nil
}

func (db *DB) NotFollowing(userID int) ([]Follower, error) {
	rows, err := db.Db.Query(`SELECT users.id, users.first_name, users.last_name ,users.avatar FROM users
    LEFT JOIN follow_requests ON users.id = follow_requests.follower_id
    WHERE follow_requests.follower_id != ? or users.id !=?`, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notFollowing []Follower
	for rows.Next() {
		var nf Follower
		err := rows.Scan(&nf.ID, &nf.Firstname, &nf.Lastname, &nf.Avatar)
		if err != nil {
			return nil, err
		}
		notFollowing = append(notFollowing, nf)
	}
	return notFollowing, nil
}

// InsertFollowRequest inserts a new follow request (Pending or Approved)
func (db *DB) InsertFollowRequest(followerID, followingID int, status string) (int64, error) {
	_, err := db.GetUserInfo(followingID)
	if err != nil {
		return 0, err
	}

	res, err := db.Db.Exec("INSERT INTO follow_requests (follower_id, following_id, status) VALUES (?, ?, ?)", followerID, followingID, status)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

// DeleteFollowRequest removes a follow request
func (db *DB) DeleteFollowRequest(requestID int) error {
	_, err := db.Db.Exec("DELETE FROM follow_requests WHERE id = ?", requestID)
	return err
}

// DeleteFollowRequestByUsers removes a follow request by follower and following IDs
func (db *DB) DeleteFollowRequestByUsers(followerID, followingID int) error {
	_, err := db.Db.Exec("DELETE FROM follow_requests WHERE follower_id = ? AND following_id = ?", followerID, followingID)
	return err
}

// ApproveFollowRequest updates a follow request's status to 'approved'
func (db *DB) ApproveFollowRequest(requestID int) error {
	_, err := db.Db.Exec("UPDATE follow_requests SET status = 'approved' WHERE id = ?", requestID)
	return err
}

// ApproveFollowRequestByUsers updates a follow request's status to 'approved' by follower and following IDs
func (db *DB) ApproveFollowRequestByUsers(followerID, followingID int) error {
	_, err := db.Db.Exec("UPDATE follow_requests SET status = 'approved' WHERE follower_id = ? AND following_id = ?", followerID, followingID)
	return err
}

// GetAvailableUsersToFollow returns users that the current user is not following or pending
func (db *DB) GetAvailableUsersToFollow(currentUserID int) ([]Follower, error) {
	rows, err := db.Db.Query(`
		SELECT users.id, users.first_name, users.last_name, users.avatar 
		FROM users 
		WHERE users.id != ? 
		AND users.id NOT IN (
			SELECT following_id 
			FROM follow_requests 
			WHERE follower_id = ? AND status IN ('pending', 'approved')
		)
	`, currentUserID, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []Follower
	for rows.Next() {
		var user Follower
		err := rows.Scan(&user.ID, &user.Firstname, &user.Lastname, &user.Avatar)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}

// GetFollowersCount returns the count of approved followers for a user
func (db *DB) GetFollowersCount(userID int) (int, error) {
	var count int
	err := db.Db.QueryRow(`
		SELECT COUNT(*) 
		FROM follow_requests 
		WHERE following_id = ? AND status = 'approved'
	`, userID).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

// GetFollowingCount returns the count of approved following for a user
func (db *DB) GetFollowingCount(userID int) (int, error) {
	var count int
	err := db.Db.QueryRow(`
		SELECT COUNT(*) 
		FROM follow_requests 
		WHERE follower_id = ? AND status = 'approved'
	`, userID).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

// GetFollowersWithDetails returns approved followers with full user details
func (db *DB) GetFollowersWithDetails(userID int) ([]Follower, error) {
	rows, err := db.Db.Query(`
		SELECT users.id, users.first_name, users.last_name, users.avatar 
		FROM users
		JOIN follow_requests ON users.id = follow_requests.follower_id
		WHERE follow_requests.following_id = ? AND follow_requests.status = 'approved'
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var followers []Follower
	for rows.Next() {
		var f Follower
		err := rows.Scan(&f.ID, &f.Firstname, &f.Lastname, &f.Avatar)
		if err != nil {
			return nil, err
		}
		followers = append(followers, f)
	}
	return followers, nil
}

// GetFollowingWithDetails returns approved following users with full user details
func (db *DB) GetFollowingWithDetails(userID int) ([]Follower, error) {
	rows, err := db.Db.Query(`
		SELECT users.id, users.first_name, users.last_name, users.avatar 
		FROM users
		JOIN follow_requests ON users.id = follow_requests.following_id
		WHERE follow_requests.follower_id = ? AND follow_requests.status = 'approved'
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var following []Follower
	for rows.Next() {
		var f Follower
		err := rows.Scan(&f.ID, &f.Firstname, &f.Lastname, &f.Avatar)
		if err != nil {
			return nil, err
		}
		following = append(following, f)
	}
	return following, nil
}

// GetFollowRequestID returns the ID of a follow request
func (db *DB) GetFollowRequestID(followerID, followingID int) (int, error) {
	var requestID int
	err := db.Db.QueryRow("SELECT id FROM follow_requests WHERE follower_id = ? AND following_id = ?", followerID, followingID).Scan(&requestID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, nil
		}
		return 0, err
	}
	return requestID, nil
}

// GetFollowRequestByUsers returns a follow request by follower and following IDs
func (db *DB) GetFollowRequestByUsers(followerID, followingID int) (int, string, error) {
	var requestID int
	var status string
	err := db.Db.QueryRow("SELECT id, status FROM follow_requests WHERE follower_id = ? AND following_id = ?", followerID, followingID).Scan(&requestID, &status)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, "", nil
		}
		return 0, "", err
	}
	return requestID, status, nil
}

// GetFollowRequestByID returns a follow request by its ID
func (db *DB) GetFollowRequestByID(requestID int) (int, int, string, error) {
	var followerID, followingID int
	var status string
	err := db.Db.QueryRow("SELECT follower_id, following_id, status FROM follow_requests WHERE id = ?", requestID).Scan(&followerID, &followingID, &status)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, 0, "", nil
		}
		return 0, 0, "", err
	}
	return followerID, followingID, status, nil
}
