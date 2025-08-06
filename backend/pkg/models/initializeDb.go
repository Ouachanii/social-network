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

func (db *DB) RunMigrations() error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS group_messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			group_id INTEGER NOT NULL,
			sender_id INTEGER NOT NULL,
			sender TEXT NOT NULL,
			text TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (group_id) REFERENCES groups(id),
			FOREIGN KEY (sender_id) REFERENCES users(id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);`,
		`CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);`,
	}

	for _, migration := range migrations {
		_, err := db.Db.Exec(migration)
		if err != nil {
			return err
		}
	}
	return nil
}
