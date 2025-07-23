package models

import "database/sql"

type DB struct {
	Db *sql.DB
}

var Db *DB

func InitializeDb(db *sql.DB) *DB {
	return &DB{
		Db: db,
	}
}
