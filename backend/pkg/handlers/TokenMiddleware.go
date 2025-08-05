package handlers

import (
	"context"
	"net/http"
	"social-network/pkg/tools"
)

type ErrorMiddlewareResponse struct {
	Error string `json:"error"`
}

func TokenMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		token := r.Header.Get("Authorization")
		// fmt.Println(tools.SecretKey)
		id, err := tools.CheckIsTokenValid(token)
		if err != nil {
			tools.ErrorJSONResponse(w, http.StatusUnauthorized, err.Error())
			return
		}

		ctx := context.WithValue(r.Context(), "userID", id)
		next(w, r.WithContext(ctx))
	}
}

func TokenMiddlewareHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		token := r.Header.Get("Authorization")
		id, err := tools.CheckIsTokenValid(token)
		if err != nil {
			tools.ErrorJSONResponse(w, http.StatusUnauthorized, err.Error())
			return
		}

		ctx := context.WithValue(r.Context(), "userID", id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
