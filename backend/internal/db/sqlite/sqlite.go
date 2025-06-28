package sqlite

import (
	"database/sql"
	"fmt"
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
		Dir: "internal/db/migrations/sqlite",
	}

	n, err := migrate.Exec(db, "sqlite3", migrations, migrate.Up)
	if err != nil {
		log.Fatal("failed to execute sqlfile ", err)
	}
	fmt.Println(n)
	return db
}
