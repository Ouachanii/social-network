package tools

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"social-network/pkg/models"

	"github.com/google/uuid"
)

// store valid tokens with their claims
var activeTokens = make(map[string]*TokenClaims)

// Token signing key
var TokenSigningKey = []byte("your-secret-key")

type TokenClaims struct {
	UserID    int       `json:"id"`
	Username  string    `json:"user-name"`
	ExpiresAt time.Time `json:"exp"`
	TokenID   string    `json:"tid"`
}

// create a new token for a user
func GenerateJWTToken(userId int, userEmail string) (string, error) {
	tokenID := uuid.New().String()
	claims := &TokenClaims{
		UserID:    userId,
		Username:  userEmail,
		ExpiresAt: time.Now().Add(24 * time.Hour),
		TokenID:   tokenID,
	}

	jsonData, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	token := base64.URLEncoding.EncodeToString(jsonData)

	activeTokens[tokenID] = claims

	return token, nil
}

// validate a token and returns the user ID
func CheckIsTokenValid(tokenString string) (int, error) {
	if tokenString == "" {
		return 0, errors.New("missing authorization header")
	}

	// Strip "Bearer " prefix if present
	if len(tokenString) >= len("Bearer ") {
		tokenString = tokenString[len("Bearer "):]
	} else {
		return 0, errors.New("unauthorized")
	}

	claims, err := validateAndGetClaims(tokenString)
	if err != nil {
		return 0, fmt.Errorf("unauthorized: %v", err)
	}

	return claims.UserID, nil
}

// validate a token and returns the associated user
func ValidateToken(tokenString string) (*models.User, bool, error) {
	if tokenString == "" {
		return nil, false, errors.New("empty token")
	}

	// Strip "Bearer " prefix if present
	if len(tokenString) >= len("Bearer ") && tokenString[:len("Bearer ")] == "Bearer " {
		tokenString = tokenString[len("Bearer "):]
	}

	claims, err := validateAndGetClaims(tokenString)
	if err != nil {
		return nil, false, err
	}

	user := &models.User{
		ID:       claims.UserID,
		Nickname: sql.NullString{String: claims.Username, Valid: true},
	}

	return user, true, nil
}

// validate a token and returns its claims
func validateAndGetClaims(tokenString string) (*TokenClaims, error) {
	jsonData, err := base64.URLEncoding.DecodeString(tokenString)
	if err != nil {
		return nil, fmt.Errorf("invalid token format")
	}

	var claims TokenClaims
	if err := json.Unmarshal(jsonData, &claims); err != nil {
		return nil, fmt.Errorf("invalid token data")
	}

	// Check if token exists in active tokens
	storedClaims, exists := activeTokens[claims.TokenID]
	if !exists {
		return nil, fmt.Errorf("token not found or expired")
	}

	if time.Now().After(claims.ExpiresAt) {
		delete(activeTokens, claims.TokenID)
		return nil, fmt.Errorf("token expired")
	}

	return storedClaims, nil
}
