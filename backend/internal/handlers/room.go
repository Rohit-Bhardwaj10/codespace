package handlers

import (
	"errors"
	"net/http"

	"github.com/codespace-app/backend/internal/models"
	"github.com/codespace-app/backend/internal/repository"
	"github.com/codespace-app/backend/pkg/slug"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RoomHandler struct {
	roomRepo *repository.RoomRepository
	roleRepo *repository.RoleRepository
}

func NewRoomHandler(roomRepo *repository.RoomRepository, roleRepo *repository.RoleRepository) *RoomHandler {
	return &RoomHandler{roomRepo: roomRepo, roleRepo: roleRepo}
}

// POST /room/new — creates a new room and returns the slug.
func (h *RoomHandler) CreateRoom(c *gin.Context) {
	// Generate a unique slug (retry on collision — extremely rare)
	var roomSlug string
	for {
		s, err := slug.Generate()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate slug"})
			return
		}
		exists, err := h.roomRepo.SlugExists(s)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}
		if !exists {
			roomSlug = s
			break
		}
	}

	room := &models.Room{Slug: roomSlug}
	if err := h.roomRepo.Create(room); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create room"})
		return
	}

	// Create a host role for this session (anonymous for MVP)
	role := &models.Role{
		RoomID:   room.ID,
		RoleType: models.RoleHost,
	}
	_ = h.roleRepo.Create(role) // non-fatal if this fails

	c.JSON(http.StatusCreated, gin.H{
		"slug": room.Slug,
		"url":  "/room/" + room.Slug,
	})
}

// GET /room/:slug — validates the slug exists.
func (h *RoomHandler) GetRoom(c *gin.Context) {
	s := c.Param("slug")
	room, err := h.roomRepo.FindBySlug(s)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"slug":       room.Slug,
		"created_at": room.CreatedAt,
	})
}
