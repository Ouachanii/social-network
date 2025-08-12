package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"social-network/pkg/models"
)

func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method not allowed"})
		return
	}

	viewerID, ok := r.Context().Value("userID").(int)
	if !ok || viewerID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	// Extract profile user ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	var profileUserID int
	var err error

	if len(pathParts) > 3 && pathParts[3] != "" {
		profileUserID, err = strconv.Atoi(pathParts[3])
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
			return
		}
	} else {
		// If no ID is provided, default to the logged-in user
		profileUserID = viewerID
	}

	// Fetch the profile user's data
	user, err := models.Db.GetUserByID(profileUserID)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "User not found"})
		return
	}

	// Determine follow status
	followStatus, err := models.Db.GetFollowStatus(viewerID, profileUserID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to get follow status"})
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
		json.NewEncoder(w).Encode(limitedProfileData)
		return
	}

	// If profile is viewable, fetch all data
	posts, err := models.Db.GetPostsByUserID(profileUserID, 0)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch user posts"})
		return
	}

	// Get total posts count
	postsCount, err := models.Db.GetUserPostCount(profileUserID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch posts count"})
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
		"posts_count":   postsCount,
		"is_public":     user.IsPublic,
		"is_owner":      isOwner,
		"follow_status": followStatus,
		"is_private":    false,
	}

	json.NewEncoder(w).Encode(profileData)
}
