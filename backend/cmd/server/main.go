package main

import (
	"log"

	"github.com/codespace-app/backend/internal/config"
	"github.com/codespace-app/backend/internal/db"
	"github.com/codespace-app/backend/internal/router"
	"github.com/codespace-app/backend/internal/ws"
)

func main() {
	// Load config from .env
	cfg := config.Load()

	// Connect to Postgres
	database := db.Connect(cfg.DatabaseURL)

	// Auto-migrate models
	db.AutoMigrate(database)

	// Create WebSocket hub and run it
	hub := ws.NewHub()
	go hub.Run()

	// Boot Gin router
	r := router.Setup(cfg, database, hub)

	log.Printf("Server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
