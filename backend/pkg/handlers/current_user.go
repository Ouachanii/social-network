package handlers

import (
	"encoding/json"
	"net/http"

	"social-network/pkg/models"
)

func CurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method not allowed"})
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	user, err := models.Db.GetUserByID(userID)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "User not found"})
		return
	}

	userData := map[string]interface{}{
		"id":            user.ID,
		"first_name":    user.Firstname,
		"last_name":     user.Lastname,
		"nickname":      user.Nickname.String,
		"email":         user.Email,
		"date_of_birth": user.DateOfBirth,
		"about_me":      user.AboutMe,
		"avatar":        user.Avatar,
		"is_public":     user.IsPublic,
	}

	json.NewEncoder(w).Encode(userData)
}
