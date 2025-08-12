package handlers

import (
	"encoding/json"
	"net/http"
)

func GetMessages(w http.ResponseWriter, r *http.Request) {
	sender := r.URL.Query().Get("sender")
	receiver := r.URL.Query().Get("receiver")

	rows, err := DB.Query(`
        SELECT sender_id, receiver_id, content, timestamp
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY timestamp ASC
    `, sender, receiver, receiver, sender)
	if err != nil {
		http.Error(w, "DB error", 500)
		return
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var m Message
		rows.Scan(&m.Sender, &m.Receivers, &m.Content, &m.Timestamp)
		m.Receivers = []string{m.Receivers[0]} 
		messages = append(messages, m)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}
