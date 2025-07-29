package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"social-network/pkg/models"
)

// handle group creation and listing
func GroupsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		// Create group
		userID, ok := r.Context().Value("userID").(int)
		if !ok || userID == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		var request struct {
			Title       string `json:"title"`
			Description string `json:"description"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if request.Title == "" || request.Description == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Title and description are required"})
			return
		}

		groupID, err := models.Db.CreateGroup(request.Title, request.Description, userID)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		// Add creator as member with 'creator' status
		err = models.Db.AddGroupMember(groupID, userID, "creator")
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to add creator to group"})
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{"group_id": groupID})
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

// group invitations
func GroupInviteHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		userID, ok := r.Context().Value("userID").(int)
		if !ok || userID == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		var request struct {
			GroupID int   `json:"group_id"`
			UserIDs []int `json:"user_ids"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Check if user is a member of the group
		status, err := models.Db.GetUserGroupStatus(request.GroupID, userID)
		if err != nil || status == "" {
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": "You are not a member of this group"})
			return
		}

		// Send invitations
		for _, invitedUserID := range request.UserIDs {
			// Check if user is already in the group
			existingStatus, _ := models.Db.GetUserGroupStatus(request.GroupID, invitedUserID)
			if existingStatus == "" {
				models.Db.AddGroupMember(request.GroupID, invitedUserID, "invited")
			}
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invitations sent successfully"})
		return
	}

	if r.Method == http.MethodGet {
		userID, ok := r.Context().Value("userID").(int)
		if !ok || userID == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		groupIDStr := r.URL.Query().Get("group_id")
		search := r.URL.Query().Get("search")
		offsetStr := r.URL.Query().Get("offset")

		groupID, _ := strconv.Atoi(groupIDStr)
		offset, _ := strconv.Atoi(offsetStr)

		users, err := models.Db.GetUsersForGroupInvitation(strconv.Itoa(groupID), search, offset)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"users": users})
		return
	}

	w.WriteHeader(http.StatusMethodNotAllowed)
}

// group join requests
func GroupRequestHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		userID, ok := r.Context().Value("userID").(int)
		if !ok || userID == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		var request struct {
			GroupID int `json:"group_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Check if user is already in the group
		status, err := models.Db.GetUserGroupStatus(request.GroupID, userID)
		if err == nil && status != "" {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]string{"error": "You are already a member of this group"})
			return
		}

		// Add join request
		err = models.Db.AddGroupMember(request.GroupID, userID, "pending")
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Join request sent successfully"})
		return
	}

	if r.Method == http.MethodPut {
		userID, ok := r.Context().Value("userID").(int)
		if !ok || userID == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		var request struct {
			MemberID int    `json:"member_id"`
			Action   string `json:"action"` // "approve" or "reject"
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Get the group ID from the member ID
		groupID, err := models.Db.GetGroupIDFromMember(request.MemberID)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		// Check if user is the creator of the group
		creatorID, err := models.Db.GetGroupCreator(groupID)
		if err != nil || creatorID != userID {
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": "Only the group creator can approve/reject requests"})
			return
		}

		if request.Action == "approve" {
			err = models.Db.ApproveJoinRequest(request.MemberID)
		} else if request.Action == "reject" {
			err = models.Db.RemoveGroupMemberById(request.MemberID)
		} else {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid action"})
			return
		}

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Request " + request.Action + "d successfully"})
		return
	}

	w.WriteHeader(http.StatusMethodNotAllowed)
}

// group events
func GroupEventsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		userID, ok := r.Context().Value("userID").(int)
		if !ok || userID == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		var request struct {
			GroupID     int    `json:"group_id"`
			Title       string `json:"title"`
			Description string `json:"description"`
			EventDate   string `json:"event_date"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Check if user is a member of the group
		status, err := models.Db.GetUserGroupStatus(request.GroupID, userID)
		if err != nil || status == "" {
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": "You are not a member of this group"})
			return
		}

		eventID, err := models.Db.CreateGroupEvent(request.GroupID, userID, request.Title, request.Description, request.EventDate)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{"event_id": eventID})
		return
	}

	if r.Method == http.MethodGet {
		userID, ok := r.Context().Value("userID").(int)
		if !ok || userID == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		groupIDStr := r.URL.Query().Get("group_id")
		groupID, _ := strconv.Atoi(groupIDStr)

		// Check if user is a member of the group
		status, err := models.Db.GetUserGroupStatus(groupID, userID)
		if err != nil || status == "" {
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": "You are not a member of this group"})
			return
		}

		events, err := models.Db.GetGroupEvents(groupID)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"events": events})
		return
	}

	w.WriteHeader(http.StatusMethodNotAllowed)
}

// event responses (going/not going)
func EventResponseHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		userID, ok := r.Context().Value("userID").(int)
		if !ok || userID == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		var request struct {
			EventID  int    `json:"event_id"`
			Response string `json:"response"` // "going" or "not_going"
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if request.Response != "going" && request.Response != "not_going" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Response must be 'going' or 'not_going'"})
			return
		}

		err := models.Db.AddEventResponse(request.EventID, userID, request.Response)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Response recorded successfully"})
		return
	}

	w.WriteHeader(http.StatusMethodNotAllowed)
}

// getting individual group details
func GroupDetailHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// Extract group ID from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	var groupID int
	var err error

	// Find the group ID in the path
	for i, part := range pathParts {
		if part == "groups" && i+1 < len(pathParts) {
			groupID, err = strconv.Atoi(pathParts[i+1])
			break
		}
	}

	if err != nil || groupID == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Check if user is a member of the group
	status, err := models.Db.GetUserGroupStatus(groupID, userID)
	if err != nil || status == "" {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "You are not a member of this group"})
		return
	}

	group, err := models.Db.GetGroup(groupID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"group": group,
	})
}

// getting pending join requests for a group
func GroupRequestsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// Extract group ID from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	var groupID int
	var err error

	// Find the group ID in the path
	for i, part := range pathParts {
		if part == "groups" && i+1 < len(pathParts) {
			groupID, err = strconv.Atoi(pathParts[i+1])
			break
		}
	}

	if err != nil || groupID == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Check if user is the creator of the group
	creatorID, err := models.Db.GetGroupCreator(groupID)
	if err != nil || creatorID != userID {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Only the group creator can view requests"})
		return
	}

	requests, err := models.Db.GetPendingRequests(groupID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"requests": requests,
	})
}
