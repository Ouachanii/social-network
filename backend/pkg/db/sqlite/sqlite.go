package sqlite

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
	migrate "github.com/rubenv/sql-migrate"
)

func CreateAllTables() *sql.DB {
	db, err := sql.Open("sqlite3", "database.db")
	if err != nil {
		log.Fatal("failed to register driver", err)
	}

	migrations := &migrate.FileMigrationSource{
		Dir: "pkg/db/migrations/sqlite",
	}

	_, err = migrate.Exec(db, "sqlite3", migrations, migrate.Up)
	if err != nil {
		log.Fatal("failed to execute sqlfile ", err)
	}
	return db
}
