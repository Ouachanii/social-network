package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"social-network/internal/tools"
	"time"
)

type LoginRequest struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Message string `json:"message"`
}

func Login(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var LoginInfo LoginRequest
	err := json.NewDecoder(r.Body).Decode(&LoginInfo)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, statusCode, err := tools.CheckLoginInfto(LoginInfo.Login, LoginInfo.Password)
	if err != nil {
		tools.ErrorJSONResponse(w, statusCode, err.Error())
		return
	}

	fmt.Println(user)

	JWTToken, err := tools.CenerateJWTToken(user.ID, user.Nickname)
	if err != nil {
		fmt.Println(err)
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "can't generate a new JWT token, try againe")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "JWT_token",
		Value:    JWTToken,
		HttpOnly: true,
		Secure:   false,
		Path:     "/",
		Expires:  time.Now().Add(200 * 365 * 24 * time.Hour), // Long-lived token
	})

	var apiResponse = LoginResponse{
		Message: "connected successfully",
	}

	tools.JSONResponse(w, http.StatusOK, apiResponse)
}
