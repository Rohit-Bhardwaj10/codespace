package repository

import (
	"github.com/codespace-app/backend/internal/models"
	"gorm.io/gorm"
)

type RoomRepository struct {
	db *gorm.DB
}

func NewRoomRepository(db *gorm.DB) *RoomRepository {
	return &RoomRepository{db: db}
}

// Create persists a new room.
func (r *RoomRepository) Create(room *models.Room) error {
	return r.db.Create(room).Error
}

// FindBySlug returns a room by its slug, or gorm.ErrRecordNotFound.
func (r *RoomRepository) FindBySlug(slug string) (*models.Room, error) {
	var room models.Room
	if err := r.db.Where("slug = ?", slug).First(&room).Error; err != nil {
		return nil, err
	}
	return &room, nil
}

// SlugExists checks if a slug is already taken.
func (r *RoomRepository) SlugExists(slug string) (bool, error) {
	var count int64
	if err := r.db.Model(&models.Room{}).Where("slug = ?", slug).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
