package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"social-network/pkg/models"
)

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	content := r.FormValue("content")
	privacy := r.FormValue("privacy")
	groupIDStr := r.FormValue("group_id")
	groupID, _ := strconv.Atoi(groupIDStr)

	var imagePath *string
	file, header, err := r.FormFile("image")
	if err == nil && file != nil {
		defer file.Close()
		filename := filepath.Base(header.Filename)
		imageDir := "uploads/posts/"
		os.MkdirAll(imageDir, os.ModePerm)
		imageFilePath := filepath.Join(imageDir, filename)
		out, err := os.Create(imageFilePath)
		if err == nil {
			io.Copy(out, file)
			out.Close()
			imagePath = &imageFilePath
		}
	}

	postID, err := models.Db.CreatePost(userID, content, privacy, imagePath, groupID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create post: " + err.Error()})
		return
	}

	selectedUsersStr := r.FormValue("selected_users")
	if privacy == "private" && selectedUsersStr != "" {
		selectedUsers := []int{}
		for _, idStr := range strings.Split(selectedUsersStr, ",") {
			id, _ := strconv.Atoi(idStr)
			if id > 0 {
				selectedUsers = append(selectedUsers, id)
			}
		}
		models.Db.AddPostPrivacy(postID, selectedUsers)
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"post_id": postID})
}

func GetPostsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// check if this is a group posts request
	groupIDStr := r.URL.Query().Get("group_id")
	if groupIDStr != "" {
		groupID, err := strconv.Atoi(groupIDStr)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		offsetStr := r.URL.Query().Get("offset")
		offset, _ := strconv.Atoi(offsetStr)

		posts, err := models.Db.GetGroupPosts(groupID, userID, offset)
		if err != nil {
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"posts": posts,
		})
		return
	}

	// regular posts request
	offsetStr := r.URL.Query().Get("offset")
	offset, _ := strconv.Atoi(offsetStr)
	posts, err := models.Db.GetPostsWithPrivacy(userID, "WHERE group_id = 0", []interface{}{}, offset)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch posts: " + err.Error()})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"posts": posts,
	})
}

// handle like/dislike interactions
func PostInteractionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// extract post ID from URL path - handle both /api/posts/{postID}/interact and /api/posts/{postID}/comments
	pathParts := strings.Split(r.URL.Path, "/")
	var postID int
	var err error

	// Find the post ID in the path
	for i, part := range pathParts {
		if part == "posts" && i+1 < len(pathParts) {
			postID, err = strconv.Atoi(pathParts[i+1])
			break
		}
	}

	if err != nil || postID == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Parse request body
	var request struct {
		Interaction int `json:"interaction"` // 1 for like, -1 for dislike, 0 for remove
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Validate interaction value
	if request.Interaction != 1 && request.Interaction != -1 && request.Interaction != 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Update the interaction
	err = models.Db.InsertOrUpdateLike(userID, postID, request.Interaction)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Get updated post data
	post, err := models.Db.GetPost(postID, userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Interaction updated successfully",
		"post":    post,
	})
}

// handle creating a new comment
func CreateCommentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("userID").(int)

	// Extract post ID from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	var postID int
	var err error

	// Find the post ID in the path
	for i, part := range pathParts {
		if part == "posts" && i+1 < len(pathParts) {
			postID, err = strconv.Atoi(pathParts[i+1])
			break
		}
	}

	if err != nil || postID == 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid post ID"})
		return
	}

	// Parse multipart form
	err = r.ParseMultipartForm(5 << 20) // 5 MB max for comments
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to parse form data"})
		return
	}

	content := r.FormValue("content")
	var imagePath *string

	file, header, err := r.FormFile("image")
	if err == nil && file != nil {
		defer file.Close()

		// Validate file type
		contentType := header.Header.Get("Content-Type")
		allowedTypes := []string{"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}
		isAllowed := false
		for _, allowedType := range allowedTypes {
			if contentType == allowedType {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."})
			return
		}

		// Check file size (limit to 5MB for comments)
		if header.Size > 5*1024*1024 {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "File size too large. Maximum size is 5MB."})
			return
		}

		filename := filepath.Base(header.Filename)
		imageDir := "uploads/comments/"
		os.MkdirAll(imageDir, os.ModePerm)
		imageFilePath := filepath.Join(imageDir, filename)
		out, err := os.Create(imageFilePath)
		if err == nil {
			io.Copy(out, file)
			out.Close()
			imagePath = &imageFilePath
		}
	}

	// Allow comments with only image (no text content required)
	if content == "" && imagePath == nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Comment must have either content or an image"})
		return
	}

	commentID, err := models.Db.InsertComment(postID, userID, content, imagePath)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create comment"})
		return
	}

	// Get the created comment
	comment, err := models.Db.GetComment(commentID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve created comment"})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"comment": comment,
	})
}

// handle fetching comments for a post
func GetCommentsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// Extract post ID from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	var postID int
	var err error

	// Find the post ID in the path
	for i, part := range pathParts {
		if part == "posts" && i+1 < len(pathParts) {
			postID, err = strconv.Atoi(pathParts[i+1])
			break
		}
	}

	if err != nil || postID == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	offsetStr := r.URL.Query().Get("offset")
	offset, _ := strconv.Atoi(offsetStr)

	comments, err := models.Db.GetCommentsByPost(postID, offset)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch comments: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"comments": comments,
	})
}

// handle both GET and POST requests for comments
func CommentsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetCommentsHandler(w, r)
	case http.MethodPost:
		CreateCommentHandler(w, r)
	case http.MethodOptions:
		w.WriteHeader(http.StatusOK)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// PostsHandler handles both GET and POST requests for posts
func PostsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetPostsHandler(w, r)
	case http.MethodPost:
		CreatePostHandler(w, r)
	case http.MethodOptions:
		w.WriteHeader(http.StatusOK)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
