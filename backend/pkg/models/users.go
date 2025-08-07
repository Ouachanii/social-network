package models

import (
	"fmt"
)

// GetAllUsers retrieves all users from the database for listing
func (db *DB) GetAllUsers() ([]User, error) {
	rows, err := db.Db.Query(`
		SELECT id, nickname, first_name, last_name, avatar 
		FROM users`)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		err := rows.Scan(&u.ID, &u.Nickname, &u.Firstname, &u.Lastname, &u.Avatar)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}
