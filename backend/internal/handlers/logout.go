package handlers

import (
	"net/http"
	"social-network/internal/tools"
)

type LogoutResponse struct {
	Message string `json:"message"`
}

func Logout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:   "JWT_token",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})

	var apiResponse = LogoutResponse{
		Message: "you're logged out",
	}

	tools.JSONResponse(w, http.StatusOK, apiResponse)
}
