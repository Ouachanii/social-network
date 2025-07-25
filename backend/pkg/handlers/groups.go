package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"social-network/pkg/models"
)

// GroupsHandler handles group creation and listing
func GroupsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		// TODO: Create group logic
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Group created (stub)"))
		return
	}
	if r.Method == http.MethodGet {
		userID, ok := r.Context().Value("userID").(int)
		if !ok || userID == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		offsetStr := r.URL.Query().Get("offset")
		offset, _ := strconv.Atoi(offsetStr)
		groups, err := models.Db.GetGroups(userID, offset)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"groups": groups})
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
