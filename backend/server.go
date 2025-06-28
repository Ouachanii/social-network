package main

import (
	"fmt"
	"net/http"
	"social-network/internal/db/sqlite"
	"social-network/internal/handlers"
	"social-network/internal/models"
)

func init() {
	db := sqlite.CreateAllTables()
	models.Db = models.InitializeDb(db)
}

func main() {
	fmt.Println("00000")
	port := ":8080"
	fmt.Println("http://localhost" + port)
	http.HandleFunc("/api/register", handlers.HandleCORS(handlers.Register))
	http.HandleFunc("/api/login", handlers.HandleCORS(handlers.Login))
	http.HandleFunc("/api/logout", handlers.HandleCORS(handlers.TokenMiddleware(handlers.Logout)))

	http.HandleFunc("/api/privacy/update", handlers.HandleCORS(handlers.TokenMiddleware(handlers.UpdatePrivacy)))
	http.HandleFunc("/api/follow/{userID}", handlers.HandleCORS(handlers.TokenMiddleware(handlers.FollowUser))) // 1-need send notification func with ws | 2- need handling this cases: *when user follow himself  *when user follow a user already follower (follow the same follower 2 times)
	http.HandleFunc("/api/followResponse", handlers.HandleCORS(handlers.TokenMiddleware(handlers.FollowResponse)))

	http.HandleFunc("/api/posts", handlers.HandleCORS(handlers.TokenMiddleware(handlers.CreatePostHandler))) // POST for creating, GET for fetching
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { fmt.Println("this is home path") })

	http.ListenAndServe(":8080", nil)
}
