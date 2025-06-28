package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"social-network/internal/models"
	"strconv"
	"strings"
)

// CreatePostHandler handles creating a new post
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
		w.Write([]byte(err.Error()))
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

// GetPostsHandler handles fetching posts for a user
func GetPostsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	offsetStr := r.URL.Query().Get("offset")
	offset, _ := strconv.Atoi(offsetStr)
	posts, err := models.Db.GetPostsWithPrivacy(userID, "WHERE group_id = 0", []interface{}{}, offset)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}
