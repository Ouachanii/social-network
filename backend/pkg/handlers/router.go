package handlers

import (
	"net/http"
	"regexp"
	"strings"
)

// Route represents a route with pattern and handler
type Route struct {
	Pattern *regexp.Regexp
	Handler http.HandlerFunc
}

// handle routing with path parameters
type Router struct {
	routes []Route
}

// NewRouter creates a new router
func NewRouter() *Router {
	return &Router{}
}

// AddRoute adds a route with pattern and handler
func (r *Router) AddRoute(pattern string, handler http.HandlerFunc) {
	// Convert pattern like "/api/posts/{postID}/interact" to regex
	regexPattern := strings.ReplaceAll(pattern, "{postID}", "([0-9]+)")
	regex := regexp.MustCompile("^" + regexPattern + "$")
	r.routes = append(r.routes, Route{Pattern: regex, Handler: handler})
}

// ServeHTTP implements http.Handler
func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	for _, route := range r.routes {
		if route.Pattern.MatchString(req.URL.Path) {
			route.Handler(w, req)
			return
		}
	}
	http.NotFound(w, req)
}

// PostRouter handles post-related routes
func PostRouter() http.Handler {
	router := NewRouter()

	// Add routes for post interactions
	router.AddRoute("/api/posts/{postID}/interact", PostInteractionHandler)
	router.AddRoute("/api/posts/{postID}/comments", CommentsHandler)

	return router
}

func NotRouter() http.Handler {
	router := NewRouter()

	// Add routes for notifications
	router.AddRoute("/api/notifications", NotificationsHandler)
	router.AddRoute("/api/notifications/{notificationId}/read", MarkNotificationAsReadHandler)

	return router
}