package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"social-network/pkg/models"
	"social-network/pkg/tools"
)

// handle avatar image uploads
func UploadAvatar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	file, header, err := r.FormFile("avatar")
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Missing avatar file"))
		return
	}
	defer file.Close()
	filename := header.Filename
	ext := strings.ToLower(filepath.Ext(filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Invalid file type"))
		return
	}
	outPath := filepath.Join("uploads/avatars", filename)
	os.MkdirAll(filepath.Dir(outPath), 0o755)
	out, err := os.Create(outPath)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer out.Close()
	io.Copy(out, file)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Avatar uploaded successfully"))
}

// UpdateUserAvatar updates the current user's avatar
func UpdateUserAvatar(w http.ResponseWriter, r *http.Request) {
	fmt.Println("UpdateUserAvatar called with method:", r.Method)
	fmt.Println("Request URL:", r.URL.Path)

	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method not allowed"})
		return
	}

	// Get user ID from context
	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	// Parse multipart form
	err := r.ParseMultipartForm(10 << 20) // 10MB max
	if err != nil {
		fmt.Println("Error parsing multipart form:", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to parse form"})
		return
	}

	file, header, err := r.FormFile("avatar")
	if err != nil {
		fmt.Println("Error getting avatar file:", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Missing avatar file"})
		return
	}
	defer file.Close()

	// Validate file size (1MB max)
	if header.Size > 1024*1024 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "File too large. Max size is 1MB"})
		return
	}

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid file type. Allowed: JPEG, PNG, JPG, GIF"})
		return
	}

	// Generate unique filename
	rand, err := tools.GenerateJWTToken(userID, "avatar")
	if err != nil {
		fmt.Println("Error generating token:", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate filename"})
		return
	}
	filename := rand + ext
	filePath := "./uploads/avatars/" + filename

	// Create directory if it doesn't exist
	os.MkdirAll(filepath.Dir(filePath), 0o755)

	// Save file
	out, err := os.Create(filePath)
	if err != nil {
		fmt.Println("Error creating file:", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save avatar"})
		return
	}
	defer out.Close()
	io.Copy(out, file)

	// Update database with just the filename, not the full path
	err = models.Db.UpdateAvatar(userID, filename)
	if err != nil {
		// Remove file if database update fails
		os.Remove(filePath)
		fmt.Println("Error updating avatar in database:", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update avatar in database"})
		return
	}

	fmt.Println("Avatar updated successfully for user:", userID, "filename:", filename)

	// Return the filename for the frontend
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Avatar updated successfully",
		"avatar":  filename,
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
