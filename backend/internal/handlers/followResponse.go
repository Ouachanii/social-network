package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"social-network/internal/models"
	"social-network/internal/tools"
)

type followResponseResponse struct {
	Message string `json:"message"`
}

func FollowResponse(w http.ResponseWriter, r *http.Request) {
	var status string
	var notify models.Notification

	err := json.NewDecoder(r.Body).Decode(&notify)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if notify.ReceiverId != r.Context().Value("userID").(int) {
		fmt.Println(notify.ReceiverId, r.Context().Value("userID").(int))
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "wrong request: the receiver it's not you")
		return
	}

	status, err = models.Db.GetFollowStatus(notify.SenderId, notify.ReceiverId)
	if err != nil {
		fmt.Println(err)
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if status != "pending" {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "wrong request: this follow request didn't exist")
		return
	}

	if r.Method == http.MethodPatch {
		status = "approved"

		err = models.Db.ApproveFollowRequest(notify.RelatedId)
		if err != nil {
			fmt.Println(err)
			tools.ErrorJSONResponse(w, http.StatusInternalServerError, "internal server error")
			return
		}

	} else if r.Method == http.MethodDelete {
		status = "refused"

		err = models.Db.DeleteFollowRequest(notify.RelatedId)
		if err != nil {
			fmt.Println(err)
			tools.ErrorJSONResponse(w, http.StatusInternalServerError, "internal server error")
			return
		}
	} else {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "method not allowed")
		return
	}

	var apiResponse = followResponseResponse{
		Message: fmt.Sprintf("this follow request %v", status),
	}

	tools.JSONResponse(w, http.StatusOK, apiResponse)

}
