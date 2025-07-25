package handlers

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// UploadAvatar handles avatar image uploads
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
	outPath := filepath.Join("../../uploads/avatars", filename)
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

// UploadPostImage handles post image uploads
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
	filename := header.Filename
	ext := strings.ToLower(filepath.Ext(filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Invalid file type"))
		return
	}
	outPath := filepath.Join("../../uploads/posts", filename)
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
