package tools

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"social-network/pkg/models"

	"github.com/golang-jwt/jwt"
)

func GenerateJWTToken(userId int, userEmail string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":        userId,
		"user-name": userEmail,
		"exp":       time.Now().Add(200 * 365 * 24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(SecretKey)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

func CheckIsTokenValid(tokenString string) (int, error) {
	if tokenString == "" {
		return 0, errors.New("missing authorization header")
	}
	// fmt.Println(tokenString)
	if len(tokenString) >= len("Bearer ") {
		tokenString = tokenString[len("Bearer "):]
	} else {
		return 0, errors.New("unauthorized")
	}
	// fmt.Println(tokenString)

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return 0, errors.New("invalid signin methode: " + token.Header["alg"].(string))
		}
		return SecretKey, nil
	})
	if err != nil {
		fmt.Println(err)
		return 0, errors.New("unauthorized")
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		if idFloat, ok := claims["id"].(float64); ok {
			return int(idFloat), nil
		}
		return 0, errors.New("unauthorized: ivalid id in token")
	}

	return 0, errors.New("unauthorized: invalid token")
}

func ValidateToken(tokenString string) (*models.User, bool, error) {
	if tokenString == "" {
		return nil, false, errors.New("empty token")
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return SecretKey, nil
	})
	if err != nil {
		return nil, false, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, ok := claims["id"].(float64)
		if !ok {
			return nil, false, errors.New("invalid user ID in token")
		}

		userName, ok := claims["user-name"].(string)
		if !ok {
			return nil, false, errors.New("invalid username in token")
		}

		user := &models.User{
			ID:       int(userID),
			Nickname: sql.NullString{String: userName, Valid: true},
		}

		return user, true, nil
	}

	return nil, false, errors.New("invalid token")
}
