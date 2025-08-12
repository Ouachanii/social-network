package handlers

import (
	"net/http"
	"strconv"

	"social-network/pkg/models"
	"social-network/pkg/tools"
)

type FollowUserResponse struct {
	Message string              `json:"message"`
	Noitfy  models.Notification `json:"notification"`
}

func FollowUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	followerID := r.Context().Value("userID").(int)

	followingID, err := strconv.Atoi(r.PathValue("userID"))
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "expected user id")
		return
	}

	// Check if user is trying to follow themselves
	if followerID == followingID {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "you cannot follow yourself")
		return
	}

	// Check if already following or request pending
	existingStatus, err := models.Db.GetFollowStatus(followerID, followingID)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if existingStatus == "approved" {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "you are already following this user")
		return
	}

	if existingStatus == "pending" {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "follow request already sent")
		return
	}

	isPublic, err := models.Db.CheckIfPublicProfil(followingID)
	if err != nil {
		if err.Error() == "this user not exist" {
			tools.ErrorJSONResponse(w, http.StatusBadRequest, "this user id not exist")
			return
		}
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}

	apiResponse := FollowUserResponse{
		Message: "you're following this user",
	}

	followStatus := "approved"
	followType := "new follower"
	if !isPublic {
		followStatus = "pending"
		followType = "follow request"
		apiResponse.Message = "follow request sent"
	}

	relatedId, err := models.Db.InsertFollowRequest(followerID, followingID, followStatus)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}

	notification := models.Notification{
		RelatedId:  int(relatedId),
		Type:       followType,
		SenderId:   followerID,
		ReceiverId: followingID,
	}

	notification, err = models.Db.InsertNotification(&notification)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}

	apiResponse.Noitfy = notification

	// Note: WebSocket notification will be handled by the client
	// when they fetch notifications or through polling

	tools.JSONResponse(w, http.StatusOK, apiResponse)
}
