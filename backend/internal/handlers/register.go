package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"social-network/internal/models"
	"social-network/internal/tools"
	"strings"
)

type RegisterResponseApi struct {
	Message string `json:"message"`
}

func Register(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != "POST" {
		tools.ErrorJSONResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		tools.ErrorJSONResponse(w, http.StatusBadRequest, "Failed to decode the request body")
		return
	}

	user := models.User{
		Firstname:   r.FormValue("firstName"),
		Lastname:    r.FormValue("lastName"),
		Email:       r.FormValue("email"),
		Password:    r.FormValue("password"),
		DateOfBirth: r.FormValue("birthDate"),
		Gender:      strings.ToLower(r.FormValue("gender")),
		AboutMe:     r.FormValue("aboutMe"),
		Nickname:    r.FormValue("nickName"),
	}

	fmt.Println("formData :", user)

	statusCode, err := tools.ValidateRegisterForum(user.Firstname, user.Lastname, user.Email, user.Password, user.DateOfBirth, user.Nickname, user.Gender)
	if err != nil {
		tools.ErrorJSONResponse(w, statusCode, err.Error())
		return
	}

	var Path string

	// Handle avatar upload
	file, header, err := r.FormFile("avatar")
	if err == nil {
		defer file.Close()
		extension := path.Ext(header.Filename)

		if header.Size > 1024*1024 {
			tools.ErrorJSONResponse(w, http.StatusBadRequest, "File too large. Max size is 1MB")
			return
		}

		if !tools.IsValidAvatarExtension(extension) {
			tools.ErrorJSONResponse(w, http.StatusBadRequest, "Invalid avatar type. Allowed: JPEG, PNG")
			return

		}

		rand, _ := tools.CenerateJWTToken(user.ID, user.Nickname)
		name := rand + extension
		Path := "uploads/avatars/" + name
		out, err := os.Create(Path)
		if err != nil {
			fmt.Println(err)
			tools.ErrorJSONResponse(w, http.StatusInternalServerError, "Failed to save avatar")
			return
		}
		defer out.Close()
		io.Copy(out, file)
		user.Avatar = &Path
	}

	// Insert user using models
	userID, err := models.Db.Insert(user)
	if err != nil {
		err1 := os.RemoveAll(Path)
		if err1 != nil {
			fmt.Println("error remove avatar", err1)
		}

		if err.Error() == "UNIQUE constraint failed: users.email" {
			tools.ErrorJSONResponse(w, http.StatusBadRequest, "email already used!")
			return
		}
		if err.Error() == "UIQUE constraint failed: users.first_name, users.last_name" {
			tools.ErrorJSONResponse(w, http.StatusBadRequest, "user already used!")
			return
		}
		fmt.Println(err)
		tools.ErrorJSONResponse(w, http.StatusInternalServerError, "Failed to insert the user")
		return
	}

	var apiResponse = RegisterResponseApi{
		Message: fmt.Sprintf("Success, User ID: %d", userID),
	}

	tools.JSONResponse(w, http.StatusOK, apiResponse)
}
