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

type GroupEvent struct {
	ID            int    `json:"id"`
	GroupID       int    `json:"group_id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	EventDate     string `json:"event_date"`
	CreatedID     int    `json:"created_id"`
	CreatedAt     string `json:"created_at"`
	CreatorName   string `json:"creator_name"`
	GoingCount    int    `json:"going_count"`
	NotGoingCount int    `json:"not_going_count"`
}

type GroupRequest struct {
	ID        int    `json:"id"`
	UserID    int    `json:"user_id"`
	Username  string `json:"username"`
	CreatedAt string `json:"created_at"`
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

// SearchGroups retrieves groups that match the search query
func (db *DB) SearchGroups(userID int, searchQuery string, offset int) ([]Group, error) {
	query := `
		SELECT g.id, g.title, g.description, g.created_at,
		COALESCE((SELECT status FROM group_members WHERE group_id = g.id AND user_id = ?), '') AS status 
		FROM groups g 
		WHERE g.title LIKE ? OR g.description LIKE ?
		ORDER BY g.id DESC LIMIT 4 OFFSET ?`

	searchPattern := "%" + searchQuery + "%"
	rows, err := db.Db.Query(query, userID, searchPattern, searchPattern, offset)
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

// GetGroupIDFromMember retrieves the group ID from a member ID
func (db *DB) GetGroupIDFromMember(memberID int) (int, error) {
	var groupID int
	err := db.Db.QueryRow("SELECT group_id FROM group_members WHERE id = ?", memberID).Scan(&groupID)
	return groupID, err
}

// CreateGroupEvent creates a new group event
func (db *DB) CreateGroupEvent(groupID, creatorID int, title, description, eventDate string) (int, error) {
	var eventID int
	err := db.Db.QueryRow("INSERT INTO group_events (group_id, title, description, event_date, created_id) VALUES (?, ?, ?, ?, ?) RETURNING id",
		groupID, title, description, eventDate, creatorID).Scan(&eventID)
	return eventID, err
}

// GetGroupEvents retrieves all events for a group
func (db *DB) GetGroupEvents(groupID int) ([]GroupEvent, error) {
	rows, err := db.Db.Query(`
		SELECT ge.id, ge.group_id, ge.title, ge.description, ge.event_date, ge.created_id, ge.created_at,
		       u.first_name, u.last_name,
		       (SELECT COUNT(*) FROM event_responses WHERE event_id = ge.id AND response = 'going') as going_count,
		       (SELECT COUNT(*) FROM event_responses WHERE event_id = ge.id AND response = 'not_going') as not_going_count
		FROM group_events ge
		JOIN users u ON ge.created_id = u.id
		WHERE ge.group_id = ?
		ORDER BY ge.event_date ASC`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []GroupEvent
	for rows.Next() {
		var event GroupEvent
		var timeCreated time.Time
		var firstName, lastName string

		err := rows.Scan(&event.ID, &event.GroupID, &event.Title, &event.Description, &event.EventDate,
			&event.CreatedID, &timeCreated, &firstName, &lastName, &event.GoingCount, &event.NotGoingCount)
		if err != nil {
			return nil, err
		}

		event.CreatedAt = timeCreated.Format("Jan 2, 2006 at 15:04")
		event.CreatorName = firstName + " " + lastName
		events = append(events, event)
	}

	return events, nil
}

// AddEventResponse adds or updates a user's response to an event
func (db *DB) AddEventResponse(eventID, userID int, response string) error {
	_, err := db.Db.Exec("INSERT OR REPLACE INTO event_responses (event_id, user_id, response) VALUES (?, ?, ?)",
		eventID, userID, response)
	return err
}

// GetUserEventResponse gets a user's response to a specific event
func (db *DB) GetUserEventResponse(eventID, userID int) (string, error) {
	var response string
	err := db.Db.QueryRow("SELECT response FROM event_responses WHERE event_id = ? AND user_id = ?",
		eventID, userID).Scan(&response)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return response, err
}

// GetPendingRequests retrieves pending join requests for a group
func (db *DB) GetPendingRequests(groupID int) ([]GroupRequest, error) {
	rows, err := db.Db.Query(`
		SELECT gm.id, gm.user_id, gm.created_at, u.first_name, u.last_name
		FROM group_members gm
		JOIN users u ON gm.user_id = u.id
		WHERE gm.group_id = ? AND gm.status = 'pending'
		ORDER BY gm.created_at DESC`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []GroupRequest
	for rows.Next() {
		var request GroupRequest
		var timeCreated time.Time
		var firstName, lastName string

		err := rows.Scan(&request.ID, &request.UserID, &timeCreated, &firstName, &lastName)
		if err != nil {
			return nil, err
		}

		request.CreatedAt = timeCreated.Format("Jan 2, 2006 at 15:04")
		request.Username = firstName + " " + lastName
		requests = append(requests, request)
	}

	return requests, nil
}

// GetGroupMemberID retrieves the member ID for a user in a group
func (db *DB) GetGroupMemberID(groupID, userID int) (int, error) {
	var memberID int
	err := db.Db.QueryRow("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?", groupID, userID).Scan(&memberID)
	return memberID, err
}

// GetUserIDFromMember retrieves the user ID from a member ID
func (db *DB) GetUserIDFromMember(memberID int) (int, error) {
	var userID int
	err := db.Db.QueryRow("SELECT user_id FROM group_members WHERE id = ?", memberID).Scan(&userID)
	return userID, err
}

// IsUserGroupMember checks if a user is a member of a group
func (db *DB) IsUserGroupMember(userID, groupID int) (bool, error) {
	var exists bool
	err := db.Db.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE user_id = ? AND group_id = ?)", userID, groupID).Scan(&exists)
	return exists, err
}
