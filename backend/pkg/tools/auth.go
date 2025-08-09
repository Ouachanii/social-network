package tools

import (
	"net/http"
	"strings"

	"social-network/pkg/models"
)

// GetUserFromRequest extracts the user from the Authorization header (JWT)
func GetUserFromRequest(r *http.Request) (*models.User, int, error) {
	token := r.Header.Get("Authorization")
	if token == "" {
		return nil, http.StatusUnauthorized, http.ErrNoCookie
	}
	if strings.HasPrefix(token, "Bearer ") {
		token = token[len("Bearer "):]
	}
	userID, err := CheckIsTokenValid(token)
	if err != nil {
		return nil, http.StatusUnauthorized, err
	}
	user, err := models.Db.GetUserByID(userID)
	if err != nil {
		return nil, http.StatusUnauthorized, err
	}
	return user, http.StatusOK, nil
}
