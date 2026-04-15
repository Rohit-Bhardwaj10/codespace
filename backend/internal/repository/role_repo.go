package repository

import (
	"github.com/codespace-app/backend/internal/models"
	"gorm.io/gorm"
)

type RoleRepository struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

// Create persists a new role entry.
func (r *RoleRepository) Create(role *models.Role) error {
	return r.db.Create(role).Error
}

// FindByRoom returns all roles for a given room.
func (r *RoleRepository) FindByRoom(roomID uint) ([]models.Role, error) {
	var roles []models.Role
	if err := r.db.Where("room_id = ?", roomID).Find(&roles).Error; err != nil {
		return nil, err
	}
	return roles, nil
}
