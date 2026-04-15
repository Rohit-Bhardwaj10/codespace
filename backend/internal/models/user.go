package models

import "gorm.io/gorm"

// User represents an authenticated user (Phase 3 — GitHub OAuth).
// For MVP, rooms are anonymous; this model is a placeholder.
type User struct {
	gorm.Model
	GithubID  string `gorm:"uniqueIndex;size:64" json:"github_id"`
	Username  string `gorm:"size:128;not null"  json:"username"`
	AvatarURL string `gorm:"size:512"           json:"avatar_url"`
	Roles     []Role `gorm:"foreignKey:UserID"  json:"-"`
}
