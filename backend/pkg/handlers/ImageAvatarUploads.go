package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"social-network/pkg/models"
	"strings"

	"github.com/gofrs/uuid"
)

// handle avatar image uploads
func UploadAvatar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	file, header, err := r.FormFile("avatar")
	if err != nil {
		http.Error(w, "Missing avatar file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file size (e.g., 5MB limit)
	if header.Size > 5*1024*1024 {
		http.Error(w, "File size exceeds 5MB limit", http.StatusBadRequest)
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		http.Error(w, "Invalid file type. Only JPG, PNG, and GIF are allowed.", http.StatusBadRequest)
		return
	}

	// Generate a unique filename
	newUUID, err := uuid.NewV4()
	if err != nil {
		http.Error(w, "Failed to generate unique filename", http.StatusInternalServerError)
		return
	}
	uniqueFilename := fmt.Sprintf("%s%s", newUUID, ext)
	outPath := filepath.Join("uploads/avatars", uniqueFilename)

	// Create the file
	outFile, err := os.Create(outPath)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer outFile.Close()

	// Copy the uploaded file's content to the new file
	_, err = io.Copy(outFile, file)
	if err != nil {
		http.Error(w, "Failed to write file content", http.StatusInternalServerError)
		return
	}

	// Update the user's avatar path in the database
	err = models.Db.UpdateAvatar(userID, outPath)
	if err != nil {
		// Attempt to remove the newly created file if the DB update fails
		os.Remove(outPath)
		http.Error(w, "Failed to update user profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "Avatar uploaded successfully",
		"filePath": outPath,
	})
}

// handle post image uploads
func UploadPostImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	file, header, err := r.FormFile("image")
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Missing image file"))
		return
	}
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
		w.Write([]byte("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."))
		return
	}

	// Check file size (limit to 10MB for posts)
	if header.Size > 10*1024*1024 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("File size too large. Maximum size is 10MB."))
		return
	}

	filename := header.Filename
	ext := strings.ToLower(filepath.Ext(filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" && ext != ".webp" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Invalid file extension"))
		return
	}
	outPath := filepath.Join("uploads/posts", filename)
	os.MkdirAll(filepath.Dir(outPath), 0o755)
	out, err := os.Create(outPath)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer out.Close()
	io.Copy(out, file)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Post image uploaded successfully"))
}
