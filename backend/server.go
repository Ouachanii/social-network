package main

import (
	"fmt"
	"net/http"

	"social-network/pkg/db/sqlite"
	"social-network/pkg/handlers"
	"social-network/pkg/models"
)

func init() {
	db := sqlite.CreateAllTables()
	models.Db = models.InitializeDb(db)
}

func main() {
	fmt.Println("server started at: http://localhost:8080")

	http.HandleFunc("/api/register", handlers.HandleCORS(handlers.Register))
	http.HandleFunc("/api/login", handlers.HandleCORS(handlers.Login))
	http.HandleFunc("/api/logout", handlers.HandleCORS(handlers.TokenMiddleware(handlers.Logout)))

	http.HandleFunc("/api/privacy/update", handlers.HandleCORS(handlers.TokenMiddleware(handlers.UpdatePrivacy)))
	http.HandleFunc("/api/follow/{userID}", handlers.HandleCORS(handlers.TokenMiddleware(handlers.FollowUser))) // 1-need send notification func with ws | 2- need handling this cases: *when user follow himself  *when user follow a user already follower (follow the same follower 2 times)
	http.HandleFunc("/api/followResponse", handlers.HandleCORS(handlers.TokenMiddleware(handlers.FollowResponse)))

	http.HandleFunc("/api/posts", handlers.HandleCORS(handlers.TokenMiddleware(handlers.PostsHandler)))
	http.HandleFunc("/api/upload/avatar", handlers.HandleCORS(handlers.TokenMiddleware(handlers.UploadAvatar)))
	http.HandleFunc("/api/upload/post-image", handlers.HandleCORS(handlers.TokenMiddleware(handlers.UploadPostImage)))

	hub := handlers.NewHub()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandleWebSocket(hub, w, r)
	})

	http.HandleFunc("/api/groups", handlers.HandleCORS(handlers.TokenMiddleware(handlers.GroupsHandler)))
	http.HandleFunc("/api/groups/invite", handlers.HandleCORS(handlers.TokenMiddleware(handlers.GroupInviteHandler)))
	http.HandleFunc("/api/groups/request", handlers.HandleCORS(handlers.TokenMiddleware(handlers.GroupRequestHandler)))
	http.HandleFunc("/api/groups/events", handlers.HandleCORS(handlers.TokenMiddleware(handlers.GroupEventsHandler)))

	http.HandleFunc("/api/notifications", handlers.HandleCORS(handlers.TokenMiddleware(handlers.NotificationsHandler)))

	http.HandleFunc("/", handlers.HomeHandler)
	// http.HandleFunc("/", handlers.HomeHandler)

	http.ListenAndServe(":8080", nil)
}
