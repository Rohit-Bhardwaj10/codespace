package models

import "gorm.io/gorm"

// Role links a user (or anonymous session) to a room with a permission level.
type Role struct {
	gorm.Model
	RoomID   uint     `gorm:"not null;index" json:"room_id"`
	UserID   *uint    `gorm:"index"          json:"user_id,omitempty"` // nil for anonymous
	RoleType RoleType `gorm:"size:16;not null;default:'guest'" json:"role_type"`
}
