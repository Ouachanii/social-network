package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"social-network/pkg/models"
	"social-network/pkg/tools"
)

type GroupChatMessageRequest struct {
	GroupID int    `json:"group_id"`
	Text    string `json:"text"`
}

type GroupChatMessageResponse struct {
	ID        int       `json:"id"`
	GroupID   int       `json:"group_id"`
	SenderID  int       `json:"sender_id"`
	Sender    string    `json:"sender"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"created_at"`
}

func PostGroupMessage(w http.ResponseWriter, r *http.Request) {
	user, _, err := tools.GetUserFromRequest(r)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req GroupChatMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Verify group membership
	isMember, err := models.Db.IsUserGroupMember(user.ID, req.GroupID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "Failed to verify group membership")
		return
	}
	if !isMember {
		tools.ErrorJSONResponse(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	msg := models.GroupMessage{
		GroupID:   req.GroupID,
		SenderID:  user.ID,
		Sender:    user.Nickname.String,
		Text:      req.Text,
		CreatedAt: time.Now(),
	}
	if err := models.Db.InsertGroupMessage(msg); err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "Failed to save message")
		return
	}
	tools.JSONResponse(w, http.StatusOK, msg)
}

func GetGroupMessages(w http.ResponseWriter, r *http.Request) {
	user, _, err := tools.GetUserFromRequest(r)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	groupID, err := strconv.Atoi(r.URL.Query().Get("group_id"))
	if err != nil || groupID <= 0 {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	isMember, err := models.Db.IsUserGroupMember(user.ID, groupID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "Failed to verify group membership")
		return
	}
	if !isMember {
		tools.ErrorJSONResponse(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || limit <= 0 {
		limit = 50
	}

	msgs, err := models.Db.GetGroupMessages(groupID, limit)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(msgs); err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "Failed to encode messages")
		return
	}
}
