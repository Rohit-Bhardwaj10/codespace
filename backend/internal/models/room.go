package models

import "gorm.io/gorm"

// RoleType represents a participant's permission level in a room.
type RoleType string

const (
	RoleHost     RoleType = "host"
	RoleGuest    RoleType = "guest"
	RoleObserver RoleType = "observer"
)

// Room represents a collaborative coding session.
type Room struct {
	gorm.Model
	Slug  string `gorm:"uniqueIndex;not null;size:64" json:"slug"`
	Roles []Role `gorm:"foreignKey:RoomID"           json:"-"`
}
