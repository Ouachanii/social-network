package models

import (
	"database/sql"
	"time"
)

type Group struct {
	ID          int    `json:"id"`
	CreatorId   int    `json:"creator_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	Status      string `json:"status"`
}

func (db *DB) GetGroup(groupID int) (Group, error) {
	var g Group
	var timeCreated time.Time

	err := db.Db.QueryRow("SELECT id, title, description, creator_id, created_at FROM groups WHERE id = ?", groupID).
		Scan(&g.ID, &g.Title, &g.Description, &g.CreatorId, &timeCreated)
	if err != nil {
		return Group{}, err
	}
	g.CreatedAt = timeCreated.Format("Jan 2, 2006 at 3:04")

	return g, nil
}

func (db *DB) GetUserGroupStatus(groupID, userID int) (string, error) {
	var status string
	err := db.Db.QueryRow("SELECT status FROM group_members WHERE group_id = ? AND user_id = ?", groupID, userID).Scan(&status)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return status, err
}

// CreateGroup inserts a new group into the database and returns its ID
func (db *DB) CreateGroup(title, description string, creatorID int) (int, error) {
	var groupID int
	err := db.Db.QueryRow("INSERT INTO groups (title, description, creator_id) VALUES (?, ?, ?) RETURNING id",
		title, description, creatorID).Scan(&groupID)
	return groupID, err
}

// AddGroupMember adds a user to a group with a specific status
func (db *DB) AddGroupMember(groupID, userID int, status string) error {
	_, err := db.Db.Exec("INSERT INTO group_members (group_id, user_id, status) VALUES (?, ?, ?)", groupID, userID, status)
	return err
}

// GetGroups retrieves a list of groups with member count and user status
func (db *DB) GetGroups(userID int, offset int) ([]Group, error) {
	rows, err := db.Db.Query(`
		SELECT g.id, g.title, g.description, g.created_at,
		COALESCE((SELECT status FROM group_members WHERE group_id = g.id AND user_id = ?), '') AS status 
		FROM groups g ORDER BY g.id DESC LIMIT 4 OFFSET ?`, userID, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []Group
	for rows.Next() {
		var g Group
		var timeCreated time.Time
		if err := rows.Scan(&g.ID, &g.Title, &g.Description, &timeCreated, &g.Status); err != nil {
			return nil, err
		}
		g.CreatedAt = timeCreated.Format("Jan 2, 2006 at 3:04")
		groups = append(groups, g)
	}
	return groups, nil
}

// JoinGroup adds a user to a group
func (db *DB) JoinGroup(groupID, userID int) (int64, error) {
	_, err := db.GetGroup(groupID)
	if err != nil {
		return 0, err
	}
	res, err := db.Db.Exec("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)", groupID, userID)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

// RemoveGroupMember removes a user from a group
func (db *DB) RemoveGroupMemberById(id int) error {
	_, err := db.Db.Exec("DELETE FROM group_members WHERE id = ?", id)
	return err
}

// RemoveGroupMember deletes a user from the group_members table
func (db *DB) RemoveGroupMember(groupID, userID int) error {
	_, err := db.Db.Exec("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", groupID, userID)
	return err
}

// ApproveJoinRequest updates the group member status to 'approved'
func (db *DB) ApproveJoinRequest(memberID int) error {
	_, err := db.Db.Exec("UPDATE group_members SET status = 'approved' WHERE id = ?", memberID)
	return err
}

// GetGroupCreator retrieves the creator ID of a group
func (db *DB) GetGroupCreator(groupID int) (int, error) {
	var creatorID int
	err := db.Db.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupID).Scan(&creatorID)
	return creatorID, err
}

func (db *DB) GetGroupMembers(groupId int) ([]int, error) {
	var members []int

	query := `SELECT user_id FROM group_members WHERE group_id = ? AND (status = 'approved' OR status = 'creator')`

	rows, err := db.Db.Query(query, groupId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var userId int
		if err := rows.Scan(&userId); err != nil {
			return nil, err
		}
		members = append(members, userId)
	}

	return members, nil
}

// GetUsersForGroupInvitation retrieves users who are not already in the group
func (db *DB) GetUsersForGroupInvitation(groupID string, search string, offset int) ([]User, error) {
	query := `SELECT id, first_name, last_name FROM users WHERE id NOT IN (SELECT user_id FROM group_members WHERE group_id = ?)`
	params := []interface{}{groupID}

	if search != "" {
		query += " AND (first_name LIKE CONCAT('%', ?, '%') OR last_name LIKE CONCAT('%', ?, '%') OR nickname LIKE CONCAT('%', ?, '%'))"
		params = append(params, search, search, search)
	}

	query += " LIMIT 6 OFFSET ?"
	params = append(params, offset)

	rows, err := db.Db.Query(query, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Firstname, &u.Lastname); err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	return users, nil
}
