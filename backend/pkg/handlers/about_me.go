package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/pkg/models"
)

type AboutMeRequest struct {
	Text string `json:"about_me"`
}

func UpdateAboutMeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req AboutMeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic validation (e.g., length limit)
	if len(req.Text) > 500 {
		http.Error(w, "About me text exceeds 500 characters", http.StatusBadRequest)
		return
	}

	err := models.Db.UpdateAboutMe(userID, req.Text)
	if err != nil {
		http.Error(w, "Failed to update about me", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "About me updated successfully"})
}
