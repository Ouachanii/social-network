package handlers

import (
	"net/http"

	"github.com/gorilla/websocket"
)

// HandleWebSocket handles WebSocket connections for chat/notifications
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer conn.Close()
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		// Echo message for now
		conn.WriteMessage(websocket.TextMessage, msg)
	}
}
