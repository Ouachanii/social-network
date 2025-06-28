package models

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID          int
	Nickname    string
	Firstname   string
	Lastname    string
	Email       string
	Password    string
	DateOfBirth string
	Gender      string
	AboutMe     string
	Avatar      *string
	IsPublic    bool
}

// Insert a new user into the database
func (db *DB) Insert(u User) (int, error) {
	hashedPass, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return 0, errors.New("failed to hash password")
	}

	var id int
	err = db.Db.QueryRow(`
		INSERT INTO users 
		(nickname, date_of_birth, about_me, first_name, last_name, email, gender, password_hash, avatar) 
		VALUES (?,?,?,?,?,?,?,?,?) RETURNING id`,
		u.Nickname, u.DateOfBirth, u.AboutMe, u.Firstname, u.Lastname, u.Email, u.Gender, hashedPass, u.Avatar,
	).Scan(&id)

	if err != nil {
		return 0, err
	}
	return id, nil
}

func (db *DB) GetUserByLogin(email string) (*User, error) {
	user := &User{}
	err := db.Db.QueryRow(`SELECT id, password_hash,nickname FROM users WHERE email = ? OR nickName = ?`, email, email).
		Scan(&user.ID, &user.Password, &user.Nickname)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		fmt.Println(err)
		return nil, errors.New("internal server error")
	}

	return user, nil
}

func (db *DB) CheckIsExistEmailInDB(email string) (int, error) {
	var exists int
	err := db.Db.QueryRow("SELECT 1 FROM users WHERE email = ? LIMIT 1", email).Scan(&exists)
	if err == sql.ErrNoRows {
		return 0, nil
	} else if err != nil {
		fmt.Println(err)
		return http.StatusInternalServerError, errors.New(http.StatusText(http.StatusInternalServerError))
	}
	return http.StatusBadRequest, errors.New("this email already exist")
}

func (db *DB) CheckIsExistNickNameInDB(nickName string) (int, error) {
	var exists int
	err := db.Db.QueryRow("SELECT 1 FROM users WHERE nickName = ? LIMIT 1", nickName).Scan(&exists)
	if err == sql.ErrNoRows {
		return 0, nil
	} else if err != nil {
		return http.StatusInternalServerError, errors.New(http.StatusText(http.StatusInternalServerError))
	}
	return http.StatusBadRequest, errors.New("this nick-name already exist")
}

func (u *User) ComparePassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

func (db *DB) GetUserInfo(userID int) (User, error) {
	var user User
	err := db.Db.QueryRow("select id,email,nickname,first_name,last_name,date_of_birth,avatar,about_me,is_public from users where id = ?", userID).
		Scan(&user.ID, &user.Email, &user.Nickname, &user.Firstname, &user.Lastname, &user.DateOfBirth, &user.Avatar, &user.AboutMe, &user.IsPublic)
	if err != nil {
		return User{}, err
	}
	return user, nil
}

// CheckIfPublic checks if a user has a public profile
func (db *DB) CheckIfPublicProfil(userID int) (bool, error) {
	var isPublic bool
	err := db.Db.QueryRow("SELECT is_public FROM users WHERE id = ?", userID).Scan(&isPublic)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, errors.New("this user id not exist")
		}
		return false, err
	}
	return isPublic, nil
}

// ToggleUserPrivacy updates the user's privacy setting
func (db *DB) ToggleUserPrivacy(userID int, isPublic bool) error {
	_, err := db.Db.Exec("UPDATE users SET is_public = ? WHERE id = ?", isPublic, userID)
	return err
}

func (db *DB) UpdatePrivacy(userID int) error {
	// Get the current value
	var current bool
	err := db.Db.QueryRow("SELECT is_public FROM users WHERE id = ?", userID).Scan(&current)
	if err != nil {
		fmt.Println(err)
		return fmt.Errorf("failed to fetch current value: %w", err)
	}

	// Update the column with the new value
	_, err = db.Db.Exec("UPDATE users SET is_public = ? WHERE id = ?", !current, userID)
	if err != nil {
		fmt.Println(err)
		return fmt.Errorf("failed to update value: %w", err)
	}

	return nil
}