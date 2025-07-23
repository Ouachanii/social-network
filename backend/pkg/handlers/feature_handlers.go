package handlers

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gorilla/websocket"
)

// UploadAvatar handles avatar image uploads
func UploadAvatar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	file, header, err := r.FormFile("avatar")
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Missing avatar file"))
		return
	}
	defer file.Close()
	filename := header.Filename
	ext := strings.ToLower(filepath.Ext(filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Invalid file type"))
		return
	}
	outPath := filepath.Join("../../uploads/avatars", filename)
	os.MkdirAll(filepath.Dir(outPath), 0o755)
	out, err := os.Create(outPath)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer out.Close()
	io.Copy(out, file)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Avatar uploaded successfully"))
}

// UploadPostImage handles post image uploads
func UploadPostImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	file, header, err := r.FormFile("image")
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Missing image file"))
		return
	}
	defer file.Close()
	filename := header.Filename
	ext := strings.ToLower(filepath.Ext(filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Invalid file type"))
		return
	}
	outPath := filepath.Join("../../uploads/posts", filename)
	os.MkdirAll(filepath.Dir(outPath), 0o755)
	out, err := os.Create(outPath)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer out.Close()
	io.Copy(out, file)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Post image uploaded successfully"))
}

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

// GroupsHandler handles group creation and listing
func GroupsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		// TODO: Create group logic
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Group created (stub)"))
		return
	}
	if r.Method == http.MethodGet {
		// TODO: List groups logic
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("List of groups (stub)"))
		return
	}
	w.WriteHeader(http.StatusMethodNotAllowed)
}

// GroupInviteHandler handles group invitations
func GroupInviteHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement group invitation logic
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Group invite (stub)"))
}

// GroupRequestHandler handles group join requests
func GroupRequestHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement group join request logic
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Group join request (stub)"))
}

// GroupEventsHandler handles group events
func GroupEventsHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement group events logic
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Group events (stub)"))
}

// NotificationsHandler handles notifications
func NotificationsHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: Fetch notifications for user
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Notifications (stub)"))
}
