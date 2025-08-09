package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/websocket"

	"social-network/pkg/models"
	"social-network/pkg/tools"
)

var groupChatUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type wsGroupMessage struct {
	GroupID int    `json:"group_id"`
	Text    string `json:"text"`
	Sender  string `json:"sender"`
	Time    string `json:"time"`
}

var (
	groupClients   = make(map[int]map[*websocket.Conn]bool) // groupID -> set of connections
	groupBroadcast = make(chan wsGroupMessage)
)

type authMessage struct {
	Type  string `json:"type"`
	Token string `json:"token"`
}

func GroupChatWebSocket(w http.ResponseWriter, r *http.Request) {
	groupID, err := strconv.Atoi(r.URL.Query().Get("group_id"))
	if err != nil || groupID <= 0 {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	conn, err := groupChatUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	var user *models.User

	_, msgBytes, err := conn.ReadMessage()
	if err != nil {
		conn.Close()
		return
	}

	var authMsg authMessage
	if err := json.Unmarshal(msgBytes, &authMsg); err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Invalid auth message format"))
		conn.Close()
		return
	}

	if authMsg.Type != "auth" || authMsg.Token == "" {
		conn.WriteMessage(websocket.TextMessage, []byte("Missing authentication"))
		conn.Close()
		return
	}

	validatedUser, valid, err := tools.ValidateToken(authMsg.Token)
	if err != nil || !valid {
		conn.WriteMessage(websocket.TextMessage, []byte("Invalid token"))
		conn.Close()
		return
	}

	isMember, err := models.Db.IsUserGroupMember(validatedUser.ID, groupID)
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Failed to verify group membership"))
		conn.Close()
		return
	}
	if !isMember {
		conn.WriteMessage(websocket.TextMessage, []byte("Not a member of this group"))
		conn.Close()
		return
	}

	user = validatedUser

	if groupClients[groupID] == nil {
		groupClients[groupID] = make(map[*websocket.Conn]bool)
	}
	groupClients[groupID][conn] = true

	conn.WriteMessage(websocket.TextMessage, []byte("authenticated"))

	go func() {
		for {
			_, msgBytes, err := conn.ReadMessage()
			if err != nil {
				delete(groupClients[groupID], conn)
				conn.Close()
				if len(groupClients[groupID]) == 0 {
					delete(groupClients, groupID)
				}
				break
			}

			var msg wsGroupMessage
			if err := json.Unmarshal(msgBytes, &msg); err != nil {
				continue
			}

			if msg.GroupID != groupID {
				continue
			}

			msg.Time = time.Now().Format("15:04:05")
			msg.Sender = user.Nickname.String

			err = models.Db.InsertGroupMessage(models.GroupMessage{
				GroupID:   msg.GroupID,
				SenderID:  user.ID,
				Sender:    user.Nickname.String,
				Text:      msg.Text,
				CreatedAt: time.Now(),
			})
			if err != nil {
				println("Error storing message:", err.Error())
			}

			groupBroadcast <- msg
		}
	}()
}

func runGroupChatHub() {
	for {
		msg := <-groupBroadcast
		conns := make([]*websocket.Conn, 0, len(groupClients[msg.GroupID]))
		for conn := range groupClients[msg.GroupID] {
			conns = append(conns, conn)
		}

		for _, conn := range conns {
			err := conn.WriteJSON(msg)
			if err != nil {
				delete(groupClients[msg.GroupID], conn)
				conn.Close()
				if len(groupClients[msg.GroupID]) == 0 {
					delete(groupClients, msg.GroupID)
				}
			}
		}
	}
}

func InitGroupChatHub() {
	go runGroupChatHub()
}
