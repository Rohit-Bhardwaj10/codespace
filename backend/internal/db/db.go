package db

import (
	"log"

	"github.com/codespace-app/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect opens a GORM connection to Postgres.
func Connect(dsn string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected")
	return db
}

// AutoMigrate runs GORM auto-migration for all models.
// For production, prefer versioned SQL migrations instead.
func AutoMigrate(db *gorm.DB) {
	if err := db.AutoMigrate(
		&models.Room{},
		&models.Role{},
		&models.User{},
	); err != nil {
		log.Fatalf("Auto-migration failed: %v", err)
	}

	log.Println("Database migrated")
}
