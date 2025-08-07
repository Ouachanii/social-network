package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Message struct {
	Type           string   `json:"type"` // "messageuser", "messageGroup", "notification"
	Sender         string   `json:"sender"`
	Receivers      []string `json:"receiver"`
	Content        string   `json:"content"`
	Groupid        int      `json:"groupid"`
	Notificationid int      `json:"notificationid"`
	Offset         int      `json:"offset"`
	Timestamp      string   `json:"timestamp"`
}
type Connection struct {
	Conn   *websocket.Conn
	UserID string
}

type Hub struct {
	userConnections map[string]map[*websocket.Conn]bool
	messageChan     chan Message
	register        chan *Connection
	unregister      chan *Connection
	mu              sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		userConnections: make(map[string]map[*websocket.Conn]bool),
		messageChan:     make(chan Message),
		register:        make(chan *Connection),
		unregister:      make(chan *Connection),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case conn := <-h.register:
			h.mu.Lock()
			if h.userConnections[conn.UserID] == nil {
				h.userConnections[conn.UserID] = make(map[*websocket.Conn]bool)
			}
			h.userConnections[conn.UserID][conn.Conn] = true
			h.mu.Unlock()

		case conn := <-h.unregister:
			h.mu.Lock()
			delete(h.userConnections[conn.UserID], conn.Conn)
			if conns, ok := h.userConnections[conn.UserID]; ok {
				delete(conns, conn.Conn)
				if len(conns) == 0 {
					delete(h.userConnections, conn.UserID)
				}
			}
			h.mu.Unlock()

		case msg := <-h.messageChan:
			h.dispatchMessage(msg)
		}
	}
}

func (h *Hub) dispatchMessage(msg Message) {
	h.mu.Lock()
	defer h.mu.Unlock()

	msg.Timestamp = time.Now().Format("2006-01-02 15:04:05")

	switch msg.Type {
	case "messageuser", "notification":
		if len(msg.Receivers) == 0 {
			return
		}
		receiverID := msg.Receivers[0]
		if conns, ok := h.userConnections[receiverID]; ok {
			for conn := range conns {
				conn.WriteJSON(msg)
			}
		}
	case "messageGroup":
		for _, receiverID := range msg.Receivers {
			if conns, ok := h.userConnections[receiverID]; ok {
				for conn := range conns {
					conn.WriteJSON(msg)
				}
			}
		}
	default:
		log.Println("Unknown message type:", msg.Type)
	}
}

func HandleWebSocket(h *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Failed to upgrade connection", http.StatusInternalServerError)
		return
	}

	userID := r.URL.Query().Get("userid")
	if userID == "" {
		userID = "guest" // fallback for demo
	}

	client := &Connection{
		Conn:   conn,
		UserID: userID,
	}

	h.register <- client
	defer func() {
		h.unregister <- client
		conn.Close()
	}()

	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var msg Message
		if err := json.Unmarshal(data, &msg); err != nil {
			conn.WriteJSON(map[string]string{
				"type":    "error",
				"content": "Invalid message format",
			})
			continue
		}

		h.messageChan <- msg
	}
}
