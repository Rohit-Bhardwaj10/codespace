package router

import (
	"github.com/codespace-app/backend/internal/config"
	"github.com/codespace-app/backend/internal/handlers"
	"github.com/codespace-app/backend/internal/middleware"
	"github.com/codespace-app/backend/internal/repository"
	"github.com/codespace-app/backend/internal/ws"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Setup wires all routes and returns a configured Gin engine.
func Setup(cfg *config.Config, db *gorm.DB, hub *ws.Hub) *gin.Engine {
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Global middleware
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS(cfg.AllowedOrigins))

	// Repositories
	roomRepo := repository.NewRoomRepository(db)
	roleRepo := repository.NewRoleRepository(db)

	// Handlers
	roomHandler := handlers.NewRoomHandler(roomRepo, roleRepo)
	authHandler := handlers.NewAuthHandler()
	executeHandler := handlers.NewExecuteHandler()

	wsHandler := handlers.NewWSHandler(hub)

	// ── Health ──────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// ── Rooms ────────────────────────────────────────────────
	// POST /room/new      → create room, return slug
	// GET  /room/:slug    → validate room exists
	room := r.Group("/room")
	{
		room.POST("/new", roomHandler.CreateRoom)
		room.GET("/:slug", roomHandler.GetRoom)
	}

	// ── WebSocket (Yjs relay + signaling) ────────────────────
	// GET /ws/:slug → upgrade to WebSocket, join room hub
	r.GET("/ws/:slug", wsHandler.ServeWS)

	// ── Code Execution ───────────────────────────────────────
	// POST /execute → proxy to Judge0
	r.POST("/execute", executeHandler.Execute)

	// ── Phase 3 (GitHub OAuth placeholders) ───────────
	auth := r.Group("/auth")
	{
		auth.GET("/github", authHandler.RedirectToGitHub)
		auth.GET("/github/callback", authHandler.GitHubCallback)
		auth.POST("/logout", authHandler.Logout)
	}

	return r
}
