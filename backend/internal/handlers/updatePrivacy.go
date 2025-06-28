package handlers

import (
	"net/http"
	"social-network/internal/models"
	"social-network/internal/tools"
)

type UpdatePrivacyResponse struct {
	Message string `json:"message"`
}

func UpdatePrivacy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	id := r.Context().Value("userID").(int)

	err := models.Db.UpdatePrivacy(id)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var apiResponse = UpdatePrivacyResponse{
		Message: "update the privacy successfully",
	}

	tools.JSONResponse(w, http.StatusOK, apiResponse)
}
