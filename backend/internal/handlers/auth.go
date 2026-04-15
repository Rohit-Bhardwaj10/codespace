package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct{}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

// RedirectToGitHub (Placeholder for Phase 3)
func (h *AuthHandler) RedirectToGitHub(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Phase 3: GitHub OAuth coming soon"})
}

// GitHubCallback (Placeholder for Phase 3)
func (h *AuthHandler) GitHubCallback(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Phase 3: GitHub OAuth coming soon"})
}

// Logout (Placeholder for Phase 3)
func (h *AuthHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logged out (mock)"})
}
