package tools

import (
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"social-network/pkg/models"

	"strings"
	"time"
)

func ValidateRegisterForum(firstName, lastName, email, password, date, nickName, gender string) (int, error) {
	if firstName == "" || lastName == "" || email == "" || password == "" || date == ""{
		return http.StatusBadRequest, errors.New("please fill all required fileds")
	}
	if !IsValidName(firstName) || !IsValidName(lastName) {
		fmt.Println("firstName: ", firstName)
		fmt.Println("lastName: ", lastName)
		return http.StatusBadRequest, errors.New("firstname and Lastname must contain only letters and be at most 10 characters long")
	}

	statusCode, err := CheckIsValidEmail(email)
	fmt.Println("email: ", email)
	if err != nil {
		return statusCode, err
	}

	if !IsValidPassword(password) {
		fmt.Println("password :", password)
		return http.StatusBadRequest, errors.New("password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, and one number")
	}

	if !IsValidDateOfBirth(date) {
		fmt.Println("date :", date)
		return http.StatusBadRequest, errors.New("you must be at least 5 years old")
	}

	if !IsvalidGender(gender) {
		fmt.Println("gender :", gender)
		return http.StatusBadRequest, errors.New("invalid gender")
	}

	statusCode, err = CheckIsValidNickName(nickName)
	if err != nil {
		return statusCode, err
	}

	return 0, nil
}

// Validate password (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)
func IsValidPassword(password string) bool {
	if len(password) < 8 {
		return false
	}
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasDigit := regexp.MustCompile(`\d`).MatchString(password)
	return hasUpper && hasLower && hasDigit
}

// Validate email format
func CheckIsValidEmail(email string) (int, error) {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return http.StatusBadRequest, errors.New("invalid email format")
	}
	statusCode, err := models.Db.CheckIsExistEmailInDB(email)
	if err != nil {
		return statusCode, err
	}

	return 0, nil
}

// Validate date of birth (minimum age 5)
func IsValidDateOfBirth(dateStr string) bool {
	dob, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return false
	}

	age := time.Now().Year() - dob.Year()
	if time.Now().Month() < dob.Month() || (time.Now().Month() == dob.Month() && time.Now().Day() < dob.Day()) {
		age--
	}

	return age >= 5
}

func CheckIsValidNickName(nickName string) (int, error) {
	isValid, _ := regexp.MatchString(`^[a-zA-Z][a-zA-Z0-9_]{2,19}$`, nickName) 
	if !isValid && strings.TrimSpace(nickName) != "" {
		return http.StatusBadRequest, errors.New("your nickName must: Be 3 to 20 characters long, Start with a letter, Contain only letters, numbers, underscores (_),Not end with an underscore")
	}

	statusCode, err := models.Db.CheckIsExistNickNameInDB(nickName)
	if err != nil {
		return statusCode, err
	}

	return 0, nil
}

// Validate first and last name format
func IsValidName(name string) bool {
	nameRegex := regexp.MustCompile(`^[a-zA-Z]{1,10}$`)
	fmt.Println(name, nameRegex.MatchString(name))
	return nameRegex.MatchString(name)
}

func IsvalidGender(gender string) bool {
	if gender != "male" && gender != "female" {
		return false
	}
	return true
}

// Allowed profile avatar formats (JPEG & PNG)
func IsValidAvatarExtension(ext string) bool {
	allowed := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
	}
	return allowed[strings.ToLower(ext)]
}

// ValidatePostImage checks if an uploaded image meets the criteria
func ValidatePostImage(fileExt string, fileSize int64) error {
	if fileSize > 4*1024*1024 {
		return errors.New("file too large, max size is 4MB")
	}
	if !IsValidPostImageExtension(fileExt) {
		return errors.New("invalid image type, supported formats: JPEG, PNG, GIF")
	}
	return nil
}

func CheckLoginInfto(login string, password string) (*models.User, int, error) {
	var user *models.User
	if login == "" || password == "" {
		return user, http.StatusBadRequest, errors.New("please fill all the fields")
	}

	user, err := models.Db.GetUserByLogin(login)
	if err != nil {
		if err.Error() == "user not found" {
			return user, http.StatusBadRequest, err
		}
		return user, http.StatusInternalServerError, err
	}

	if !user.ComparePassword(password) {
		return user, http.StatusBadRequest, errors.New("incorrect password")
	}

	return user, http.StatusOK, nil
}
