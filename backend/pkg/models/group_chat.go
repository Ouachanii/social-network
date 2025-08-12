package models

import (
	"time"
)

type GroupMessage struct {
	ID        int       `json:"id"`
	GroupID   int       `json:"group_id"`
	SenderID  int       `json:"sender_id"`
	Sender    string    `json:"sender"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"created_at"`
}

func (db *DB) InsertGroupMessage(msg GroupMessage) error {
	_, err := db.Db.Exec(`INSERT INTO group_messages (group_id, sender_id, sender, text, created_at) VALUES (?, ?, ?, ?, ?)`,
		msg.GroupID, msg.SenderID, msg.Sender, msg.Text, msg.CreatedAt)
	return err
}

func (db *DB) GetGroupMessages(groupID int, limit int) ([]GroupMessage, error) {
	rows, err := db.Db.Query(`SELECT id, group_id, sender_id, sender, text, created_at FROM group_messages WHERE group_id = ? ORDER BY created_at DESC LIMIT ?`, groupID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []GroupMessage
	for rows.Next() {
		var msg GroupMessage
		if err := rows.Scan(&msg.ID, &msg.GroupID, &msg.SenderID, &msg.Sender, &msg.Text, &msg.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, nil
}
