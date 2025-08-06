package handlers

import (
	"encoding/json"
	"net/http"
	"sync"

	"social-network/pkg/models"
	"social-network/pkg/tools"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn *websocket.Conn
	User *models.User
}

var (
	clients  = make(map[*Client]bool) // Connected clients
	mutex    sync.Mutex               // Mutex to protect clients map
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
)

type wsAuthMessage struct {
	Type  string `json:"type"`
	Token string `json:"token"`
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Could not upgrade connection", http.StatusInternalServerError)
		return
	}

	_, msgBytes, err := conn.ReadMessage()
	if err != nil {
		conn.Close()
		return
	}

	var authMsg wsAuthMessage
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

	user, valid, err := tools.ValidateToken(authMsg.Token)
	if err != nil || !valid {
		conn.WriteMessage(websocket.TextMessage, []byte("Invalid token"))
		conn.Close()
		return
	}

	client := &Client{
		Conn: conn,
		User: user,
	}

	mutex.Lock()
	clients[client] = true
	mutex.Unlock()

	conn.WriteMessage(websocket.TextMessage, []byte("authenticated"))

	for {
		messageType, msg, err := conn.ReadMessage()
		if err != nil {
			mutex.Lock()
			delete(clients, client)
			mutex.Unlock()
			break
		}

		mutex.Lock()
		for c := range clients {
			err := c.Conn.WriteMessage(messageType, msg)
			if err != nil {
				delete(clients, c)
				c.Conn.Close()
			}
		}
		mutex.Unlock()
	}
}
