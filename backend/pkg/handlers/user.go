package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/pkg/models"
)

func GetUser(w http.ResponseWriter, r *http.Request) {
	// The user ID should be available in the request context after token middleware validation
	userID := r.Context().Value("userID").(int)

	user, err := models.GetUserByID(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// We don't want to send the password hash to the client
	user.Password = ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
