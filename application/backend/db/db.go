package db

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

// Global DB variable
var Connection *sql.DB

// initDB creates a new instance of DB
func InitDB() {
	var err error
	Connection, err = sql.Open("postgres", os.Getenv(("POSTGRES_URL")))
	if err != nil {
		fmt.Println(err)
	}
}
