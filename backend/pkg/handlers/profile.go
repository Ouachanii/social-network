package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/pkg/models"
	"strconv"
	"strings"
)

func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	viewerID, ok := r.Context().Value("userID").(int)
	if !ok || viewerID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract profile user ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	var profileUserID int
	var err error

	if len(pathParts) > 3 && pathParts[3] != "" {
		profileUserID, err = strconv.Atoi(pathParts[3])
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}
	} else {
		// If no ID is provided, default to the logged-in user
		profileUserID = viewerID
	}

	// Fetch the profile user's data
	user, err := models.Db.GetUserByID(profileUserID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Determine follow status
	followStatus, err := models.Db.GetFollowStatus(viewerID, profileUserID)
	if err != nil {
		http.Error(w, "Failed to get follow status", http.StatusInternalServerError)
		return
	}

	// Privacy Check
	isOwner := viewerID == profileUserID
	canViewProfile := user.IsPublic || isOwner || followStatus == "approved"

	if !canViewProfile {
		// If profile is private and not followed, return limited data
		limitedProfileData := map[string]interface{}{
			"first_name":    user.Firstname,
			"last_name":     user.Lastname,
			"avatar":        user.Avatar,
			"is_private":    true,
			"follow_status": followStatus,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(limitedProfileData)
		return
	}

	// If profile is viewable, fetch all data
	posts, err := models.Db.GetPostsByUserID(profileUserID, 0)
	if err != nil {
		http.Error(w, "Failed to fetch user posts", http.StatusInternalServerError)
		return
	}

	profileData := map[string]interface{}{
		"id":            user.ID,
		"first_name":    user.Firstname,
		"last_name":     user.Lastname,
		"nickname":      user.Nickname,
		"email":         user.Email,
		"date_of_birth": user.DateOfBirth,
		"about_me":      user.AboutMe,
		"avatar":        user.Avatar,
		"posts":         posts,
		"is_public":     user.IsPublic,
		"is_owner":      isOwner,
		"follow_status": followStatus,
		"is_private":    false,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profileData)
}
