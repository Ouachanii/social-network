package handlers

import (
	"net/http"
	"social-network/pkg/models"
	"social-network/pkg/tools"
	"strconv"
	"strings"
)

// GetAvailableUsersToFollowHandler returns users that the current user can follow
func GetAvailableUsersToFollowHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value("userID").(int)

	users, err := models.Db.GetAvailableUsersToFollow(userID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "failed to get available users")
		return
	}

	tools.JSONResponse(w, http.StatusOK, users)
}

// GetFriendsCountsHandler returns the count of followers and following for a user
func GetFriendsCountsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value("userID").(int)

	followersCount, err := models.Db.GetFollowersCount(userID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "failed to get followers count")
		return
	}

	followingCount, err := models.Db.GetFollowingCount(userID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "failed to get following count")
		return
	}

	response := map[string]int{
		"followers": followersCount,
		"following": followingCount,
	}

	tools.JSONResponse(w, http.StatusOK, response)
}

// GetFollowersHandler returns the list of followers for a user
func GetFollowersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value("userID").(int)

	followers, err := models.Db.GetFollowersWithDetails(userID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "failed to get followers")
		return
	}

	tools.JSONResponse(w, http.StatusOK, followers)
}

// GetFollowingHandler returns the list of users that a user is following
func GetFollowingHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value("userID").(int)

	following, err := models.Db.GetFollowingWithDetails(userID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "failed to get following")
		return
	}

	tools.JSONResponse(w, http.StatusOK, following)
}

// GetAllUsersHandler returns all users (existing function)
func GetAllUsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	users, err := models.Db.GetAllUsers()
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "failed to get users")
		return
	}

	tools.JSONResponse(w, http.StatusOK, users)
}

// GetUserProfileHandler returns a specific user's profile
func GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	// Extract user ID from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	userIDStr := pathParts[len(pathParts)-1]
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	currentUserID := r.Context().Value("userID").(int)

	// Get user profile
	user, err := models.Db.GetUserInfo(userID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusNotFound, "user not found")
		return
	}

	// Check if profile is private and current user is not following
	if !user.IsPublic {
		isFollowing, err := models.Db.GetFollowStatus(currentUserID, userID)
		if err != nil {
			tools.ErrorJSONResponse(w, http.StatusInternalServerError, "failed to check follow status")
			return
		}
		if isFollowing != "approved" && currentUserID != userID {
			tools.ErrorJSONResponse(w, http.StatusForbidden, "profile is private")
			return
		}
	}

	tools.JSONResponse(w, http.StatusOK, user)
}

// GetUserFriendsCountsHandler returns the count of followers and following for a specific user
func GetUserFriendsCountsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	userIDStr := pathParts[len(pathParts)-1]
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	followersCount, err := models.Db.GetFollowersCount(userID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "failed to get followers count")
		return
	}

	followingCount, err := models.Db.GetFollowingCount(userID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "failed to get following count")
		return
	}

	response := map[string]int{
		"followers": followersCount,
		"following": followingCount,
	}

	tools.JSONResponse(w, http.StatusOK, response)
}

// GetUserFollowersHandler returns the list of followers for a specific user
func GetUserFollowersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	userIDStr := pathParts[len(pathParts)-1]
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	followers, err := models.Db.GetFollowersWithDetails(userID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "failed to get followers")
		return
	}

	tools.JSONResponse(w, http.StatusOK, followers)
}

// GetUserFollowingHandler returns the list of users that a specific user is following
func GetUserFollowingHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	userIDStr := pathParts[len(pathParts)-1]
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	following, err := models.Db.GetFollowingWithDetails(userID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "failed to get following")
		return
	}

	tools.JSONResponse(w, http.StatusOK, following)
}
