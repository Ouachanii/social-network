package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRegister(t *testing.T) {
	// Test case 1: Valid registration
	t.Run("Valid Registration", func(t *testing.T) {
		reqBody := map[string]string{
			"firstName": "John",
			"lastName":  "Doe",
			"email":     "john.doe@example.com",
			"password":  "Password123",
			"birthDate": "1990-01-01",
			"gender":    "male",
			"aboutMe":   "Test user",
			"nickName":  "johndoe",
		}

		jsonBody, _ := json.Marshal(reqBody)
		req := httptest.NewRequest("POST", "/api/register", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		Register(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
	})

	// Test case 2: Invalid email
	t.Run("Invalid Email", func(t *testing.T) {
		reqBody := map[string]string{
			"firstName": "John",
			"lastName":  "Doe",
			"email":     "invalid-email",
			"password":  "Password123",
			"birthDate": "1990-01-01",
			"gender":    "male",
		}

		jsonBody, _ := json.Marshal(reqBody)
		req := httptest.NewRequest("POST", "/api/register", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		Register(w, req)

		if w.Code == http.StatusOK {
			t.Errorf("Expected error status, got 200")
		}
	})

	// Test case 3: Weak password
	t.Run("Weak Password", func(t *testing.T) {
		reqBody := map[string]string{
			"firstName": "John",
			"lastName":  "Doe",
			"email":     "john.doe@example.com",
			"password":  "123",
			"birthDate": "1990-01-01",
			"gender":    "male",
		}

		jsonBody, _ := json.Marshal(reqBody)
		req := httptest.NewRequest("POST", "/api/register", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		Register(w, req)

		if w.Code == http.StatusOK {
			t.Errorf("Expected error status, got 200")
		}
	})
}



