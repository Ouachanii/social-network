package main

import (
	"fmt"
	"net/http"
	"strings"

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
	http.HandleFunc("/api/user", handlers.HandleCORS(handlers.TokenMiddleware(handlers.GetUser)))

	http.HandleFunc("/api/privacy/update", handlers.HandleCORS(handlers.TokenMiddleware(handlers.UpdatePrivacy)))
	http.HandleFunc("/api/follow/{userID}", handlers.HandleCORS(handlers.TokenMiddleware(handlers.FollowUser))) // 1-need send notification func with ws | 2- need handling this cases: *when user follow himself  *when user follow a user already follower (follow the same follower 2 times)
	http.HandleFunc("/api/followResponse", handlers.HandleCORS(handlers.TokenMiddleware(handlers.FollowResponse)))

	http.HandleFunc("/api/posts", handlers.HandleCORS(handlers.TokenMiddleware(handlers.PostsHandler)))
	http.Handle("/api/posts/", handlers.HandleCORSHandler(handlers.TokenMiddlewareHandler(handlers.PostRouter())))
	http.HandleFunc("/api/upload/avatar", handlers.HandleCORS(handlers.TokenMiddleware(handlers.UploadAvatar)))
	http.HandleFunc("/api/upload/post-image", handlers.HandleCORS(handlers.TokenMiddleware(handlers.UploadPostImage)))

	http.HandleFunc("/ws", handlers.HandleWebSocket)

	http.HandleFunc("/api/groups", handlers.HandleCORS(handlers.TokenMiddleware(handlers.GroupsHandler)))
	http.HandleFunc("/api/groups/invite", handlers.HandleCORS(handlers.TokenMiddleware(handlers.GroupInviteHandler)))
	http.HandleFunc("/api/groups/invitation/response", handlers.HandleCORS(handlers.TokenMiddleware(handlers.GroupInvitationResponseHandler)))
	http.HandleFunc("/api/groups/request", handlers.HandleCORS(handlers.TokenMiddleware(handlers.GroupRequestHandler)))
	http.HandleFunc("/api/groups/events", handlers.HandleCORS(handlers.TokenMiddleware(handlers.GroupEventsHandler)))
	http.HandleFunc("/api/groups/events/response", handlers.HandleCORS(handlers.TokenMiddleware(handlers.EventResponseHandler)))

	http.HandleFunc("/api/groups/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/requests") {
			handlers.HandleCORS(handlers.TokenMiddleware(handlers.GroupRequestsHandler))(w, r)
		} else {
			handlers.HandleCORS(handlers.TokenMiddleware(handlers.GroupDetailHandler))(w, r)
		}
	})

	http.HandleFunc("/api/notifications", handlers.HandleCORS(handlers.TokenMiddleware(handlers.NotificationsHandler)))
	http.Handle("/api/notifications/read", handlers.HandleCORS(handlers.TokenMiddleware(handlers.MarkNotificationAsReadHandler)))

	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	http.HandleFunc("/", handlers.HomeHandler)

	http.ListenAndServe(":8080", nil)
}
