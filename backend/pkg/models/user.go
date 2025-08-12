package models

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID          int            `json:"id"`
	Nickname    sql.NullString `json:"nickname"`
	Firstname   string         `json:"firstname"`
	Lastname    string         `json:"lastname"`
	Email       string         `json:"email"`
	Password    string         `json:"password"`
	DateOfBirth string         `json:"date_of_birth"`
	Gender      string         `json:"gender"`
	AboutMe     string         `json:"about_me"`
	Avatar      *string        `json:"avatar"`
	IsPublic    bool           `json:"is_public"`
}

// Insert a new user into the database
func (db *DB) Insert(u User) (int, error) {
	hashedPass, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return 0, errors.New("failed to hash password")
	}
	var id int
	var nickname interface{}
	if u.Nickname.String == "" {
		nickname = nil // for skip "UNIQUE constraint failed: users.nickname" error
	} else {
		nickname = u.Nickname
	}
	err = db.Db.QueryRow(`
		INSERT INTO users 
		(nickname, date_of_birth, about_me, first_name, last_name, email, gender, password_hash, avatar) 
		VALUES (?,?,?,?,?,?,?,?,?) RETURNING id`,
		nickname, u.DateOfBirth, u.AboutMe, u.Firstname, u.Lastname, u.Email, u.Gender, hashedPass, u.Avatar,
	).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (db *DB) GetUserByLogin(email string) (*User, error) {
	user := &User{}
	err := db.Db.QueryRow(`SELECT id, email, password_hash, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_public FROM users WHERE email = ? OR nickName = ?`, email, email).
		Scan(&user.ID, &user.Email, &user.Password, &user.Firstname, &user.Lastname, &user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.IsPublic)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		fmt.Println(err)
		return nil, errors.New("internal server error")
	}
	// Convert NULL nickname to empty string
	if !user.Nickname.Valid {
		user.Nickname.String = ""
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
	if nickName == "" {
		return 0, nil
	}
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

func (db *DB) GetUserByID(id int) (*User, error) {
	var user User
	err := Db.Db.QueryRow("SELECT id, email, password_hash, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_public FROM users WHERE id = ?", id).Scan(&user.ID, &user.Email, &user.Password, &user.Firstname, &user.Lastname, &user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.IsPublic)
	if err != nil {
		return nil, err
	}
	return &user, nil
}



// UpdateAvatar updates the user's avatar path in the database
func (db *DB) UpdateAvatar(userID int, avatarPath string) error {
	_, err := db.Db.Exec("UPDATE users SET avatar = ? WHERE id = ?", avatarPath, userID)
	return err
}

// UpdateAboutMe updates the user's about_me text in the database
func (db *DB) UpdateAboutMe(userID int, aboutMeText string) error {
	_, err := db.Db.Exec("UPDATE users SET about_me = ? WHERE id = ?", aboutMeText, userID)
	return err
}