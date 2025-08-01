package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"social-network/pkg/models"
)

// NotificationsHandler handles notifications
func NotificationsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	notifications, err := models.Db.GetNotifications(userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"notifications": notifications,
	})
}

func MarkNotificationAsReadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		NotificationID int `json:"notification_id"`
	}
	err := json.NewDecoder(r.Body).Decode(&req)
	// fmt.Println("MarkNotificationAsReadHandler called", err)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid notification_id"})
		return
	}
	fmt.Println("Marking notification as read:", req.NotificationID)

	if err := models.Db.MarkNotificationAsRead(req.NotificationID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}
