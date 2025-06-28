package handlers

import (
	"fmt"
	"net/http"
	"social-network/internal/models"
	"social-network/internal/tools"
	"strconv"
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

	isPublic, err := models.Db.CheckIfPublicProfil(followingID)
	if err != nil {
		if err.Error() == "this user not exist" {
			tools.ErrorJSONResponse(w, http.StatusBadRequest, "this user id not exist")
			return
		}
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var apiResponse = FollowUserResponse{
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

	var notification = models.Notification{
		RelatedId: int(relatedId),
		Type:      followType,
		SenderId:  followerID,
		ReceiverId: followingID,
	}

	fmt.Println(notification)

	notification, err = models.Db.InsertNotification(&notification)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}

	apiResponse.Noitfy = notification
	tools.JSONResponse(w, http.StatusOK, apiResponse)
}
