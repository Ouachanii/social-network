package tools

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"
)

func ValidateAndFormatDate(inputDate string) (string, error) {
	parsedTime, err := time.Parse("2006-01-02T15:04", inputDate)
	if err != nil {
		return "", err
	}

	if parsedTime.Before(time.Now()) {
		return "", errors.New("the event date cannot be in the past")
	}

	return parsedTime.Format("2006-01-02 15:04:05"), nil
}

func GetOptionalString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

// Allowed post image formats (JPEG, PNG & GIF)
func IsValidPostImageExtension(ext string) bool {
	allowed := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
	}
	return allowed[strings.ToLower(ext)]
}

func JSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	err := json.NewEncoder(w).Encode(data)
	if err != nil {
		// fallback error if encoding fails
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}

func ErrorJSONResponse(w http.ResponseWriter, statusCode int, message string) {
	w.WriteHeader(statusCode)
	var errResponse = ErrorApi{
		ErrorMessage: message,
		ErrorCode:    statusCode,
	}
	err := json.NewEncoder(w).Encode(errResponse)
	if err != nil {
		// fallback error if encoding fails
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
	}
}
